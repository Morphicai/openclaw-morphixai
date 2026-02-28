# 工具环境参考

本文件记录 office skills 使用的工具和配置。所有第三方 API 调用均通过 MorphixAI 代理，无需本地存储各平台 token。

## 统一认证：MorphixAI

| 项目 | 值 |
|------|-----|
| 基础 URL | `https://api.baibian.app` |
| 认证 | `Authorization: Bearer mk_xxx`（API Key） |
| 获取 Key | https://baibian.app/api-keys（Scope 全选） |
| 链接账号 | https://baibian.app/connections |

### 环境变量

```bash
# 唯一必需的环境变量
MORPHIXAI_API_KEY=mk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

配置位置：`~/.openclaw/.env` 或项目 `test/.env`

## 可用工具一览

| 工具 | 平台 | app 标识 | 核心功能 |
|------|------|----------|---------|
| `office_gitlab` | GitLab | `gitlab` | 项目/MR/Pipeline/Issue/分支 |
| `office_github` | GitHub | `github` | 仓库/Issue/PR/Workflow |
| `office_jira` | Jira Cloud | `jira` | 项目/Issue/状态流转/评论 |
| `office_confluence` | Confluence | `confluence` | 空间/页面/标签/评论/子页面/CQL 搜索 |
| `office_outlook` | Outlook 邮箱 | `microsoft_outlook` | 收发/搜索/回复邮件 |
| `office_outlook_calendar` | Outlook 日历 | `microsoft_outlook_calendar` | 日历/事件 CRUD |
| `office_ms_todo` | Microsoft To Do | `microsofttodo` | 任务列表/任务 CRUD |
| `office_gmail` | Gmail | `gmail` | 收发/搜索邮件 |
| `office_google_tasks` | Google Tasks | `google_tasks` | 任务列表/任务 CRUD |
| `office_notion` | Notion | `notion` | 页面/数据库/区块 |
| `office_figma` | Figma | `figma` | 文件/项目/组件/样式/评论/图片导出 |
| `office_link` | 统一入口 | - | 账号管理/API 代理 |

## 常用 Jira JQL

```
# 我的未完成
assignee = currentUser() AND status != Done ORDER BY priority DESC

# 本周到期
assignee = currentUser() AND due >= startOfWeek() AND due <= endOfWeek() ORDER BY due ASC

# 最近创建的 Bug
issuetype = Bug AND created >= -7d ORDER BY created DESC

# 当前 Sprint
sprint in openSprints() AND assignee = currentUser()
```

## 常用 Confluence CQL

```
# 搜索页面
type=page AND space.key=SOP AND title~"API"

# 全文搜索
text~"部署文档"

# 当前用户创建的
creator=currentUser() AND lastModified >= "2026-01-01"
```

## 常用 Gmail 搜索语法

```
from:boss@company.com subject:周报
is:unread newer_than:7d
has:attachment from:client@example.com
```

## office_link 代理（高级用法）

对于上述工具未封装的 API，可使用 `office_link` 的 `proxy` action 直接调用：

```
office_link:
  action: proxy
  account_id: "apn_xxx"
  method: "GET"
  url: "https://slack.com/api/conversations.history"
  params: { "channel": "C01234567", "limit": 10 }
```

适用于 Slack、Discord、Zoom、Google Sheets 等尚未封装专用工具的平台。

## MorphixAI API 端点参考

| 用途 | 端点 | 方法 |
|------|------|------|
| 认证检查 | `/auth/check` | GET |
| 已链接账号列表 | `/pipedream/accounts` | GET |
| 账号详情 | `/pipedream/accounts/:accountId` | GET |
| 可连接应用列表 | `/pipedream/apps` | GET |
| 生成 OAuth 链接 | `/pipedream/connect-token` | POST |
| 通用代理 | `/pipedream/proxy` | POST |

### 错误码

| HTTP | errorCode | 说明 |
|------|-----------|------|
| 401 | `INVALID_API_KEY` | Key 不存在或格式错误 |
| 401 | `API_KEY_REVOKED` | Key 已被撤销 |
| 401 | `API_KEY_EXPIRED` | Key 已过期 |
| 403 | `API_KEY_SCOPE_DENIED` | Key 无权访问（缺少 scope） |
