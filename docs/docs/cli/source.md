---
sidebar_position: 5
title: source
description: Manage input sources
keywords: [cli, source, command, integrations]
---

# ralph-starter source

Manage input sources.

## Synopsis

```bash
ralph-starter source <action> [args...] [options]
```

## Actions

| Action | Description |
|--------|-------------|
| `list` | Show available sources |
| `help <name>` | Get help for a source |
| `test <name>` | Test source connectivity |
| `preview <name>` | Preview items from source |

## Options

| Option | Description |
|--------|-------------|
| `--project <name>` | Project/repo filter |
| `--label <name>` | Label filter |
| `--status <status>` | Status filter |
| `--limit <n>` | Max items (default: 10) |

## Examples

### List Sources

```bash
ralph-starter source list
```

Output:
```
Available Sources:

Built-in:
  file     - Local files and directories
  url      - Remote URLs (markdown, HTML)
  pdf      - PDF documents

Integrations:
  github   - GitHub Issues [configured]
  linear   - Linear issues [not configured]
  notion   - Notion pages [not configured]
```

### Get Help

```bash
ralph-starter source help github
```

Output:
```
GitHub Source

Fetch specs from GitHub Issues.

Authentication:
  - GitHub CLI (gh auth login)
  - Or: ralph-starter config set github.token <token>

Usage:
  ralph-starter run --from github --project owner/repo

Options:
  --project   Repository (owner/repo format)
  --label     Filter by label
  --status    Filter by status (open, closed, all)
  --limit     Max issues to fetch
```

### Test Connectivity

```bash
ralph-starter source test linear
```

Output:
```
Testing Linear connection...
✓ Connected successfully
✓ Found 3 teams
✓ API access verified
```

### Preview Items

```bash
ralph-starter source preview github --project owner/repo --label "ready"
```

Output:
```
Previewing items from GitHub (owner/repo):

1. Add user authentication (#42)
   Labels: feature, ready
   Created: 2024-01-15

2. Fix login bug (#38)
   Labels: bug, ready
   Created: 2024-01-14

3. Update dashboard (#35)
   Labels: enhancement, ready
   Created: 2024-01-12

Found 3 items matching filters.
```

## Available Sources

### Built-in

| Source | Description |
|--------|-------------|
| `file` | Local files (.md, directories) |
| `url` | Remote URLs (fetches and converts) |
| `pdf` | PDF documents (extracts text) |

### Integrations

| Source | Auth Method |
|--------|-------------|
| `github` | gh CLI or token |
| `linear` | API key |
| `notion` | Integration token |

## Workflow

```bash
# 1. Check available sources
ralph-starter source list

# 2. Configure if needed
ralph-starter config set linear.apiKey <key>

# 3. Test connection
ralph-starter source test linear

# 4. Preview items
ralph-starter source preview linear --label "in-progress"

# 5. Run with source
ralph-starter run --from linear --label "in-progress"
```

## See Also

- [ralph-starter config](/docs/cli/config)
- [Input Sources Overview](/docs/sources/overview)
- [GitHub Source](/docs/sources/github)
- [Linear Source](/docs/sources/linear)
