---
sidebar_position: 2
title: init
description: Initialize Ralph Playbook in a project
keywords: [cli, init, command, setup]
---

# ralph-starter init

Initialize Ralph Playbook in an existing project.

## Synopsis

```bash
ralph-starter init [options]
```

## Description

The `init` command sets up Ralph Playbook files in the current directory. These files guide AI agents in understanding and building your project.

## Options

| Option | Description |
|--------|-------------|
| `-n, --name <name>` | Project name |

## Files Created

| File | Description |
|------|-------------|
| `AGENTS.md` | Agent instructions and validation commands |
| `PROMPT_plan.md` | Planning mode prompt template |
| `PROMPT_build.md` | Building mode prompt template |
| `IMPLEMENTATION_PLAN.md` | Task list (initially empty) |
| `specs/` | Directory for specification files |

## Examples

```bash
# Initialize in current directory
ralph-starter init

# With project name
ralph-starter init --name my-awesome-app

# In a new project
mkdir my-project && cd my-project
git init
ralph-starter init --name my-project
```

## Generated Files

### AGENTS.md

```markdown
# AGENTS.md

## Project: my-project

### Validation Commands
- test: npm test
- lint: npm run lint
- build: npm run build

### Agent Instructions
[Instructions for AI agents...]
```

### PROMPT_plan.md

```markdown
# Planning Mode

Read the specs in `specs/` and create an implementation plan.

[Planning instructions...]
```

### PROMPT_build.md

```markdown
# Building Mode

Execute tasks from IMPLEMENTATION_PLAN.md.

[Building instructions...]
```

## When to Use

Use `ralph-starter init` when:

1. **Starting a new project** - Set up Ralph Playbook from scratch
2. **Adding to existing project** - Integrate ralph-starter into current codebase
3. **Manual workflow** - When not using the interactive wizard

## Workflow

After initialization:

1. Write specs in `specs/` directory
2. Run `ralph-starter plan` to create implementation plan
3. Run `ralph-starter run` to start building

## See Also

- [ralph-starter plan](/docs/cli/plan)
- [ralph-starter run](/docs/cli/run)
- [Ralph Playbook](/docs/advanced/ralph-playbook)
