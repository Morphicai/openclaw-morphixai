# @morphixai/openclaw-morphixai — OpenClaw 办公插件

将 OpenClaw 变成你的个人办公助手，通过 MorphixAI 统一代理集成 12 个第三方平台。

## 安装插件

### 方式 A：本地路径安装（开发推荐）

```bash
# 1. 克隆项目
git clone <repo-url> ~/www/openclaw-office
cd ~/www/openclaw-office

# 2. 安装依赖 & 构建
pnpm install && pnpm build

# 3. 注册插件到 OpenClaw
openclaw plugin install --path ~/www/openclaw-office
```

### 方式 B：手动注册

在 `~/.openclaw/openclaw.json` 中手动添加：

```jsonc
{
  "plugins": {
    "load": {
      "paths": [
        "/your/path/to/openclaw-office"  // ← 添加这一行
      ]
    },
    "entries": {
      "office": { "enabled": true }       // ← 添加这一行
    },
    "installs": {
      "office": {                          // ← 添加这一段
        "source": "path",
        "sourcePath": "/your/path/to/openclaw-office",
        "installPath": "/your/path/to/openclaw-office",
        "version": "0.2.0"
      }
    }
  }
}
```

安装完成后重启 OpenClaw 即可生效。

## 配置插件

### 1. 获取 MorphixAI API Key

所有第三方平台 API 调用均通过 MorphixAI 代理，只需一个 Key：

1. 访问 https://baibian.app/api-keys
2. 创建 API Key（Scope 全选）
3. 复制 `mk_xxx` 格式的 Key

### 2. 链接第三方账号

访问 https://baibian.app/connections ，点击对应平台完成 OAuth 授权。支持的平台：

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

### 3. 配置 API Key

在 `~/.openclaw/openclaw.json` 的 `plugins.entries.office` 中添加配置：

```jsonc
{
  "plugins": {
    "entries": {
      "office": {
        "enabled": true,
        "baibian": {
          "enabled": true,
          "apiKey": "mk_your_api_key_here"
        }
      }
    }
  }
}
```

或者通过环境变量（`~/.openclaw/.env`）：

```bash
MORPHIXAI_API_KEY=mk_your_api_key_here
```

### 4. （可选）GitLab 直连 Token

如果需要 `gitlab-workflow` / `release-workflow` / `daily-standup` 这些 Skill，还需要配置 GitLab Token：

```bash
# ~/.openclaw/.env
GITLAB_TOKEN=glpat-xxxxxxxxxxxxxxxxxxxx
```

或在 `plugins.entries.office.gitlab.token` 中配置。

## 使用

插件加载后，OpenClaw Agent 自动获得以下能力：

### 12 个 Office 工具

这些工具由 Agent 自动调用，你只需用自然语言描述需求：

```
查看我在 GitLab 上待合并的 MR
帮我看看 Jira 本周到期的 Issue
搜索 Confluence 中的部署文档
发一封邮件给 xxx@company.com
查看今天的 Outlook 日历
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

### 15 个 Skill 工作流

Skill 是预定义的多步骤工作流提示词，Agent 在匹配到对应场景时自动激活：

| Skill | 用途 |
|-------|------|
| `gitlab-workflow` | GitLab MR/CI/Review，含分支命名和 commit 规范 |
| `github-workflow` | GitHub PR/Actions/Issue 工作流 |
| `jira-workflow` | Jira Issue 管理和状态流转 |
| `confluence` | Confluence 页面编辑和搜索 |
| `daily-standup` | 每日早报，聚合 GitLab + Jira + 邮件 |
| `release-workflow` | 逐步发布 SOP，带预检查 |
| `outlook-email` | Outlook 邮件收发工作流 |
| `outlook-calendar` | Outlook 日历管理 |
| `gmail` | Gmail 邮件工作流 |
| `google-tasks` | Google Tasks 任务管理 |
| `ms-todo` | Microsoft To Do 管理 |
| `notion` | Notion 页面和数据库操作 |
| `figma` | Figma 设计稿查看和评论 |
| `office-link` | 第三方账号链接和管理 |
| `pipedream-proxy` | Pipedream 统一凭据管理（可选） |

### 使用示例

```
# 每日早报
standup

# GitLab 操作
查看待合并的 MR
review MR #42
从 feature/AUTH-123 创建 MR 到 develop

# Jira 操作
我本周到期的 Issue 有哪些
把 PROJ-456 状态改为 In Progress

# 邮件
查看今天的未读邮件
给 team@company.com 发邮件，主题是周报

# 跨平台编排
从 Jira Issue PROJ-456 创建对应的 GitLab MR
```

## 项目结构

```
openclaw-office/
├── openclaw.plugin.json   # 插件声明（ID、configSchema）
├── index.ts               # 插件入口，注册 12 个工具
├── src/
│   ├── baibian-client.ts  # MorphixAI API 代理客户端
│   ├── app-clients/       # 各平台 API 客户端
│   ├── schemas/           # 工具输入 schema（TypeBox）
│   └── tools/             # 12 个工具实现
├── skills/                # 15 个 Skill 工作流（SKILL.md）
└── templates/             # 配置模板
```
