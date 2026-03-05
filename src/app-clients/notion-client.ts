/**
 * Notion Client
 *
 * Wraps MorphixAI Pipedream proxy for Notion API.
 * URL pattern: https://api.notion.com/v1/...
 *
 * IMPORTANT: All requests must include { "Notion-Version": "2022-06-28" } header.
 */
import type { MorphixClient } from "../morphix-client.js";
import { BaseAppClient } from "./base-app-client.js";

const NOTION_VERSION = "2022-06-28";

export interface NotionPage {
  object: "page";
  id: string;
  created_time: string;
  last_edited_time: string;
  archived: boolean;
  in_trash: boolean;
  url: string;
  parent: { type: string; [key: string]: any };
  properties: Record<string, any>;
}

export interface NotionDatabase {
  object: "database";
  id: string;
  title: Array<{ plain_text: string }>;
  created_time: string;
  last_edited_time: string;
  url: string;
  properties: Record<string, any>;
}

export interface NotionBlock {
  object: "block";
  id: string;
  type: string;
  [key: string]: any;
}

export interface NotionSearchResult {
  object: "list";
  results: Array<NotionPage | NotionDatabase>;
  has_more: boolean;
  next_cursor: string | null;
}

export class NotionClient extends BaseAppClient {
  constructor(morphix: MorphixClient, accountId: string) {
    super(morphix, accountId);
  }

  protected resolveUrl(path: string): string {
    return `https://api.notion.com${path}`;
  }

  /**
   * Override request to always inject the required Notion-Version header.
   */
  protected override request<T = any>(
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
      headers: { "Notion-Version": NOTION_VERSION, ...options?.headers },
    });
  }

  // ─── Search ───

  /**
   * Search pages and databases across the workspace.
   */
  async search(options?: {
    query?: string;
    filter?: { property: "object"; value: "page" | "database" };
    pageSize?: number;
    startCursor?: string;
  }): Promise<NotionSearchResult> {
    const body: Record<string, any> = {};
    if (options?.query) body.query = options.query;
    if (options?.filter) body.filter = options.filter;
    if (options?.pageSize) body.page_size = options.pageSize;
    if (options?.startCursor) body.start_cursor = options.startCursor;
    return this.post<NotionSearchResult>("/v1/search", body);
  }

  // ─── Pages ───

  /**
   * Get a page by ID.
   */
  async getPage(pageId: string): Promise<NotionPage> {
    return this.get<NotionPage>(`/v1/pages/${pageId}`);
  }

  /**
   * Create a new page.
   */
  async createPage(options: {
    parent: { database_id: string } | { page_id: string };
    properties: Record<string, any>;
    children?: any[];
  }): Promise<NotionPage> {
    return this.post<NotionPage>("/v1/pages", options);
  }

  /**
   * Update page properties.
   */
  async updatePage(
    pageId: string,
    properties: Record<string, any>,
  ): Promise<NotionPage> {
    return this.patch<NotionPage>(`/v1/pages/${pageId}`, { properties });
  }

  /**
   * Archive (soft-delete) a page.
   */
  async archivePage(pageId: string): Promise<NotionPage> {
    return this.patch<NotionPage>(`/v1/pages/${pageId}`, { archived: true });
  }

  // ─── Blocks ───

  /**
   * Get block children (page content).
   */
  async getBlockChildren(
    blockId: string,
    options?: { pageSize?: number; startCursor?: string },
  ): Promise<{ results: NotionBlock[]; has_more: boolean; next_cursor: string | null }> {
    const params: Record<string, any> = {};
    if (options?.pageSize) params.page_size = options.pageSize;
    if (options?.startCursor) params.start_cursor = options.startCursor;
    return this.get(`/v1/blocks/${blockId}/children`, params);
  }

  /**
   * Append blocks to a page.
   */
  async appendBlocks(
    blockId: string,
    children: any[],
  ): Promise<{ results: NotionBlock[] }> {
    return this.patch<{ results: NotionBlock[] }>(
      `/v1/blocks/${blockId}/children`,
      { children },
    );
  }

  // ─── Databases ───

  /**
   * Get a database by ID.
   */
  async getDatabase(databaseId: string): Promise<NotionDatabase> {
    return this.get<NotionDatabase>(`/v1/databases/${databaseId}`);
  }

  /**
   * Query a database with filters and sorts.
   */
  async queryDatabase(
    databaseId: string,
    options?: {
      filter?: any;
      sorts?: any[];
      pageSize?: number;
      startCursor?: string;
    },
  ): Promise<NotionSearchResult> {
    const body: Record<string, any> = {};
    if (options?.filter) body.filter = options.filter;
    if (options?.sorts) body.sorts = options.sorts;
    if (options?.pageSize) body.page_size = options.pageSize;
    if (options?.startCursor) body.start_cursor = options.startCursor;
    return this.post<NotionSearchResult>(
      `/v1/databases/${databaseId}/query`,
      body,
    );
  }

  // ─── User ───

  /**
   * Get the current bot user info.
   */
  async getMe(): Promise<{
    object: string;
    id: string;
    type: string;
    bot: { owner: { type: string; user?: any } };
    name?: string;
  }> {
    return this.get("/v1/users/me");
  }
}
