import { describe, test, expect, beforeAll } from "vitest";
import { MsTodoClient } from "../../src/app-clients/ms-todo-client.js";
import {
  CAN_RUN,
  createClient,
  resolveAccountId,
  tolerateServerError,
} from "./_test-helpers.js";

describe.skipIf(!CAN_RUN)("MsTodoClient Integration", () => {
  let todo: MsTodoClient;
  let connected = false;

  beforeAll(async () => {
    const client = createClient();
    const accountId = await resolveAccountId(client, "microsofttodo");
    if (!accountId) return;
    todo = new MsTodoClient(client, accountId);
    connected = true;
  });

  test("should list task lists", async () => {
    if (!connected) return;
    const result = await tolerateServerError(() => todo.listTaskLists());
    if (!result) return;
    expect(result.value).toBeDefined();
    console.log(`  ✓ Task lists: ${result.value.length}`);
    for (const l of result.value) {
      console.log(
        `    - ${l.displayName} (id: ${l.id.substring(0, 20)}..., shared: ${l.isShared})`,
      );
    }
  });

  test("should list tasks in first list", async () => {
    if (!connected) return;
    const lists = await todo.listTaskLists();
    if (!lists.value?.length) {
      console.log("  ⊘ No task lists found");
      return;
    }

    const result = await tolerateServerError(() =>
      todo.listTasks(lists.value[0].id, { top: 5 }),
    );
    if (!result) return;
    expect(result.value).toBeDefined();
    console.log(
      `  ✓ Tasks in "${lists.value[0].displayName}": ${result.value.length}`,
    );
    for (const t of result.value) {
      console.log(`    - [${t.status}] ${t.title}`);
    }
  });

  test("should CRUD a task", async () => {
    if (!connected) return;
    const lists = await todo.listTaskLists();
    if (!lists.value?.length) return;
    const listId = lists.value[0].id;

    // Create
    const created = await tolerateServerError(() =>
      todo.createTask(listId, {
        title: "[SDK Test] Integration test task",
        body: "This task was created by the integration test suite",
        importance: "normal",
      }),
    );
    if (!created) return;
    expect(created.id).toBeTruthy();
    expect(created.title).toBe("[SDK Test] Integration test task");
    console.log(`  ✓ Created task: ${created.id.substring(0, 20)}...`);

    // Update
    const updated = await todo.updateTask(listId, created.id, {
      title: "[SDK Test] Updated task title",
    });
    expect(updated.title).toBe("[SDK Test] Updated task title");
    console.log(`  ✓ Updated task title`);

    // Complete
    const completed = await todo.completeTask(listId, created.id);
    expect(completed.status).toBe("completed");
    console.log(`  ✓ Completed task`);

    // Delete (cleanup)
    await todo.deleteTask(listId, created.id);
    console.log(`  ✓ Deleted task (cleanup)`);
  });
});
