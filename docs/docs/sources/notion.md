---
sidebar_position: 5
title: Notion
description: Fetch specs from Notion pages
keywords: [notion, pages, integration]
---

# Notion Source

Fetch specifications from Notion pages and databases to build from your documentation.

## Features

- **Full page fetching** - Fetches ALL content with automatic pagination (no 100-block limit)
- **Nested blocks** - Recursively fetches children of toggles, columns, and other container blocks
- **Rich content** - Converts Notion blocks to markdown (headings, lists, code, tables, callouts, etc.)
- **Database support** - Query databases and fetch items with properties

## Authentication

### 1. Create an Integration

1. Go to [Notion Integrations](https://www.notion.so/my-integrations)
2. Click "New integration"
3. Name it "ralph-starter"
4. Select your workspace
5. Copy the "Internal Integration Token"

### 2. Configure ralph-starter

```bash
ralph-starter config set notion.token secret_xxxxxxxxxxxx
```

### 3. Share Pages with Integration

In Notion:
1. Open the page/database you want to use
2. Click "..." menu → "Add connections"
3. Select "ralph-starter"

## Public Pages (No Auth Required)

For **public** Notion pages, you can use the URL source directly without any API key:

```bash
ralph-starter run --from https://notion.so/Your-Public-Page-abc123
```

Note: Public page fetching has limited content extraction because Notion renders content client-side. For full content access, use the API integration above.

## Usage

```bash
# Fetch from a specific database/page
ralph-starter run --from notion --project "Product Specs"

# With limit
ralph-starter run --from notion --project "Feature Ideas" --limit 5
```

## Options

| Option | Description | Default |
|--------|-------------|---------|
| `--project` | Database or page name | Required |
| `--limit` | Maximum items to fetch | 20 |

## Page Format

### Simple Page

```markdown
# Build a Habit Tracker

A mobile app for tracking daily habits with streaks and reminders.

## Features
- Add/edit/delete habits
- Daily check-in
- Streak tracking
- Push notifications

## Tech Stack
- React Native
- SQLite
- Expo
```

### Database of Specs

Create a Notion database with columns:

| Name | Type | Description |
|------|------|-------------|
| Title | Title | Feature name |
| Status | Select | Draft, Ready, Building, Done |
| Priority | Select | Low, Medium, High |
| Description | Text | Feature description |
| Requirements | Text | List of requirements |

ralph-starter fetches items where Status = "Ready" (or as filtered).

## Generated Spec

```markdown
# Build a Habit Tracker

Source: Notion Page
Database: Product Specs

## Description
A mobile app for tracking daily habits with streaks and reminders.

## Features
- Add/edit/delete habits
- Daily check-in
- Streak tracking
- Push notifications

## Tech Stack
- React Native
- SQLite
- Expo
```

## Preview Pages

```bash
ralph-starter source preview notion --project "Product Specs"
```

## Test Connection

```bash
ralph-starter source test notion
```

## Best Practices

### Template for Specs

Create a Notion template with these sections:

```markdown
# [Feature Name]

## Summary
One paragraph describing the feature.

## Problem
What problem does this solve?

## Solution
How will we solve it?

## Requirements
- [ ] Requirement 1
- [ ] Requirement 2
- [ ] Requirement 3

## Technical Notes
Any specific tech requirements or constraints.

## Acceptance Criteria
- [ ] Criteria 1
- [ ] Criteria 2
```

### Database Setup

1. Create a "Specs" database
2. Add Status column with options: Draft, Ready, Building, Done
3. Add Priority column
4. Share with ralph-starter integration
5. Use `--project "Specs"` to fetch

## Supported Block Types

ralph-starter converts the following Notion blocks to markdown:

| Block Type | Markdown Output |
|------------|-----------------|
| Paragraph | Normal text |
| Heading 1/2/3 | `##`, `###`, `####` |
| Bulleted list | `- item` |
| Numbered list | `1. item` |
| To-do | `- [ ]` / `- [x]` |
| Toggle | `<details>` |
| Quote | `> quote` |
| Callout | `> 💡 callout` |
| Code | ` ```lang ``` ` |
| Divider | `---` |
| Image | `![Image](url)` |
| Table | `| cell | cell |` |

**Nested content** (inside toggles, columns, etc.) is properly indented in the output.

## Tips

1. **Use templates** - Create a consistent spec template in Notion
2. **Status tracking** - Use a Status column to mark specs as "Ready"
3. **Rich content** - Notion's blocks (code, callouts, etc.) are converted to markdown
4. **Linked databases** - Reference other pages for additional context
5. **Large pages** - No content limits! Pages with 100+ blocks are fully fetched
