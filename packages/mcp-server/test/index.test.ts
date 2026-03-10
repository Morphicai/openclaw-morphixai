/**
 * MCP Server Unit Tests
 *
 * Tests tool registration and action dispatch logic using mocked clients.
 * Does NOT hit real APIs.
 */
import { describe, test, expect, beforeEach, afterEach, vi } from "vitest";

// We test the server logic by importing the module's key exports.
// Since index.ts is the entry point with side effects (process.exit, server.connect),
// we mock the MCP SDK and core module, then verify the handlers.

// ─── Mocks ───

const mockListAccounts = vi.fn();
const mockGetAccount = vi.fn();
const mockGetStatistics = vi.fn();
const mockListApps = vi.fn();
const mockCreateConnectToken = vi.fn();
const mockCheckAuth = vi.fn();
const mockProxy = vi.fn();

// Mock @morphixai/core
vi.mock("@morphixai/core", () => {
  const { Type } = require("@sinclair/typebox");

  // Minimal schemas for testing (just enough to pass registration)
  const mkSchema = (...actions: string[]) =>
    Type.Union(actions.map((a) => Type.Object({ action: Type.Literal(a) })));

  class MockMorphixClient {
    listAccounts = mockListAccounts;
    getAccount = mockGetAccount;
    getStatistics = mockGetStatistics;
    listApps = mockListApps;
    createConnectToken = mockCreateConnectToken;
    checkAuth = mockCheckAuth;
    proxy = mockProxy;
  }

  class MockBaseClient {
    constructor(public morphix: any, public accountId: string) {}
  }

  const clientFactory = (name: string) =>
    class extends MockBaseClient {
      [key: string]: any;
      constructor(morphix: any, accountId: string) {
        super(morphix, accountId);
        // Create proxy to capture any method call
        return new Proxy(this, {
          get(target, prop) {
            if (prop === "morphix" || prop === "accountId") return (target as any)[prop];
            if (typeof prop === "string") {
              return vi.fn().mockResolvedValue({ mock: name, method: prop });
            }
            return undefined;
          },
        });
      }
    };

  return {
    MorphixClient: MockMorphixClient,
    MorphixAPIError: class extends Error {
      statusCode: number;
      errorCode: string;
      responseBody: string;
      constructor(msg: string, status: number, code: string, body: string) {
        super(msg);
        this.statusCode = status;
        this.errorCode = code;
        this.responseBody = body;
      }
    },
    GitHubClient: clientFactory("github"),
    GitLabClient: clientFactory("gitlab"),
    JiraClient: clientFactory("jira"),
    FlightsClient: class {
      constructor(public config: any) {}
      [key: string]: any;
    },
    OutlookClient: clientFactory("outlook"),
    OutlookCalendarClient: clientFactory("outlook_calendar"),
    GmailClient: clientFactory("gmail"),
    GoogleTasksClient: clientFactory("google_tasks"),
    NotionClient: clientFactory("notion"),
    ConfluenceClient: clientFactory("confluence"),
    FigmaClient: clientFactory("figma"),
    MsTodoClient: clientFactory("ms_todo"),
    OfficeGitHubSchema: mkSchema("get_user", "list_repos"),
    OfficeGitLabSchema: mkSchema("get_user", "list_projects"),
    OfficeJiraSchema: mkSchema("get_myself", "list_projects"),
    OfficeFlightsSchema: mkSchema("search_flights"),
    OfficeOutlookSchema: mkSchema("get_me", "list_messages"),
    OfficeOutlookCalendarSchema: mkSchema("get_me", "list_calendars"),
    OfficeGmailSchema: mkSchema("get_profile", "list_messages"),
    OfficeGoogleTasksSchema: mkSchema("list_task_lists"),
    OfficeNotionSchema: mkSchema("get_me", "search"),
    OfficeConfluenceSchema: mkSchema("list_spaces"),
    OfficeFigmaSchema: mkSchema("get_me"),
    OfficeMsTodoSchema: mkSchema("list_task_lists"),
    OfficeLinkSchema: mkSchema("check_auth", "list_accounts"),
  };
});

// Capture registered handlers
let listToolsHandler: Function;
let callToolHandler: Function;

vi.mock("@modelcontextprotocol/sdk/server/index.js", () => ({
  Server: class {
    constructor() {}
    setRequestHandler(schema: any, handler: Function) {
      // Identify handler by schema reference
      if (schema === "ListToolsRequestSchema") {
        listToolsHandler = handler;
      } else if (schema === "CallToolRequestSchema") {
        callToolHandler = handler;
      }
    }
    connect = vi.fn().mockResolvedValue(undefined);
  },
}));

vi.mock("@modelcontextprotocol/sdk/server/stdio.js", () => ({
  StdioServerTransport: class {},
}));

vi.mock("@modelcontextprotocol/sdk/types.js", () => ({
  ListToolsRequestSchema: "ListToolsRequestSchema",
  CallToolRequestSchema: "CallToolRequestSchema",
  ErrorCode: { InvalidParams: -32602, MethodNotFound: -32601 },
  McpError: class extends Error {
    code: number;
    constructor(code: number, message: string) {
      super(message);
      this.code = code;
    }
  },
}));

