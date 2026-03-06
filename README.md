# MorphixAI AI Agent Plugins (Monorepo)

This repository contains the official integrations for **MorphixAI**, allowing various AI Agents (such as OpenClaw, Claude Code, Cursor, and Windsurf) to seamlessly interact with workplace tools like GitHub, GitLab, Jira, Notion, Google Workspace, and Office 365.

## 📦 Architecture

This repository is structured as a `pnpm workspace` monorepo to ensure maximum code reuse and pure dependency trees for different platforms.

- **`@morphixai/core`**: The platform-agnostic core engine. It contains all API clients, authentication logic, and TypeBox schemas.
- **`@morphixai/openclaw-plugin`**: The adapter for OpenClaw. It exposes tools and skill prompts native to the OpenClaw Agent ecosystem.
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
openclaw plugins install @morphixai/openclaw-plugin
```
*Note: The legacy packages `openclaw-morphix` and `openclaw-morphixai` have been deprecated, but installing them will safely proxy to the new `@morphixai/openclaw-plugin`.*

---

## 🔑 Authentication

All MorphixAI plugins require a **MorphixAI API Key**. 
1. Visit [MorphixAI Connections](https://morphix.app/connections) to link your third-party accounts (GitHub, Jira, etc.).
2. Visit [MorphixAI API Keys](https://morphix.app/api-keys) to generate your `mk_xxxxxx` key.
3. Pass the key via the `MORPHIXAI_API_KEY` environment variable.

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
