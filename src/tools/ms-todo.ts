import type { OpenClawPluginApi } from "openclaw/plugin-sdk";
import { OfficeMsTodoSchema, type OfficeMsTodoParams } from "../schemas/ms-todo-schema.js";
import { MsTodoClient } from "../app-clients/ms-todo-client.js";
import { resolveConfig, resolveAppAccount, AppNotConnectedError, NO_API_KEY_ERROR, CONNECTIONS_URL } from "./_tool-helpers.js";
import { BaibianClient, BaibianAPIError } from "../baibian-client.js";
import { json } from "../helpers.js";

const APP_SLUG = "microsofttodo";

export function registerOfficeMsTodoTool(api: OpenClawPluginApi) {
  api.registerTool(
    {
      name: "mx_ms_todo",
      label: "Microsoft To Do",
      description:
        "Microsoft To Do integration: manage task lists and tasks. Create, update, complete, and delete tasks. " +
        "Actions: list_task_lists, create_task_list, list_tasks, get_task, create_task, update_task, complete_task, delete_task",
      parameters: OfficeMsTodoSchema,
      async execute(_toolCallId, params) {
        const p = params as OfficeMsTodoParams;

        const config = resolveConfig(api);
        if (!config) {
          return json(NO_API_KEY_ERROR);
        }

        const client = new BaibianClient({ apiKey: config.apiKey, baseUrl: config.baseUrl });

        try {
          const accountId = await resolveAppAccount(client, APP_SLUG, (p as any).account_id);
          const todo = new MsTodoClient(client, accountId);

          switch (p.action) {
            case "list_task_lists":
              return json(await todo.listTaskLists());

            case "create_task_list":
              return json(await todo.createTaskList(p.display_name));

            case "list_tasks":
              return json(
                await todo.listTasks(p.list_id, {
                  top: p.top,
                  filter: p.filter,
                  orderBy: p.order_by,
                }),
              );

            case "get_task":
              return json(await todo.getTask(p.list_id, p.task_id));

            case "create_task":
              return json(
                await todo.createTask(p.list_id, {
                  title: p.title,
                  body: p.body,
                  importance: p.importance,
                  dueDate: p.due_date,
                  isReminderOn: p.is_reminder_on,
                }),
              );

            case "update_task": {
              const fields: Record<string, any> = {};
              if (p.title) fields.title = p.title;
              if (p.status) fields.status = p.status;
              if (p.importance) fields.importance = p.importance;
              return json(await todo.updateTask(p.list_id, p.task_id, fields));
            }

            case "complete_task":
              return json(await todo.completeTask(p.list_id, p.task_id));

            case "delete_task":
              await todo.deleteTask(p.list_id, p.task_id);
              return json({ success: true, message: "Task deleted" });

            default:
              return json({ error: `Unknown action: ${(p as any).action}` });
          }
        } catch (err) {
          if (err instanceof AppNotConnectedError) {
            return json({ error: err.message, action_required: "connect_account", app: APP_SLUG, connect_url: CONNECTIONS_URL });
          }
          if (err instanceof BaibianAPIError) {
            return json({ error: err.message, status: err.statusCode });
          }
          return json({ error: err instanceof Error ? err.message : String(err) });
        }
      },
    },
    { name: "mx_ms_todo" },
  );

  api.logger.info?.("mx_ms_todo: Registered");
}
