<p align="center">
  <a href="https://morphix.app">
    <img src="https://morphix.app/brand/logo-rounded.png" alt="MorphixAI" width="80" />
  </a>
</p>

<h1 align="center">@morphixai/core</h1>

<p align="center">
  Platform-agnostic core engine for <a href="https://morphix.app">MorphixAI</a> integrations.
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@morphixai/core"><img src="https://img.shields.io/npm/v/@morphixai/core.svg" alt="npm version" /></a>
  <a href="https://github.com/Morphicai/openclaw-morphixai/blob/main/LICENSE"><img src="https://img.shields.io/npm/l/@morphixai/core.svg" alt="license" /></a>
</p>

## What is this?

The shared core library used by [`@morphixai/mcp-server`](https://www.npmjs.com/package/@morphixai/mcp-server) and [`openclaw-morphixai`](https://www.npmjs.com/package/openclaw-morphixai). It contains:

- **API Clients** — typed HTTP clients for GitHub, GitLab, Jira, Notion, Confluence, Figma, Gmail, Outlook, Google Tasks, Microsoft To Do, and Flights
- **MorphixClient** — low-level HTTP client for the MorphixAI proxy API
- **TypeBox Schemas** — input validation schemas for all tool actions

> You typically don't install this package directly. Use `@morphixai/mcp-server` (for Claude Code / Cursor / Windsurf) or `openclaw-morphixai` (for OpenClaw) instead.

## Install

```bash
npm install @morphixai/core
```

## Usage

```ts
import { MorphixClient, GitHubClient } from "@morphixai/core";

const morphix = new MorphixClient({
  apiKey: "mk_your_api_key_here",
});

// List connected accounts
const accounts = await morphix.listAccounts("github");

// Use a typed app client
const github = new GitHubClient(morphix, accounts[0].accountId);
const repos = await github.listRepos({ sort: "updated", perPage: 10 });
```

## API Clients

| Client | Platform | App Slug |
|--------|----------|----------|
| `GitHubClient` | GitHub | `github` |
| `GitLabClient` | GitLab | `gitlab` |
| `JiraClient` | Jira Cloud | `jira` |
| `OutlookClient` | Outlook Email | `microsoft_outlook` |
| `OutlookCalendarClient` | Outlook Calendar | `microsoft_outlook_calendar` |
| `GmailClient` | Gmail | `gmail` |
| `GoogleTasksClient` | Google Tasks | `google_tasks` |
| `NotionClient` | Notion | `notion` |
| `ConfluenceClient` | Confluence Cloud | `confluence` |
| `FigmaClient` | Figma | `figma` |
| `MsTodoClient` | Microsoft To Do | `microsofttodo` |
| `FlightsClient` | Flights (Duffel) | — |

All clients (except `FlightsClient`) extend `BaseAppClient` and route requests through MorphixAI's OAuth proxy — no need to manage third-party tokens yourself.

## Schemas

Each tool has a [TypeBox](https://github.com/sinclairzx81/typebox) schema that defines valid actions and parameters:

```ts
import { OfficeGitHubSchema, type OfficeGitHubParams } from "@morphixai/core";

// Use for runtime validation or MCP tool registration
console.log(OfficeGitHubSchema); // TypeBox Union schema
```

Available schemas: `OfficeGitHubSchema`, `OfficeGitLabSchema`, `OfficeJiraSchema`, `OfficeOutlookSchema`, `OfficeOutlookCalendarSchema`, `OfficeGmailSchema`, `OfficeGoogleTasksSchema`, `OfficeNotionSchema`, `OfficeConfluenceSchema`, `OfficeFigmaSchema`, `OfficeMsTodoSchema`, `OfficeLinkSchema`, `OfficeFlightsSchema`.

## Related

- [@morphixai/mcp-server](https://www.npmjs.com/package/@morphixai/mcp-server) — MCP server for Claude Code, Cursor, Windsurf
- [openclaw-morphixai](https://www.npmjs.com/package/openclaw-morphixai) — OpenClaw plugin
- [GitHub](https://github.com/Morphicai/openclaw-morphixai) — Source code & documentation

## License

MIT
