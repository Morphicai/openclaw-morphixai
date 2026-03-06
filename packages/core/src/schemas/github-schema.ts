import { Type, type Static } from "@sinclair/typebox";

/**
 * mx_github tool schema
 *
 * GitHub integration: repos, issues, pull requests, workflow runs.
 */
export const OfficeGitHubSchema = Type.Union([
  Type.Object({
    action: Type.Literal("get_user"),
    account_id: Type.Optional(
      Type.String({ description: "GitHub account ID (auto-detected if omitted)" }),
    ),
  }),

  Type.Object({
    action: Type.Literal("list_repos"),
    account_id: Type.Optional(
      Type.String({ description: "GitHub account ID (auto-detected if omitted)" }),
    ),
    sort: Type.Optional(
      Type.Union([
        Type.Literal("created"),
        Type.Literal("updated"),
        Type.Literal("pushed"),
        Type.Literal("full_name"),
      ]),
    ),
    type: Type.Optional(
      Type.Union([
        Type.Literal("all"),
        Type.Literal("owner"),
        Type.Literal("public"),
        Type.Literal("private"),
        Type.Literal("member"),
      ]),
    ),
    per_page: Type.Optional(Type.Number({ description: "Results per page (default 30)" })),
    page: Type.Optional(Type.Number({ description: "Page number" })),
  }),

  Type.Object({
    action: Type.Literal("get_repo"),
    account_id: Type.Optional(
      Type.String({ description: "GitHub account ID (auto-detected if omitted)" }),
    ),
    repo: Type.String({
      description: 'Repository in "owner/repo" format',
      minLength: 1,
    }),
  }),

  Type.Object({
    action: Type.Literal("list_issues"),
    account_id: Type.Optional(
      Type.String({ description: "GitHub account ID (auto-detected if omitted)" }),
    ),
    repo: Type.String({ description: 'Repository in "owner/repo" format', minLength: 1 }),
    state: Type.Optional(
      Type.Union([Type.Literal("open"), Type.Literal("closed"), Type.Literal("all")]),
    ),
    labels: Type.Optional(Type.String({ description: "Comma-separated label names" })),
    per_page: Type.Optional(Type.Number({ description: "Results per page (default 30)" })),
    page: Type.Optional(Type.Number({ description: "Page number" })),
  }),

  Type.Object({
    action: Type.Literal("create_issue"),
    account_id: Type.Optional(
      Type.String({ description: "GitHub account ID (auto-detected if omitted)" }),
    ),
    repo: Type.String({ description: 'Repository in "owner/repo" format', minLength: 1 }),
    title: Type.String({ description: "Issue title", minLength: 1 }),
    body: Type.Optional(Type.String({ description: "Issue body (Markdown)" })),
    labels: Type.Optional(Type.Array(Type.String(), { description: "Label names" })),
    assignees: Type.Optional(Type.Array(Type.String(), { description: "Assignee usernames" })),
  }),

  Type.Object({
    action: Type.Literal("update_issue"),
    account_id: Type.Optional(
      Type.String({ description: "GitHub account ID (auto-detected if omitted)" }),
    ),
    repo: Type.String({ description: 'Repository in "owner/repo" format', minLength: 1 }),
    issue_number: Type.Number({ description: "Issue number" }),
    title: Type.Optional(Type.String({ description: "New title" })),
    body: Type.Optional(Type.String({ description: "New body" })),
    state: Type.Optional(Type.String({ description: 'State: "open" or "closed"' })),
    labels: Type.Optional(Type.Array(Type.String(), { description: "Replace labels" })),
  }),

  Type.Object({
    action: Type.Literal("list_pulls"),
    account_id: Type.Optional(
      Type.String({ description: "GitHub account ID (auto-detected if omitted)" }),
    ),
    repo: Type.String({ description: 'Repository in "owner/repo" format', minLength: 1 }),
    state: Type.Optional(
      Type.Union([Type.Literal("open"), Type.Literal("closed"), Type.Literal("all")]),
    ),
    per_page: Type.Optional(Type.Number({ description: "Results per page (default 30)" })),
    page: Type.Optional(Type.Number({ description: "Page number" })),
  }),

  Type.Object({
    action: Type.Literal("create_pull"),
    account_id: Type.Optional(
      Type.String({ description: "GitHub account ID (auto-detected if omitted)" }),
    ),
    repo: Type.String({ description: 'Repository in "owner/repo" format', minLength: 1 }),
    title: Type.String({ description: "PR title", minLength: 1 }),
    head: Type.String({ description: "Head branch", minLength: 1 }),
    base: Type.String({ description: "Base branch", minLength: 1 }),
    body: Type.Optional(Type.String({ description: "PR body (Markdown)" })),
  }),

  Type.Object({
    action: Type.Literal("list_workflow_runs"),
    account_id: Type.Optional(
      Type.String({ description: "GitHub account ID (auto-detected if omitted)" }),
    ),
    repo: Type.String({ description: 'Repository in "owner/repo" format', minLength: 1 }),
    status: Type.Optional(Type.String({ description: "Status filter" })),
    per_page: Type.Optional(Type.Number({ description: "Results per page (default 10)" })),
  }),

  Type.Object({
    action: Type.Literal("trigger_workflow"),
    account_id: Type.Optional(
      Type.String({ description: "GitHub account ID (auto-detected if omitted)" }),
    ),
    repo: Type.String({ description: 'Repository in "owner/repo" format', minLength: 1 }),
    workflow_id: Type.Union([Type.String(), Type.Number()], {
      description: "Workflow file name or ID",
    }),
    ref: Type.String({ description: "Branch or tag ref to run on", minLength: 1 }),
    inputs: Type.Optional(
      Type.Record(Type.String(), Type.Any(), { description: "Workflow inputs" }),
    ),
  }),
]);

export type OfficeGitHubParams = Static<typeof OfficeGitHubSchema>;
