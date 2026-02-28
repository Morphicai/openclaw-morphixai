/**
 * GitHub Client
 *
 * Wraps MorphixAI Pipedream proxy for GitHub REST API.
 * Handles: Accept header injection, owner/repo parsing.
 *
 * URL pattern: https://api.github.com/...
 */
import type { BaibianClient } from "../baibian-client.js";
import { BaseAppClient } from "./base-app-client.js";

export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  description?: string;
  html_url: string;
  default_branch: string;
  private: boolean;
  language?: string;
  stargazers_count: number;
  updated_at: string;
}

export interface GitHubIssue {
  id: number;
  number: number;
  title: string;
  state: string;
  body?: string;
  labels: Array<{ name: string; color: string }>;
  assignees: Array<{ login: string }>;
  user: { login: string };
  html_url: string;
  created_at: string;
  updated_at: string;
  pull_request?: any; // present if this is a PR
}

export interface GitHubPullRequest {
  id: number;
  number: number;
  title: string;
  state: string;
  body?: string;
  head: { ref: string; sha: string };
  base: { ref: string };
  user: { login: string };
  html_url: string;
  created_at: string;
  updated_at: string;
  merged_at?: string;
}

export interface GitHubWorkflowRun {
  id: number;
  name: string;
  status: string;
  conclusion?: string;
  head_branch: string;
  html_url: string;
  created_at: string;
  updated_at: string;
}

export class GitHubClient extends BaseAppClient {
  constructor(baibian: BaibianClient, accountId: string) {
    super(baibian, accountId);
  }

  protected resolveUrl(path: string): string {
    return `https://api.github.com${path}`;
  }

  /**
   * Override request to inject GitHub-specific headers.
   */
  protected override async request<T = any>(
    method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
    path: string,
    options?: {
      params?: Record<string, any>;
      body?: any;
      headers?: Record<string, string>;
    },
  ): Promise<T> {
    return super.request<T>(method, path, {
      ...options,
      headers: {
        Accept: "application/vnd.github+json",
        ...options?.headers,
      },
    });
  }

  /**
   * Parse "owner/repo" string into components.
   */
  private parseRepo(ownerRepo: string): { owner: string; repo: string } {
    const parts = ownerRepo.split("/");
    if (parts.length !== 2) {
      throw new Error(
        `Invalid repo format "${ownerRepo}". Expected "owner/repo".`,
      );
    }
    return { owner: parts[0], repo: parts[1] };
  }

  // ─── User ───

  async getCurrentUser(): Promise<{
    login: string;
    name: string;
    email?: string;
  }> {
    return this.get("/user");
  }

  // ─── Repos ───

  async listRepos(options?: {
    sort?: "created" | "updated" | "pushed" | "full_name";
    perPage?: number;
    page?: number;
    type?: "all" | "owner" | "public" | "private" | "member";
  }): Promise<GitHubRepo[]> {
    const params: Record<string, any> = {
      per_page: options?.perPage ?? 30,
    };
    if (options?.sort) params.sort = options.sort;
    if (options?.page) params.page = options.page;
    if (options?.type) params.type = options.type;
    return this.get<GitHubRepo[]>("/user/repos", params);
  }

  async getRepo(ownerRepo: string): Promise<GitHubRepo> {
    const { owner, repo } = this.parseRepo(ownerRepo);
    return this.get<GitHubRepo>(`/repos/${owner}/${repo}`);
  }

  // ─── Issues ───

  /**
   * List issues (excludes pull requests).
   */
  async listIssues(
    ownerRepo: string,
    options?: {
      state?: "open" | "closed" | "all";
      labels?: string;
      perPage?: number;
      page?: number;
    },
  ): Promise<GitHubIssue[]> {
    const { owner, repo } = this.parseRepo(ownerRepo);
    const params: Record<string, any> = {
      per_page: options?.perPage ?? 30,
    };
    if (options?.state) params.state = options.state;
    if (options?.labels) params.labels = options.labels;
    if (options?.page) params.page = options.page;

    const all = await this.get<GitHubIssue[]>(
      `/repos/${owner}/${repo}/issues`,
      params,
    );
    // Filter out PRs (GitHub returns PRs in /issues)
    return all.filter((i) => !i.pull_request);
  }

  async createIssue(
    ownerRepo: string,
    options: {
      title: string;
      body?: string;
      labels?: string[];
      assignees?: string[];
    },
  ): Promise<GitHubIssue> {
    const { owner, repo } = this.parseRepo(ownerRepo);
    return this.post<GitHubIssue>(`/repos/${owner}/${repo}/issues`, {
      title: options.title,
      body: options.body,
      labels: options.labels,
      assignees: options.assignees,
    });
  }

  async updateIssue(
    ownerRepo: string,
    issueNumber: number,
    fields: { title?: string; body?: string; state?: string; labels?: string[] },
  ): Promise<GitHubIssue> {
    const { owner, repo } = this.parseRepo(ownerRepo);
    return this.patch<GitHubIssue>(
      `/repos/${owner}/${repo}/issues/${issueNumber}`,
      fields,
    );
  }

  // ─── Pull Requests ───

  async listPulls(
    ownerRepo: string,
    options?: {
      state?: "open" | "closed" | "all";
      perPage?: number;
      page?: number;
    },
  ): Promise<GitHubPullRequest[]> {
    const { owner, repo } = this.parseRepo(ownerRepo);
    const params: Record<string, any> = {
      per_page: options?.perPage ?? 30,
    };
    if (options?.state) params.state = options.state;
    if (options?.page) params.page = options.page;
    return this.get<GitHubPullRequest[]>(
      `/repos/${owner}/${repo}/pulls`,
      params,
    );
  }

  async createPull(
    ownerRepo: string,
    options: {
      title: string;
      head: string;
      base: string;
      body?: string;
    },
  ): Promise<GitHubPullRequest> {
    const { owner, repo } = this.parseRepo(ownerRepo);
    return this.post<GitHubPullRequest>(`/repos/${owner}/${repo}/pulls`, {
      title: options.title,
      head: options.head,
      base: options.base,
      body: options.body,
    });
  }

  // ─── Actions ───

  async listWorkflowRuns(
    ownerRepo: string,
    options?: {
      status?: string;
      perPage?: number;
    },
  ): Promise<{ total_count: number; workflow_runs: GitHubWorkflowRun[] }> {
    const { owner, repo } = this.parseRepo(ownerRepo);
    const params: Record<string, any> = {
      per_page: options?.perPage ?? 10,
    };
    if (options?.status) params.status = options.status;
    return this.get(`/repos/${owner}/${repo}/actions/runs`, params);
  }

  async triggerWorkflow(
    ownerRepo: string,
    workflowId: string | number,
    ref: string,
    inputs?: Record<string, any>,
  ): Promise<void> {
    const { owner, repo } = this.parseRepo(ownerRepo);
    await this.post(
      `/repos/${owner}/${repo}/actions/workflows/${workflowId}/dispatches`,
      { ref, inputs },
    );
  }
}
