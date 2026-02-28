/**
 * Shared test helpers for app-client integration tests.
 *
 * Setup:
 *   1. Get API Key at: https://baibian.app/api-keys (select all scopes)
 *   2. Set MORPHIXAI_API_KEY in .env or environment
 *   3. Link accounts at: https://baibian.app/connections
 *   4. Run: npx vitest run test/app-clients/
 *
 * If an app is not connected, the test prints guidance and skips gracefully.
 */
import { BaibianClient } from "../../src/baibian-client.js";

const CONNECTIONS_URL = "https://baibian.app/connections";
const API_KEY_URL = "https://baibian.app/api-keys";

export const API_KEY = process.env.MORPHIXAI_API_KEY;
export const BASE_URL =
  process.env.MORPHIXAI_BASE_URL || process.env.BAIBIAN_BASE_URL;
export const CAN_RUN = !!API_KEY;

if (!CAN_RUN) {
  console.log(`\n  ⚠️  MORPHIXAI_API_KEY not set. Skipping all integration tests.`);
  console.log(`  👉 Get your API Key at: ${API_KEY_URL}`);
  console.log(`  👉 Then link accounts at: ${CONNECTIONS_URL}\n`);
}

/**
 * Create a BaibianClient for tests. Call only when CAN_RUN is true.
 */
export function createClient(): BaibianClient {
  return new BaibianClient({ apiKey: API_KEY!, baseUrl: BASE_URL });
}

/**
 * Resolve account ID for a given app slug.
 * If no account is connected, prints a connect link and returns null.
 *
 * Usage in tests:
 *   const accountId = await resolveAccountId(client, "github");
 *   if (!accountId) return; // test skipped
 */
export async function resolveAccountId(
  client: BaibianClient,
  appSlug: string,
): Promise<string | null> {
  const accounts = await client.listAccounts(appSlug);
  if (accounts.length > 0) {
    const active = accounts.find((a) => a.isActive) || accounts[0];
    return active.accountId;
  }

  // Not connected — guide user to the connections page
  console.log(`\n  ⚠️  No ${appSlug} account linked.`);
  console.log(`  👉 Visit ${CONNECTIONS_URL} to link your ${appSlug} account.`);
  console.log(`  Then re-run the tests.\n`);

  return null;
}

/**
 * Helper to tolerate 5xx server errors (not a client bug).
 */
export async function tolerateServerError<T>(
  fn: () => Promise<T>,
): Promise<T | null> {
  try {
    return await fn();
  } catch (err: any) {
    if (err?.statusCode >= 500 || err?.code === "PROXY_ERROR") {
      console.log(
        `  ⊘ Server/proxy error: ${err.message?.substring(0, 120)}, skipping`,
      );
      return null;
    }
    throw err;
  }
}
