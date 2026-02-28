import { Type, type Static } from "@sinclair/typebox";

/**
 * mx_gmail tool schema
 *
 * Gmail integration via Gmail API.
 */
export const OfficeGmailSchema = Type.Union([
  Type.Object({
    action: Type.Literal("get_profile"),
    account_id: Type.Optional(
      Type.String({ description: "Gmail account ID (auto-detected if omitted)" }),
    ),
  }),

  Type.Object({
    action: Type.Literal("list_messages"),
    account_id: Type.Optional(
      Type.String({ description: "Gmail account ID (auto-detected if omitted)" }),
    ),
    q: Type.Optional(
      Type.String({
        description:
          'Gmail search query. Examples: "from:user@example.com", "subject:invoice", "is:unread", "newer_than:7d"',
      }),
    ),
    max_results: Type.Optional(Type.Number({ description: "Max messages (default 10)" })),
    label_ids: Type.Optional(
      Type.Array(Type.String(), { description: 'Label IDs filter (e.g. ["INBOX", "UNREAD"])' }),
    ),
    page_token: Type.Optional(Type.String({ description: "Next page token" })),
  }),

  Type.Object({
    action: Type.Literal("get_message"),
    account_id: Type.Optional(
      Type.String({ description: "Gmail account ID (auto-detected if omitted)" }),
    ),
    message_id: Type.String({ description: "Message ID", minLength: 1 }),
    format: Type.Optional(
      Type.Union([
        Type.Literal("full"),
        Type.Literal("metadata"),
        Type.Literal("minimal"),
        Type.Literal("raw"),
      ], { description: 'Response format (default "full")' }),
    ),
  }),

  Type.Object({
    action: Type.Literal("send_mail"),
    account_id: Type.Optional(
      Type.String({ description: "Gmail account ID (auto-detected if omitted)" }),
    ),
    to: Type.String({ description: "Recipient email address", minLength: 1 }),
    subject: Type.String({ description: "Email subject", minLength: 1 }),
    body: Type.String({ description: "Email body (plain text)", minLength: 1 }),
    cc: Type.Optional(Type.String({ description: "CC email address" })),
    from: Type.Optional(Type.String({ description: "From address (if send-as configured)" })),
  }),

  Type.Object({
    action: Type.Literal("search_messages"),
    account_id: Type.Optional(
      Type.String({ description: "Gmail account ID (auto-detected if omitted)" }),
    ),
    query: Type.String({
      description: "Gmail search query",
      minLength: 1,
    }),
    max_results: Type.Optional(Type.Number({ description: "Max results (default 10)" })),
  }),

  Type.Object({
    action: Type.Literal("list_labels"),
    account_id: Type.Optional(
      Type.String({ description: "Gmail account ID (auto-detected if omitted)" }),
    ),
  }),

  Type.Object({
    action: Type.Literal("mark_as_read"),
    account_id: Type.Optional(
      Type.String({ description: "Gmail account ID (auto-detected if omitted)" }),
    ),
    message_id: Type.String({ description: "Message ID", minLength: 1 }),
  }),

  Type.Object({
    action: Type.Literal("trash_message"),
    account_id: Type.Optional(
      Type.String({ description: "Gmail account ID (auto-detected if omitted)" }),
    ),
    message_id: Type.String({ description: "Message ID", minLength: 1 }),
  }),
]);

export type OfficeGmailParams = Static<typeof OfficeGmailSchema>;
