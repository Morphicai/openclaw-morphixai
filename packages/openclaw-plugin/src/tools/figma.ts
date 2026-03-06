import type { OpenClawPluginApi } from "openclaw/plugin-sdk";
import { OfficeFigmaSchema, type OfficeFigmaParams } from "@morphixai/core";
import { FigmaClient } from "@morphixai/core";
import { resolveConfig, resolveAppAccount, AppNotConnectedError, NO_API_KEY_ERROR, CONNECTIONS_URL } from "./_tool-helpers.js";
import { MorphixClient, MorphixAPIError } from "@morphixai/core";
import { json } from "@morphixai/core";

const APP_SLUG = "figma";

export function registerOfficeFigmaTool(api: OpenClawPluginApi) {
  api.registerTool(
    {
      name: "mx_figma",
      label: "Figma",
      description:
        "Figma integration: browse team projects & files, read file structure/pages/nodes, export images, manage comments, view version history, inspect components/component sets/styles, get design variables (tokens). " +
        "Actions: get_me, list_team_projects, list_project_files, get_file, get_file_nodes, export_images, list_comments, post_comment, delete_comment, list_versions, get_file_components, get_team_components, get_file_component_sets, get_team_component_sets, get_file_styles, get_team_styles, get_local_variables, get_published_variables",
      parameters: OfficeFigmaSchema,
      async execute(_toolCallId, params) {
        const p = params as OfficeFigmaParams;

        const config = resolveConfig(api);
        if (!config) {
          return json(NO_API_KEY_ERROR);
        }

        const client = new MorphixClient({ apiKey: config.apiKey, baseUrl: config.baseUrl });

        try {
          const accountId = await resolveAppAccount(client, APP_SLUG, (p as any).account_id);
          const figma = new FigmaClient(client, accountId);

          switch (p.action) {
            // ─── User ───
            case "get_me":
              return json(await figma.getMe());

            // ─── Teams & Projects ───
            case "list_team_projects":
              return json(await figma.listTeamProjects(p.team_id));

            case "list_project_files":
              return json(await figma.listProjectFiles(p.project_id));

            // ─── Files ───
            case "get_file":
              return json(await figma.getFile(p.file_key, { depth: p.depth }));

            case "get_file_nodes":
              return json(
                await figma.getFileNodes(p.file_key, p.node_ids, { depth: p.depth }),
              );

            // ─── Images ───
            case "export_images":
              return json(
                await figma.exportImages(p.file_key, p.node_ids, {
                  format: p.format,
                  scale: p.scale,
                }),
              );

            // ─── Comments ───
            case "list_comments":
              return json(await figma.listComments(p.file_key));

            case "post_comment":
              return json(
                await figma.postComment(p.file_key, p.message, {
                  comment_id: p.comment_id,
                }),
              );

            case "delete_comment":
              await figma.deleteComment(p.file_key, p.comment_id);
              return json({ success: true, file_key: p.file_key, comment_id: p.comment_id });

            // ─── Versions ───
            case "list_versions":
              return json(await figma.listVersions(p.file_key));

            // ─── Components ───
            case "get_file_components":
              return json(await figma.getFileComponents(p.file_key));

            case "get_team_components":
              return json(
                await figma.getTeamComponents(p.team_id, {
                  page_size: p.page_size,
                  after: p.after,
                }),
              );

            // ─── Component Sets (Variants) ───
            case "get_file_component_sets":
              return json(await figma.getFileComponentSets(p.file_key));

            case "get_team_component_sets":
              return json(
                await figma.getTeamComponentSets(p.team_id, {
                  page_size: p.page_size,
                  after: p.after,
                }),
              );

            // ─── Styles ───
            case "get_file_styles":
              return json(await figma.getFileStyles(p.file_key));

            case "get_team_styles":
              return json(
                await figma.getTeamStyles(p.team_id, {
                  page_size: p.page_size,
                  after: p.after,
                }),
              );

            // ─── Variables (Design Tokens) ───
            case "get_local_variables":
              return json(await figma.getLocalVariables(p.file_key));

            case "get_published_variables":
              return json(await figma.getPublishedVariables(p.file_key));

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
    { name: "mx_figma" },
  );

  api.logger.info?.("mx_figma: Registered");
}
