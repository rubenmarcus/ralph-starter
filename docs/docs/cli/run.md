---
sidebar_position: 1
title: run
description: Run an autonomous AI coding loop
keywords: [cli, run, command, coding loop]
---

# ralph-starter run

Run an autonomous AI coding loop.

## Synopsis

```bash
ralph-starter run [task] [options]
```

## Description

The `run` command executes an autonomous coding loop. The AI agent works on tasks iteratively until completion.

## Arguments

| Argument | Description |
|----------|-------------|
| `task` | Optional task description. If not provided, uses the implementation plan. |

## Options

| Option | Description | Default |
|--------|-------------|---------|
| `--auto` | Skip permission prompts | false |
| `--commit` | Auto-commit after each task | false |
| `--push` | Push commits to remote | false |
| `--pr` | Create pull request when done | false |
| `--validate` | Run tests/lint/build after iterations | false |
| `--prd <file>` | Read tasks from markdown PRD | - |
| `--agent <name>` | Specify agent (claude-code, cursor, codex, opencode) | auto-detect |
| `--max-iterations <n>` | Maximum loop iterations | 50 |
| `--from <source>` | Fetch spec from source | - |
| `--project <name>` | Project filter for sources | - |
| `--label <name>` | Label filter for sources | - |
| `--status <status>` | Status filter for sources | - |
| `--limit <n>` | Max items from source | 20 |
| `--issue <n>` | Specific issue number (for GitHub) | - |
| `--output-dir <path>` | Directory to run the task in | cwd |

## Examples

### Basic Usage

```bash
# Run a single task
ralph-starter run "build a todo app with React"

# Run from implementation plan
ralph-starter run
```

### With Git Automation

```bash
# Auto-commit changes
ralph-starter run "add login page" --commit

# Commit and push
ralph-starter run "fix bug" --commit --push

# Full automation with PR
ralph-starter run "add feature" --commit --push --pr
```

### With Validation

```bash
# Run tests/lint/build after each iteration
ralph-starter run "refactor auth" --validate

# Combine with commit
ralph-starter run "add tests" --commit --validate
```

### From External Sources

```bash
# From URL
ralph-starter run --from https://example.com/spec.md

# From GitHub
ralph-starter run --from github --project owner/repo --label "ready"

# From a specific GitHub issue
ralph-starter run --from github --project owner/repo --issue 123

# From Linear
ralph-starter run --from linear --label "in-progress"
```

### Project Location

When fetching from integration sources (GitHub, Linear, Notion), you'll be prompted where to run the task:

```
? Where do you want to run this task?
  ❯ Current directory (/Users/you/current)
    Create new project folder
    Enter custom path
```

To skip the prompt:

```bash
# Use --output-dir to specify the directory
ralph-starter run --from github --project owner/repo --issue 42 --output-dir ~/projects/new-app

# Use --auto for non-interactive mode (uses current directory)
ralph-starter run --from github --project owner/repo --issue 42 --auto
```

### Advanced

```bash
# Specify agent
ralph-starter run "build API" --agent claude-code

# Limit iterations
ralph-starter run "complex task" --max-iterations 100

# Full automation
ralph-starter run --auto --commit --validate --max-iterations 30
```

## Behavior

1. **Task Resolution**:
   - If `task` provided → use that task
   - If `--from` provided → fetch spec from source
   - Otherwise → read from IMPLEMENTATION_PLAN.md

2. **Loop Execution**:
   - Agent works on task
   - If `--validate` → run validation commands
   - If validation fails → agent fixes issues
   - If `--commit` → commit changes
   - Repeat until task complete or max iterations

3. **Completion**:
   - If `--push` → push to remote
   - If `--pr` → create pull request

## Exit Codes

| Code | Description |
|------|-------------|
| 0 | Success |
| 1 | Error (validation failed, agent error, etc.) |

## See Also

- [ralph-starter init](/docs/cli/init)
- [ralph-starter plan](/docs/cli/plan)
- [Input Sources](/docs/sources/overview)
