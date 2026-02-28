import { describe, test, expect, beforeAll } from "vitest";
import { GoogleTasksClient } from "../../src/app-clients/google-tasks-client.js";
import {
  CAN_RUN,
  createClient,
  resolveAccountId,
  tolerateServerError,
} from "./_test-helpers.js";

describe.skipIf(!CAN_RUN)("GoogleTasksClient Integration", () => {
  let tasks: GoogleTasksClient;
  let connected = false;

  beforeAll(async () => {
    const client = createClient();
    const accountId = await resolveAccountId(client, "google_tasks");
    if (!accountId) return;
    tasks = new GoogleTasksClient(client, accountId);
    connected = true;
  });

  test("should list task lists", async () => {
    if (!connected) return;
    const result = await tolerateServerError(() => tasks.listTaskLists());
    if (!result) return;
    expect(result.items).toBeDefined();
    console.log(`  ✓ Task lists: ${result.items?.length || 0}`);
    for (const l of result.items || []) {
      console.log(`    - ${l.title} (id: ${l.id})`);
    }
  });

  test("should list tasks in default list", async () => {
    if (!connected) return;
    const lists = await tasks.listTaskLists();
    if (!lists.items?.length) {
      console.log("  ⊘ No task lists");
      return;
    }

    const result = await tolerateServerError(() =>
      tasks.listTasks(lists.items![0].id, {
        maxResults: 5,
        showCompleted: true,
      }),
    );
    if (!result) return;
    console.log(
      `  ✓ Tasks in "${lists.items![0].title}": ${result.items?.length || 0}`,
    );
    for (const t of result.items || []) {
      console.log(`    - [${t.status}] ${t.title}`);
    }
  });

  test("should CRUD a task", async () => {
    if (!connected) return;
    const lists = await tasks.listTaskLists();
    if (!lists.items?.length) return;
    const listId = lists.items![0].id;

    // Create
    const created = await tolerateServerError(() =>
      tasks.createTask(listId, {
        title: "[SDK Test] Integration test task",
        notes: "Created by integration test suite",
      }),
    );
    if (!created) return;
    expect(created.id).toBeTruthy();
    expect(created.title).toBe("[SDK Test] Integration test task");
    console.log(`  ✓ Created task: ${created.id}`);

    // Update
    const updated = await tasks.updateTask(listId, created.id, {
      title: "[SDK Test] Updated task",
    });
    expect(updated.title).toBe("[SDK Test] Updated task");
    console.log(`  ✓ Updated task title`);

    // Complete
    const completed = await tasks.completeTask(listId, created.id);
    expect(completed.status).toBe("completed");
    console.log(`  ✓ Completed task`);

    // Delete (cleanup)
    await tasks.deleteTask(listId, created.id);
    console.log(`  ✓ Deleted task (cleanup)`);
  });
});
