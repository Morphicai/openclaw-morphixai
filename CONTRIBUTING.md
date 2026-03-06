# Contributing to openclaw-morphixai

Thank you for your interest in contributing! / 感谢你的贡献意愿！

**[English](#english) | [中文](#中文)**

---

## English

### Getting Started

1. **Fork** the repository and clone your fork
2. Install dependencies:
   ```bash
   pnpm install
   ```
3. Build all packages:
   ```bash
   pnpm build
   ```

### Project Structure

This is a `pnpm workspace` monorepo:

```
packages/
├── core/                  # @morphixai/core — shared API clients, schemas, MorphixClient
│   └── src/
│       ├── schemas/       # TypeBox schemas (e.g. jira-schema.ts)
│       ├── app-clients/   # Platform API clients (e.g. jira-client.ts)
│       └── morphix-client.ts
├── openclaw-plugin/       # openclaw-morphixai — OpenClaw plugin adapter
│   └── src/
│       └── tools/         # Tool implementations (e.g. jira.ts)
│   └── skills/            # Skill prompts (e.g. jira-workflow/SKILL.md)
├── mcp-server/            # @morphixai/mcp-server — MCP server adapter
└── openclaw-morphix/      # Legacy redirect → openclaw-morphixai
```

### Development Workflow

- `pnpm build` — build all packages
- `pnpm test` — run all tests
- `pnpm -F openclaw-morphixai build` — build OpenClaw plugin only
- `pnpm -F @morphixai/core build` — build core only

### Adding a New Tool

1. Create a schema in `packages/core/src/schemas/<name>-schema.ts`
2. Create an app client in `packages/core/src/app-clients/<name>-client.ts`
3. Implement the tool in `packages/openclaw-plugin/src/tools/<name>.ts`
4. Register the tool in `packages/openclaw-plugin/src/index.ts`
5. Add a skill doc in `packages/openclaw-plugin/skills/<name>/SKILL.md`
6. Add integration tests in `packages/core/test/` or `packages/openclaw-plugin/test/`

### Code Style

- TypeScript strict mode encouraged
- Use `MorphixClient` for all MorphixAI proxy calls — never call third-party APIs directly
- Use `wrapToolExecute` from `_tool-helpers.ts` for consistent error handling
- All tool inputs must be defined with TypeBox schemas

### Submitting a PR

1. Create a feature branch: `git checkout -b feat/your-feature`
2. Make your changes and add tests
3. Ensure `pnpm build` and `pnpm test` pass
4. Open a Pull Request against `main`

### Reporting Issues

Please use [GitHub Issues](https://github.com/Morphicai/openclaw-morphixai/issues) to report bugs or request features. Include:
- OpenClaw version
- Node.js version
- Steps to reproduce
- Expected vs actual behavior

---

## 中文

### 开始开发

1. **Fork** 本仓库并克隆你的 fork
2. 安装依赖：
   ```bash
   pnpm install
   ```
3. 构建所有包：
   ```bash
   pnpm build
   ```

### 项目结构

本项目是 `pnpm workspace` monorepo：

```
packages/
├── core/                  # @morphixai/core — 共享 API 客户端、Schema、MorphixClient
│   └── src/
│       ├── schemas/       # TypeBox schemas（如 jira-schema.ts）
│       ├── app-clients/   # 平台 API 客户端（如 jira-client.ts）
│       └── morphix-client.ts
├── openclaw-plugin/       # openclaw-morphixai — OpenClaw 插件适配层
│   └── src/
│       └── tools/         # 工具实现（如 jira.ts）
│   └── skills/            # Skill 提示词（如 jira-workflow/SKILL.md）
├── mcp-server/            # @morphixai/mcp-server — MCP 服务适配层
└── openclaw-morphix/      # 旧名重定向 → openclaw-morphixai
```

### 开发命令

- `pnpm build` — 构建所有包
- `pnpm test` — 运行所有测试
- `pnpm -F openclaw-morphixai build` — 仅构建 OpenClaw 插件
- `pnpm -F @morphixai/core build` — 仅构建核心

### 新增工具

1. 在 `packages/core/src/schemas/<name>-schema.ts` 创建 schema
2. 在 `packages/core/src/app-clients/<name>-client.ts` 创建平台客户端
3. 在 `packages/openclaw-plugin/src/tools/<name>.ts` 实现工具逻辑
4. 在 `packages/openclaw-plugin/src/index.ts` 注册工具
5. 在 `packages/openclaw-plugin/skills/<name>/SKILL.md` 添加 Skill 文档
6. 在 `packages/core/test/` 或 `packages/openclaw-plugin/test/` 添加测试

### 代码规范

- 鼓励使用 TypeScript strict 模式
- 所有 MorphixAI 代理调用必须通过 `MorphixClient`，禁止直接调用第三方 API
- 使用 `_tool-helpers.ts` 中的 `wrapToolExecute` 保证统一错误处理
- 所有工具输入参数必须用 TypeBox schema 定义

### 提交 PR

1. 创建功能分支：`git checkout -b feat/your-feature`
2. 修改代码并添加测试
3. 确保 `pnpm build` 和 `pnpm test` 通过
4. 向 `main` 分支提交 Pull Request

### 反馈问题

请通过 [GitHub Issues](https://github.com/Morphicai/openclaw-morphixai/issues) 提交 Bug 或功能请求，请附上：
- OpenClaw 版本
- Node.js 版本
- 重现步骤
- 预期行为与实际行为
