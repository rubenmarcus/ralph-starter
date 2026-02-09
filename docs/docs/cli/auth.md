---
sidebar_position: 7
title: auth
description: Browser-based OAuth authentication for integrations
keywords: [cli, auth, command, oauth, authentication, linear, notion, github, todoist]
---

# ralph-starter auth

Browser-based OAuth authentication for integrations. Supports OAuth PKCE flows for services like Linear, and manages manual API key configuration for services like Notion, Todoist, and GitHub.

## Synopsis

```bash
ralph-starter auth [service]
ralph-starter auth --list
ralph-starter auth --logout <service>
```

## Description

The `auth` command manages authentication credentials for ralph-starter's integrations. It operates in three modes:

1. **OAuth Flow** -- Start a browser-based OAuth PKCE flow for a supported service (e.g., Linear).
2. **Status Listing** -- Show authentication status for all services.
3. **Logout** -- Remove stored credentials for a service.

Credentials are stored locally in the ralph-starter sources configuration file.

## Arguments

| Argument | Description |
|----------|-------------|
| `service` | The service to authenticate with (e.g., `linear`, `notion`, `todoist`, `github`) |

## Options

| Option | Description |
|--------|-------------|
| `--list` | Show authentication status for all services |
| `--logout <service>` | Remove credentials for the specified service |

## Supported Services

| Service | Auth Method | Details |
|---------|-------------|---------|
| `linear` | Browser OAuth (PKCE) | Seamless browser-based flow. Requires `RALPH_LINEAR_CLIENT_ID` env var. |
| `notion` | Manual API key | Set via `ralph-starter config set notion.apiKey <key>`. Get key at [notion.so/my-integrations](https://www.notion.so/my-integrations). |
| `todoist` | Manual API key | Set via `ralph-starter config set todoist.apiKey <key>`. Get key at [todoist.com/prefs/integrations](https://todoist.com/prefs/integrations). |
| `github` | Manual API key | Set via `ralph-starter config set github.apiKey <key>`. Get token at [github.com/settings/tokens](https://github.com/settings/tokens). |

## Examples

### Start OAuth Flow (Linear)

```bash
# Authenticate with Linear via browser OAuth
ralph-starter auth linear
```

This opens your browser, completes the PKCE authorization flow, and stores the token locally. The flow uses a local callback server with a 5-minute timeout.

### Check Authentication Status

```bash
ralph-starter auth --list
```

Output:

```
Authentication Status
Credentials stored in: /home/user/.config/ralph-starter/sources.json

  ✓ Linear - Authenticated
  ○ Notion - Manual API key
      Run: ralph-starter config set notion.apiKey <your-key>
  ○ Todoist - Manual API key
      Run: ralph-starter config set todoist.apiKey <your-key>
  ○ GitHub - Manual API key
      Run: ralph-starter config set github.apiKey <your-key>
```

### Logout from a Service

```bash
# Remove stored credentials for Linear
ralph-starter auth --logout linear
```

### Configure Manual API Keys

For services that do not support OAuth PKCE, configure API keys manually:

```bash
# Notion
ralph-starter config set notion.apiKey ntn_your_api_key_here

# Todoist
ralph-starter config set todoist.apiKey your_todoist_api_key

# GitHub
ralph-starter config set github.apiKey ghp_your_github_token
```

### Show Help

```bash
# Run auth with no arguments to see help
ralph-starter auth
```

## OAuth PKCE Flow

For services that support PKCE (currently Linear), the authentication process works as follows:

1. A local callback server starts on a random port.
2. A PKCE challenge and CSRF state token are generated.
3. Your browser opens to the service's authorization URL.
4. After you authorize, the callback server receives the authorization code.
5. The code is exchanged for access (and optionally refresh) tokens using the PKCE verifier.
6. Tokens are stored locally.

If the browser cannot be opened automatically, the authorization URL is printed for manual use.

### Setting Up Linear OAuth

```bash
# 1. Set your Linear OAuth client ID
export RALPH_LINEAR_CLIENT_ID=your_client_id

# 2. Run the auth flow
ralph-starter auth linear

# 3. Verify
ralph-starter auth --list
```

Get a Linear client ID from [linear.app/settings/api/applications](https://linear.app/settings/api/applications).

## Exit Codes

| Code | Description |
|------|-------------|
| 0 | Success |
| 1 | Unknown service, OAuth not configured, or authentication failed |

## See Also

- [ralph-starter config](/docs/cli/config) - Manage configuration including API keys
- [ralph-starter integrations](/docs/cli/integrations) - List and test integrations
- [ralph-starter auto](/docs/cli/auto) - Use authenticated sources for batch processing
