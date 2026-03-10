#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ErrorCode,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";

import {
  MorphixClient,
  GitHubClient,
  GitLabClient,
  JiraClient,
  FlightsClient,
  OutlookClient,
  OutlookCalendarClient,
  GmailClient,
  GoogleTasksClient,
  NotionClient,
  ConfluenceClient,
  FigmaClient,
  MsTodoClient,
  OfficeGitHubSchema,
  OfficeGitLabSchema,
  OfficeJiraSchema,
  OfficeFlightsSchema,
  OfficeOutlookSchema,
  OfficeOutlookCalendarSchema,
  OfficeGmailSchema,
  OfficeGoogleTasksSchema,
  OfficeNotionSchema,
  OfficeConfluenceSchema,
  OfficeFigmaSchema,
  OfficeMsTodoSchema,
  OfficeLinkSchema,
  type OfficeGitHubParams,
  type OfficeGitLabParams,
  type OfficeJiraParams,
  type OfficeFlightsParams,
  type OfficeOutlookParams,
  type OfficeOutlookCalendarParams,
  type OfficeGmailParams,
  type OfficeGoogleTasksParams,
  type OfficeNotionParams,
  type OfficeConfluenceParams,
  type OfficeFigmaParams,
  type OfficeMsTodoParams,
  type OfficeLinkParams,
} from "@morphixai/core";

// --- Helpers ---
const API_KEY_GUIDE_URL = "https://morphix.app/api-keys";
const CONNECTIONS_URL = "https://morphix.app/connections";

class AppNotConnectedError extends Error {
  constructor(public readonly appSlug: string) {
    super(
      `No ${appSlug} account connected. Visit ${CONNECTIONS_URL} to link your ${appSlug} account.`,
    );
    this.name = "AppNotConnectedError";
  }
}

async function resolveAppAccount(
  client: MorphixClient,
  appSlug: string,
  accountId?: string,
): Promise<string> {
  if (accountId) return accountId;

  const accounts = await client.listAccounts(appSlug, true);
  if (accounts.length === 0) {
    throw new AppNotConnectedError(appSlug);
  }
  const active = accounts.find((a) => a.isActive) || accounts[0];
  return active.accountId;
}

function jsonResult(data: any) {
  return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
}

function errorResult(message: string) {
  return { content: [{ type: "text" as const, text: `Error: ${message}` }], isError: true };
}

// --- Server Setup ---
const server = new Server(
  {
    name: "morphixai-mcp",
    version: "0.7.0",
  },
  {
    capabilities: {
      tools: {},
    },
  },
);

const API_KEY = process.env.MORPHIXAI_API_KEY;

if (!API_KEY) {
  console.error("MORPHIXAI_API_KEY environment variable is required.");
  console.error(`Visit ${API_KEY_GUIDE_URL} to get your API Key.`);
  process.exit(1);
}

