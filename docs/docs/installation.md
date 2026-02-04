---
sidebar_position: 2
title: Installation
description: How to install ralph-starter and get started
keywords: [installation, npm, setup, requirements]
---

# Installation

## Quick Install

```bash
npm install -g ralph-starter
```

Or use directly with npx:

```bash
npx ralph-starter
```

## Requirements

- **Node.js 18+** - Required for running ralph-starter
- **Coding Agent** - At least one of the supported agents (see setup below)
- **Git** - For version control features (`--commit`, `--push`, `--pr`)
- **GitHub CLI** - For PR creation and GitHub source integration

## Setting Up a Coding Agent

ralph-starter works with several AI coding agents. You need at least one installed:

### Claude Code (Recommended)

The official Anthropic CLI for Claude.

```bash
# Install via npm
npm install -g @anthropic-ai/claude-code

# Authenticate
claude login
```

Claude Code offers the best integration with ralph-starter's autonomous loops.

### Cursor

AI-powered code editor with built-in agent capabilities.

1. Download from [cursor.sh](https://cursor.sh/)
2. Install and open Cursor
3. Sign in with your account
4. Enable the Cursor CLI: `Cursor → Install 'cursor' command`

### Codex (OpenAI)

OpenAI's coding assistant.

```bash
# Install the OpenAI CLI
npm install -g openai

# Set your API key
export OPENAI_API_KEY=your-key-here
```

### OpenCode

Open-source alternative with multiple model support.

```bash
# Install
npm install -g opencode-ai

# Configure
opencode setup
```

## Verify Installation

```bash
ralph-starter --version
```

## Optional: API Key Configuration

For direct LLM refinement (faster wizard experience):

```bash
# Set Anthropic API key
export ANTHROPIC_API_KEY=your-key-here

# Or add to config
ralph-starter config set apiKey your-key-here
```

Without an API key, ralph-starter falls back to using your installed coding agent for LLM tasks.

## Next Steps

After installation:

1. Run `ralph-starter` to launch the interactive wizard
2. Or run `ralph-starter ideas` if you need help brainstorming
3. Check out the [Interactive Wizard](/docs/wizard/overview) guide
