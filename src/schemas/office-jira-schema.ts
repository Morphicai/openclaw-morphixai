import { Type, type Static } from "@sinclair/typebox";

/**
 * mx_jira tool schema
 *
 * Jira Cloud integration: issues, projects, transitions, comments.
 */
export const OfficeJiraSchema = Type.Union([
  Type.Object({
    action: Type.Literal("get_myself"),
    account_id: Type.Optional(
      Type.String({ description: "Jira account ID (auto-detected if omitted)" }),
    ),
  }),

  Type.Object({
    action: Type.Literal("list_projects"),
    account_id: Type.Optional(
      Type.String({ description: "Jira account ID (auto-detected if omitted)" }),
    ),
    query: Type.Optional(Type.String({ description: "Search by project name" })),
    max_results: Type.Optional(Type.Number({ description: "Max results (default 20)" })),
  }),

  Type.Object({
    action: Type.Literal("search_issues"),
    account_id: Type.Optional(
      Type.String({ description: "Jira account ID (auto-detected if omitted)" }),
    ),
    jql: Type.String({
      description:
        'JQL query string. Must include limiting conditions (e.g. project = X). Example: "project = PROJ ORDER BY updated DESC"',
      minLength: 1,
    }),
    max_results: Type.Optional(Type.Number({ description: "Max results (default 20)" })),
    fields: Type.Optional(
      Type.Array(Type.String(), { description: "Fields to return" }),
    ),
  }),

  Type.Object({
    action: Type.Literal("get_issue"),
    account_id: Type.Optional(
      Type.String({ description: "Jira account ID (auto-detected if omitted)" }),
    ),
    issue_key: Type.String({
      description: "Issue key or ID (e.g. PROJ-123)",
      minLength: 1,
    }),
    fields: Type.Optional(
      Type.Array(Type.String(), { description: "Fields to return" }),
    ),
  }),

  Type.Object({
    action: Type.Literal("create_issue"),
    account_id: Type.Optional(
      Type.String({ description: "Jira account ID (auto-detected if omitted)" }),
    ),
    project: Type.String({ description: "Project key (e.g. PROJ)", minLength: 1 }),
    summary: Type.String({ description: "Issue title", minLength: 1 }),
    issue_type: Type.Optional(
      Type.String({ description: 'Issue type name (default "Task")' }),
    ),
    description: Type.Optional(
      Type.String({ description: "Issue description (supports Markdown, auto-converted to ADF)" }),
    ),
    assignee_account_id: Type.Optional(
      Type.String({ description: "Assignee Jira account ID" }),
    ),
    priority: Type.Optional(Type.String({ description: "Priority name (e.g. High, Medium, Low)" })),
    labels: Type.Optional(Type.Array(Type.String(), { description: "Labels" })),
    duedate: Type.Optional(Type.String({ description: "Due date (YYYY-MM-DD)" })),
  }),

  Type.Object({
    action: Type.Literal("update_issue"),
    account_id: Type.Optional(
      Type.String({ description: "Jira account ID (auto-detected if omitted)" }),
    ),
    issue_key: Type.String({ description: "Issue key or ID", minLength: 1 }),
    fields: Type.Record(Type.String(), Type.Any(), {
      description:
        'Fields to update as key-value pairs. E.g. {"summary": "New title", "description": "New desc"}',
    }),
  }),

  Type.Object({
    action: Type.Literal("transition_issue"),
    account_id: Type.Optional(
      Type.String({ description: "Jira account ID (auto-detected if omitted)" }),
    ),
    issue_key: Type.String({ description: "Issue key or ID", minLength: 1 }),
    target_status: Type.String({
      description: 'Target status name (e.g. "In Progress", "Done"). Auto-looks up transition ID.',
      minLength: 1,
    }),
  }),

  Type.Object({
    action: Type.Literal("get_transitions"),
    account_id: Type.Optional(
      Type.String({ description: "Jira account ID (auto-detected if omitted)" }),
    ),
    issue_key: Type.String({ description: "Issue key or ID", minLength: 1 }),
  }),

  Type.Object({
    action: Type.Literal("add_comment"),
    account_id: Type.Optional(
      Type.String({ description: "Jira account ID (auto-detected if omitted)" }),
    ),
    issue_key: Type.String({ description: "Issue key or ID", minLength: 1 }),
    body: Type.String({
      description: "Comment text (supports Markdown, auto-converted to ADF)",
      minLength: 1,
    }),
  }),
]);

export type OfficeJiraParams = Static<typeof OfficeJiraSchema>;
