import type { OpenClawPluginApi } from "openclaw/plugin-sdk";
import { OfficeNotionSchema, type OfficeNotionParams } from "../schemas/notion-schema.js";
import { NotionClient } from "../app-clients/notion-client.js";
import { resolveConfig, resolveAppAccount, AppNotConnectedError, NO_API_KEY_ERROR, CONNECTIONS_URL } from "./_tool-helpers.js";
import { MorphixClient, MorphixAPIError } from "../morphix-client.js";
import { json } from "../helpers.js";

const APP_SLUG = "notion";

export function registerOfficeNotionTool(api: OpenClawPluginApi) {
  api.registerTool(
    {
      name: "mx_notion",
      label: "Notion",
      description:
        "Notion integration: search pages/databases, create/update/archive pages, read/append block content, query databases. " +
        "Actions: get_me, search, get_page, create_page, update_page, archive_page, get_block_children, append_blocks, get_database, query_database",
      parameters: OfficeNotionSchema,
      async execute(_toolCallId, params) {
        const p = params as OfficeNotionParams;

        const config = resolveConfig(api);
        if (!config) {
          return json(NO_API_KEY_ERROR);
        }

        const client = new MorphixClient({ apiKey: config.apiKey, baseUrl: config.baseUrl });

        try {
          const accountId = await resolveAppAccount(client, APP_SLUG, (p as any).account_id);
          const notion = new NotionClient(client, accountId);

          switch (p.action) {
            case "get_me":
              return json(await notion.getMe());

            case "search":
              return json(
                await notion.search({
                  query: p.query,
                  filter: p.filter_type
                    ? { property: "object", value: p.filter_type }
                    : undefined,
                  pageSize: p.page_size,
                  startCursor: p.start_cursor,
                }),
              );

            case "get_page":
              return json(await notion.getPage(p.page_id));

            case "create_page": {
              const parent =
                p.parent_type === "database"
                  ? { database_id: p.parent_id }
                  : { page_id: p.parent_id };
              const properties = p.properties ?? {
                title: { title: [{ text: { content: p.title } }] },
              };
              return json(
                await notion.createPage({
                  parent,
                  properties,
                  children: p.children,
                }),
              );
            }

            case "update_page":
              return json(await notion.updatePage(p.page_id, p.properties));

            case "archive_page":
              return json(await notion.archivePage(p.page_id));

            case "get_block_children":
              return json(
                await notion.getBlockChildren(p.block_id, {
                  pageSize: p.page_size,
                  startCursor: p.start_cursor,
                }),
              );

            case "append_blocks":
              return json(await notion.appendBlocks(p.block_id, p.children));

            case "get_database":
              return json(await notion.getDatabase(p.database_id));

            case "query_database":
              return json(
                await notion.queryDatabase(p.database_id, {
                  filter: p.filter,
                  sorts: p.sorts,
                  pageSize: p.page_size,
                  startCursor: p.start_cursor,
                }),
              );

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
    { name: "mx_notion" },
  );

  api.logger.info?.("mx_notion: Registered");
}
