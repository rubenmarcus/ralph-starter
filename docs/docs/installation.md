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
- **Coding Agent** - At least one of:
  - [Claude Code](https://claude.ai/claude-code) (recommended)
  - [Cursor](https://cursor.sh/)
  - [Codex](https://openai.com/codex/)
  - [OpenCode](https://github.com/opencode-ai/opencode)
- **Git** - For version control features (`--commit`, `--push`, `--pr`)
- **GitHub CLI** - For PR creation and GitHub source integration

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
