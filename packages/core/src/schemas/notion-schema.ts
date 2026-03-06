import { Type, type Static } from "@sinclair/typebox";

/**
 * mx_notion tool schema
 *
 * Notion integration: search, pages, databases, blocks.
 */
export const OfficeNotionSchema = Type.Union([
  Type.Object({
    action: Type.Literal("get_me"),
    account_id: Type.Optional(
      Type.String({ description: "Notion account ID (auto-detected if omitted)" }),
    ),
  }),

  Type.Object({
    action: Type.Literal("search"),
    account_id: Type.Optional(
      Type.String({ description: "Notion account ID (auto-detected if omitted)" }),
    ),
    query: Type.Optional(Type.String({ description: "Search query text" })),
    filter_type: Type.Optional(
      Type.Union([Type.Literal("page"), Type.Literal("database")], {
        description: 'Filter by object type: "page" or "database"',
      }),
    ),
    page_size: Type.Optional(Type.Number({ description: "Max results per page (default 20)" })),
    start_cursor: Type.Optional(Type.String({ description: "Pagination cursor from previous response" })),
  }),

  Type.Object({
    action: Type.Literal("get_page"),
    account_id: Type.Optional(
      Type.String({ description: "Notion account ID (auto-detected if omitted)" }),
    ),
    page_id: Type.String({ description: "Page ID (UUID)", minLength: 1 }),
  }),

  Type.Object({
    action: Type.Literal("create_page"),
    account_id: Type.Optional(
      Type.String({ description: "Notion account ID (auto-detected if omitted)" }),
    ),
    parent_type: Type.Union([Type.Literal("page"), Type.Literal("database")], {
      description: 'Parent type: "page" or "database"',
    }),
    parent_id: Type.String({ description: "Parent page or database ID", minLength: 1 }),
    title: Type.String({ description: "Page title", minLength: 1 }),
    children: Type.Optional(
      Type.Array(Type.Any(), { description: "Notion block children (content)" }),
    ),
    properties: Type.Optional(
      Type.Record(Type.String(), Type.Any(), {
        description: "Additional properties (for database pages)",
      }),
    ),
  }),

  Type.Object({
    action: Type.Literal("update_page"),
    account_id: Type.Optional(
      Type.String({ description: "Notion account ID (auto-detected if omitted)" }),
    ),
    page_id: Type.String({ description: "Page ID (UUID)", minLength: 1 }),
    properties: Type.Record(Type.String(), Type.Any(), {
      description: "Properties to update",
    }),
  }),

  Type.Object({
    action: Type.Literal("archive_page"),
    account_id: Type.Optional(
      Type.String({ description: "Notion account ID (auto-detected if omitted)" }),
    ),
    page_id: Type.String({ description: "Page ID (UUID)", minLength: 1 }),
  }),

  Type.Object({
    action: Type.Literal("get_block_children"),
    account_id: Type.Optional(
      Type.String({ description: "Notion account ID (auto-detected if omitted)" }),
    ),
    block_id: Type.String({ description: "Block or page ID (UUID)", minLength: 1 }),
    page_size: Type.Optional(Type.Number({ description: "Max results" })),
    start_cursor: Type.Optional(Type.String({ description: "Pagination cursor" })),
  }),

  Type.Object({
    action: Type.Literal("append_blocks"),
    account_id: Type.Optional(
      Type.String({ description: "Notion account ID (auto-detected if omitted)" }),
    ),
    block_id: Type.String({ description: "Block or page ID (UUID)", minLength: 1 }),
    children: Type.Array(Type.Any(), { description: "Notion block objects to append" }),
  }),

  Type.Object({
    action: Type.Literal("get_database"),
    account_id: Type.Optional(
      Type.String({ description: "Notion account ID (auto-detected if omitted)" }),
    ),
    database_id: Type.String({ description: "Database ID (UUID)", minLength: 1 }),
  }),

  Type.Object({
    action: Type.Literal("query_database"),
    account_id: Type.Optional(
      Type.String({ description: "Notion account ID (auto-detected if omitted)" }),
    ),
    database_id: Type.String({ description: "Database ID (UUID)", minLength: 1 }),
    filter: Type.Optional(Type.Any({ description: "Notion filter object" })),
    sorts: Type.Optional(Type.Array(Type.Any(), { description: "Sort criteria" })),
    page_size: Type.Optional(Type.Number({ description: "Max results" })),
    start_cursor: Type.Optional(Type.String({ description: "Pagination cursor" })),
  }),
]);

export type OfficeNotionParams = Static<typeof OfficeNotionSchema>;
