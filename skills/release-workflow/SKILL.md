---
name: release-workflow
description: 版本发布 SOP 执行器。当用户提到 release、publish、version bump、tag、changelog 或 deployment 时激活。
metadata:
  openclaw:
    emoji: "🚀"
    requires:
      bins: [git]
      env: [MORPHIXAI_API_KEY]
---

# 发布流程

严格按顺序执行，绝不跳过任何步骤。任何步骤失败立即停止并报告。

## 版本号规则（semver）

- patch (X.Y.**Z+1**)：bug 修复，无 API 变更
- minor (X.**Y+1**.0)：新功能，向后兼容
- major (**X+1**.0.0)：破坏性变更

## 发布步骤

### 1. 预检查

使用 `mx_gitlab` 工具执行所有检查：

```
1. mx_gitlab: action: list_pipelines, project: "<ID>", per_page: 1
     → 目标分支最近 pipeline 必须为 "success"
2. mx_gitlab: action: list_merge_requests, project: "<ID>", state: "opened"
     → 确认无未合并的相关 MR
3. mx_jira: action: search_issues
     jql: "project = <KEY> AND priority in (Highest, High) AND status != Done"
     → 确认无 P0/P1 未关闭 Issue
```

任何检查失败，立即报告并停止，不得继续。

### 2. 版本号更新

在以下所有位置更新版本号：
- `package.json`（root 和 workspace packages，如果是 monorepo）
- 任何引用版本号的 `version.ts` 或常量文件
- Lock 文件：版本改完后运行 `pnpm install`

Commit message: `release: bump version to vX.Y.Z`

### 3. Changelog

在 `CHANGELOG.md` 文件顶部更新：

```markdown
## [X.Y.Z] - YYYY-MM-DD

### Added
- 新功能描述

### Fixed
- Bug 修复描述

### Changed
- 行为变更描述

### Removed
- 移除功能描述（如有）
```

仅包含用户可见的变更。内部重构无需记录。

Commit message: `release: update changelog for vX.Y.Z`

### 4. 创建 MR

使用 `mx_gitlab` 工具创建发布 MR：

```
mx_gitlab:
  action: create_merge_request
  project: "<ID>"
  source_branch: "release/vX.Y.Z"
  target_branch: "main"
  title: "release: vX.Y.Z"
  description: "<Changelog 内容摘要>"
```

等待 review 和 CI 通过。可用以下命令检查：

```
mx_gitlab:
  action: list_pipelines
  project: "<ID>"
  per_page: 1
```

### 5. Tag 和发布

MR 合并到 main 后，使用本地 git 操作：

```bash
git checkout main && git pull
git tag vX.Y.Z
git push origin vX.Y.Z
```

验证 CI/CD pipeline 触发了 publish job：

```
mx_gitlab:
  action: list_pipelines
  project: "<ID>"
  per_page: 1
```

### 6. 发布后

- 确认包已发布（npm、registry 等）
- 通知团队（通过邮件或 IM），附版本号和 changelog 摘要：
  ```
  mx_outlook:
    action: send_mail
    subject: "Release vX.Y.Z 已发布"
    to: ["team@company.com"]
    body: "<Changelog 摘要>"
  ```
- 关闭相关 Jira Issue：
  ```
  mx_jira:
    action: search_issues
    jql: "fixVersion = vX.Y.Z AND status != Done"
  → 对每个 Issue:
  mx_jira:
    action: transition_issue
    issue_key: "XXX-123"
    target_status: "Done"
  ```

## 中止流程

发布过程中出错：
1. 绝不 force push 或删除 tag
2. 向用户报告错误
3. 建议回滚步骤（如需）
