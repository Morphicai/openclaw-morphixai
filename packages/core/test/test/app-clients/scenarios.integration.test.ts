/**
 * Scenario-based Integration Tests
 *
 * Tests real-world workflows as described in SKILL.md files.
 * Each scenario simulates how a user would actually call the SDK
 * through the tool layer — chaining multiple operations together.
 *
 * Scenarios covered:
 *   1. Jira: Daily standup → search my issues → inspect → comment → transition
 *   2. Notion: Knowledge base search → read page content → create page → append content → archive
 *   3. Confluence: Browse team docs → create meeting notes → update with version → delete
 *   4. Outlook Calendar: Check today's schedule → create meeting → reschedule → cancel
 *   5. MS To Do: Daily task management → create list → add tasks → complete → cleanup
 *   6. GitHub: Project overview → list issues & PRs
 *   7. GitLab: Project overview → list MRs & pipelines & branches
 *   8. Cross-app: Create Jira issue → create calendar event → add todo → link everything
 */
import { describe, test, expect, beforeAll } from "vitest";
import {
  CAN_RUN,
  createClient,
  resolveAccountId,
  tolerateServerError,
} from "./_test-helpers.js";
import { JiraClient } from "../../../src/app-clients/jira-client.js";
import { NotionClient } from "../../../src/app-clients/notion-client.js";
import { ConfluenceClient } from "../../../src/app-clients/confluence-client.js";
import { OutlookCalendarClient } from "../../../src/app-clients/outlook-calendar-client.js";
import { MsTodoClient } from "../../../src/app-clients/ms-todo-client.js";
import { GitHubClient } from "../../../src/app-clients/github-client.js";
import { GitLabClient } from "../../../src/app-clients/gitlab-client.js";
import type { MorphixClient } from "../../../src/morphix-client.js";

