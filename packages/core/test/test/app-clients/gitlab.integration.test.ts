import { describe, test, expect, beforeAll } from "vitest";
import { GitLabClient } from "../../../src/app-clients/gitlab-client.js";
import {
  CAN_RUN,
  createClient,
  resolveAccountId,
  tolerateServerError,
} from "./_test-helpers.js";

describe.skipIf(!CAN_RUN)("GitLabClient Integration", () => {
  let gitlab: GitLabClient;
  let connected = false;

  beforeAll(async () => {
    const client = createClient();
    const accountId = await resolveAccountId(client, "gitlab");
    if (!accountId) return;
    gitlab = new GitLabClient(client, accountId);
    connected = true;
  });

  test("should get current user", async () => {
    if (!connected) return;
    const user = await tolerateServerError(() => gitlab.getCurrentUser());
    if (!user) return;
    expect(user.username).toBeTruthy();
    console.log(`  ✓ User: ${user.name} (@${user.username})`);
  });

  test("should list user projects", async () => {
    if (!connected) return;
    const projects = await tolerateServerError(() =>
      gitlab.listProjects({ perPage: 5 }),
    );
    if (!projects) return;
    expect(Array.isArray(projects)).toBe(true);
    console.log(`  ✓ Projects: ${projects.length}`);
    for (const p of projects) {
      console.log(`    - ${p.path_with_namespace} (id: ${p.id})`);
    }
  });

  test("should get project detail", async () => {
    if (!connected) return;
    const projects = await gitlab.listProjects({ perPage: 1 });
    if (projects.length === 0) {
      console.log("  ⊘ No projects found");
      return;
    }

    const project = await tolerateServerError(() =>
      gitlab.getProject(projects[0].id),
    );
    if (!project) return;
    expect(project.id).toBe(projects[0].id);
    console.log(
      `  ✓ Project: ${project.path_with_namespace} (default: ${project.default_branch})`,
    );
  });

  test("should list merge requests", async () => {
    if (!connected) return;
    const projects = await gitlab.listProjects({ perPage: 1 });
    if (projects.length === 0) return;

    const mrs = await tolerateServerError(() =>
      gitlab.listMergeRequests(projects[0].id, {
        state: "all",
        perPage: 3,
      }),
    );
    if (!mrs) return;
    expect(Array.isArray(mrs)).toBe(true);
    console.log(
      `  ✓ MRs for ${projects[0].path_with_namespace}: ${mrs.length}`,
    );
    for (const mr of mrs) {
      console.log(`    - !${mr.iid} ${mr.title} (${mr.state})`);
    }
  });

  test("should list issues", async () => {
    if (!connected) return;
    const projects = await gitlab.listProjects({ perPage: 1 });
    if (projects.length === 0) return;

    const issues = await tolerateServerError(() =>
      gitlab.listIssues(projects[0].id, { state: "all", perPage: 3 }),
    );
    if (!issues) return;
    expect(Array.isArray(issues)).toBe(true);
    console.log(
      `  ✓ Issues for ${projects[0].path_with_namespace}: ${issues.length}`,
    );
    for (const i of issues) {
      console.log(`    - #${i.iid} ${i.title} (${i.state})`);
    }
  });

  test("should list pipelines", async () => {
    if (!connected) return;
    const projects = await gitlab.listProjects({ perPage: 1 });
    if (projects.length === 0) return;

    const pipelines = await tolerateServerError(() =>
      gitlab.listPipelines(projects[0].id, { perPage: 3 }),
    );
    if (!pipelines) return;
    expect(Array.isArray(pipelines)).toBe(true);
    console.log(
      `  ✓ Pipelines for ${projects[0].path_with_namespace}: ${pipelines.length}`,
    );
    for (const p of pipelines) {
      console.log(`    - #${p.id} ${p.status} (${p.ref})`);
    }
  });

  test("should list branches", async () => {
    if (!connected) return;
    const projects = await gitlab.listProjects({ perPage: 1 });
    if (projects.length === 0) return;

    const branches = await tolerateServerError(() =>
      gitlab.listBranches(projects[0].id, { perPage: 5 }),
    );
    if (!branches) return;
    expect(Array.isArray(branches)).toBe(true);
    console.log(
      `  ✓ Branches for ${projects[0].path_with_namespace}: ${branches.length}`,
    );
    for (const b of branches) {
      console.log(`    - ${b.name}${b.default ? " (default)" : ""}`);
    }
  });
});
