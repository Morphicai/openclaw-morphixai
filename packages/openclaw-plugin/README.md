<p align="center">
  <a href="https://morphix.app">
    <img src="https://morphix.app/_next/image?url=%2Fimages%2Ficon.png&w=128&q=75" alt="MorphixAI" width="80" />
  </a>
</p>

<h1 align="center">openclaw-morphixai</h1>

<p align="center">
  MorphixAI plugin for <a href="https://github.com/nicepkg/openclaw">OpenClaw</a> — connect your AI agent to 40+ workplace tools.
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/openclaw-morphixai"><img src="https://img.shields.io/npm/v/openclaw-morphixai.svg" alt="npm version" /></a>
  <a href="https://github.com/Morphicai/openclaw-morphixai/blob/main/LICENSE"><img src="https://img.shields.io/npm/l/openclaw-morphixai.svg" alt="license" /></a>
</p>

## Install

```bash
openclaw plugins install openclaw-morphixai
```

## Setup

1. **Get your API Key** — Visit [morphix.app/api-keys](https://morphix.app/api-keys) to create a key (format: `mk_xxx`)
2. **Set environment variable:**
   ```bash
   export MORPHIXAI_API_KEY="mk_your_api_key_here"
   ```
3. **Link accounts** — Visit [morphix.app/connections](https://morphix.app/connections) to connect the platforms you want to use

## Available Tools

| Tool | Platform | Description |
|------|----------|-------------|
| `mx_github` | GitHub | Repos, issues, PRs, Actions workflows |
| `mx_gitlab` | GitLab | Projects, MRs, issues, pipelines, branches |
| `mx_jira` | Jira | Projects, JQL search, issue CRUD, transitions |
| `mx_outlook` | Outlook Email | List/search/send/reply messages, folders |
| `mx_outlook_calendar` | Outlook Calendar | Calendars, events CRUD, calendar view |
| `mx_gmail` | Gmail | List/search/send messages, labels |
| `mx_google_tasks` | Google Tasks | Task lists and tasks CRUD |
| `mx_notion` | Notion | Pages, databases, blocks, search |
| `mx_confluence` | Confluence | Spaces, pages, labels, comments, CQL search |
| `mx_figma` | Figma | Projects, files, nodes, images, comments, components, styles |
| `mx_ms_todo` | Microsoft To Do | Task lists and tasks CRUD |
| `mx_link` | All platforms | Account management, OAuth connect, API proxy |

## Skills

This plugin includes 14 workflow skills that guide the AI agent through common tasks:

- **github-workflow** — GitHub repo/issue/PR management
- **gitlab-workflow** — GitLab MR/pipeline/branch workflow
- **jira-workflow** — Jira issue tracking and sprint management
- **notion** — Notion page and database management
- **confluence** — Confluence space and page management
- **figma** — Figma design file browsing and inspection
- **outlook-email** — Outlook email management
- **outlook-calendar** — Outlook calendar and event management
- **gmail** — Gmail email management
- **google-tasks** — Google Tasks management
- **ms-todo** — Microsoft To Do management
- **mx-link** — Account linking and API proxy
- **daily-standup** — Aggregated daily report from all connected services
- **flights** — Flight search and booking *(coming soon)*

## Not using OpenClaw?

For Claude Code, Cursor, or Windsurf, use the MCP server instead:

```bash
claude mcp add morphixai-mcp -- npx -y @morphixai/mcp-server \
  --env MORPHIXAI_API_KEY="mk_your_api_key_here"
```

See [@morphixai/mcp-server](https://www.npmjs.com/package/@morphixai/mcp-server) for more details.

## Related

- [@morphixai/mcp-server](https://www.npmjs.com/package/@morphixai/mcp-server) — MCP server adapter
- [@morphixai/core](https://www.npmjs.com/package/@morphixai/core) — Core engine
- [GitHub](https://github.com/Morphicai/openclaw-morphixai) — Source code & documentation

## License

MIT
