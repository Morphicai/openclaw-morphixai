import type { OpenClawPluginApi } from "openclaw/plugin-sdk";
import { OfficeJiraSchema, type OfficeJiraParams } from "../schemas/office-jira-schema.js";
import { JiraClient } from "../app-clients/jira-client.js";
import { resolveConfig, resolveAppAccount, AppNotConnectedError, NO_API_KEY_ERROR, CONNECTIONS_URL } from "./_tool-helpers.js";
import { BaibianClient, BaibianAPIError } from "../baibian-client.js";
import { json } from "../helpers.js";

const APP_SLUG = "jira";

export function registerOfficeJiraTool(api: OpenClawPluginApi) {
  api.registerTool(
    {
      name: "mx_jira",
      label: "Jira",
      description:
        "Jira Cloud integration: search issues with JQL, create/update issues, transition status, add comments, list projects. " +
        "Actions: get_myself, list_projects, search_issues, get_issue, create_issue, update_issue, transition_issue, get_transitions, add_comment",
      parameters: OfficeJiraSchema,
      async execute(_toolCallId, params) {
        const p = params as OfficeJiraParams;

        const config = resolveConfig(api);
        if (!config) {
          return json(NO_API_KEY_ERROR);
        }

        const client = new BaibianClient({ apiKey: config.apiKey, baseUrl: config.baseUrl });

        try {
          const accountId = await resolveAppAccount(client, APP_SLUG, (p as any).account_id);
          const jira = new JiraClient(client, accountId);

          switch (p.action) {
            case "get_myself":
              return json(await jira.getMyself());

            case "list_projects":
              return json(
                await jira.listProjects({
                  query: p.query,
                  maxResults: p.max_results,
                }),
              );

            case "search_issues":
              return json(
                await jira.searchIssues(p.jql, {
                  maxResults: p.max_results,
                  fields: p.fields,
                }),
              );

            case "get_issue":
              return json(await jira.getIssue(p.issue_key, p.fields));

            case "create_issue":
              return json(
                await jira.createIssue({
                  project: p.project,
                  summary: p.summary,
                  issueType: p.issue_type,
                  description: p.description,
                  assigneeAccountId: p.assignee_account_id,
                  priority: p.priority,
                  labels: p.labels,
                  duedate: p.duedate,
                }),
              );

            case "update_issue":
              await jira.updateIssue(p.issue_key, p.fields);
              return json({ success: true, issue_key: p.issue_key });

            case "transition_issue":
              await jira.transitionIssue(p.issue_key, p.target_status);
              return json({
                success: true,
                issue_key: p.issue_key,
                target_status: p.target_status,
              });

            case "get_transitions":
              return json(await jira.getTransitions(p.issue_key));

            case "add_comment":
              return json(await jira.addComment(p.issue_key, p.body));

            default:
              return json({ error: `Unknown action: ${(p as any).action}` });
          }
        } catch (err) {
          if (err instanceof AppNotConnectedError) {
            return json({ error: err.message, action_required: "connect_account", app: APP_SLUG, connect_url: CONNECTIONS_URL });
          }
          if (err instanceof BaibianAPIError) {
            return json({ error: err.message, status: err.statusCode });
          }
          return json({ error: err instanceof Error ? err.message : String(err) });
        }
      },
    },
    { name: "mx_jira" },
  );

  api.logger.info?.("mx_jira: Registered");
}
