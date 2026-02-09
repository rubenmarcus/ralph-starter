---
sidebar_position: 2
title: auto
description: Autonomous batch task processing from GitHub and Linear
keywords: [cli, auto, command, batch, autonomous, github, linear, pull request]
---

# ralph-starter auto

Autonomous batch task processing. Fetches multiple tasks from GitHub or Linear, creates branches, implements each task, commits changes, and creates pull requests -- all without human intervention.

## Synopsis

```bash
ralph-starter auto --source <source> [options]
```

## Description

The `auto` command runs ralph-starter in fully autonomous mode. It fetches a batch of tasks from an external source (GitHub issues or Linear tickets), then processes each one sequentially:

1. **Fetch** -- Retrieves open tasks matching your filters from GitHub or Linear.
2. **Branch** -- Creates a dedicated branch for each task (e.g., `auto/<task-id>`).
3. **Implement** -- Invokes the best available coding agent to work on the task.
4. **Validate** -- Runs tests, lint, and build to verify the implementation (enabled by default).
5. **Commit & Push** -- Commits changes and pushes to the remote repository.
6. **Pull Request** -- Opens a PR for the completed work.
7. **Mark Complete** -- Updates the task status in the source system.

The command must be run inside a git repository. It will warn you if there are uncommitted changes before starting.

## Options

| Option | Description | Default |
|--------|-------------|---------|
| `--source <source>` | **Required.** Source to fetch tasks from (`github` or `linear`) | - |
| `--project <name>` | Project identifier. Required for GitHub (`owner/repo`), optional for Linear. | - |
| `--label <name>` | Filter tasks by label (e.g., `"auto-ready"`, `"bug"`) | - |
| `--limit <n>` | Maximum number of tasks to process | `10` |
| `--dry-run` | Preview mode -- show tasks without executing any changes | `false` |
| `--skip-pr` | Skip pull request creation (commit and push only) | `false` |
| `--agent <name>` | Specify which coding agent to use (e.g., `claude-code`, `cursor`) | auto-detect |
| `--validate` | Run validation (tests/lint/build) after each task | `true` |
| `--no-validate` | Skip validation after each task | - |
| `--max-iterations <n>` | Maximum iterations the agent can run per task | `15` |

## Examples

### Basic Usage

```bash
# Process GitHub issues labeled "auto-ready"
ralph-starter auto --source github --project myorg/myrepo --label "auto-ready"

# Process Linear tickets
ralph-starter auto --source linear --project "My Project"
```

### Preview Before Running

```bash
# Dry run to see which tasks would be processed
ralph-starter auto --source github --project myorg/myrepo --label "bug" --dry-run
```

Output:

```
ralph-starter auto
Autonomous batch task processing

✓ Using agent: Claude Code
✓ Found 3 tasks

Tasks to process:

  1. Fix login redirect loop [bug, auto-ready]
     https://github.com/myorg/myrepo/issues/42
  2. Handle null user in profile page [bug, auto-ready]
     https://github.com/myorg/myrepo/issues/45
  3. Fix timezone conversion error [bug, auto-ready]
     https://github.com/myorg/myrepo/issues/51

Dry run mode - no changes will be made

Would execute:
  - Create branch: auto/42
  - Run agent with task: "Fix login redirect loop"
  - Commit changes
  - Create PR
  ...
```

### Limit Task Count

```bash
# Only process the first 3 tasks
ralph-starter auto --source github --project myorg/myrepo --limit 3
```

### Skip PR Creation

```bash
# Commit and push, but don't create pull requests
ralph-starter auto --source github --project myorg/myrepo --skip-pr
```

### Disable Validation

```bash
# Skip tests/lint/build validation for faster execution
ralph-starter auto --source linear --no-validate
```

### Full Example with All Options

```bash
ralph-starter auto \
  --source github \
  --project myorg/myrepo \
  --label "auto-ready" \
  --limit 5 \
  --agent claude-code \
  --max-iterations 20 \
  --validate
```

## Behavior

1. **Git Repository Check** -- The command verifies it is running inside a git repository and warns about uncommitted changes.

2. **Agent Detection** -- Automatically detects the best available coding agent. If no agent is found, the command exits with an error and suggests installing Claude Code.

3. **Task Fetching** -- Retrieves tasks from the specified source using your configured authentication credentials. For GitHub, `--project` is required. For Linear, it is optional.

4. **Batch Execution** -- Tasks are processed sequentially. For each task:
   - A branch is created (`auto/<task-id>`)
   - The agent implements the task
   - Validation runs if enabled
   - Changes are committed and pushed
   - A PR is created (unless `--skip-pr` is set)
   - The task is marked complete in the source system

5. **Summary** -- After all tasks are processed, a summary is printed showing the number of successful and failed tasks, along with links to any created pull requests.

## Prerequisites

- Must be run inside a git repository
- Authentication must be configured for the chosen source (`ralph-starter auth`)
- At least one coding agent must be installed

## Exit Codes

| Code | Description |
|------|-------------|
| 0 | All tasks processed (some may have failed) |
| 1 | Fatal error (not a git repo, no agent found, task fetch failed) |

## See Also

- [ralph-starter run](/docs/cli/run) - Run a single task
- [ralph-starter auth](/docs/cli/auth) - Configure authentication for sources
- [ralph-starter integrations](/docs/cli/integrations) - Manage and test integrations
