/**
 * MorphixAI Client (BaibianClient) Unit Tests
 *
 * Uses mock fetch to test client logic without hitting real APIs.
 */
import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { BaibianClient, BaibianAPIError } from '../src/baibian-client.js';

// ─── Helpers ───

function mockFetchResponse(data: any, status = 200) {
  return vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
  });
}

function createClient(overrides?: { baseUrl?: string; timeout?: number }) {
  return new BaibianClient({
    apiKey: 'mk_test_key_123',
    ...overrides,
  });
}

// ─── Tests ───

describe('BaibianClient', () => {
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  // ─── Constructor ───

  describe('constructor', () => {
    test('should use default base URL', () => {
      const client = createClient();
      // Access private field for verification
      expect((client as any).baseUrl).toBe('https://api.morphix.app');
    });

    test('should use custom base URL', () => {
      const client = createClient({ baseUrl: 'https://custom.api.com' });
      expect((client as any).baseUrl).toBe('https://custom.api.com');
    });

    test('should strip trailing slash from base URL', () => {
      const client = createClient({ baseUrl: 'https://custom.api.com/' });
      expect((client as any).baseUrl).toBe('https://custom.api.com');
    });

    test('should use default timeout of 30000ms', () => {
      const client = createClient();
      expect((client as any).timeout).toBe(30000);
    });

    test('should use custom timeout', () => {
      const client = createClient({ timeout: 60000 });
      expect((client as any).timeout).toBe(60000);
    });
  });

  // ─── checkAuth ───

  describe('checkAuth', () => {
    test('should call GET /auth/check with Bearer token', async () => {
      const mockData = {
        success: true,
        data: {
          user: {
            id: 'user_123',
            email: 'test@example.com',
            user_metadata: { full_name: 'Test User' },
            created_at: '2024-01-01T00:00:00Z',
          },
        },
      };

      const fetchMock = mockFetchResponse(mockData);
      globalThis.fetch = fetchMock;

      const client = createClient();
      const result = await client.checkAuth();

      expect(fetchMock).toHaveBeenCalledOnce();
      const [url, init] = fetchMock.mock.calls[0];
      expect(url).toBe('https://api.morphix.app/auth/check');
      expect(init.method).toBe('GET');
      expect(init.headers.Authorization).toBe('Bearer mk_test_key_123');
      expect(result.user.id).toBe('user_123');
    });
  });

  // ─── listAccounts ───

  describe('listAccounts', () => {
    test('should call GET /pipedream/accounts', async () => {
      const accounts = [
        { id: '1', accountId: 'apn_abc', appName: 'github', accountName: 'myuser', isActive: true, createdAt: '2024-01-01' },
      ];
      const fetchMock = mockFetchResponse({ success: true, data: accounts });
      globalThis.fetch = fetchMock;

      const client = createClient();
      const result = await client.listAccounts();

      const [url] = fetchMock.mock.calls[0];
      expect(url).toBe('https://api.morphix.app/pipedream/accounts');
      expect(result).toEqual(accounts);
    });

    test('should append app_name filter as query param', async () => {
      const fetchMock = mockFetchResponse({ success: true, data: [] });
      globalThis.fetch = fetchMock;

      const client = createClient();
      await client.listAccounts('github');

      const [url] = fetchMock.mock.calls[0];
      expect(url).toContain('app_name=github');
    });

    test('should append active_only filter', async () => {
      const fetchMock = mockFetchResponse({ success: true, data: [] });
      globalThis.fetch = fetchMock;

      const client = createClient();
      await client.listAccounts(undefined, false);

      const [url] = fetchMock.mock.calls[0];
      expect(url).toContain('active_only=false');
    });
  });

  // ─── getAccount ───

  describe('getAccount', () => {
    test('should call GET /pipedream/accounts/:id', async () => {
      const account = { id: '1', accountId: 'apn_abc', appName: 'github', accountName: 'user', isActive: true, createdAt: '2024-01-01' };
      const fetchMock = mockFetchResponse({ success: true, data: account });
      globalThis.fetch = fetchMock;

      const client = createClient();
      const result = await client.getAccount('apn_abc');

      const [url] = fetchMock.mock.calls[0];
      expect(url).toBe('https://api.morphix.app/pipedream/accounts/apn_abc');
      expect(result.accountId).toBe('apn_abc');
    });
  });

  // ─── getStatistics ───

  describe('getStatistics', () => {
    test('should call GET /pipedream/statistics', async () => {
      const stats = { totalAccounts: 5, activeAccounts: 3, uniqueApps: ['github', 'gmail'] };
      const fetchMock = mockFetchResponse({ success: true, data: stats });
      globalThis.fetch = fetchMock;

      const client = createClient();
      const result = await client.getStatistics();

      const [url] = fetchMock.mock.calls[0];
      expect(url).toBe('https://api.morphix.app/pipedream/statistics');
      expect(result.totalAccounts).toBe(5);
    });
  });

  // ─── listApps ───

  describe('listApps', () => {
    test('should call GET /pipedream/apps and return raw response', async () => {
      const rawResponse = { data: [{ id: '1', nameSlug: 'github', name: 'GitHub', authType: 'oauth' }], count: 1 };
      const fetchMock = mockFetchResponse(rawResponse);
      globalThis.fetch = fetchMock;

      const client = createClient();
      const result = await client.listApps();

      const [url] = fetchMock.mock.calls[0];
      expect(url).toBe('https://api.morphix.app/pipedream/apps');
      expect(result.data).toHaveLength(1);
      expect(result.count).toBe(1);
    });

    test('should pass search and pagination params', async () => {
      const fetchMock = mockFetchResponse({ data: [], count: 0 });
      globalThis.fetch = fetchMock;

      const client = createClient();
      await client.listApps('git', 10, 20);

      const [url] = fetchMock.mock.calls[0];
      expect(url).toContain('q=git');
      expect(url).toContain('limit=10');
      expect(url).toContain('offset=20');
    });
  });

  // ─── createConnectToken ───

  describe('createConnectToken', () => {
    test('should call POST /pipedream/connect-token', async () => {
      const tokenResult = { token: 'ct_abc', expiresAt: '2024-12-31', connectLinkUrl: 'https://connect.example.com/token' };
      const fetchMock = mockFetchResponse({ success: true, data: tokenResult });
      globalThis.fetch = fetchMock;

      const client = createClient();
      const result = await client.createConnectToken('github');

      const [url, init] = fetchMock.mock.calls[0];
      expect(url).toBe('https://api.morphix.app/pipedream/connect-token');
      expect(init.method).toBe('POST');
      const body = JSON.parse(init.body);
      expect(body.app).toBe('github');
      expect(result.connectLinkUrl).toBe('https://connect.example.com/token');
    });

    test('should send empty body when no params', async () => {
      const fetchMock = mockFetchResponse({ success: true, data: { token: 'ct_abc', expiresAt: '', connectLinkUrl: '' } });
      globalThis.fetch = fetchMock;

      const client = createClient();
      await client.createConnectToken();

      const [, init] = fetchMock.mock.calls[0];
      const body = JSON.parse(init.body);
      expect(body).toEqual({});
    });
  });

  // ─── proxy ───

  describe('proxy', () => {
    test('should call POST /pipedream/proxy with correct body', async () => {
      const proxyResponse = { items: [{ id: 1, name: 'repo' }] };
      const fetchMock = mockFetchResponse(proxyResponse);
      globalThis.fetch = fetchMock;

      const client = createClient();
      const result = await client.proxy({
        accountId: 'apn_abc',
        method: 'GET',
        url: 'https://api.github.com/user/repos',
        params: { per_page: 10 },
      });

      const [url, init] = fetchMock.mock.calls[0];
      expect(url).toBe('https://api.morphix.app/pipedream/proxy');
      expect(init.method).toBe('POST');
      const body = JSON.parse(init.body);
      expect(body.accountId).toBe('apn_abc');
      expect(body.method).toBe('GET');
      expect(body.url).toBe('https://api.github.com/user/repos');
      expect(body.params.per_page).toBe(10);
      expect(result).toEqual(proxyResponse);
    });

    test('should forward headers and body for POST proxy', async () => {
      const fetchMock = mockFetchResponse({ ok: true });
      globalThis.fetch = fetchMock;

      const client = createClient();
      await client.proxy({
        accountId: 'apn_abc',
        method: 'POST',
        url: 'https://api.github.com/repos/owner/repo/issues',
        headers: { 'X-Custom': 'value' },
        body: { title: 'New issue', body: 'Description' },
      });

      const [, init] = fetchMock.mock.calls[0];
      const body = JSON.parse(init.body);
      expect(body.headers['X-Custom']).toBe('value');
      expect(body.body.title).toBe('New issue');
    });
  });

  // ─── Error Handling ───

  describe('error handling', () => {
    test('should throw BaibianAPIError on 401', async () => {
      const fetchMock = mockFetchResponse({ errorCode: 'INVALID_API_KEY' }, 401);
      globalThis.fetch = fetchMock;

      const client = createClient();

      await expect(client.checkAuth()).rejects.toThrow(BaibianAPIError);
      try {
        await client.checkAuth();
      } catch (err) {
        expect(err).toBeInstanceOf(BaibianAPIError);
        expect((err as BaibianAPIError).statusCode).toBe(401);
        expect((err as BaibianAPIError).errorCode).toBe('INVALID_API_KEY');
      }
    });

    test('should throw BaibianAPIError on 403', async () => {
      const fetchMock = mockFetchResponse({ errorCode: 'API_KEY_SCOPE_DENIED' }, 403);
      globalThis.fetch = fetchMock;

      const client = createClient();

      await expect(client.listAccounts()).rejects.toThrow(BaibianAPIError);
    });

    test('should throw BaibianAPIError on 500', async () => {
      const fetchMock = mockFetchResponse({ message: 'Internal Server Error' }, 500);
      globalThis.fetch = fetchMock;

      const client = createClient();

      await expect(client.getStatistics()).rejects.toThrow(BaibianAPIError);
    });

    test('should include status code and error code in BaibianAPIError', async () => {
      const fetchMock = mockFetchResponse({ errorCode: 'API_KEY_REVOKED' }, 401);
      globalThis.fetch = fetchMock;

      const client = createClient();

      try {
        await client.checkAuth();
      } catch (err) {
        const apiErr = err as BaibianAPIError;
        expect(apiErr.statusCode).toBe(401);
        expect(apiErr.errorCode).toBe('API_KEY_REVOKED');
        expect(apiErr.name).toBe('BaibianAPIError');
        expect(apiErr.message).toContain('401');
        expect(apiErr.message).toContain('API_KEY_REVOKED');
      }
    });
  });

  // ─── Request Format ───

  describe('request format', () => {
    test('should always set Content-Type and Authorization headers', async () => {
      const fetchMock = mockFetchResponse({ success: true, data: {} });
      globalThis.fetch = fetchMock;

      const client = createClient();
      await client.checkAuth();

      const [, init] = fetchMock.mock.calls[0];
      expect(init.headers['Content-Type']).toBe('application/json');
      expect(init.headers['Authorization']).toBe('Bearer mk_test_key_123');
    });

    test('should set AbortSignal timeout', async () => {
      const fetchMock = mockFetchResponse({ success: true, data: {} });
      globalThis.fetch = fetchMock;

      const client = createClient({ timeout: 15000 });
      await client.checkAuth();

      const [, init] = fetchMock.mock.calls[0];
      expect(init.signal).toBeDefined();
    });

    test('should handle direct data response (no wrapper)', async () => {
      // Some endpoints return data directly without { success, data } wrapper
      const directData = { id: 'user_1', email: 'test@example.com' };
      const fetchMock = mockFetchResponse(directData);
      globalThis.fetch = fetchMock;

      const client = createClient();
      // Use a raw-returning method (listApps uses requestRaw)
      const result = await client.listApps();
      // requestRaw returns the raw response as-is
      expect(result).toEqual(directData);
    });
  });
});
