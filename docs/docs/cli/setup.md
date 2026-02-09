---
sidebar_position: 8
title: setup
description: Interactive setup wizard to configure LLM and agents
keywords: [cli, setup, command, wizard, configuration, llm, agents]
---

# ralph-starter setup

Interactive setup wizard to configure your LLM provider and coding agents.

## Synopsis

```bash
ralph-starter setup [--force]
```

## Description

The `setup` command launches a step-by-step wizard that walks you through configuring ralph-starter. It detects installed agents, helps you choose an LLM provider, tests the connection, and saves your configuration.

The wizard runs through four steps:

1. **Detect Installed Agents** -- Scans your system for available AI coding agents (Claude Code, Cursor, Codex, OpenCode, etc.) and displays which are available.

2. **Configure LLM Provider** -- Determines how ralph-starter communicates with an LLM:
   - If Claude Code CLI is detected, offers to use it directly (no API key needed).
   - Checks for existing API keys in environment variables (e.g., `ANTHROPIC_API_KEY`).
   - Checks for previously saved configuration.
   - If nothing is found, prompts you to select a provider and enter an API key.

3. **Test Connection** -- Sends a test request to verify the configured LLM is reachable and responding.

4. **Save Configuration** -- Writes your preferences to the ralph-starter config file, including agent selection, LLM provider, and optionally your API key.

If setup has already been completed, the wizard notifies you and asks for confirmation before proceeding. Use `--force` to skip this check.

## Options

| Option | Description | Default |
|--------|-------------|---------|
| `--force` | Force re-run setup even if already configured | `false` |

## Examples

### First-Time Setup

```bash
ralph-starter setup
```

Output:

```
  ╭─────────────────────────────────────────╮
  │  ralph-starter Setup Wizard             │
  │  Let's get you configured!              │
  ╰─────────────────────────────────────────╯

Step 1: Detecting Installed Agents

  ✓ Claude Code v1.2.3
    /usr/local/bin/claude
  ✗ Cursor not found
  ✗ Codex not found

Step 2: Configure LLM Provider

  ✓ Claude Code CLI detected!
    No API key needed - uses your Claude Code authentication.

? Use Claude Code CLI? (recommended - no API key needed) Yes

Step 3: Testing Connection

✓ Connection successful (245ms)

Step 4: Saving Configuration

  ✓ Configuration saved

  ╭─────────────────────────────────────────╮
  │  Setup Complete!                        │
  │                                         │
  │  Using: Claude Code CLI                 │
  │  No API key needed                      │
  │                                         │
  ╰─────────────────────────────────────────╯

  Next steps:
    • ralph-starter           Launch wizard to build a project
    • ralph-starter ideas     Brainstorm project ideas
    • ralph-starter check     Verify configuration
```

### Re-Run Setup

```bash
# Force re-run even if already configured
ralph-starter setup --force
```

### With API Key Provider

If Claude Code is not installed, the wizard prompts you to choose an LLM provider:

```bash
ralph-starter setup
```

```
Step 2: Configure LLM Provider

? Choose your LLM provider:
  ❯ Anthropic
    OpenAI
    OpenRouter

Get your API key at: https://console.anthropic.com

? Enter your Anthropic API key: ****

Step 3: Testing Connection

✓ Connection successful (312ms)

? Save API key to config file? Yes
```

## Behavior

- **Cancellation** -- You can press `Ctrl+C` at any time to cancel the wizard. The process exits cleanly.
- **Connection Failure** -- If the connection test fails, you are offered the option to save the configuration anyway and retry later with `ralph-starter check`.
- **Existing Config** -- If setup was previously completed and `--force` is not set, you are prompted whether to continue or exit.

## Exit Codes

| Code | Description |
|------|-------------|
| 0 | Setup completed successfully, or cancelled by user |
| 1 | Setup failed (connection error and user chose not to save) |

## See Also

- [ralph-starter check](/docs/cli/check) - Verify configuration and test LLM connection
- [ralph-starter config](/docs/cli/config) - Manage configuration manually
- [ralph-starter auth](/docs/cli/auth) - Configure authentication for integrations
