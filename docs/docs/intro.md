---
sidebar_position: 1
title: Introduction
description: ralph-starter - Ralph Wiggum made easy. One command to run autonomous AI coding loops.
keywords: [ralph wiggum, autonomous coding, AI coding loops, claude code]
---

# ralph-starter

> **Ralph Wiggum made easy.** One command to run autonomous AI coding loops.

## What is Ralph Wiggum?

Ralph Wiggum is a technique for running AI coding agents in autonomous loops until tasks are completed. Instead of prompting back and forth, you give the AI a task and let it iterate until done.

**ralph-starter** makes this dead simple - for developers and non-developers alike.

## Quick Start

### For Everyone

Just run `ralph-starter` with no arguments:

```bash
ralph-starter
```

The interactive wizard will guide you through:
1. Describing your project idea (or brainstorming one)
2. Refining it with AI
3. Customizing the tech stack
4. Building it automatically

### Don't Know What to Build?

```bash
ralph-starter ideas
```

This launches **Idea Mode** - a brainstorming session to help you discover project ideas.

### For Developers

```bash
# Run a single task
ralph-starter run "build a todo app with React"

# With git automation
ralph-starter run "add user authentication" --commit --pr

# Fetch specs from external sources
ralph-starter run --from github --project myorg/myrepo --label "ready"
```

## Features

- **Interactive Wizard** - Guided project creation for everyone
- **Idea Mode** - AI-powered brainstorming when you don't know what to build
- **Input Sources** - Fetch specs from GitHub, Linear, Notion, URLs, PDFs
- **MCP Server** - Use from Claude Desktop or any MCP client
- **Git Automation** - Auto-commit, push, and create PRs
- **Validation** - Run tests/lint/build after each iteration (backpressure)
- **Multi-Agent Support** - Works with Claude Code, Cursor, Codex, OpenCode

## Next Steps

- [Installation](/docs/installation) - Get ralph-starter installed
- [Interactive Wizard](/docs/wizard/overview) - Learn about the guided experience
- [Input Sources](/docs/sources/overview) - Connect to GitHub, Linear, and more
- [MCP Integration](/docs/mcp/setup) - Use from Claude Desktop
