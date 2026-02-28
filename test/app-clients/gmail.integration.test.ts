import { describe, test, expect, beforeAll } from "vitest";
import { GmailClient } from "../../src/app-clients/gmail-client.js";
import {
  CAN_RUN,
  createClient,
  resolveAccountId,
  tolerateServerError,
} from "./_test-helpers.js";

describe.skipIf(!CAN_RUN)("GmailClient Integration", () => {
  let gmail: GmailClient;
  let connected = false;

  beforeAll(async () => {
    const client = createClient();
    const accountId = await resolveAccountId(client, "gmail");
    if (!accountId) return;
    gmail = new GmailClient(client, accountId);
    connected = true;
  });

  test("should get profile", async () => {
    if (!connected) return;
    const profile = await tolerateServerError(() => gmail.getProfile());
    if (!profile) return;
    expect(profile.emailAddress).toBeTruthy();
    console.log(
      `  ✓ Profile: ${profile.emailAddress} (${profile.messagesTotal} messages)`,
    );
  });

  test("should list labels", async () => {
    if (!connected) return;
    const result = await tolerateServerError(() => gmail.listLabels());
    if (!result) return;
    expect(result.labels).toBeDefined();
    console.log(`  ✓ Labels: ${result.labels.length}`);
    for (const l of result.labels.slice(0, 5)) {
      console.log(`    - ${l.name} (${l.type})`);
    }
  });

  test("should list messages", async () => {
    if (!connected) return;
    const result = await tolerateServerError(() =>
      gmail.listMessages({ maxResults: 5 }),
    );
    if (!result) return;
    console.log(
      `  ✓ Messages: ${result.messages?.length || 0} (estimate: ${result.resultSizeEstimate})`,
    );
  });

  test("should get message detail", async () => {
    if (!connected) return;
    const list = await gmail.listMessages({ maxResults: 1 });
    if (!list.messages?.length) {
      console.log("  ⊘ No messages");
      return;
    }

    const msg = await tolerateServerError(() =>
      gmail.getMessage(list.messages![0].id),
    );
    if (!msg) return;
    expect(msg.id).toBe(list.messages![0].id);
    const subject = GmailClient.getHeader(msg, "Subject") || "(no subject)";
    const from = GmailClient.getHeader(msg, "From") || "unknown";
    console.log(`  ✓ Message: "${subject}" from ${from}`);
  });

  test("should search messages", async () => {
    if (!connected) return;
    const result = await tolerateServerError(() =>
      gmail.searchMessages("is:unread", 3),
    );
    if (!result) return;
    console.log(
      `  ✓ Search "is:unread": ${result.messages?.length || 0} results`,
    );
  });
});
