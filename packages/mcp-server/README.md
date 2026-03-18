<p align="center">
  <a href="https://morphix.app">
    <img src="https://morphixai.com/brand/logo-rounded.png" alt="MorphixAI" width="80" />
  </a>
</p>

<h1 align="center">@morphixai/mcp-server</h1>

<p align="center">
  MCP server that connects AI agents to 40+ workplace tools through <a href="https://morphix.app">MorphixAI</a>.
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@morphixai/mcp-server"><img src="https://img.shields.io/npm/v/@morphixai/mcp-server.svg" alt="npm version" /></a>
  <a href="https://www.npmjs.com/package/@morphixai/mcp-server"><img src="https://img.shields.io/npm/dm/@morphixai/mcp-server.svg" alt="npm downloads" /></a>
  <a href="https://github.com/Morphicai/openclaw-morphixai/blob/main/LICENSE"><img src="https://img.shields.io/npm/l/@morphixai/mcp-server.svg" alt="license" /></a>
</p>

## What is this?

A [Model Context Protocol (MCP)](https://modelcontextprotocol.io) server that gives AI agents access to your workplace tools — GitHub, GitLab, Jira, Notion, Gmail, Outlook, Figma, Confluence, Google Tasks, Microsoft To Do, and more.

Works with **Claude Code**, **Cursor**, **Windsurf**, **Claude Desktop**, and any MCP-compatible client.

## Quick Start

### 1. Get your API Key

Visit [morphix.app/api-keys](https://morphix.app/api-keys) to create an API key (format: `mk_xxx`).

### 2. Link your accounts

Visit [morphix.app/connections](https://morphix.app/connections) to connect the platforms you want to use (GitHub, Jira, etc.).

### 3. Install

**Claude Code:**

```bash
claude mcp add morphixai-mcp -- npx -y @morphixai/mcp-server \
  --env MORPHIXAI_API_KEY="mk_your_api_key_here"
```

**Cursor / Windsurf / Claude Desktop:**

Add to your MCP settings file (`claude_desktop_config.json`, `~/.cursor/mcp.json`, etc.):

```json
{
  "mcpServers": {
    "morphixai": {
      "command": "npx",
      "args": ["-y", "@morphixai/mcp-server"],
      "env": {
        "MORPHIXAI_API_KEY": "mk_your_api_key_here"
      }
    }
  }
}
```

**Global install (alternative):**

```bash
npm install -g @morphixai/mcp-server
```

## Available Tools

| Tool | Platform | Actions |
|------|----------|---------|
| `mx_github` | GitHub | Repos, issues, PRs, workflow runs, Actions triggers |
| `mx_gitlab` | GitLab | Projects, MRs, issues, pipelines, branches |
| `mx_jira` | Jira | Projects, JQL search, issue CRUD, transitions, comments |
| `mx_outlook` | Outlook Email | List/search/send/reply messages, folders |
| `mx_outlook_calendar` | Outlook Calendar | Calendars, events CRUD, calendar view |
| `mx_gmail` | Gmail | List/search/send messages, labels, mark read, trash |
| `mx_google_tasks` | Google Tasks | Task lists and tasks CRUD |
| `mx_notion` | Notion | Pages, databases, blocks, search |
| `mx_confluence` | Confluence | Spaces, pages, labels, comments, CQL search |
| `mx_figma` | Figma | Projects, files, nodes, images, comments, components, styles, variables |
| `mx_ms_todo` | Microsoft To Do | Task lists and tasks CRUD |
| `mx_link` | All platforms | Account management, OAuth connect, universal API proxy |
| `mx_flights` | Flights *(coming soon)* | Airport/flight search, booking, orders |

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `MORPHIXAI_API_KEY` | Yes | Your MorphixAI API key (`mk_xxx` format) |
| `MORPHIXAI_BASE_URL` | No | Override API base URL (default: `https://api.morphix.app`) |

## How It Works

```
AI Agent (Claude, Cursor, etc.)
    ↓ MCP Protocol
@morphixai/mcp-server
    ↓ REST API
MorphixAI Cloud (morphix.app)
    ↓ OAuth Proxy
Third-party APIs (GitHub, Jira, Gmail, etc.)
```

MorphixAI handles OAuth token management, token refresh, and API proxying. Your AI agent just calls MCP tools — no need to manage API keys or tokens for individual platforms.

## Examples

**Ask your AI agent:**

- "Show me my open GitLab merge requests"
- "Create a Jira issue for the login bug"
- "Search my Gmail for emails from the team lead"
- "What events do I have this week in Outlook?"
- "Find all Notion pages about the Q4 roadmap"
- "List my GitHub Actions workflow runs"

## Related

- [@morphixai/core](https://www.npmjs.com/package/@morphixai/core) — Core engine with API clients and schemas
- [openclaw-morphixai](https://www.npmjs.com/package/openclaw-morphixai) — OpenClaw plugin adapter
- [MorphixAI](https://morphix.app) — Platform website

## License

MIT
