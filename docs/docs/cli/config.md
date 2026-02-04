---
sidebar_position: 4
title: config
description: Manage source configuration and credentials
keywords: [cli, config, command, credentials]
---

# ralph-starter config

Manage source configuration and credentials.

## Synopsis

```bash
ralph-starter config <action> [args...]
```

## Actions

| Action | Description |
|--------|-------------|
| `list` | Show all configuration |
| `get <key>` | Get a specific value |
| `set <key> <value>` | Set a value |
| `delete <key>` | Remove a value |

## Examples

### List Configuration

```bash
ralph-starter config list
```

Output:
```
Configuration:
  apiKey: sk-ant-...
  linear.apiKey: lin_api_...
  notion.token: secret_...
```

### Get Value

```bash
ralph-starter config get linear.apiKey
```

### Set Value

```bash
# Set API keys
ralph-starter config set apiKey sk-ant-xxxx
ralph-starter config set linear.apiKey lin_api_xxxx
ralph-starter config set notion.token secret_xxxx
ralph-starter config set github.token ghp_xxxx

# Set defaults
ralph-starter config set github.defaultIssuesRepo owner/repo
```

### Delete Value

```bash
ralph-starter config delete linear.apiKey
```

## Configuration Keys

| Key | Description |
|-----|-------------|
| `apiKey` | Anthropic API key for LLM features |
| `linear.apiKey` | Linear API key |
| `notion.token` | Notion integration token |
| `github.token` | GitHub personal access token |
| `github.defaultIssuesRepo` | Default repo for `--issue` without `--project` |

## Storage Location

Configuration is stored in:

```
~/.ralph-starter/sources.json
```

Example file:
```json
{
  "sources": {
    "linear": {
      "credentials": {
        "apiKey": "lin_api_xxxx"
      }
    },
    "notion": {
      "credentials": {
        "apiKey": "secret_xxxx"
      }
    }
  }
}
```

## Security Notes

- Credentials are stored in plain text
- File permissions are set to user-only (600)
- Consider using environment variables for sensitive keys:
  - `ANTHROPIC_API_KEY`
  - `GITHUB_TOKEN`

## Environment Variables

These environment variables override config file values:

| Variable | Description |
|----------|-------------|
| `ANTHROPIC_API_KEY` | Anthropic API key |
| `GITHUB_TOKEN` | GitHub token |

## See Also

- [ralph-starter source](/docs/cli/source)
- [Input Sources](/docs/sources/overview)
