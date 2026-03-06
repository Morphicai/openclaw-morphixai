# Skills 参考

## 架构

Skills 随插件自动安装，无需手动复制：

```
openclaw plugins install openclaw-morphixai
  └── skills/                    ← 插件内置 14 个 skill
      ├── gitlab-workflow/
      ├── github-workflow/
      ├── jira-workflow/
      ├── daily-standup/
      ├── gmail/
      ├── outlook-email/
      ├── outlook-calendar/
      ├── ms-todo/
      ├── google-tasks/
      ├── notion/
      ├── confluence/
      ├── figma/
      ├── mx-link/
      └── pipedream-proxy/
```

用户自定义 skill 放在 `~/.openclaw/skills/`，名称冲突时用户 skill 优先。

## Git 类 Skills

### gitlab-workflow

**用途**: GitLab 操作，强制执行团队规范。

**依赖**: `mx_gitlab` 工具 + MorphixAI API Key

**功能**:
- 创建 MR 并强制执行命名规范
- 代码审查，包含完整检查清单
- CI/CD 状态监控
- 分支管理

**示例提示**:
- "创建一个 MR 从 feature/JIRA-123-auth 到 develop"
- "review MR #42"
- "查看 CI 状态"

### github-workflow

**用途**: GitHub 操作，PR / Actions / Review 工作流。

**依赖**: `mx_github` 工具 + MorphixAI API Key

**示例提示**:
- "列出我的 open PR"
- "创建 PR 从 feature 分支到 main"
- "查看 GitHub Actions 状态"

## 项目管理类 Skills

### jira-workflow

**用途**: Jira Issue 管理和状态流转。

**依赖**: `mx_jira` 工具

**示例提示**:
- "列出分配给我的 Jira Issue"
- "将 PROJ-123 移到 In Progress"
- "创建一个 Bug Issue"

### notion

**用途**: Notion 知识库管理。

**依赖**: `mx_notion` 工具

**示例提示**:
- "搜索 Notion 中的会议纪要"
- "创建一个新页面"

### confluence

**用途**: Confluence Cloud 文档管理。

**依赖**: `mx_confluence` 工具

**示例提示**:
- "搜索 Confluence 上的技术文档"
- "查看某个空间的页面列表"

## 邮件和日历类 Skills

### gmail

**依赖**: `mx_gmail` 工具

**示例**: "查看未读邮件"、"发送邮件给 xx@example.com"

### outlook-email

**依赖**: `mx_outlook` 工具

**示例**: "查看 Outlook 未读邮件"、"搜索来自 xx 的邮件"

### outlook-calendar

**依赖**: `mx_outlook_calendar` 工具

**示例**: "查看今天的日程"、"创建一个会议"

### ms-todo

**依赖**: `mx_ms_todo` 工具

**示例**: "列出我的待办任务"、"创建一个新任务"

### google-tasks

**依赖**: `mx_google_tasks` 工具

**示例**: "查看 Google Tasks"、"添加一个任务"

## 设计类 Skills

### figma

**依赖**: `mx_figma` 工具

**示例**: "查看 Figma 项目列表"、"获取设计文件的组件"

## 聚合类 Skills

### daily-standup

**用途**: 早报聚合器，并行汇总多个来源。

**功能**:
- 并行查询 GitLab/GitHub MR、Jira Issue、未读邮件
- 简洁格式化摘要
- 优先级建议

**示例**: "standup"、"早报"、"今天有什么要处理的"

### mx-link

**用途**: 管理 MorphixAI 第三方账号链接。

**示例**: "查看我链接了哪些账号"

### pipedream-proxy

**用途**: 通过 Pipedream 统一管理 API 凭据（可选）。

**示例**: 配置后所有 API 请求自动通过 Pipedream 代理。

## 创建自定义 Skills

```bash
mkdir -p ~/.openclaw/skills/my-skill
```

最小 `SKILL.md`:

```markdown
---
name: my-skill
description: |
  此 skill 何时激活的单行描述。
metadata:
  openclaw:
    emoji: "✨"
    requires:
      env: [REQUIRED_ENV_VAR]
---

# My Skill

关于如何使用此 skill 的 agent 指令。

## 命令

可用命令及其用法...

## 规则

要遵循的约束和规范...
```