const morphixClient = new MorphixClient({ apiKey: API_KEY, baseUrl: process.env.MORPHIXAI_BASE_URL });

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "mx_github",
        description:
          "GitHub integration: list repos, issues, pull requests, workflow runs. Create issues/PRs, update issues, trigger workflows.",
        inputSchema: OfficeGitHubSchema as never,
      },
      {
        name: "mx_gitlab",
        description:
          "GitLab integration: manage projects, MRs, issues, and pipelines. Use format 'group/project' for project_id.",
        inputSchema: OfficeGitLabSchema as never,
      },
      {
        name: "mx_jira",
        description:
          "Jira integration: list projects, search issues (JQL), create/update issues, transition issues, add comments.",
        inputSchema: OfficeJiraSchema as never,
      },
      {
        name: "mx_outlook",
        description:
          "Microsoft Outlook email integration: read, search, send, and reply to emails. List mail folders. " +
          "Actions: get_me, list_messages, get_message, send_mail, reply_to_message, search_messages, list_folders",
        inputSchema: OfficeOutlookSchema as never,
      },
      {
        name: "mx_outlook_calendar",
        description:
          "Microsoft Outlook Calendar integration: list calendars, view/create/update/delete events, get calendar view by date range. " +
          "Actions: get_me, list_calendars, list_events, get_calendar_view, get_event, create_event, update_event, delete_event",
        inputSchema: OfficeOutlookCalendarSchema as never,
      },
      {
        name: "mx_gmail",
        description:
          "Gmail integration: list, read, search, send emails. Manage labels, mark as read, trash messages. " +
          "Actions: get_profile, list_messages, get_message, send_mail, search_messages, list_labels, mark_as_read, trash_message",
        inputSchema: OfficeGmailSchema as never,
      },
      {
        name: "mx_google_tasks",
        description:
          "Google Tasks integration: manage task lists and tasks. Create, update, complete, and delete tasks. " +
          "Actions: list_task_lists, create_task_list, delete_task_list, list_tasks, get_task, create_task, update_task, complete_task, delete_task",
        inputSchema: OfficeGoogleTasksSchema as never,
      },
      {
        name: "mx_notion",
        description:
          "Notion integration: search pages/databases, create/update/archive pages, read/append block content, query databases. " +
          "Actions: get_me, search, get_page, create_page, update_page, archive_page, get_block_children, append_blocks, get_database, query_database",
        inputSchema: OfficeNotionSchema as never,
      },
      {
        name: "mx_confluence",
        description:
          "Confluence Cloud integration: spaces, pages CRUD, labels, comments, child pages, CQL search. " +
          "Actions: list_spaces, get_space, list_pages, get_page, create_page, update_page, delete_page, " +
          "get_child_pages, get_page_labels, add_page_label, delete_page_label, get_page_comments, add_page_comment, search",
        inputSchema: OfficeConfluenceSchema as never,
      },
      {
        name: "mx_figma",
        description:
          "Figma integration: browse team projects & files, read file structure/pages/nodes, export images, manage comments, " +
          "view version history, inspect components/styles, get design variables (tokens). " +
          "Actions: get_me, list_team_projects, list_project_files, get_file, get_file_nodes, export_images, list_comments, " +
          "post_comment, delete_comment, list_versions, get_file_components, get_team_components, get_file_component_sets, " +
          "get_team_component_sets, get_file_styles, get_team_styles, get_local_variables, get_published_variables",
        inputSchema: OfficeFigmaSchema as never,
      },
      {
        name: "mx_ms_todo",
        description:
          "Microsoft To Do integration: manage task lists and tasks. Create, update, complete, and delete tasks. " +
          "Actions: list_task_lists, create_task_list, list_tasks, get_task, create_task, update_task, complete_task, delete_task",
        inputSchema: OfficeMsTodoSchema as never,
      },
      {
        name: "mx_link",
        description:
          "Manage linked third-party accounts and call their APIs through MorphixAI proxy. " +
          "Actions: list_accounts, get_account, statistics, list_apps, connect (generate OAuth link), proxy (call third-party API), check_auth",
        inputSchema: OfficeLinkSchema as never,
      },
      {
        name: "mx_flights",
        description:
          "[UNAVAILABLE] This tool is currently under development and not available for use. " +
          "Do NOT call this tool — all requests will be rejected. Flight booking functionality will be enabled in a future release.",
        inputSchema: OfficeFlightsSchema as never,
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "mx_github": {
        const p = args as unknown as OfficeGitHubParams;
        const accountId = await resolveAppAccount(morphixClient, "github", p.account_id);
        const github = new GitHubClient(morphixClient, accountId);

        let result;
        switch (p.action) {
          case "get_user":
            result = await github.getCurrentUser();
            break;
          case "list_repos":
            result = await github.listRepos({
              sort: p.sort,
              type: p.type,
              perPage: p.per_page,
              page: p.page,
            });
            break;
          case "get_repo":
            result = await github.getRepo(p.repo);
            break;
          case "list_issues":
            result = await github.listIssues(p.repo, {
              state: p.state,
              labels: p.labels,
              perPage: p.per_page,
              page: p.page,
            });
            break;
          case "create_issue":
            result = await github.createIssue(p.repo, {
              title: p.title,
              body: p.body,
              labels: p.labels,
              assignees: p.assignees,
            });
            break;
          case "update_issue":
            result = await github.updateIssue(p.repo, p.issue_number, {
              title: p.title,
              body: p.body,
              state: p.state,
              labels: p.labels,
            });
            break;
          case "list_pulls":
            result = await github.listPulls(p.repo, {
              state: p.state,
              perPage: p.per_page,
              page: p.page,
            });
            break;
          case "create_pull":
            result = await github.createPull(p.repo, {
              title: p.title,
              head: p.head,
              base: p.base,
              body: p.body,
            });
            break;
          case "list_workflow_runs":
            result = await github.listWorkflowRuns(p.repo, {
              status: p.status,
              perPage: p.per_page,
            });
            break;
          case "trigger_workflow":
            await github.triggerWorkflow(p.repo, p.workflow_id, p.ref, p.inputs);
            result = { success: true, repo: p.repo, workflow_id: p.workflow_id, ref: p.ref };
            break;
          default:
            throw new McpError(ErrorCode.InvalidParams, `Unknown GitHub action: ${(args as { action?: string }).action}`);
        }
        return jsonResult(result);
      }

      case "mx_gitlab": {
        const p = args as unknown as OfficeGitLabParams;
        const accountId = await resolveAppAccount(morphixClient, "gitlab", p.account_id);
        const gitlab = new GitLabClient(morphixClient, accountId);

        let result;
        switch (p.action) {
          case "get_user":
            result = await gitlab.getCurrentUser();
            break;
          case "list_projects":
            result = await gitlab.listProjects({
              search: p.search,
              perPage: p.per_page,
              page: p.page,
              orderBy: p.order_by,
              sort: p.sort,
            });
            break;
          case "get_project":
            result = await gitlab.getProject(p.project);
            break;
          case "get_merge_request":
            result = await gitlab.getMergeRequest(p.project, p.mr_iid);
            break;
          case "list_merge_requests":
            result = await gitlab.listMergeRequests(p.project, {
              state: p.state,
              perPage: p.per_page,
              page: p.page,
            });
            break;
          case "create_merge_request":
            result = await gitlab.createMergeRequest(p.project, {
              sourceBranch: p.source_branch,
              targetBranch: p.target_branch,
              title: p.title,
              description: p.description,
            });
            break;
          case "approve_merge_request":
            await gitlab.approveMergeRequest(p.project, p.mr_iid);
            result = { success: true, project: p.project, mr_iid: p.mr_iid };
            break;
          case "merge_merge_request":
            result = await gitlab.mergeMergeRequest(p.project, p.mr_iid);
            break;
          case "list_issues":
            result = await gitlab.listIssues(p.project, {
              state: p.state,
              labels: p.labels,
              perPage: p.per_page,
              page: p.page,
            });
            break;
          case "create_issue":
            result = await gitlab.createIssue(p.project, {
              title: p.title,
              description: p.description,
              labels: p.labels,
              assigneeIds: p.assignee_ids,
            });
            break;
          case "list_pipelines":
            result = await gitlab.listPipelines(p.project, {
              status: p.status,
              ref: p.ref,
              perPage: p.per_page,
            });
            break;
          case "retry_pipeline":
            result = await gitlab.retryPipeline(p.project, p.pipeline_id);
            break;
          case "update_merge_request":
            result = await gitlab.updateMergeRequest(p.project, p.mr_iid, {
              title: p.title,
              description: p.description,
              targetBranch: p.target_branch,
              reviewerIds: p.reviewer_ids,
              assigneeIds: p.assignee_ids,
              labels: p.labels,
            });
            break;
          case "search_users":
            result = await gitlab.searchUsers({ search: p.search, perPage: p.per_page });
            break;
          case "list_branches":
            result = await gitlab.listBranches(p.project, {
              search: p.search,
              perPage: p.per_page,
            });
            break;
          default:
            throw new McpError(ErrorCode.InvalidParams, `Unknown GitLab action: ${(args as { action?: string }).action}`);
        }
        return jsonResult(result);
      }

      case "mx_jira": {
        const p = args as unknown as OfficeJiraParams;
        const accountId = await resolveAppAccount(morphixClient, "jira", p.account_id);
        const jira = new JiraClient(morphixClient, accountId);

        let result;
        switch (p.action) {
          case "get_myself":
            result = await jira.getMyself();
            break;
          case "list_projects":
            result = await jira.listProjects({
              query: p.query,
              maxResults: p.max_results,
            });
            break;
          case "search_issues":
            result = await jira.searchIssues(p.jql, {
              maxResults: p.max_results,
              fields: p.fields,
            });
            break;
          case "get_issue":
            result = await jira.getIssue(p.issue_key, p.fields);
            break;
          case "create_issue":
            result = await jira.createIssue({
              project: p.project,
              summary: p.summary,
              issueType: p.issue_type,
              description: p.description,
              assigneeAccountId: p.assignee_account_id,
              priority: p.priority,
              labels: p.labels,
              duedate: p.duedate,
            });
            break;
          case "update_issue":
            await jira.updateIssue(p.issue_key, p.fields);
            result = { success: true, issue_key: p.issue_key };
            break;
          case "transition_issue":
            await jira.transitionIssue(p.issue_key, p.target_status);
            result = {
              success: true,
              issue_key: p.issue_key,
              target_status: p.target_status,
            };
            break;
          case "get_transitions":
            result = await jira.getTransitions(p.issue_key);
            break;
          case "add_comment":
            result = await jira.addComment(p.issue_key, p.body);
            break;
          default:
            throw new McpError(ErrorCode.InvalidParams, `Unknown Jira action: ${(args as { action?: string }).action}`);
        }
        return jsonResult(result);
      }

      // ─── Outlook Email ───
      case "mx_outlook": {
        const p = args as unknown as OfficeOutlookParams;
        const accountId = await resolveAppAccount(morphixClient, "microsoft_outlook", p.account_id);
        const outlook = new OutlookClient(morphixClient, accountId);

        let result;
        switch (p.action) {
          case "get_me":
            result = await outlook.getMe();
            break;
          case "list_messages":
            result = await outlook.listMessages({
              folderId: p.folder_id,
              top: p.top,
              skip: p.skip,
              filter: p.filter,
              search: p.search,
              orderBy: p.order_by,
            });
            break;
          case "get_message":
            result = await outlook.getMessage(p.message_id);
            break;
          case "send_mail":
            await outlook.sendMail({
              subject: p.subject,
              body: p.body,
              bodyType: p.body_type,
              toRecipients: p.to,
              ccRecipients: p.cc,
            });
            result = { success: true, message: "Email sent successfully" };
            break;
          case "reply_to_message":
            await outlook.replyToMessage(p.message_id, p.comment);
            result = { success: true, message: "Reply sent successfully" };
            break;
          case "search_messages":
            result = await outlook.searchMessages(p.query, { top: p.top });
            break;
          case "list_folders":
            result = await outlook.listFolders();
            break;
          default:
            throw new McpError(ErrorCode.InvalidParams, `Unknown Outlook action: ${(args as { action?: string }).action}`);
        }
        return jsonResult(result);
      }

      // ─── Outlook Calendar ───
      case "mx_outlook_calendar": {
        const p = args as unknown as OfficeOutlookCalendarParams;
        const accountId = await resolveAppAccount(morphixClient, "microsoft_outlook_calendar", p.account_id);
        const calendar = new OutlookCalendarClient(morphixClient, accountId);

        let result;
        switch (p.action) {
          case "get_me":
            result = await calendar.getMe();
            break;
          case "list_calendars":
            result = await calendar.listCalendars();
            break;
          case "list_events":
            result = await calendar.listEvents({
              calendarId: p.calendar_id,
              top: p.top,
              orderBy: p.order_by,
              filter: p.filter,
            });
            break;
          case "get_calendar_view":
            result = await calendar.getCalendarView(
              p.start_date_time,
              p.end_date_time,
              { calendarId: p.calendar_id, top: p.top },
            );
            break;
          case "get_event":
            result = await calendar.getEvent(p.event_id);
            break;
          case "create_event": {
            const tz = p.time_zone || "UTC";
            result = await calendar.createEvent({
              subject: p.subject,
              body: p.body,
              bodyType: p.body_type,
              start: { dateTime: p.start, timeZone: tz },
              end: { dateTime: p.end, timeZone: tz },
              location: p.location,
              isAllDay: p.is_all_day,
              attendees: p.attendees,
              calendarId: p.calendar_id,
            });
            break;
          }
          case "update_event": {
            const fields: Record<string, any> = {};
            if (p.subject) fields.subject = p.subject;
            if (p.body) fields.body = { contentType: "Text", content: p.body };
            if (p.start) fields.start = { dateTime: p.start, timeZone: p.time_zone || "UTC" };
            if (p.end) fields.end = { dateTime: p.end, timeZone: p.time_zone || "UTC" };
            if (p.location) fields.location = { displayName: p.location };
            if (p.is_all_day !== undefined) fields.isAllDay = p.is_all_day;
            result = await calendar.updateEvent(p.event_id, fields);
            break;
          }
          case "delete_event":
            await calendar.deleteEvent(p.event_id);
            result = { success: true, message: "Event deleted" };
            break;
          default:
            throw new McpError(ErrorCode.InvalidParams, `Unknown Outlook Calendar action: ${(args as { action?: string }).action}`);
        }
        return jsonResult(result);
      }

      // ─── Gmail ───
      case "mx_gmail": {
        const p = args as unknown as OfficeGmailParams;
        const accountId = await resolveAppAccount(morphixClient, "gmail", p.account_id);
        const gmail = new GmailClient(morphixClient, accountId);

        let result;
        switch (p.action) {
          case "get_profile":
            result = await gmail.getProfile();
            break;
          case "list_messages":
            result = await gmail.listMessages({
              q: p.q,
              maxResults: p.max_results,
              labelIds: p.label_ids,
              pageToken: p.page_token,
            });
            break;
          case "get_message":
            result = await gmail.getMessage(p.message_id, p.format);
            break;
          case "send_mail":
            result = await gmail.sendMail({
              to: p.to,
              subject: p.subject,
              body: p.body,
              cc: p.cc,
              from: p.from,
            });
            break;
          case "search_messages":
            result = await gmail.searchMessages(p.query, p.max_results);
            break;
          case "list_labels":
            result = await gmail.listLabels();
            break;
          case "mark_as_read":
            result = await gmail.markAsRead(p.message_id);
            break;
          case "trash_message":
            result = await gmail.trashMessage(p.message_id);
            break;
          default:
            throw new McpError(ErrorCode.InvalidParams, `Unknown Gmail action: ${(args as { action?: string }).action}`);
        }
        return jsonResult(result);
      }

      // ─── Google Tasks ───
      case "mx_google_tasks": {
        const p = args as unknown as OfficeGoogleTasksParams;
        const accountId = await resolveAppAccount(morphixClient, "google_tasks", p.account_id);
        const tasks = new GoogleTasksClient(morphixClient, accountId);

        let result;
        switch (p.action) {
          case "list_task_lists":
            result = await tasks.listTaskLists({ maxResults: p.max_results });
            break;
          case "create_task_list":
            result = await tasks.createTaskList(p.title);
            break;
          case "delete_task_list":
            await tasks.deleteTaskList(p.task_list_id);
            result = { success: true, message: "Task list deleted" };
            break;
          case "list_tasks":
            result = await tasks.listTasks(p.task_list_id, {
              maxResults: p.max_results,
              showCompleted: p.show_completed,
              showHidden: p.show_hidden,
              dueMin: p.due_min,
              dueMax: p.due_max,
              pageToken: p.page_token,
            });
            break;
          case "get_task":
            result = await tasks.getTask(p.task_list_id, p.task_id);
            break;
          case "create_task":
            result = await tasks.createTask(p.task_list_id, {
              title: p.title,
              notes: p.notes,
              due: p.due,
            });
            break;
          case "update_task":
            result = await tasks.updateTask(p.task_list_id, p.task_id, {
              title: p.title,
              notes: p.notes,
              due: p.due,
              status: p.status,
            });
            break;
          case "complete_task":
            result = await tasks.completeTask(p.task_list_id, p.task_id);
            break;
          case "delete_task":
            await tasks.deleteTask(p.task_list_id, p.task_id);
            result = { success: true, message: "Task deleted" };
            break;
          default:
            throw new McpError(ErrorCode.InvalidParams, `Unknown Google Tasks action: ${(args as { action?: string }).action}`);
        }
        return jsonResult(result);
      }

      // ─── Notion ───
      case "mx_notion": {
        const p = args as unknown as OfficeNotionParams;
        const accountId = await resolveAppAccount(morphixClient, "notion", p.account_id);
        const notion = new NotionClient(morphixClient, accountId);

        let result;
        switch (p.action) {
          case "get_me":
            result = await notion.getMe();
            break;
          case "search":
            result = await notion.search({
              query: p.query,
              filter: p.filter_type
                ? { property: "object", value: p.filter_type }
                : undefined,
              pageSize: p.page_size,
              startCursor: p.start_cursor,
            });
            break;
          case "get_page":
            result = await notion.getPage(p.page_id);
            break;
          case "create_page": {
            const parent =
              p.parent_type === "database"
                ? { database_id: p.parent_id }
                : { page_id: p.parent_id };
            const properties = p.properties ?? {
              title: { title: [{ text: { content: p.title } }] },
            };
            result = await notion.createPage({
              parent,
              properties,
              children: p.children,
            });
            break;
          }
          case "update_page":
            result = await notion.updatePage(p.page_id, p.properties);
            break;
          case "archive_page":
            result = await notion.archivePage(p.page_id);
            break;
          case "get_block_children":
            result = await notion.getBlockChildren(p.block_id, {
              pageSize: p.page_size,
              startCursor: p.start_cursor,
            });
            break;
          case "append_blocks":
            result = await notion.appendBlocks(p.block_id, p.children);
            break;
          case "get_database":
            result = await notion.getDatabase(p.database_id);
            break;
          case "query_database":
            result = await notion.queryDatabase(p.database_id, {
              filter: p.filter,
              sorts: p.sorts,
              pageSize: p.page_size,
              startCursor: p.start_cursor,
            });
            break;
          default:
            throw new McpError(ErrorCode.InvalidParams, `Unknown Notion action: ${(args as { action?: string }).action}`);
        }
        return jsonResult(result);
      }

      // ─── Confluence ───
      case "mx_confluence": {
        const p = args as unknown as OfficeConfluenceParams;
        const accountId = await resolveAppAccount(morphixClient, "confluence", p.account_id);
        const confluence = new ConfluenceClient(morphixClient, accountId);

        let result;
        switch (p.action) {
          case "list_spaces":
            result = await confluence.listSpaces({
              limit: p.limit,
              type: p.type,
            });
            break;
          case "get_space":
            result = await confluence.getSpace(p.space_id);
            break;
          case "list_pages":
            result = await confluence.listPages({
              spaceId: p.space_id,
              limit: p.limit,
              sort: p.sort,
            });
            break;
          case "get_page":
            result = await confluence.getPage(p.page_id, {
              bodyFormat: p.body_format,
            });
            break;
          case "create_page":
            result = await confluence.createPage({
              spaceId: p.space_id,
              title: p.title,
              body: p.body,
              parentId: p.parent_id,
            });
            break;
          case "update_page":
            result = await confluence.updatePage(p.page_id, {
              title: p.title,
              body: p.body,
              version: p.version,
            });
            break;
          case "delete_page":
            await confluence.deletePage(p.page_id);
            result = { success: true, message: "Page deleted" };
            break;
          case "get_child_pages":
            result = await confluence.getChildPages(p.page_id, {
              limit: p.limit,
              sort: p.sort,
            });
            break;
          case "get_page_labels":
            result = await confluence.getPageLabels(p.page_id, {
              limit: p.limit,
              prefix: p.prefix,
            });
            break;
          case "add_page_label":
            result = await confluence.addPageLabel(p.page_id, p.label);
            break;
          case "delete_page_label":
            await confluence.deletePageLabel(p.page_id, p.label_id);
            result = { success: true, message: "Label removed" };
            break;
          case "get_page_comments":
            result = await confluence.getPageComments(p.page_id, {
              limit: p.limit,
              bodyFormat: p.body_format,
            });
            break;
          case "add_page_comment":
            result = await confluence.addPageComment(p.page_id, p.body);
            break;
          case "search":
            result = await confluence.searchContent(p.cql, { limit: p.limit });
            break;
          default:
            throw new McpError(ErrorCode.InvalidParams, `Unknown Confluence action: ${(args as { action?: string }).action}`);
        }
        return jsonResult(result);
      }

      // ─── Figma ───
      case "mx_figma": {
        const p = args as unknown as OfficeFigmaParams;
        const accountId = await resolveAppAccount(morphixClient, "figma", p.account_id);
        const figma = new FigmaClient(morphixClient, accountId);

        let result;
        switch (p.action) {
          case "get_me":
            result = await figma.getMe();
            break;
          case "list_team_projects":
            result = await figma.listTeamProjects(p.team_id);
            break;
          case "list_project_files":
            result = await figma.listProjectFiles(p.project_id);
            break;
          case "get_file":
            result = await figma.getFile(p.file_key, { depth: p.depth });
            break;
          case "get_file_nodes":
            result = await figma.getFileNodes(p.file_key, p.node_ids, { depth: p.depth });
            break;
          case "export_images":
            result = await figma.exportImages(p.file_key, p.node_ids, {
              format: p.format,
              scale: p.scale,
            });
            break;
          case "list_comments":
            result = await figma.listComments(p.file_key);
            break;
          case "post_comment":
            result = await figma.postComment(p.file_key, p.message, {
              comment_id: p.comment_id,
            });
            break;
          case "delete_comment":
            await figma.deleteComment(p.file_key, p.comment_id);
            result = { success: true, file_key: p.file_key, comment_id: p.comment_id };
            break;
          case "list_versions":
            result = await figma.listVersions(p.file_key);
            break;
          case "get_file_components":
            result = await figma.getFileComponents(p.file_key);
            break;
          case "get_team_components":
            result = await figma.getTeamComponents(p.team_id, {
              page_size: p.page_size,
              after: p.after,
            });
            break;
          case "get_file_component_sets":
            result = await figma.getFileComponentSets(p.file_key);
            break;
          case "get_team_component_sets":
            result = await figma.getTeamComponentSets(p.team_id, {
              page_size: p.page_size,
              after: p.after,
            });
            break;
          case "get_file_styles":
            result = await figma.getFileStyles(p.file_key);
            break;
          case "get_team_styles":
            result = await figma.getTeamStyles(p.team_id, {
              page_size: p.page_size,
              after: p.after,
            });
            break;
          case "get_local_variables":
            result = await figma.getLocalVariables(p.file_key);
            break;
          case "get_published_variables":
            result = await figma.getPublishedVariables(p.file_key);
            break;
          default:
            throw new McpError(ErrorCode.InvalidParams, `Unknown Figma action: ${(args as { action?: string }).action}`);
        }
        return jsonResult(result);
      }

      // ─── Microsoft To Do ───
      case "mx_ms_todo": {
        const p = args as unknown as OfficeMsTodoParams;
        const accountId = await resolveAppAccount(morphixClient, "microsofttodo", p.account_id);
        const todo = new MsTodoClient(morphixClient, accountId);

        let result;
        switch (p.action) {
          case "list_task_lists":
            result = await todo.listTaskLists();
            break;
          case "create_task_list":
            result = await todo.createTaskList(p.display_name);
            break;
          case "list_tasks":
            result = await todo.listTasks(p.list_id, {
              top: p.top,
              filter: p.filter,
              orderBy: p.order_by,
            });
            break;
          case "get_task":
            result = await todo.getTask(p.list_id, p.task_id);
            break;
          case "create_task":
            result = await todo.createTask(p.list_id, {
              title: p.title,
              body: p.body,
              importance: p.importance,
              dueDate: p.due_date,
              isReminderOn: p.is_reminder_on,
            });
            break;
          case "update_task": {
            const fields: Record<string, any> = {};
            if (p.title) fields.title = p.title;
            if (p.status) fields.status = p.status;
            if (p.importance) fields.importance = p.importance;
            result = await todo.updateTask(p.list_id, p.task_id, fields);
            break;
          }
          case "complete_task":
            result = await todo.completeTask(p.list_id, p.task_id);
            break;
          case "delete_task":
            await todo.deleteTask(p.list_id, p.task_id);
            result = { success: true, message: "Task deleted" };
            break;
          default:
            throw new McpError(ErrorCode.InvalidParams, `Unknown MS Todo action: ${(args as { action?: string }).action}`);
        }
        return jsonResult(result);
      }

      // ─── Link (Account Management & Proxy) ───
      case "mx_link": {
        const p = args as unknown as OfficeLinkParams;

        switch (p.action) {
          case "check_auth": {
            const authResult = await morphixClient.checkAuth();
            return jsonResult({ authenticated: true, user: authResult.user });
          }
          case "list_accounts": {
            const accounts = await morphixClient.listAccounts(p.app_name, p.active_only);
            return jsonResult({
              accounts,
              count: accounts.length,
              ...(accounts.length === 0 && {
                hint: p.app_name
                  ? `No ${p.app_name} accounts linked. Use action "connect" with app="${p.app_name}" to generate an OAuth link.`
                  : 'No accounts linked. Use action "connect" to generate an OAuth link.',
              }),
            });
          }
          case "get_account": {
            const account = await morphixClient.getAccount(p.account_id);
            return jsonResult({ account });
          }
          case "statistics": {
            const stats = await morphixClient.getStatistics();
            return jsonResult(stats);
          }
          case "list_apps": {
            const appsResult = await morphixClient.listApps(p.q, p.limit, p.offset);
            return jsonResult({ apps: appsResult.data, count: appsResult.count });
          }
          case "connect": {
            const connectResult = await morphixClient.createConnectToken(p.app, p.redirect_url);
            let connectUrl = connectResult.connectLinkUrl;
            if (p.app && connectUrl && !connectUrl.includes("app=")) {
              connectUrl += `&app=${encodeURIComponent(p.app)}`;
            }
            return jsonResult({
              connect_url: connectUrl,
              expires_at: connectResult.expiresAt,
              instructions: `Send this URL to the user to complete ${p.app || "app"} authorization: ${connectUrl}`,
              note: "The link expires in 4 hours. After user completes authorization, use list_accounts to verify the connection.",
            });
          }
          case "proxy": {
            const proxyResult = await morphixClient.proxy({
              accountId: p.account_id,
              method: p.method,
              url: p.url,
              headers: p.headers,
              body: p.body,
              params: p.params,
            });
            return jsonResult(proxyResult);
          }
          default:
            throw new McpError(ErrorCode.InvalidParams, `Unknown Link action: ${(args as { action?: string }).action}`);
        }
      }

      case "mx_flights": {
        const p = args as unknown as OfficeFlightsParams;
        const flights = new FlightsClient({ apiKey: API_KEY, baseUrl: process.env.MORPHIXAI_BASE_URL });

        let result;
        switch (p.action) {
          case "search_flights":
            result = await flights.searchFlights({
              slices: p.slices,
              passengers: p.passengers,
              cabin_class: p.cabin_class,
              max_connections: p.max_connections,
            });
            break;
          case "list_offers":
            result = await flights.listOffers({
              offer_request_id: p.offer_request_id,
              limit: p.limit,
              sort: p.sort,
            });
            break;
          case "get_offer":
            result = await flights.getOffer(p.offer_id);
            break;
          case "create_payment_session":
            result = await flights.createPaymentSession({
              offer_id: p.offer_id,
              passengers: p.passengers,
            });
            break;
          case "create_order":
            result = await flights.createOrder({
              offer_id: p.offer_id,
              passengers: p.passengers,
              type: p.type,
            });
            break;
          case "list_orders":
            result = await flights.listOrders({
              status: p.status,
              limit: p.limit,
              offset: p.offset,
            });
            break;
          case "get_order":
            result = await flights.getOrder(p.order_id);
            break;
          case "pay_order":
            result = await flights.payOrder(p.order_id);
            break;
          case "cancel_order":
            result = await flights.cancelOrder(p.order_id);
            break;
          case "get_seat_maps":
            result = await flights.getSeatMaps(p.offer_id);
            break;
          case "search_airports":
            result = await flights.searchAirports(p.query);
            break;
          default:
            throw new McpError(ErrorCode.InvalidParams, `Unknown flights action: ${(args as { action?: string }).action}`);
        }
        return jsonResult(result);
      }

      default:
        throw new McpError(ErrorCode.MethodNotFound, `Tool not found: ${name}`);
    }
  } catch (err: unknown) {
    if (err instanceof AppNotConnectedError) {
      return {
        content: [{ type: "text", text: `Error: ${err.message}\nAction required: Connect your account at ${CONNECTIONS_URL}` }],
        isError: true,
      };
    }
    if (err instanceof McpError) throw err;
    return {
      content: [{ type: "text", text: `Error: ${err instanceof Error ? err.message : String(err)}` }],
      isError: true,
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("MorphixAI MCP Server running on stdio");
}

main().catch((err) => {
  console.error("Server error:", err);
  process.exit(1);
});
