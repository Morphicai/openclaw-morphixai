import { Type, type Static } from "@sinclair/typebox";

/**
 * mx_link tool schema
 *
 * Unified third-party account linking and proxy API access
 * via MorphixAI Pipedream integration.
 */
export const OfficeLinkSchema = Type.Union([
  // ─── Account Management ───
  Type.Object({
    action: Type.Literal("list_accounts"),
    app_name: Type.Optional(
      Type.String({ description: "Filter by app name, e.g. jira, gmail, github, gitlab, slack" }),
    ),
    active_only: Type.Optional(
      Type.Boolean({ description: "Return only active accounts (default true)" }),
    ),
  }),

  Type.Object({
    action: Type.Literal("get_account"),
    account_id: Type.String({ description: "Account ID (apn_xxx format)", minLength: 1 }),
  }),

  Type.Object({
    action: Type.Literal("statistics"),
  }),

  Type.Object({
    action: Type.Literal("list_apps"),
    q: Type.Optional(Type.String({ description: "Search by app name" })),
    limit: Type.Optional(Type.Number({ description: "Max number of results" })),
    offset: Type.Optional(Type.Number({ description: "Pagination offset" })),
  }),

  Type.Object({
    action: Type.Literal("connect"),
    app: Type.String({
      description:
        "App name_slug to connect (e.g. jira, gmail, slack, github, gitlab, notion, google_sheets, linear, discord, google_calendar, zoom, outlook). REQUIRED: the generated link will not work without this parameter.",
      minLength: 1,
    }),
    redirect_url: Type.Optional(
      Type.String({ description: "Browser redirect URL after user completes authorization" }),
    ),
  }),

  // ─── Proxy API Calls ───
  Type.Object({
    action: Type.Literal("proxy"),
    account_id: Type.String({ description: "Account ID from list_accounts", minLength: 1 }),
    method: Type.Union(
      [
        Type.Literal("GET"),
        Type.Literal("POST"),
        Type.Literal("PUT"),
        Type.Literal("PATCH"),
        Type.Literal("DELETE"),
      ],
      { description: "HTTP method" },
    ),
    url: Type.String({ description: "Full target API URL (e.g. https://api.github.com/user/repos)", minLength: 1 }),
    headers: Type.Optional(
      Type.Record(Type.String(), Type.String(), { description: "Extra request headers" }),
    ),
    body: Type.Optional(Type.Any({ description: "Request body (for POST/PUT/PATCH)" })),
    params: Type.Optional(
      Type.Record(Type.String(), Type.Any(), { description: "URL query parameters" }),
    ),
  }),

  // ─── Check auth status ───
  Type.Object({
    action: Type.Literal("check_auth"),
  }),
]);

export type OfficeLinkParams = Static<typeof OfficeLinkSchema>;
