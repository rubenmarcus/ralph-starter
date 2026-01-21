---
sidebar_position: 3
title: Todoist
description: Fetch specs from Todoist tasks
keywords: [todoist, tasks, integration]
---

# Todoist Source

Fetch specifications from Todoist tasks to turn your todo items into built projects.

## Authentication

Get your API key from [Todoist Settings > Integrations > Developer](https://todoist.com/app/settings/integrations/developer).

```bash
ralph-starter config set todoist.apiKey your-api-key
```

## Usage

```bash
# Fetch tasks from a project
ralph-starter run --from todoist --project "My App Ideas"

# Filter by label
ralph-starter run --from todoist --label "build"

# Combine filters
ralph-starter run --from todoist --project "Side Projects" --label "priority"

# Limit results
ralph-starter run --from todoist --project "Inbox" --limit 5
```

## Options

| Option | Description | Default |
|--------|-------------|---------|
| `--project` | Project name | None (all projects) |
| `--label` | Filter by label | None |
| `--limit` | Maximum tasks to fetch | 20 |

## Task Format

For best results, write detailed Todoist tasks:

### Simple Task

```
Build a habit tracker app
```

### Detailed Task (Better Results)

```
Build a habit tracker app

Requirements:
- Track daily habits
- Show streak counts
- Weekly/monthly views
- Reminder notifications

Tech: React + SQLite
```

### With Subtasks

Main task with subtasks are combined into a single spec:

```
Build a habit tracker app
  ├─ Create habit list UI
  ├─ Add habit tracking logic
  ├─ Implement streak calculation
  └─ Add notification system
```

## Generated Spec

```markdown
# Build a habit tracker app

Source: Todoist
Project: Side Projects
Labels: build, priority

## Description
Build a habit tracker app

## Requirements
- Track daily habits
- Show streak counts
- Weekly/monthly views
- Reminder notifications

## Subtasks
- [ ] Create habit list UI
- [ ] Add habit tracking logic
- [ ] Implement streak calculation
- [ ] Add notification system
```

## Preview Tasks

```bash
ralph-starter source preview todoist --project "My App Ideas"
```

## Test Connection

```bash
ralph-starter source test todoist
```

## Tips

1. **Use a dedicated project** - Create a "To Build" or "ralph-starter" project for well-defined tasks
2. **Add descriptions** - Click on a task and add details in the description field
3. **Use labels** - Tag tasks as "ready" or "detailed" when they're well-specified
4. **Subtasks = requirements** - Use subtasks to break down the feature into requirements
