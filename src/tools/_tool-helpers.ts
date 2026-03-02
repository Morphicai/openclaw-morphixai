/**
 * Shared helpers for app-specific tools.
 *
 * Provides config resolution, client caching, and automatic account lookup.
 */
import type { OpenClawPluginApi } from "openclaw/plugin-sdk";
import { BaibianClient, BaibianAPIError } from "../baibian-client.js";
import { json } from "../helpers.js";

// ─── Client caching ───

let cachedClient: BaibianClient | null = null;
let cachedKey: string | null = null;

function getClient(apiKey: string, baseUrl?: string): BaibianClient {
  const key = `${apiKey}|${baseUrl ?? ""}`;
  if (cachedClient && cachedKey === key) return cachedClient;
  cachedClient = new BaibianClient({ apiKey, baseUrl });
  cachedKey = key;
  return cachedClient;
}

// ─── Config resolution ───

export interface ResolvedConfig {
  apiKey: string;
  baseUrl?: string;
}

export function resolveConfig(
  api: OpenClawPluginApi,
): ResolvedConfig | null {
  const officeConfig = (api.config as any)?.office ?? (api.config as any);
  const baibianConfig = officeConfig?.baibian;

  const apiKey =
    baibianConfig?.apiKey ||
    process.env.MORPHIXAI_API_KEY ||
    process.env.BAIBIAN_API_KEY ||
    process.env.BAIBIAN_TOKEN;

  if (!apiKey) return null;

  const baseUrl =
    baibianConfig?.baseUrl ||
    process.env.MORPHIXAI_BASE_URL ||
    process.env.BAIBIAN_BASE_URL ||
    undefined;

  return { apiKey, baseUrl };
}

// ─── Account resolution ───

/**
 * Resolve the account ID for a specific Pipedream app.
 * If `accountId` is provided, returns it directly.
 * Otherwise, looks up the first active account for the given app slug.
 */
export async function resolveAppAccount(
  client: BaibianClient,
  appSlug: string,
  accountId?: string,
): Promise<string> {
  if (accountId) return accountId;

  const accounts = await client.listAccounts(appSlug, true);
  if (accounts.length === 0) {
    throw new AppNotConnectedError(appSlug);
  }
  // Use accountId (apn_xxx format), NOT id (internal DB id)
  const active = accounts.find((a) => a.isActive) || accounts[0];
  return active.accountId;
}

export const API_KEY_GUIDE_URL = "https://morphix.app/api-keys";
export const CONNECTIONS_URL = "https://morphix.app/connections";

export const NO_API_KEY_ERROR = {
  error:
    "MorphixAI API key not configured. Set MORPHIXAI_API_KEY environment variable or configure office.baibian.apiKey in openclaw config.",
  setup_guide: `Visit ${API_KEY_GUIDE_URL} to create an API Key (select all scopes).`,
};

export class AppNotConnectedError extends Error {
  constructor(public readonly appSlug: string) {
    super(
      `No ${appSlug} account connected. Visit ${CONNECTIONS_URL} to link your ${appSlug} account, or use the mx_link tool with action "connect" and app="${appSlug}".`,
    );
    this.name = "AppNotConnectedError";
  }
}

// ─── Error handler ───

/**
 * Wrap a tool execute function with standard error handling.
 */
export function wrapToolExecute(
  appSlug: string,
  fn: (client: BaibianClient, config: ResolvedConfig) => Promise<any>,
) {
  return async (api: OpenClawPluginApi) => {
    const config = resolveConfig(api);
    if (!config) {
      return json(NO_API_KEY_ERROR);
    }

    const client = getClient(config.apiKey, config.baseUrl);

    try {
      return await fn(client, config);
    } catch (err) {
      if (err instanceof AppNotConnectedError) {
        return json({
          error: err.message,
          action_required: "connect_account",
          app: err.appSlug,
          connect_url: CONNECTIONS_URL,
        });
      }
      if (err instanceof BaibianAPIError) {
        const errorInfo: any = {
          error: err.message,
          status: err.statusCode,
        };
        if (err.statusCode === 401) {
          errorInfo.hint =
            `API Key is invalid, revoked, or expired. Visit ${API_KEY_GUIDE_URL} to create a new one.`;
        } else if (err.statusCode === 403) {
          errorInfo.hint =
            `API Key lacks required scope. Visit ${API_KEY_GUIDE_URL} and ensure all scopes are selected.`;
        }
        return json(errorInfo);
      }
      return json({
        error: err instanceof Error ? err.message : String(err),
      });
    }
  };
}
