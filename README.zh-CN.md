<p align="center">
  <a href="https://morphix.app">
    <img src="https://morphix.app/_next/image?url=%2Fimages%2Ficon.png&w=128&q=75" alt="MorphixAI" width="80" />
  </a>
</p>

<h1 align="center">MorphixAI AI Agent 插件</h1>

<p align="center">
  <a href="https://morphix.app">morphix.app</a>
</p>

<p align="center">
  <a href="./README.md">English</a> | <strong>简体中文</strong>
</p>

本仓库包含 **[MorphixAI](https://morphix.app)** 的官方集成插件，让各类 AI Agent（如 OpenClaw、Claude Code、Cursor、Windsurf）能够无缝对接 GitHub、GitLab、Jira、Notion、Google Workspace、Office 365 等办公工具。

## 📦 架构

本仓库采用 `pnpm workspace` monorepo 结构，确保最大化代码复用和清晰的依赖管理。

- **`@morphixai/core`**：平台无关的核心引擎，包含所有 API 客户端、认证逻辑和 TypeBox Schema。
- **`openclaw-morphixai`**：OpenClaw 适配器，提供 OpenClaw Agent 生态原生的工具和 Skill Prompt。
- **`@morphixai/mcp-server`**：MCP（Model Context Protocol）适配器，将核心能力封装为标准 MCP Server，兼容 Claude Code、Cursor 和 Claude Desktop。

---

## 🚀 安装与使用

### 1. Claude Code、Cursor、Windsurf（MCP 用户）

如果你的 AI 助手支持 **Model Context Protocol (MCP)**，可以直接安装 MorphixAI MCP Server。

```bash
# 1. 全局安装 MCP Server
npm install -g @morphixai/mcp-server
```

**Claude Code：**
通过以下命令将 MCP Server 添加到 Claude Code 配置：
```bash
claude mcp add morphixai-mcp -- npx -y @morphixai/mcp-server --env MORPHIXAI_API_KEY="mk_your_api_key_here"
```

**Claude Desktop / Cursor：**
在 `claude_desktop_config.json` 或 Cursor MCP 配置中添加：
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

### 2. OpenClaw 用户

在 OpenClaw 环境中直接安装插件：

```bash
openclaw plugins install openclaw-morphixai
```
*注：旧包 `openclaw-morphix` 已弃用，安装它会自动代理到 `openclaw-morphixai`。*

---

## 🔑 快速开始

1. **注册 / 登录**：访问 [morphix.app](https://morphix.app) 创建账号或登录。
2. **获取 API Key**：前往 [MorphixAI API Keys](https://morphix.app/api-keys)，创建密钥（格式：`mk_xxxxxx`）。
3. **关联账号**（可选）：访问 [MorphixAI Connections](https://morphix.app/connections)，关联你需要通过 AI Agent 使用的第三方平台（GitHub、Jira、Notion 等）。
4. **配置环境变量**：通过 `MORPHIXAI_API_KEY` 环境变量传入密钥，然后按照上方[安装说明](#-安装与使用)完成配置。

## 🧩 技能列表

MorphixAI 为 AI Agent 提供以下技能（能力），用于对接各类办公工具：

| 技能 | 工具 | 说明 |
|------|------|------|
| **GitHub 工作流** | `mx_github` | 仓库、Issue、Pull Request 管理及 GitHub Actions 工作流触发 |
| **GitLab 工作流** | `mx_gitlab` | MR / Issue / Pipeline / 分支管理，支持代码审查最佳实践 |
| **Jira 工作流** | `mx_jira` | 项目列表、JQL 搜索、Issue 增删改查、状态流转、评论（Markdown 自动转 ADF） |
| **Notion** | `mx_notion` | 页面 / 数据库增删改查、Block 管理、知识库搜索 |
| **Confluence** | `mx_confluence` | 空间 / 页面增删改查、标签管理、评论、CQL 搜索 |
| **Figma** | `mx_figma` | 浏览项目 / 文件、导出图片、评论管理、查看组件 / 样式 / 设计 Token |
| **Outlook 邮件** | `mx_outlook` | 邮件列表 / 搜索 / 发送 / 回复，文件夹管理 |
| **Outlook 日历** | `mx_outlook_calendar` | 日历 / 事件增删改查、日历视图、参会人管理 |
| **Gmail** | `mx_gmail` | 邮件列表 / 搜索 / 发送，标签管理（需关联 Gmail 账号） |
| **Microsoft To Do** | `mx_ms_todo` | 任务列表和任务增删改查、完成任务、重要性 / 状态管理 |
| **Google Tasks** | `mx_google_tasks` | 任务列表和任务增删改查（需关联 Google Tasks 账号） |
| **机票预订** | `mx_flights` | 机场 / 航班搜索、报价详情、座位图、订单预订与管理（基于 Duffel） |
| **每日站会** | *组合技能* | 聚合 GitLab、GitHub、Jira、邮件、日历、任务数据生成简洁日报。通过 "standup"、"日报"、"早报" 等关键词触发 |
| **Office Link** | `mx_link` | 统一入口：账号管理、关联 40+ 平台、为无专属技能的平台提供 API 代理 |

> **提示：** 所有技能均需要 `MORPHIXAI_API_KEY`。有专属技能的平台（如 GitHub、Jira）应直接使用对应技能，而非 `mx_link` 代理。

---

## 🛠️ 开发

```bash
# 安装依赖
pnpm install

# 构建所有包
pnpm build

# 运行测试
pnpm test
```

## License

MIT
