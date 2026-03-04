#!/usr/bin/env node

/**
 * openclaw-morphixai
 *
 * Quick install:
 *   cp -r skills/* ~/.openclaw/skills/
 *   cp templates/openclaw.personal.json ~/.openclaw/openclaw.json
 *
 * Or use the install script:
 *   node index.js install [--skills-dir ~/.openclaw/skills]
 */

import { cpSync, mkdirSync } from "node:fs"
import { join, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = fileURLToPath(new URL(".", import.meta.url))

const cmd = process.argv[2]

if (cmd === "install") {
  const targetDir = process.argv.includes("--skills-dir")
    ? process.argv[process.argv.indexOf("--skills-dir") + 1]
    : join(process.env.HOME || "~", ".openclaw", "skills")

  const resolved = resolve(targetDir)
  mkdirSync(resolved, { recursive: true })
  cpSync(join(__dirname, "skills"), resolved, { recursive: true })
  console.log(`Skills installed to ${resolved}`)
} else {
  console.log(`openclaw-morphixai v0.1.0

Usage:
  node index.js install [--skills-dir <path>]

Skills included:
  - gitlab-workflow   GitLab MR/CI/Review with team conventions
  - daily-standup     Multi-source morning briefing

Templates included:
  - openclaw.personal.json    Single-user office setup
  - AGENTS.md                 Development SOP
  - SOUL.md                   Concise Chinese assistant persona
`)
}
