/**
 * GitLab Client
 *
 * Wraps MorphixAI Pipedream proxy for GitLab REST API v4.
 * Handles: project path URL-encoding, user-scoped project listing.
 *
 * URL pattern: https://gitlab.com/api/v4/... (or self-hosted)
 * Note: `/projects` (global) times out on Pipedream; always use scoped endpoints.
 */
import type { BaibianClient } from "../baibian-client.js";
import { BaseAppClient } from "./base-app-client.js";

export interface GitLabUser {
  id: number;
  username: string;
  name: string;
  email?: string;
  avatar_url?: string;
  web_url: string;
}

export interface GitLabProject {
  id: number;
  name: string;
  path: string;
  path_with_namespace: string;
  description?: string;
  web_url: string;
  default_branch?: string;
  visibility: string;
}

export interface GitLabMergeRequest {
  id: number;
  iid: number;
  title: string;
  state: string;
  source_branch: string;
  target_branch: string;
  author: { username: string; name: string };
  web_url: string;
  created_at: string;
  updated_at: string;
  merged_at?: string;
  // Available on single MR GET (not list)
  merge_status?: string;
  detailed_merge_status?: string;
  has_conflicts?: boolean;
  blocking_discussions_resolved?: boolean;
  pipeline?: { id: number; status: string; web_url: string } | null;
}

export interface GitLabIssue {
  id: number;
  iid: number;
  title: string;
  state: string;
  description?: string;
  labels: string[];
  author: { username: string; name: string };
  assignee?: { username: string; name: string };
  web_url: string;
  created_at: string;
  updated_at: string;
}

export interface GitLabPipeline {
  id: number;
  status: string;
  ref: string;
  sha: string;
  web_url: string;
  created_at: string;
  updated_at: string;
}

export class GitLabClient extends BaseAppClient {
  private readonly baseApiUrl: string;
  private userId?: number;

  constructor(
    baibian: BaibianClient,
    accountId: string,
    baseApiUrl: string = "https://gitlab.com",
  ) {
    super(baibian, accountId);
    this.baseApiUrl = baseApiUrl.replace(/\/$/, "");
  }

  protected resolveUrl(path: string): string {
    return `${this.baseApiUrl}${path}`;
  }

  /**
   * Encode a project path for use in API URLs.
   * "my-group/my-project" → "my-group%2Fmy-project"
   */
  private encodeProjectPath(project: string | number): string {
    if (typeof project === "number") return String(project);
    // If it's already a number string, use as-is
    if (/^\d+$/.test(project)) return project;
    // URL-encode the path (slashes → %2F)
    return encodeURIComponent(project);
  }

  // ─── User ───

  async getCurrentUser(): Promise<GitLabUser> {
    return this.get<GitLabUser>("/api/v4/user");
  }

  private async getUserId(): Promise<number> {
    if (this.userId) return this.userId;
    const user = await this.getCurrentUser();
    this.userId = user.id;
    return this.userId;
  }

  // ─── Projects ───

  /**
   * List projects for the current user.
   * Uses /users/{id}/projects to avoid the global /projects timeout.
   */
  async listProjects(options?: {
    search?: string;
    perPage?: number;
    page?: number;
    orderBy?: string;
    sort?: "asc" | "desc";
  }): Promise<GitLabProject[]> {
    const userId = await this.getUserId();
    const params: Record<string, any> = {
      per_page: options?.perPage ?? 20,
    };
    if (options?.search) params.search = options.search;
    if (options?.page) params.page = options.page;
    if (options?.orderBy) params.order_by = options.orderBy;
    if (options?.sort) params.sort = options.sort;

    return this.get<GitLabProject[]>(
      `/api/v4/users/${userId}/projects`,
      params,
    );
  }

  /**
   * Get a single project by ID or path.
   */
  async getProject(project: string | number): Promise<GitLabProject> {
    return this.get<GitLabProject>(
      `/api/v4/projects/${this.encodeProjectPath(project)}`,
    );
  }

  // ─── Merge Requests ───

  async listMergeRequests(
    project: string | number,
    options?: {
      state?: "opened" | "closed" | "merged" | "all";
      perPage?: number;
      page?: number;
    },
  ): Promise<GitLabMergeRequest[]> {
    const params: Record<string, any> = {
      per_page: options?.perPage ?? 20,
    };
    if (options?.state) params.state = options.state;
    if (options?.page) params.page = options.page;

    return this.get<GitLabMergeRequest[]>(
      `/api/v4/projects/${this.encodeProjectPath(project)}/merge_requests`,
      params,
    );
  }

  /**
   * Get a single merge request with full details including merge readiness.
   * Returns `detailed_merge_status`, `has_conflicts`, `pipeline` etc.
   */
  async getMergeRequest(
    project: string | number,
    mrIid: number,
  ): Promise<GitLabMergeRequest> {
    return this.get<GitLabMergeRequest>(
      `/api/v4/projects/${this.encodeProjectPath(project)}/merge_requests/${mrIid}`,
    );
  }

