import { describe, test, expect, beforeAll } from "vitest";
import { ConfluenceClient } from "../../../src/app-clients/confluence-client.js";
import {
  CAN_RUN,
  createClient,
  resolveAccountId,
  tolerateServerError,
} from "./_test-helpers.js";

describe.skipIf(!CAN_RUN)("ConfluenceClient Integration", () => {
  let confluence: ConfluenceClient;
  let connected = false;

  beforeAll(async () => {
    const client = createClient();
    const accountId = await resolveAccountId(client, "confluence");
    if (!accountId) return;
    confluence = new ConfluenceClient(client, accountId);
    connected = true;
  });

  test("should resolve cloudId and get accessible sites", async () => {
    if (!connected) return;
    const sites = await confluence.getAccessibleSites();
    expect(sites.length).toBeGreaterThan(0);
    console.log(
      `  ✓ Site: ${sites[0].name} (${sites[0].url}), cloudId: ${sites[0].id}`,
    );
  });

  test("should list spaces", async () => {
    if (!connected) return;
    const result = await tolerateServerError(() =>
      confluence.listSpaces({ limit: 10 }),
    );
    if (!result) return;
    expect(result.results).toBeDefined();
    console.log(`  ✓ Spaces: ${result.results.length}`);
    for (const s of result.results.slice(0, 5)) {
      console.log(`    - [${s.key}] ${s.name} (type: ${s.type})`);
    }
  });

  test("should list pages", async () => {
    if (!connected) return;
    const result = await tolerateServerError(() =>
      confluence.listPages({ limit: 5 }),
    );
    if (!result) return;
    expect(result.results).toBeDefined();
    console.log(`  ✓ Pages: ${result.results.length}`);
    for (const p of result.results.slice(0, 5)) {
      console.log(`    - ${p.title} (id: ${p.id}, spaceId: ${p.spaceId})`);
    }
  });

  test("should get page detail", async () => {
    if (!connected) return;
    const pages = await confluence.listPages({ limit: 1 });
    if (!pages.results?.length) {
      console.log("  ⊘ No pages found, skipping");
      return;
    }

    const page = await tolerateServerError(() =>
      confluence.getPage(pages.results[0].id, { bodyFormat: "storage" }),
    );
    if (!page) return;
    expect(page.id).toBeTruthy();
    expect(page.title).toBeTruthy();
    console.log(
      `  ✓ Page: "${page.title}" (version: ${page.version?.number}, status: ${page.status})`,
    );
  });

  test("should list pages in a specific space", async () => {
    if (!connected) return;
    const spaces = await confluence.listSpaces({ limit: 1 });
    if (!spaces.results?.length) {
      console.log("  ⊘ No spaces found, skipping");
      return;
    }

    const result = await tolerateServerError(() =>
      confluence.listPages({ spaceId: spaces.results[0].id, limit: 5 }),
    );
    if (!result) return;
    expect(result.results).toBeDefined();
    console.log(
      `  ✓ Pages in "${spaces.results[0].name}": ${result.results.length}`,
    );
    for (const p of result.results.slice(0, 3)) {
      console.log(`    - ${p.title}`);
    }
  });
});
