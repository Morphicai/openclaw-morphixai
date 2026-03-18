<p align="center">
  <a href="https://morphix.app">
    <img src="https://morphix.app/brand/logo-rounded.png" alt="MorphixAI" width="80" />
  </a>
</p>

<h1 align="center">MorphixAI AI Agent Plugins</h1>

<p align="center">
  <a href="https://morphix.app">morphix.app</a>
</p>

<p align="center">
  <strong>English</strong> | <a href="./README.zh-CN.md">简体中文</a>
</p>

This repository contains the official integrations for **[MorphixAI](https://morphix.app)**, allowing various AI Agents (such as OpenClaw, Claude Code, Cursor, and Windsurf) to seamlessly interact with workplace tools like GitHub, GitLab, Jira, Notion, Google Workspace, and Office 365.

## 📦 Architecture

This repository is structured as a `pnpm workspace` monorepo to ensure maximum code reuse and pure dependency trees for different platforms.

- **`@morphixai/core`**: The platform-agnostic core engine. It contains all API clients, authentication logic, and TypeBox schemas.
- **`openclaw-morphixai`**: The adapter for OpenClaw. It exposes tools and skill prompts native to the OpenClaw Agent ecosystem.
- **`@morphixai/mcp-server`**: The adapter for MCP (Model Context Protocol). It exposes the core capabilities as a standard MCP server, making it compatible with Claude Code, Cursor, and Claude Desktop.

---

## 🚀 Installation & Usage

### 1. For Claude Code, Cursor, Windsurf (MCP Users)

If your AI assistant supports the **Model Context Protocol (MCP)**, you can install the MorphixAI server globally.

```bash
# 1. Install the MCP server globally
npm install -g @morphixai/mcp-server
```

**For Claude Code:**
Add the MCP server to your Claude Code configuration by passing your Morphix API Key:
```bash
claude mcp add morphixai-mcp -- npx -y @morphixai/mcp-server --env MORPHIXAI_API_KEY="mk_your_api_key_here"
```

**For Claude Desktop / Cursor:**
Add the following to your `claude_desktop_config.json` or Cursor MCP settings:
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

### 2. For OpenClaw Users

Install the plugin directly within your OpenClaw environment:

```bash
openclaw plugins install openclaw-morphixai
```
*Note: The legacy package `openclaw-morphix` has been deprecated, but installing it will safely proxy to `openclaw-morphixai`.*

---

## 🔑 Getting Started

1. **Register / Login**: Visit [morphix.app](https://morphix.app) to create your MorphixAI account or sign in.
2. **Get your API Key**: Go to [MorphixAI API Keys](https://morphix.app/api-keys) and create a new key (format: `mk_xxxxxx`).
3. **Link your accounts** *(optional)*: Visit [MorphixAI Connections](https://morphix.app/connections) to connect third-party platforms (GitHub, Jira, Notion, etc.) that you want to use through AI agents.
4. **Configure your environment**: Pass the key via the `MORPHIXAI_API_KEY` environment variable, then follow the [Installation](#-installation--usage) instructions above for your AI agent.

## 🧩 Skills

MorphixAI provides the following skills (capabilities) for AI agents to interact with workplace tools:

| Skill | Tool | Description |
|-------|------|-------------|
| **GitHub Workflow** | `mx_github` | Repository, Issue, Pull Request management and GitHub Actions workflow triggering |
| **GitLab Workflow** | `mx_gitlab` | MR/Issue/Pipeline/Branch management with code review best practices |
| **Jira Workflow** | `mx_jira` | Project listing, JQL-based issue search, issue CRUD, status transitions, comments (Markdown auto-converts to ADF) |
| **Notion** | `mx_notion` | Page/database CRUD, block management, knowledge base search |
| **Confluence** | `mx_confluence` | Space/page CRUD, label management, comments, CQL search |
| **Figma** | `mx_figma` | Browse projects/files, export images, manage comments, view components/styles/design tokens |
| **Outlook Email** | `mx_outlook` | List/search/send/reply messages, folder management |
| **Outlook Calendar** | `mx_outlook_calendar` | Calendar/event CRUD, calendar view, attendee management |
| **Gmail** | `mx_gmail` | List/search/send messages, label management (requires linking Gmail account) |
| **Microsoft To Do** | `mx_ms_todo` | Task list and task CRUD, complete tasks, importance/status management |
| **Google Tasks** | `mx_google_tasks` | Task list and task CRUD (requires linking Google Tasks account) |
| **Flights** | `mx_flights` | Airport/flight search, offer details, seat maps, order booking and management (powered by Duffel) |
| **Daily Standup** | *composite* | Aggregates data from GitLab, GitHub, Jira, Email, Calendar, and Tasks into a concise daily report. Triggered by keywords like "standup", "日报", "早报" |
| **Office Link** | `mx_link` | Unified entry point: account management, connect 40+ platforms, and API proxy for platforms without dedicated skills |

> **Note:** All skills require a `MORPHIXAI_API_KEY`. Platforms with dedicated skills (e.g., GitHub, Jira) should always use those skills directly instead of `mx_link` proxy.

---

## 🛠️ Development

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run tests
pnpm test
```

## License

MIT
