/**
 * Jira Cloud Client
 *
 * Wraps MorphixAI Pipedream proxy for Jira Cloud REST API v3.
 * Handles: cloudId resolution, ADF conversion, JQL search.
 *
 * URL pattern: https://api.atlassian.com/ex/jira/{cloudId}/rest/api/3/...
 */
import type { BaibianClient } from "../baibian-client.js";
import { BaseAppClient } from "./base-app-client.js";
import { textToAdf, markdownToAdf, type AdfNode } from "../helpers/adf.js";

export interface JiraSite {
  id: string;
  url: string;
  name: string;
  scopes: string[];
  avatarUrl?: string;
}

export interface JiraIssue {
  id: string;
  key: string;
  fields: {
    summary: string;
    status: { name: string; id: string };
    priority?: { name: string; id: string };
    assignee?: { displayName: string; accountId: string };
    reporter?: { displayName: string; accountId: string };
    issuetype?: { name: string; id: string };
    project?: { key: string; name: string };
    description?: any;
    created?: string;
    updated?: string;
    duedate?: string;
    labels?: string[];
    [key: string]: any;
  };
}

export interface JiraProject {
  id: string;
  key: string;
  name: string;
  projectTypeKey?: string;
  style?: string;
}

export interface JiraTransition {
  id: string;
  name: string;
  to: { name: string; id: string };
}

export interface JiraSearchResult {
  issues: JiraIssue[];
  total?: number;
  maxResults?: number;
  nextPageToken?: string;
}

export class JiraClient extends BaseAppClient {
  private cloudId?: string;
  private sites?: JiraSite[];

  constructor(baibian: BaibianClient, accountId: string) {
    super(baibian, accountId);
  }

  // ─── URL Resolution ───

  protected async resolveUrl(path: string): Promise<string> {
    const cloudId = await this.getCloudId();
    return `https://api.atlassian.com/ex/jira/${cloudId}${path}`;
  }

  /**
   * Get the Atlassian Cloud ID for this account.
   * Fetches accessible resources and caches the first site's ID.
   */
  async getCloudId(): Promise<string> {
    if (this.cloudId) return this.cloudId;

    const sites = await this.getAccessibleSites();
    if (sites.length === 0) {
      throw new Error("No Jira sites accessible with this account");
    }
    this.cloudId = sites[0].id;
    return this.cloudId;
  }

  /**
   * List Atlassian sites accessible with this OAuth token.
   */
  async getAccessibleSites(): Promise<JiraSite[]> {
    if (this.sites) return this.sites;

    // This endpoint is on api.atlassian.com directly (not under /ex/jira/{cloudId})
    const result = await this.baibian.proxy({
      accountId: this.accountId,
      method: "GET",
      url: "https://api.atlassian.com/oauth/token/accessible-resources",
    });

    // MorphixAI envelope: { success, data }
    const data = result?.data ?? result;
    this.sites = Array.isArray(data) ? data : [];
    return this.sites;
  }

  // ─── Issues ───

  /**
   * Search issues using JQL.
   * Uses the new /search/jql endpoint (the old /search is deprecated/410).
   * Note: JQL must include limiting conditions (e.g., project = X).
   */
  async searchIssues(
    jql: string,
    options?: {
      maxResults?: number;
      fields?: string[];
      nextPageToken?: string;
    },
  ): Promise<JiraSearchResult> {
    return this.post<JiraSearchResult>("/rest/api/3/search/jql", {
      jql,
      maxResults: options?.maxResults ?? 20,
      fields: options?.fields ?? [
        "summary",
        "status",
        "priority",
        "assignee",
        "issuetype",
        "project",
        "updated",
        "created",
      ],
      ...(options?.nextPageToken && {
        nextPageToken: options.nextPageToken,
      }),
    });
  }

  /**
   * Get a single issue by key or ID.
   */
  async getIssue(
    issueKeyOrId: string,
    fields?: string[],
  ): Promise<JiraIssue> {
    const params: Record<string, any> = {};
    if (fields) params.fields = fields.join(",");
    return this.get<JiraIssue>(
      `/rest/api/3/issue/${encodeURIComponent(issueKeyOrId)}`,
      params,
    );
  }

