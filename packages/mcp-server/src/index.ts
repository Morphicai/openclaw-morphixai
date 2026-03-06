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
  OfficeGitHubSchema,
  OfficeGitLabSchema,
  OfficeJiraSchema,
  OfficeFlightsSchema,
  type OfficeGitHubParams,
  type OfficeGitLabParams,
  type OfficeJiraParams,
  type OfficeFlightsParams,
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

// --- Server Setup ---
const server = new Server(
  {
    name: "morphixai-mcp",
    version: "0.1.0",
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
        name: "mx_flights",
        description:
          "Flight booking integration (Duffel): search flights, compare offers, book tickets, manage orders, search airports. " +
          "Actions: search_flights, list_offers, get_offer, create_payment_session, create_3ds_session, create_order, list_orders, get_order, pay_order, cancel_order, get_seat_maps, search_airports",
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
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
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
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
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
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
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
          case "create_3ds_session":
            result = await flights.create3DSSession({
              card_id: p.card_id,
              resource_id: p.resource_id,
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
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
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
