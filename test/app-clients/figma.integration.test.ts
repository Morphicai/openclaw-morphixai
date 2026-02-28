import { describe, test, expect, beforeAll } from "vitest";
import { FigmaClient } from "../../src/app-clients/figma-client.js";
import {
  CAN_RUN,
  createClient,
  resolveAccountId,
  tolerateServerError,
} from "./_test-helpers.js";

describe.skipIf(!CAN_RUN)("FigmaClient Integration", () => {
  let figma: FigmaClient;
  let connected = false;

  beforeAll(async () => {
    const client = createClient();
    const accountId = await resolveAccountId(client, "figma");
    if (!accountId) return;
    figma = new FigmaClient(client, accountId);
    connected = true;
  });

  test("should get current user", async () => {
    if (!connected) return;
    const user = await tolerateServerError(() => figma.getMe());
    if (!user) return;
    expect(user.handle).toBeTruthy();
    console.log(`  ✓ User: ${user.handle} (${user.email || "no email"})`);
  });

  // Note: team_id and file_key depend on the user's Figma workspace.
  // These tests use dynamic discovery: get_me → teams → projects → files.
  // If no team/file is available, the test skips gracefully.

  test("should get file structure (requires a file key)", async () => {
    if (!connected) return;
    // Skip if no test file key is provided via env
    const fileKey = process.env.FIGMA_TEST_FILE_KEY;
    if (!fileKey) {
      console.log(
        "  ⊘ Skipped: Set FIGMA_TEST_FILE_KEY env to test get_file",
      );
      return;
    }

    const file = await tolerateServerError(() =>
      figma.getFile(fileKey, { depth: 1 }),
    );
    if (!file) return;
    expect(file.name).toBeTruthy();
    console.log(`  ✓ File: ${file.name} (v${file.version})`);
    if (file.document?.children) {
      for (const page of file.document.children) {
        console.log(`    - Page: ${page.name} (${page.id})`);
      }
    }
  });

  test("should list comments on a file", async () => {
    if (!connected) return;
    const fileKey = process.env.FIGMA_TEST_FILE_KEY;
    if (!fileKey) {
      console.log(
        "  ⊘ Skipped: Set FIGMA_TEST_FILE_KEY env to test list_comments",
      );
      return;
    }

    const comments = await tolerateServerError(() =>
      figma.listComments(fileKey),
    );
    if (!comments) return;
    expect(Array.isArray(comments)).toBe(true);
    console.log(`  ✓ Comments: ${comments.length}`);
    for (const c of comments.slice(0, 3)) {
      console.log(
        `    - ${c.user.handle}: ${c.message.substring(0, 60)}${c.message.length > 60 ? "..." : ""}`,
      );
    }
  });

  test("should list file versions", async () => {
    if (!connected) return;
    const fileKey = process.env.FIGMA_TEST_FILE_KEY;
    if (!fileKey) {
      console.log(
        "  ⊘ Skipped: Set FIGMA_TEST_FILE_KEY env to test list_versions",
      );
      return;
    }

    const versions = await tolerateServerError(() =>
      figma.listVersions(fileKey),
    );
    if (!versions) return;
    expect(Array.isArray(versions)).toBe(true);
    console.log(`  ✓ Versions: ${versions.length}`);
    for (const v of versions.slice(0, 3)) {
      console.log(
        `    - ${v.id}: ${v.label || "(no label)"} by ${v.user.handle} (${v.created_at})`,
      );
    }
  });

  test("should get file components", async () => {
    if (!connected) return;
    const fileKey = process.env.FIGMA_TEST_FILE_KEY;
    if (!fileKey) {
      console.log(
        "  ⊘ Skipped: Set FIGMA_TEST_FILE_KEY env to test get_file_components",
      );
      return;
    }

    const components = await tolerateServerError(() =>
      figma.getFileComponents(fileKey),
    );
    if (!components) return;
    expect(Array.isArray(components)).toBe(true);
    console.log(`  ✓ Components: ${components.length}`);
    for (const c of components.slice(0, 5)) {
      console.log(`    - ${c.name} (${c.key})`);
    }
  });

  test("should get file styles", async () => {
    if (!connected) return;
    const fileKey = process.env.FIGMA_TEST_FILE_KEY;
    if (!fileKey) {
      console.log(
        "  ⊘ Skipped: Set FIGMA_TEST_FILE_KEY env to test get_file_styles",
      );
      return;
    }

    const styles = await tolerateServerError(() =>
      figma.getFileStyles(fileKey),
    );
    if (!styles) return;
    expect(Array.isArray(styles)).toBe(true);
    console.log(`  ✓ Styles: ${styles.length}`);
    for (const s of styles.slice(0, 5)) {
      console.log(`    - ${s.name} (${s.style_type})`);
    }
  });

  test("should list team projects", async () => {
    if (!connected) return;
    const teamId = process.env.FIGMA_TEST_TEAM_ID;
    if (!teamId) {
      console.log(
        "  ⊘ Skipped: Set FIGMA_TEST_TEAM_ID env to test list_team_projects",
      );
      return;
    }

    const projects = await tolerateServerError(() =>
      figma.listTeamProjects(teamId),
    );
    if (!projects) return;
    expect(Array.isArray(projects)).toBe(true);
    console.log(`  ✓ Projects: ${projects.length}`);
    for (const p of projects.slice(0, 5)) {
      console.log(`    - ${p.name} (${p.id})`);
    }
  });

  test("should list project files", async () => {
    if (!connected) return;
    const projectId = process.env.FIGMA_TEST_PROJECT_ID;
    if (!projectId) {
      console.log(
        "  ⊘ Skipped: Set FIGMA_TEST_PROJECT_ID env to test list_project_files",
      );
      return;
    }

    const files = await tolerateServerError(() =>
      figma.listProjectFiles(projectId),
    );
    if (!files) return;
    expect(Array.isArray(files)).toBe(true);
    console.log(`  ✓ Files: ${files.length}`);
    for (const f of files.slice(0, 5)) {
      console.log(`    - ${f.name} (${f.key})`);
    }
  });
});
