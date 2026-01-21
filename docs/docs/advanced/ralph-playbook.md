---
sidebar_position: 1
title: Ralph Playbook
description: Understanding the Ralph Playbook methodology
keywords: [ralph playbook, methodology, workflow, agents]
---

# Ralph Playbook

ralph-starter follows the [Ralph Playbook](https://claytonfarr.github.io/ralph-playbook/) methodology for structuring AI-assisted development.

## Overview

The Ralph Playbook is a set of conventions for organizing projects so AI coding agents can work effectively. It provides:

1. **Clear instructions** for agents
2. **Structured specifications**
3. **Prioritized task lists**
4. **Validation commands**

## Files

### AGENTS.md

The main configuration file for AI agents.

```markdown
# AGENTS.md

## Project: my-app

### Overview
Brief description of the project.

### Tech Stack
- Frontend: React with TypeScript
- Backend: Node.js with Express
- Database: PostgreSQL

### Validation Commands
- test: npm test
- lint: npm run lint
- build: npm run build
- typecheck: npm run typecheck

### Coding Standards
- Use TypeScript strict mode
- Follow ESLint rules
- Write tests for new features

### File Structure
src/
├── components/    # React components
├── pages/         # Page components
├── api/           # API routes
├── lib/           # Utilities
└── types/         # TypeScript types
```

### PROMPT_plan.md

Instructions for planning mode.

```markdown
# Planning Mode

You are analyzing specifications to create an implementation plan.

## Instructions
1. Read all specs in `specs/`
2. Identify dependencies between features
3. Prioritize tasks (setup → core → polish)
4. Create detailed task breakdowns

## Output
Write to IMPLEMENTATION_PLAN.md with:
- Overview section
- Phased task list with checkboxes
- Dependencies
- Notes for implementation
```

### PROMPT_build.md

Instructions for building mode.

```markdown
# Building Mode

You are implementing tasks from the implementation plan.

## Instructions
1. Read IMPLEMENTATION_PLAN.md
2. Find the next unchecked task
3. Implement it completely
4. Run validation commands
5. Mark task as complete

## Guidelines
- Follow coding standards in AGENTS.md
- Write tests for new features
- Keep commits atomic and descriptive
```

### IMPLEMENTATION_PLAN.md

The prioritized task list.

```markdown
# Implementation Plan

## Overview
Building a habit tracking application.

## Tasks

### Phase 1: Setup
- [x] Initialize React project
- [x] Set up TypeScript
- [ ] Configure ESLint and Prettier

### Phase 2: Core Features
- [ ] Create habit list component
- [ ] Add habit creation form
- [ ] Implement habit tracking logic
- [ ] Add streak calculation

### Phase 3: Polish
- [ ] Add animations
- [ ] Improve error handling
- [ ] Write tests
```

### specs/

Directory containing feature specifications.

```
specs/
├── user-auth.md
├── dashboard.md
├── settings.md
└── notifications.md
```

## Workflow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Specs     │ ──▶ │    Plan     │ ──▶ │   Build     │
│ (specs/*.md)│     │(IMPL_PLAN)  │     │(code + test)│
└─────────────┘     └─────────────┘     └─────────────┘
       │                  │                   │
       ▼                  ▼                   ▼
  Requirements      Task breakdown       Working code
```

1. **Write Specs**: Define what to build in `specs/`
2. **Plan**: Run `ralph-starter plan` to create task list
3. **Build**: Run `ralph-starter run` to implement tasks
4. **Validate**: Each iteration runs tests/lint/build
5. **Commit**: Changes are committed with meaningful messages

## Best Practices

### Writing Good Specs

```markdown
# Feature: User Dashboard

## Description
A dashboard showing user's habits and progress.

## Requirements
- [ ] Display list of habits
- [ ] Show completion status for today
- [ ] Display streak counts
- [ ] Weekly progress chart

## Technical Notes
- Use React Query for data fetching
- Chart.js for visualizations
- Mobile-responsive design

## Acceptance Criteria
- Dashboard loads in under 2 seconds
- Works on mobile devices
- Shows accurate streak counts
```

### AGENTS.md Tips

1. **Be specific about tech stack** - Include versions if important
2. **List all validation commands** - test, lint, build, typecheck
3. **Document file structure** - Help agent navigate codebase
4. **Include coding standards** - ESLint config, naming conventions

### Task Breakdown

Good task breakdown:
```markdown
- [ ] Create UserDashboard component
- [ ] Add habit list with completion toggles
- [ ] Implement streak calculation utility
- [ ] Add weekly chart component
- [ ] Connect to API endpoints
- [ ] Add loading states
- [ ] Write component tests
```

Bad task breakdown:
```markdown
- [ ] Build dashboard
```

## See Also

- [Validation](/docs/advanced/validation)
- [Git Automation](/docs/advanced/git-automation)
- [Ralph Playbook (Original)](https://claytonfarr.github.io/ralph-playbook/)
