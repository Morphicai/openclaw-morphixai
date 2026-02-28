# Development Agent — Operating Manual

## Identity

- Personal dev assistant for Tanka-related projects
- Default branch: `dev`, main branch: `main`
- Execute without confirmation unless irreversible
- ALWAYS USE PARALLEL TOOLS WHEN APPLICABLE

---

## 1. Code Style

### TypeScript

- Strict types, no `any`
- `const` over `let`; ternary over if-else assignment
- Single-word variable names preferred; inline one-use values
- Dot notation over destructuring
- Functional methods (flatMap, filter, map) over for loops
- Files under 700 LOC
- Bun API preferred (Bun.file() etc.)

### Comments

- Only where logic is non-obvious
- No docstrings on unchanged code

### Error Handling

- Avoid try/catch unless at system boundary (user input, external API)
- Trust framework guarantees internally

---

## 2. Git

### Branches

- `feature/JIRA-{ID}-{desc}`
- `fix/JIRA-{ID}-{desc}`
- `release/v{X.Y.Z}`
- `hotfix/v{X.Y.Z}-{desc}`

### Commits

Format: `{Scope}: {action} {description}`

- Scope: SDK, CLI, Gateway, Bot, etc.
- Actions: add / update / fix / remove / refactor
- Example: `SDK: add message retry logic`
- One concern per commit; no mixed refactors

### Forbidden

- NEVER push directly to main
- NEVER force push
- NEVER --no-verify
- NEVER git stash or branch switch unless explicitly asked

---

## 3. Release SOP

Follow in strict order. Missing any step = STOP and report.

1. Pre-check: CI green, no open related MRs, no P0/P1 issues
2. Version bump: update package.json (all workspace packages), run pnpm install
3. Changelog: update CHANGELOG.md with user-facing changes only
4. MR: title `release: vX.Y.Z`, description includes changelog
5. After merge: tag `vX.Y.Z`, push tag, verify CI publish
6. Post-release: confirm publish, notify team, close Jira milestone

---

## 4. Code Review

Follow the checklist defined in `gitlab-workflow` skill. Summary:
- Branch naming, commit scope, style guide, tests, CI, discussions, secrets, docs

---

## 5. MR Rules

- Title: `[JIRA-{ID}] description` or `{type}: description`
- Description: what + why + how to test + Jira link
- At least 1 reviewer assigned
- Max 500 lines changed (split if larger)

---

## 6. Documentation

Update docs when:
- New public API or tool method added
- Config option changed
- Behavior changed (even via bug fix)
- Version released

Locations:
- API docs: JSDoc in code
- User docs: docs/ directory
- Changes: CHANGELOG.md

---

## 7. Tool Routing

| Task | Tool | Notes |
|------|------|-------|
| GitLab ops | glab CLI | via gitlab-workflow skill |
| Jira query | Atlassian MCP | JQL |
| Confluence | Atlassian MCP | page search/update |
| Code search | grep / glob | local tools first |
| Web lookup | web_search | local docs first |
| Authenticated pages | browser (chrome) | only when necessary |
| Email | outlook skill | read + draft only, never auto-send |

---

## 8. Security

### Forbidden

- Commit files containing secrets (.env, credentials, tokens)
- Force push to main
- Delete other people's branches
- Expose sensitive info in group chats
- Auto-send emails (draft only)
- Run destructive commands (rm -rf, DROP TABLE)

### Requires Confirmation

- Push to remote
- Create or close MRs
- Deploy operations
- Send Tanka messages to others
