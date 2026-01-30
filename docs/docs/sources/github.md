---
sidebar_position: 2
title: GitHub
description: Fetch specs from GitHub Issues
keywords: [github, issues, integration]
---

# GitHub Source

Fetch specifications from GitHub Issues to turn them into built projects.

## Authentication

GitHub source works in two modes:

### 1. GitHub CLI (Recommended)

If you have [GitHub CLI](https://cli.github.com/) installed and authenticated:

```bash
gh auth login
```

No additional configuration needed.

### 2. Personal Access Token

```bash
ralph-starter config set github.token ghp_xxxxxxxxxxxx
```

Create a token at [GitHub Settings > Developer settings > Personal access tokens](https://github.com/settings/tokens).

Required scopes:
- `repo` (for private repositories)
- `public_repo` (for public repositories only)

## Usage

```bash
# Fetch all open issues from a repo
ralph-starter run --from github --project owner/repo

# Filter by label
ralph-starter run --from github --project owner/repo --label "ready-to-build"

# Filter by status
ralph-starter run --from github --project owner/repo --status open

# Limit results
ralph-starter run --from github --project owner/repo --limit 5

# Combine filters
ralph-starter run --from github --project owner/repo --label "sprint-1" --status open --limit 10
```

## Fetching a Single Issue

Fetch a specific issue by number:

```bash
# By issue number (uses default repo if configured)
ralph-starter run --from github --issue 123

# From a specific repo
ralph-starter run --from github --project owner/repo --issue 123

# By full URL
ralph-starter run --from github --project https://github.com/owner/repo/issues/123
```

This fetches:
- Issue title and body
- Labels and state
- All comments

Perfect for building features from well-specified issues.

## Default Issues Repository

Configure a default repository for fetching issues, so you don't need to specify `--project` every time:

```bash
# Set your default issues repo
ralph-starter config set github.defaultIssuesRepo myorg/my-ideas

# Now you can simply run:
ralph-starter run --from github --issue 42
```

This is useful for teams that maintain a central ideas or roadmap repository.

## Options

| Option | Description | Default |
|--------|-------------|---------|
| `--project` | Repository in `owner/repo` format | Configured default or required |
| `--label` | Filter by label name | None |
| `--status` | Filter by status (`open`, `closed`, `all`) | `open` |
| `--limit` | Maximum issues to fetch | 20 |
| `--issue` | Specific issue number to fetch | None |

## Configuration

| Key | Description |
|-----|-------------|
| `github.token` | Personal access token (if not using gh CLI) |
| `github.defaultIssuesRepo` | Default repository for `--issue` without `--project` |

## Issue Format

GitHub issues are converted to specs with:

- **Title** → Spec title
- **Body** → Spec description
- **Labels** → Tags
- **Comments** → Additional context

### Example Issue

```markdown
# Add user authentication

## Description
Add email/password authentication to the app.

## Requirements
- Login form
- Registration form
- Password reset flow
- Session management

## Acceptance Criteria
- [ ] Users can register with email
- [ ] Users can log in
- [ ] Users can reset password
```

### Generated Spec

```markdown
# Add user authentication

Source: GitHub Issue #42 (owner/repo)
Labels: feature, authentication

## Description
Add email/password authentication to the app.

## Requirements
- Login form
- Registration form
- Password reset flow
- Session management

## Acceptance Criteria
- [ ] Users can register with email
- [ ] Users can log in
- [ ] Users can reset password
```

## Preview Issues

Before running, you can preview what will be fetched:

```bash
ralph-starter source preview github --project owner/repo --label "ready"
```

## Test Connection

Verify your authentication:

```bash
ralph-starter source test github
```

## Tips

1. **Use labels effectively** - Create a "ready-to-build" or "ralph" label for issues that are well-specified
2. **Write detailed issues** - Include requirements, acceptance criteria, and context
3. **One issue = one feature** - Keep issues focused for better results
