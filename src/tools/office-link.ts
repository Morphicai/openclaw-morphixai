import type { OpenClawPluginApi } from "openclaw/plugin-sdk";
import { OfficeLinkSchema, type OfficeLinkParams } from "../schemas/office-link-schema.js";
import { BaibianClient, BaibianAPIError } from "../baibian-client.js";
import { json } from "../helpers.js";

/** Cached client instance keyed on apiKey + baseUrl */
let cachedClient: BaibianClient | null = null;
let cachedKey: string | null = null;

function getClient(apiKey: string, baseUrl?: string): BaibianClient {
  const key = `${apiKey}|${baseUrl ?? ""}`;
  if (cachedClient && cachedKey === key) return cachedClient;
  cachedClient = new BaibianClient({ apiKey, baseUrl });
  cachedKey = key;
  return cachedClient;
}

/**
 * Resolve MorphixAI API config from OpenClaw plugin config or env vars
 */
function resolveConfig(api: OpenClawPluginApi): { apiKey: string; baseUrl?: string } | null {
  // Try plugin config first
  const officeConfig = (api.config as any)?.office ?? (api.config as any);
  const baibianConfig = officeConfig?.baibian;

  const apiKey =
    baibianConfig?.apiKey ||
    process.env.MORPHIXAI_API_KEY ||
    process.env.BAIBIAN_API_KEY ||  // legacy fallback
    process.env.BAIBIAN_TOKEN;      // legacy fallback

  if (!apiKey) return null;

  const baseUrl =
    baibianConfig?.baseUrl ||
    process.env.MORPHIXAI_BASE_URL ||
    process.env.BAIBIAN_BASE_URL || // legacy fallback
    undefined;

  return { apiKey, baseUrl };
}

/**
 * Register mx_link tool
 *
 * Provides unified third-party account linking and proxy API access
 * via MorphixAI Pipedream integration.
 */
export function registerOfficeLinkTool(api: OpenClawPluginApi) {
  // Check if explicitly disabled
  const officeConfig = (api.config as any)?.office ?? (api.config as any);
  if (officeConfig?.baibian?.enabled === false) {
    api.logger.debug?.("mx_link: disabled in config");
    return;
  }

  api.registerTool(
    {
      name: "mx_link",
      label: "Office Link",
      description:
        "Manage linked third-party accounts (GitHub, GitLab, Gmail, Outlook, Jira, Slack, etc.) and call their APIs through MorphixAI proxy. " +
        "Actions: list_accounts, get_account, statistics, list_apps, connect (generate OAuth link), proxy (call third-party API), check_auth",
      parameters: OfficeLinkSchema,
      async execute(_toolCallId, params) {
        const p = params as OfficeLinkParams;

        // Resolve config on each call (allows runtime env changes)
        const config = resolveConfig(api);
        if (!config) {
          return json({
            error: "MorphixAI API key not configured. Set MORPHIXAI_API_KEY environment variable or configure office.baibian.apiKey in openclaw config.",
            setup_guide: "Visit https://baibian.app/api-keys to create an API Key (select all scopes).",
            connections_guide: "After creating the API Key, visit https://baibian.app/connections to link your third-party accounts.",
          });
        }

        const client = getClient(config.apiKey, config.baseUrl);

        try {
          switch (p.action) {
            // ─── Auth Check ───
            case "check_auth": {
              const result = await client.checkAuth();
              return json({
                authenticated: true,
                user: result.user,
              });
            }

            // ─── Account Management ───
            case "list_accounts": {
              const accounts = await client.listAccounts(p.app_name, p.active_only);
              return json({
                accounts,
                count: accounts.length,
                ...(accounts.length === 0 && {
                  hint: p.app_name
                    ? `No ${p.app_name} accounts linked. Use action "connect" with app="${p.app_name}" to generate an OAuth link for the user.`
                    : 'No accounts linked. Use action "connect" to generate an OAuth link for the user.',
                }),
              });
            }

            case "get_account": {
              const account = await client.getAccount(p.account_id);
              return json({ account });
            }

            case "statistics": {
              const stats = await client.getStatistics();
              return json(stats);
            }

            case "list_apps": {
              const result = await client.listApps(p.q, p.limit, p.offset);
              return json({
                apps: result.data,
                count: result.count,
              });
            }

            // ─── Connect (OAuth) ───
            case "connect": {
              const result = await client.createConnectToken(p.app, p.redirect_url);
              // 后端返回的 connectLinkUrl 可能不包含 app 参数，需要手动追加才能正常访问
              let connectUrl = result.connectLinkUrl;
              if (p.app && connectUrl && !connectUrl.includes("app=")) {
                connectUrl += `&app=${encodeURIComponent(p.app)}`;
              }
              return json({
                connect_url: connectUrl,
                expires_at: result.expiresAt,
                instructions: `Send this URL to the user to complete ${p.app || "app"} authorization: ${connectUrl}`,
                note: "The link expires in 4 hours. After user completes authorization, use list_accounts to verify the connection.",
              });
            }

            // ─── Proxy API Call ───
            case "proxy": {
              const result = await client.proxy({
                accountId: p.account_id,
                method: p.method,
                url: p.url,
                headers: p.headers,
                body: p.body,
                params: p.params,
              });
              return json(result);
            }

            default:
              return json({ error: `Unknown action: ${(p as any).action}` });
          }
        } catch (err) {
          if (err instanceof BaibianAPIError) {
            // Provide helpful error messages
            const errorInfo: any = {
              error: err.message,
              status: err.statusCode,
            };

            if (err.statusCode === 401) {
              errorInfo.hint =
                "API Key is invalid, revoked, or expired. Visit MorphixAI console (https://baibian.app/api-keys) to create a new one.";
            } else if (err.statusCode === 403) {
              errorInfo.hint =
                "API Key lacks required scope. Ensure all scopes (user:profile:read, link) are selected.";
            }

            return json(errorInfo);
          }

          return json({
            error: err instanceof Error ? err.message : String(err),
          });
        }
      },
    },
    { name: "mx_link" },
  );

  api.logger.info?.("mx_link: Registered mx_link tool");
}
