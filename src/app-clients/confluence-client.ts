/**
 * Confluence Cloud Client
 *
 * Wraps MorphixAI Pipedream proxy for Confluence Cloud REST API.
 * URL pattern: https://api.atlassian.com/ex/confluence/{cloudId}/wiki/api/v2/...
 *
 * Uses v2 API for CRUD (spaces, pages). CQL search uses v1 (`/wiki/rest/api/search`)
 * because v2 does not have a search endpoint.
 * IMPORTANT: Query params must be embedded in URL (proxy `params` field unreliable for some endpoints).
 */
import type { BaibianClient } from "../baibian-client.js";
import { BaseAppClient } from "./base-app-client.js";

export interface ConfluenceSite {
  id: string;
  url: string;
  name: string;
  scopes: string[];
}

export interface ConfluenceSpace {
  id: string;
  key: string;
  name: string;
  type: "global" | "personal";
  status: string;
  homepageId?: string;
  createdAt?: string;
  _links?: { webui?: string };
}

export interface ConfluencePage {
  id: string;
  title: string;
  spaceId: string;
  status: string;
  parentId?: string;
  parentType?: string;
  version?: { number: number; message?: string; createdAt?: string };
  body?: Record<string, any>;
  _links?: { webui?: string; editui?: string };
}

export interface ConfluenceLabel {
  id: string;
  name: string;
  prefix: string;
}

export interface ConfluenceComment {
  id: string;
  status: string;
  title?: string;
  pageId?: string;
  version?: { number: number; createdAt?: string };
  body?: Record<string, any>;
  _links?: { webui?: string };
}

export class ConfluenceClient extends BaseAppClient {
  private cloudId?: string;
  private sites?: ConfluenceSite[];

  constructor(baibian: BaibianClient, accountId: string) {
    super(baibian, accountId);
  }

  // ─── URL Resolution ───

  protected async resolveUrl(path: string): Promise<string> {
    const cloudId = await this.getCloudId();
    return `https://api.atlassian.com/ex/confluence/${cloudId}${path}`;
  }

  async getCloudId(): Promise<string> {
    if (this.cloudId) return this.cloudId;
    const sites = await this.getAccessibleSites();
    if (sites.length === 0) {
      throw new Error("No Confluence sites accessible with this account");
    }
    this.cloudId = sites[0].id;
    return this.cloudId;
  }

  async getAccessibleSites(): Promise<ConfluenceSite[]> {
    if (this.sites) return this.sites;
    const result = await this.baibian.proxy({
      accountId: this.accountId,
      method: "GET",
      url: "https://api.atlassian.com/oauth/token/accessible-resources",
    });
    const data = result?.data ?? result;
    this.sites = Array.isArray(data) ? data : [];
    return this.sites;
  }

  // ─── Spaces ───

  async listSpaces(options?: {
    limit?: number;
    cursor?: string;
    type?: "global" | "personal";
  }): Promise<{ results: ConfluenceSpace[]; _links?: { next?: string } }> {
    const params: string[] = [];
    if (options?.limit) params.push(`limit=${options.limit}`);
    if (options?.cursor) params.push(`cursor=${encodeURIComponent(options.cursor)}`);
    if (options?.type) params.push(`type=${options.type}`);
    const qs = params.length ? `?${params.join("&")}` : "";
    return this.get(`/wiki/api/v2/spaces${qs}`);
  }

  async getSpace(spaceId: string): Promise<ConfluenceSpace> {
    return this.get<ConfluenceSpace>(`/wiki/api/v2/spaces/${spaceId}`);
  }

  // ─── Pages ───

  async listPages(options?: {
    spaceId?: string;
    limit?: number;
    sort?: string;
    cursor?: string;
  }): Promise<{ results: ConfluencePage[]; _links?: { next?: string } }> {
    const params: string[] = [];
    if (options?.limit) params.push(`limit=${options.limit}`);
    if (options?.sort) params.push(`sort=${encodeURIComponent(options.sort)}`);
    if (options?.cursor) params.push(`cursor=${encodeURIComponent(options.cursor)}`);
    const qs = params.length ? `?${params.join("&")}` : "";

    if (options?.spaceId) {
      return this.get(`/wiki/api/v2/spaces/${options.spaceId}/pages${qs}`);
    }
    return this.get(`/wiki/api/v2/pages${qs}`);
  }

  async getPage(
    pageId: string,
    options?: { bodyFormat?: "storage" | "atlas_doc_format" | "view" },
  ): Promise<ConfluencePage> {
    const qs = options?.bodyFormat ? `?body-format=${options.bodyFormat}` : "";
    return this.get<ConfluencePage>(`/wiki/api/v2/pages/${pageId}${qs}`);
  }

