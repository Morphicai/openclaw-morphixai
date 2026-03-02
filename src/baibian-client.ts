/**
 * MorphixAI API Client
 *
 * Standalone HTTP client for the MorphixAI pipedream proxy API.
 * Completely independent from Tanka SDK — uses native fetch.
 *
 * Auth: Bearer API Key (mk_xxx format)
 * Base URL: https://api.morphix.app
 */

export interface BaibianClientConfig {
  /** API Key (mk_xxx format) */
  apiKey: string;
  /** Base URL override (default: https://api.morphix.app) */
  baseUrl?: string;
  /** Request timeout in ms (default: 30000) */
  timeout?: number;
}

export interface BaibianResponse<T = any> {
  success: boolean;
  data: T;
  count?: number;
  message?: string;
}

export interface LinkedAccount {
  id: string;
  accountId: string;
  appName: string;
  accountName: string;
  accountAvatar?: string;
  isActive: boolean;
  createdAt: string;
}

export interface AccountStatistics {
  totalAccounts: number;
  activeAccounts: number;
  uniqueApps: string[];
  lastConnectedAt?: string;
  lastUsedAt?: string;
}

export interface ConnectableApp {
  id: string;
  nameSlug: string;
  name: string;
  authType: string;
  imgSrc?: string;
  categories?: string[];
  connect?: {
    allowed_domains?: string[];
    proxy_enabled?: boolean;
  };
}

export interface ConnectTokenResult {
  token: string;
  expiresAt: string;
  connectLinkUrl: string;
}

export interface AuthCheckResult {
  user: {
    id: string;
    email?: string;
    phone?: string;
    user_metadata: {
      full_name?: string;
      avatar_url?: string;
    };
    created_at: string;
  };
}

export interface ProxyRequestParams {
  accountId: string;
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  url: string;
  headers?: Record<string, string>;
  body?: any;
  params?: Record<string, any>;
}

export class BaibianClient {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly timeout: number;

  constructor(config: BaibianClientConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl = (config.baseUrl || "https://api.morphix.app").replace(/\/$/, "");
    this.timeout = config.timeout || 30000;
  }

  // ─── Auth ───

  async checkAuth(): Promise<AuthCheckResult> {
    return this.request<AuthCheckResult>("GET", "/auth/check");
  }

  // ─── Account Management ───

  async listAccounts(appName?: string, activeOnly?: boolean): Promise<LinkedAccount[]> {
    const params: Record<string, string> = {};
    if (appName) params.app_name = appName;
    if (activeOnly !== undefined) params.active_only = String(activeOnly);

    const resp = await this.request<LinkedAccount[]>("GET", "/pipedream/accounts", { params });
    return resp;
  }

  async getAccount(accountId: string): Promise<LinkedAccount> {
    return this.request<LinkedAccount>("GET", `/pipedream/accounts/${accountId}`);
  }

  async getStatistics(): Promise<AccountStatistics> {
    return this.request<AccountStatistics>("GET", "/pipedream/statistics");
  }

  async listApps(q?: string, limit?: number, offset?: number): Promise<{ data: ConnectableApp[]; count: number }> {
    const params: Record<string, string> = {};
    if (q) params.q = q;
    if (limit !== undefined) params.limit = String(limit);
    if (offset !== undefined) params.offset = String(offset);

    return this.requestRaw<{ data: ConnectableApp[]; count: number }>("GET", "/pipedream/apps", { params });
  }

  async createConnectToken(app?: string, redirectUrl?: string): Promise<ConnectTokenResult> {
    const body: Record<string, string> = {};
    if (app) body.app = app;
    if (redirectUrl) body.redirectUrl = redirectUrl;

    return this.request<ConnectTokenResult>("POST", "/pipedream/connect-token", { body });
  }

  // ─── Proxy ───

  /**
   * Call third-party API via the universal proxy endpoint.
   * Uses requestRaw to preserve the full third-party response
   * (avoids stripping sibling fields like pagination, total_count, etc.).
   */
  async proxy(params: ProxyRequestParams): Promise<any> {
    return this.requestRaw<any>("POST", "/pipedream/proxy", {
      body: {
        accountId: params.accountId,
        method: params.method,
        url: params.url,
        headers: params.headers,
        body: params.body,
        params: params.params,
      },
    });
  }

  // ─── Internal HTTP ───

  private async request<T>(
    method: string,
    path: string,
    options?: { params?: Record<string, string>; body?: any },
  ): Promise<T> {
    const raw = await this.requestRaw<BaibianResponse<T>>(method, path, options);
    // Handle both { success, data } and direct data responses
    if (raw && typeof raw === "object" && "data" in raw) {
      return raw.data;
    }
    return raw as unknown as T;
  }

  private async requestRaw<T>(
    method: string,
    path: string,
    options?: { params?: Record<string, string>; body?: any },
  ): Promise<T> {
    let url = `${this.baseUrl}${path}`;

    // Append query params for GET
    if (options?.params && Object.keys(options.params).length > 0) {
      const qs = new URLSearchParams(options.params).toString();
      url += `?${qs}`;
    }

    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.apiKey}`,
      "Content-Type": "application/json",
    };

    const init: RequestInit = {
      method: method.toUpperCase(),
      headers,
      signal: AbortSignal.timeout(this.timeout),
    };

    if (options?.body && method.toUpperCase() !== "GET") {
      init.body = JSON.stringify(options.body);
    }

    // For MorphixAI API, GET with body is supported (e.g., proxy/get)
    // But standard fetch doesn't allow body with GET, so use POST for proxy/get
    if (options?.body && method.toUpperCase() === "GET") {
      init.method = "POST";
      init.body = JSON.stringify(options.body);
    }

    const response = await fetch(url, init);

    if (!response.ok) {
      const errorBody = await response.text().catch(() => "");
      let errorCode = "";
      try {
        const parsed = JSON.parse(errorBody);
        errorCode = parsed.errorCode || "";
      } catch {}
      throw new BaibianAPIError(
        `MorphixAI API error: ${response.status} ${response.statusText}${errorCode ? ` [${errorCode}]` : ""}`,
        response.status,
        errorCode,
        errorBody,
      );
    }

    return response.json() as Promise<T>;
  }
}

export class BaibianAPIError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly errorCode: string,
    public readonly responseBody: string,
  ) {
    super(message);
    this.name = "BaibianAPIError";
  }
}