// ─── Setup ───

beforeEach(async () => {
  vi.stubEnv("MORPHIXAI_API_KEY", "mk_test_key_123");
  vi.stubEnv("MORPHIXAI_BASE_URL", "");

  // Reset mocks
  mockListAccounts.mockResolvedValue([
    { accountId: "apn_test", appName: "github", isActive: true },
  ]);

  // Import the module (triggers server setup)
  await import("../src/index.js");
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

// ─── Tests ───

describe("Tool Registration", () => {
  test("should register all 13 tools", async () => {
    const result = await listToolsHandler();
    const toolNames = result.tools.map((t: any) => t.name);

    expect(toolNames).toContain("mx_github");
    expect(toolNames).toContain("mx_gitlab");
    expect(toolNames).toContain("mx_jira");
    expect(toolNames).toContain("mx_outlook");
    expect(toolNames).toContain("mx_outlook_calendar");
    expect(toolNames).toContain("mx_gmail");
    expect(toolNames).toContain("mx_google_tasks");
    expect(toolNames).toContain("mx_notion");
    expect(toolNames).toContain("mx_confluence");
    expect(toolNames).toContain("mx_figma");
    expect(toolNames).toContain("mx_ms_todo");
    expect(toolNames).toContain("mx_link");
    expect(toolNames).toContain("mx_flights");
    expect(result.tools.length).toBe(13);
  });

  test("each tool should have name, description, and inputSchema", async () => {
    const result = await listToolsHandler();
    for (const tool of result.tools) {
      expect(tool.name).toBeTruthy();
      expect(tool.description).toBeTruthy();
      expect(tool.inputSchema).toBeTruthy();
    }
  });

  test("mx_flights should be marked as UNAVAILABLE", async () => {
    const result = await listToolsHandler();
    const flights = result.tools.find((t: any) => t.name === "mx_flights");
    expect(flights.description).toContain("[UNAVAILABLE]");
  });
});

describe("Account Resolution", () => {
  test("should auto-resolve account when account_id not provided", async () => {
    mockListAccounts.mockResolvedValue([
      { accountId: "apn_gh_1", appName: "github", isActive: true },
    ]);

    const result = await callToolHandler({
      params: { name: "mx_github", arguments: { action: "get_user" } },
    });

    expect(result.content[0].type).toBe("text");
    expect(result.isError).toBeUndefined();
    expect(mockListAccounts).toHaveBeenCalledWith("github", true);
  });

  test("should return error when no account connected", async () => {
    mockListAccounts.mockResolvedValue([]);

    const result = await callToolHandler({
      params: { name: "mx_github", arguments: { action: "get_user" } },
    });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("No github account connected");
    expect(result.content[0].text).toContain("morphix.app/connections");
  });
});

describe("Tool Dispatch — GitHub", () => {
  test("should dispatch get_user action", async () => {
    mockListAccounts.mockResolvedValue([
      { accountId: "apn_gh", appName: "github", isActive: true },
    ]);

    const result = await callToolHandler({
      params: { name: "mx_github", arguments: { action: "get_user" } },
    });

    expect(result.isError).toBeUndefined();
    const data = JSON.parse(result.content[0].text);
    expect(data.mock).toBe("github");
    expect(data.method).toBe("getCurrentUser");
  });
});

describe("Tool Dispatch — GitLab", () => {
  test("should dispatch get_user action", async () => {
    mockListAccounts.mockResolvedValue([
      { accountId: "apn_gl", appName: "gitlab", isActive: true },
    ]);

    const result = await callToolHandler({
      params: { name: "mx_gitlab", arguments: { action: "get_user" } },
    });

    expect(result.isError).toBeUndefined();
    const data = JSON.parse(result.content[0].text);
    expect(data.mock).toBe("gitlab");
  });
});

describe("Tool Dispatch — Jira", () => {
  test("should dispatch get_myself action", async () => {
    mockListAccounts.mockResolvedValue([
      { accountId: "apn_jira", appName: "jira", isActive: true },
    ]);

    const result = await callToolHandler({
      params: { name: "mx_jira", arguments: { action: "get_myself" } },
    });

    expect(result.isError).toBeUndefined();
    const data = JSON.parse(result.content[0].text);
    expect(data.mock).toBe("jira");
  });
});

describe("Tool Dispatch — Outlook", () => {
  test("should dispatch get_me action", async () => {
    mockListAccounts.mockResolvedValue([
      { accountId: "apn_outlook", appName: "microsoft_outlook", isActive: true },
    ]);

    const result = await callToolHandler({
      params: { name: "mx_outlook", arguments: { action: "get_me" } },
    });

    expect(result.isError).toBeUndefined();
    const data = JSON.parse(result.content[0].text);
    expect(data.mock).toBe("outlook");
  });
});

describe("Tool Dispatch — Outlook Calendar", () => {
  test("should dispatch get_me action", async () => {
    mockListAccounts.mockResolvedValue([
      { accountId: "apn_cal", appName: "microsoft_outlook_calendar", isActive: true },
    ]);

    const result = await callToolHandler({
      params: { name: "mx_outlook_calendar", arguments: { action: "get_me" } },
    });

    expect(result.isError).toBeUndefined();
    const data = JSON.parse(result.content[0].text);
    expect(data.mock).toBe("outlook_calendar");
  });
});

describe("Tool Dispatch — Gmail", () => {
  test("should dispatch get_profile action", async () => {
    mockListAccounts.mockResolvedValue([
      { accountId: "apn_gmail", appName: "gmail", isActive: true },
    ]);

    const result = await callToolHandler({
      params: { name: "mx_gmail", arguments: { action: "get_profile" } },
    });

    expect(result.isError).toBeUndefined();
    const data = JSON.parse(result.content[0].text);
    expect(data.mock).toBe("gmail");
  });
});

describe("Tool Dispatch — Google Tasks", () => {
  test("should dispatch list_task_lists action", async () => {
    mockListAccounts.mockResolvedValue([
      { accountId: "apn_gt", appName: "google_tasks", isActive: true },
    ]);

    const result = await callToolHandler({
      params: { name: "mx_google_tasks", arguments: { action: "list_task_lists" } },
    });

    expect(result.isError).toBeUndefined();
    const data = JSON.parse(result.content[0].text);
    expect(data.mock).toBe("google_tasks");
  });
});

describe("Tool Dispatch — Notion", () => {
  test("should dispatch get_me action", async () => {
    mockListAccounts.mockResolvedValue([
      { accountId: "apn_notion", appName: "notion", isActive: true },
    ]);

    const result = await callToolHandler({
      params: { name: "mx_notion", arguments: { action: "get_me" } },
    });

    expect(result.isError).toBeUndefined();
    const data = JSON.parse(result.content[0].text);
    expect(data.mock).toBe("notion");
  });
});

describe("Tool Dispatch — Confluence", () => {
  test("should dispatch list_spaces action", async () => {
    mockListAccounts.mockResolvedValue([
      { accountId: "apn_conf", appName: "confluence", isActive: true },
    ]);

    const result = await callToolHandler({
      params: { name: "mx_confluence", arguments: { action: "list_spaces" } },
    });

    expect(result.isError).toBeUndefined();
    const data = JSON.parse(result.content[0].text);
    expect(data.mock).toBe("confluence");
  });
});

describe("Tool Dispatch — Figma", () => {
  test("should dispatch get_me action", async () => {
    mockListAccounts.mockResolvedValue([
      { accountId: "apn_figma", appName: "figma", isActive: true },
    ]);

    const result = await callToolHandler({
      params: { name: "mx_figma", arguments: { action: "get_me" } },
    });

    expect(result.isError).toBeUndefined();
    const data = JSON.parse(result.content[0].text);
    expect(data.mock).toBe("figma");
  });
});

describe("Tool Dispatch — MS Todo", () => {
  test("should dispatch list_task_lists action", async () => {
    mockListAccounts.mockResolvedValue([
      { accountId: "apn_todo", appName: "microsofttodo", isActive: true },
    ]);

    const result = await callToolHandler({
      params: { name: "mx_ms_todo", arguments: { action: "list_task_lists" } },
    });

    expect(result.isError).toBeUndefined();
    const data = JSON.parse(result.content[0].text);
    expect(data.mock).toBe("ms_todo");
  });
});

describe("Tool Dispatch — Link", () => {
  test("should dispatch check_auth action", async () => {
    mockCheckAuth.mockResolvedValue({ user: { id: "user_1", email: "test@test.com" } });

    const result = await callToolHandler({
      params: { name: "mx_link", arguments: { action: "check_auth" } },
    });

    expect(result.isError).toBeUndefined();
    const data = JSON.parse(result.content[0].text);
    expect(data.authenticated).toBe(true);
    expect(data.user.id).toBe("user_1");
  });

  test("should dispatch list_accounts action", async () => {
    mockListAccounts.mockResolvedValue([
      { accountId: "apn_1", appName: "github", isActive: true },
    ]);

    const result = await callToolHandler({
      params: { name: "mx_link", arguments: { action: "list_accounts" } },
    });

    expect(result.isError).toBeUndefined();
    const data = JSON.parse(result.content[0].text);
    expect(data.count).toBe(1);
    expect(data.accounts[0].appName).toBe("github");
  });

  test("should show hint when no accounts found", async () => {
    mockListAccounts.mockResolvedValue([]);

    const result = await callToolHandler({
      params: { name: "mx_link", arguments: { action: "list_accounts" } },
    });

    const data = JSON.parse(result.content[0].text);
    expect(data.count).toBe(0);
    expect(data.hint).toContain("connect");
  });
});

describe("Error Handling", () => {
  test("should return error for unknown tool", async () => {
    await expect(
      callToolHandler({
        params: { name: "mx_unknown", arguments: { action: "test" } },
      }),
    ).rejects.toThrow("Tool not found: mx_unknown");
  });

  test("should handle generic errors gracefully", async () => {
    mockListAccounts.mockRejectedValue(new Error("Network timeout"));

    const result = await callToolHandler({
      params: { name: "mx_github", arguments: { action: "get_user" } },
    });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("Network timeout");
  });
});
