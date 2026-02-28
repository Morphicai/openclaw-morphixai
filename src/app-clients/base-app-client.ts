/**
 * Base App Client
 *
 * Shared base class for all app-specific Pipedream proxy clients.
 * Handles: URL resolution, proxy call wrapping, error normalization.
 */
import type { BaibianClient } from "../baibian-client.js";

export class ProxyError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly upstreamStatus?: number,
    public readonly details?: any,
  ) {
    super(message);
    this.name = "ProxyError";
  }
}

export abstract class BaseAppClient {
  constructor(
    protected readonly baibian: BaibianClient,
    protected readonly accountId: string,
  ) {}

  /**
   * Subclasses implement: convert a relative API path to the full proxy URL.
   * Static domain apps return synchronously (e.g., `https://api.github.com${path}`).
   * Dynamic domain apps may need async resolution (e.g., Jira cloudId lookup).
   */
  protected abstract resolveUrl(path: string): string | Promise<string>;

  /**
   * Make a proxy request through MorphixAI → Pipedream → third-party API.
   *
   * Handles the MorphixAI response envelope:
   *   { success: true, data: <third-party-response> }
   *   { success: false, error: "...", code: "PROXY_ERROR" }
   */
  protected async request<T = any>(
    method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
    path: string,
    options?: {
      params?: Record<string, any>;
      body?: any;
      headers?: Record<string, string>;
    },
  ): Promise<T> {
    const url = await this.resolveUrl(path);

    const result = await this.baibian.proxy({
      accountId: this.accountId,
      method,
      url,
      params: options?.params,
      body: options?.body,
      headers: options?.headers,
    });

    // MorphixAI wraps proxy responses: { success, data, error, code }
    if (result && typeof result === "object") {
      if (result.success === false) {
        throw new ProxyError(
          result.error || "Proxy request failed",
          result.code || "PROXY_ERROR",
          undefined,
          result.details,
        );
      }
      // Successful: return the unwrapped third-party data
      if ("data" in result && result.success === true) {
        return result.data as T;
      }
    }

    // If no envelope (raw passthrough), return as-is
    return result as T;
  }

  /**
   * Convenience: GET request.
   */
  protected get<T = any>(
    path: string,
    params?: Record<string, any>,
    headers?: Record<string, string>,
  ): Promise<T> {
    return this.request<T>("GET", path, { params, headers });
  }

  /**
   * Convenience: POST request.
   */
  protected post<T = any>(
    path: string,
    body?: any,
    params?: Record<string, any>,
    headers?: Record<string, string>,
  ): Promise<T> {
    return this.request<T>("POST", path, { body, params, headers });
  }

  /**
   * Convenience: PUT request.
   */
  protected put<T = any>(
    path: string,
    body?: any,
    params?: Record<string, any>,
  ): Promise<T> {
    return this.request<T>("PUT", path, { body, params });
  }

  /**
   * Convenience: PATCH request.
   */
  protected patch<T = any>(
    path: string,
    body?: any,
    params?: Record<string, any>,
  ): Promise<T> {
    return this.request<T>("PATCH", path, { body, params });
  }

  /**
   * Convenience: DELETE request.
   */
  protected del<T = any>(
    path: string,
    params?: Record<string, any>,
  ): Promise<T> {
    return this.request<T>("DELETE", path, { params });
  }
}
