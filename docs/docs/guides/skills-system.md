---
sidebar_position: 6
title: "Skills System"
description: "Discover, install, and create Claude Code skills that enhance agent behavior in ralph-starter loops"
keywords: [skills, claude-code, agent-skills, add-skill, global-skills, project-skills, tech-stack]
---

# Skills System

Skills are markdown files that provide domain-specific knowledge to AI agents during ralph-starter loops. A skill might teach the agent React best practices, Next.js patterns, or your team's coding conventions. When skills are detected, their content is injected into the agent's prompt, giving it specialized knowledge it would not otherwise have.

## Three Skill Sources

Ralph-starter detects skills from three locations, checked in order:

### 1. Global Skills (`~/.claude/skills/`)

Skills installed in your home directory's `.claude/skills/` folder are available to every project on your machine.

```
~/.claude/skills/
  react-best-practices.md
  typescript-patterns.md
  testing-strategies.md
```

Each `.md` file in this directory is treated as a skill. The filename (without extension) becomes the skill name.

### 2. Project Skills (`.claude/skills/`)

Skills placed in your project's `.claude/skills/` directory are specific to that project. These override or supplement global skills and can encode project-specific conventions.

```
your-project/
  .claude/
    skills/
      api-conventions.md
      database-patterns.md
```

### 3. Skills from `skills.sh`

Ralph-starter also checks for a `skills.sh` script in three locations:

