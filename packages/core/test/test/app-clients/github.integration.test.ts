import { describe, test, expect, beforeAll } from "vitest";
import { GitHubClient } from "../../../src/app-clients/github-client.js";
import {
  CAN_RUN,
  createClient,
  resolveAccountId,
  tolerateServerError,
} from "./_test-helpers.js";

describe.skipIf(!CAN_RUN)("GitHubClient Integration", () => {
  let github: GitHubClient;
  let connected = false;

  beforeAll(async () => {
    const client = createClient();
    const accountId = await resolveAccountId(client, "github");
    if (!accountId) return;
    github = new GitHubClient(client, accountId);
    connected = true;
  });

  test("should get current user", async () => {
    if (!connected) return;
    const user = await tolerateServerError(() => github.getCurrentUser());
    if (!user) return;
    expect(user.login).toBeTruthy();
    console.log(`  ✓ User: ${user.name} (@${user.login})`);
  });

  test("should list repos", async () => {
    if (!connected) return;
    const repos = await tolerateServerError(() =>
      github.listRepos({ sort: "updated", perPage: 5 }),
    );
    if (!repos) return;
    expect(Array.isArray(repos)).toBe(true);
    console.log(`  ✓ Repos: ${repos.length}`);
    for (const r of repos) {
      console.log(
        `    - ${r.full_name} (${r.private ? "private" : "public"}, ${r.language || "n/a"})`,
      );
    }
  });

  test("should get repo detail", async () => {
    if (!connected) return;
    const repos = await github.listRepos({ perPage: 1 });
    if (repos.length === 0) {
      console.log("  ⊘ No repos found");
      return;
    }

    const repo = await tolerateServerError(() =>
      github.getRepo(repos[0].full_name),
    );
    if (!repo) return;
    expect(repo.full_name).toBe(repos[0].full_name);
    console.log(
      `  ✓ Repo: ${repo.full_name} (default: ${repo.default_branch}, ★ ${repo.stargazers_count})`,
    );
  });

  test("should list issues (excluding PRs)", async () => {
    if (!connected) return;
    const repos = await github.listRepos({ perPage: 1 });
    if (repos.length === 0) return;

    const issues = await tolerateServerError(() =>
      github.listIssues(repos[0].full_name, { state: "all", perPage: 5 }),
    );
    if (!issues) return;
    expect(Array.isArray(issues)).toBe(true);
    // All returned items should NOT have pull_request
    for (const i of issues) {
      expect(i.pull_request).toBeUndefined();
    }
    console.log(
      `  ✓ Issues for ${repos[0].full_name}: ${issues.length} (PRs filtered out)`,
    );
    for (const i of issues.slice(0, 3)) {
      console.log(`    - #${i.number} ${i.title} (${i.state})`);
    }
  });

  test("should list pull requests", async () => {
    if (!connected) return;
    const repos = await github.listRepos({ perPage: 1 });
    if (repos.length === 0) return;

    const pulls = await tolerateServerError(() =>
      github.listPulls(repos[0].full_name, { state: "all", perPage: 3 }),
    );
    if (!pulls) return;
    expect(Array.isArray(pulls)).toBe(true);
    console.log(
      `  ✓ PRs for ${repos[0].full_name}: ${pulls.length}`,
    );
    for (const pr of pulls) {
      console.log(`    - #${pr.number} ${pr.title} (${pr.state})`);
    }
  });

  test("should list workflow runs", async () => {
    if (!connected) return;
    const repos = await github.listRepos({ perPage: 1 });
    if (repos.length === 0) return;

    const result = await tolerateServerError(() =>
      github.listWorkflowRuns(repos[0].full_name, { perPage: 3 }),
    );
    if (!result) return;
    console.log(
      `  ✓ Workflow runs for ${repos[0].full_name}: ${result.total_count} total`,
    );
    for (const run of result.workflow_runs) {
      console.log(
        `    - ${run.name} (${run.status}/${run.conclusion || "pending"}) on ${run.head_branch}`,
      );
    }
  });
});
