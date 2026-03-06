# MorphixAI 文档

## 🚀 快速开始

**新用户从这里开始**:
- **[QUICKSTART.md](QUICKSTART.md)** ⭐ — 5 分钟上手指南

## 📚 核心文档

### 使用指南
- **[SKILLS.md](SKILLS.md)** — Skills 参考和自定义指南
- **[USAGE.md](USAGE.md)** — 完整使用指南
- **[SECURITY.md](SECURITY.md)** — 安全配置和加固

### 参考文档
- **[REVIEW.md](REVIEW.md)** — 包审核报告

## 📋 工具和 Skills

### 运行时工具（12 个）

| 工具 | 说明 |
|------|------|
| `mx_link` | 账号链接管理与统一 API 代理 |
| `mx_jira` | Jira Cloud（Issues、项目、状态流转） |
| `mx_gitlab` | GitLab（项目、MR、Issue、Pipeline） |
| `mx_github` | GitHub（Repo、Issue、PR、Workflow） |
| `mx_outlook` | Outlook 邮件（读取、发送、搜索） |
| `mx_outlook_calendar` | Outlook 日历（日程、事件） |
| `mx_ms_todo` | Microsoft To Do（任务列表、任务） |
| `mx_gmail` | Gmail（读取、发送、搜索、标签） |
| `mx_google_tasks` | Google Tasks（任务列表、任务） |
| `mx_notion` | Notion（页面、数据库、Block、搜索） |
| `mx_confluence` | Confluence Cloud（空间、页面、搜索） |
| `mx_figma` | Figma（文件、项目、组件、样式、评论） |

### Skill 工作流（14 个）

| Skill | 说明 | 依赖 |
|-------|------|------|
| `gitlab-workflow` | GitLab MR/CI/Review，包含分支命名和 commit 规范 | `mx_gitlab` 工具 |
| `github-workflow` | GitHub PR/Actions/Review 工作流 | `mx_github` 工具 |
| `jira-workflow` | Jira Issue 管理和状态流转 | `mx_jira` 工具 |
| `daily-standup` | 早报聚合器，汇总多个来源 | 多个工具 |
| `gmail` | Gmail 邮件管理 | `mx_gmail` 工具 |
| `outlook-email` | Outlook 邮件管理 | `mx_outlook` 工具 |
| `outlook-calendar` | Outlook 日历管理 | `mx_outlook_calendar` 工具 |
| `ms-todo` | Microsoft To Do 任务管理 | `mx_ms_todo` 工具 |
| `google-tasks` | Google Tasks 任务管理 | `mx_google_tasks` 工具 |
| `notion` | Notion 知识库管理 | `mx_notion` 工具 |
| `confluence` | Confluence 文档管理 | `mx_confluence` 工具 |
| `figma` | Figma 设计协作 | `mx_figma` 工具 |
| `mx-link` | 第三方账号链接管理 | `mx_link` 工具 |
| `pipedream-proxy` | 通过 Pipedream 统一管理 API 凭据（可选） | Pipedream Token |

## 🔗 快速链接

- **主 README**: [../README.md](../README.md)
- **贡献指南**: [../CONTRIBUTING.md](../CONTRIBUTING.md)
- **变更日志**: [../CHANGELOG.md](../CHANGELOG.md)
