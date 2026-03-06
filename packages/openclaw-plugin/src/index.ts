import type { OpenClawPluginApi } from "openclaw/plugin-sdk";
import { emptyPluginConfigSchema } from "openclaw/plugin-sdk";
import { registerOfficeLinkTool } from "./tools/link.js";
import { registerOfficeJiraTool } from "./tools/jira.js";
import { registerOfficeGitLabTool } from "./tools/gitlab.js";
import { registerOfficeGitHubTool } from "./tools/github.js";
import { registerOfficeOutlookTool } from "./tools/outlook.js";
import { registerOfficeMsTodoTool } from "./tools/ms-todo.js";
import { registerOfficeGmailTool } from "./tools/gmail.js";
import { registerOfficeGoogleTasksTool } from "./tools/google-tasks.js";
import { registerOfficeNotionTool } from "./tools/notion.js";
import { registerOfficeConfluenceTool } from "./tools/confluence.js";
import { registerOfficeOutlookCalendarTool } from "./tools/outlook-calendar.js";
import { registerOfficeFigmaTool } from "./tools/figma.js";

/**
 * MorphixAI skills plugin for OpenClaw
 *
 * Provides:
 * - Workflow skills loaded from ./morphixai/ via openclaw.plugin.json
 * - Runtime tools:
 *   - mx_link: account linking & raw proxy
 *   - mx_jira: Jira Cloud (issues, projects, transitions)
 *   - mx_gitlab: GitLab (projects, MRs, issues, pipelines)
 *   - mx_github: GitHub (repos, issues, PRs, workflows)
 *   - mx_outlook: Outlook Email (read, send, search)
 *   - mx_ms_todo: Microsoft To Do (task lists, tasks)
 *   - mx_gmail: Gmail (read, send, search, labels)
 *   - mx_google_tasks: Google Tasks (task lists, tasks)
 *   - mx_notion: Notion (pages, databases, blocks, search)
 *   - mx_confluence: Confluence Cloud (spaces, pages, search)
 *   - mx_outlook_calendar: Outlook Calendar (calendars, events)
 *   - mx_figma: Figma (files, projects, components, styles, comments)
 */

const appTools = [
  { name: "mx_link", register: registerOfficeLinkTool },
  { name: "mx_jira", register: registerOfficeJiraTool },
  { name: "mx_gitlab", register: registerOfficeGitLabTool },
  { name: "mx_github", register: registerOfficeGitHubTool },
  { name: "mx_outlook", register: registerOfficeOutlookTool },
  { name: "mx_ms_todo", register: registerOfficeMsTodoTool },
  { name: "mx_gmail", register: registerOfficeGmailTool },
  { name: "mx_google_tasks", register: registerOfficeGoogleTasksTool },
  { name: "mx_notion", register: registerOfficeNotionTool },
  { name: "mx_confluence", register: registerOfficeConfluenceTool },
  { name: "mx_outlook_calendar", register: registerOfficeOutlookCalendarTool },
  { name: "mx_figma", register: registerOfficeFigmaTool },
];

const plugin: {
  id: string;
  name: string;
  description: string;
  configSchema: unknown;
  register: (api: OpenClawPluginApi) => void;
} = {
  id: "skills",
  name: "MorphixAI Skills",
  description:
    "MorphixAI workflow skills and third-party integration: Jira, GitLab, GitHub, Outlook, Gmail, Microsoft To Do, Google Tasks, Notion, Confluence, Outlook Calendar, Figma — with unified account linking and API proxy",
  configSchema: emptyPluginConfigSchema(),
  register(api: OpenClawPluginApi) {
    let registered = 0;
    for (const tool of appTools) {
      try {
        tool.register(api);
        registered++;
      } catch (err) {
        api.logger.error?.(`morphixai: Failed to register ${tool.name}: ${err}`);
      }
    }
    api.logger.info?.(`morphixai: Plugin registered (${registered} tools)`);
  },
};

export default plugin;
export { registerOfficeLinkTool };
export { registerOfficeJiraTool };
export { registerOfficeGitLabTool };
export { registerOfficeGitHubTool };
export { registerOfficeOutlookTool };
export { registerOfficeMsTodoTool };
export { registerOfficeGmailTool };
export { registerOfficeGoogleTasksTool };
export { registerOfficeNotionTool };
export { registerOfficeConfluenceTool };
export { registerOfficeOutlookCalendarTool };
export { registerOfficeFigmaTool };
