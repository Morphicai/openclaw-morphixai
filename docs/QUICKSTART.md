# MorphixAI — 快速开始

5 分钟配置你的 AI Agent 办公助手。

## 前置条件

- Node.js >= 18
- 已安装 OpenClaw (`npm i -g openclaw@latest`) 或 Claude Code / Cursor

## 方式一：OpenClaw 用户

### 1. 安装插件

```bash
openclaw plugins install openclaw-morphixai
```

*如果你之前安装过旧名 `openclaw-morphix`，请先卸载再安装：*
```bash
openclaw plugins uninstall openclaw-morphix
openclaw plugins install openclaw-morphixai
```

### 2. 配置 API Key

获取 MorphixAI API Key：
1. 访问 [MorphixAI Connections](https://morphix.app/connections) 链接你的第三方账号（GitHub、Jira 等）
2. 访问 [MorphixAI API Keys](https://morphix.app/api-keys) 生成 `mk_xxxxxx` 密钥

设置环境变量：
```bash
export MORPHIXAI_API_KEY="mk_your_api_key_here"
```

或在 OpenClaw 插件配置中填入。

### 3. 重启并验证

```bash
# 重启 OpenClaw
openclaw gateway restart

# 查看已注册的工具
openclaw plugins list
```

你应该能看到 12 个 `mx_*` 工具已注册。

## 方式二：Claude Code / Cursor / Windsurf（MCP 用户）

### 1. 添加 MCP Server

**Claude Code:**
```bash
claude mcp add morphixai-mcp -- npx -y @morphixai/mcp-server --env MORPHIXAI_API_KEY="mk_your_api_key_here"
```

**Claude Desktop / Cursor:**

在 MCP 配置文件中添加：
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

### 2. 验证

在对话中测试：
- "查看我的 GitHub PR"
- "列出 Jira 上分配给我的 Issue"
- "搜索 Notion 中的文档"

## 可用工具一览

| 工具 | 说明 |
|------|------|
| `mx_link` | 账号链接管理与统一 API 代理 |
| `mx_jira` | Jira Cloud |
| `mx_gitlab` | GitLab |
| `mx_github` | GitHub |
| `mx_outlook` | Outlook 邮件 |
| `mx_outlook_calendar` | Outlook 日历 |
| `mx_ms_todo` | Microsoft To Do |
| `mx_gmail` | Gmail |
| `mx_google_tasks` | Google Tasks |
| `mx_notion` | Notion |
| `mx_confluence` | Confluence |
| `mx_figma` | Figma |

## 下一步

- [USAGE.md](USAGE.md) — 完整使用指南和常见场景
- [SKILLS.md](SKILLS.md) — Skills 参考和自定义
- [SECURITY.md](SECURITY.md) — 安全配置
