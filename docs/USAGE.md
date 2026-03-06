# 使用指南

## 安装

### OpenClaw 用户

```bash
# 安装插件
openclaw plugins install openclaw-morphixai

# 设置 API Key
export MORPHIXAI_API_KEY="mk_your_api_key_here"

# 重启
openclaw gateway restart
```

### MCP 用户（Claude Code / Cursor / Windsurf）

```bash
# Claude Code
claude mcp add morphixai-mcp -- npx -y @morphixai/mcp-server --env MORPHIXAI_API_KEY="mk_your_api_key_here"
```

详见 [QUICKSTART.md](QUICKSTART.md)。

## 日常使用场景

### Git 工作流

| 场景 | 示例 | 效果 |
|------|------|------|
| 查看 MR/PR | `查看待合并的 MR` | 列出 open MRs/PRs |
| 创建 MR/PR | `从 feature/JIRA-123-auth 创建 MR 到 develop` | 按规范自动创建 |
| Review | `review MR #42` | 按 checklist 检查 |
| CI/CD | `CI 状态如何` | 显示 pipeline 状态 |

### 项目管理

| 场景 | 示例 | 效果 |
|------|------|------|
| Jira Issue | `列出分配给我的 Jira Issue` | 查询 Issue 列表 |
| 状态流转 | `将 PROJ-123 移到 In Progress` | Jira 状态变更 |
| Notion 搜索 | `搜索 Notion 中的会议纪要` | 全文搜索 |
| Confluence | `查找 Confluence 上的技术文档` | 页面搜索 |

### 邮件和日历

| 场景 | 示例 | 效果 |
|------|------|------|
| 收件箱 | `查看未读邮件` | 列出 Outlook/Gmail 未读 |
| 发邮件 | `给 xx@example.com 发邮件` | 撰写并发送 |
| 日历 | `查看今天的日程` | 列出 Outlook Calendar 事件 |
| 待办 | `列出我的 To Do 任务` | Microsoft To Do / Google Tasks |

### 每日早报

```
你: standup
AI: [并行查询 GitLab MR + Jira Issue + 未读邮件，汇总报告]
```

### 跨工具编排

```
你: 从 Jira Issue PROJ-456 创建对应的 GitLab MR
AI: [查 Jira Issue → 提取信息 → 创建 Git 分支 → 创建 MR]
```

## 账号管理

使用 `mx_link` 工具管理第三方账号：

```
你: 查看我链接了哪些账号
AI: [调用 mx_link 列出已连接的服务]

你: 帮我连接 GitHub 账号
AI: [引导你到 MorphixAI 连接页面]
```

或直接访问 [MorphixAI Connections](https://morphix.app/connections) 管理。

## 插件管理

```bash
# 查看已安装插件
openclaw plugins list

# 查看插件详情
openclaw plugins info openclaw-morphixai

# 更新插件
openclaw plugins update openclaw-morphixai

# 禁用/启用
openclaw plugins disable openclaw-morphixai
openclaw plugins enable openclaw-morphixai

# 卸载
openclaw plugins uninstall openclaw-morphixai
```

## 常见问题

### Q1: 如何禁用某个 Skill？

编辑 `~/.openclaw/openclaw.json`：

```json
{
  "skills": {
    "entries": {
      "gitlab-workflow": { "enabled": false }
    }
  }
}
```

### Q2: 如何查看工具调用日志？

```bash
tail -f ~/.openclaw/logs/openclaw-$(date +%Y-%m-%d).log
```

### Q3: API Key 放在哪里最安全？

推荐使用环境变量，不要在配置文件中硬编码：

```bash
# ~/.openclaw/.env 或 shell profile
export MORPHIXAI_API_KEY="mk_your_api_key_here"
chmod 600 ~/.openclaw/.env
```

### Q4: 如何添加自己的 Skill？

```bash
mkdir -p ~/.openclaw/skills/my-skill
cat > ~/.openclaw/skills/my-skill/SKILL.md << 'EOF'
---
name: my-skill
description: What this skill does.
metadata:
  openclaw:
    emoji: "✨"
---

# My Skill

Instructions for the agent...
EOF
```

### Q5: 从旧版 openclaw-morphix 迁移？

```bash
openclaw plugins uninstall openclaw-morphix
openclaw plugins install openclaw-morphixai
```

功能完全兼容，无需额外配置。
