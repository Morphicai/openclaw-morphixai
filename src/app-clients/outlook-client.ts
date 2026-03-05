/**
 * Microsoft Outlook Email Client
 *
 * Wraps MorphixAI Pipedream proxy for Microsoft Graph API (mail).
 * URL pattern: https://graph.microsoft.com/v1.0/me/...
 */
import type { MorphixClient } from "../morphix-client.js";
import { BaseAppClient } from "./base-app-client.js";

export interface OutlookMessage {
  id: string;
  subject: string;
  bodyPreview: string;
  body?: { contentType: string; content: string };
  from?: { emailAddress: { name: string; address: string } };
  toRecipients?: Array<{ emailAddress: { name: string; address: string } }>;
  receivedDateTime: string;
  isRead: boolean;
  hasAttachments: boolean;
  importance: string;
  webLink?: string;
}

export interface OutlookMailFolder {
  id: string;
  displayName: string;
  totalItemCount: number;
  unreadItemCount: number;
}

export class OutlookClient extends BaseAppClient {
  constructor(morphix: MorphixClient, accountId: string) {
    super(morphix, accountId);
  }

  protected resolveUrl(path: string): string {
    return `https://graph.microsoft.com/v1.0${path}`;
  }

  // ─── Messages ───

  /**
   * List messages in the inbox (or a specific folder).
   */
  async listMessages(options?: {
    folderId?: string;
    top?: number;
    skip?: number;
    filter?: string;
    search?: string;
    select?: string[];
    orderBy?: string;
  }): Promise<{ value: OutlookMessage[]; "@odata.nextLink"?: string }> {
    const folder = options?.folderId || "inbox";
    const params: Record<string, any> = {};
    if (options?.top) params.$top = options.top;
    if (options?.skip) params.$skip = options.skip;
    if (options?.filter) params.$filter = options.filter;
    if (options?.search) params.$search = `"${options.search}"`;
    if (options?.select) params.$select = options.select.join(",");
    if (options?.orderBy) params.$orderby = options.orderBy;
    else params.$orderby = "receivedDateTime desc";

    return this.get(`/me/mailFolders/${folder}/messages`, params);
  }

  /**
   * Get a single message by ID.
   */
  async getMessage(messageId: string): Promise<OutlookMessage> {
    return this.get<OutlookMessage>(`/me/messages/${messageId}`);
  }

  /**
   * Send a new email.
   */
  async sendMail(options: {
    subject: string;
    body: string;
    bodyType?: "Text" | "HTML";
    toRecipients: string[];
    ccRecipients?: string[];
    saveToSentItems?: boolean;
  }): Promise<void> {
    await this.post("/me/sendMail", {
      message: {
        subject: options.subject,
        body: {
          contentType: options.bodyType || "Text",
          content: options.body,
        },
        toRecipients: options.toRecipients.map((email) => ({
          emailAddress: { address: email },
        })),
        ...(options.ccRecipients && {
          ccRecipients: options.ccRecipients.map((email) => ({
            emailAddress: { address: email },
          })),
        }),
      },
      saveToSentItems: options.saveToSentItems ?? true,
    });
  }

  /**
   * Reply to a message.
   */
  async replyToMessage(
    messageId: string,
    comment: string,
  ): Promise<void> {
    await this.post(`/me/messages/${messageId}/reply`, { comment });
  }

  /**
   * Search messages using Microsoft Graph $search.
   */
  async searchMessages(
    query: string,
    options?: { top?: number },
  ): Promise<{ value: OutlookMessage[] }> {
    return this.listMessages({
      search: query,
      top: options?.top ?? 10,
    });
  }

  // ─── Folders ───

  async listFolders(): Promise<{ value: OutlookMailFolder[] }> {
    return this.get("/me/mailFolders");
  }

  // ─── User Profile ───

  async getMe(): Promise<{
    displayName: string;
    mail: string;
    userPrincipalName: string;
  }> {
    return this.get("/me", { $select: "displayName,mail,userPrincipalName" });
  }
}
