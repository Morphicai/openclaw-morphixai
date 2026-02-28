/**
 * MorphixAI Client (BaibianClient) Integration Tests
 *
 * Tests against the real MorphixAI API.
 * Requires MORPHIXAI_API_KEY environment variable to be set.
 *
 * Run: MORPHIXAI_API_KEY=mk_xxx pnpm test
 * Skip: Tests are auto-skipped when MORPHIXAI_API_KEY is not set.
 *
 * Note: Some pipedream endpoints (accounts, statistics, proxy) may return
 * 500 due to server-side issues. Tests for these endpoints are wrapped
 * with try/catch to distinguish client bugs from server issues.
 */
import { describe, test, expect, beforeAll } from 'vitest';
import { BaibianClient, BaibianAPIError } from '../src/baibian-client.js';

const API_KEY = process.env.MORPHIXAI_API_KEY;
const BASE_URL = process.env.MORPHIXAI_BASE_URL || process.env.BAIBIAN_BASE_URL;

const canRun = !!API_KEY;

/**
 * Helper: skip test gracefully when server returns 5xx.
 * Throws for client-side errors (4xx except 401/403 which may be expected).
 */
async function tolerateServerError<T>(fn: () => Promise<T>): Promise<T | null> {
  try {
    return await fn();
  } catch (err) {
    if (err instanceof BaibianAPIError && err.statusCode >= 500) {
      console.log(`  ⊘ Server returned ${err.statusCode}, skipping (not a client bug)`);
      return null;
    }
    throw err;
  }
}

