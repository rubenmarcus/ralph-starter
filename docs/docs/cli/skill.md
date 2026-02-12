---
sidebar_position: 10
title: "ralph-starter skill"
description: Manage agent skills for enhanced AI coding capabilities
keywords: [cli, skill, command, skills, agent, add-skill, claude code]
---

Manage agent skills — reusable instructions and best practices
that enhance your AI coding agent's capabilities.

## Synopsis

```bash
ralph-starter skill <action> [name]
```

## Description

The `skill` command manages agent skills for ralph-starter.
Skills are markdown files containing specialized instructions,
best practices, and domain knowledge that are injected into
your coding agent's context. They help the agent write better
code by following established patterns for specific frameworks
and tools.

Skills are installed using the
[`add-skill`](https://github.com/xpander-ai/agent-skills-ts)
CLI and stored as markdown files in either a global directory
(`~/.claude/skills/`) or a project-level directory
(`.claude/skills/`).

## Actions

| Action          | Aliases        | Description                              |
| --------------- | -------------- | ---------------------------------------- |
| `add <repo>`    | `install`, `i` | Install a skill from a git repository    |
| `list`          | `ls`           | List popular skills from the registry    |
| `search <term>` | -              | Search for skills by keyword             |
| `browse`        | -              | Interactive skill browser with selection |

## Options

| Option         | Description                                     | Default |
| -------------- | ----------------------------------------------- | ------- |
| `-g, --global` | Install the skill globally (all projects)       | `false` |

## Examples

### Install a Skill

```bash
# Install a skill repository
ralph-starter skill add vercel-labs/agent-skills

# Short alias
ralph-starter skill i vercel-labs/agent-skills

# Install globally
ralph-starter skill add vercel-labs/agent-skills --global
```

### List Popular Skills

```bash
ralph-starter skill list
```

Output:

```text
Popular Skills

  vercel-labs/agent-skills
  React, Next.js, and Vercel best practices
  Skills: react-best-practices, nextjs-best-practices,
          vercel-best-practices, web-design-review

Install with: ralph-starter skill add <repo>
Browse more: https://github.com/topics/agent-skills
```

### Search for Skills

```bash
ralph-starter skill search react
```

Output:

```text
Searching for: react

  vercel-labs/agent-skills
  React, Next.js, and Vercel best practices
```

### Interactive Browse

```bash
ralph-starter skill browse
```

This opens an interactive menu where you can select a skill
to install from the curated registry.

```text
? Select a skill to install:
  > vercel-labs/agent-skills - React, Next.js, Vercel
    ──────────────
    Cancel
```

## Skill Detection

When ralph-starter runs a task, it automatically detects
installed skills from three locations:

1. **Global skills** — `~/.claude/skills/*.md`
2. **Project skills** — `.claude/skills/*.md` in the project
3. **Skills script** — `skills.sh` files in the project or
   global Claude directory

Detected skills are matched against the project's tech stack
and included in the agent's prompt context when relevant.

## Auto Skill Discovery

Auto skill discovery is opt-in. When enabled, ralph-starter
queries the skills.sh registry to find and install relevant
skills automatically.

Enable it by setting:

```bash
RALPH_ENABLE_SKILL_AUTO_INSTALL=1
```

You can also force-disable it with:

```bash
RALPH_DISABLE_SKILL_AUTO_INSTALL=1
```

## Behavior

- The `add` action uses `npx add-skill` under the hood.
  If `add-skill` is not installed, it runs via `npx`.
- The `list` action shows a curated registry of popular
  skill repositories. It does not scan local installations.
- The `search` action filters the curated registry by
  matching repository names, descriptions, and skill names.
- The `browse` action presents an interactive list using
  Inquirer prompts.

## See Also

- [ralph-starter run](/docs/cli/run) — Skills are
  auto-detected and used during task execution
- [Agent Skills on GitHub](https://github.com/topics/agent-skills)
  — Community skill repositories
