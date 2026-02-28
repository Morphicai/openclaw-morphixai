import { Type, type Static } from "@sinclair/typebox";

/**
 * office_ms_todo tool schema
 *
 * Microsoft To Do integration via Microsoft Graph API.
 */
export const OfficeMsTodoSchema = Type.Union([
  Type.Object({
    action: Type.Literal("list_task_lists"),
    account_id: Type.Optional(
      Type.String({ description: "MS To Do account ID (auto-detected if omitted)" }),
    ),
  }),

  Type.Object({
    action: Type.Literal("create_task_list"),
    account_id: Type.Optional(
      Type.String({ description: "MS To Do account ID (auto-detected if omitted)" }),
    ),
    display_name: Type.String({ description: "Task list name", minLength: 1 }),
  }),

  Type.Object({
    action: Type.Literal("list_tasks"),
    account_id: Type.Optional(
      Type.String({ description: "MS To Do account ID (auto-detected if omitted)" }),
    ),
    list_id: Type.String({ description: "Task list ID", minLength: 1 }),
    top: Type.Optional(Type.Number({ description: "Max tasks to return" })),
    filter: Type.Optional(Type.String({ description: "OData $filter expression" })),
    order_by: Type.Optional(Type.String({ description: "Sort order" })),
  }),

  Type.Object({
    action: Type.Literal("get_task"),
    account_id: Type.Optional(
      Type.String({ description: "MS To Do account ID (auto-detected if omitted)" }),
    ),
    list_id: Type.String({ description: "Task list ID", minLength: 1 }),
    task_id: Type.String({ description: "Task ID", minLength: 1 }),
  }),

  Type.Object({
    action: Type.Literal("create_task"),
    account_id: Type.Optional(
      Type.String({ description: "MS To Do account ID (auto-detected if omitted)" }),
    ),
    list_id: Type.String({ description: "Task list ID", minLength: 1 }),
    title: Type.String({ description: "Task title", minLength: 1 }),
    body: Type.Optional(Type.String({ description: "Task body/notes" })),
    importance: Type.Optional(
      Type.Union([Type.Literal("low"), Type.Literal("normal"), Type.Literal("high")]),
    ),
    due_date: Type.Optional(Type.String({ description: "Due date (YYYY-MM-DD)" })),
    is_reminder_on: Type.Optional(Type.Boolean({ description: "Enable reminder" })),
  }),

  Type.Object({
    action: Type.Literal("update_task"),
    account_id: Type.Optional(
      Type.String({ description: "MS To Do account ID (auto-detected if omitted)" }),
    ),
    list_id: Type.String({ description: "Task list ID", minLength: 1 }),
    task_id: Type.String({ description: "Task ID", minLength: 1 }),
    title: Type.Optional(Type.String({ description: "New title" })),
    status: Type.Optional(
      Type.Union([
        Type.Literal("notStarted"),
        Type.Literal("inProgress"),
        Type.Literal("completed"),
        Type.Literal("waitingOnOthers"),
        Type.Literal("deferred"),
      ]),
    ),
    importance: Type.Optional(
      Type.Union([Type.Literal("low"), Type.Literal("normal"), Type.Literal("high")]),
    ),
  }),

  Type.Object({
    action: Type.Literal("complete_task"),
    account_id: Type.Optional(
      Type.String({ description: "MS To Do account ID (auto-detected if omitted)" }),
    ),
    list_id: Type.String({ description: "Task list ID", minLength: 1 }),
    task_id: Type.String({ description: "Task ID", minLength: 1 }),
  }),

  Type.Object({
    action: Type.Literal("delete_task"),
    account_id: Type.Optional(
      Type.String({ description: "MS To Do account ID (auto-detected if omitted)" }),
    ),
    list_id: Type.String({ description: "Task list ID", minLength: 1 }),
    task_id: Type.String({ description: "Task ID", minLength: 1 }),
  }),
]);

export type OfficeMsTodoParams = Static<typeof OfficeMsTodoSchema>;
