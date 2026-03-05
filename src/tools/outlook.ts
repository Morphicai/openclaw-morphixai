import type { OpenClawPluginApi } from "openclaw/plugin-sdk";
import { OfficeOutlookSchema, type OfficeOutlookParams } from "../schemas/outlook-schema.js";
import { OutlookClient } from "../app-clients/outlook-client.js";
import { resolveConfig, resolveAppAccount, AppNotConnectedError, NO_API_KEY_ERROR, CONNECTIONS_URL } from "./_tool-helpers.js";
import { MorphixClient, MorphixAPIError } from "../morphix-client.js";
import { json } from "../helpers.js";

const APP_SLUG = "microsoft_outlook";

export function registerOfficeOutlookTool(api: OpenClawPluginApi) {
  api.registerTool(
    {
      name: "mx_outlook",
      label: "Outlook Email",
      description:
        "Microsoft Outlook email integration: read, search, send, and reply to emails. List mail folders. " +
        "Actions: get_me, list_messages, get_message, send_mail, reply_to_message, search_messages, list_folders",
      parameters: OfficeOutlookSchema,
      async execute(_toolCallId, params) {
        const p = params as OfficeOutlookParams;

        const config = resolveConfig(api);
        if (!config) {
          return json(NO_API_KEY_ERROR);
        }

        const client = new MorphixClient({ apiKey: config.apiKey, baseUrl: config.baseUrl });

        try {
          const accountId = await resolveAppAccount(client, APP_SLUG, (p as any).account_id);
          const outlook = new OutlookClient(client, accountId);

          switch (p.action) {
            case "get_me":
              return json(await outlook.getMe());

            case "list_messages":
              return json(
                await outlook.listMessages({
                  folderId: p.folder_id,
                  top: p.top,
                  skip: p.skip,
                  filter: p.filter,
                  search: p.search,
                  orderBy: p.order_by,
                }),
              );

            case "get_message":
              return json(await outlook.getMessage(p.message_id));

            case "send_mail":
              await outlook.sendMail({
                subject: p.subject,
                body: p.body,
                bodyType: p.body_type,
                toRecipients: p.to,
                ccRecipients: p.cc,
              });
              return json({ success: true, message: "Email sent successfully" });

            case "reply_to_message":
              await outlook.replyToMessage(p.message_id, p.comment);
              return json({ success: true, message: "Reply sent successfully" });

            case "search_messages":
              return json(
                await outlook.searchMessages(p.query, { top: p.top }),
              );

            case "list_folders":
              return json(await outlook.listFolders());

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
    { name: "mx_outlook" },
  );

  api.logger.info?.("mx_outlook: Registered");
}
