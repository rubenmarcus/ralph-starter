---
sidebar_position: 4
title: Linear
description: Fetch specs from Linear issues
keywords: [linear, issues, integration]
---

# Linear Source

Fetch specifications from Linear issues to build features from your project management tool.

## Authentication

Get your API key from [Linear Settings > API > Personal API keys](https://linear.app/settings/api).

```bash
ralph-starter config set linear.apiKey lin_api_xxxxxxxxxxxx
```

## Usage

```bash
# Fetch issues by label
ralph-starter run --from linear --label "ready-to-build"

# Filter by project
ralph-starter run --from linear --project "Mobile App"

# Filter by status
ralph-starter run --from linear --status "In Progress"

# Combine filters
ralph-starter run --from linear --project "Web App" --label "sprint-1" --limit 10
```

## Options

| Option | Description | Default |
|--------|-------------|---------|
| `--project` | Project name | None (all projects) |
| `--label` | Filter by label | None |
| `--status` | Filter by status | None |
| `--limit` | Maximum issues to fetch | 20 |

## Issue Format

Linear issues are well-suited for ralph-starter because they typically contain:

- Title
- Description (with markdown support)
- Acceptance criteria
- Sub-issues
- Labels and priority

### Example Linear Issue

```markdown
Title: Add user authentication

Description:
Implement email/password authentication for the web app.

## Requirements
- Login page with email/password
- Registration with email verification
- Password reset flow
- Remember me functionality

## Technical Notes
- Use NextAuth.js
- Store sessions in database
- Add rate limiting

## Acceptance Criteria
- [ ] User can register with email
- [ ] User receives verification email
- [ ] User can log in
- [ ] User can reset password
```

## Generated Spec

```markdown
# Add user authentication

Source: Linear Issue ENG-123
Project: Web App
Labels: feature, authentication
Priority: High

## Description
Implement email/password authentication for the web app.

## Requirements
- Login page with email/password
- Registration with email verification
- Password reset flow
- Remember me functionality

## Technical Notes
- Use NextAuth.js
- Store sessions in database
- Add rate limiting

## Acceptance Criteria
- [ ] User can register with email
- [ ] User receives verification email
- [ ] User can log in
- [ ] User can reset password
```

## Preview Issues

```bash
ralph-starter source preview linear --label "ready-to-build"
```

## Test Connection

```bash
ralph-starter source test linear
```

## Workflow Integration

### Recommended Labels

Create these labels in Linear:
- `ralph-ready` - Issue is well-specified and ready to build
- `ralph-building` - Currently being built by ralph-starter
- `ralph-done` - Built by ralph-starter

### Automation Ideas

1. Move issues to "In Progress" when ralph-starter starts
2. Add comments with build progress
3. Close issues when build succeeds

## Tips

1. **Write detailed issues** - Linear's rich markdown support is perfect for detailed specs
2. **Use acceptance criteria** - Checkboxes become testable requirements
3. **Link related issues** - Sub-issues provide additional context
4. **Add technical notes** - Specify tech preferences in the description
