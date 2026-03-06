import { Type, type Static } from "@sinclair/typebox";

/**
 * mx_google_tasks tool schema
 *
 * Google Tasks integration via Google Tasks API.
 */
export const OfficeGoogleTasksSchema = Type.Union([
  Type.Object({
    action: Type.Literal("list_task_lists"),
    account_id: Type.Optional(
      Type.String({ description: "Google Tasks account ID (auto-detected if omitted)" }),
    ),
    max_results: Type.Optional(Type.Number({ description: "Max results" })),
  }),

  Type.Object({
    action: Type.Literal("create_task_list"),
    account_id: Type.Optional(
      Type.String({ description: "Google Tasks account ID (auto-detected if omitted)" }),
    ),
    title: Type.String({ description: "Task list title", minLength: 1 }),
  }),

  Type.Object({
    action: Type.Literal("delete_task_list"),
    account_id: Type.Optional(
      Type.String({ description: "Google Tasks account ID (auto-detected if omitted)" }),
    ),
    task_list_id: Type.String({ description: "Task list ID", minLength: 1 }),
  }),

  Type.Object({
    action: Type.Literal("list_tasks"),
    account_id: Type.Optional(
      Type.String({ description: "Google Tasks account ID (auto-detected if omitted)" }),
    ),
    task_list_id: Type.String({ description: "Task list ID", minLength: 1 }),
    max_results: Type.Optional(Type.Number({ description: "Max results" })),
    show_completed: Type.Optional(Type.Boolean({ description: "Include completed tasks" })),
    show_hidden: Type.Optional(Type.Boolean({ description: "Include hidden tasks" })),
    due_min: Type.Optional(Type.String({ description: "Min due date (RFC 3339)" })),
    due_max: Type.Optional(Type.String({ description: "Max due date (RFC 3339)" })),
    page_token: Type.Optional(Type.String({ description: "Next page token" })),
  }),

  Type.Object({
    action: Type.Literal("get_task"),
    account_id: Type.Optional(
      Type.String({ description: "Google Tasks account ID (auto-detected if omitted)" }),
    ),
    task_list_id: Type.String({ description: "Task list ID", minLength: 1 }),
    task_id: Type.String({ description: "Task ID", minLength: 1 }),
  }),

  Type.Object({
    action: Type.Literal("create_task"),
    account_id: Type.Optional(
      Type.String({ description: "Google Tasks account ID (auto-detected if omitted)" }),
    ),
    task_list_id: Type.String({ description: "Task list ID", minLength: 1 }),
    title: Type.String({ description: "Task title", minLength: 1 }),
    notes: Type.Optional(Type.String({ description: "Task notes/description" })),
    due: Type.Optional(Type.String({ description: "Due date (YYYY-MM-DD or RFC 3339)" })),
  }),

  Type.Object({
    action: Type.Literal("update_task"),
    account_id: Type.Optional(
      Type.String({ description: "Google Tasks account ID (auto-detected if omitted)" }),
    ),
    task_list_id: Type.String({ description: "Task list ID", minLength: 1 }),
    task_id: Type.String({ description: "Task ID", minLength: 1 }),
    title: Type.Optional(Type.String({ description: "New title" })),
    notes: Type.Optional(Type.String({ description: "New notes" })),
    due: Type.Optional(Type.String({ description: "New due date (YYYY-MM-DD or RFC 3339)" })),
    status: Type.Optional(
      Type.Union([Type.Literal("needsAction"), Type.Literal("completed")]),
    ),
  }),

  Type.Object({
    action: Type.Literal("complete_task"),
    account_id: Type.Optional(
      Type.String({ description: "Google Tasks account ID (auto-detected if omitted)" }),
    ),
    task_list_id: Type.String({ description: "Task list ID", minLength: 1 }),
    task_id: Type.String({ description: "Task ID", minLength: 1 }),
  }),

  Type.Object({
    action: Type.Literal("delete_task"),
    account_id: Type.Optional(
      Type.String({ description: "Google Tasks account ID (auto-detected if omitted)" }),
    ),
    task_list_id: Type.String({ description: "Task list ID", minLength: 1 }),
    task_id: Type.String({ description: "Task ID", minLength: 1 }),
  }),
]);

export type OfficeGoogleTasksParams = Static<typeof OfficeGoogleTasksSchema>;
