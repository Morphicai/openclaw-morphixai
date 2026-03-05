<div align="center">
  <img src="https://morphix.app/images/icon.png" alt="MorphixAI" width="80" height="80" />
  <h1>MorphixAI for OpenClaw</h1>
  <p><strong>One API Key. Thousands of Integrations.</strong></p>
  <p>一个密钥，链接数千个应用。</p>

  [![npm version](https://img.shields.io/npm/v/openclaw-morphixai)](https://www.npmjs.com/package/openclaw-morphixai)
  [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
  [![OpenClaw Plugin](https://img.shields.io/badge/OpenClaw-plugin-blue)](https://morphix.app)
</div>

> Connect GitLab, GitHub, Jira, Confluence, Outlook, Gmail, Notion, Figma and more to your AI agent — powered by **MorphixAI**. One key unlocks them all.

**[English](#english) | [中文](#中文)**

---

## Quick Start

> **One API Key. Thousands of Integrations.** — Get yours at [morphix.app/api-keys](https://morphix.app/api-keys).

```bash
# 1. Install MorphixAI for OpenClaw
openclaw plugins install openclaw-morphixai

# 2. Add your MorphixAI API Key
echo "MORPHIXAI_API_KEY=mk_your_key_here" >> ~/.openclaw/.env

# 3. Link accounts → https://morphix.app/connections
# Restart OpenClaw — done.
```

No cloning. No building. No config files.

---

## English

### Installation

Install **MorphixAI for OpenClaw** from the npm registry:

```bash
openclaw plugins install openclaw-morphixai
```

OpenClaw downloads and registers the plugin automatically — no cloning or building required.

### Setup

#### 1. Get a MorphixAI API Key

All third-party API calls are routed through the MorphixAI proxy — one key for everything.

1. Visit [morphix.app/api-keys](https://morphix.app/api-keys)
2. Create an API Key — **select all scopes**
3. Copy the `mk_xxx` key

#### 2. Link Your Accounts

Visit [morphix.app/connections](https://morphix.app/connections) and complete OAuth for each platform you need.

Supported platforms:

| Platform | Capabilities |
|----------|-------------|
| GitLab | Projects, MRs, Pipelines, Issues, Branches |
| GitHub | Repos, Issues, PRs, Actions |
| Jira | Projects, Issues, transitions, Comments |
| Confluence | Spaces, Pages, CQL search, Comments |
| Outlook Mail | Read, send, search, reply |
| Outlook Calendar | Events CRUD |
| Microsoft To Do | Task lists and tasks |
| Gmail | Read, send, search |
| Google Tasks | Task lists and tasks |
| Notion | Pages, Databases, Blocks |
| Figma | Files, Components, Styles, Comments, Exports |

#### 3. Configure the API Key

**Option A — Environment variable** (recommended, add to `~/.openclaw/.env`):

```bash
MORPHIXAI_API_KEY=mk_your_api_key_here
```

**Option B — Plugin config** (in `~/.openclaw/openclaw.json`):

```jsonc
{
  "plugins": {
    "entries": {
      "openclaw-morphixai": {
        "enabled": true,
        "morphix": {
          "apiKey": "mk_your_api_key_here"
        }
      }
    }
  }
}
```

#### 4. (Optional) GitLab Direct Token

Required for `gitlab-workflow` and `daily-standup` skills:

```bash
# ~/.openclaw/.env
GITLAB_TOKEN=glpat-xxxxxxxxxxxxxxxxxxxx
```

### Tools

12 tools are available to the agent — just describe what you need in natural language:

```
Show my open MRs on GitLab
List Jira issues due this week
Search Confluence for the deployment guide
Send an email to team@company.com
Create a Notion page for today's meeting
```

| Tool | Platform | Capabilities |
|------|----------|-------------|
| `mx_gitlab` | GitLab | Projects / MRs / Pipelines / Issues / Branches |
| `mx_github` | GitHub | Repos / Issues / PRs / Workflows |
| `mx_jira` | Jira | Projects / Issues / Transitions / Comments |
| `mx_confluence` | Confluence | Spaces / Pages / CQL / Comments |
| `mx_outlook` | Outlook Mail | Read / Send / Search / Reply |
| `mx_outlook_calendar` | Outlook Calendar | Events CRUD |
| `mx_ms_todo` | MS To Do | Task lists / Tasks |
| `mx_gmail` | Gmail | Read / Send / Search |
| `mx_google_tasks` | Google Tasks | Task lists / Tasks |
| `mx_notion` | Notion | Pages / Databases / Blocks |
| `mx_figma` | Figma | Files / Components / Styles / Comments / Exports |
| `mx_link` | MorphixAI | Account management / Universal API proxy |

### Skills

14 pre-defined multi-step workflows that the agent activates automatically:

| Skill | Purpose |
|-------|---------|
| `gitlab-workflow` | MR / CI / Review with branch naming and commit conventions |
| `github-workflow` | PR / Actions / Issue workflow |
| `jira-workflow` | Issue management and status transitions |
| `confluence` | Page editing and search |
| `daily-standup` | Morning briefing — aggregates GitLab + Jira + email |
| `outlook-email` | Outlook mail workflow |
| `outlook-calendar` | Outlook calendar management |
| `gmail` | Gmail workflow |
| `google-tasks` | Google Tasks management |
| `ms-todo` | Microsoft To Do management |
| `notion` | Pages and database operations |
| `figma` | View designs and manage comments |
| `office-link` | Third-party account linking and management |
| `pipedream-proxy` | Pipedream credential management (advanced) |

### Example Usage

```
# Daily standup
standup

# GitLab
Show pending MRs
Review MR #42
Create MR from feature/AUTH-123 to develop

# Jira
What issues are due for me this week?
Move PROJ-456 to In Progress

# Email
Show today's unread emails
Send a weekly report email to team@company.com

# Cross-platform
Create a GitLab MR from Jira issue PROJ-456
```

### Project Structure

```
openclaw-morphixai/
├── openclaw.plugin.json   # Plugin manifest (ID, configSchema)
├── index.ts               # Entry point — registers 12 tools
├── src/
│   ├── morphix-client.ts  # MorphixAI API proxy client
│   ├── app-clients/       # Per-platform API clients
│   ├── schemas/           # Tool input schemas (TypeBox)
│   └── tools/             # 12 tool implementations
├── skills/                # 15 skill workflows (SKILL.md)
└── templates/             # Config templates
```

### Roadmap

We're actively expanding platform coverage, with a focus on apps popular in China:

#### Communication & Collaboration
| Platform | Status |
|----------|--------|
| 飞书 (Feishu / Lark) | 🔜 Planned — messages, docs, calendar, tasks |
| 钉钉 (DingTalk) | 🔜 Planned — messages, OA approval, attendance |
| 企业微信 (WeCom) | 🔜 Planned — messages, CRM, OA workflows |

#### Code Hosting
| Platform | Status |
|----------|--------|
| Gitee (码云) | 🔜 Planned — repos, PRs, issues, CI |

#### Project Management
| Platform | Status |
|----------|--------|
| TAPD (腾讯敏捷) | 🔜 Planned — stories, tasks, sprints, bugs |
| PingCode | 🔜 Planned — R&D management, backlogs, iterations |
| 禅道 (ZenTao) | 🔜 Planned — projects, bugs, test cases |

#### Knowledge Base & Docs
| Platform | Status |
|----------|--------|
| 语雀 (Yuque) | 🔜 Planned — knowledge bases, docs, teams |
| 腾讯文档 (Tencent Docs) | 🔜 Planned — collaborative documents |
| 石墨文档 (Shimo) | 🔜 Planned — collaborative documents |

#### Design
| Platform | Status |
|----------|--------|
| 蓝湖 (Lanhu) | 🔜 Planned — design specs, comments, assets |

Want to prioritize a platform or request a new one? [Open an issue](https://github.com/Morphicai/openclaw-morphixai/issues).

### Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

### License

[MIT](LICENSE) © [MorphixAI](https://morphix.app)

---

## 中文

### 快速开始

> **一个密钥，链接数千个应用。** — 立即在 [morphix.app/api-keys](https://morphix.app/api-keys) 获取。

```bash
# 1. 安装 MorphixAI for OpenClaw
openclaw plugins install openclaw-morphixai

# 2. 填入你的 MorphixAI API Key
echo "MORPHIXAI_API_KEY=mk_your_key_here" >> ~/.openclaw/.env

# 3. 链接第三方账号 → https://morphix.app/connections
# 重启 OpenClaw，即可使用。
```

无需 clone，无需构建，开箱即用。

### 安装

从 npm 安装 **MorphixAI for OpenClaw**：

```bash
openclaw plugins install openclaw-morphixai
```

### 配置

#### 1. 获取 MorphixAI API Key

所有第三方平台 API 调用均通过 MorphixAI 代理，只需一个 Key：

1. 访问 [morphix.app/api-keys](https://morphix.app/api-keys)
2. 创建 API Key（**Scope 全选**）
3. 复制 `mk_xxx` 格式的 Key

#### 2. 链接第三方账号

访问 [morphix.app/connections](https://morphix.app/connections)，点击对应平台完成 OAuth 授权：

| 平台 | 功能 |
|------|------|
| GitLab | 项目、MR、Pipeline、Issue、分支管理 |
| GitHub | 仓库、Issue、PR、Actions 管理 |
| Jira | 项目、Issue、状态流转、评论 |
| Confluence | 空间、页面、CQL 搜索、评论 |
| Outlook 邮箱 | 收发、搜索、回复邮件 |
| Outlook 日历 | 日历事件 CRUD |
| Microsoft To Do | 任务列表/任务管理 |
| Gmail | 收发、搜索邮件 |
| Google Tasks | 任务列表/任务管理 |
| Notion | 页面、数据库、区块 |
| Figma | 文件、组件、样式、评论、图片导出 |

#### 3. 配置 API Key

**方式 A — 环境变量**（推荐，写入 `~/.openclaw/.env`）：

```bash
MORPHIXAI_API_KEY=mk_your_api_key_here
```

**方式 B — 插件配置**（写入 `~/.openclaw/openclaw.json`）：

```jsonc
{
  "plugins": {
    "entries": {
      "openclaw-morphixai": {
        "enabled": true,
        "morphix": {
          "apiKey": "mk_your_api_key_here"
        }
      }
    }
  }
}
```

#### 4. （可选）GitLab 直连 Token

使用 `gitlab-workflow`、`daily-standup` Skill 时需要：

```bash
# ~/.openclaw/.env
GITLAB_TOKEN=glpat-xxxxxxxxxxxxxxxxxxxx
```

### 工具列表

插件提供 12 个工具，Agent 自动调用，你只需用自然语言描述：

```
查看我在 GitLab 上待合并的 MR
帮我看看 Jira 本周到期的 Issue
搜索 Confluence 中的部署文档
发一封邮件给 xxx@company.com
在 Notion 创建一个页面
```

| 工具名 | 平台 | 核心能力 |
|--------|------|---------|
| `mx_gitlab` | GitLab | 项目/MR/Pipeline/Issue/分支 |
| `mx_github` | GitHub | 仓库/Issue/PR/Workflow |
| `mx_jira` | Jira | 项目/Issue/状态流转/评论 |
| `mx_confluence` | Confluence | 空间/页面/CQL 搜索/评论 |
| `mx_outlook` | Outlook 邮箱 | 收发/搜索/回复邮件 |
| `mx_outlook_calendar` | Outlook 日历 | 日历事件 CRUD |
| `mx_ms_todo` | MS To Do | 任务列表/任务管理 |
| `mx_gmail` | Gmail | 收发/搜索邮件 |
| `mx_google_tasks` | Google Tasks | 任务列表/任务管理 |
| `mx_notion` | Notion | 页面/数据库/区块 |
| `mx_figma` | Figma | 文件/组件/样式/评论/导出 |
| `mx_link` | 统一入口 | 账号管理/通用 API 代理 |

### Skill 工作流

14 个预定义多步骤工作流，Agent 匹配场景后自动激活：

| Skill | 用途 |
|-------|------|
| `gitlab-workflow` | GitLab MR/CI/Review，含分支命名和 commit 规范 |
| `github-workflow` | GitHub PR/Actions/Issue 工作流 |
| `jira-workflow` | Jira Issue 管理和状态流转 |
| `confluence` | Confluence 页面编辑和搜索 |
| `daily-standup` | 每日早报，聚合 GitLab + Jira + 邮件 |
| `outlook-email` | Outlook 邮件收发工作流 |
| `outlook-calendar` | Outlook 日历管理 |
| `gmail` | Gmail 邮件工作流 |
| `google-tasks` | Google Tasks 任务管理 |
| `ms-todo` | Microsoft To Do 管理 |
| `notion` | Notion 页面和数据库操作 |
| `figma` | Figma 设计稿查看和评论 |
| `office-link` | 第三方账号链接和管理 |
| `pipedream-proxy` | Pipedream 统一凭据管理（进阶） |

### 使用示例

```
# 每日早报
standup

# GitLab
查看待合并的 MR
review MR #42
从 feature/AUTH-123 创建 MR 到 develop

# Jira
我本周到期的 Issue 有哪些
把 PROJ-456 状态改为 In Progress

# 邮件
查看今天的未读邮件
给 team@company.com 发邮件，主题是周报

# 跨平台编排
从 Jira Issue PROJ-456 创建对应的 GitLab MR
```

### 路线图

我们正积极扩展平台支持，重点覆盖国内主流应用：

#### 沟通与协作
| 平台 | 状态 |
|------|------|
| 飞书 (Feishu) | 🔜 计划中 — 消息、文档、日历、任务 |
| 钉钉 (DingTalk) | 🔜 计划中 — 消息、OA 审批、考勤 |
| 企业微信 (WeCom) | 🔜 计划中 — 消息、CRM、OA 工作流 |

#### 代码托管
| 平台 | 状态 |
|------|------|
| Gitee (码云) | 🔜 计划中 — 仓库、PR、Issue、CI |

#### 项目管理
| 平台 | 状态 |
|------|------|
| TAPD (腾讯敏捷) | 🔜 计划中 — 需求、任务、迭代、缺陷 |
| PingCode | 🔜 计划中 — 研发管理、Backlog、迭代 |
| 禅道 (ZenTao) | 🔜 计划中 — 项目、缺陷、测试用例 |

#### 知识库与文档
| 平台 | 状态 |
|------|------|
| 语雀 (Yuque) | 🔜 计划中 — 知识库、文档、团队空间 |
| 腾讯文档 | 🔜 计划中 — 在线协作文档 |
| 石墨文档 (Shimo) | 🔜 计划中 — 在线协作文档 |

#### 设计
| 平台 | 状态 |
|------|------|
| 蓝湖 (Lanhu) | 🔜 计划中 — 设计标注、评论、切图 |

有想优先支持的平台？欢迎 [提交 Issue](https://github.com/Morphicai/openclaw-morphixai/issues) 告诉我们。

### 贡献

参见 [CONTRIBUTING.md](CONTRIBUTING.md)。

### 许可证

[MIT](LICENSE) © [MorphixAI](https://morphix.app)
