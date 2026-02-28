import type { OpenClawPluginApi } from "openclaw/plugin-sdk";
import { OfficeConfluenceSchema, type OfficeConfluenceParams } from "../schemas/office-confluence-schema.js";
import { ConfluenceClient } from "../app-clients/confluence-client.js";
import { resolveConfig, resolveAppAccount, AppNotConnectedError, NO_API_KEY_ERROR, CONNECTIONS_URL } from "./_tool-helpers.js";
import { BaibianClient, BaibianAPIError } from "../baibian-client.js";
import { json } from "../helpers.js";

const APP_SLUG = "confluence";

export function registerOfficeConfluenceTool(api: OpenClawPluginApi) {
  api.registerTool(
    {
      name: "office_confluence",
      label: "Confluence",
      description:
        "Confluence Cloud integration: spaces, pages CRUD, labels, comments, child pages, CQL search. " +
        "Actions: list_spaces, get_space, list_pages, get_page, create_page, update_page, delete_page, " +
        "get_child_pages, get_page_labels, add_page_label, delete_page_label, get_page_comments, add_page_comment, search",
      parameters: OfficeConfluenceSchema,
      async execute(_toolCallId, params) {
        const p = params as OfficeConfluenceParams;

        const config = resolveConfig(api);
        if (!config) {
          return json(NO_API_KEY_ERROR);
        }

        const client = new BaibianClient({ apiKey: config.apiKey, baseUrl: config.baseUrl });

        try {
          const accountId = await resolveAppAccount(client, APP_SLUG, (p as any).account_id);
          const confluence = new ConfluenceClient(client, accountId);

          switch (p.action) {
            case "list_spaces":
              return json(
                await confluence.listSpaces({
                  limit: p.limit,
                  type: p.type,
                }),
              );

            case "get_space":
              return json(await confluence.getSpace(p.space_id));

            case "list_pages":
              return json(
                await confluence.listPages({
                  spaceId: p.space_id,
                  limit: p.limit,
                  sort: p.sort,
                }),
              );

            case "get_page":
              return json(
                await confluence.getPage(p.page_id, {
                  bodyFormat: p.body_format,
                }),
              );

            case "create_page":
              return json(
                await confluence.createPage({
                  spaceId: p.space_id,
                  title: p.title,
                  body: p.body,
                  parentId: p.parent_id,
                }),
              );

            case "update_page":
              return json(
                await confluence.updatePage(p.page_id, {
                  title: p.title,
                  body: p.body,
                  version: p.version,
                }),
              );

            case "delete_page":
              await confluence.deletePage(p.page_id);
              return json({ success: true, message: "Page deleted" });

            case "get_child_pages":
              return json(
                await confluence.getChildPages(p.page_id, {
                  limit: p.limit,
                  sort: p.sort,
                }),
              );

            case "get_page_labels":
              return json(
                await confluence.getPageLabels(p.page_id, {
                  limit: p.limit,
                  prefix: p.prefix,
                }),
              );

            case "add_page_label":
              return json(await confluence.addPageLabel(p.page_id, p.label));

            case "delete_page_label":
              await confluence.deletePageLabel(p.page_id, p.label_id);
              return json({ success: true, message: "Label removed" });

            case "get_page_comments":
              return json(
                await confluence.getPageComments(p.page_id, {
                  limit: p.limit,
                  bodyFormat: p.body_format,
                }),
              );

            case "add_page_comment":
              return json(await confluence.addPageComment(p.page_id, p.body));

            case "search":
              return json(
                await confluence.searchContent(p.cql, { limit: p.limit }),
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
    { name: "office_confluence" },
  );

  api.logger.info?.("office_confluence: Registered");
}
