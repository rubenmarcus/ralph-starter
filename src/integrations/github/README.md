# GitHub Integration

Fetch issues, PRs, and files from GitHub repositories.

## Authentication

### Option 1: GitHub CLI (Recommended)

The easiest way to authenticate. The `gh` CLI handles everything.

```bash
# Install gh CLI
# macOS: brew install gh
# Other: https://cli.github.com/

# Login
gh auth login
```

### Option 2: Personal Access Token

Create a token and configure ralph-starter.

```bash
# 1. Create token at https://github.com/settings/tokens
# 2. Configure
ralph-starter config set github.token ghp_xxxxx
```

## Usage

```bash
# Fetch open issues
ralph-starter run --from github --project owner/repo

# Filter by label
ralph-starter run --from github --project owner/repo --label bug

# Fetch closed issues
ralph-starter run --from github --project owner/repo --status closed

# Limit results
ralph-starter run --from github --project owner/repo --limit 10
```

## Options

| Option | Description | Default |
|--------|-------------|---------|
| `--project` | Repository (owner/repo or URL) | Required |
| `--label` | Filter by label | None |
| `--status` | Issue state (open/closed/all) | open |
| `--limit` | Max issues to fetch | 20 |

## Examples

```bash
# Facebook React issues labeled "good first issue"
ralph-starter run --from github --project facebook/react --label "good first issue"

# All issues from a private repo (requires auth)
ralph-starter run --from github --project my-org/private-repo --status all

# Using full URL
ralph-starter run --from github --project https://github.com/owner/repo
```

## Data Fetched

- Issue number and title
- Labels
- Issue body (description)
- State (open/closed)

## Limitations

- Fetches issues only (PRs coming soon)
- Maximum 100 issues per request
- Rate limited by GitHub API
