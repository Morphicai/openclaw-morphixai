/**
 * Google Tasks Client
 *
 * Wraps MorphixAI Pipedream proxy for Google Tasks API.
 * URL pattern: https://tasks.googleapis.com/tasks/v1/...
 */
import type { MorphixClient } from "../morphix-client.js";
import { BaseAppClient } from "./base-app-client.js";

export interface GoogleTaskList {
  id: string;
  title: string;
  updated: string;
  selfLink?: string;
}

export interface GoogleTask {
  id: string;
  title: string;
  status: "needsAction" | "completed";
  notes?: string;
  due?: string; // RFC 3339 date
  completed?: string; // RFC 3339 timestamp
  parent?: string;
  position?: string;
  updated: string;
  selfLink?: string;
  links?: Array<{ type: string; description?: string; link: string }>;
}

export class GoogleTasksClient extends BaseAppClient {
  constructor(morphix: MorphixClient, accountId: string) {
    super(morphix, accountId);
  }

  protected resolveUrl(path: string): string {
    return `https://tasks.googleapis.com/tasks/v1${path}`;
  }

  // ─── Task Lists ───

  async listTaskLists(options?: {
    maxResults?: number;
    pageToken?: string;
  }): Promise<{ items?: GoogleTaskList[]; nextPageToken?: string }> {
    const params: Record<string, any> = {};
    if (options?.maxResults) params.maxResults = options.maxResults;
    if (options?.pageToken) params.pageToken = options.pageToken;
    return this.get("/users/@me/lists", params);
  }

  async getTaskList(taskListId: string): Promise<GoogleTaskList> {
    return this.get<GoogleTaskList>(`/users/@me/lists/${taskListId}`);
  }

  async createTaskList(title: string): Promise<GoogleTaskList> {
    return this.post<GoogleTaskList>("/users/@me/lists", { title });
  }

  async deleteTaskList(taskListId: string): Promise<void> {
    await this.del(`/users/@me/lists/${taskListId}`);
  }

  // ─── Tasks ───

  async listTasks(
    taskListId: string,
    options?: {
      maxResults?: number;
      pageToken?: string;
      showCompleted?: boolean;
      showHidden?: boolean;
      dueMin?: string;
      dueMax?: string;
    },
  ): Promise<{ items?: GoogleTask[]; nextPageToken?: string }> {
    const params: Record<string, any> = {};
    if (options?.maxResults) params.maxResults = options.maxResults;
    if (options?.pageToken) params.pageToken = options.pageToken;
    if (options?.showCompleted !== undefined)
      params.showCompleted = options.showCompleted;
    if (options?.showHidden !== undefined)
      params.showHidden = options.showHidden;
    if (options?.dueMin) params.dueMin = options.dueMin;
    if (options?.dueMax) params.dueMax = options.dueMax;
    return this.get(`/lists/${taskListId}/tasks`, params);
  }

  async getTask(taskListId: string, taskId: string): Promise<GoogleTask> {
    return this.get<GoogleTask>(`/lists/${taskListId}/tasks/${taskId}`);
  }

  async createTask(
    taskListId: string,
    options: {
      title: string;
      notes?: string;
      due?: string; // YYYY-MM-DD or RFC 3339
      status?: "needsAction" | "completed";
    },
  ): Promise<GoogleTask> {
    const task: Record<string, any> = { title: options.title };
    if (options.notes) task.notes = options.notes;
    if (options.due) {
      // Ensure RFC 3339 format
      task.due = options.due.includes("T")
        ? options.due
        : `${options.due}T00:00:00.000Z`;
    }
    if (options.status) task.status = options.status;
    return this.post<GoogleTask>(`/lists/${taskListId}/tasks`, task);
  }

  async updateTask(
    taskListId: string,
    taskId: string,
    fields: Partial<{
      title: string;
      notes: string;
      status: "needsAction" | "completed";
      due: string;
    }>,
  ): Promise<GoogleTask> {
    // Google Tasks API requires PATCH for updates
    if (fields.due && !fields.due.includes("T")) {
      fields.due = `${fields.due}T00:00:00.000Z`;
    }
    return this.patch<GoogleTask>(
      `/lists/${taskListId}/tasks/${taskId}`,
      fields,
    );
  }

  /**
   * Mark a task as completed.
   */
  async completeTask(
    taskListId: string,
    taskId: string,
  ): Promise<GoogleTask> {
    return this.updateTask(taskListId, taskId, { status: "completed" });
  }

  async deleteTask(taskListId: string, taskId: string): Promise<void> {
    await this.del(`/lists/${taskListId}/tasks/${taskId}`);
  }
}