  /**
   * Create a new issue.
   * Automatically converts plain text description to ADF.
   */
  async createIssue(options: {
    project: string;
    summary: string;
    issueType?: string;
    description?: string;
    assigneeAccountId?: string;
    priority?: string;
    labels?: string[];
    duedate?: string;
  }): Promise<{ id: string; key: string }> {
    const fields: Record<string, any> = {
      project: { key: options.project },
      summary: options.summary,
      issuetype: { name: options.issueType || "Task" },
    };

    if (options.description) {
      fields.description = this.toAdf(options.description);
    }
    if (options.assigneeAccountId) {
      fields.assignee = { accountId: options.assigneeAccountId };
    }
    if (options.priority) {
      fields.priority = { name: options.priority };
    }
    if (options.labels) {
      fields.labels = options.labels;
    }
    if (options.duedate) {
      fields.duedate = options.duedate;
    }

    return this.post<{ id: string; key: string }>("/rest/api/3/issue", {
      fields,
    });
  }

  /**
   * Update an existing issue.
   */
  async updateIssue(
    issueKeyOrId: string,
    fields: Record<string, any>,
  ): Promise<void> {
    // Convert description to ADF if it's a plain string
    if (typeof fields.description === "string") {
      fields.description = this.toAdf(fields.description);
    }
    await this.put(`/rest/api/3/issue/${encodeURIComponent(issueKeyOrId)}`, {
      fields,
    });
  }

  /**
   * Transition an issue to a new status.
   * Automatically looks up the transition ID by target status name.
   */
  async transitionIssue(
    issueKeyOrId: string,
    targetStatus: string,
  ): Promise<void> {
    const transitions = await this.getTransitions(issueKeyOrId);
    const match = transitions.find(
      (t) => t.name.toLowerCase() === targetStatus.toLowerCase() ||
        t.to.name.toLowerCase() === targetStatus.toLowerCase(),
    );
    if (!match) {
      const available = transitions.map((t) => `${t.name} → ${t.to.name}`);
      throw new Error(
        `No transition to "${targetStatus}". Available: ${available.join(", ")}`,
      );
    }
    await this.post(
      `/rest/api/3/issue/${encodeURIComponent(issueKeyOrId)}/transitions`,
      { transition: { id: match.id } },
    );
  }

  /**
   * Get available transitions for an issue.
   */
  async getTransitions(issueKeyOrId: string): Promise<JiraTransition[]> {
    const result = await this.get<{ transitions: JiraTransition[] }>(
      `/rest/api/3/issue/${encodeURIComponent(issueKeyOrId)}/transitions`,
    );
    return result.transitions;
  }

  /**
   * Add a comment to an issue.
   * Automatically converts text to ADF.
   */
  async addComment(
    issueKeyOrId: string,
    body: string,
  ): Promise<{ id: string }> {
    return this.post<{ id: string }>(
      `/rest/api/3/issue/${encodeURIComponent(issueKeyOrId)}/comment`,
      { body: this.toAdf(body) },
    );
  }

  // ─── Projects ───

  /**
   * List projects the current user has access to.
   */
  async listProjects(options?: {
    query?: string;
    maxResults?: number;
    startAt?: number;
  }): Promise<{ values: JiraProject[]; total: number }> {
    const params: Record<string, any> = {};
    if (options?.query) params.query = options.query;
    if (options?.maxResults) params.maxResults = options.maxResults;
    if (options?.startAt) params.startAt = options.startAt;
    return this.get<{ values: JiraProject[]; total: number }>(
      "/rest/api/3/project/search",
      params,
    );
  }

  // ─── Current User ───

  /**
   * Get the current authenticated Jira user.
   */
  async getMyself(): Promise<{
    accountId: string;
    displayName: string;
    emailAddress?: string;
  }> {
    return this.get("/rest/api/3/myself");
  }

  // ─── Helpers ───

  /**
   * Convert text to ADF. If text contains Markdown syntax, uses markdownToAdf;
   * otherwise uses simple textToAdf.
   */
  private toAdf(text: string): AdfNode {
    const hasMarkdown = /[#*`\[\]]/.test(text);
    return hasMarkdown ? markdownToAdf(text) : textToAdf(text);
  }
}
