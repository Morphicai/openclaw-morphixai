# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] - 2026-03-02

### Added
- 12 office tools: `mx_gitlab`, `mx_github`, `mx_jira`, `mx_confluence`, `mx_outlook`, `mx_outlook_calendar`, `mx_ms_todo`, `mx_gmail`, `mx_google_tasks`, `mx_notion`, `mx_figma`, `mx_link`
- 14 skill workflows covering GitLab, GitHub, Jira, Confluence, Outlook, Gmail, Notion, Figma, and more
- MorphixAI unified API proxy client (`BaibianClient`)
- Universal account management via `mx_link` tool (list, connect, proxy)
- `daily-standup` skill — aggregates GitLab MRs, Jira issues, and unread email
- TypeBox schemas for all tool inputs
- Vitest test suite covering client and integration tests

### Changed
- Migrated API domain from `baibian.app` to `morphix.app`
- Renamed package to `openclaw-morphixai`

## [0.1.0] - 2026-01-29

### Added
- Initial release with core GitLab, Jira, and MorphixAI proxy support
