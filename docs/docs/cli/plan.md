---
sidebar_position: 3
title: plan
description: Create implementation plan from specs
keywords: [cli, plan, command, implementation]
---

# ralph-starter plan

Create an implementation plan from specifications.

## Synopsis

```bash
ralph-starter plan [options]
```

## Description

The `plan` command analyzes specs in the `specs/` directory and generates an `IMPLEMENTATION_PLAN.md` with prioritized tasks.

## Options

| Option | Description | Default |
|--------|-------------|---------|
| `--auto` | Run in automated mode (skip prompts) | false |

## Prerequisites

- Ralph Playbook initialized (`ralph-starter init`)
- At least one spec file in `specs/` directory

## Examples

```bash
# Interactive planning
ralph-starter plan

# Automated planning
ralph-starter plan --auto
```

## How It Works

1. **Read Specs**: Scans `specs/` for markdown files
2. **Analyze**: AI analyzes requirements and dependencies
3. **Prioritize**: Creates ordered task list
4. **Generate**: Writes IMPLEMENTATION_PLAN.md

## Generated Plan Format

```markdown
# Implementation Plan

## Overview
Brief summary of the project.

## Tasks

### Phase 1: Setup
- [ ] Initialize project structure
- [ ] Set up development environment
- [ ] Configure build tools

### Phase 2: Core Features
- [ ] Implement user authentication
- [ ] Create main dashboard
- [ ] Add data persistence

### Phase 3: Polish
- [ ] Add error handling
- [ ] Write tests
- [ ] Documentation

## Dependencies
- Task B depends on Task A
- Task C depends on Task B

## Notes
Additional context for the AI agent.
```

## Spec File Format

For best results, write detailed specs:

```markdown
# Feature: User Authentication

## Description
Add email/password authentication to the application.

## Requirements
- Login form with email and password
- Registration with email verification
- Password reset flow
- Session management

## Technical Notes
- Use NextAuth.js
- Store sessions in database
- Implement rate limiting

## Acceptance Criteria
- [ ] User can register with email
- [ ] User can log in
- [ ] User can reset password
- [ ] Sessions persist across page loads
```

## Workflow

```bash
# 1. Initialize
ralph-starter init

# 2. Write specs
echo "# My Feature\n\nDescription here..." > specs/feature.md

# 3. Create plan
ralph-starter plan

# 4. Review plan
cat IMPLEMENTATION_PLAN.md

# 5. Start building
ralph-starter run
```

## Tips

1. **One spec per feature** - Keep specs focused
2. **Include acceptance criteria** - Helps AI know when task is complete
3. **Add technical notes** - Specify tech preferences
4. **Review the plan** - Check the generated plan before running

## See Also

- [ralph-starter init](/cli/init)
- [ralph-starter run](/cli/run)
- [Ralph Playbook](/advanced/ralph-playbook)