1. `./skills.sh` (project root)
2. `./.claude/skills.sh` (project's .claude directory)
3. `~/.claude/skills.sh` (global)

The `skills.sh` file is parsed for skill declarations using the comment format `# Skill: SkillName`. This is a common pattern used by skill installation tools.

```bash
#!/bin/bash
# Skill: react-best-practices
# Skill: nextjs-app-router
# Skill: vercel-deployment

# Installation logic below...
npx add-skill vercel-labs/agent-skills
```

## Skill File Format

A skill file is a standard markdown document. The first heading becomes the display name, and the first paragraph after the heading becomes the description.

```markdown
# React Best Practices

Guidelines for writing clean, performant React components.

## Component Structure

- Use functional components with hooks
- Keep components small and focused (under 200 lines)
- Extract custom hooks for shared logic

## State Management

- Use `useState` for local component state
- Use `useReducer` for complex state logic
- Lift state up only when needed by sibling components

## Performance

- Wrap expensive computations in `useMemo`
- Use `useCallback` for event handlers passed as props
- Avoid creating new objects/arrays in render
```

The description extraction takes the first non-empty, non-heading line after the title and truncates it to 100 characters. In the example above, the description would be: "Guidelines for writing clean, performant React components."

## Tech-Stack Filtering

Not all skills are relevant to every task. Ralph-starter can filter skills based on your project's tech stack using the `getRelevantSkills` function. This function matches skill names and descriptions against keywords derived from your stack.

The tech stack is expressed as:

```typescript
{
  frontend?: string;   // e.g., "react", "vue", "svelte"
  backend?: string;    // e.g., "express", "fastify", "nodejs"
  database?: string;   // e.g., "postgres", "mongodb"
  styling?: string;    // e.g., "tailwind"
  language?: string;   // e.g., "typescript"
}
```

### Keyword Expansion

To improve matching, tech-stack keywords are automatically expanded with related terms:

| Keyword | Expanded To |
|---|---|
| `react` | jsx, component, hook |
| `nextjs` | react, ssr, app-router |
| `astro` | static, island |
| `vue` | composition, template |
| `svelte` | component, reactive |
| `nodejs` | node, npm, javascript |
| `express` | api, rest, middleware |
| `fastify` | api, rest |
| `postgres` | sql, database, pg |
| `mongodb` | nosql, document, mongo |
| `tailwind` | css, utility, style |
| `typescript` | ts, type, typed |

For example, if your project uses `react` and `typescript`, the filter checks skill names and descriptions for: `react`, `jsx`, `component`, `hook`, `typescript`, `ts`, `type`, and `typed`.

A skill named `react-best-practices` matches on `react`. A skill named `typed-api-patterns` matches on `typed` (expanded from `typescript`).

## How Skills Are Injected into Agent Prompts

When skills are detected, ralph-starter formats them into a prompt section using `formatSkillsForPrompt`:

```markdown
## Available Claude Code Skills

- **react-best-practices**: Guidelines for writing clean, performant React components.
- **typescript-patterns**: TypeScript patterns and idioms for large codebases.
- **api-conventions**: REST API conventions for this project.

Use these skills when appropriate by invoking them with /skill-name.
```

This block is included in the agent's system context, making the agent aware of the available skills and their purposes.

## Installing Skills with the CLI

Ralph-starter provides a `skill` command for managing skills:

### Install a Skill

```bash
# Install from a GitHub repository
ralph-starter skill add vercel-labs/agent-skills

# Install globally (available to all projects)
ralph-starter skill add vercel-labs/agent-skills --global
```

This uses the `add-skill` CLI tool under the hood (`npx add-skill <repo>`). If `add-skill` is not installed, it runs via `npx` automatically.

### List Popular Skills

```bash
ralph-starter skill list
```

This shows curated skill repositories:

```
Popular Skills

  vercel-labs/agent-skills
  React, Next.js, and Vercel best practices
  Skills: react-best-practices, nextjs-best-practices, vercel-best-practices, web-design-review
```

### Search for Skills

```bash
ralph-starter skill search react
```

Searches the curated skill registry by name, description, and skill names.

### Browse Interactively

```bash
ralph-starter skill browse
```

Opens an interactive menu where you can select a skill to install.

## Creating Your Own Skills

### Step 1: Create the Directory

For project-specific skills:

```bash
mkdir -p .claude/skills
```

For global skills:

```bash
mkdir -p ~/.claude/skills
```

### Step 2: Write the Skill File

Create a markdown file with your domain knowledge:

```markdown
# Our API Conventions

REST API patterns and conventions for the Acme project.

## URL Structure

- Use kebab-case for URL segments: `/api/user-profiles`
- Version the API in the URL: `/api/v1/users`
- Use plural nouns for collections: `/api/v1/orders`

## Request/Response Format

- Always return JSON with a consistent envelope:
  ```json
  {
    "data": {},
    "meta": { "requestId": "..." },
    "errors": []
  }
  ```

## Error Handling

- Use standard HTTP status codes
- Include error code, message, and field for validation errors
- Log all 5xx errors with request context

## Authentication

- Use Bearer tokens in the Authorization header
- Tokens expire after 24 hours
- Refresh tokens are issued alongside access tokens

## Database Queries

- Always use parameterized queries
- Include pagination for list endpoints (default: 20, max: 100)
- Use cursor-based pagination for large datasets
```

Save this as `.claude/skills/api-conventions.md` in your project.

### Step 3: Verify Detection

You can verify skills are detected by checking the `hasSkills` function or running a loop with verbose output. The detected skills will show their name, source, and description:

```
Detected skills:
- api-conventions (project): REST API patterns and conventions for the Acme project.
- react-best-practices (global): Guidelines for writing clean, performant React components.
```

## Practical Examples

### Example: Team Coding Standards

Create `.claude/skills/team-standards.md`:

```markdown
# Team Coding Standards

Coding standards for the engineering team.

## General Rules

- Maximum file length: 300 lines
- Maximum function length: 50 lines
- All public functions must have JSDoc comments
- No `any` types in TypeScript -- use `unknown` and narrow

## Naming Conventions

- Components: PascalCase (e.g., `UserProfile`)
- Hooks: camelCase with `use` prefix (e.g., `useUserData`)
- Utils: camelCase (e.g., `formatCurrency`)
- Constants: SCREAMING_SNAKE_CASE (e.g., `MAX_RETRY_COUNT`)
- Files: kebab-case (e.g., `user-profile.tsx`)

## Testing

- Every new function needs at least one test
- Use `describe` blocks to group related tests
- Test file naming: `*.test.ts` or `*.spec.ts`
- Mock external dependencies, never mock internal modules
```

### Example: Database Patterns

Create `.claude/skills/database-patterns.md`:

```markdown
# Database Patterns

Database access patterns for our PostgreSQL setup.

## Migrations

- Use sequential numbering: `001_create_users.sql`
- Always include a down migration
- Never modify a migration that has been applied to production

## Queries

- Use the query builder, not raw SQL
- Always include `WHERE` clauses on UPDATE and DELETE
- Use transactions for multi-table operations

## Indexing

- Add indexes for all foreign keys
- Add indexes for columns used in WHERE clauses
- Use partial indexes for soft-deleted records
```

### Example: Using Skills with Presets

Skills are automatically detected and injected regardless of which preset you use:

```bash
# Skills are injected into the agent prompt automatically
ralph-starter run "add user profile endpoint" --preset api-design

# The agent will see both the api-design preset instructions AND
# any relevant skills (like api-conventions.md and database-patterns.md)
```

## Skill Precedence

When skills from multiple sources have the same name, all of them are included. They are listed in discovery order: global first, then project, then `skills.sh`. This means project skills appear after global skills in the prompt, giving them a "last word" effect -- the agent tends to weight later instructions more heavily.

For explicit overrides, use a project skill with the same name as a global skill and include a note like "This overrides the global skill" at the top.
