import { Type, type Static } from "@sinclair/typebox";

/**
 * office_confluence tool schema
 *
 * Confluence Cloud integration: spaces, pages (v2 API), CQL search (v1 API).
 */
export const OfficeConfluenceSchema = Type.Union([
  Type.Object({
    action: Type.Literal("list_spaces"),
    account_id: Type.Optional(
      Type.String({ description: "Confluence account ID (auto-detected if omitted)" }),
    ),
    limit: Type.Optional(Type.Number({ description: "Max results (default 25)" })),
    type: Type.Optional(
      Type.Union([Type.Literal("global"), Type.Literal("personal")], {
        description: "Space type filter",
      }),
    ),
  }),

  Type.Object({
    action: Type.Literal("get_space"),
    account_id: Type.Optional(
      Type.String({ description: "Confluence account ID (auto-detected if omitted)" }),
    ),
    space_id: Type.String({ description: "Space ID", minLength: 1 }),
  }),

  Type.Object({
    action: Type.Literal("list_pages"),
    account_id: Type.Optional(
      Type.String({ description: "Confluence account ID (auto-detected if omitted)" }),
    ),
    space_id: Type.Optional(Type.String({ description: "Filter pages by space ID" })),
    limit: Type.Optional(Type.Number({ description: "Max results" })),
    sort: Type.Optional(Type.String({ description: "Sort order (e.g. -modified-date)" })),
  }),

  Type.Object({
    action: Type.Literal("get_page"),
    account_id: Type.Optional(
      Type.String({ description: "Confluence account ID (auto-detected if omitted)" }),
    ),
    page_id: Type.String({ description: "Page ID", minLength: 1 }),
    body_format: Type.Optional(
      Type.Union([Type.Literal("storage"), Type.Literal("atlas_doc_format"), Type.Literal("view")], {
        description: "Body format to return (default: no body)",
      }),
    ),
  }),

  Type.Object({
    action: Type.Literal("create_page"),
    account_id: Type.Optional(
      Type.String({ description: "Confluence account ID (auto-detected if omitted)" }),
    ),
    space_id: Type.String({ description: "Space ID to create page in", minLength: 1 }),
    title: Type.String({ description: "Page title", minLength: 1 }),
    body: Type.String({ description: "Page body content (HTML storage format)" }),
    parent_id: Type.Optional(Type.String({ description: "Parent page ID" })),
  }),

  Type.Object({
    action: Type.Literal("update_page"),
    account_id: Type.Optional(
      Type.String({ description: "Confluence account ID (auto-detected if omitted)" }),
    ),
    page_id: Type.String({ description: "Page ID", minLength: 1 }),
    title: Type.String({ description: "Updated title", minLength: 1 }),
    body: Type.String({ description: "Updated body content (HTML storage format)" }),
    version: Type.Number({ description: "New version number (current version + 1)" }),
  }),

  Type.Object({
    action: Type.Literal("delete_page"),
    account_id: Type.Optional(
      Type.String({ description: "Confluence account ID (auto-detected if omitted)" }),
    ),
    page_id: Type.String({ description: "Page ID", minLength: 1 }),
  }),

  Type.Object({
    action: Type.Literal("get_child_pages"),
    account_id: Type.Optional(
      Type.String({ description: "Confluence account ID (auto-detected if omitted)" }),
    ),
    page_id: Type.String({ description: "Parent page ID", minLength: 1 }),
    limit: Type.Optional(Type.Number({ description: "Max results" })),
    sort: Type.Optional(Type.String({ description: "Sort order (e.g. -modified-date)" })),
  }),

  Type.Object({
    action: Type.Literal("get_page_labels"),
    account_id: Type.Optional(
      Type.String({ description: "Confluence account ID (auto-detected if omitted)" }),
    ),
    page_id: Type.String({ description: "Page ID", minLength: 1 }),
    limit: Type.Optional(Type.Number({ description: "Max results" })),
    prefix: Type.Optional(Type.String({ description: "Label prefix filter (e.g. global, my)" })),
  }),

  Type.Object({
    action: Type.Literal("add_page_label"),
    account_id: Type.Optional(
      Type.String({ description: "Confluence account ID (auto-detected if omitted)" }),
    ),
    page_id: Type.String({ description: "Page ID", minLength: 1 }),
    label: Type.String({ description: "Label name to add", minLength: 1 }),
  }),

  Type.Object({
    action: Type.Literal("delete_page_label"),
    account_id: Type.Optional(
      Type.String({ description: "Confluence account ID (auto-detected if omitted)" }),
    ),
    page_id: Type.String({ description: "Page ID", minLength: 1 }),
    label_id: Type.String({ description: "Label ID to remove", minLength: 1 }),
  }),

  Type.Object({
    action: Type.Literal("get_page_comments"),
    account_id: Type.Optional(
      Type.String({ description: "Confluence account ID (auto-detected if omitted)" }),
    ),
    page_id: Type.String({ description: "Page ID", minLength: 1 }),
    limit: Type.Optional(Type.Number({ description: "Max results" })),
    body_format: Type.Optional(
      Type.Union([Type.Literal("storage"), Type.Literal("atlas_doc_format"), Type.Literal("view")], {
        description: "Comment body format",
      }),
    ),
  }),

  Type.Object({
    action: Type.Literal("add_page_comment"),
    account_id: Type.Optional(
      Type.String({ description: "Confluence account ID (auto-detected if omitted)" }),
    ),
    page_id: Type.String({ description: "Page ID to comment on", minLength: 1 }),
    body: Type.String({ description: "Comment body (HTML storage format)", minLength: 1 }),
  }),

  Type.Object({
    action: Type.Literal("search"),
    account_id: Type.Optional(
      Type.String({ description: "Confluence account ID (auto-detected if omitted)" }),
    ),
    cql: Type.String({
      description: 'CQL query string. Example: "type=page AND space.key=SOP AND title~\\"meeting\\"". See Confluence CQL reference.',
      minLength: 1,
    }),
    limit: Type.Optional(Type.Number({ description: "Max results" })),
  }),
]);

export type OfficeConfluenceParams = Static<typeof OfficeConfluenceSchema>;
