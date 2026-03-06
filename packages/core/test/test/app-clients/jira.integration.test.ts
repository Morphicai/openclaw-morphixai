import { describe, test, expect, beforeAll } from "vitest";
import { JiraClient } from "../../../src/app-clients/jira-client.js";
import {
  CAN_RUN,
  createClient,
  resolveAccountId,
  tolerateServerError,
} from "./_test-helpers.js";

describe.skipIf(!CAN_RUN)("JiraClient Integration", () => {
  let jira: JiraClient;
  let connected = false;

  beforeAll(async () => {
    const client = createClient();
    const accountId = await resolveAccountId(client, "jira");
    if (!accountId) return;
    jira = new JiraClient(client, accountId);
    connected = true;
  });

  test("should resolve cloudId and get accessible sites", async () => {
    if (!connected) return;
    const sites = await jira.getAccessibleSites();
    expect(sites.length).toBeGreaterThan(0);
    console.log(
      `  ✓ Site: ${sites[0].name} (${sites[0].url}), cloudId: ${sites[0].id}`,
    );
  });

  test("should get current user", async () => {
    if (!connected) return;
    const me = await tolerateServerError(() => jira.getMyself());
    if (!me) return;
    expect(me.accountId).toBeTruthy();
    console.log(`  ✓ User: ${me.displayName} (${me.accountId})`);
  });

  test("should list projects", async () => {
    if (!connected) return;
    const result = await tolerateServerError(() =>
      jira.listProjects({ maxResults: 5 }),
    );
    if (!result) return;
    expect(result.values).toBeDefined();
    console.log(`  ✓ Projects: ${result.values.length} (total: ${result.total})`);
    for (const p of result.values.slice(0, 3)) {
      console.log(`    - ${p.key} ${p.name}`);
    }
  });

  test("should search issues with JQL", async () => {
    if (!connected) return;
    // Get first project to build a restricted JQL
    const projects = await jira.listProjects({ maxResults: 1 });
    const projectKey = projects.values[0]?.key;
    if (!projectKey) {
      console.log("  ⊘ No projects found, skipping search");
      return;
    }

    const result = await tolerateServerError(() =>
      jira.searchIssues(`project = ${projectKey} ORDER BY updated DESC`, {
        maxResults: 3,
      }),
    );
    if (!result) return;
    expect(result.issues).toBeDefined();
    console.log(`  ✓ Search: ${result.issues.length} issues in ${projectKey}`);
    for (const i of result.issues) {
      console.log(
        `    - ${i.key} | ${i.fields.summary} | ${i.fields.status.name}`,
      );
    }
  });

  test("should get issue detail", async () => {
    if (!connected) return;
    const projects = await jira.listProjects({ maxResults: 1 });
    const projectKey = projects.values[0]?.key;
    if (!projectKey) return;

    const search = await jira.searchIssues(
      `project = ${projectKey} ORDER BY updated DESC`,
      { maxResults: 1 },
    );
    if (search.issues.length === 0) {
      console.log("  ⊘ No issues to get detail for");
      return;
    }

    const issue = await tolerateServerError(() =>
      jira.getIssue(search.issues[0].key),
    );
    if (!issue) return;
    expect(issue.key).toBeTruthy();
    console.log(
      `  ✓ Issue: ${issue.key} | ${issue.fields.summary} | type: ${issue.fields.issuetype?.name}`,
    );
  });

  test("should get transitions for an issue", async () => {
    if (!connected) return;
    const projects = await jira.listProjects({ maxResults: 1 });
    const projectKey = projects.values[0]?.key;
    if (!projectKey) return;

    const search = await jira.searchIssues(
      `project = ${projectKey} ORDER BY updated DESC`,
      { maxResults: 1 },
    );
    if (search.issues.length === 0) return;

    const transitions = await tolerateServerError(() =>
      jira.getTransitions(search.issues[0].key),
    );
    if (!transitions) return;
    expect(Array.isArray(transitions)).toBe(true);
    console.log(
      `  ✓ Transitions for ${search.issues[0].key}: ${transitions.map((t) => `${t.name}→${t.to.name}`).join(", ")}`,
    );
  });

  test("should add comment with ADF conversion", async () => {
    if (!connected) return;
    const projects = await jira.listProjects({ maxResults: 1 });
    const projectKey = projects.values[0]?.key;
    if (!projectKey) return;

    const search = await jira.searchIssues(
      `project = ${projectKey} ORDER BY updated DESC`,
      { maxResults: 1 },
    );
    if (search.issues.length === 0) return;

    const comment = await tolerateServerError(() =>
      jira.addComment(
        search.issues[0].key,
        "[SDK Test] Integration test comment with **bold** and *italic*",
      ),
    );
    if (!comment) return;
    expect(comment.id).toBeTruthy();
    console.log(
      `  ✓ Comment added to ${search.issues[0].key}, id: ${comment.id}`,
    );
  });
});
