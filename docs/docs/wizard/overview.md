---
sidebar_position: 1
title: Overview
description: The interactive wizard for guided project creation
keywords: [wizard, interactive, guided, project creation]
---

# Interactive Wizard

The interactive wizard is the easiest way to use ralph-starter. It guides you through the entire process of creating a project, from idea to running code.

## Launch the Wizard

```bash
ralph-starter
```

Or explicitly:

```bash
ralph-starter wizard
```

## How It Works

### Step 1: Project Idea

The wizard first asks if you have a project idea:

- **"Yes, I know what I want to build"** - Proceed to describe your idea
- **"No, help me brainstorm ideas"** - Launch [Idea Mode](/docs/wizard/idea-mode)

### Step 2: Idea Refinement

Once you describe your idea (e.g., "a habit tracker app"), the AI:

1. Suggests a project name
2. Determines the project type (web app, CLI, API, etc.)
3. Recommends a tech stack
4. Identifies core features
5. Suggests additional features
6. Estimates complexity

### Step 3: Customization

You can then customize:

- **Project Type** - Web, API, CLI, Mobile, Library, Automation
- **Tech Stack** - Frontend, backend, database choices
- **Features** - Select which features to include
- **Complexity** - Prototype, MVP, or Full-featured

### Step 4: Execution Options

Choose how to proceed:

- **Start building automatically** - Begin the AI coding loop
- **Just create the plan** - Generate files for manual execution later

Optional: Enable auto-commit to save changes as you build.

### Step 5: Build

The wizard then:

1. Creates the project directory
2. Initializes Ralph Playbook files (AGENTS.md, specs/, etc.)
3. Writes a detailed specification
4. Generates an implementation plan
5. Starts building with AI (if auto-run enabled)

## Example Session

```
$ ralph-starter

  ╭─────────────────────────────────────────────────────────────╮
  │   Welcome to ralph-starter!                                 │
  │   Let's build something awesome together.                   │
  ╰─────────────────────────────────────────────────────────────╯

? Do you have a project idea?
❯ Yes, I know what I want to build
  No, help me brainstorm ideas

? What's your idea for today?
  (e.g., "a habit tracker app" or "an API for managing recipes")
> a personal finance tracker

✔ Got it!

  Here's what I understand:
  ────────────────────────────────────────
  Project: personal-finance-tracker
  Type: Web Application

  Tech Stack:
    Frontend: react
    Backend: nodejs
    Database: sqlite

  Key Features:
    • Transaction tracking
    • Budget management
    • Expense categories
    • Monthly reports

  Complexity: Working MVP

? Does this look right?
❯ Yes, let's build it!
  I want to change something
  Start over with a different idea
```

## Non-Developer Friendly

The wizard uses plain language instead of technical jargon:

| Technical Term | Wizard Language |
|---------------|-----------------|
| "Configure database" | "How should it store data?" |
| "Select framework" | "What type of app?" |
| "Initialize repository" | "Let me set up the project" |
| "Run build pipeline" | "Start building" |

## Next Steps

- [Idea Mode](/docs/wizard/idea-mode) - For when you don't know what to build
- [Input Sources](/docs/sources/overview) - Fetch specs from external services
