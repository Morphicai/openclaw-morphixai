/**
 * Figma Client
 *
 * Wraps MorphixAI Pipedream proxy for Figma REST API v1.
 * URL pattern: https://api.figma.com/v1/...
 */
import type { BaibianClient } from "../baibian-client.js";
import { BaseAppClient } from "./base-app-client.js";

// ─── Response types ───

export interface FigmaUser {
  id: string;
  handle: string;
  img_url: string;
  email?: string;
}

export interface FigmaProject {
  id: number;
  name: string;
}

export interface FigmaProjectFile {
  key: string;
  name: string;
  thumbnail_url?: string;
  last_modified: string;
}

export interface FigmaFileInfo {
  name: string;
  lastModified: string;
  thumbnailUrl?: string;
  version: string;
  role: string;
  document: {
    id: string;
    name: string;
    type: string;
    children: FigmaNode[];
  };
}

export interface FigmaNode {
  id: string;
  name: string;
  type: string;
  children?: FigmaNode[];
  [key: string]: any;
}

export interface FigmaComment {
  id: string;
  message: string;
  created_at: string;
  resolved_at?: string;
  user: FigmaUser;
  order_id?: number;
}

export interface FigmaVersion {
  id: string;
  created_at: string;
  label?: string;
  description?: string;
  user: FigmaUser;
}

export interface FigmaComponent {
  key: string;
  name: string;
  description: string;
  node_id: string;
  thumbnail_url?: string;
  containing_frame?: { name: string; nodeId: string };
}

export interface FigmaStyle {
  key: string;
  name: string;
  description: string;
  style_type: string;
  node_id: string;
  thumbnail_url?: string;
}

export interface FigmaComponentSet {
  key: string;
  name: string;
  description: string;
  node_id: string;
  thumbnail_url?: string;
  containing_frame?: { name: string; nodeId: string };
}

export interface FigmaVariable {
  id: string;
  name: string;
  key: string;
  variableCollectionId: string;
  resolvedType: string;
  valuesByMode: Record<string, any>;
  description?: string;
  scopes?: string[];
}

export interface FigmaVariableCollection {
  id: string;
  name: string;
  key: string;
  modes: Array<{ modeId: string; name: string }>;
  defaultModeId: string;
  variableIds: string[];
}

export class FigmaClient extends BaseAppClient {
  constructor(baibian: BaibianClient, accountId: string) {
    super(baibian, accountId);
  }

  protected resolveUrl(path: string): string {
    return `https://api.figma.com/v1${path}`;
  }

  // ─── User ───

  async getMe(): Promise<FigmaUser> {
    return this.get<FigmaUser>("/me");
  }

  // ─── Teams & Projects ───

  async listTeamProjects(teamId: string): Promise<FigmaProject[]> {
    const resp = await this.get<{ name: string; projects: FigmaProject[] }>(
      `/teams/${teamId}/projects`,
    );
    return resp.projects;
  }

  async listProjectFiles(projectId: string): Promise<FigmaProjectFile[]> {
    const resp = await this.get<{ name: string; files: FigmaProjectFile[] }>(
      `/projects/${projectId}/files`,
    );
    return resp.files;
  }

  // ─── Files ───

  /**
   * Get file structure (pages and top-level frames).
   * depth=1 returns just pages; depth=2 returns pages + their direct children.
   */
  async getFile(
    fileKey: string,
    options?: { depth?: number },
  ): Promise<FigmaFileInfo> {
    const params: Record<string, any> = {};
    if (options?.depth !== undefined) params.depth = options.depth;
    return this.get<FigmaFileInfo>(`/files/${fileKey}`, params);
  }

  /**
   * Get specific nodes from a file by node IDs.
   */
  async getFileNodes(
    fileKey: string,
    nodeIds: string[],
    options?: { depth?: number },
  ): Promise<Record<string, { document: FigmaNode }>> {
    const params: Record<string, any> = {
      ids: nodeIds.join(","),
    };
    if (options?.depth !== undefined) params.depth = options.depth;
    const resp = await this.get<{
      nodes: Record<string, { document: FigmaNode }>;
    }>(`/files/${fileKey}/nodes`, params);
    return resp.nodes;
  }

  // ─── Images ───

  /**
   * Export images from a file.
   * Returns a map of node ID → image URL.
   */
  async exportImages(
    fileKey: string,
    nodeIds: string[],
    options?: {
      format?: "jpg" | "png" | "svg" | "pdf";
      scale?: number;
    },
  ): Promise<Record<string, string>> {
    const params: Record<string, any> = {
      ids: nodeIds.join(","),
      format: options?.format ?? "png",
    };
    if (options?.scale !== undefined) params.scale = options.scale;
    const resp = await this.get<{ images: Record<string, string> }>(
      `/images/${fileKey}`,
      params,
    );
    return resp.images;
  }

