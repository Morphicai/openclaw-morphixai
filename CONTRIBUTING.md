# Contributing to openclaw-morphixai

Thank you for your interest in contributing! / 感谢你的贡献意愿！

**[English](#english) | [中文](#中文)**

---

## English

### Getting Started

1. **Fork** the repository and clone your fork
2. Install dependencies:
   ```bash
   npm install
   ```
3. Build the project:
   ```bash
   npm run build
   ```
4. Copy the test environment template and fill in your credentials:
   ```bash
   cp test/.env.example test/.env
   # Edit test/.env with your MORPHIXAI_API_KEY
   ```

### Development Workflow

- `npm run build` — compile TypeScript to `dist/`
- `npm run dev` — watch mode
- `npm test` — run unit tests
- `npm run test:watch` — watch mode tests

### Adding a New Tool

1. Create a schema in `src/schemas/<name>-schema.ts`
2. Create an app client in `src/app-clients/<name>.ts`
3. Implement the tool in `src/tools/<name>.ts`
4. Register the tool in `index.ts`
5. Add a skill doc in `skills/<name>/SKILL.md`
6. Add integration tests in `test/app-clients/<name>.test.ts`

### Code Style

- TypeScript strict mode encouraged
- Use `MorphixClient` for all MorphixAI proxy calls — never call third-party APIs directly
- Use `wrapToolExecute` from `_tool-helpers.ts` for consistent error handling
- All tool inputs must be defined with TypeBox schemas

### Submitting a PR

1. Create a feature branch: `git checkout -b feat/your-feature`
2. Make your changes and add tests
3. Ensure `npm run build` and `npm test` pass
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
   npm install
   ```
3. 构建项目：
   ```bash
   npm run build
   ```
4. 复制测试环境模板并填入你的凭据：
   ```bash
   cp test/.env.example test/.env
   # 编辑 test/.env，填入 MORPHIXAI_API_KEY
   ```

### 开发命令

- `npm run build` — 编译 TypeScript 到 `dist/`
- `npm run dev` — 监听模式
- `npm test` — 运行单元测试
- `npm run test:watch` — 监听模式测试

### 新增工具

1. 在 `src/schemas/<name>-schema.ts` 创建 schema
2. 在 `src/app-clients/<name>.ts` 创建平台客户端
3. 在 `src/tools/<name>.ts` 实现工具逻辑
4. 在 `index.ts` 注册工具
5. 在 `skills/<name>/SKILL.md` 添加 Skill 文档
6. 在 `test/app-clients/<name>.test.ts` 添加集成测试

### 代码规范

- 鼓励使用 TypeScript strict 模式
- 所有 MorphixAI 代理调用必须通过 `MorphixClient`，禁止直接调用第三方 API
- 使用 `_tool-helpers.ts` 中的 `wrapToolExecute` 保证统一错误处理
- 所有工具输入参数必须用 TypeBox schema 定义

### 提交 PR

1. 创建功能分支：`git checkout -b feat/your-feature`
2. 修改代码并添加测试
3. 确保 `npm run build` 和 `npm test` 通过
4. 向 `main` 分支提交 Pull Request

### 反馈问题

请通过 [GitHub Issues](https://github.com/Morphicai/openclaw-morphixai/issues) 提交 Bug 或功能请求，请附上：
- OpenClaw 版本
- Node.js 版本
- 重现步骤
- 预期行为与实际行为
