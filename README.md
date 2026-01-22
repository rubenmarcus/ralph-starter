# ralph-starter

> **Ralph Wiggum made easy.** One command to run autonomous AI coding loops.

## What is Ralph Wiggum?

Ralph Wiggum is a technique for running AI coding agents in autonomous loops until tasks are completed. Instead of prompting back and forth, you give the AI a task and let it iterate until done.

**ralph-starter** makes this dead simple - for developers and non-developers alike.

## Installation

```bash
npm install -g ralph-starter
# or
npx ralph-starter
```

## Quick Start

### For Everyone (Non-Developers Welcome!)

Just run `ralph-starter` with no arguments to launch the interactive wizard:

```bash
ralph-starter
```

The wizard will:
1. Ask if you have a project idea (or help you brainstorm one)
2. Refine your idea with AI
3. Let you customize the tech stack
4. Build your project automatically

### Don't Know What to Build?

```bash
ralph-starter ideas
```

This launches **Idea Mode** - a brainstorming session to help you discover project ideas:
- **Brainstorm with AI** - Get creative suggestions
- **See trending ideas** - Based on 2025-2026 tech trends
- **Based on my skills** - Personalized to technologies you know
- **Solve a problem** - Help fix something that frustrates you

### For Developers

```bash
# Run a single task
ralph-starter run "build a todo app with React"

# With git automation
ralph-starter run "add user authentication" --commit --pr

# With validation (backpressure)
ralph-starter run "refactor auth" --commit --validate

# Fetch specs from external sources
ralph-starter run --from https://example.com/spec.md
ralph-starter run --from github --project myorg/myrepo --label "ready"
ralph-starter run --from todoist --project "My App"
```

## Features

### Interactive Wizard
Launch with `ralph-starter` (no args) for a guided experience:
- Describe your idea in plain English
- AI refines and suggests features
- Choose your tech stack
- Auto-runs init → plan → build

### Idea Mode
For users who don't know what to build yet:
```bash
ralph-starter ideas
```

### Input Sources
Fetch specs from anywhere:

```bash
# URLs and files
ralph-starter run --from https://example.com/spec.md
ralph-starter run --from ./requirements.pdf

# GitHub Issues
ralph-starter run --from github --project owner/repo --label "sprint-1"

# Todoist
ralph-starter config set todoist.apiKey <your-key>
ralph-starter run --from todoist --project "My App"

# Linear
ralph-starter config set linear.apiKey <your-key>
ralph-starter run --from linear --label "in-progress"

# Notion
ralph-starter config set notion.apiKey <your-key>
ralph-starter run --from notion --project "Product Specs"
```

### MCP Server
Use ralph-starter from Claude Desktop or any MCP client:

```bash
ralph-starter mcp
```

Add to Claude Desktop config:
```json
{
  "mcpServers": {
    "ralph-starter": {
      "command": "ralph-starter",
      "args": ["mcp"]
    }
  }
}
```

**Available MCP Tools:**
- `ralph_init` - Initialize Ralph Playbook
- `ralph_plan` - Create implementation plan
- `ralph_run` - Execute coding loop
- `ralph_status` - Check progress
- `ralph_validate` - Run tests/lint/build

### Multi-Agent Support
Works with your favorite coding agents:
- **Claude Code** (recommended)
- **Cursor**
- **Codex**
- **OpenCode**

### Git Automation
```bash
ralph-starter run "your task" --commit      # Auto-commit after tasks
ralph-starter run "your task" --push        # Push to remote
ralph-starter run "your task" --pr          # Create PR when done
```

### Backpressure Validation
```bash
ralph-starter run "your task" --validate    # Run tests/lint/build after each iteration
```

The `--validate` flag runs test, lint, and build commands (from AGENTS.md or package.json) after each iteration. If validation fails, the agent gets feedback to fix the issues.

## Ralph Playbook Workflow

ralph-starter follows the [Ralph Playbook](https://claytonfarr.github.io/ralph-playbook/) methodology:

```bash
# 1. Initialize Ralph Playbook files
ralph-starter init

# 2. Write specs in specs/ folder

# 3. Create implementation plan
ralph-starter plan

# 4. Execute the plan
ralph-starter run --commit --validate
```

This creates:
- `AGENTS.md` - Agent instructions and validation commands
- `PROMPT_plan.md` - Planning prompt template
- `PROMPT_build.md` - Building prompt template
- `IMPLEMENTATION_PLAN.md` - Prioritized task list
- `specs/` - Specification files

## Commands

| Command | Description |
|---------|-------------|
| `ralph-starter` | Launch interactive wizard |
| `ralph-starter ideas` | Brainstorm project ideas |
| `ralph-starter run [task]` | Run an autonomous coding loop |
| `ralph-starter plan` | Create implementation plan from specs |
| `ralph-starter init` | Initialize Ralph Playbook in a project |
| `ralph-starter wizard` | Explicit wizard command |
| `ralph-starter mcp` | Start as MCP server |
| `ralph-starter config <action>` | Manage source credentials |
| `ralph-starter source <action>` | Manage input sources |
| `ralph-starter skill add <repo>` | Install agent skills |

## Options for `run`

| Flag | Description |
|------|-------------|
| `--auto` | Skip permission prompts |
| `--commit` | Auto-commit after tasks |
| `--push` | Push commits to remote |
| `--pr` | Create pull request |
| `--validate` | Run tests/lint/build (backpressure) |
| `--from <source>` | Fetch spec from source |
| `--project <name>` | Project filter for sources |
| `--label <name>` | Label filter for sources |
| `--status <status>` | Status filter for sources |
| `--limit <n>` | Max items from source |
| `--prd <file>` | Read tasks from markdown |
| `--agent <name>` | Specify agent to use |
| `--max-iterations <n>` | Max loop iterations (default: 50) |

## Config Commands

```bash
# Set credentials
ralph-starter config set todoist.apiKey <key>
ralph-starter config set linear.apiKey <key>
ralph-starter config set notion.apiKey <key>
ralph-starter config set github.token <token>

# View config
ralph-starter config list
ralph-starter config get todoist.apiKey

# Remove
ralph-starter config delete todoist.apiKey
```

## Source Commands

```bash
# List available sources
ralph-starter source list

# Get help for a source
ralph-starter source help github

# Test source connectivity
ralph-starter source test todoist

# Preview items from source
ralph-starter source preview github --project owner/repo
```

## Example: Build a SaaS Dashboard

```bash
mkdir my-saas && cd my-saas
git init

ralph-starter run "Create a SaaS dashboard with:
- User authentication (email/password)
- Stripe subscription billing
- Dashboard with usage metrics
- Dark mode support" --commit --pr --validate

# Watch the magic happen...
# 🔄 Loop 1: Setting up Next.js project...
# ✓ Validation passed
# ✓ Committed: chore: initialize Next.js with TypeScript
# 🔄 Loop 2: Adding authentication...
# ✓ Validation passed
# ✓ Committed: feat(auth): add NextAuth with email provider
# ...
# ✓ Created PR #1: "Build SaaS dashboard"
```


## Requirements

- Node.js 18+
- At least one coding agent installed (Claude Code, Cursor, etc.)
- Git (for automation features)
- GitHub CLI `gh` (for PR creation and GitHub source)

## License

MIT
