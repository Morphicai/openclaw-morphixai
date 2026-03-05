import type { OpenClawPluginApi } from "openclaw/plugin-sdk";
import { OfficeGitHubSchema, type OfficeGitHubParams } from "../schemas/github-schema.js";
import { GitHubClient } from "../app-clients/github-client.js";
import { resolveConfig, resolveAppAccount, AppNotConnectedError, NO_API_KEY_ERROR, CONNECTIONS_URL } from "./_tool-helpers.js";
import { MorphixClient, MorphixAPIError } from "../morphix-client.js";
import { json } from "../helpers.js";

const APP_SLUG = "github";

export function registerOfficeGitHubTool(api: OpenClawPluginApi) {
  api.registerTool(
    {
      name: "mx_github",
      label: "GitHub",
      description:
        "GitHub integration: list repos, issues, pull requests, workflow runs. Create issues/PRs, update issues, trigger workflows. " +
        "Actions: get_user, list_repos, get_repo, list_issues, create_issue, update_issue, list_pulls, create_pull, list_workflow_runs, trigger_workflow",
      parameters: OfficeGitHubSchema,
      async execute(_toolCallId, params) {
        const p = params as OfficeGitHubParams;

        const config = resolveConfig(api);
        if (!config) {
          return json(NO_API_KEY_ERROR);
        }

        const client = new MorphixClient({ apiKey: config.apiKey, baseUrl: config.baseUrl });

        try {
          const accountId = await resolveAppAccount(client, APP_SLUG, (p as any).account_id);
          const github = new GitHubClient(client, accountId);

          switch (p.action) {
            case "get_user":
              return json(await github.getCurrentUser());

            case "list_repos":
              return json(
                await github.listRepos({
                  sort: p.sort,
                  type: p.type,
                  perPage: p.per_page,
                  page: p.page,
                }),
              );

            case "get_repo":
              return json(await github.getRepo(p.repo));

            case "list_issues":
              return json(
                await github.listIssues(p.repo, {
                  state: p.state,
                  labels: p.labels,
                  perPage: p.per_page,
                  page: p.page,
                }),
              );

            case "create_issue":
              return json(
                await github.createIssue(p.repo, {
                  title: p.title,
                  body: p.body,
                  labels: p.labels,
                  assignees: p.assignees,
                }),
              );

            case "update_issue":
              return json(
                await github.updateIssue(p.repo, p.issue_number, {
                  title: p.title,
                  body: p.body,
                  state: p.state,
                  labels: p.labels,
                }),
              );

            case "list_pulls":
              return json(
                await github.listPulls(p.repo, {
                  state: p.state,
                  perPage: p.per_page,
                  page: p.page,
                }),
              );

            case "create_pull":
              return json(
                await github.createPull(p.repo, {
                  title: p.title,
                  head: p.head,
                  base: p.base,
                  body: p.body,
                }),
              );

            case "list_workflow_runs":
              return json(
                await github.listWorkflowRuns(p.repo, {
                  status: p.status,
                  perPage: p.per_page,
                }),
              );

            case "trigger_workflow":
              await github.triggerWorkflow(p.repo, p.workflow_id, p.ref, p.inputs);
              return json({ success: true, repo: p.repo, workflow_id: p.workflow_id, ref: p.ref });

            default:
              return json({ error: `Unknown action: ${(p as any).action}` });
          }
        } catch (err) {
          if (err instanceof AppNotConnectedError) {
            return json({ error: err.message, action_required: "connect_account", app: APP_SLUG, connect_url: CONNECTIONS_URL });
          }
          if (err instanceof MorphixAPIError) {
            return json({ error: err.message, status: err.statusCode });
          }
          return json({ error: err instanceof Error ? err.message : String(err) });
        }
      },
    },
    { name: "mx_github" },
  );

  api.logger.info?.("mx_github: Registered");
}
