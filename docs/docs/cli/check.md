---
sidebar_position: 9
title: check
description: Validate configuration and test LLM connection
keywords: [cli, check, command, configuration, validation, connection, test]
---

# ralph-starter check

Validate your ralph-starter configuration and test the LLM connection.

## Synopsis

```bash
ralph-starter check [--verbose]
```

## Description

The `check` command verifies that ralph-starter is properly configured and can communicate with an LLM provider. It runs through a series of checks:

1. **Claude Code CLI Detection** -- Checks if the Claude Code CLI is installed and available on your system. Displays the version and path when found.

2. **API Key Configuration** -- Checks whether an LLM API key is configured, either from an environment variable or the config file. Displays the provider name and a masked version of the key.

3. **Connection Test** -- Sends a test request to the configured LLM (either via Claude Code CLI or the API provider) and measures the response time.

4. **Summary** -- Reports overall status and which provider is being used.

If no LLM is available (neither Claude Code CLI nor an API key), the command prints instructions on how to get started and exits with code 1.

## Options

| Option | Description | Default |
|--------|-------------|---------|
| `--verbose` | Show detailed output, including executable paths | `false` |

## Examples

### Basic Check

```bash
ralph-starter check
```

Output (with Claude Code):

```
Checking ralph-starter configuration...

  Detecting LLM...
  ✓ Claude Code CLI found v1.2.3

  ✓ Response received (245ms)

  All checks passed! You're ready to go.

  Using: Claude Code CLI (no API key needed)
  Run 'ralph-starter' to launch the wizard.
```

### Verbose Output

```bash
ralph-starter check --verbose
```

Output:

```
Checking ralph-starter configuration...

  Detecting LLM...
  ✓ Claude Code CLI found v1.2.3
    Path: /usr/local/bin/claude
  ✓ API Key configured (Anthropic)
    Key: sk-a****xyz1 (from environment)

  ✓ Response received (312ms)

  All checks passed! You're ready to go.

  Using: Claude Code CLI (no API key needed)
  Run 'ralph-starter' to launch the wizard.
```

### When No LLM Is Configured

```bash
ralph-starter check
```

Output:

```
Checking ralph-starter configuration...

  Detecting LLM...
  ✗ Claude Code CLI not found
  ✗ No API key configured

  No LLM available!

  To get started, either:
    1. Install Claude Code: https://claude.ai/code
    2. Run setup wizard: ralph-starter setup
    3. Set API key: export ANTHROPIC_API_KEY=your-key
```

### After Failed Connection

```bash
ralph-starter check
```

Output:

```
Checking ralph-starter configuration...

  Detecting LLM...
  ✓ API Key configured (Anthropic)
    Key: sk-a****xyz1 (from environment)

  ✗ Connection failed: 401 Unauthorized

  The connection test failed. This could mean:
    • API key is invalid or expired
    • Network connectivity issues
    • Claude Code is not authenticated

  Try running: ralph-starter setup
```

## Behavior

- The check command prioritizes Claude Code CLI. If both Claude Code and an API key are available, Claude Code is used for the connection test.
- API keys are displayed in a masked format (first 4 and last 4 characters visible).
- The source of the API key is identified (environment variable or config file).

## Exit Codes

| Code | Description |
|------|-------------|
| 0 | All checks passed |
| 1 | No LLM available or connection test failed |

## See Also

- [ralph-starter setup](/docs/cli/setup) - Interactive setup wizard
- [ralph-starter config](/docs/cli/config) - Manage configuration manually