  async createMergeRequest(
    project: string | number,
    options: {
      sourceBranch: string;
      targetBranch: string;
      title: string;
      description?: string;
    },
  ): Promise<GitLabMergeRequest> {
    return this.post<GitLabMergeRequest>(
      `/api/v4/projects/${this.encodeProjectPath(project)}/merge_requests`,
      {
        source_branch: options.sourceBranch,
        target_branch: options.targetBranch,
        title: options.title,
        description: options.description,
      },
    );
  }

  async approveMergeRequest(
    project: string | number,
    mrIid: number,
  ): Promise<void> {
    await this.post(
      `/api/v4/projects/${this.encodeProjectPath(project)}/merge_requests/${mrIid}/approve`,
    );
  }

  async updateMergeRequest(
    project: string | number,
    mrIid: number,
    options: {
      title?: string;
      description?: string;
      targetBranch?: string;
      reviewerIds?: number[];
      assigneeIds?: number[];
      labels?: string;
    },
  ): Promise<GitLabMergeRequest> {
    const body: Record<string, any> = {};
    if (options.title !== undefined) body.title = options.title;
    if (options.description !== undefined) body.description = options.description;
    if (options.targetBranch !== undefined) body.target_branch = options.targetBranch;
    if (options.reviewerIds !== undefined) body.reviewer_ids = options.reviewerIds;
    if (options.assigneeIds !== undefined) body.assignee_ids = options.assigneeIds;
    if (options.labels !== undefined) body.labels = options.labels;
    return this.put<GitLabMergeRequest>(
      `/api/v4/projects/${this.encodeProjectPath(project)}/merge_requests/${mrIid}`,
      body,
    );
  }

  async searchUsers(options: { search: string; perPage?: number }): Promise<GitLabUser[]> {
    return this.get<GitLabUser[]>("/api/v4/users", {
      search: options.search,
      per_page: options.perPage ?? 10,
    });
  }

  async mergeMergeRequest(
    project: string | number,
    mrIid: number,
  ): Promise<GitLabMergeRequest> {
    return this.put<GitLabMergeRequest>(
      `/api/v4/projects/${this.encodeProjectPath(project)}/merge_requests/${mrIid}/merge`,
    );
  }

  // ─── Issues ───

  async listIssues(
    project: string | number,
    options?: {
      state?: "opened" | "closed" | "all";
      labels?: string;
      perPage?: number;
      page?: number;
    },
  ): Promise<GitLabIssue[]> {
    const params: Record<string, any> = {
      per_page: options?.perPage ?? 20,
    };
    if (options?.state) params.state = options.state;
    if (options?.labels) params.labels = options.labels;
    if (options?.page) params.page = options.page;

    return this.get<GitLabIssue[]>(
      `/api/v4/projects/${this.encodeProjectPath(project)}/issues`,
      params,
    );
  }

  async createIssue(
    project: string | number,
    options: {
      title: string;
      description?: string;
      labels?: string;
      assigneeIds?: number[];
    },
  ): Promise<GitLabIssue> {
    return this.post<GitLabIssue>(
      `/api/v4/projects/${this.encodeProjectPath(project)}/issues`,
      {
        title: options.title,
        description: options.description,
        labels: options.labels,
        assignee_ids: options.assigneeIds,
      },
    );
  }

  // ─── Pipelines ───

  async listPipelines(
    project: string | number,
    options?: {
      status?: string;
      ref?: string;
      perPage?: number;
    },
  ): Promise<GitLabPipeline[]> {
    const params: Record<string, any> = {
      per_page: options?.perPage ?? 20,
    };
    if (options?.status) params.status = options.status;
    if (options?.ref) params.ref = options.ref;

    return this.get<GitLabPipeline[]>(
      `/api/v4/projects/${this.encodeProjectPath(project)}/pipelines`,
      params,
    );
  }

  async retryPipeline(
    project: string | number,
    pipelineId: number,
  ): Promise<GitLabPipeline> {
    return this.post<GitLabPipeline>(
      `/api/v4/projects/${this.encodeProjectPath(project)}/pipelines/${pipelineId}/retry`,
    );
  }

  // ─── Branches ───

  async listBranches(
    project: string | number,
    options?: { search?: string; perPage?: number },
  ): Promise<Array<{ name: string; default: boolean; web_url: string }>> {
    const params: Record<string, any> = {
      per_page: options?.perPage ?? 20,
    };
    if (options?.search) params.search = options.search;

    return this.get(
      `/api/v4/projects/${this.encodeProjectPath(project)}/repository/branches`,
      params,
    );
  }
}
