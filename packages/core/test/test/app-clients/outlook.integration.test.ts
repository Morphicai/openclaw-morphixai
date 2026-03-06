import { describe, test, expect, beforeAll } from "vitest";
import { OutlookClient } from "../../../src/app-clients/outlook-client.js";
import {
  CAN_RUN,
  createClient,
  resolveAccountId,
  tolerateServerError,
} from "./_test-helpers.js";

describe.skipIf(!CAN_RUN)("OutlookClient Integration", () => {
  let outlook: OutlookClient;
  let connected = false;

  beforeAll(async () => {
    const client = createClient();
    const accountId = await resolveAccountId(client, "microsoft_outlook");
    if (!accountId) return;
    outlook = new OutlookClient(client, accountId);
    connected = true;
  });

  test("should get current user profile", async () => {
    if (!connected) return;
    const me = await tolerateServerError(() => outlook.getMe());
    if (!me) return;
    expect(me.displayName).toBeTruthy();
    console.log(`  ✓ User: ${me.displayName} (${me.mail})`);
  });

  test("should list mail folders", async () => {
    if (!connected) return;
    const result = await tolerateServerError(() => outlook.listFolders());
    if (!result) return;
    expect(result.value).toBeDefined();
    console.log(`  ✓ Folders: ${result.value.length}`);
    for (const f of result.value.slice(0, 5)) {
      console.log(
        `    - ${f.displayName} (${f.totalItemCount} total, ${f.unreadItemCount} unread)`,
      );
    }
  });

  test("should list inbox messages", async () => {
    if (!connected) return;
    const result = await tolerateServerError(() =>
      outlook.listMessages({ top: 5 }),
    );
    if (!result) return;
    expect(result.value).toBeDefined();
    console.log(`  ✓ Inbox: ${result.value.length} messages`);
    for (const m of result.value) {
      const from = m.from?.emailAddress?.address || "unknown";
      console.log(
        `    - ${m.subject} (from: ${from}, read: ${m.isRead})`,
      );
    }
  });

  test("should get message detail", async () => {
    if (!connected) return;
    const list = await tolerateServerError(() =>
      outlook.listMessages({ top: 1 }),
    );
    if (!list?.value?.length) {
      console.log("  ⊘ No messages in inbox");
      return;
    }

    const msg = await tolerateServerError(() =>
      outlook.getMessage(list.value[0].id),
    );
    if (!msg) return;
    expect(msg.id).toBe(list.value[0].id);
    console.log(
      `  ✓ Message: ${msg.subject} (body: ${msg.body?.content?.length || 0} chars)`,
    );
  });

  test("should search messages", async () => {
    if (!connected) return;
    const result = await tolerateServerError(() =>
      outlook.searchMessages("test", { top: 3 }),
    );
    if (!result) return;
    console.log(`  ✓ Search "test": ${result.value?.length || 0} results`);
  });
});
