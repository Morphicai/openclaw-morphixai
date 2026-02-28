import { Type, type Static } from "@sinclair/typebox";

/**
 * office_outlook tool schema
 *
 * Microsoft Outlook Email integration via Microsoft Graph API.
 */
export const OfficeOutlookSchema = Type.Union([
  Type.Object({
    action: Type.Literal("get_me"),
    account_id: Type.Optional(
      Type.String({ description: "Outlook account ID (auto-detected if omitted)" }),
    ),
  }),

  Type.Object({
    action: Type.Literal("list_messages"),
    account_id: Type.Optional(
      Type.String({ description: "Outlook account ID (auto-detected if omitted)" }),
    ),
    folder_id: Type.Optional(
      Type.String({ description: 'Mail folder ID or name (default "inbox")' }),
    ),
    top: Type.Optional(Type.Number({ description: "Max messages to return" })),
    skip: Type.Optional(Type.Number({ description: "Number of messages to skip" })),
    filter: Type.Optional(Type.String({ description: "OData $filter expression" })),
    search: Type.Optional(Type.String({ description: "Search query string" })),
    order_by: Type.Optional(
      Type.String({ description: 'Sort order (default "receivedDateTime desc")' }),
    ),
  }),

  Type.Object({
    action: Type.Literal("get_message"),
    account_id: Type.Optional(
      Type.String({ description: "Outlook account ID (auto-detected if omitted)" }),
    ),
    message_id: Type.String({ description: "Message ID", minLength: 1 }),
  }),

  Type.Object({
    action: Type.Literal("send_mail"),
    account_id: Type.Optional(
      Type.String({ description: "Outlook account ID (auto-detected if omitted)" }),
    ),
    subject: Type.String({ description: "Email subject", minLength: 1 }),
    body: Type.String({ description: "Email body content", minLength: 1 }),
    body_type: Type.Optional(
      Type.Union([Type.Literal("Text"), Type.Literal("HTML")], {
        description: 'Content type (default "Text")',
      }),
    ),
    to: Type.Array(Type.String(), {
      description: "Recipient email addresses",
      minItems: 1,
    }),
    cc: Type.Optional(
      Type.Array(Type.String(), { description: "CC email addresses" }),
    ),
  }),

  Type.Object({
    action: Type.Literal("reply_to_message"),
    account_id: Type.Optional(
      Type.String({ description: "Outlook account ID (auto-detected if omitted)" }),
    ),
    message_id: Type.String({ description: "Message ID to reply to", minLength: 1 }),
    comment: Type.String({ description: "Reply text", minLength: 1 }),
  }),

  Type.Object({
    action: Type.Literal("search_messages"),
    account_id: Type.Optional(
      Type.String({ description: "Outlook account ID (auto-detected if omitted)" }),
    ),
    query: Type.String({ description: "Search query", minLength: 1 }),
    top: Type.Optional(Type.Number({ description: "Max results (default 10)" })),
  }),

  Type.Object({
    action: Type.Literal("list_folders"),
    account_id: Type.Optional(
      Type.String({ description: "Outlook account ID (auto-detected if omitted)" }),
    ),
  }),
]);

export type OfficeOutlookParams = Static<typeof OfficeOutlookSchema>;
