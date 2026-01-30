---
sidebar_position: 5
title: template
description: Browse and use project templates
keywords: [cli, template, command, project templates, scaffolding]
---

# ralph-starter template

Browse and use project templates from the ralph-templates repository.

## Synopsis

```bash
ralph-starter template [action] [args...] [options]
```

## Description

The `template` command lets you browse, preview, and use pre-built project templates. Templates are curated specs that describe complete projects, which the AI agent builds from scratch.

Templates are fetched from [github.com/rubenmarcus/ralph-templates](https://github.com/rubenmarcus/ralph-templates) and cached locally for offline use.

## Actions

| Action | Description |
|--------|-------------|
| `list` | List all available templates |
| `preview <name>` | Preview a template's content |
| `use <name>` | Use a template to start a new project |
| `browse` | Interactive template browser |
| `help` | Show help |

## Options

| Option | Description | Default |
|--------|-------------|---------|
| `--category <name>` | Filter by category | - |
| `--refresh` | Force refresh the cache | false |
| `--auto` | Skip confirmation prompts | false |
| `--output-dir <path>` | Directory to create the project in | cwd |
| `--commit` | Auto-commit after each task | false |
| `--push` | Push commits to remote | false |
| `--pr` | Create pull request when done | false |
| `--validate` | Run tests/lint/build after iterations | false |
| `--agent <name>` | Specify agent | auto-detect |
| `--max-iterations <n>` | Maximum loop iterations | auto |

## Categories

Templates are organized into categories:

- `web-dev` - Web development projects (SaaS, landing pages, dashboards)
- `blockchain` - Web3 and blockchain projects
- `devops` - DevOps tools and automation
- `mobile` - Mobile app projects
- `tools` - CLI tools and utilities

## Examples

### List Templates

```bash
# List all templates
ralph-starter template list

# Filter by category
ralph-starter template list --category web-dev

# Force refresh from remote
ralph-starter template list --refresh
```

### Preview a Template

```bash
# Preview template content
ralph-starter template preview nextjs-saas

# Preview a CLI tool template
ralph-starter template preview cli-tool
```

### Use a Template

```bash
# Use a template (interactive)
ralph-starter template use landing-page

# Specify output directory
ralph-starter template use nextjs-saas --output-dir ~/projects/my-saas

# Skip prompts
ralph-starter template use cli-tool --auto

# With full automation
ralph-starter template use landing-page --auto --commit --pr
```

### Interactive Browser

```bash
# Browse templates interactively
ralph-starter template browse
```

### Quick Use (Shorthand)

```bash
# Use template name directly as action
ralph-starter template nextjs-saas
```

## Template Structure

Each template includes:

- **ID** - Unique identifier (e.g., `nextjs-saas`)
- **Name** - Display name
- **Description** - What the template builds
- **Category** - Organization category
- **Tags** - Searchable keywords
- **Difficulty** - `beginner`, `intermediate`, or `advanced`
- **Spec Content** - The actual project specification in markdown

## Caching

Templates are cached locally at `~/.ralph-starter/templates-cache/`:

- Cache expires after 1 hour
- Use `--refresh` to force update
- Registry and individual templates are cached separately

## Workflow

1. **Browse** - Find a template that matches your needs
2. **Preview** - Check the spec content
3. **Use** - Let the AI agent build it
4. **Customize** - Modify the generated project as needed

## Creating Custom Templates

To contribute templates, see the [ralph-templates repository](https://github.com/rubenmarcus/ralph-templates).

## Exit Codes

| Code | Description |
|------|-------------|
| 0 | Success |
| 1 | Error (template not found, network error, etc.) |

## See Also

- [ralph-starter run](/docs/cli/run)
- [ralph-starter wizard](/docs/wizard/overview)
- [Input Sources](/docs/sources/overview)
