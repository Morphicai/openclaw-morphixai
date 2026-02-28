import type { OpenClawPluginApi } from "openclaw/plugin-sdk";
import {
  OfficeGoogleTasksSchema,
  type OfficeGoogleTasksParams,
} from "../schemas/office-google-tasks-schema.js";
import { GoogleTasksClient } from "../app-clients/google-tasks-client.js";
import { resolveConfig, resolveAppAccount, AppNotConnectedError, NO_API_KEY_ERROR, CONNECTIONS_URL } from "./_tool-helpers.js";
import { BaibianClient, BaibianAPIError } from "../baibian-client.js";
import { json } from "../helpers.js";

const APP_SLUG = "google_tasks";

export function registerOfficeGoogleTasksTool(api: OpenClawPluginApi) {
  api.registerTool(
    {
      name: "office_google_tasks",
      label: "Google Tasks",
      description:
        "Google Tasks integration: manage task lists and tasks. Create, update, complete, and delete tasks. " +
        "Actions: list_task_lists, create_task_list, delete_task_list, list_tasks, get_task, create_task, update_task, complete_task, delete_task",
      parameters: OfficeGoogleTasksSchema,
      async execute(_toolCallId, params) {
        const p = params as OfficeGoogleTasksParams;

        const config = resolveConfig(api);
        if (!config) {
          return json(NO_API_KEY_ERROR);
        }

        const client = new BaibianClient({ apiKey: config.apiKey, baseUrl: config.baseUrl });

        try {
          const accountId = await resolveAppAccount(client, APP_SLUG, (p as any).account_id);
          const tasks = new GoogleTasksClient(client, accountId);

          switch (p.action) {
            case "list_task_lists":
              return json(await tasks.listTaskLists({ maxResults: p.max_results }));

            case "create_task_list":
              return json(await tasks.createTaskList(p.title));

            case "delete_task_list":
              await tasks.deleteTaskList(p.task_list_id);
              return json({ success: true, message: "Task list deleted" });

            case "list_tasks":
              return json(
                await tasks.listTasks(p.task_list_id, {
                  maxResults: p.max_results,
                  showCompleted: p.show_completed,
                  showHidden: p.show_hidden,
                  dueMin: p.due_min,
                  dueMax: p.due_max,
                  pageToken: p.page_token,
                }),
              );

            case "get_task":
              return json(await tasks.getTask(p.task_list_id, p.task_id));

            case "create_task":
              return json(
                await tasks.createTask(p.task_list_id, {
                  title: p.title,
                  notes: p.notes,
                  due: p.due,
                }),
              );

            case "update_task":
              return json(
                await tasks.updateTask(p.task_list_id, p.task_id, {
                  title: p.title,
                  notes: p.notes,
                  due: p.due,
                  status: p.status,
                }),
              );

            case "complete_task":
              return json(await tasks.completeTask(p.task_list_id, p.task_id));

            case "delete_task":
              await tasks.deleteTask(p.task_list_id, p.task_id);
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
    { name: "office_google_tasks" },
  );

  api.logger.info?.("office_google_tasks: Registered");
}
