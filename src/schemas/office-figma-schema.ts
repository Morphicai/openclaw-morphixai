import { Type, type Static } from "@sinclair/typebox";

/**
 * mx_figma tool schema
 *
 * Figma integration: files, projects, components, styles, comments, images.
 */
export const OfficeFigmaSchema = Type.Union([
  // ─── User ───
  Type.Object({
    action: Type.Literal("get_me"),
    account_id: Type.Optional(
      Type.String({ description: "Figma account ID (auto-detected if omitted)" }),
    ),
  }),

  // ─── Teams & Projects ───
  Type.Object({
    action: Type.Literal("list_team_projects"),
    account_id: Type.Optional(
      Type.String({ description: "Figma account ID (auto-detected if omitted)" }),
    ),
    team_id: Type.String({ description: "Team ID", minLength: 1 }),
  }),

  Type.Object({
    action: Type.Literal("list_project_files"),
    account_id: Type.Optional(
      Type.String({ description: "Figma account ID (auto-detected if omitted)" }),
    ),
    project_id: Type.String({ description: "Project ID", minLength: 1 }),
  }),

  // ─── Files ───
  Type.Object({
    action: Type.Literal("get_file"),
    account_id: Type.Optional(
      Type.String({ description: "Figma account ID (auto-detected if omitted)" }),
    ),
    file_key: Type.String({
      description: "File key from Figma URL (e.g., figma.com/design/{file_key}/...)",
      minLength: 1,
    }),
    depth: Type.Optional(
      Type.Number({ description: "Tree depth: 1=pages only, 2=pages+frames (default: full tree)" }),
    ),
  }),

  Type.Object({
    action: Type.Literal("get_file_nodes"),
    account_id: Type.Optional(
      Type.String({ description: "Figma account ID (auto-detected if omitted)" }),
    ),
    file_key: Type.String({
      description: "File key from Figma URL",
      minLength: 1,
    }),
    node_ids: Type.Array(Type.String(), {
      description: 'Node IDs to fetch (e.g., ["1:2", "3:4"])',
      minItems: 1,
    }),
    depth: Type.Optional(
      Type.Number({ description: "Tree depth for returned nodes" }),
    ),
  }),

  // ─── Images ───
  Type.Object({
    action: Type.Literal("export_images"),
    account_id: Type.Optional(
      Type.String({ description: "Figma account ID (auto-detected if omitted)" }),
    ),
    file_key: Type.String({ description: "File key", minLength: 1 }),
    node_ids: Type.Array(Type.String(), {
      description: "Node IDs to export",
      minItems: 1,
    }),
    format: Type.Optional(
      Type.Union([
        Type.Literal("jpg"),
        Type.Literal("png"),
        Type.Literal("svg"),
        Type.Literal("pdf"),
      ], { description: "Export format (default: png)" }),
    ),
    scale: Type.Optional(
      Type.Number({ description: "Export scale (0.01–4, default: 1)" }),
    ),
  }),

  // ─── Comments ───
  Type.Object({
    action: Type.Literal("list_comments"),
    account_id: Type.Optional(
      Type.String({ description: "Figma account ID (auto-detected if omitted)" }),
    ),
    file_key: Type.String({ description: "File key", minLength: 1 }),
  }),

  Type.Object({
    action: Type.Literal("post_comment"),
    account_id: Type.Optional(
      Type.String({ description: "Figma account ID (auto-detected if omitted)" }),
    ),
    file_key: Type.String({ description: "File key", minLength: 1 }),
    message: Type.String({ description: "Comment message", minLength: 1 }),
    comment_id: Type.Optional(
      Type.String({ description: "Parent comment ID (for replies)" }),
    ),
  }),

  Type.Object({
    action: Type.Literal("delete_comment"),
    account_id: Type.Optional(
      Type.String({ description: "Figma account ID (auto-detected if omitted)" }),
    ),
    file_key: Type.String({ description: "File key", minLength: 1 }),
    comment_id: Type.String({ description: "Comment ID to delete", minLength: 1 }),
  }),

  // ─── Versions ───
  Type.Object({
    action: Type.Literal("list_versions"),
    account_id: Type.Optional(
      Type.String({ description: "Figma account ID (auto-detected if omitted)" }),
    ),
    file_key: Type.String({ description: "File key", minLength: 1 }),
  }),

  // ─── Components ───
  Type.Object({
    action: Type.Literal("get_file_components"),
    account_id: Type.Optional(
      Type.String({ description: "Figma account ID (auto-detected if omitted)" }),
    ),
    file_key: Type.String({ description: "File key", minLength: 1 }),
  }),

  Type.Object({
    action: Type.Literal("get_team_components"),
    account_id: Type.Optional(
      Type.String({ description: "Figma account ID (auto-detected if omitted)" }),
    ),
    team_id: Type.String({ description: "Team ID", minLength: 1 }),
    page_size: Type.Optional(Type.Number({ description: "Results per page" })),
    after: Type.Optional(Type.Number({ description: "Cursor for pagination" })),
  }),

  // ─── Component Sets (Variants) ───
  Type.Object({
    action: Type.Literal("get_file_component_sets"),
    account_id: Type.Optional(
      Type.String({ description: "Figma account ID (auto-detected if omitted)" }),
    ),
    file_key: Type.String({ description: "File key", minLength: 1 }),
  }),

  Type.Object({
    action: Type.Literal("get_team_component_sets"),
    account_id: Type.Optional(
      Type.String({ description: "Figma account ID (auto-detected if omitted)" }),
    ),
    team_id: Type.String({ description: "Team ID", minLength: 1 }),
    page_size: Type.Optional(Type.Number({ description: "Results per page" })),
    after: Type.Optional(Type.Number({ description: "Cursor for pagination" })),
  }),

  // ─── Styles ───
  Type.Object({
    action: Type.Literal("get_file_styles"),
    account_id: Type.Optional(
      Type.String({ description: "Figma account ID (auto-detected if omitted)" }),
    ),
    file_key: Type.String({ description: "File key", minLength: 1 }),
  }),

  Type.Object({
    action: Type.Literal("get_team_styles"),
    account_id: Type.Optional(
      Type.String({ description: "Figma account ID (auto-detected if omitted)" }),
    ),
    team_id: Type.String({ description: "Team ID", minLength: 1 }),
    page_size: Type.Optional(Type.Number({ description: "Results per page" })),
    after: Type.Optional(Type.Number({ description: "Cursor for pagination" })),
  }),
  // ─── Variables (Design Tokens) ───
  Type.Object({
    action: Type.Literal("get_local_variables"),
    account_id: Type.Optional(
      Type.String({ description: "Figma account ID (auto-detected if omitted)" }),
    ),
    file_key: Type.String({ description: "File key", minLength: 1 }),
  }),

  Type.Object({
    action: Type.Literal("get_published_variables"),
    account_id: Type.Optional(
      Type.String({ description: "Figma account ID (auto-detected if omitted)" }),
    ),
    file_key: Type.String({ description: "File key", minLength: 1 }),
  }),
]);

export type OfficeFigmaParams = Static<typeof OfficeFigmaSchema>;
