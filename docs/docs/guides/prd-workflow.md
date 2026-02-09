---
sidebar_position: 5
title: "PRD Workflow"
description: "Use markdown PRD files with checkbox tasks to drive autonomous multi-step implementations"
keywords: [prd, tasks, checklist, markdown, batch, implementation-plan, task-executor]
---

# PRD Workflow

A PRD (Product Requirements Document) workflow lets you define a structured list of tasks in a markdown file and have ralph-starter execute them one by one. Instead of describing a single open-ended task, you break the work into discrete checkboxes. The agent works through each checkbox, marking them complete as it goes.

## What Is a PRD File?

A PRD file is a standard markdown file with checkbox-formatted tasks. Ralph-starter parses the file, identifies incomplete tasks, and feeds them to the AI agent in order.

```bash
ralph-starter run --prd ./PRD.md
```

## PRD File Format

A PRD file follows this structure:

```markdown
# Project Title

Optional description paragraph that explains the overall goal.
This text is captured as the PRD description and included in the agent prompt.

## Section Name

- [ ] First task in this section
- [ ] Second task in this section
- [x] Already completed task (will be skipped)

## Another Section

- [ ] Task in another section
- [ ] Another task
```

### Format Rules

| Element | Syntax | Purpose |
|---|---|---|
| Title | `# Heading` | First `#` heading becomes the PRD title |
| Description | Plain text after title, before first task | Context for the agent |
| Section headers | `##` or `###` headings | Group related tasks |
| Incomplete task | `- [ ] Task description` | Work to be done |
| Completed task | `- [x] Task description` | Already done (skipped) |

Both `-` and `*` list markers are supported. The checkbox can use `x` or `X` for completed tasks.

## How Tasks Are Parsed

The PRD parser (`parsePrdFile`) processes your file as follows:

1. **Security check**: The file path is resolved and verified to be within the current working directory. Path traversal attempts (e.g., `../../etc/passwd`) are rejected.

2. **Title extraction**: The first `# Heading` in the file becomes the PRD title. If no heading is found, the title defaults to "Untitled PRD".

3. **Description extraction**: All non-heading text between the title and the first checkbox task is captured as the description.

4. **Section tracking**: `##` and `###` headings are tracked as section names. Each task inherits the section it appears under.

5. **Task parsing**: Lines matching `- [ ] text` or `- [x] text` are extracted as tasks, each with:
   - `name`: The task description text
   - `completed`: Whether the checkbox is checked
   - `index`: The task's position (0-based)
   - `section`: The section header it belongs to (if any)

## How Tasks Are Executed

When you run `ralph-starter run --prd ./PRD.md`, the following happens:

### Step 1: Parse and Filter

The parser reads the file and filters to only **incomplete** tasks (`- [ ]`). Already completed tasks (`- [x]`) are counted for progress display but skipped.

### Step 2: Build the Agent Prompt

Ralph-starter generates a structured prompt for the agent that includes:

```markdown
# Project Title

Description from the PRD...

## Task Progress

- Completed: 3/10
- Remaining: 7

## Tasks to Complete

### Section Name

- [ ] First task
- [ ] Second task

### Another Section

- [ ] Third task

## Instructions

Work through the tasks above one by one. Focus on completing each task
fully before moving to the next.
After completing a task, mark it as done by changing `- [ ]` to `- [x]`
in the original PRD file.
```

If tasks span multiple sections, they are grouped under their section headers. If all tasks are in a single section (or have no section), they are shown as a flat list.

### Step 3: Agent Loop

The agent receives this prompt and begins working. After completing each task, it is instructed to check off the corresponding checkbox in the original PRD file by changing `- [ ]` to `- [x]`.

### Step 4: Progress Tracking

Each time the agent modifies the PRD file, ralph-starter can re-parse it to see updated progress. The `getPrdStats` function returns:

```typescript
{
  total: 10,        // Total tasks
  completed: 5,     // Checked off
  pending: 5,       // Remaining
  percentComplete: 50  // Percentage
}
```

## Combining with Loop Flags

The PRD workflow works with all standard loop flags:

### With `--commit`

Auto-commit after each successful iteration. This creates a git history where each commit corresponds to progress on the PRD.

```bash
ralph-starter run --prd ./PRD.md --commit
```

