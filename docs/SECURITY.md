# 安全配置指南

## 凭据管理策略

| 方案 | 存储 | 自动刷新 | 审计日志 | 团队共享 | 使用场景 |
|----------|---------|--------------|------------|--------------|----------|
| **本地 .env** | `~/.openclaw/.env` | ❌ 手动 | ❌ | ❌ | 个人单用户 |
| **Pipedream Connect** | Pipedream 云端 (SOC 2) | ✅ OAuth | ✅ 完整 | ✅ 原生支持 | 团队、OAuth 服务 |
| **ClawProxy** | 自托管代理 | ✅ | ⚠️ 自定义 | ⚠️ 自定义 | 企业自托管 |

**默认**: 本包使用本地 .env 以保持简单。

**迁移路径**: 从 .env 开始 → 当需要团队协作或 OAuth 自动刷新时迁移到 [Pipedream](../skills/pipedream-proxy/SKILL.md)。

**Pipedream 的安全优势**:
- 单一 token 暴露（.env 中只有 `PIPEDREAM_TOKEN`）
- 即时撤销（撤销 1 个 token 而非 N 个服务 token）
- OAuth 权限范围强制（无需过度授权的个人访问 token）
- 完整审计轨迹，带请求时间戳

## 默认安全态势

本包默认采用**限制性优先**配置。

### 访问控制

| 层级 | 设置 | 效果 |
|-------|---------|--------|
| DM | `dmPolicy: "pairing"` + 空 allowFrom | 只有 bot 所有者可以 DM |
| 群组 | `requireMention: true` + 空 allowList | 只有 bot 所有者可以 @触发 |
| 网关 | `bind: "loopback"` | 局域网无法访问 |
| 认证 | `mode: "token"` (自动生成) | 所有请求需要 token |

### 沙箱

| 设置 | 值 | 效果 |
|---------|-------|--------|
| `sandbox.mode` | `"all"` | 所有会话沙箱化 |
| `workspaceAccess` | `"rw"` | 仅在工作空间内读写 |
| `evaluateEnabled` | `false` | 浏览器中不执行 JS |

### 日志

- `redactSensitive: "tools"` — 工具输出脱敏
- `redactPatterns` — 自定义 token 模式从日志中隐藏
- `mdns: "off"` — 无服务广播

## 开放访问

### 允许特定人员 DM

```json
{
  "dmPolicy": "allowlist",
  "allowFrom": ["user-id-1", "user-id-2"]
}
```

### 允许特定人员在群组中 @触发

```json
{
  "groupSenderAllowList": ["user-id-1", "user-id-2"]
}
```

### 仅允许特定群组

```json
{
  "groupPolicy": "allowlist",
  "groupAllowFrom": ["group-id-1", "group-id-2"]
}
```

## 浏览器安全

配置了两个配置文件：

| 配置文件 | 用途 | 风险级别 |
|---------|---------|------------|
| `openclaw` | 隔离自动化 | 低 — 无登录状态 |
| `chrome` | 扩展中继，复用登录 | 高 — 完整会话访问 |

最佳实践：
1. 默认使用 `openclaw` 配置文件进行自动化
2. 仅在明确需要登录时使用 `chrome` 配置文件
3. 扩展中继需要手动点击激活 — 永不自动连接
4. 使用后断开扩展
5. `evaluateEnabled: false` 防止任意 JS 注入

## 审计

```bash
# 运行安全审计
openclaw security audit

# 深度审计并修复
openclaw security audit --deep --fix

# 检查文件权限
ls -la ~/.openclaw/
# 预期: drwx------ (700)

ls -la ~/.openclaw/openclaw.json
# 预期: -rw------- (600)
```

## 秘钥管理

永远不要在配置中硬编码 token。使用环境变量：

```json
{
  "env": { "GITLAB_TOKEN": "${GITLAB_TOKEN}" }
}
```

将实际值存储在 `~/.openclaw/.env` 中，权限设为 `chmod 600`。
