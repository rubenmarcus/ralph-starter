# Integration Roadmap

> Community-driven roadmap for ralph-starter integrations. PRs welcome!

## Available Now

- [x] **GitHub** - Issues, PRs, files (via `gh` CLI)
- [x] **Linear** - Issues (via CLI auth or API key)
- [x] **Notion** - Public pages (HTML fetch)

## High Priority

- [ ] **Figma** - Design specs, components
- [ ] **Jira** - Enterprise PM
- [ ] **GitLab** - Self-hosted git
- [ ] **Confluence** - Enterprise docs

## Medium Priority

- [ ] **Graphite** - Stacked PRs (via `gt` CLI)
- [ ] **Asana** - Task management
- [ ] **Todoist** - Tasks (API key)
- [ ] **Slack** - Channel messages
- [ ] **Bitbucket** - Atlassian git

## AI Tools

- [ ] **Lovable** - AI UI designs → Ralph builds
- [ ] **v0.dev** - Vercel AI components
- [ ] **Bolt.new** - StackBlitz AI

## Low Priority

- [ ] **Trello** - Kanban boards
- [ ] **Monday.com** - Work OS
- [ ] **ClickUp** - Project management
- [ ] **Basecamp** - Team communication

---

## How to Contribute

Want to add a new integration? See the [Creating Integrations Guide](https://ralphstarter.ai/docs/guides/creating-integrations).

Each integration lives in `src/integrations/<name>/` with:
- `index.ts` - Main export
- `source.ts` - Data fetching logic
- `auth.ts` - Authentication (if needed)
- `README.md` - Documentation

### Quick Start

```bash
# Copy the template
cp -r src/integrations/_template src/integrations/your-service

# Edit the files
# Then register in src/integrations/index.ts
```

---

## Request an Integration

Open an issue with:
- Service name and URL
- What data you want to fetch (issues, tasks, docs, etc.)
- Authentication method (API key, OAuth, CLI)
