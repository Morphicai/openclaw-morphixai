import type { OpenClawPluginApi } from "openclaw/plugin-sdk";
import { OfficeGitLabSchema, type OfficeGitLabParams } from "../schemas/office-gitlab-schema.js";
import { GitLabClient } from "../app-clients/gitlab-client.js";
import { resolveConfig, resolveAppAccount, AppNotConnectedError, NO_API_KEY_ERROR, CONNECTIONS_URL } from "./_tool-helpers.js";
import { BaibianClient, BaibianAPIError } from "../baibian-client.js";
import { json } from "../helpers.js";

const APP_SLUG = "gitlab";

/** 将字面量 \n (\\n in source) 转换为真正的换行符，防止 LLM 输出转义序列导致显示异常 */
function nl(s?: string): string | undefined {
  return s?.replace(/\\n/g, "\n");
}

export function registerOfficeGitLabTool(api: OpenClawPluginApi) {
  api.registerTool(
    {
      name: "office_gitlab",
      label: "GitLab",
      description:
        "GitLab integration: list projects, merge requests, issues, pipelines, branches. Create MRs and issues, approve/merge MRs, retry pipelines. " +
        "Actions: get_user, list_projects, get_project, get_merge_request, list_merge_requests, create_merge_request, approve_merge_request, merge_merge_request, list_issues, create_issue, list_pipelines, retry_pipeline, list_branches",
      parameters: OfficeGitLabSchema,
      async execute(_toolCallId, params) {
        const p = params as OfficeGitLabParams;

        const config = resolveConfig(api);
        if (!config) {
          return json(NO_API_KEY_ERROR);
        }

        const client = new BaibianClient({ apiKey: config.apiKey, baseUrl: config.baseUrl });

        try {
          const accountId = await resolveAppAccount(client, APP_SLUG, (p as any).account_id);
          const gitlab = new GitLabClient(client, accountId);

          switch (p.action) {
            case "get_user":
              return json(await gitlab.getCurrentUser());

            case "list_projects":
              return json(
                await gitlab.listProjects({
                  search: p.search,
                  perPage: p.per_page,
                  page: p.page,
                  orderBy: p.order_by,
                  sort: p.sort,
                }),
              );

            case "get_project":
              return json(await gitlab.getProject(p.project));

            case "get_merge_request":
              return json(await gitlab.getMergeRequest(p.project, p.mr_iid));

            case "list_merge_requests":
              return json(
                await gitlab.listMergeRequests(p.project, {
                  state: p.state,
                  perPage: p.per_page,
                  page: p.page,
                }),
              );

            case "create_merge_request":
              return json(
                await gitlab.createMergeRequest(p.project, {
                  sourceBranch: p.source_branch,
                  targetBranch: p.target_branch,
                  title: p.title,
                  description: nl(p.description),
                }),
              );

            case "approve_merge_request":
              await gitlab.approveMergeRequest(p.project, p.mr_iid);
              return json({ success: true, project: p.project, mr_iid: p.mr_iid });

            case "merge_merge_request": {
              // 合并前自动检查状态，避免在 MR 未就绪时直接合并导致 500
              const mrDetail = await gitlab.getMergeRequest(p.project, p.mr_iid);
              const status = mrDetail.detailed_merge_status;
              if (status !== "mergeable") {
                const hints: Record<string, string> = {
                  preparing: "MR 刚创建，GitLab 仍在计算合并状态，请稍等片刻后重新检查 get_merge_request",
                  checking: "GitLab 正在检查冲突，请稍等后重试 get_merge_request",
                  ci_must_pass: "CI Pipeline 未通过，请等待 Pipeline 成功后再合并",
                  not_approved: "MR 未获得所需审批，请先 approve_merge_request",
                  discussions_not_resolved: "存在未解决的 Discussion，请先解决所有讨论",
                  blocked_status: "MR 被阻塞，请检查是否有未关闭的阻塞 MR",
                  jira_association_missing: "MR 缺少 Jira 关联，请在描述中添加 Jira 链接",
                };
                return json({
                  error: `MR !${p.mr_iid} 当前无法合并（状态: ${status}）`,
                  detailed_merge_status: status,
                  hint: hints[status] ?? `请检查 get_merge_request 了解当前状态详情`,
                  mr_title: mrDetail.title,
                  mr_web_url: mrDetail.web_url,
                });
              }
              return json(await gitlab.mergeMergeRequest(p.project, p.mr_iid));
            }

            case "list_issues":
              return json(
                await gitlab.listIssues(p.project, {
                  state: p.state,
                  labels: p.labels,
                  perPage: p.per_page,
                  page: p.page,
                }),
              );

            case "create_issue":
              return json(
                await gitlab.createIssue(p.project, {
                  title: p.title,
                  description: nl(p.description),
                  labels: p.labels,
                  assigneeIds: p.assignee_ids,
                }),
              );

            case "list_pipelines":
              return json(
                await gitlab.listPipelines(p.project, {
                  status: p.status,
                  ref: p.ref,
                  perPage: p.per_page,
                }),
              );

            case "retry_pipeline":
              return json(await gitlab.retryPipeline(p.project, p.pipeline_id));

            case "update_merge_request":
              return json(
                await gitlab.updateMergeRequest(p.project, p.mr_iid, {
                  title: p.title,
                  description: nl(p.description),
                  targetBranch: p.target_branch,
                  reviewerIds: p.reviewer_ids,
                  assigneeIds: p.assignee_ids,
                  labels: p.labels,
                }),
              );

            case "search_users":
              return json(await gitlab.searchUsers({ search: p.search, perPage: p.per_page }));

            case "list_branches":
              return json(
                await gitlab.listBranches(p.project, {
                  search: p.search,
                  perPage: p.per_page,
                }),
              );

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
    { name: "office_gitlab" },
  );

  api.logger.info?.("office_gitlab: Registered");
}
