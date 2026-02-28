# 使用指南

## 个人使用（你自己）

### 安装

```bash
# 1. 进入项目目录
cd /Users/admin/www/mini-tanka

# 2. 一键安装 skills
cd packages/openclaw-office && node index.js install

# 3. 复制配置
cp templates/SOUL.md ~/.openclaw/agents/main/agent/
cp templates/AGENTS.md ~/.openclaw/agents/main/agent/
cp templates/openclaw.personal.json ~/.openclaw/openclaw.json

# 4. 设置环境变量
cat > ~/.openclaw/.env << 'EOF'
GITLAB_TOKEN=your-gitlab-token-here
JIRA_API_TOKEN=your-jira-token-here
OUTLOOK_CLIENT_ID=your-outlook-client-id-here
EOF
chmod 600 ~/.openclaw/.env

# 5. 编辑 openclaw.json
#    修改 channels.tanka.email 为你的 Tanka 邮箱

# 6. 启动
openclaw gateway start
```

### 日常使用

#### 私聊（DM）

直接在 Tanka 给自己发消息：

| 场景 | 命令示例 | 效果 |
|------|---------|------|
| 每日早报 | `standup` 或 `早报` | 聚合 GitLab + Jira + Email |
| GitLab MR | `查看待合并的 MR` | 列出 open MRs |
| GitLab CI | `CI 状态如何` | 显示 pipeline 状态 |
| 创建 MR | `从 feature/JIRA-123-auth 创建 MR 到 develop` | 自动按规范创建 |
| Review MR | `review MR #42` | 按 checklist 检查 |
| 创建 Memo | `创建 memo 标题"周会纪要"内容"..."` | Tanka memo |
| 发版 | `发布 v1.2.0` | 按 SOP 逐步引导 |
| 截图 | `用浏览器打开 gitlab.com/xxx 截图` | 自动截图 |

#### 群组（@提及）

在 Tanka 群里 @自己的 bot：

```
@bot 查下这个项目的 CI 状态
@bot 帮我看看 MR #123 符不符合规范
@bot 今天有什么要处理的
```

## 分享给他人

### 方式 1：直接分享包

```bash
# 1. 打包
cd /Users/admin/www/mini-tanka
tar -czf openclaw-office.tar.gz packages/openclaw-office/

# 2. 发送给同事

# 3. 同事解压并安装
tar -xzf openclaw-office.tar.gz
cd packages/openclaw-office
node index.js install
cp templates/*.json ~/.openclaw/
cp templates/*.md ~/.openclaw/agents/main/agent/
```

### 方式 2：Git 仓库

```bash
# 1. 创建单独仓库
mkdir -p ~/openclaw-office-skills
cd ~/openclaw-office-skills
cp -r /Users/admin/www/mini-tanka/packages/openclaw-office/* .
git init && git add . && git commit -m "init"
git remote add origin <your-repo-url>
git push -u origin main

# 2. 同事克隆
git clone <your-repo-url>
cd openclaw-office-skills
node index.js install
# ... 复制配置
```

### 方式 3：发布到 npm（推荐）

```bash
# 1. 修改 package.json
cd packages/openclaw-office
# 改 name 为 @your-org/openclaw-office

# 2. 发布到私有 registry
npm publish --registry=https://your-npm-registry.com

# 3. 同事安装
npm i -g @your-org/openclaw-office
openclaw-office install
```

## 他人快速配置

收到 package 后，5 分钟配置完成：

```bash
# 1. 安装 skills
cd openclaw-office && node index.js install

# 2. 复制模板
cp templates/SOUL.md ~/.openclaw/agents/main/agent/
cp templates/AGENTS.md ~/.openclaw/agents/main/agent/
cp templates/openclaw.personal.json ~/.openclaw/openclaw.json

# 3. 编辑配置（只需改 3 个地方）
vim ~/.openclaw/openclaw.json
# - channels.tanka.email → 改为自己的 Tanka 邮箱
# - channels.tanka.env → 改为自己的环境（dev-sg / test-sg / uat-sg / sd-or）
# - agents.defaults.model → 可选，默认 claude-sonnet-4.5

# 4. 设置 Token
cat > ~/.openclaw/.env << 'EOF'
GITLAB_TOKEN=<your-gitlab-token>
JIRA_API_TOKEN=<your-jira-token>
EOF
chmod 600 ~/.openclaw/.env

# 5. 启动
openclaw gateway start
```

## 常见问题

### Q1: 如何自定义团队规范？

**A**: 编辑 `~/.openclaw/agents/main/agent/AGENTS.md`：

- Section 2 (Git) → 修改分支命名和 Commit 格式
- Section 3 (Release SOP) → 调整发版流程
- Section 5 (MR Rules) → 改 MR 描述格式

### Q2: 如何禁用某个 Skill？

**A**: 编辑 `~/.openclaw/openclaw.json`：

```json
{
  "skills": {
    "entries": {
      "gitlab-workflow": { "enabled": false }  // 禁用
    }
  }
}
```

### Q3: 如何让 Agent 更详细回复？

**A**: 编辑 `~/.openclaw/agents/main/agent/SOUL.md`：

删除或注释掉"极度精简"相关规则。

### Q4: 如何添加自己的 Skill？

**A**:
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

Instructions...
EOF
```

### Q5: 如何只在某个项目使用特定 Skill？

**A**: 将 skill 放到项目 workspace：

```bash
mkdir -p ~/www/my-project/skills/project-specific
# 创建 SKILL.md
```

项目 skills 优先级高于全局 skills。

### Q6: 浏览器扩展如何使用？

**A**:
```bash
# 安装
openclaw browser extension install

# Chrome 加载
chrome://extensions → 开发者模式 → 加载已解压的扩展程序
路径：~/.openclaw/browser-extension/

# 使用
1. 打开要控制的标签页
2. 点击扩展图标激活
3. 在 Tanka 发命令："用浏览器打开 <url> 并截图"
4. 用完点击扩展图标断开
```

### Q7: 如何查看 Agent 使用了哪些工具？

**A**:
```bash
# 查看上下文
openclaw context list

# 查看工具调用日志
tail -f ~/.openclaw/logs/openclaw-$(date +%Y-%m-%d).log
```

### Q8: 群组中其他人能触发吗？

**A**: 默认配置只有你能触发（`groupSenderAllowList: []`）。

如需开放给特定人：
```json
{
  "channels": {
    "tanka": {
      "groupSenderAllowList": ["user-id-1", "user-id-2"]
    }
  }
}
```

## 高级用法

### Sub-Agent 并行查询

```
你: 同时帮我查：
    1. GitLab 上所有未合并的 MR
    2. Jira 上我的本周到期 Issue
    3. 今天的未读邮件

AI: [spawn 3 个 sub-agent 并行查询，完成后汇总]
```

### 浏览器自动化

```
你: 打开 GitLab MR #123，检查 CI 状态，截图发我

AI: [用 chrome profile 打开，等待加载，截图]
```

### 跨工具编排

```
你: 从 Jira Issue PROJ-456 创建对应的 GitLab MR

AI: [查 Jira Issue → 提取信息 → 创建 Git 分支 → 创建 MR]
```

## 最佳实践

1. **早报习惯**：每天第一件事在 Tanka 发 `standup`
2. **MR 创建**：用 Agent 创建确保规范一致
3. **发布流程**：用 `release-workflow` 避免遗漏步骤
4. **Review 自动化**：`review MR #xxx` 快速检查合规性
5. **群组使用**：在团队群 @bot 让大家看到操作透明性
