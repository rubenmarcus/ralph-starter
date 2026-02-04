---
sidebar_position: 1
title: Overview
description: Fetch specs from anywhere - GitHub, Linear, Notion, URLs, PDFs
keywords: [sources, integrations, github, linear, notion]
---

# Input Sources

ralph-starter can fetch specifications from various external sources, allowing you to turn tasks from your existing tools into built projects.

## Available Sources

### Built-in Sources

| Source | Description | Auth Required |
|--------|-------------|---------------|
| `file` | Local files and directories | No |
| `url` | Remote URLs (markdown, HTML) | No |
| `pdf` | PDF documents | No |

### Integration Sources

| Source | Description | Auth Required |
|--------|-------------|---------------|
| `figma` | Figma designs, tokens, components, assets | Yes (API token) |
| `github` | GitHub Issues | Optional (gh CLI or token) |
| `linear` | Linear issues | Yes (API key) |
| `notion` | Notion pages | Yes (API key) |

## Usage

### Basic Syntax

```bash
ralph-starter run --from <source> [options]
```

### Examples

```bash
# From a URL
ralph-starter run --from https://example.com/spec.md

# From a local file
ralph-starter run --from ./requirements.pdf

# From GitHub Issues
ralph-starter run --from github --project owner/repo --label "sprint-1"

# From Linear
ralph-starter run --from linear --label "in-progress" --limit 5

# From Notion
ralph-starter run --from notion --project "Product Specs"
```

## Configuration

Store credentials for integration sources:

```bash
# Set credentials
ralph-starter config set figma.token <your-token>
ralph-starter config set linear.apiKey <your-key>
ralph-starter config set notion.token <your-key>
ralph-starter config set github.token <your-token>

# View all config
ralph-starter config list

# Get specific value
ralph-starter config get linear.apiKey

# Remove
ralph-starter config delete linear.apiKey
```

Credentials are stored in `~/.ralph-starter/sources.json`.

## Source Commands

```bash
# List available sources
ralph-starter source list

# Get help for a source
ralph-starter source help github

# Test connectivity
ralph-starter source test linear

# Preview items from source
ralph-starter source preview github --project owner/repo
```

## Common Options

| Option | Description |
|--------|-------------|
| `--project <name>` | Project/repo filter |
| `--label <name>` | Label filter |
| `--status <status>` | Status filter |
| `--limit <n>` | Maximum items to fetch |

## How It Works

1. ralph-starter fetches items from the source
2. Items are converted to a specification format
3. The spec is saved to `specs/` directory
4. Planning and building proceed as normal

## Next Steps

- [Figma](/docs/sources/figma) - Fetch design specs, tokens, and components
- [GitHub](/docs/sources/github) - Fetch from GitHub Issues
- [Linear](/docs/sources/linear) - Fetch from Linear issues
- [Notion](/docs/sources/notion) - Fetch from Notion pages