  // ─── Comments ───

  async listComments(fileKey: string): Promise<FigmaComment[]> {
    const resp = await this.get<{ comments: FigmaComment[] }>(
      `/files/${fileKey}/comments`,
    );
    return resp.comments;
  }

  async postComment(
    fileKey: string,
    message: string,
    options?: {
      /** Reply to a specific comment */
      comment_id?: string;
    },
  ): Promise<FigmaComment> {
    const body: any = { message };
    if (options?.comment_id) body.comment_id = options.comment_id;
    return this.post<FigmaComment>(`/files/${fileKey}/comments`, body);
  }

  async deleteComment(fileKey: string, commentId: string): Promise<void> {
    await this.del(`/files/${fileKey}/comments/${commentId}`);
  }

  // ─── Versions ───

  async listVersions(fileKey: string): Promise<FigmaVersion[]> {
    const resp = await this.get<{ versions: FigmaVersion[] }>(
      `/files/${fileKey}/versions`,
    );
    return resp.versions;
  }

  // ─── Components ───

  async getFileComponents(fileKey: string): Promise<FigmaComponent[]> {
    const resp = await this.get<{ meta: { components: FigmaComponent[] } }>(
      `/files/${fileKey}/components`,
    );
    return resp.meta.components;
  }

  async getTeamComponents(
    teamId: string,
    options?: { page_size?: number; after?: number },
  ): Promise<FigmaComponent[]> {
    const params: Record<string, any> = {};
    if (options?.page_size) params.page_size = options.page_size;
    if (options?.after) params.after = options.after;
    const resp = await this.get<{ meta: { components: FigmaComponent[] } }>(
      `/teams/${teamId}/components`,
      params,
    );
    return resp.meta.components;
  }

  // ─── Component Sets (Variants) ───

  async getFileComponentSets(fileKey: string): Promise<FigmaComponentSet[]> {
    const resp = await this.get<{ meta: { component_sets: FigmaComponentSet[] } }>(
      `/files/${fileKey}/component_sets`,
    );
    return resp.meta.component_sets;
  }

  async getTeamComponentSets(
    teamId: string,
    options?: { page_size?: number; after?: number },
  ): Promise<FigmaComponentSet[]> {
    const params: Record<string, any> = {};
    if (options?.page_size) params.page_size = options.page_size;
    if (options?.after) params.after = options.after;
    const resp = await this.get<{ meta: { component_sets: FigmaComponentSet[] } }>(
      `/teams/${teamId}/component_sets`,
      params,
    );
    return resp.meta.component_sets;
  }

  // ─── Styles ───

  async getFileStyles(fileKey: string): Promise<FigmaStyle[]> {
    const resp = await this.get<{ meta: { styles: FigmaStyle[] } }>(
      `/files/${fileKey}/styles`,
    );
    return resp.meta.styles;
  }

  async getTeamStyles(
    teamId: string,
    options?: { page_size?: number; after?: number },
  ): Promise<FigmaStyle[]> {
    const params: Record<string, any> = {};
    if (options?.page_size) params.page_size = options.page_size;
    if (options?.after) params.after = options.after;
    const resp = await this.get<{ meta: { styles: FigmaStyle[] } }>(
      `/teams/${teamId}/styles`,
      params,
    );
    return resp.meta.styles;
  }

  // ─── Variables (Design Tokens) ───

  /**
   * Get local variables in a file (colors, numbers, strings, booleans).
   * Requires Figma Enterprise or higher plan for some features.
   */
  async getLocalVariables(fileKey: string): Promise<{
    variables: Record<string, FigmaVariable>;
    variableCollections: Record<string, FigmaVariableCollection>;
  }> {
    const resp = await this.get<{
      meta: {
        variables: Record<string, FigmaVariable>;
        variableCollections: Record<string, FigmaVariableCollection>;
      };
    }>(`/files/${fileKey}/variables/local`);
    return resp.meta;
  }

  /**
   * Get published variables from a file's library.
   */
  async getPublishedVariables(fileKey: string): Promise<{
    variables: Record<string, FigmaVariable>;
    variableCollections: Record<string, FigmaVariableCollection>;
  }> {
    const resp = await this.get<{
      meta: {
        variables: Record<string, FigmaVariable>;
        variableCollections: Record<string, FigmaVariableCollection>;
      };
    }>(`/files/${fileKey}/variables/published`);
    return resp.meta;
  }
}
