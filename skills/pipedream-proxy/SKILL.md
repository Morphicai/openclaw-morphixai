---
name: pipedream-proxy
description: "[已废弃] 请使用 office-link skill。Pipedream 代理功能已整合到 MorphixAI (mx_link) 中。"
metadata:
  openclaw:
    emoji: "🔐"
    deprecated: true
---

# Pipedream Proxy — 已废弃

> **此 skill 已废弃。** 所有功能已迁移到 `office-link` skill（基于 MorphixAI/Baibian）。

## 迁移指南

| 原 Pipedream 方案 | 新 MorphixAI 方案 |
|-------------------|-------------------|
| `PIPEDREAM_TOKEN` + `PIPEDREAM_PROJECT_ID` | `MORPHIXAI_API_KEY` |
| Pipedream Connect API Proxy | `mx_link: action: proxy` |
| Pipedream Connected Accounts | `mx_link: action: list_accounts` |
| 手动构建 proxy 请求 | 使用 `mx_*` 专用工具（自动处理 URL/认证/格式） |

## 为什么迁移

- **统一入口**：只需 1 个 API Key，不再需要 Pipedream Token + Project ID
- **专用工具**：GitLab/GitHub/Jira 等有 `mx_*` 封装，无需手写 API URL
- **自动格式转换**：如 Jira Markdown→ADF 转换由工具自动完成
- **简化配置**：从 3+ 个环境变量减少到 1 个

## 参考

- 新方案文档：`skills/office-link/SKILL.md`
- 工具参考：`skills/TOOLS.md`