  async createPage(options: {
    spaceId: string;
    title: string;
    body: string;
    parentId?: string;
    bodyFormat?: "storage" | "atlas_doc_format";
  }): Promise<ConfluencePage> {
    const payload: Record<string, any> = {
      spaceId: options.spaceId,
      title: options.title,
      status: "current",
      body: {
        representation: options.bodyFormat || "storage",
        value: options.body,
      },
    };
    if (options.parentId) payload.parentId = options.parentId;
    return this.post<ConfluencePage>("/wiki/api/v2/pages", payload);
  }

  async updatePage(
    pageId: string,
    options: {
      title: string;
      body: string;
      version: number;
      bodyFormat?: "storage" | "atlas_doc_format";
    },
  ): Promise<ConfluencePage> {
    return this.put<ConfluencePage>(`/wiki/api/v2/pages/${pageId}`, {
      id: pageId,
      status: "current",
      title: options.title,
      body: {
        representation: options.bodyFormat || "storage",
        value: options.body,
      },
      version: { number: options.version },
    });
  }

  async deletePage(pageId: string): Promise<void> {
    await this.del(`/wiki/api/v2/pages/${pageId}`);
  }

  // ─── Children ───

  async getChildPages(
    pageId: string,
    options?: { limit?: number; sort?: string; cursor?: string },
  ): Promise<{ results: ConfluencePage[]; _links?: { next?: string } }> {
    const params: string[] = [];
    if (options?.limit) params.push(`limit=${options.limit}`);
    if (options?.sort) params.push(`sort=${encodeURIComponent(options.sort)}`);
    if (options?.cursor) params.push(`cursor=${encodeURIComponent(options.cursor)}`);
    const qs = params.length ? `?${params.join("&")}` : "";
    return this.get(`/wiki/api/v2/pages/${pageId}/children${qs}`);
  }

  // ─── Labels ───

  async getPageLabels(
    pageId: string,
    options?: { limit?: number; prefix?: string; cursor?: string },
  ): Promise<{ results: ConfluenceLabel[]; _links?: { next?: string } }> {
    const params: string[] = [];
    if (options?.limit) params.push(`limit=${options.limit}`);
    if (options?.prefix) params.push(`prefix=${encodeURIComponent(options.prefix)}`);
    if (options?.cursor) params.push(`cursor=${encodeURIComponent(options.cursor)}`);
    const qs = params.length ? `?${params.join("&")}` : "";
    return this.get(`/wiki/api/v2/pages/${pageId}/labels${qs}`);
  }

  async addPageLabel(pageId: string, label: string): Promise<ConfluenceLabel> {
    return this.post<ConfluenceLabel>(`/wiki/api/v2/pages/${pageId}/labels`, {
      name: label,
      prefix: "global",
    });
  }

  async deletePageLabel(pageId: string, labelId: string): Promise<void> {
    await this.del(`/wiki/api/v2/pages/${pageId}/labels/${labelId}`);
  }

  // ─── Comments ───

  async getPageComments(
    pageId: string,
    options?: { limit?: number; bodyFormat?: "storage" | "atlas_doc_format" | "view"; cursor?: string },
  ): Promise<{ results: ConfluenceComment[]; _links?: { next?: string } }> {
    const params: string[] = [];
    if (options?.limit) params.push(`limit=${options.limit}`);
    if (options?.bodyFormat) params.push(`body-format=${options.bodyFormat}`);
    if (options?.cursor) params.push(`cursor=${encodeURIComponent(options.cursor)}`);
    const qs = params.length ? `?${params.join("&")}` : "";
    return this.get(`/wiki/api/v2/pages/${pageId}/footer-comments${qs}`);
  }

  async addPageComment(
    pageId: string,
    body: string,
    bodyFormat?: "storage" | "atlas_doc_format",
  ): Promise<ConfluenceComment> {
    return this.post<ConfluenceComment>("/wiki/api/v2/footer-comments", {
      pageId,
      body: {
        representation: bodyFormat || "storage",
        value: body,
      },
    });
  }

  // ─── Search ───

  /**
   * Search content using CQL.
   * Uses v1 API because v2 does not have a search endpoint.
   * Note: CQL must be embedded in URL due to proxy params forwarding bug.
   */
  async searchContent(
    cql: string,
    options?: { limit?: number },
  ): Promise<{ results: any[]; _links?: { next?: string } }> {
    const params: string[] = [`cql=${encodeURIComponent(cql)}`];
    if (options?.limit) params.push(`limit=${options.limit}`);
    return this.get(`/wiki/rest/api/search?${params.join("&")}`);
  }
}
