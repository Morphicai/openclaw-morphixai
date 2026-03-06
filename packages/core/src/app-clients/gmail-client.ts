/**
 * Gmail Client
 *
 * Wraps MorphixAI Pipedream proxy for Gmail API.
 * URL pattern: https://gmail.googleapis.com/gmail/v1/users/me/...
 */
import type { MorphixClient } from "../morphix-client.js";
import { BaseAppClient } from "./base-app-client.js";

export interface GmailMessage {
  id: string;
  threadId: string;
  labelIds?: string[];
  snippet: string;
  payload?: {
    headers: Array<{ name: string; value: string }>;
    mimeType: string;
    body?: { data?: string; size: number };
    parts?: Array<{
      mimeType: string;
      body?: { data?: string; size: number };
    }>;
  };
  internalDate?: string;
}

export interface GmailMessageListItem {
  id: string;
  threadId: string;
}

export interface GmailLabel {
  id: string;
  name: string;
  type: string;
  messagesTotal?: number;
  messagesUnread?: number;
}

export class GmailClient extends BaseAppClient {
  constructor(morphix: MorphixClient, accountId: string) {
    super(morphix, accountId);
  }

  protected resolveUrl(path: string): string {
    return `https://gmail.googleapis.com/gmail/v1/users/me${path}`;
  }

  // ─── Messages ───

  /**
   * List message IDs (use getMessage for full content).
   */
  async listMessages(options?: {
    q?: string;
    maxResults?: number;
    pageToken?: string;
    labelIds?: string[];
  }): Promise<{
    messages?: GmailMessageListItem[];
    nextPageToken?: string;
    resultSizeEstimate: number;
  }> {
    const params: Record<string, any> = {};
    if (options?.q) params.q = options.q;
    if (options?.maxResults) params.maxResults = options.maxResults;
    if (options?.pageToken) params.pageToken = options.pageToken;
    if (options?.labelIds) params.labelIds = options.labelIds.join(",");
    return this.get("/messages", params);
  }

  /**
   * Get a single message with full content.
   */
  async getMessage(
    messageId: string,
    format?: "full" | "metadata" | "minimal" | "raw",
  ): Promise<GmailMessage> {
    return this.get<GmailMessage>(`/messages/${messageId}`, {
      format: format || "full",
    });
  }

  /**
   * Send an email.
   * The raw parameter must be a base64url-encoded RFC 2822 email string.
   */
  async sendRaw(raw: string): Promise<GmailMessage> {
    return this.post<GmailMessage>("/messages/send", { raw });
  }

  /**
   * Send an email using simple fields (constructs RFC 2822 internally).
   */
  async sendMail(options: {
    to: string;
    subject: string;
    body: string;
    cc?: string;
    from?: string;
  }): Promise<GmailMessage> {
    const lines = [
      `To: ${options.to}`,
      ...(options.cc ? [`Cc: ${options.cc}`] : []),
      ...(options.from ? [`From: ${options.from}`] : []),
      `Subject: ${options.subject}`,
      "Content-Type: text/plain; charset=utf-8",
      "",
      options.body,
    ];
    const raw = this.base64UrlEncode(lines.join("\r\n"));
    return this.sendRaw(raw);
  }

  /**
   * Search messages using Gmail query syntax.
   * Examples: "from:user@example.com", "subject:invoice", "is:unread"
   */
  async searchMessages(
    query: string,
    maxResults?: number,
  ): Promise<{
    messages?: GmailMessageListItem[];
    nextPageToken?: string;
    resultSizeEstimate: number;
  }> {
    return this.listMessages({ q: query, maxResults: maxResults ?? 10 });
  }

  // ─── Labels ───

  async listLabels(): Promise<{ labels: GmailLabel[] }> {
    return this.get("/labels");
  }

  // ─── Modify ───

  /**
   * Modify labels on a message (e.g., mark as read, archive).
   */
  async modifyMessage(
    messageId: string,
    options: {
      addLabelIds?: string[];
      removeLabelIds?: string[];
    },
  ): Promise<GmailMessage> {
    return this.post<GmailMessage>(`/messages/${messageId}/modify`, options);
  }

  /**
   * Mark a message as read.
   */
  async markAsRead(messageId: string): Promise<GmailMessage> {
    return this.modifyMessage(messageId, {
      removeLabelIds: ["UNREAD"],
    });
  }

  /**
   * Trash a message.
   */
  async trashMessage(messageId: string): Promise<GmailMessage> {
    return this.post<GmailMessage>(`/messages/${messageId}/trash`);
  }

  // ─── Profile ───

  async getProfile(): Promise<{
    emailAddress: string;
    messagesTotal: number;
    threadsTotal: number;
    historyId: string;
  }> {
    return this.get("/profile");
  }

  // ─── Helpers ───

  /**
   * Base64url encode a string (RFC 4648 §5).
   */
  private base64UrlEncode(str: string): string {
    const b64 = Buffer.from(str, "utf-8").toString("base64");
    return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }

  /**
   * Extract a header value from a Gmail message payload.
   */
  static getHeader(
    message: GmailMessage,
    headerName: string,
  ): string | undefined {
    return message.payload?.headers?.find(
      (h) => h.name.toLowerCase() === headerName.toLowerCase(),
    )?.value;
  }

  /**
   * Decode base64url body data from a Gmail message.
   */
  static decodeBody(data: string): string {
    const base64 = data.replace(/-/g, "+").replace(/_/g, "/");
    return Buffer.from(base64, "base64").toString("utf-8");
  }
}
