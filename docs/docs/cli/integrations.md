---
sidebar_position: 11
title: integrations
description: Manage, test, and fetch data from integrations
keywords: [cli, integrations, command, github, linear, notion, fetch, test]
---

# ralph-starter integrations

Manage integrations -- list available integrations, view setup instructions, test connectivity, and fetch data previews.

## Synopsis

```bash
ralph-starter integrations [action] [args...]
```

## Description

The `integrations` command provides tools for managing ralph-starter's integration layer. Integrations connect ralph-starter to external services like GitHub, Linear, and Notion, allowing you to fetch tasks, issues, and specifications for your coding loops.

If no action is provided, the command defaults to `list`.

## Actions

| Action | Aliases | Description |
|--------|---------|-------------|
| `list` | `ls` | List all integrations with their availability status and auth methods |
| `help <name>` | - | Show detailed setup instructions for a specific integration |
| `test <name>` | - | Test connectivity for a configured integration |
| `fetch <name> <identifier>` | `preview` | Fetch and preview data from an integration |

## Fetch Options

These options apply when using the `fetch` action:

| Option | Description | Default |
|--------|-------------|---------|
| `--project <name>` | Project or repository name | - |
| `--label <name>` | Filter results by label | - |
| `--status <status>` | Filter results by status (e.g., `open`, `closed`) | - |
| `--limit <n>` | Maximum number of items to fetch | `10` |

## Available Integrations

| Integration | Description | Auth Methods |
|-------------|-------------|--------------|
| `github` | GitHub issues and pull requests | CLI, API Key |
| `linear` | Linear issues and projects | OAuth, API Key |
| `notion` | Notion pages (public and private) | API Key |

## Examples

### List All Integrations

```bash
ralph-starter integrations list
```

Output:

```
Available Integrations
────────────────────────────────────────────────────────

  ✓ GitHub (github)
    GitHub issues and PRs
    Auth: CLI, API Key

  ✓ Linear (linear)
    Linear issues
    Auth: OAuth, API Key

  ○ Notion (notion)
    Notion pages (public and private)
    Auth: API Key
    → Run: ralph-starter integrations help notion

────────────────────────────────────────────────────────
Use "ralph-starter integrations help <name>" for setup instructions
```

### View Setup Help

```bash
# Show setup instructions for Notion
ralph-starter integrations help notion

# Show setup instructions for GitHub
ralph-starter integrations help github
```

### Test Connectivity

```bash
# Test GitHub integration
ralph-starter integrations test github
```

Output (success):

```
✓ GitHub: Connected via CLI
```

Output (not configured):

```
✗ GitHub: Not configured

Run the following for setup instructions:
  ralph-starter integrations help github
```

### Fetch and Preview Data

```bash
# Fetch GitHub issues from a repository
ralph-starter integrations fetch github owner/repo

# Fetch with filters
ralph-starter integrations fetch github owner/repo --label "bug" --status open --limit 5

# Fetch a Notion page
ralph-starter integrations fetch notion "https://notion.so/Page-abc123"

# Fetch Linear issues for a project
ralph-starter integrations fetch linear my-project --status "In Progress"
```

Output:

```
✓ Content fetched

Source: github
Title: Fix authentication redirect loop
Metadata: {
  "number": 42,
  "state": "open",
  "labels": ["bug", "auth"]
}

Preview:
────────────────────────────────────────────────────────
## Description

Users are experiencing an infinite redirect loop when...

## Steps to Reproduce

1. Navigate to /login
2. Enter valid credentials
3. Observe redirect loop
────────────────────────────────────────────────────────
```

The preview displays up to the first 50 lines of content. If the content is longer, a count of remaining lines is shown.

## Behavior

- **Default action** -- Running `ralph-starter integrations` with no action defaults to `list`.
- **Auth methods** -- Each integration supports one or more authentication methods (CLI authentication, API keys, or OAuth). The `list` action shows which methods are available and which are configured.
- **Fetch previews** -- The `fetch` action retrieves real data from the integration and displays a preview including source, title, metadata, and content.

## Exit Codes

| Code | Description |
|------|-------------|
| 0 | Success |
| 1 | Unknown integration, not configured, or fetch failed |

## See Also

- [ralph-starter auth](/docs/cli/auth) - Configure OAuth authentication for integrations
- [ralph-starter config](/docs/cli/config) - Set API keys for integrations
- [ralph-starter run](/docs/cli/run) - Use integrations as task sources with `--from`
- [ralph-starter auto](/docs/cli/auto) - Batch process tasks from integrations
