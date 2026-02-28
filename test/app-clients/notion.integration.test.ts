import { describe, test, expect, beforeAll } from "vitest";
import { NotionClient } from "../../src/app-clients/notion-client.js";
import {
  CAN_RUN,
  createClient,
  resolveAccountId,
  tolerateServerError,
} from "./_test-helpers.js";

describe.skipIf(!CAN_RUN)("NotionClient Integration", () => {
  let notion: NotionClient;
  let connected = false;

  beforeAll(async () => {
    const client = createClient();
    const accountId = await resolveAccountId(client, "notion");
    if (!accountId) return;
    notion = new NotionClient(client, accountId);
    connected = true;
  });

  test("should get current bot user", async () => {
    if (!connected) return;
    const me = await tolerateServerError(() => notion.getMe());
    if (!me) return;
    expect(me.object).toBe("user");
    expect(me.type).toBe("bot");
    console.log(`  ✓ Bot user: ${me.name || me.id} (type: ${me.type})`);
  });

  test("should search pages", async () => {
    if (!connected) return;
    const result = await tolerateServerError(() =>
      notion.search({ filter: { property: "object", value: "page" }, pageSize: 5 }),
    );
    if (!result) return;
    expect(result.object).toBe("list");
    expect(result.results).toBeDefined();
    console.log(
      `  ✓ Search pages: ${result.results.length} results (has_more: ${result.has_more})`,
    );
    for (const page of result.results.slice(0, 3)) {
      const title =
        (page as any).properties?.title?.title?.[0]?.plain_text ||
        (page as any).properties?.Name?.title?.[0]?.plain_text ||
        "(untitled)";
      console.log(`    - ${title} (${page.id.substring(0, 8)}...)`);
    }
  });

  test("should get page detail and block children", async () => {
    if (!connected) return;
    const search = await notion.search({
      filter: { property: "object", value: "page" },
      pageSize: 1,
    });
    if (search.results.length === 0) {
      console.log("  ⊘ No pages found, skipping");
      return;
    }

    const pageId = search.results[0].id;
    const page = await tolerateServerError(() => notion.getPage(pageId));
    if (!page) return;
    expect(page.object).toBe("page");
    console.log(`  ✓ Page: ${page.url}`);

    const blocks = await tolerateServerError(() =>
      notion.getBlockChildren(pageId, { pageSize: 5 }),
    );
    if (!blocks) return;
    expect(blocks.results).toBeDefined();
    console.log(
      `  ✓ Block children: ${blocks.results.length} blocks (has_more: ${blocks.has_more})`,
    );
    for (const block of blocks.results.slice(0, 3)) {
      console.log(`    - [${block.type}] ${block.id.substring(0, 8)}...`);
    }
  });

  test("should search databases", async () => {
    if (!connected) return;
    const result = await tolerateServerError(() =>
      notion.search({ filter: { property: "object", value: "database" }, pageSize: 5 }),
    );
    if (!result) return;
    expect(result.object).toBe("list");
    console.log(`  ✓ Search databases: ${result.results.length} results`);
    for (const db of result.results.slice(0, 3)) {
      const title = (db as any).title?.[0]?.plain_text || "(untitled)";
      console.log(`    - ${title} (${db.id.substring(0, 8)}...)`);
    }
  });
});
