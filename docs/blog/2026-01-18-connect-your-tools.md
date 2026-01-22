---
slug: connect-your-tools
title: "Connect Your Tools: From Spec to Code in One Command"
authors: [ralph]
tags: [integrations, github, linear, notion, workflow]
---

# Connect Your Tools: From Spec to Code in One Command

Your specifications already exist. They're in GitHub issues, Linear tickets, Notion docs, and markdown files. Why copy-paste them into an AI chat?

<!-- truncate -->

## The Copy-Paste Problem

Here's a typical workflow with AI coding assistants:

1. Open your GitHub issue
2. Copy the description
3. Paste into AI chat
4. Copy linked context
5. Paste that too
6. Ask the AI to implement
7. Copy the code back
8. Create a branch, commit, push
9. Update the issue

That's a lot of manual work. And context gets lost along the way.

## One Command, Full Context

ralph-starter connects directly to your tools:

```bash
# Fetch from GitHub and implement
ralph-starter run --github "myorg/myrepo#123" --commit --pr

# Fetch from Linear
ralph-starter run --linear "PROJ-456" --commit

# Fetch from Notion
ralph-starter run --notion "abc123" --commit
```

Everything flows automatically:
- **Spec** → fetched from your tool
- **Context** → linked files, comments, attachments
- **Implementation** → autonomous coding loops
- **Validation** → tests, lint, build
- **Delivery** → commit, push, PR

## Supported Integrations

### GitHub Issues & PRs

```bash
ralph-starter run --github "owner/repo#123"
```

Fetches:
- Issue/PR title and body
- Comments and discussion
- Linked files and references
- Labels and metadata

### Linear Tickets

```bash
ralph-starter run --linear "PROJ-123"
```

Fetches:
- Ticket title and description
- Sub-issues and parent context
- Attachments and links
- Priority and status

### Notion Pages

```bash
ralph-starter run --notion "page-id"
```

Fetches:
- Page content (markdown converted)
- Linked databases
- Child pages
- Embedded files

### Local Files & URLs

```bash
# Local spec file
ralph-starter run --from ./specs/auth-feature.md

# Remote URL
ralph-starter run --from "https://example.com/spec.md"
```

## Combining Sources

Need context from multiple places? Combine them:

```bash
ralph-starter run \
  --github "owner/repo#123" \
  --from ./additional-context.md \
  --loops 5 \
  --commit
```

## Authentication

Set up once, use everywhere:

```bash
# GitHub (uses gh CLI or GITHUB_TOKEN)
gh auth login

# Linear
export LINEAR_API_KEY="lin_api_xxx"

# Notion
export NOTION_TOKEN="secret_xxx"
```

## What's Next

We're adding more integrations:
- Jira
- Asana
- Trello
- Slack threads
- Discord messages

Your workflow, your tools, your way.

---

Ready to connect? Check out the [integrations guide](/docs/sources/overview).
