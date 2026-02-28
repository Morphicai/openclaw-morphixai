import { Type, type Static } from "@sinclair/typebox";

/**
 * mx_gitlab tool schema
 *
 * GitLab integration: projects, merge requests, issues, pipelines, branches.
 */
export const OfficeGitLabSchema = Type.Union([
  Type.Object({
    action: Type.Literal("get_user"),
    account_id: Type.Optional(
      Type.String({ description: "GitLab account ID (auto-detected if omitted)" }),
    ),
  }),

  Type.Object({
    action: Type.Literal("list_projects"),
    account_id: Type.Optional(
      Type.String({ description: "GitLab account ID (auto-detected if omitted)" }),
    ),
    search: Type.Optional(Type.String({ description: "Search by project name" })),
    per_page: Type.Optional(Type.Number({ description: "Results per page (default 20)" })),
    page: Type.Optional(Type.Number({ description: "Page number" })),
    order_by: Type.Optional(Type.String({ description: "Order by field (e.g. created_at, updated_at, name)" })),
    sort: Type.Optional(Type.Union([Type.Literal("asc"), Type.Literal("desc")])),
  }),

  Type.Object({
    action: Type.Literal("get_project"),
    account_id: Type.Optional(
      Type.String({ description: "GitLab account ID (auto-detected if omitted)" }),
    ),
    project: Type.String({
      description: "Project ID (number) or path (e.g. my-group/my-project)",
      minLength: 1,
    }),
  }),

  Type.Object({
    action: Type.Literal("get_merge_request"),
    account_id: Type.Optional(
      Type.String({ description: "GitLab account ID (auto-detected if omitted)" }),
    ),
    project: Type.String({ description: "Project ID or path", minLength: 1 }),
    mr_iid: Type.Number({ description: "Merge request IID" }),
  }),

  Type.Object({
    action: Type.Literal("list_merge_requests"),
    account_id: Type.Optional(
      Type.String({ description: "GitLab account ID (auto-detected if omitted)" }),
    ),
    project: Type.String({ description: "Project ID or path", minLength: 1 }),
    state: Type.Optional(
      Type.Union([
        Type.Literal("opened"),
        Type.Literal("closed"),
        Type.Literal("merged"),
        Type.Literal("all"),
      ]),
    ),
    per_page: Type.Optional(Type.Number({ description: "Results per page (default 20)" })),
    page: Type.Optional(Type.Number({ description: "Page number" })),
  }),

  Type.Object({
    action: Type.Literal("create_merge_request"),
    account_id: Type.Optional(
      Type.String({ description: "GitLab account ID (auto-detected if omitted)" }),
    ),
    project: Type.String({ description: "Project ID or path", minLength: 1 }),
    source_branch: Type.String({ description: "Source branch", minLength: 1 }),
    target_branch: Type.String({ description: "Target branch", minLength: 1 }),
    title: Type.String({ description: "MR title", minLength: 1 }),
    description: Type.Optional(Type.String({ description: "MR description" })),
  }),

  Type.Object({
    action: Type.Literal("approve_merge_request"),
    account_id: Type.Optional(
      Type.String({ description: "GitLab account ID (auto-detected if omitted)" }),
    ),
    project: Type.String({ description: "Project ID or path", minLength: 1 }),
    mr_iid: Type.Number({ description: "Merge request IID" }),
  }),

  Type.Object({
    action: Type.Literal("merge_merge_request"),
    account_id: Type.Optional(
      Type.String({ description: "GitLab account ID (auto-detected if omitted)" }),
    ),
    project: Type.String({ description: "Project ID or path", minLength: 1 }),
    mr_iid: Type.Number({ description: "Merge request IID" }),
  }),

  Type.Object({
    action: Type.Literal("list_issues"),
    account_id: Type.Optional(
      Type.String({ description: "GitLab account ID (auto-detected if omitted)" }),
    ),
    project: Type.String({ description: "Project ID or path", minLength: 1 }),
    state: Type.Optional(
      Type.Union([
        Type.Literal("opened"),
        Type.Literal("closed"),
        Type.Literal("all"),
      ]),
    ),
    labels: Type.Optional(Type.String({ description: "Comma-separated label names" })),
    per_page: Type.Optional(Type.Number({ description: "Results per page (default 20)" })),
    page: Type.Optional(Type.Number({ description: "Page number" })),
  }),

  Type.Object({
    action: Type.Literal("create_issue"),
    account_id: Type.Optional(
      Type.String({ description: "GitLab account ID (auto-detected if omitted)" }),
    ),
    project: Type.String({ description: "Project ID or path", minLength: 1 }),
    title: Type.String({ description: "Issue title", minLength: 1 }),
    description: Type.Optional(Type.String({ description: "Issue description (Markdown)" })),
    labels: Type.Optional(Type.String({ description: "Comma-separated label names" })),
    assignee_ids: Type.Optional(Type.Array(Type.Number(), { description: "Assignee user IDs" })),
  }),

  Type.Object({
    action: Type.Literal("list_pipelines"),
    account_id: Type.Optional(
      Type.String({ description: "GitLab account ID (auto-detected if omitted)" }),
    ),
    project: Type.String({ description: "Project ID or path", minLength: 1 }),
    status: Type.Optional(Type.String({ description: "Pipeline status filter" })),
    ref: Type.Optional(Type.String({ description: "Branch or tag ref" })),
    per_page: Type.Optional(Type.Number({ description: "Results per page (default 20)" })),
  }),

  Type.Object({
    action: Type.Literal("retry_pipeline"),
    account_id: Type.Optional(
      Type.String({ description: "GitLab account ID (auto-detected if omitted)" }),
    ),
    project: Type.String({ description: "Project ID or path", minLength: 1 }),
    pipeline_id: Type.Number({ description: "Pipeline ID" }),
  }),

  Type.Object({
    action: Type.Literal("update_merge_request"),
    account_id: Type.Optional(
      Type.String({ description: "GitLab account ID (auto-detected if omitted)" }),
    ),
    project: Type.String({ description: "Project ID or path", minLength: 1 }),
    mr_iid: Type.Number({ description: "Merge request IID" }),
    title: Type.Optional(Type.String({ description: "New MR title" })),
    description: Type.Optional(Type.String({ description: "New MR description" })),
    target_branch: Type.Optional(Type.String({ description: "New target branch" })),
    reviewer_ids: Type.Optional(
      Type.Array(Type.Number(), { description: "GitLab user IDs to set as reviewers (use search_users to find IDs)" }),
    ),
    assignee_ids: Type.Optional(
      Type.Array(Type.Number(), { description: "GitLab user IDs to set as assignees" }),
    ),
    labels: Type.Optional(Type.String({ description: "Comma-separated label names" })),
  }),

  Type.Object({
    action: Type.Literal("search_users"),
    account_id: Type.Optional(
      Type.String({ description: "GitLab account ID (auto-detected if omitted)" }),
    ),
    search: Type.String({ description: "Search term (username, name, or email)", minLength: 1 }),
    per_page: Type.Optional(Type.Number({ description: "Results per page (default 10)" })),
  }),

  Type.Object({
    action: Type.Literal("list_branches"),
    account_id: Type.Optional(
      Type.String({ description: "GitLab account ID (auto-detected if omitted)" }),
    ),
    project: Type.String({ description: "Project ID or path", minLength: 1 }),
    search: Type.Optional(Type.String({ description: "Search by branch name" })),
    per_page: Type.Optional(Type.Number({ description: "Results per page (default 20)" })),
  }),
]);

export type OfficeGitLabParams = Static<typeof OfficeGitLabSchema>;
