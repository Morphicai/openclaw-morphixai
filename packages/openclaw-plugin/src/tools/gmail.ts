import type { OpenClawPluginApi } from "openclaw/plugin-sdk";
import { OfficeGmailSchema, type OfficeGmailParams } from "@morphixai/core";
import { GmailClient } from "@morphixai/core";
import { resolveConfig, resolveAppAccount, AppNotConnectedError, NO_API_KEY_ERROR, CONNECTIONS_URL } from "./_tool-helpers.js";
import { MorphixClient, MorphixAPIError } from "@morphixai/core";
import { json } from "@morphixai/core";

const APP_SLUG = "gmail";

export function registerOfficeGmailTool(api: OpenClawPluginApi) {
  api.registerTool(
    {
      name: "mx_gmail",
      label: "Gmail",
      description:
        "Gmail integration: list, read, search, send emails. Manage labels, mark as read, trash messages. " +
        "Actions: get_profile, list_messages, get_message, send_mail, search_messages, list_labels, mark_as_read, trash_message",
      parameters: OfficeGmailSchema,
      async execute(_toolCallId, params) {
        const p = params as OfficeGmailParams;

        const config = resolveConfig(api);
        if (!config) {
          return json(NO_API_KEY_ERROR);
        }

        const client = new MorphixClient({ apiKey: config.apiKey, baseUrl: config.baseUrl });

        try {
          const accountId = await resolveAppAccount(client, APP_SLUG, (p as any).account_id);
          const gmail = new GmailClient(client, accountId);

          switch (p.action) {
            case "get_profile":
              return json(await gmail.getProfile());

            case "list_messages":
              return json(
                await gmail.listMessages({
                  q: p.q,
                  maxResults: p.max_results,
                  labelIds: p.label_ids,
                  pageToken: p.page_token,
                }),
              );

            case "get_message":
              return json(await gmail.getMessage(p.message_id, p.format));

            case "send_mail":
              return json(
                await gmail.sendMail({
                  to: p.to,
                  subject: p.subject,
                  body: p.body,
                  cc: p.cc,
                  from: p.from,
                }),
              );

            case "search_messages":
              return json(await gmail.searchMessages(p.query, p.max_results));

            case "list_labels":
              return json(await gmail.listLabels());

            case "mark_as_read":
              return json(await gmail.markAsRead(p.message_id));

            case "trash_message":
              return json(await gmail.trashMessage(p.message_id));

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
    { name: "mx_gmail" },
  );

  api.logger.info?.("mx_gmail: Registered");
}