### With `--validate`

Run tests, lint, and build after each iteration. If validation fails, the agent gets the error output and fixes the issue before moving to the next task.

```bash
ralph-starter run --prd ./PRD.md --validate --commit
```

### With `--push` and `--pr`

Push changes and create a pull request when the loop completes.

```bash
ralph-starter run --prd ./PRD.md --commit --push --pr
```

### With a Preset

Combine PRD-driven execution with a preset's configuration:

```bash
ralph-starter run --prd ./PRD.md --preset feature
```

This gives you the `feature` preset's settings (30 max iterations, validation, commits, circuit breaker) while using the PRD file for task structure.

### With `--max-iterations`

Set an iteration limit to prevent runaway execution:

```bash
ralph-starter run --prd ./PRD.md --max-iterations 20
```

## Example PRD Files

### Example: New Feature

```markdown
# User Authentication System

Implement a complete authentication system with email/password login,
registration, and session management.

## Database

- [ ] Create users table migration with email, password_hash, created_at
- [ ] Create sessions table migration with user_id, token, expires_at
- [ ] Add database indexes for email and session token lookups

## API Endpoints

- [ ] POST /api/auth/register - Create new user account
- [ ] POST /api/auth/login - Authenticate and return session token
- [ ] POST /api/auth/logout - Invalidate current session
- [ ] GET /api/auth/me - Return current user profile

## Middleware

- [ ] Create authentication middleware that validates session tokens
- [ ] Add rate limiting to auth endpoints (5 attempts per minute)

## Validation

- [ ] Validate email format on registration
- [ ] Enforce password minimum length (8 characters)
- [ ] Return proper error messages for duplicate emails

## Tests

- [ ] Unit tests for password hashing
- [ ] Integration tests for registration flow
- [ ] Integration tests for login flow
- [ ] Test session expiration behavior
```

### Example: Bug Fix Checklist

```markdown
# Fix: Shopping Cart Race Condition

Users report items disappearing from their cart during concurrent updates.

## Investigation

- [ ] Add logging to cart update endpoint to capture request timing
- [ ] Reproduce the race condition with concurrent API calls
- [ ] Document the exact sequence that causes the bug

## Fix

- [ ] Add optimistic locking to cart_items table (version column)
- [ ] Update cart update endpoint to use compare-and-swap
- [ ] Handle version conflict with retry logic (max 3 retries)

## Verification

- [ ] Write test that simulates concurrent cart updates
- [ ] Verify no data loss under concurrent modification
- [ ] Remove temporary debug logging
```

### Example: Refactoring Plan

```markdown
# Refactor: Extract Payment Processing Module

The payment logic is scattered across multiple controllers. Extract it
into a dedicated module with a clean interface.

## Preparation

- [x] Map all files that contain payment-related code
- [x] Document the current payment flow

## Extraction

- [ ] Create src/payments/types.ts with payment interfaces
- [ ] Create src/payments/processor.ts with core payment logic
- [ ] Create src/payments/validators.ts for payment validation
- [ ] Move Stripe integration code to src/payments/providers/stripe.ts

## Migration

- [ ] Update OrderController to use new payment module
- [ ] Update SubscriptionController to use new payment module
- [ ] Update WebhookHandler to use new payment module
- [ ] Remove duplicate payment code from old locations

## Cleanup

- [ ] Update imports across the codebase
- [ ] Run full test suite and fix any failures
- [ ] Update API documentation to reflect new module structure
```

## Tips

### Keep Tasks Atomic

Each checkbox should be a single, well-defined unit of work. Avoid tasks like "implement the entire backend" -- break that into specific endpoints, models, and tests.

### Order Tasks by Dependency

Put foundational tasks first (database migrations before API endpoints, interfaces before implementations). The agent works through tasks in order, so dependencies should be resolved before dependent tasks.

### Use Sections for Organization

Group related tasks under `##` headers. This makes the PRD easier to read and helps the agent understand the logical structure of the work.

### Pre-Check Completed Work

If some tasks are already done, mark them with `[x]` before starting. The agent will see the progress ratio and skip completed items.

### Combine with `--validate`

For best results, always use `--validate` with PRD workflows. This ensures each task produces code that passes your test suite before the agent moves on to the next task.