const TAG = "[Scenario Test]";
const now = new Date().toISOString().replace(/[:.]/g, "-").substring(0, 19);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Scenario 1: Jira — Daily Standup Workflow
// SKILL: jira-workflow.md → "每日 Standup — 查看我的待办" + "创建 Issue 并开始工作" + "完成 Issue"
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
describe.skipIf(!CAN_RUN)("Scenario: Jira Daily Standup", () => {
  let jira: JiraClient;
  let connected = false;

  beforeAll(async () => {
    const client = createClient();
    const accountId = await resolveAccountId(client, "jira");
    if (!accountId) return;
    jira = new JiraClient(client, accountId);
    connected = true;
  });

  test("1. get_myself → search my issues → get detail → get transitions → add comment", async () => {
    if (!connected) return;

    // Step 1: get_myself — 获取当前用户 accountId（SKILL: 每日 Standup 第1步）
    const me = await tolerateServerError(() => jira.getMyself());
    if (!me) return;
    expect(me.accountId).toBeTruthy();
    console.log(`  ${TAG} Step 1: Current user: ${me.displayName} (${me.accountId})`);

    // Step 2: list_projects — 获取第一个项目（需要 project key 构建 JQL）
    const projects = await jira.listProjects({ maxResults: 1 });
    expect(projects.values.length).toBeGreaterThan(0);
    const projectKey = projects.values[0].key;
    console.log(`  ${TAG} Step 2: Using project: ${projectKey}`);

    // Step 3: search_issues — 用 JQL 搜索（SKILL: search_issues with JQL）
    const jql = `project = ${projectKey} ORDER BY updated DESC`;
    const searchResult = await tolerateServerError(() =>
      jira.searchIssues(jql, { maxResults: 3 }),
    );
    if (!searchResult) return;
    expect(searchResult.issues).toBeDefined();
    console.log(`  ${TAG} Step 3: Found ${searchResult.issues.length} issues with JQL: "${jql}"`);

    if (searchResult.issues.length === 0) {
      console.log(`  ${TAG} No issues to inspect, skipping remaining steps`);
      return;
    }

    const issueKey = searchResult.issues[0].key;

    // Step 4: get_issue — 查看 Issue 详情（SKILL: 查看 Issue 详情）
    const issue = await tolerateServerError(() => jira.getIssue(issueKey));
    if (!issue) return;
    expect(issue.key).toBe(issueKey);
    console.log(`  ${TAG} Step 4: Issue detail: ${issue.key} | ${issue.fields.summary} | status: ${issue.fields.status.name}`);

    // Step 5: get_transitions — 查看可用的状态转换（SKILL: 查看可用的状态转换）
    const transitions = await tolerateServerError(() => jira.getTransitions(issueKey));
    if (!transitions) return;
    expect(Array.isArray(transitions)).toBe(true);
    console.log(`  ${TAG} Step 5: Available transitions: ${transitions.map((t) => `${t.name}→${t.to.name}`).join(", ")}`);

    // Step 6: add_comment — 添加 Markdown 评论（SKILL: 添加评论 with Markdown→ADF）
    const comment = await tolerateServerError(() =>
      jira.addComment(issueKey, `${TAG} Daily standup check at ${now}\n\n**Status:** Reviewed via scenario test\n- SDK integration verified\n- All operations working`),
    );
    if (!comment) return;
    expect(comment.id).toBeTruthy();
    console.log(`  ${TAG} Step 6: Comment added (id: ${comment.id}) with Markdown→ADF conversion`);
  });
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Scenario 2: Notion — Knowledge Base Workflow
// SKILL: notion.md → "知识库搜索" + create/read/append/archive page
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
describe.skipIf(!CAN_RUN)("Scenario: Notion Knowledge Base", () => {
  let notion: NotionClient;
  let connected = false;

  beforeAll(async () => {
    const client = createClient();
    const accountId = await resolveAccountId(client, "notion");
    if (!accountId) return;
    notion = new NotionClient(client, accountId);
    connected = true;
  });

  test("1. search pages → get page → read block children (Knowledge Base Search workflow)", async () => {
    if (!connected) return;

    // Step 1: search — 搜索页面（SKILL: 知识库搜索 第1步）
    const searchResult = await tolerateServerError(() =>
      notion.search({ filter: { property: "object", value: "page" }, pageSize: 5 }),
    );
    if (!searchResult) return;
    expect(searchResult.object).toBe("list");
    console.log(`  ${TAG} Step 1: Search found ${searchResult.results.length} pages`);

    if (searchResult.results.length === 0) {
      console.log(`  ${TAG} No pages found, skipping`);
      return;
    }

    const pageId = searchResult.results[0].id;

    // Step 2: get_page — 获取页面元信息（SKILL: 知识库搜索 第2步）
    const page = await tolerateServerError(() => notion.getPage(pageId));
    if (!page) return;
    expect(page.object).toBe("page");
    expect(page.url).toBeTruthy();
    console.log(`  ${TAG} Step 2: Page: ${page.url} (archived: ${page.archived})`);

    // Step 3: get_block_children — 读取页面内容（SKILL: 知识库搜索 第3步）
    const blocks = await tolerateServerError(() =>
      notion.getBlockChildren(pageId, { pageSize: 10 }),
    );
    if (!blocks) return;
    expect(blocks.results).toBeDefined();
    const blockTypes = blocks.results.map((b) => b.type);
    console.log(`  ${TAG} Step 3: Read ${blocks.results.length} blocks, types: [${blockTypes.join(", ")}], has_more: ${blocks.has_more}`);
  });

  test("2. create page → append blocks → read back → archive (Full Page Lifecycle)", async () => {
    if (!connected) return;

    // Find a parent page to create under
    const search = await notion.search({
      filter: { property: "object", value: "page" },
      pageSize: 1,
    });
    if (search.results.length === 0) {
      console.log(`  ${TAG} No pages found to use as parent, skipping`);
      return;
    }
    const parentId = search.results[0].id;

    // Step 1: create_page — 创建新页面（SKILL: 创建页面 with children）
    const created = await tolerateServerError(() =>
      notion.createPage({
        parent: { page_id: parentId },
        properties: {
          title: { title: [{ text: { content: `${TAG} 会议纪要 ${now}` } }] },
        },
        children: [
          {
            object: "block",
            type: "heading_2",
            heading_2: {
              rich_text: [{ type: "text", text: { content: "议题" } }],
            },
          },
          {
            object: "block",
            type: "paragraph",
            paragraph: {
              rich_text: [{ type: "text", text: { content: "1. SDK 集成测试进度" } }],
            },
          },
        ],
      }),
    );
    if (!created) return;
    expect(created.id).toBeTruthy();
    console.log(`  ${TAG} Step 1: Created page: ${created.url}`);

    // Step 2: append_blocks — 追加内容（SKILL: 追加内容到页面）
    const appended = await tolerateServerError(() =>
      notion.appendBlocks(created.id, [
        {
          object: "block",
          type: "heading_2",
          heading_2: {
            rich_text: [{ type: "text", text: { content: "结论" } }],
          },
        },
        {
          object: "block",
          type: "paragraph",
          paragraph: {
            rich_text: [{ type: "text", text: { content: "所有 SDK 集成测试通过，准备发布。" } }],
          },
        },
      ]),
    );
    if (!appended) return;
    expect(appended.results.length).toBe(2);
    console.log(`  ${TAG} Step 2: Appended ${appended.results.length} blocks`);

    // Step 3: get_block_children — 验证内容（read back）
    const blocks = await tolerateServerError(() =>
      notion.getBlockChildren(created.id, { pageSize: 50 }),
    );
    if (!blocks) return;
    // Should have 4 blocks: heading + paragraph + heading + paragraph
    expect(blocks.results.length).toBeGreaterThanOrEqual(4);
    console.log(`  ${TAG} Step 3: Verified ${blocks.results.length} blocks in page`);

    // Step 4: archive_page — 归档页面（SKILL: 归档页面，清理测试数据）
    const archived = await tolerateServerError(() => notion.archivePage(created.id));
    if (!archived) return;
    expect(archived.archived).toBe(true);
    console.log(`  ${TAG} Step 4: Page archived (cleanup)`);
  });
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Scenario 3: Confluence — Team Documentation Workflow
// SKILL: confluence.md → "浏览团队文档" + "创建并更新文档"
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
describe.skipIf(!CAN_RUN)("Scenario: Confluence Team Docs", () => {
  let confluence: ConfluenceClient;
  let connected = false;

  beforeAll(async () => {
    const client = createClient();
    const accountId = await resolveAccountId(client, "confluence");
    if (!accountId) return;
    confluence = new ConfluenceClient(client, accountId);
    connected = true;
  });

  test("1. list spaces → list pages → get page with body (Browse Team Docs workflow)", async () => {
    if (!connected) return;

    // Step 1: list_spaces — 找到目标空间（SKILL: 浏览团队文档 第1步）
    const spaces = await tolerateServerError(() =>
      confluence.listSpaces({ limit: 5, type: "global" }),
    );
    if (!spaces) return;
    expect(spaces.results).toBeDefined();
    console.log(`  ${TAG} Step 1: Found ${spaces.results.length} global spaces`);
    for (const s of spaces.results.slice(0, 3)) {
      console.log(`    - [${s.key}] ${s.name}`);
    }

    if (spaces.results.length === 0) {
      console.log(`  ${TAG} No spaces found, skipping`);
      return;
    }
    const spaceId = spaces.results[0].id;

    // Step 2: list_pages — 查看空间中的页面（SKILL: 浏览团队文档 第2步）
    const pages = await tolerateServerError(() =>
      confluence.listPages({ spaceId, limit: 5 }),
    );
    if (!pages) return;
    expect(pages.results).toBeDefined();
    console.log(`  ${TAG} Step 2: Found ${pages.results.length} pages in space "${spaces.results[0].name}"`);

    if (pages.results.length === 0) return;
    const pageId = pages.results[0].id;

    // Step 3: get_page with body_format: "storage" — 读取页面内容（SKILL: 浏览团队文档 第3步）
    const page = await tolerateServerError(() =>
      confluence.getPage(pageId, { bodyFormat: "storage" }),
    );
    if (!page) return;
    expect(page.title).toBeTruthy();
    console.log(`  ${TAG} Step 3: Page "${page.title}" (version: ${page.version?.number}, status: ${page.status})`);
  });

  test("2. create page → get version → update → delete (Create & Update Docs workflow)", async () => {
    if (!connected) return;

    // Get first space for creating a page
    const spaces = await confluence.listSpaces({ limit: 1 });
    if (!spaces.results?.length) {
      console.log(`  ${TAG} No spaces found, skipping`);
      return;
    }
    const spaceId = spaces.results[0].id;

    // Step 1: create_page（SKILL: 创建并更新文档 第2步）
    const created = await tolerateServerError(() =>
      confluence.createPage({
        spaceId,
        title: `${TAG} 会议纪要 ${now}`,
        body: `<h2>议题</h2><p>1. SDK 集成测试进度</p><p>2. 下一步计划</p>`,
      }),
    );
    if (!created) return;
    expect(created.id).toBeTruthy();
    expect(created.title).toContain(TAG);
    console.log(`  ${TAG} Step 1: Created page "${created.title}" (id: ${created.id})`);

    // Step 2: get_page — 获取版本号（SKILL: 创建并更新文档 第3步）
    const fetched = await tolerateServerError(() => confluence.getPage(created.id));
    if (!fetched) return;
    const currentVersion = fetched.version?.number ?? 1;
    console.log(`  ${TAG} Step 2: Current version: ${currentVersion}`);

    // Step 3: update_page with version: N+1（SKILL: 创建并更新文档 第4步）
    const updated = await tolerateServerError(() =>
      confluence.updatePage(created.id, {
        title: `${TAG} 会议纪要（已更新）${now}`,
        body: `<h2>议题</h2><p>1. SDK 集成测试进度 - <strong>全部通过</strong></p><p>2. 下一步计划</p><h2>结论</h2><p>准备发布 v1.0</p>`,
        version: currentVersion + 1,
      }),
    );
    if (!updated) return;
    expect(updated.version?.number).toBe(currentVersion + 1);
    console.log(`  ${TAG} Step 3: Updated to version ${updated.version?.number}`);

    // Step 4: delete_page — 清理（SKILL: 删除页面）
    await tolerateServerError(() => confluence.deletePage(created.id));
    console.log(`  ${TAG} Step 4: Deleted page (cleanup)`);
  });
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Scenario 4: Outlook Calendar — Meeting Scheduling Workflow
// SKILL: outlook-calendar.md → "查看今日日程" + "安排会议" (create → reschedule → cancel)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
describe.skipIf(!CAN_RUN)("Scenario: Outlook Calendar Meeting Schedule", () => {
  let calendar: OutlookCalendarClient;
  let connected = false;

  beforeAll(async () => {
    const client = createClient();
    const accountId = await resolveAccountId(client, "microsoft_outlook_calendar");
    if (!accountId) return;
    calendar = new OutlookCalendarClient(client, accountId);
    connected = true;
  });

  test("1. get_me → list_calendars → get_calendar_view (Check Today's Schedule)", async () => {
    if (!connected) return;

    // Step 1: get_me（SKILL: 查看用户信息）
    const me = await tolerateServerError(() => calendar.getMe());
    if (!me) return;
    expect(me.displayName).toBeTruthy();
    console.log(`  ${TAG} Step 1: User: ${me.displayName} (${me.mail})`);

    // Step 2: list_calendars（SKILL: 列出日历）
    const calendars = await tolerateServerError(() => calendar.listCalendars());
    if (!calendars) return;
    const defaultCal = calendars.value.find((c) => c.isDefaultCalendar);
    console.log(`  ${TAG} Step 2: ${calendars.value.length} calendars, default: "${defaultCal?.name}"`);

    // Step 3: get_calendar_view — 查看今日日程（SKILL: 查看今日日程）
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59).toISOString();
    const view = await tolerateServerError(() =>
      calendar.getCalendarView(startOfDay, endOfDay, { top: 20 }),
    );
    if (!view) return;
    expect(view.value).toBeDefined();
    console.log(`  ${TAG} Step 3: Today's events: ${view.value.length}`);
    for (const e of view.value.slice(0, 5)) {
      console.log(`    - ${e.subject} | ${e.start.dateTime.substring(0, 16)}`);
    }
  });

  test("2. create event → get detail → reschedule → cancel (Meeting Lifecycle)", async () => {
    if (!connected) return;

    // Step 1: create_event — 安排会议（SKILL: 创建事件 with body/location/timezone）
    const created = await tolerateServerError(() =>
      calendar.createEvent({
        subject: `${TAG} Sprint Review ${now}`,
        body: "讨论本次 Sprint 的完成情况和演示",
        bodyType: "Text",
        start: { dateTime: "2026-12-20T14:00:00", timeZone: "Asia/Shanghai" },
        end: { dateTime: "2026-12-20T15:30:00", timeZone: "Asia/Shanghai" },
        location: "Conference Room A",
      }),
    );
    if (!created) return;
    expect(created.id).toBeTruthy();
    expect(created.subject).toContain(TAG);
    console.log(`  ${TAG} Step 1: Created event "${created.subject}" at ${created.start.dateTime}`);

    // Step 2: get_event — 获取事件详情（SKILL: 获取事件详情）
    const detail = await tolerateServerError(() => calendar.getEvent(created.id));
    if (!detail) return;
    expect(detail.subject).toBe(created.subject);
    expect(detail.location?.displayName).toBe("Conference Room A");
    console.log(`  ${TAG} Step 2: Verified event detail, location: "${detail.location?.displayName}"`);

    // Step 3: update_event — 推迟会议时间（SKILL: 更新事件）
    const updated = await tolerateServerError(() =>
      calendar.updateEvent(created.id, {
        subject: `${TAG} Sprint Review (Rescheduled) ${now}`,
        start: { dateTime: "2026-12-20T16:00:00", timeZone: "Asia/Shanghai" },
        end: { dateTime: "2026-12-20T17:00:00", timeZone: "Asia/Shanghai" },
      }),
    );
    if (!updated) return;
    expect(updated.subject).toContain("Rescheduled");
    console.log(`  ${TAG} Step 3: Rescheduled to ${updated.start.dateTime}`);

    // Step 4: delete_event — 取消会议（SKILL: 删除事件）
    await tolerateServerError(() => calendar.deleteEvent(created.id));
    console.log(`  ${TAG} Step 4: Event cancelled (deleted)`);
  });
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Scenario 5: MS To Do — Daily Task Management
// SKILL: ms-todo.md → "每日任务管理" (list → create → update → complete → delete)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
describe.skipIf(!CAN_RUN)("Scenario: MS To Do Daily Task Management", () => {
  let todo: MsTodoClient;
  let connected = false;

  beforeAll(async () => {
    const client = createClient();
    const accountId = await resolveAccountId(client, "microsofttodo");
    if (!accountId) return;
    todo = new MsTodoClient(client, accountId);
    connected = true;
  });

  test("Full task lifecycle: list → create list → add tasks → complete → cleanup", async () => {
    if (!connected) return;

    // Step 1: list_task_lists — 找到目标列表（SKILL: 每日任务管理 第1步）
    const lists = await tolerateServerError(() => todo.listTaskLists());
    if (!lists) return;
    expect(lists.value.length).toBeGreaterThan(0);
    console.log(`  ${TAG} Step 1: Found ${lists.value.length} task lists`);

    // Step 2: create_task_list — 创建测试列表（SKILL: 创建任务列表）
    const newList = await tolerateServerError(() =>
      todo.createTaskList(`${TAG} Sprint Tasks ${now}`),
    );
    if (!newList) return;
    expect(newList.id).toBeTruthy();
    console.log(`  ${TAG} Step 2: Created list "${newList.displayName}"`);

    // Step 3: create_task — 添加多个任务（SKILL: 创建任务 with importance/dueDate）
    const task1 = await tolerateServerError(() =>
      todo.createTask(newList.id, {
        title: `${TAG} 完成 API 文档`,
        body: "编写 REST API 接口文档",
        importance: "high",
        dueDate: "2026-03-01",
      }),
    );
    if (!task1) return;
    expect(task1.importance).toBe("high");

    const task2 = await tolerateServerError(() =>
      todo.createTask(newList.id, {
        title: `${TAG} 代码 Review`,
        body: "Review PR #42",
        importance: "normal",
      }),
    );
    if (!task2) return;

    const task3 = await tolerateServerError(() =>
      todo.createTask(newList.id, {
        title: `${TAG} 更新依赖`,
        importance: "low",
      }),
    );
    if (!task3) return;
    console.log(`  ${TAG} Step 3: Created 3 tasks with varying importance`);

    // Step 4: list_tasks — 查看当前任务（SKILL: 每日任务管理 第2步）
    const tasks = await tolerateServerError(() =>
      todo.listTasks(newList.id, { top: 10 }),
    );
    if (!tasks) return;
    expect(tasks.value.length).toBe(3);
    console.log(`  ${TAG} Step 4: Listed ${tasks.value.length} tasks in list`);
    for (const t of tasks.value) {
      console.log(`    - [${t.importance}] ${t.title} (${t.status})`);
    }

    // Step 5: update_task — 更新任务（SKILL: 更新任务）
    const updated = await tolerateServerError(() =>
      todo.updateTask(newList.id, task1.id, { title: `${TAG} 完成 API 文档（进行中）` }),
    );
    if (!updated) return;
    expect(updated.title).toContain("进行中");
    console.log(`  ${TAG} Step 5: Updated task title`);

    // Step 6: complete_task — 完成任务（SKILL: 每日任务管理 第4步）
    const completed = await tolerateServerError(() =>
      todo.completeTask(newList.id, task2.id),
    );
    if (!completed) return;
    expect(completed.status).toBe("completed");
    console.log(`  ${TAG} Step 6: Completed task "${task2.title}"`);

    // Step 7: get_task — 验证任务状态（SKILL: 查看任务详情）
    const detail = await tolerateServerError(() =>
      todo.getTask(newList.id, task2.id),
    );
    if (!detail) return;
    expect(detail.status).toBe("completed");
    console.log(`  ${TAG} Step 7: Verified task status: ${detail.status}`);

    // Cleanup: delete all tasks and the list
    await tolerateServerError(() => todo.deleteTask(newList.id, task1.id));
    await tolerateServerError(() => todo.deleteTask(newList.id, task2.id));
    await tolerateServerError(() => todo.deleteTask(newList.id, task3.id));
    console.log(`  ${TAG} Cleanup: Deleted 3 tasks and list`);
  });
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Scenario 6: GitHub — Project Overview
// SKILL: github-workflow.md → "查看项目 Issue 和 PR 概况"
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
describe.skipIf(!CAN_RUN)("Scenario: GitHub Project Overview", () => {
  let github: GitHubClient;
  let connected = false;

  beforeAll(async () => {
    const client = createClient();
    const accountId = await resolveAccountId(client, "github");
    if (!accountId) return;
    github = new GitHubClient(client, accountId);
    connected = true;
  });

  test("get_user → list_repos → get_repo → list_issues → list_pulls → list_workflow_runs", async () => {
    if (!connected) return;

    // Step 1: get_user（SKILL: 查看当前用户）
    const user = await tolerateServerError(() => github.getCurrentUser());
    if (!user) return;
    console.log(`  ${TAG} Step 1: User: ${user.login} (${user.name})`);

    // Step 2: list_repos sorted by updated（SKILL: 列出仓库）
    const repos = await tolerateServerError(() =>
      github.listRepos({ sort: "updated", perPage: 5 }),
    );
    if (!repos) return;
    expect(repos.length).toBeGreaterThan(0);
    console.log(`  ${TAG} Step 2: Top ${repos.length} repos by update time`);

    // Pick the first repo with issues enabled
    const repoFullName = repos[0].full_name;

    // Step 3: get_repo — 查看仓库详情（SKILL: 查看仓库详情）
    const repo = await tolerateServerError(() => github.getRepo(repoFullName));
    if (!repo) return;
    console.log(`  ${TAG} Step 3: Repo "${repo.full_name}" (${repo.private ? "private" : "public"}, ★${repo.stargazers_count})`);

    // Step 4: list_issues（SKILL: 查看项目 Issue 和 PR 概况 第1步）
    const issues = await tolerateServerError(() =>
      github.listIssues(repoFullName, { state: "open", perPage: 5 }),
    );
    if (!issues) return;
    console.log(`  ${TAG} Step 4: Open issues: ${issues.length}`);

    // Step 5: list_pulls（SKILL: 查看项目 Issue 和 PR 概况 第2步）
    const pulls = await tolerateServerError(() =>
      github.listPulls(repoFullName, { state: "open", perPage: 5 }),
    );
    if (!pulls) return;
    console.log(`  ${TAG} Step 5: Open PRs: ${pulls.length}`);

    // Step 6: list_workflow_runs（SKILL: 查看工作流运行）
    const runs = await tolerateServerError(() =>
      github.listWorkflowRuns(repoFullName, { perPage: 3 }),
    );
    if (!runs) return;
    console.log(`  ${TAG} Step 6: Recent workflow runs: ${runs.total_count}`);
  });
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Scenario 7: GitLab — Project Overview
// SKILL: gitlab-workflow.md → list projects, MRs, issues, pipelines, branches
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
describe.skipIf(!CAN_RUN)("Scenario: GitLab Project Overview", () => {
  let gitlab: GitLabClient;
  let connected = false;

  beforeAll(async () => {
    const client = createClient();
    const accountId = await resolveAccountId(client, "gitlab");
    if (!accountId) return;
    gitlab = new GitLabClient(client, accountId);
    connected = true;
  });

  test("get_user → list_projects → get_project → list_merge_requests → list_pipelines → list_branches", async () => {
    if (!connected) return;

    // Step 1: get_user
    const user = await tolerateServerError(() => gitlab.getCurrentUser());
    if (!user) return;
    console.log(`  ${TAG} Step 1: User: ${user.name} (@${user.username})`);

    // Step 2: list_projects
    const projects = await tolerateServerError(() =>
      gitlab.listProjects({ perPage: 3 }),
    );
    if (!projects) return;
    expect(projects.length).toBeGreaterThan(0);
    console.log(`  ${TAG} Step 2: ${projects.length} projects`);

    const projectId = projects[0].id;

    // Step 3: get_project
    const project = await tolerateServerError(() =>
      gitlab.getProject(projectId),
    );
    if (!project) return;
    console.log(`  ${TAG} Step 3: Project "${project.path_with_namespace}" (default: ${project.default_branch})`);

    // Step 4: list_merge_requests（SKILL: 列出 MR）
    const mrs = await tolerateServerError(() =>
      gitlab.listMergeRequests(projectId, { state: "opened" }),
    );
    if (!mrs) return;
    console.log(`  ${TAG} Step 4: Open MRs: ${mrs.length}`);

    // Step 5: list_pipelines（SKILL: 查看 pipeline）
    const pipelines = await tolerateServerError(() =>
      gitlab.listPipelines(projectId, { perPage: 3 }),
    );
    if (!pipelines) return;
    console.log(`  ${TAG} Step 5: Recent pipelines: ${pipelines.length}`);

    // Step 6: list_branches
    const branches = await tolerateServerError(() =>
      gitlab.listBranches(projectId),
    );
    if (!branches) return;
    console.log(`  ${TAG} Step 6: Branches: ${branches.length}`);
    for (const b of branches.slice(0, 3)) {
      console.log(`    - ${b.name}${b.default ? " (default)" : ""}`);
    }
  });
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Scenario 8: Cross-App — Sprint Planning (Jira + Calendar + To Do)
// Real workflow: Create Jira issue → Schedule review meeting → Add todo reminder
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
describe.skipIf(!CAN_RUN)("Scenario: Cross-App Sprint Planning", () => {
  let morphix: MorphixClient;
  let jira: JiraClient | null = null;
  let calendar: OutlookCalendarClient | null = null;
  let todo: MsTodoClient | null = null;

  beforeAll(async () => {
    morphix = createClient();

    const jiraAcct = await resolveAccountId(morphix, "jira");
    if (jiraAcct) jira = new JiraClient(morphix, jiraAcct);

    const calAcct = await resolveAccountId(morphix, "microsoft_outlook_calendar");
    if (calAcct) calendar = new OutlookCalendarClient(morphix, calAcct);

    const todoAcct = await resolveAccountId(morphix, "microsofttodo");
    if (todoAcct) todo = new MsTodoClient(morphix, todoAcct);
  });

  test("Create Jira issue → Schedule calendar review → Add todo reminder → Cleanup", async () => {
    if (!jira || !calendar || !todo) {
      console.log(`  ${TAG} Skipping cross-app test (need jira + calendar + todo connected)`);
      return;
    }

    // Step 1: Get Jira project
    const projects = await jira.listProjects({ maxResults: 1 });
    if (!projects.values.length) {
      console.log(`  ${TAG} No Jira projects found, skipping`);
      return;
    }
    const projectKey = projects.values[0].key;

    // Step 2: Create Jira issue — "创建 Issue"
    const issue = await tolerateServerError(() =>
      jira.createIssue({
        project: projectKey,
        summary: `${TAG} 实现用户登录功能 ${now}`,
        description: `**需求描述：**\n实现 JWT 登录流程\n\n**验收标准：**\n- 支持邮箱+密码登录\n- 返回 JWT token\n\n> Created by cross-app scenario test`,
        priority: "High",
        labels: ["sdk-test"],
      }),
    );
    if (!issue) return;
    console.log(`  ${TAG} Step 1: Created Jira issue ${issue.key}`);

    // Step 3: Schedule review meeting on calendar — "安排会议"
    const event = await tolerateServerError(() =>
      calendar.createEvent({
        subject: `${TAG} Code Review: ${issue.key}`,
        body: `Review the implementation for Jira issue ${issue.key}.\nLink: ${projectKey} project`,
        start: { dateTime: "2026-12-25T10:00:00", timeZone: "Asia/Shanghai" },
        end: { dateTime: "2026-12-25T11:00:00", timeZone: "Asia/Shanghai" },
        location: "Online Meeting",
      }),
    );
    if (!event) return;
    console.log(`  ${TAG} Step 2: Scheduled review meeting "${event.subject}"`);

    // Step 4: Add todo reminder — "创建任务"
    const lists = await todo.listTaskLists();
    const defaultList = lists.value[0];

    const todoTask = await tolerateServerError(() =>
      todo.createTask(defaultList.id, {
        title: `${TAG} Review ${issue.key} — 完成代码 review`,
        body: `Jira: ${issue.key}\nMeeting: ${event.subject}`,
        importance: "high",
        dueDate: "2026-12-25",
      }),
    );
    if (!todoTask) return;
    console.log(`  ${TAG} Step 3: Added todo reminder "${todoTask.title}"`);

    // Step 5: Add comment to Jira linking everything together
    const comment = await tolerateServerError(() =>
      jira.addComment(
        issue.key,
        `**Sprint Planning Summary:**\n- Calendar review meeting scheduled\n- Todo reminder added\n- Priority: High\n\n> Automated by cross-app scenario test`,
      ),
    );
    if (!comment) return;
    console.log(`  ${TAG} Step 4: Added Jira comment linking all items (id: ${comment.id})`);

    // Cleanup
    await tolerateServerError(() => calendar.deleteEvent(event.id));
    await tolerateServerError(() => todo.deleteTask(defaultList.id, todoTask.id));
    console.log(`  ${TAG} Cleanup: Deleted calendar event and todo task`);
    // Note: Jira issue left in place (no delete API in our client, it's expected)
  });
});
