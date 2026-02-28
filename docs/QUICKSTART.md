# OpenClaw Office — 快速开始

5 分钟配置你的个人办公 AI 助手。

## 前置条件

- Node.js >= 18
- 已安装 OpenClaw (`npm i -g openclaw@latest`)
- 已安装 `glab` CLI (用于 GitLab 功能)

## 1. 安装 Skills

```bash
# 方式 A: 直接复制
cp -r packages/openclaw-office/skills/* ~/.openclaw/skills/

# 方式 B: 使用安装脚本
cd packages/openclaw-office && node index.js install
```

## 2. 复制模板

```bash
# Agent 人格和规则
cp templates/SOUL.md ~/.openclaw/agents/main/agent/SOUL.md
cp templates/AGENTS.md ~/.openclaw/agents/main/agent/AGENTS.md

# 配置文件（使用前需要编辑！）
cp templates/openclaw.personal.json ~/.openclaw/openclaw.json
```

## 3. 设置环境变量

```bash
cp templates/.env.example ~/.openclaw/.env
# 编辑 ~/.openclaw/.env 填入你的实际 token
```

**方式 A: 本地 Token** (默认)

| Token | 如何获取 |
|-------|-----------|
| `GITLAB_TOKEN` | GitLab → Settings → Access Tokens → 创建并赋予 `api` 权限 |
| `JIRA_API_TOKEN` | https://id.atlassian.com/manage-profile/security/api-tokens |
| `OUTLOOK_CLIENT_ID` | Azure Portal → App registrations → 创建 |

**方式 B: Pipedream 代理** (推荐团队使用)

参见 [pipedream-proxy skill](../skills/pipedream-proxy/SKILL.md) 统一凭据管理：
- 只需 1 个 token: `PIPEDREAM_TOKEN`
- OAuth 自动刷新
- 审计日志
- 团队共享

```bash
# ~/.openclaw/.env 使用 Pipedream
PIPEDREAM_TOKEN=your-pipedream-api-key
PIPEDREAM_PROJECT_ID=prj_abc123
```

## 4. 编辑配置

打开 `~/.openclaw/openclaw.json` 修改：

| 字段 | 位置 | 修改为 |
|-------|----------|-----------|
| `email` | channels.tanka.email | 你的 Tanka 登录邮箱 |
| `env` | channels.tanka.env | Tanka 服务器环境: `dev-sg`, `test-sg`, `uat-sg`, 或 `sd-or` |
| `model` | agents.defaults.model | LLM 模型，默认 `claude-sonnet-4.5` |

## 5. 安装浏览器扩展 (可选)

用于访问已登录的网页：

```bash
openclaw browser extension install
```

然后在 `chrome://extensions` 加载解压的扩展。

## 6. 启动

```bash
openclaw gateway start
```

## 7. 验证

在 Tanka 私聊中测试：
- "standup" → 应该返回每日简报
- "查看 GitLab MR" → 应该列出打开的 MR
- "帮我创建一个 memo" → 应该创建一个 Tanka memo

## 包含内容

### Skills

| Skill | 用途 |
|-------|---------|
| `gitlab-workflow` | MR/CI/Review，包含分支和提交规范 |
| `daily-standup` | 早报聚合器，汇总 GitLab + Jira + 邮件 |
| `release-workflow` | 版本发布 SOP，带预检查 |

### 模板

| 文件 | 用途 |
|------|---------|
| `openclaw.personal.json` | 单人配置，默认安全加固 |
| `AGENTS.md` | 开发 SOP：代码风格、git 规则、发布流程 |
| `SOUL.md` | 精简中文助手人格 |
| `.env.example` | 环境变量模板 |

### 安全默认配置

- DM: 配对模式（仅自己）
- 群组: 需要 @提及（仅自己）
- 网关: 仅本地回环
- 浏览器: 禁用 JS eval
- 秘钥: 日志脱敏
- mDNS: 禁用

## 自定义

### 添加自己的 Skill

```bash
mkdir -p ~/.openclaw/skills/my-skill
cat > ~/.openclaw/skills/my-skill/SKILL.md << 'SKILLEOF'
---
name: my-skill
description: 这个 skill 的作用。
metadata:
  openclaw:
    emoji: "✨"
---

# My Skill

给 agent 的指令...
SKILLEOF
```

### 修改团队规范

编辑 `~/.openclaw/agents/main/agent/AGENTS.md`:
- 第 2 节 (Git) 修改分支/提交规则
- 第 3 节 (Release SOP) 修改发布步骤
- 第 4 节 (Code Review) 修改审查清单
