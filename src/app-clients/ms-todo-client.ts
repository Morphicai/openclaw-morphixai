/**
 * Microsoft To Do Client
 *
 * Wraps MorphixAI Pipedream proxy for Microsoft Graph API (To Do).
 * URL pattern: https://graph.microsoft.com/v1.0/me/todo/...
 */
import type { BaibianClient } from "../baibian-client.js";
import { BaseAppClient } from "./base-app-client.js";

export interface MsTodoList {
  id: string;
  displayName: string;
  isOwner: boolean;
  isShared: boolean;
  wellknownListName?: string;
}

export interface MsTodoTask {
  id: string;
  title: string;
  status: "notStarted" | "inProgress" | "completed" | "waitingOnOthers" | "deferred";
  importance: "low" | "normal" | "high";
  body?: { content: string; contentType: string };
  dueDateTime?: { dateTime: string; timeZone: string };
  completedDateTime?: { dateTime: string; timeZone: string };
  createdDateTime: string;
  lastModifiedDateTime: string;
  isReminderOn: boolean;
}

export class MsTodoClient extends BaseAppClient {
  constructor(baibian: BaibianClient, accountId: string) {
    super(baibian, accountId);
  }

  protected resolveUrl(path: string): string {
    return `https://graph.microsoft.com/v1.0${path}`;
  }

  // ─── Task Lists ───

  async listTaskLists(): Promise<{ value: MsTodoList[] }> {
    return this.get("/me/todo/lists");
  }

  async getTaskList(listId: string): Promise<MsTodoList> {
    return this.get<MsTodoList>(`/me/todo/lists/${listId}`);
  }

  async createTaskList(displayName: string): Promise<MsTodoList> {
    return this.post<MsTodoList>("/me/todo/lists", { displayName });
  }

  // ─── Tasks ───

  async listTasks(
    listId: string,
    options?: {
      top?: number;
      skip?: number;
      filter?: string;
      orderBy?: string;
    },
  ): Promise<{ value: MsTodoTask[] }> {
    const params: Record<string, any> = {};
    if (options?.top) params.$top = options.top;
    if (options?.skip) params.$skip = options.skip;
    if (options?.filter) params.$filter = options.filter;
    if (options?.orderBy) params.$orderby = options.orderBy;
    return this.get(`/me/todo/lists/${listId}/tasks`, params);
  }

  async getTask(listId: string, taskId: string): Promise<MsTodoTask> {
    return this.get<MsTodoTask>(
      `/me/todo/lists/${listId}/tasks/${taskId}`,
    );
  }

  async createTask(
    listId: string,
    options: {
      title: string;
      body?: string;
      importance?: "low" | "normal" | "high";
      dueDate?: string; // ISO 8601 date string
      isReminderOn?: boolean;
    },
  ): Promise<MsTodoTask> {
    const task: Record<string, any> = {
      title: options.title,
    };
    if (options.body) {
      task.body = { content: options.body, contentType: "text" };
    }
    if (options.importance) task.importance = options.importance;
    if (options.dueDate) {
      task.dueDateTime = {
        dateTime: options.dueDate + "T00:00:00",
        timeZone: "UTC",
      };
    }
    if (options.isReminderOn !== undefined) {
      task.isReminderOn = options.isReminderOn;
    }
    return this.post<MsTodoTask>(
      `/me/todo/lists/${listId}/tasks`,
      task,
    );
  }

  async updateTask(
    listId: string,
    taskId: string,
    fields: Partial<{
      title: string;
      status: MsTodoTask["status"];
      importance: MsTodoTask["importance"];
      body: { content: string; contentType: string };
      dueDateTime: { dateTime: string; timeZone: string };
    }>,
  ): Promise<MsTodoTask> {
    return this.patch<MsTodoTask>(
      `/me/todo/lists/${listId}/tasks/${taskId}`,
      fields,
    );
  }

  /**
   * Mark a task as completed.
   */
  async completeTask(
    listId: string,
    taskId: string,
  ): Promise<MsTodoTask> {
    return this.updateTask(listId, taskId, { status: "completed" });
  }

  async deleteTask(listId: string, taskId: string): Promise<void> {
    await this.del(`/me/todo/lists/${listId}/tasks/${taskId}`);
  }
}
