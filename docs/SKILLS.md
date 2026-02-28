# Skills 参考

## 架构

```
~/.openclaw/skills/           ← 共享 skills (本包安装在这里)
  ├── gitlab-workflow/
  ├── daily-standup/
  └── release-workflow/

~/www/mini-tanka/packages/
  └── clawdbot-tanka/skills/  ← Tanka 插件 skills (与插件打包)
      ├── tanka-memo/
      ├── tanka-chat/
      ├── tanka-contact/
      └── tanka-media/
```

工作空间 skills 在名称冲突时会覆盖共享 skills。

## Skill: gitlab-workflow

**用途**: GitLab 操作，强制执行团队规范。

**依赖**: `glab` CLI + `GITLAB_TOKEN` 环境变量

**功能**:
- 创建 MR 并强制执行命名规范
- 代码审查，包含完整检查清单
- CI/CD 状态监控
- 分支管理

**示例提示**:
- "创建一个 MR 从 feature/JIRA-123-auth 到 develop"
- "review MR #42"
- "查看 CI 状态"

## Skill: daily-standup

**用途**: 早报简报，汇总多个来源。

**依赖**: GitLab skill + Jira MCP + Outlook skill (任何缺失时优雅降级)

**功能**:
- 并行查询 GitLab MRs、Jira issues、未读邮件
- 简洁格式化摘要
- 优先级建议

**示例提示**:
- "standup"
- "早报"
- "今天有什么要处理的"

## Skill: release-workflow

**用途**: 逐步强制执行发布 SOP。

**依赖**: `git` + `glab` CLI

**功能**:
- 发布前验证 (CI、MRs、issues)
- 引导版本升级
- Changelog 生成
- Tag 创建和发布验证

**示例提示**:
- "发布 v1.2.0"
- "准备 release"
- "bump patch version"

## Tanka 插件 Skills

这些来自 `@clawdbot/tanka`，需要启用 Tanka 频道。

| Skill | 工具 | 默认 |
|-------|------|---------|
| tanka-memo | `tanka_memo` | 启用 |
| tanka-chat | `tanka_chat` | 启用 |
| tanka-contact | `tanka_contact` | 启用 |
| tanka-media | `tanka_media` | 禁用 (选择加入) |

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
      bins: [required-cli-tool]
      env: [REQUIRED_ENV_VAR]
---

# My Skill

关于如何使用此 skill 的 agent 指令。

## 命令

可用命令及其用法...

## 规则

要遵循的约束和规范...
```
