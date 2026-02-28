# OpenClaw Office 文档

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

## 📋 Skills 列表

| Skill | 说明 | 依赖 |
|-------|------|------|
| **gitlab-workflow** | GitLab MR/CI/Review，包含分支命名和 commit 规范 | glab CLI, GITLAB_TOKEN |
| **daily-standup** | 早报聚合器，汇总 GitLab + Jira + 邮件 | glab CLI (必需), Atlassian MCP (可选) |
| **release-workflow** | 逐步发布 SOP，带预检查 | git, glab CLI |
| **pipedream-proxy** | 通过 Pipedream 统一管理 API 凭据（可选） | PIPEDREAM_TOKEN |

## ✅ 可用性检查清单

让 OpenClaw Office 可用需要：

### 必需
1. ✅ Skills 文件 (已包含 4 个)
2. ✅ 模板文件 (已包含 4 个)
3. ❌ **安装 glab CLI**
   ```bash
   # macOS
   brew install glab

   # Linux/Windows
   # 下载: https://gitlab.com/gitlab-org/cli/-/releases
   ```

4. ❌ **获取 GitLab Token**
   - GitLab → Settings → Access Tokens
   - Scope: `api`

5. ❌ **配置环境变量**
   ```bash
   cp templates/.env.example ~/.openclaw/.env
   # 编辑填入实际 token
   ```

6. ❌ **安装 Skills 和模板**
   ```bash
   cp -r skills/* ~/.openclaw/skills/
   cp templates/SOUL.md ~/.openclaw/agents/main/agent/SOUL.md
   cp templates/AGENTS.md ~/.openclaw/agents/main/agent/AGENTS.md
   cp templates/openclaw.personal.json ~/.openclaw/openclaw.json
   ```

### 可选（增强功能）
- Atlassian MCP (Jira/Confluence 集成)
- Outlook 配置 (邮件功能)
- Pipedream (统一凭据管理)

## 📦 包含内容统计

| 类型 | 数量 |
|------|------|
| Skills | 4 |
| Templates | 4 |
| 文档 | 5 |
| 工具脚本 | 3 (package.json, index.js, verify.sh) |

## 🗂️ 归档文档

ClawSkillHub 相关文档（未来实现）已移至 `../backup/clawskillhub-docs/`:
- 平台架构设计
- 实施路线图
- CLI 安装器设计
- 技术决策记录
- 分层架构
- 实施指南

## 🔗 快速链接

- **主 README**: [../README.md](../README.md)
- **验证脚本**: [../verify.sh](../verify.sh)
- **安装脚本**: [../index.js](../index.js)