describe.skipIf(!canRun)('BaibianClient Integration Tests', () => {
  let client: BaibianClient;

  beforeAll(() => {
    client = new BaibianClient({
      apiKey: API_KEY!,
      baseUrl: BASE_URL,
    });
  });

  // ─── Auth ───

  describe('checkAuth', () => {
    test('should authenticate successfully', async () => {
      const result = await client.checkAuth();

      expect(result).toBeDefined();
      expect(result.user).toBeDefined();
      expect(result.user.id).toBeTruthy();
      console.log(`  ✓ Authenticated as: ${result.user.user_metadata?.full_name || result.user.email || result.user.id}`);
    });
  });

  // ─── Account Management ───

  describe('listAccounts', () => {
    test('should return accounts array or handle server error', async () => {
      const accounts = await tolerateServerError(() => client.listAccounts());
      if (!accounts) return;

      expect(Array.isArray(accounts)).toBe(true);
      console.log(`  ✓ Found ${accounts.length} linked account(s)`);

      if (accounts.length > 0) {
        const first = accounts[0];
        expect(first.accountId).toBeTruthy();
        expect(first.appName).toBeTruthy();
        console.log(`  ✓ First account: ${first.appName} (${first.accountId})`);
      }
    });

    test('should support app_name filter', async () => {
      const allAccounts = await tolerateServerError(() => client.listAccounts());
      if (!allAccounts) return;

      if (allAccounts.length === 0) {
        console.log('  ⊘ No accounts to filter, skipping');
        return;
      }

      const appName = allAccounts[0].appName;
      const filtered = await tolerateServerError(() => client.listAccounts(appName));
      if (!filtered) return;

      expect(Array.isArray(filtered)).toBe(true);
      filtered.forEach(a => expect(a.appName).toBe(appName));
      console.log(`  ✓ Filtered by "${appName}": ${filtered.length} account(s)`);
    });
  });

  describe('getAccount', () => {
    test('should get account details by ID', async () => {
      const accounts = await tolerateServerError(() => client.listAccounts());
      if (!accounts || accounts.length === 0) {
        console.log('  ⊘ No accounts available, skipping');
        return;
      }

      const account = await tolerateServerError(() => client.getAccount(accounts[0].accountId));
      if (!account) return;

      expect(account).toBeDefined();
      expect(account.accountId).toBe(accounts[0].accountId);
      console.log(`  ✓ Got account: ${account.appName} - ${account.accountName}`);
    });
  });

  describe('getStatistics', () => {
    test('should return account statistics', async () => {
      const stats = await tolerateServerError(() => client.getStatistics());
      if (!stats) return;

      expect(stats).toBeDefined();
      expect(typeof stats.totalAccounts).toBe('number');
      expect(typeof stats.activeAccounts).toBe('number');
      // uniqueApps may be an array or 0 (server returns 0 when no accounts linked)
      const apps = Array.isArray(stats.uniqueApps) ? stats.uniqueApps : [];
      console.log(`  ✓ Stats: ${stats.totalAccounts} total, ${stats.activeAccounts} active, apps: [${apps.join(', ')}]`);
    });
  });

  // ─── Apps ───

  describe('listApps', () => {
    test('should return available apps', async () => {
      const result = await client.listApps(undefined, 5);

      expect(result).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);
      expect(typeof result.count).toBe('number');
      console.log(`  ✓ Found ${result.count} apps (showing first ${result.data.length})`);

      if (result.data.length > 0) {
        const first = result.data[0];
        expect(first.nameSlug).toBeTruthy();
        expect(first.name).toBeTruthy();
      }
    });

    test('should support search query', async () => {
      const result = await client.listApps('github', 5);

      expect(result).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);
      console.log(`  ✓ Search "github": ${result.data.length} result(s)`);
    });

    test('should support pagination with limit', async () => {
      const page1 = await client.listApps(undefined, 2, 0);
      const page2 = await client.listApps(undefined, 2, 2);

      expect(page1.data.length).toBeLessThanOrEqual(2);
      expect(page2.data.length).toBeLessThanOrEqual(2);
      // Both pages return results — just verify we get valid data
      console.log(`  ✓ Pagination: page1=${page1.data.length}, page2=${page2.data.length}`);
    });
  });

  // ─── Connect Token ───

  describe('createConnectToken', () => {
    test('should generate an OAuth connect link', async () => {
      const result = await client.createConnectToken();

      expect(result).toBeDefined();
      expect(result.token).toBeTruthy();
      expect(result.connectLinkUrl).toBeTruthy();
      expect(result.connectLinkUrl).toMatch(/^https?:\/\//);
      console.log(`  ✓ Connect link generated (expires: ${result.expiresAt})`);
    });

    test('should generate connect link for specific app', async () => {
      const result = await client.createConnectToken('github');

      expect(result).toBeDefined();
      expect(result.connectLinkUrl).toBeTruthy();
      console.log(`  ✓ GitHub connect link: ${result.connectLinkUrl.substring(0, 60)}...`);
    });
  });

  // ─── Proxy (if accounts available) ───

  describe('proxy', () => {
    test('should proxy a GET request to third-party API', async () => {
      const accounts = await tolerateServerError(() => client.listAccounts('github'));
      if (!accounts || accounts.length === 0) {
        console.log('  ⊘ No GitHub account linked or server error, skipping proxy test');
        return;
      }

      const account = accounts[0];
      const result = await tolerateServerError(() =>
        client.proxy({
          accountId: account.accountId,
          method: 'GET',
          url: 'https://api.github.com/user',
        }),
      );
      if (!result) return;

      expect(result).toBeDefined();
      console.log(`  ✓ Proxied GitHub /user: ${JSON.stringify(result).substring(0, 100)}...`);
    });
  });

  // ─── Error Cases ───

  describe('error handling', () => {
    test('should throw BaibianAPIError with invalid API key', async () => {
      const badClient = new BaibianClient({
        apiKey: 'mk_invalid_key_12345',
        baseUrl: BASE_URL,
      });

      await expect(badClient.checkAuth()).rejects.toThrow(BaibianAPIError);

      try {
        await badClient.checkAuth();
      } catch (err) {
        const apiErr = err as BaibianAPIError;
        expect(apiErr.statusCode).toBe(401);
        console.log(`  ✓ Got expected 401 error: ${apiErr.errorCode}`);
      }
    });
  });
});
