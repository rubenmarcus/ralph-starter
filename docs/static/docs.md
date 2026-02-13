# ralph-starter Documentation

> AI-powered autonomous coding tool. Connect GitHub, Linear, Notion, Figma and run AI coding loops from specs to production.

> Generated on 2026-02-13 | [ralphstarter.ai](https://ralphstarter.ai)

## Table of Contents

- [Getting Started](#getting-started)
- [CLI Commands](#cli-commands)
- [Sources & Integrations](#sources-integrations)
- [Guides](#guides)
- [Wizard](#wizard)
- [Advanced](#advanced)
- [MCP Server](#mcp-server)
- [Community](#community)
- [FAQ](#faq)

---

## Getting Started

## ralph-starter

> **Ralph Wiggum made easy.** One command to run autonomous AI coding loops.

import DownloadDocs from '@site/src/components/DownloadDocs'

<DownloadDocs />

### What is Ralph Wiggum?

Ralph Wiggum is a technique for running AI coding agents in autonomous loops until tasks are completed. Instead of prompting back and forth, you give the AI a task and let it iterate until done.

**ralph-starter** makes this dead simple - for developers and non-developers alike.

### Quick Start

#### For Everyone

Just run `ralph-starter` with no arguments:

```bash
ralph-starter
```

The interactive wizard will guide you through:
1. Describing your project idea (or brainstorming one)
2. Refining it with AI
3. Customizing the tech stack
4. Building it automatically

#### Don't Know What to Build?

```bash
ralph-starter ideas
```

This launches **Idea Mode** - a brainstorming session to help you discover project ideas.

#### Use a Template

```bash
# Browse available templates
ralph-starter template list

# Use a template to start a project
ralph-starter template use nextjs-saas
```

Templates are pre-built project specs - just pick one and let the AI build it.

#### For Developers

```bash
# Run a single task
ralph-starter run "build a todo app with React"

# With git automation
ralph-starter run "add user authentication" --commit --pr

# Fetch specs from external sources
ralph-starter run --from github --project myorg/myrepo --label "ready"
```

### Features

- **Interactive Wizard** - Guided project creation for everyone
- **Idea Mode** - AI-powered brainstorming when you don't know what to build
- **Project Templates** - Pre-built specs for common project types (SaaS, CLI tools, etc.)
- **Input Sources** - Fetch specs from GitHub, Linear, Notion, URLs, PDFs
- **MCP Server** - Use from Claude Desktop or any MCP client
- **Git Automation** - Auto-commit, push, and create PRs
- **Validation** - Run tests/lint/build after each iteration (backpressure)
- **Multi-Agent Support** - Works with Claude Code, Cursor, Codex, OpenCode

### Next Steps

- [Installation](/docs/installation) - Get ralph-starter installed
- [Interactive Wizard](/docs/wizard/overview) - Learn about the guided experience
- [Project Templates](/docs/cli/template) - Use pre-built project templates
- [Input Sources](/docs/sources/overview) - Connect to GitHub, Linear, and more
- [MCP Integration](/docs/mcp/setup) - Use from Claude Desktop


---

## Installation

### Quick Install

```bash
npm install -g ralph-starter
```

Or use directly with npx:

```bash
npx ralph-starter
```

### Requirements

- **Node.js 18+** - Required for running ralph-starter
- **Coding Agent** - At least one of the supported agents (see setup below)
- **Git** - For version control features (`--commit`, `--push`, `--pr`)
- **GitHub CLI** - For PR creation and GitHub source integration

### Setting Up a Coding Agent

ralph-starter works with several AI coding agents. You need at least one installed:

#### Claude Code (Recommended)

The official Anthropic CLI for Claude.

```bash
# Install via npm
npm install -g @anthropic-ai/claude-code

# Authenticate
claude login
```

Claude Code offers the best integration with ralph-starter's autonomous loops.

#### Cursor

AI-powered code editor with built-in agent capabilities.

1. Download from [cursor.sh](https://cursor.sh/)
2. Install and open Cursor
3. Sign in with your account
4. Enable the Cursor CLI: `Cursor → Install 'cursor' command`

#### Codex (OpenAI)

OpenAI's coding assistant.

```bash
# Install the OpenAI CLI
npm install -g openai
```

#### OpenCode

Open-source alternative with multiple model support.

```bash
# Install
npm install -g opencode-ai

# Configure
opencode setup
```

### Verify Installation

```bash
ralph-starter --version
```

### LLM Provider Configuration

ralph-starter uses an LLM for the interactive wizard and spec refinement. Configure your preferred provider:

#### Anthropic (Recommended)

```bash
ralph-starter config set providers.anthropic.apiKey sk-ant-xxxx
ralph-starter config set llm.provider anthropic
```

#### OpenAI

```bash
ralph-starter config set providers.openai.apiKey sk-xxxx
ralph-starter config set llm.provider openai
```

#### OpenRouter

```bash
ralph-starter config set providers.openrouter.apiKey sk-or-xxxx
ralph-starter config set llm.provider openrouter
```

Without an API key configured, ralph-starter falls back to using your installed coding agent for LLM tasks.

### Post-Install Setup

After installing, run the interactive setup wizard to configure your environment:

```bash
ralph-starter setup
```

This guides you through:
- Selecting your preferred coding agent
- Configuring LLM API keys
- Setting up integration sources (GitHub, Linear, etc.)
- Choosing default workflow presets

#### Verify Your Setup

Check that everything is configured correctly:

```bash
ralph-starter check
```

This validates your configuration, tests LLM connectivity, and verifies agent availability.

### Next Steps

After installation:

1. Run `ralph-starter setup` to configure your environment
2. Run `ralph-starter` to launch the interactive wizard
3. Or run `ralph-starter ideas` if you need help brainstorming
4. Check out the [Interactive Wizard](/docs/wizard/overview) guide


---

## CLI Commands

## ralph-starter run

Run an autonomous AI coding loop.

### Synopsis

```bash
ralph-starter run [task] [options]
```

### Description

The `run` command executes an autonomous coding loop. The AI agent works on tasks iteratively until completion.

### Arguments

| Argument | Description |
|----------|-------------|
| `task` | Optional task description. If not provided, uses the implementation plan. |

### Options

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

### Examples

#### Basic Usage

```bash
# Run a single task
ralph-starter run "build a todo app with React"

# Run from implementation plan
ralph-starter run
```

#### With Git Automation

```bash
# Auto-commit changes
ralph-starter run "add login page" --commit

# Commit and push
ralph-starter run "fix bug" --commit --push

# Full automation with PR
ralph-starter run "add feature" --commit --push --pr
```

#### With Validation

```bash
# Run tests/lint/build after each iteration
ralph-starter run "refactor auth" --validate

# Combine with commit
ralph-starter run "add tests" --commit --validate
```

#### From External Sources

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

#### Project Location

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

#### From PRD File

Work through tasks from a Product Requirements Document (PRD) file. The standard ralph-wiggum filename is `PRD.md`:

```bash
# Run tasks from PRD.md (standard filename)
ralph-starter run --prd PRD.md

# Or specify a custom path
ralph-starter run --prd ./specs/feature-prd.md

# Combine with automation
ralph-starter run --prd PRD.md --commit --validate
```

**PRD.md Format Example:**

```markdown
# User Authentication

Implement secure authentication for the application.

## Backend
- [ ] Create user model with email/password
- [ ] Implement JWT token generation
- [ ] Add password hashing with bcrypt

## Frontend
- [ ] Build login form component
- [ ] Add session management
- [ ] Handle authentication errors
```

The agent will:
1. Parse tasks from checkbox format (`- [ ]` / `- [x]`)
2. Work through pending tasks one by one
3. Track progress (completed vs pending)
4. Group tasks by section headers
5. Mark tasks complete by changing `[ ]` to `[x]`

#### Advanced

```bash
# Specify agent
ralph-starter run "build API" --agent claude-code

# Limit iterations
ralph-starter run "complex task" --max-iterations 100

# Full automation
ralph-starter run --auto --commit --validate --max-iterations 30
```

### Behavior

1. **Task Resolution**:
   - If `task` provided → use that task
   - If `--from` provided → fetch spec from source
   - If `--prd` provided → parse tasks from PRD file
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

### Exit Codes

| Code | Description |
|------|-------------|
| 0 | Success |
| 1 | Error (validation failed, agent error, etc.) |

### See Also

- [ralph-starter init](/docs/cli/init)
- [ralph-starter plan](/docs/cli/plan)
- [Input Sources](/docs/sources/overview)


---

## ralph-starter auto

Autonomous batch task processing. Fetches multiple tasks from GitHub or Linear, creates branches, implements each task, commits changes, and creates pull requests -- all without human intervention.

### Synopsis

```bash
ralph-starter auto --source <source> [options]
```

### Description

The `auto` command runs ralph-starter in fully autonomous mode. It fetches a batch of tasks from an external source (GitHub issues or Linear tickets), then processes each one sequentially:

1. **Fetch** -- Retrieves open tasks matching your filters from GitHub or Linear.
2. **Branch** -- Creates a dedicated branch for each task (e.g., `auto/<task-id>`).
3. **Implement** -- Invokes the best available coding agent to work on the task.
4. **Validate** -- Runs tests, lint, and build to verify the implementation (enabled by default).
5. **Commit & Push** -- Commits changes and pushes to the remote repository.
6. **Pull Request** -- Opens a PR for the completed work.
7. **Mark Complete** -- Updates the task status in the source system.

The command must be run inside a git repository. It will warn you if there are uncommitted changes before starting.

### Options

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

### Examples

#### Basic Usage

```bash
# Process GitHub issues labeled "auto-ready"
ralph-starter auto --source github --project myorg/myrepo --label "auto-ready"

# Process Linear tickets
ralph-starter auto --source linear --project "My Project"
```

#### Preview Before Running

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

#### Limit Task Count

```bash
# Only process the first 3 tasks
ralph-starter auto --source github --project myorg/myrepo --limit 3
```

#### Skip PR Creation

```bash
# Commit and push, but don't create pull requests
ralph-starter auto --source github --project myorg/myrepo --skip-pr
```

#### Disable Validation

```bash
# Skip tests/lint/build validation for faster execution
ralph-starter auto --source linear --no-validate
```

#### Full Example with All Options

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

### Behavior

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

### Prerequisites

- Must be run inside a git repository
- Authentication must be configured for the chosen source (`ralph-starter auth`)
- At least one coding agent must be installed

### Exit Codes

| Code | Description |
|------|-------------|
| 0 | All tasks processed (some may have failed) |
| 1 | Fatal error (not a git repo, no agent found, task fetch failed) |

### See Also

- [ralph-starter run](/docs/cli/run) - Run a single task
- [ralph-starter auth](/docs/cli/auth) - Configure authentication for sources
- [ralph-starter integrations](/docs/cli/integrations) - Manage and test integrations


---

## ralph-starter init

Initialize Ralph Playbook in an existing project.

### Synopsis

```bash
ralph-starter init [options]
```

### Description

The `init` command sets up Ralph Playbook files in the current directory. These files guide AI agents in understanding and building your project.

### Options

| Option | Description |
|--------|-------------|
| `-n, --name <name>` | Project name |

### Files Created

| File | Description |
|------|-------------|
| `AGENTS.md` | Agent instructions and validation commands |
| `PROMPT_plan.md` | Planning mode prompt template |
| `PROMPT_build.md` | Building mode prompt template |
| `IMPLEMENTATION_PLAN.md` | Task list (initially empty) |
| `specs/` | Directory for specification files |

### Examples

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

### Generated Files

#### AGENTS.md

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

#### PROMPT_plan.md

```markdown
# Planning Mode

Read the specs in `specs/` and create an implementation plan.

[Planning instructions...]
```

#### PROMPT_build.md

```markdown
# Building Mode

Execute tasks from IMPLEMENTATION_PLAN.md.

[Building instructions...]
```

### When to Use

Use `ralph-starter init` when:

1. **Starting a new project** - Set up Ralph Playbook from scratch
2. **Adding to existing project** - Integrate ralph-starter into current codebase
3. **Manual workflow** - When not using the interactive wizard

### Workflow

After initialization:

1. Write specs in `specs/` directory
2. Run `ralph-starter plan` to create implementation plan
3. Run `ralph-starter run` to start building

### See Also

- [ralph-starter plan](/docs/cli/plan)
- [ralph-starter run](/docs/cli/run)
- [Ralph Playbook](/docs/advanced/ralph-playbook)


---

## ralph-starter plan

Create an implementation plan from specifications.

### Synopsis

```bash
ralph-starter plan [options]
```

### Description

The `plan` command analyzes specs in the `specs/` directory and generates an `IMPLEMENTATION_PLAN.md` with prioritized tasks.

### Options

| Option | Description | Default |
|--------|-------------|---------|
| `--auto` | Run in automated mode (skip prompts) | false |

### Prerequisites

- Ralph Playbook initialized (`ralph-starter init`)
- At least one spec file in `specs/` directory

### Examples

```bash
# Interactive planning
ralph-starter plan

# Automated planning
ralph-starter plan --auto
```

### How It Works

1. **Read Specs**: Scans `specs/` for markdown files
2. **Analyze**: AI analyzes requirements and dependencies
3. **Prioritize**: Creates ordered task list
4. **Generate**: Writes IMPLEMENTATION_PLAN.md

### Generated Plan Format

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

### Spec File Format

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

### Workflow

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

### Tips

1. **One spec per feature** - Keep specs focused
2. **Include acceptance criteria** - Helps AI know when task is complete
3. **Add technical notes** - Specify tech preferences
4. **Review the plan** - Check the generated plan before running

### See Also

- [ralph-starter init](/docs/cli/init)
- [ralph-starter run](/docs/cli/run)
- [Ralph Playbook](/docs/advanced/ralph-playbook)


---

## ralph-starter setup

Interactive setup wizard to configure your LLM provider and coding agents.

### Synopsis

```bash
ralph-starter setup [--force]
```

### Description

The `setup` command launches a step-by-step wizard that walks you through configuring ralph-starter. It detects installed agents, helps you choose an LLM provider, tests the connection, and saves your configuration.

The wizard runs through four steps:

1. **Detect Installed Agents** -- Scans your system for available AI coding agents (Claude Code, Cursor, Codex, OpenCode, etc.) and displays which are available.

2. **Configure LLM Provider** -- Determines how ralph-starter communicates with an LLM:
   - If Claude Code CLI is detected, offers to use it directly (no API key needed).
   - Checks for existing API keys in environment variables (e.g., `ANTHROPIC_API_KEY`).
   - Checks for previously saved configuration.
   - If nothing is found, prompts you to select a provider and enter an API key.

3. **Test Connection** -- Sends a test request to verify the configured LLM is reachable and responding.

4. **Save Configuration** -- Writes your preferences to the ralph-starter config file, including agent selection, LLM provider, and optionally your API key.

If setup has already been completed, the wizard notifies you and asks for confirmation before proceeding. Use `--force` to skip this check.

### Options

| Option | Description | Default |
|--------|-------------|---------|
| `--force` | Force re-run setup even if already configured | `false` |

### Examples

#### First-Time Setup

```bash
ralph-starter setup
```

Output:

```
  ╭─────────────────────────────────────────╮
  │  ralph-starter Setup Wizard             │
  │  Let's get you configured!              │
  ╰─────────────────────────────────────────╯

Step 1: Detecting Installed Agents

  ✓ Claude Code v1.2.3
    /usr/local/bin/claude
  ✗ Cursor not found
  ✗ Codex not found

Step 2: Configure LLM Provider

  ✓ Claude Code CLI detected!
    No API key needed - uses your Claude Code authentication.

? Use Claude Code CLI? (recommended - no API key needed) Yes

Step 3: Testing Connection

✓ Connection successful (245ms)

Step 4: Saving Configuration

  ✓ Configuration saved

  ╭─────────────────────────────────────────╮
  │  Setup Complete!                        │
  │                                         │
  │  Using: Claude Code CLI                 │
  │  No API key needed                      │
  │                                         │
  ╰─────────────────────────────────────────╯

  Next steps:
    • ralph-starter           Launch wizard to build a project
    • ralph-starter ideas     Brainstorm project ideas
    • ralph-starter check     Verify configuration
```

#### Re-Run Setup

```bash
# Force re-run even if already configured
ralph-starter setup --force
```

#### With API Key Provider

If Claude Code is not installed, the wizard prompts you to choose an LLM provider:

```bash
ralph-starter setup
```

```
Step 2: Configure LLM Provider

? Choose your LLM provider:
  ❯ Anthropic
    OpenAI
    OpenRouter

Get your API key at: https://console.anthropic.com

? Enter your Anthropic API key: ****

Step 3: Testing Connection

✓ Connection successful (312ms)

? Save API key to config file? Yes
```

### Behavior

- **Cancellation** -- You can press `Ctrl+C` at any time to cancel the wizard. The process exits cleanly.
- **Connection Failure** -- If the connection test fails, you are offered the option to save the configuration anyway and retry later with `ralph-starter check`.
- **Existing Config** -- If setup was previously completed and `--force` is not set, you are prompted whether to continue or exit.

### Exit Codes

| Code | Description |
|------|-------------|
| 0 | Setup completed successfully, or cancelled by user |
| 1 | Setup failed (connection error and user chose not to save) |

### See Also

- [ralph-starter check](/docs/cli/check) - Verify configuration and test LLM connection
- [ralph-starter config](/docs/cli/config) - Manage configuration manually
- [ralph-starter auth](/docs/cli/auth) - Configure authentication for integrations


---

## ralph-starter check

Validate your ralph-starter configuration and test the LLM connection.

### Synopsis

```bash
ralph-starter check [--verbose]
```

### Description

The `check` command verifies that ralph-starter is properly configured and can communicate with an LLM provider. It runs through a series of checks:

1. **Claude Code CLI Detection** -- Checks if the Claude Code CLI is installed and available on your system. Displays the version and path when found.

2. **API Key Configuration** -- Checks whether an LLM API key is configured, either from an environment variable or the config file. Displays the provider name and a masked version of the key.

3. **Connection Test** -- Sends a test request to the configured LLM (either via Claude Code CLI or the API provider) and measures the response time.

4. **Summary** -- Reports overall status and which provider is being used.

If no LLM is available (neither Claude Code CLI nor an API key), the command prints instructions on how to get started and exits with code 1.

### Options

| Option | Description | Default |
|--------|-------------|---------|
| `--verbose` | Show detailed output, including executable paths | `false` |

### Examples

#### Basic Check

```bash
ralph-starter check
```

Output (with Claude Code):

```
Checking ralph-starter configuration...

  Detecting LLM...
  ✓ Claude Code CLI found v1.2.3

  ✓ Response received (245ms)

  All checks passed! You're ready to go.

  Using: Claude Code CLI (no API key needed)
  Run 'ralph-starter' to launch the wizard.
```

#### Verbose Output

```bash
ralph-starter check --verbose
```

Output:

```
Checking ralph-starter configuration...

  Detecting LLM...
  ✓ Claude Code CLI found v1.2.3
    Path: /usr/local/bin/claude
  ✓ API Key configured (Anthropic)
    Key: sk-a****xyz1 (from environment)

  ✓ Response received (312ms)

  All checks passed! You're ready to go.

  Using: Claude Code CLI (no API key needed)
  Run 'ralph-starter' to launch the wizard.
```

#### When No LLM Is Configured

```bash
ralph-starter check
```

Output:

```
Checking ralph-starter configuration...

  Detecting LLM...
  ✗ Claude Code CLI not found
  ✗ No API key configured

  No LLM available!

  To get started, either:
    1. Install Claude Code: https://claude.ai/code
    2. Run setup wizard: ralph-starter setup
    3. Set API key: export ANTHROPIC_API_KEY=your-key
```

#### After Failed Connection

```bash
ralph-starter check
```

Output:

```
Checking ralph-starter configuration...

  Detecting LLM...
  ✓ API Key configured (Anthropic)
    Key: sk-a****xyz1 (from environment)

  ✗ Connection failed: 401 Unauthorized

  The connection test failed. This could mean:
    • API key is invalid or expired
    • Network connectivity issues
    • Claude Code is not authenticated

  Try running: ralph-starter setup
```

### Behavior

- The check command prioritizes Claude Code CLI. If both Claude Code and an API key are available, Claude Code is used for the connection test.
- API keys are displayed in a masked format (first 4 and last 4 characters visible).
- The source of the API key is identified (environment variable or config file).

### Exit Codes

| Code | Description |
|------|-------------|
| 0 | All checks passed |
| 1 | No LLM available or connection test failed |

### See Also

- [ralph-starter setup](/docs/cli/setup) - Interactive setup wizard
- [ralph-starter config](/docs/cli/config) - Manage configuration manually


---

## ralph-starter config

Manage source configuration and credentials.

### Synopsis

```bash
ralph-starter config <action> [args...]
```

### Actions

| Action | Description |
|--------|-------------|
| `list` | Show all configuration |
| `get <key>` | Get a specific value |
| `set <key> <value>` | Set a value |
| `delete <key>` | Remove a value |

### Examples

#### List Configuration

```bash
ralph-starter config list
```

Output:
```
Configuration:
  apiKey: sk-ant-...
  linear.apiKey: lin_api_...
  notion.token: secret_...
```

#### Get Value

```bash
ralph-starter config get linear.apiKey
```

#### Set Value

```bash
# Set LLM provider API keys
ralph-starter config set providers.anthropic.apiKey sk-ant-xxxx
ralph-starter config set providers.openai.apiKey sk-xxxx
ralph-starter config set providers.openrouter.apiKey sk-or-xxxx

# Set active LLM provider
ralph-starter config set llm.provider anthropic

# Set source integration keys
ralph-starter config set linear.apiKey lin_api_xxxx
ralph-starter config set notion.token secret_xxxx
ralph-starter config set github.token ghp_xxxx
ralph-starter config set figma.token figd_xxxx

# Set defaults
ralph-starter config set github.defaultIssuesRepo owner/repo
```

#### Delete Value

```bash
ralph-starter config delete linear.apiKey
```

### Configuration Keys

#### LLM Provider Keys

| Key | Description |
|-----|-------------|
| `llm.provider` | Active LLM provider (`anthropic`, `openai`, `openrouter`) |
| `providers.anthropic.apiKey` | Anthropic API key |
| `providers.openai.apiKey` | OpenAI API key |
| `providers.openrouter.apiKey` | OpenRouter API key |

#### Source Integration Keys

| Key | Description |
|-----|-------------|
| `linear.apiKey` | Linear API key |
| `notion.token` | Notion integration token |
| `github.token` | GitHub personal access token |
| `github.defaultIssuesRepo` | Default repo for `--issue` without `--project` |
| `figma.token` | Figma personal access token |

### Storage Location

Configuration is stored in:

```
~/.ralph-starter/config.json
```

Example file:
```json
{
  "llm": {
    "provider": "anthropic"
  },
  "providers": {
    "anthropic": {
      "apiKey": "sk-ant-xxxx"
    }
  }
}
```

Source credentials are stored in:

```
~/.ralph-starter/sources.json
```

### Security Notes

- Credentials are stored in plain text
- File permissions are set to user-only (600)
- Consider using environment variables for sensitive keys:
  - `ANTHROPIC_API_KEY`
  - `GITHUB_TOKEN`

### Environment Variables

These environment variables override config file values:

| Variable | Description |
|----------|-------------|
| `ANTHROPIC_API_KEY` | Anthropic API key |
| `OPENAI_API_KEY` | OpenAI API key |
| `OPENROUTER_API_KEY` | OpenRouter API key |
| `GITHUB_TOKEN` | GitHub token |
| `FIGMA_TOKEN` | Figma token |
| `LINEAR_API_KEY` | Linear API key |
| `NOTION_TOKEN` | Notion integration token |

### See Also

- [ralph-starter source](/docs/cli/source)
- [Input Sources](/docs/sources/overview)


---

## ralph-starter auth

Browser-based OAuth authentication for integrations. Supports OAuth PKCE flows for services like Linear, and manages manual API key configuration for services like Notion, Todoist, and GitHub.

### Synopsis

```bash
ralph-starter auth [service]
ralph-starter auth --list
ralph-starter auth --logout <service>
```

### Description

The `auth` command manages authentication credentials for ralph-starter's integrations. It operates in three modes:

1. **OAuth Flow** -- Start a browser-based OAuth PKCE flow for a supported service (e.g., Linear).
2. **Status Listing** -- Show authentication status for all services.
3. **Logout** -- Remove stored credentials for a service.

Credentials are stored locally in the ralph-starter sources configuration file.

### Arguments

| Argument | Description |
|----------|-------------|
| `service` | The service to authenticate with (e.g., `linear`, `notion`, `todoist`, `github`) |

### Options

| Option | Description |
|--------|-------------|
| `--list` | Show authentication status for all services |
| `--logout <service>` | Remove credentials for the specified service |

### Supported Services

| Service | Auth Method | Details |
|---------|-------------|---------|
| `linear` | Browser OAuth (PKCE) | Seamless browser-based flow. Requires `RALPH_LINEAR_CLIENT_ID` env var. |
| `notion` | Manual API key | Set via `ralph-starter config set notion.apiKey <key>`. Get key at [notion.so/my-integrations](https://www.notion.so/my-integrations). |
| `todoist` | Manual API key | Set via `ralph-starter config set todoist.apiKey <key>`. Get key at [todoist.com/prefs/integrations](https://todoist.com/prefs/integrations). |
| `github` | Manual API key | Set via `ralph-starter config set github.apiKey <key>`. Get token at [github.com/settings/tokens](https://github.com/settings/tokens). |

### Examples

#### Start OAuth Flow (Linear)

```bash
# Authenticate with Linear via browser OAuth
ralph-starter auth linear
```

This opens your browser, completes the PKCE authorization flow, and stores the token locally. The flow uses a local callback server with a 5-minute timeout.

#### Check Authentication Status

```bash
ralph-starter auth --list
```

Output:

```
Authentication Status
Credentials stored in: /home/user/.config/ralph-starter/sources.json

  ✓ Linear - Authenticated
  ○ Notion - Manual API key
      Run: ralph-starter config set notion.apiKey <your-key>
  ○ Todoist - Manual API key
      Run: ralph-starter config set todoist.apiKey <your-key>
  ○ GitHub - Manual API key
      Run: ralph-starter config set github.apiKey <your-key>
```

#### Logout from a Service

```bash
# Remove stored credentials for Linear
ralph-starter auth --logout linear
```

#### Configure Manual API Keys

For services that do not support OAuth PKCE, configure API keys manually:

```bash
# Notion
ralph-starter config set notion.apiKey ntn_your_api_key_here

# Todoist
ralph-starter config set todoist.apiKey your_todoist_api_key

# GitHub
ralph-starter config set github.apiKey ghp_your_github_token
```

#### Show Help

```bash
# Run auth with no arguments to see help
ralph-starter auth
```

### OAuth PKCE Flow

For services that support PKCE (currently Linear), the authentication process works as follows:

1. A local callback server starts on a random port.
2. A PKCE challenge and CSRF state token are generated.
3. Your browser opens to the service's authorization URL.
4. After you authorize, the callback server receives the authorization code.
5. The code is exchanged for access (and optionally refresh) tokens using the PKCE verifier.
6. Tokens are stored locally.

If the browser cannot be opened automatically, the authorization URL is printed for manual use.

#### Setting Up Linear OAuth

```bash
# 1. Set your Linear OAuth client ID
export RALPH_LINEAR_CLIENT_ID=your_client_id

# 2. Run the auth flow
ralph-starter auth linear

# 3. Verify
ralph-starter auth --list
```

Get a Linear client ID from [linear.app/settings/api/applications](https://linear.app/settings/api/applications).

### Exit Codes

| Code | Description |
|------|-------------|
| 0 | Success |
| 1 | Unknown service, OAuth not configured, or authentication failed |

### See Also

- [ralph-starter config](/docs/cli/config) - Manage configuration including API keys
- [ralph-starter integrations](/docs/cli/integrations) - List and test integrations
- [ralph-starter auto](/docs/cli/auto) - Use authenticated sources for batch processing


---

## ralph-starter integrations

Manage integrations -- list available integrations, view setup instructions, test connectivity, and fetch data previews.

### Synopsis

```bash
ralph-starter integrations [action] [args...]
```

### Description

The `integrations` command provides tools for managing ralph-starter's integration layer. Integrations connect ralph-starter to external services like GitHub, Linear, and Notion, allowing you to fetch tasks, issues, and specifications for your coding loops.

If no action is provided, the command defaults to `list`.

### Actions

| Action | Aliases | Description |
|--------|---------|-------------|
| `list` | `ls` | List all integrations with their availability status and auth methods |
| `help <name>` | - | Show detailed setup instructions for a specific integration |
| `test <name>` | - | Test connectivity for a configured integration |
| `fetch <name> <identifier>` | `preview` | Fetch and preview data from an integration |

### Fetch Options

These options apply when using the `fetch` action:

| Option | Description | Default |
|--------|-------------|---------|
| `--project <name>` | Project or repository name | - |
| `--label <name>` | Filter results by label | - |
| `--status <status>` | Filter results by status (e.g., `open`, `closed`) | - |
| `--limit <n>` | Maximum number of items to fetch | `10` |

### Available Integrations

| Integration | Description | Auth Methods |
|-------------|-------------|--------------|
| `github` | GitHub issues and pull requests | CLI, API Key |
| `linear` | Linear issues and projects | OAuth, API Key |
| `notion` | Notion pages (public and private) | API Key |

### Examples

#### List All Integrations

```bash
ralph-starter integrations list
```

Output:

```
Available Integrations
────────────────────────────────────────────────────────

  ✓ GitHub (github)
    GitHub issues and PRs
    Auth: CLI, API Key

  ✓ Linear (linear)
    Linear issues
    Auth: OAuth, API Key

  ○ Notion (notion)
    Notion pages (public and private)
    Auth: API Key
    → Run: ralph-starter integrations help notion

────────────────────────────────────────────────────────
Use "ralph-starter integrations help <name>" for setup instructions
```

#### View Setup Help

```bash
# Show setup instructions for Notion
ralph-starter integrations help notion

# Show setup instructions for GitHub
ralph-starter integrations help github
```

#### Test Connectivity

```bash
# Test GitHub integration
ralph-starter integrations test github
```

Output (success):

```
✓ GitHub: Connected via CLI
```

Output (not configured):

```
✗ GitHub: Not configured

Run the following for setup instructions:
  ralph-starter integrations help github
```

#### Fetch and Preview Data

```bash
# Fetch GitHub issues from a repository
ralph-starter integrations fetch github owner/repo

# Fetch with filters
ralph-starter integrations fetch github owner/repo --label "bug" --status open --limit 5

# Fetch a Notion page
ralph-starter integrations fetch notion "https://notion.so/Page-abc123"

# Fetch Linear issues for a project
ralph-starter integrations fetch linear my-project --status "In Progress"
```

Output:

```
✓ Content fetched

Source: github
Title: Fix authentication redirect loop
Metadata: {
  "number": 42,
  "state": "open",
  "labels": ["bug", "auth"]
}

Preview:
────────────────────────────────────────────────────────
## Description

Users are experiencing an infinite redirect loop when...

## Steps to Reproduce

1. Navigate to /login
2. Enter valid credentials
3. Observe redirect loop
────────────────────────────────────────────────────────
```

The preview displays up to the first 50 lines of content. If the content is longer, a count of remaining lines is shown.

### Behavior

- **Default action** -- Running `ralph-starter integrations` with no action defaults to `list`.
- **Auth methods** -- Each integration supports one or more authentication methods (CLI authentication, API keys, or OAuth). The `list` action shows which methods are available and which are configured.
- **Fetch previews** -- The `fetch` action retrieves real data from the integration and displays a preview including source, title, metadata, and content.

### Exit Codes

| Code | Description |
|------|-------------|
| 0 | Success |
| 1 | Unknown integration, not configured, or fetch failed |

### See Also

- [ralph-starter auth](/docs/cli/auth) - Configure OAuth authentication for integrations
- [ralph-starter config](/docs/cli/config) - Set API keys for integrations
- [ralph-starter run](/docs/cli/run) - Use integrations as task sources with `--from`
- [ralph-starter auto](/docs/cli/auto) - Batch process tasks from integrations


---

## ralph-starter source

Manage input sources.

### Synopsis

```bash
ralph-starter source <action> [args...] [options]
```

### Actions

| Action | Description |
|--------|-------------|
| `list` | Show available sources |
| `help <name>` | Get help for a source |
| `test <name>` | Test source connectivity |
| `preview <name>` | Preview items from source |

### Options

| Option | Description |
|--------|-------------|
| `--project <name>` | Project/repo filter |
| `--label <name>` | Label filter |
| `--status <status>` | Status filter |
| `--limit <n>` | Max items (default: 10) |

### Examples

#### List Sources

```bash
ralph-starter source list
```

Output:
```
Available Sources:

Built-in:
  file     - Local files and directories
  url      - Remote URLs (markdown, HTML)
  pdf      - PDF documents

Integrations:
  github   - GitHub Issues [configured]
  linear   - Linear issues [not configured]
  notion   - Notion pages [not configured]
```

#### Get Help

```bash
ralph-starter source help github
```

Output:
```
GitHub Source

Fetch specs from GitHub Issues.

Authentication:
  - GitHub CLI (gh auth login)
  - Or: ralph-starter config set github.token <token>

Usage:
  ralph-starter run --from github --project owner/repo

Options:
  --project   Repository (owner/repo format)
  --label     Filter by label
  --status    Filter by status (open, closed, all)
  --limit     Max issues to fetch
```

#### Test Connectivity

```bash
ralph-starter source test linear
```

Output:
```
Testing Linear connection...
✓ Connected successfully
✓ Found 3 teams
✓ API access verified
```

#### Preview Items

```bash
ralph-starter source preview github --project owner/repo --label "ready"
```

Output:
```
Previewing items from GitHub (owner/repo):

1. Add user authentication (#42)
   Labels: feature, ready
   Created: 2024-01-15

2. Fix login bug (#38)
   Labels: bug, ready
   Created: 2024-01-14

3. Update dashboard (#35)
   Labels: enhancement, ready
   Created: 2024-01-12

Found 3 items matching filters.
```

### Available Sources

#### Built-in

| Source | Description |
|--------|-------------|
| `file` | Local files (.md, directories) |
| `url` | Remote URLs (fetches and converts) |
| `pdf` | PDF documents (extracts text) |

#### Integrations

| Source | Auth Method |
|--------|-------------|
| `github` | gh CLI or token |
| `linear` | API key |
| `notion` | Integration token |

### Workflow

```bash
# 1. Check available sources
ralph-starter source list

# 2. Configure if needed
ralph-starter config set linear.apiKey <key>

# 3. Test connection
ralph-starter source test linear

# 4. Preview items
ralph-starter source preview linear --label "in-progress"

# 5. Run with source
ralph-starter run --from linear --label "in-progress"
```

### See Also

- [ralph-starter config](/docs/cli/config)
- [Input Sources Overview](/docs/sources/overview)
- [GitHub Source](/docs/sources/github)
- [Linear Source](/docs/sources/linear)


---

## ralph-starter presets

List and use pre-configured workflow presets for common development scenarios.

### Synopsis

```bash
# List all available presets
ralph-starter presets

# Use a preset with the run command
ralph-starter run --preset <name> [task]
```

### Description

Presets are pre-configured workflow settings that tune ralph-starter's behavior for specific development scenarios. Each preset adjusts parameters like maximum iterations, validation behavior, auto-commit settings, and provides a specialized prompt prefix that guides the agent's approach.

Running `ralph-starter presets` lists all available presets grouped by category. To use a preset, pass `--preset <name>` to the `ralph-starter run` command.

### Preset Reference

#### Development

##### `feature`

Standard feature implementation with validation and commits.

| Setting | Value |
|---------|-------|
| Max Iterations | 30 |
| Validate | Yes |
| Commit | Yes |
| Circuit Breaker | 3 consecutive failures, 5 same errors |

```bash
ralph-starter run --preset feature "add user authentication"
```

##### `feature-minimal`

Quick feature implementation without validation. Useful for rapid prototyping.

| Setting | Value |
|---------|-------|
| Max Iterations | 20 |
| Validate | No |
| Commit | Yes |

```bash
ralph-starter run --preset feature-minimal "scaffold dashboard layout"
```

##### `tdd-red-green`

Test-driven development workflow. The agent writes a failing test first, then implements the minimum code to make it pass, then refactors.

| Setting | Value |
|---------|-------|
| Max Iterations | 50 |
| Validate | Yes |
| Commit | Yes |
| Circuit Breaker | 5 consecutive failures, 3 same errors |

Agent instructions: Follow strict TDD -- write a failing test first, run tests to confirm failure, implement minimum code to pass, refactor if needed. Commit after each green test.

```bash
ralph-starter run --preset tdd-red-green "implement shopping cart service"
```

##### `spec-driven`

Implementation driven by specification files. The agent reads specs from a `specs/` directory and tracks progress in `IMPLEMENTATION_PLAN.md`.

| Setting | Value |
|---------|-------|
| Max Iterations | 40 |
| Validate | Yes |
| Commit | Yes |

Agent instructions: Read the specification files in the `specs/` directory. Implement according to the requirements. Mark tasks complete in `IMPLEMENTATION_PLAN.md` as you finish them.

```bash
ralph-starter run --preset spec-driven
```

##### `refactor`

Safe refactoring with continuous test validation. The agent makes small, incremental changes and commits after each successful refactoring step.

| Setting | Value |
|---------|-------|
| Max Iterations | 40 |
| Validate | Yes |
| Commit | Yes |
| Circuit Breaker | 2 consecutive failures, 3 same errors |

```bash
ralph-starter run --preset refactor "extract auth logic into separate module"
```

---

#### Debugging

##### `debug`

Open-ended debugging session without auto-commits. The agent adds logging, analyzes outputs, and identifies root causes.

| Setting | Value |
|---------|-------|
| Max Iterations | 20 |
| Validate | No |
| Commit | No |

Agent instructions: Debug the issue step by step. Add logging, analyze outputs, identify root cause. Document findings.

```bash
ralph-starter run --preset debug "users report 500 errors on /api/orders"
```

##### `incident-response`

Quick fix for production incidents. The agent focuses on the minimal fix and avoids refactoring.

| Setting | Value |
|---------|-------|
| Max Iterations | 15 |
| Validate | Yes |
| Commit | Yes |
| Circuit Breaker | 2 consecutive failures, 2 same errors |

Agent instructions: This is a production incident. Focus on the minimal fix. Avoid refactoring. Document the issue and solution.

```bash
ralph-starter run --preset incident-response "fix: payments webhook returning 503"
```

##### `code-archaeology`

Investigate and document legacy code. The agent explores the codebase to understand how it works and adds documentation.

| Setting | Value |
|---------|-------|
| Max Iterations | 30 |
| Validate | No |
| Commit | No |

Agent instructions: Investigate the codebase to understand how it works. Add documentation and comments. Create diagrams if helpful.

```bash
ralph-starter run --preset code-archaeology "document the billing system architecture"
```

---

#### Review

##### `review`

General code review and suggestions. The agent reviews for bugs, security issues, performance problems, and code quality without implementing changes.

| Setting | Value |
|---------|-------|
| Max Iterations | 10 |
| Validate | Yes |
| Commit | No |

Agent instructions: Review the code for bugs, security issues, performance problems, and code quality. Suggest improvements but do not implement.

```bash
ralph-starter run --preset review "review the authentication module"
```

##### `pr-review`

Pull request review. The agent checks for correctness, test coverage, documentation, and breaking changes.

| Setting | Value |
|---------|-------|
| Max Iterations | 10 |
| Validate | Yes |
| Commit | No |

Agent instructions: Review the changes in this PR. Check for correctness, test coverage, documentation, and breaking changes. Provide actionable feedback.

```bash
ralph-starter run --preset pr-review "review changes in feature/auth branch"
```

##### `adversarial-review`

Security-focused adversarial review. The agent looks for injection vulnerabilities, authentication bypasses, authorization issues, data leaks, and OWASP Top 10 concerns.

| Setting | Value |
|---------|-------|
| Max Iterations | 15 |
| Validate | No |
| Commit | No |

```bash
ralph-starter run --preset adversarial-review "security audit of the API layer"
```

---

#### Documentation

##### `docs`

Generate comprehensive documentation including API docs, usage examples, and architecture overviews.

| Setting | Value |
|---------|-------|
| Max Iterations | 20 |
| Validate | No |
| Commit | Yes |

```bash
ralph-starter run --preset docs "generate API documentation for the payments module"
```

##### `documentation-first`

Write documentation before implementation. The agent documents purpose, API, usage examples, and edge cases first, then implements to match the documentation.

| Setting | Value |
|---------|-------|
| Max Iterations | 30 |
| Validate | No |
| Commit | Yes |

```bash
ralph-starter run --preset documentation-first "design and document the notification service API"
```

---

#### Specialized

##### `api-design`

API design and implementation following REST best practices, including proper HTTP methods, status codes, error handling, validation, and documentation.

| Setting | Value |
|---------|-------|
| Max Iterations | 35 |
| Validate | Yes |
| Commit | Yes |

```bash
ralph-starter run --preset api-design "design REST API for user management"
```

##### `migration-safety`

Safe database and data migrations with a focus on reversibility, zero data loss, backward compatibility, and rollback scripts. Has a strict circuit breaker to stop early on failures.

| Setting | Value |
|---------|-------|
| Max Iterations | 25 |
| Validate | Yes |
| Commit | Yes |
| Circuit Breaker | 1 consecutive failure, 2 same errors |

```bash
ralph-starter run --preset migration-safety "migrate users table to add role column"
```

##### `performance-optimization`

Performance analysis and optimization. The agent profiles first, identifies bottlenecks, makes targeted improvements, and documents performance gains.

| Setting | Value |
|---------|-------|
| Max Iterations | 30 |
| Validate | Yes |
| Commit | Yes |

```bash
ralph-starter run --preset performance-optimization "optimize database queries in the dashboard"
```

##### `scientific-method`

Hypothesis-driven development. The agent follows the scientific method: observe the problem, form a hypothesis, design an experiment (test), implement and test, analyze results, and iterate.

| Setting | Value |
|---------|-------|
| Max Iterations | 40 |
| Validate | Yes |
| Commit | Yes |

```bash
ralph-starter run --preset scientific-method "investigate and fix flaky test in auth.spec.ts"
```

##### `research`

Research and exploration without code changes. The agent explores options, compares alternatives, and documents findings in a summary report.

| Setting | Value |
|---------|-------|
| Max Iterations | 25 |
| Validate | No |
| Commit | No |

```bash
ralph-starter run --preset research "evaluate state management solutions for the frontend"
```

##### `gap-analysis`

Compare a specification to the current implementation. The agent identifies gaps, missing features, and discrepancies, then creates a prioritized TODO list.

| Setting | Value |
|---------|-------|
| Max Iterations | 20 |
| Validate | Yes |
| Commit | No |

```bash
ralph-starter run --preset gap-analysis "compare API spec to current implementation"
```

### Preset Settings Reference

Every preset configures the following settings:

| Setting | Description |
|---------|-------------|
| `maxIterations` | Maximum number of loop iterations the agent can run |
| `validate` | Whether to run tests/lint/build after each iteration |
| `commit` | Whether to auto-commit after successful iterations |
| `promptPrefix` | Instructions prepended to the agent's task prompt |
| `completionPromise` | String the agent outputs to signal task completion |
| `circuitBreaker` | Automatic stop conditions to prevent infinite loops |

#### Circuit Breaker

Some presets include a circuit breaker that stops execution early when the agent is stuck:

- **`maxConsecutiveFailures`** -- Stop after N consecutive failed iterations.
- **`maxSameErrorCount`** -- Stop after seeing the same error N times.

Presets with strict circuit breakers (like `migration-safety`) stop quickly to prevent cascading damage. Presets for exploration (like `debug`, `research`) omit circuit breakers to allow more freedom.

### Quick Reference Table

| Preset | Iterations | Validate | Commit | Category |
|--------|-----------|----------|--------|----------|
| `feature` | 30 | Yes | Yes | Development |
| `feature-minimal` | 20 | No | Yes | Development |
| `tdd-red-green` | 50 | Yes | Yes | Development |
| `spec-driven` | 40 | Yes | Yes | Development |
| `refactor` | 40 | Yes | Yes | Development |
| `debug` | 20 | No | No | Debugging |
| `incident-response` | 15 | Yes | Yes | Debugging |
| `code-archaeology` | 30 | No | No | Debugging |
| `review` | 10 | Yes | No | Review |
| `pr-review` | 10 | Yes | No | Review |
| `adversarial-review` | 15 | No | No | Review |
| `docs` | 20 | No | Yes | Documentation |
| `documentation-first` | 30 | No | Yes | Documentation |
| `api-design` | 35 | Yes | Yes | Specialized |
| `migration-safety` | 25 | Yes | Yes | Specialized |
| `performance-optimization` | 30 | Yes | Yes | Specialized |
| `scientific-method` | 40 | Yes | Yes | Specialized |
| `research` | 25 | No | No | Specialized |
| `gap-analysis` | 20 | Yes | No | Specialized |

### See Also

- [ralph-starter run](/docs/cli/run) - Use presets with the `--preset` flag
- [ralph-starter auto](/docs/cli/auto) - Combine presets with batch processing


---

Manage agent skills — reusable instructions and best practices
that enhance your AI coding agent's capabilities.

### Synopsis

```bash
ralph-starter skill <action> [name]
```

### Description

The `skill` command manages agent skills for ralph-starter.
Skills are markdown files containing specialized instructions,
best practices, and domain knowledge that are injected into
your coding agent's context. They help the agent write better
code by following established patterns for specific frameworks
and tools.

Skills are installed using the
[`add-skill`](https://github.com/xpander-ai/agent-skills-ts)
CLI and stored as markdown files in either a global directory
(`~/.claude/skills/`) or a project-level directory
(`.claude/skills/`).

### Actions

| Action          | Aliases        | Description                              |
| --------------- | -------------- | ---------------------------------------- |
| `add <repo>`    | `install`, `i` | Install a skill from a git repository    |
| `list`          | `ls`           | List popular skills from the registry    |
| `search <term>` | -              | Search for skills by keyword             |
| `browse`        | -              | Interactive skill browser with selection |

### Options

| Option         | Description                                     | Default |
| -------------- | ----------------------------------------------- | ------- |
| `-g, --global` | Install the skill globally (all projects)       | `false` |

### Examples

#### Install a Skill

```bash
# Install a skill repository
ralph-starter skill add vercel-labs/agent-skills

# Short alias
ralph-starter skill i vercel-labs/agent-skills

# Install globally
ralph-starter skill add vercel-labs/agent-skills --global
```

#### List Popular Skills

```bash
ralph-starter skill list
```

Output:

```text
Popular Skills

  vercel-labs/agent-skills
  React, Next.js, and Vercel best practices
  Skills: react-best-practices, nextjs-best-practices,
          vercel-best-practices, web-design-review

Install with: ralph-starter skill add <repo>
Browse more: https://github.com/topics/agent-skills
```

#### Search for Skills

```bash
ralph-starter skill search react
```

Output:

```text
Searching for: react

  vercel-labs/agent-skills
  React, Next.js, and Vercel best practices
```

#### Interactive Browse

```bash
ralph-starter skill browse
```

This opens an interactive menu where you can select a skill
to install from the curated registry.

```text
? Select a skill to install:
  > vercel-labs/agent-skills - React, Next.js, Vercel
    ──────────────
    Cancel
```

### Skill Detection

When ralph-starter runs a task, it automatically detects
installed skills from three locations:

1. **Global skills** — `~/.claude/skills/*.md`
2. **Project skills** — `.claude/skills/*.md` in the project
3. **Skills script** — `skills.sh` files in the project or
   global Claude directory

Detected skills are matched against the project's tech stack
and included in the agent's prompt context when relevant.

### Auto Skill Discovery

Auto skill discovery is opt-in. When enabled, ralph-starter
queries the skills.sh registry to find and install relevant
skills automatically.

Enable it by setting:

```bash
RALPH_ENABLE_SKILL_AUTO_INSTALL=1
```

You can also force-disable it with:

```bash
RALPH_DISABLE_SKILL_AUTO_INSTALL=1
```

### Behavior

- The `add` action uses `npx add-skill` under the hood.
  If `add-skill` is not installed, it runs via `npx`.
- The `list` action shows a curated registry of popular
  skill repositories. It does not scan local installations.
- The `search` action filters the curated registry by
  matching repository names, descriptions, and skill names.
- The `browse` action presents an interactive list using
  Inquirer prompts.

### See Also

- [ralph-starter run](/docs/cli/run) — Skills are
  auto-detected and used during task execution
- [Agent Skills on GitHub](https://github.com/topics/agent-skills)
  — Community skill repositories


---

## ralph-starter template

Browse and use project templates from the ralph-templates repository.

### Synopsis

```bash
ralph-starter template [action] [args...] [options]
```

### Description

The `template` command lets you browse, preview, and use pre-built project templates. Templates are curated specs that describe complete projects, which the AI agent builds from scratch.

Templates are fetched from [github.com/multivmlabs/ralph-templates](https://github.com/multivmlabs/ralph-templates) and cached locally for offline use.

### Actions

| Action | Description |
|--------|-------------|
| `list` | List all available templates |
| `preview <name>` | Preview a template's content |
| `use <name>` | Use a template to start a new project |
| `browse` | Interactive template browser |
| `help` | Show help |

### Options

| Option | Description | Default |
|--------|-------------|---------|
| `--category <name>` | Filter by category | - |
| `--refresh` | Force refresh the cache | false |
| `--auto` | Skip confirmation prompts | false |
| `--output-dir <path>` | Directory to create the project in | cwd |
| `--commit` | Auto-commit after each task | false |
| `--push` | Push commits to remote | false |
| `--pr` | Create pull request when done | false |
| `--validate` | Run tests/lint/build after iterations | false |
| `--agent <name>` | Specify agent | auto-detect |
| `--max-iterations <n>` | Maximum loop iterations | auto |

### Categories

Templates are organized into categories:

- `web-dev` - Web development projects (SaaS, landing pages, dashboards)
- `blockchain` - Web3 and blockchain projects
- `devops` - DevOps tools and automation
- `mobile` - Mobile app projects
- `tools` - CLI tools and utilities
- `seo` - SEO and Answer Engine Optimization toolkits

### Examples

#### List Templates

```bash
# List all templates
ralph-starter template list

# Filter by category
ralph-starter template list --category web-dev

# Force refresh from remote
ralph-starter template list --refresh
```

#### Preview a Template

```bash
# Preview template content
ralph-starter template preview nextjs-saas

# Preview a CLI tool template
ralph-starter template preview cli-tool
```

#### Use a Template

```bash
# Use a template (interactive)
ralph-starter template use landing-page

# Specify output directory
ralph-starter template use nextjs-saas --output-dir ~/projects/my-saas

# Skip prompts
ralph-starter template use cli-tool --auto

# With full automation
ralph-starter template use landing-page --auto --commit --pr
```

#### Interactive Browser

```bash
# Browse templates interactively
ralph-starter template browse
```

#### Quick Use (Shorthand)

```bash
# Use template name directly as action
ralph-starter template nextjs-saas
```

### Template Structure

Each template includes:

- **ID** - Unique identifier (e.g., `nextjs-saas`)
- **Name** - Display name
- **Description** - What the template builds
- **Category** - Organization category
- **Tags** - Searchable keywords
- **Difficulty** - `beginner`, `intermediate`, or `advanced`
- **Spec Content** - The actual project specification in markdown

### Caching

Templates are cached locally at `~/.ralph-starter/templates-cache/`:

- Cache expires after 1 hour
- Use `--refresh` to force update
- Registry and individual templates are cached separately

### Workflow

1. **Browse** - Find a template that matches your needs
2. **Preview** - Check the spec content
3. **Use** - Let the AI agent build it
4. **Customize** - Modify the generated project as needed

### Creating Custom Templates

To contribute templates, see the [ralph-templates repository](https://github.com/multivmlabs/ralph-templates).

### Exit Codes

| Code | Description |
|------|-------------|
| 0 | Success |
| 1 | Error (template not found, network error, etc.) |

### See Also

- [ralph-starter run](/docs/cli/run)
- [ralph-starter wizard](/docs/wizard/overview)
- [Input Sources](/docs/sources/overview)


---

## Sources & Integrations

## Input Sources

ralph-starter can fetch specifications from various external sources, allowing you to turn tasks from your existing tools into built projects.

### Available Sources

#### Built-in Sources

| Source | Description | Auth Required |
|--------|-------------|---------------|
| `file` | Local files and directories | No |
| `url` | Remote URLs (markdown, HTML) | No |
| `pdf` | PDF documents | No |

#### Integration Sources

| Source | Description | Auth Required |
|--------|-------------|---------------|
| `figma` | Figma designs, tokens, components, assets | Yes (API token) |
| `github` | GitHub Issues | Optional (gh CLI or token) |
| `linear` | Linear issues | Yes (API key) |
| `notion` | Notion pages | Yes (API key) |

### Usage

#### Basic Syntax

```bash
ralph-starter run --from <source> [options]
```

#### Examples

```bash
# From a URL
ralph-starter run --from https://example.com/spec.md

# From a local file
ralph-starter run --from ./requirements.pdf

# From GitHub Issues
ralph-starter run --from github --project owner/repo --label "sprint-1"

# From Linear
ralph-starter run --from linear --label "in-progress" --limit 5

# From Notion
ralph-starter run --from notion --project "Product Specs"

```

### Configuration

Store credentials for integration sources:

```bash
# Set credentials
ralph-starter config set figma.token <your-token>
ralph-starter config set linear.apiKey <your-key>
ralph-starter config set notion.token <your-key>
ralph-starter config set github.token <your-token>

# View all config
ralph-starter config list

# Get specific value
ralph-starter config get linear.apiKey

# Remove
ralph-starter config delete linear.apiKey
```

Credentials are stored in `~/.ralph-starter/sources.json`.

### Source Commands

```bash
# List available sources
ralph-starter source list

# Get help for a source
ralph-starter source help github

# Test connectivity
ralph-starter source test linear

# Preview items from source
ralph-starter source preview github --project owner/repo
```

### Common Options

| Option | Description |
|--------|-------------|
| `--project <name>` | Project/repo filter |
| `--label <name>` | Label filter |
| `--status <status>` | Status filter |
| `--limit <n>` | Maximum items to fetch |

### How It Works

1. ralph-starter fetches items from the source
2. Items are converted to a specification format
3. The spec is saved to `specs/` directory
4. Planning and building proceed as normal

### Next Steps

- [Figma](/docs/sources/figma) - Fetch design specs, tokens, and components
- [GitHub](/docs/sources/github) - Fetch from GitHub Issues
- [Linear](/docs/sources/linear) - Fetch from Linear issues
- [Notion](/docs/sources/notion) - Fetch from Notion pages


---

## GitHub Source

Fetch specifications from GitHub Issues to turn them into built projects.

### Authentication

GitHub source works in two modes:

#### 1. GitHub CLI (Recommended)

If you have [GitHub CLI](https://cli.github.com/) installed and authenticated:

```bash
gh auth login
```

No additional configuration needed.

#### 2. Personal Access Token

```bash
ralph-starter config set github.token ghp_xxxxxxxxxxxx
```

Create a token at [GitHub Settings > Developer settings > Personal access tokens](https://github.com/settings/tokens).

Required scopes:
- `repo` (for private repositories)
- `public_repo` (for public repositories only)

### Usage

```bash
# Fetch all open issues from a repo
ralph-starter run --from github --project owner/repo

# Filter by label
ralph-starter run --from github --project owner/repo --label "ready-to-build"

# Filter by status
ralph-starter run --from github --project owner/repo --status open

# Limit results
ralph-starter run --from github --project owner/repo --limit 5

# Combine filters
ralph-starter run --from github --project owner/repo --label "sprint-1" --status open --limit 10
```

### Fetching a Single Issue

Fetch a specific issue by number:

```bash
# By issue number (uses default repo if configured)
ralph-starter run --from github --issue 123

# From a specific repo
ralph-starter run --from github --project owner/repo --issue 123

# By full URL
ralph-starter run --from github --project https://github.com/owner/repo/issues/123
```

This fetches:
- Issue title and body
- Labels and state
- All comments

Perfect for building features from well-specified issues.

### Default Issues Repository

Configure a default repository for fetching issues, so you don't need to specify `--project` every time:

```bash
# Set your default issues repo
ralph-starter config set github.defaultIssuesRepo myorg/my-ideas

# Now you can simply run:
ralph-starter run --from github --issue 42
```

This is useful for teams that maintain a central ideas or roadmap repository.

### Options

| Option | Description | Default |
|--------|-------------|---------|
| `--project` | Repository in `owner/repo` format | Configured default or required |
| `--label` | Filter by label name | None |
| `--status` | Filter by status (`open`, `closed`, `all`) | `open` |
| `--limit` | Maximum issues to fetch | 20 |
| `--issue` | Specific issue number to fetch | None |

### Configuration

| Key | Description |
|-----|-------------|
| `github.token` | Personal access token (if not using gh CLI) |
| `github.defaultIssuesRepo` | Default repository for `--issue` without `--project` |

### Issue Format

GitHub issues are converted to specs with:

- **Title** → Spec title
- **Body** → Spec description
- **Labels** → Tags
- **Comments** → Additional context

#### Example Issue

```markdown
# Add user authentication

## Description
Add email/password authentication to the app.

## Requirements
- Login form
- Registration form
- Password reset flow
- Session management

## Acceptance Criteria
- [ ] Users can register with email
- [ ] Users can log in
- [ ] Users can reset password
```

#### Generated Spec

```markdown
# Add user authentication

Source: GitHub Issue #42 (owner/repo)
Labels: feature, authentication

## Description
Add email/password authentication to the app.

## Requirements
- Login form
- Registration form
- Password reset flow
- Session management

## Acceptance Criteria
- [ ] Users can register with email
- [ ] Users can log in
- [ ] Users can reset password
```

### Preview Issues

Before running, you can preview what will be fetched:

```bash
ralph-starter source preview github --project owner/repo --label "ready"
```

### Test Connection

Verify your authentication:

```bash
ralph-starter source test github
```

### Tips

1. **Use labels effectively** - Create a "ready-to-build" or "ralph" label for issues that are well-specified
2. **Write detailed issues** - Include requirements, acceptance criteria, and context
3. **One issue = one feature** - Keep issues focused for better results


---

## Linear Source

Fetch specifications from Linear issues to build features from your project management tool.

### Authentication

Get your API key from [Linear Settings > API > Personal API keys](https://linear.app/settings/api).

```bash
ralph-starter config set linear.apiKey lin_api_xxxxxxxxxxxx
```

### Usage

```bash
# Fetch issues by label
ralph-starter run --from linear --label "ready-to-build"

# Filter by project
ralph-starter run --from linear --project "Mobile App"

# Filter by status
ralph-starter run --from linear --status "In Progress"

# Combine filters
ralph-starter run --from linear --project "Web App" --label "sprint-1" --limit 10
```

### Options

| Option | Description | Default |
|--------|-------------|---------|
| `--project` | Project name | None (all projects) |
| `--label` | Filter by label | None |
| `--status` | Filter by status | None |
| `--limit` | Maximum issues to fetch | 20 |

### Issue Format

Linear issues are well-suited for ralph-starter because they typically contain:

- Title
- Description (with markdown support)
- Acceptance criteria
- Sub-issues
- Labels and priority

#### Example Linear Issue

```markdown
Title: Add user authentication

Description:
Implement email/password authentication for the web app.

## Requirements
- Login page with email/password
- Registration with email verification
- Password reset flow
- Remember me functionality

## Technical Notes
- Use NextAuth.js
- Store sessions in database
- Add rate limiting

## Acceptance Criteria
- [ ] User can register with email
- [ ] User receives verification email
- [ ] User can log in
- [ ] User can reset password
```

### Generated Spec

```markdown
# Add user authentication

Source: Linear Issue ENG-123
Project: Web App
Labels: feature, authentication
Priority: High

## Description
Implement email/password authentication for the web app.

## Requirements
- Login page with email/password
- Registration with email verification
- Password reset flow
- Remember me functionality

## Technical Notes
- Use NextAuth.js
- Store sessions in database
- Add rate limiting

## Acceptance Criteria
- [ ] User can register with email
- [ ] User receives verification email
- [ ] User can log in
- [ ] User can reset password
```

### Preview Issues

```bash
ralph-starter source preview linear --label "ready-to-build"
```

### Test Connection

```bash
ralph-starter source test linear
```

### Workflow Integration

#### Recommended Labels

Create these labels in Linear:
- `ralph-ready` - Issue is well-specified and ready to build
- `ralph-building` - Currently being built by ralph-starter
- `ralph-done` - Built by ralph-starter

#### Automation Ideas

1. Move issues to "In Progress" when ralph-starter starts
2. Add comments with build progress
3. Close issues when build succeeds

### Tips

1. **Write detailed issues** - Linear's rich markdown support is perfect for detailed specs
2. **Use acceptance criteria** - Checkboxes become testable requirements
3. **Link related issues** - Sub-issues provide additional context
4. **Add technical notes** - Specify tech preferences in the description


---

## Notion Source

Fetch specifications from Notion pages and databases to build from your documentation.

### Features

- **Full page fetching** - Fetches ALL content with automatic pagination (no 100-block limit)
- **Nested blocks** - Recursively fetches children of toggles, columns, and other container blocks
- **Rich content** - Converts Notion blocks to markdown (headings, lists, code, tables, callouts, etc.)
- **Database support** - Query databases and fetch items with properties

### Authentication

#### 1. Create an Integration

1. Go to [Notion Integrations](https://www.notion.so/my-integrations)
2. Click "New integration"
3. Name it "ralph-starter"
4. Select your workspace
5. Copy the "Internal Integration Token"

#### 2. Configure ralph-starter

```bash
ralph-starter config set notion.token secret_xxxxxxxxxxxx
```

#### 3. Share Pages with Integration

In Notion:
1. Open the page/database you want to use
2. Click "..." menu → "Add connections"
3. Select "ralph-starter"

### Public Pages (No Auth Required)

For **public** Notion pages, you can use the URL source directly without any API key:

```bash
ralph-starter run --from https://notion.so/Your-Public-Page-abc123
```

Note: Public page fetching has limited content extraction because Notion renders content client-side. For full content access, use the API integration above.

### Usage

```bash
# Fetch from a specific database/page
ralph-starter run --from notion --project "Product Specs"

# With limit
ralph-starter run --from notion --project "Feature Ideas" --limit 5
```

### Options

| Option | Description | Default |
|--------|-------------|---------|
| `--project` | Database or page name | Required |
| `--limit` | Maximum items to fetch | 20 |

### Page Format

#### Simple Page

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

#### Database of Specs

Create a Notion database with columns:

| Name | Type | Description |
|------|------|-------------|
| Title | Title | Feature name |
| Status | Select | Draft, Ready, Building, Done |
| Priority | Select | Low, Medium, High |
| Description | Text | Feature description |
| Requirements | Text | List of requirements |

ralph-starter fetches items where Status = "Ready" (or as filtered).

### Generated Spec

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

### Preview Pages

```bash
ralph-starter source preview notion --project "Product Specs"
```

### Test Connection

```bash
ralph-starter source test notion
```

### Best Practices

#### Template for Specs

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

#### Database Setup

1. Create a "Specs" database
2. Add Status column with options: Draft, Ready, Building, Done
3. Add Priority column
4. Share with ralph-starter integration
5. Use `--project "Specs"` to fetch

### Supported Block Types

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

### Tips

1. **Use templates** - Create a consistent spec template in Notion
2. **Status tracking** - Use a Status column to mark specs as "Ready"
3. **Rich content** - Notion's blocks (code, callouts, etc.) are converted to markdown
4. **Linked databases** - Reference other pages for additional context
5. **Large pages** - No content limits! Pages with 100+ blocks are fully fetched


---

## Figma Source

Fetch design specifications, design tokens, component code, and assets from Figma to power your AI coding loops.

### Features

| Mode | Description |
|------|-------------|
| **spec** | Convert Figma frames to markdown design specifications |
| **tokens** | Extract colors, typography, shadows to CSS/SCSS/JSON/Tailwind |
| **components** | Generate React, Vue, Svelte, or HTML component code |
| **assets** | Export icons and images with download scripts |
| **content** | Extract text content and apply to existing templates |

### Authentication

#### Personal Access Token

1. Go to **Figma** → **Settings** → **Account** → **Personal Access Tokens**
2. Click **Create a new personal access token**
3. Copy the token

```bash
ralph-starter config set figma.token <your-token>
```

### Usage

#### Basic Usage

```bash
# Fetch design spec from a Figma file
ralph-starter run --from figma --project "https://figma.com/file/ABC123/MyDesign"

# Using file key directly
ralph-starter run --from figma --project "ABC123"
```

#### Mode: Design Spec (default)

Converts Figma frames into markdown specifications for AI coding loops:

```bash
# Fetch entire file
ralph-starter integrations fetch figma "ABC123"

# Fetch specific frames by node ID
ralph-starter integrations fetch figma "ABC123" --figma-nodes "1:23,1:45"
```

Output includes:
- Frame hierarchy with headings
- Dimensions and layout information
- Auto-layout properties (flex, gap, padding)
- Typography details
- Component properties and variants
- Visual effects (shadows, blur)

#### Mode: Design Tokens

Extract design tokens for your codebase:

```bash
# CSS custom properties (default)
ralph-starter integrations fetch figma "ABC123" --figma-mode tokens

# SCSS variables
ralph-starter integrations fetch figma "ABC123" --figma-mode tokens --figma-format scss

# JSON
ralph-starter integrations fetch figma "ABC123" --figma-mode tokens --figma-format json

# Tailwind config
ralph-starter integrations fetch figma "ABC123" --figma-mode tokens --figma-format tailwind
```

Extracted tokens:
- **Colors** – From fill styles
- **Typography** – Font family, size, weight, line height
- **Shadows** – Drop shadows and inner shadows
- **Border Radii** – From frames and shapes
- **Spacing** – From auto-layout gaps

#### Mode: Component Code

Generate framework-specific component code:

```bash
# React (default)
ralph-starter integrations fetch figma "ABC123" --figma-mode components

# Vue SFC
ralph-starter integrations fetch figma "ABC123" --figma-mode components --figma-framework vue

# Svelte
ralph-starter integrations fetch figma "ABC123" --figma-mode components --figma-framework svelte

# Astro
ralph-starter integrations fetch figma "ABC123" --figma-mode components --figma-framework astro

# Next.js (with 'use client')
ralph-starter integrations fetch figma "ABC123" --figma-mode components --figma-framework nextjs

# Nuxt (Vue 3 with CSS modules)
ralph-starter integrations fetch figma "ABC123" --figma-mode components --figma-framework nuxt

# HTML + CSS
ralph-starter integrations fetch figma "ABC123" --figma-mode components --figma-framework html
```

#### Mode: Asset Export

Export icons and images:

```bash
# SVG (default)
ralph-starter integrations fetch figma "ABC123" --figma-mode assets

# PNG at 2x scale
ralph-starter integrations fetch figma "ABC123" --figma-mode assets --figma-format png --figma-scale 2
```

Assets are detected by name patterns: `icon`, `asset`, `logo`, `illustration`.

:::note
Export URLs expire after 30 days. Re-run the fetch to get fresh URLs.
:::

#### Mode: Content Extraction

Extract text content from Figma designs and apply it directly to your existing templates:

```bash
# Extract content and apply to existing project
ralph-starter run --from figma --project "ABC123" --figma-mode content

# Preview changes without applying
ralph-starter run --from figma --project "ABC123" --figma-mode content --figma-preview

# Target specific directory
ralph-starter run --from figma --project "ABC123" --figma-mode content --figma-target "src/pages"

# Use custom content mapping
ralph-starter run --from figma --project "ABC123" --figma-mode content --figma-mapping mapping.json
```

Content mode extracts:
- **Text content** – All text layers organized by frame hierarchy
- **Semantic roles** – Headings, body text, buttons, labels
- **Information architecture** – Page structure and navigation patterns
- **Component mapping** – Matches Figma frames to existing project components

##### Content Mapping File

Create a custom mapping file to control how Figma content maps to your components:

```json
{
  "pages": {
    "Home": "src/pages/Home.tsx",
    "About": "src/pages/About.tsx"
  },
  "components": {
    "Hero": {
      "file": "src/components/Hero.tsx",
      "props": {
        "heading": "title",
        "subheading": "subtitle",
        "cta": "buttonText"
      }
    }
  }
}
```

##### Use Cases

- **Update copy** – Change text content without touching code structure
- **Localization prep** – Extract all text for translation
- **Design sync** – Keep your app in sync with design changes
- **Content-first development** – Start with real content from designs

### Options

| Option | Description | Values |
|--------|-------------|--------|
| `--figma-mode` | Operation mode | `spec`, `tokens`, `components`, `assets`, `content` |
| `--figma-format` | Token output format | `css`, `scss`, `json`, `tailwind` |
| `--figma-framework` | Component framework | `react`, `vue`, `svelte`, `astro`, `nextjs`, `nuxt`, `html` |
| `--figma-nodes` | Specific node IDs | Comma-separated (e.g., `1:23,1:45`) |
| `--figma-scale` | Image export scale | Number (default: `1`) |
| `--figma-target` | Target directory (content mode) | Path (e.g., `src/pages`) |
| `--figma-preview` | Preview without applying (content mode) | Flag |
| `--figma-mapping` | Custom mapping file (content mode) | File path (e.g., `mapping.json`) |

### Figma URL Formats

The integration accepts various URL formats:

```bash
# Full file URL
https://www.figma.com/file/ABC123/MyDesign

# Design URL (new format)
https://www.figma.com/design/ABC123/MyDesign

# With node selection
https://www.figma.com/file/ABC123/MyDesign?node-id=1:23

# File key only
ABC123
```

### Example Workflows

#### Design-to-Code with AI Loop

```bash
# Use Figma design as task specification
ralph-starter run --from figma \
  --project "https://figma.com/file/ABC123/LoginPage" \
  --preset feature
```

#### Generate Theme File

```bash
# Extract tokens and redirect to file
ralph-starter integrations fetch figma "ABC123" \
  --figma-mode tokens \
  --figma-format css > theme.css
```

#### Export All Icons

```bash
# Get icon manifest with download script
ralph-starter integrations fetch figma "ABC123" --figma-mode assets

# Run the generated curl commands to download
```

### Test Connection

Verify your authentication:

```bash
ralph-starter integrations test figma
```

### Troubleshooting

#### "Invalid Figma token"

Your token may have expired or been revoked. Create a new token in Figma settings.

#### "Access denied"

Ensure your token has access to the file. For team files, you need to be a member of the team.

#### "File not found"

Check the file key or URL is correct. The file key is the 22-character string after `/file/` in the URL.

#### No assets found

Assets are detected by name patterns. Rename your icon frames to include "icon", "logo", or "asset" in the name, or specify node IDs directly with `--figma-nodes`.

### Limitations

- **Variables API** requires Figma Enterprise plan (falls back to styles)
- **Image export URLs** expire after 30 days
- **Large files** may be slow; use `--figma-nodes` to target specific frames


---

## Guides

## Workflow Presets

Presets are pre-configured bundles of loop settings designed for common development scenarios. Instead of manually specifying `--max-iterations`, `--validate`, `--commit`, and other flags every time, you select a preset and ralph-starter applies the right combination automatically.

```bash
ralph-starter run "implement user authentication" --preset feature
```

### How Presets Work

A preset configures up to seven dimensions of loop behavior:

| Setting | Purpose |
|---------|---------|
| `maxIterations` | Hard cap on how many agent iterations the loop can run |
| `validate` | Whether to run tests/lint/build after each iteration |
| `commit` | Whether to auto-commit passing changes |
| `completionPromise` | A specific string the agent must output to signal completion |
| `promptPrefix` | Instructions injected at the start of the agent prompt |
| `rateLimit` | Maximum API calls per hour (optional) |
| `circuitBreaker` | Custom failure thresholds for the circuit breaker (optional) |

When you pass `--preset feature`, ralph-starter looks up the preset by name and merges its configuration into the loop options. Any flag you pass explicitly on the command line takes precedence over the preset value.

### Preset Categories

Presets are organized into five categories: Development, Debugging, Review, Documentation, and Specialized.

---

#### Development Presets

These presets are for building and modifying code.

##### `feature`

The workhorse preset for standard feature implementation.

| Setting | Value |
|---------|-------|
| Max Iterations | 30 |
| Validate | Yes |
| Commit | Yes |
| Completion Promise | `FEATURE_COMPLETE` |
| Circuit Breaker | 3 consecutive failures, 5 same-error max |

The agent codes, validates, and commits in a tight loop. It stops when it outputs the string `FEATURE_COMPLETE` or hits 30 iterations. The circuit breaker prevents infinite loops if the agent keeps hitting the same error.

```bash
ralph-starter run "add pagination to the users API endpoint" --preset feature
```

##### `feature-minimal`

A lighter version of `feature` for quick tasks that do not need validation.

| Setting | Value |
|---------|-------|
| Max Iterations | 20 |
| Validate | No |
| Commit | Yes |

Use this when you trust the agent to produce correct code without a test/lint/build check, such as small config changes or straightforward boilerplate.

```bash
ralph-starter run "add .env.example file with all required vars" --preset feature-minimal
```

##### `tdd-red-green`

Strict test-driven development: write a failing test, implement minimum code to pass, refactor.

| Setting | Value |
|---------|-------|
| Max Iterations | 50 |
| Validate | Yes |
| Commit | Yes |
| Prompt Prefix | Follow strict TDD: write failing test, confirm failure, implement minimum code, refactor. Commit after each green test. |
| Circuit Breaker | 5 consecutive failures, 3 same-error max |

The higher iteration limit (50) accommodates the red-green-refactor cycle, which naturally takes more turns. The prompt prefix forces the agent to follow TDD discipline.

```bash
ralph-starter run "add email validation to signup form" --preset tdd-red-green
```

##### `spec-driven`

Implementation driven by specification files in a `specs/` directory.

| Setting | Value |
|---------|-------|
| Max Iterations | 40 |
| Validate | Yes |
| Commit | Yes |
| Prompt Prefix | Read specification files in specs/ directory. Implement according to requirements. Mark tasks complete in IMPLEMENTATION_PLAN.md. |
| Completion Promise | `<promise>COMPLETE</promise>` |

The agent reads your spec files, implements them, and tracks progress in an `IMPLEMENTATION_PLAN.md` file. It signals completion with the `<promise>COMPLETE</promise>` tag.

```bash
ralph-starter run "implement the payment module" --preset spec-driven
```

##### `refactor`

Safe refactoring with continuous test validation.

| Setting | Value |
|---------|-------|
| Max Iterations | 40 |
| Validate | Yes |
| Commit | Yes |
| Prompt Prefix | Refactor while maintaining all tests passing. Make small, incremental changes. Commit after each successful refactoring step. |
| Circuit Breaker | 2 consecutive failures, 3 same-error max |

The tight circuit breaker (2 consecutive failures) catches regressions fast. The prompt forces small, incremental changes so each commit is safe to revert individually.

```bash
ralph-starter run "extract shared utilities from controllers" --preset refactor
```

---

#### Debugging Presets

These presets are for investigating and fixing issues.

##### `debug`

General debugging session without auto-commits.

| Setting | Value |
|---------|-------|
| Max Iterations | 20 |
| Validate | No |
| Commit | No |
| Prompt Prefix | Debug step by step. Add logging, analyze outputs, identify root cause. Document findings. |

No commits and no validation -- the agent is free to add temporary logging, experiment, and explore without polluting your git history.

```bash
ralph-starter run "figure out why WebSocket connections drop after 30 seconds" --preset debug
```

##### `incident-response`

Quick fix for production incidents with tight guardrails.

| Setting | Value |
|---------|-------|
| Max Iterations | 15 |
| Validate | Yes |
| Commit | Yes |
| Prompt Prefix | This is a production incident. Focus on the minimal fix. Avoid refactoring. Document the issue and solution. |
| Circuit Breaker | 2 consecutive failures, 2 same-error max |

Low iteration cap (15) and aggressive circuit breaker (2/2) keep the agent focused. The prompt explicitly discourages refactoring -- you want the smallest safe fix, not a rewrite.

```bash
ralph-starter run "fix: users getting 500 on /api/checkout" --preset incident-response
```

##### `code-archaeology`

Investigate and document legacy code without changing anything.

| Setting | Value |
|---------|-------|
| Max Iterations | 30 |
| Validate | No |
| Commit | No |
| Prompt Prefix | Investigate the codebase to understand how it works. Add documentation and comments. Create diagrams if helpful. |

```bash
ralph-starter run "document the payment processing pipeline" --preset code-archaeology
```

---

#### Review Presets

These presets produce analysis and feedback without implementing changes.

##### `review`

General code review and suggestions.

| Setting | Value |
|---------|-------|
| Max Iterations | 10 |
| Validate | Yes |
| Commit | No |
| Prompt Prefix | Review the code for: bugs, security issues, performance problems, code quality. Suggest improvements but do not implement. |

```bash
ralph-starter run "review the authentication middleware" --preset review
```

##### `pr-review`

Pull request review.

| Setting | Value |
|---------|-------|
| Max Iterations | 10 |
| Validate | Yes |
| Commit | No |
| Prompt Prefix | Review changes in this PR. Check for: correctness, test coverage, documentation, breaking changes. Provide actionable feedback. |

```bash
ralph-starter run "review PR #42" --preset pr-review --source github
```

##### `adversarial-review`

Security-focused adversarial review.

| Setting | Value |
|---------|-------|
| Max Iterations | 15 |
| Validate | No |
| Commit | No |
| Prompt Prefix | Perform an adversarial security review. Look for: injection vulnerabilities, authentication bypasses, authorization issues, data leaks, OWASP Top 10. |

No validation is needed because the agent is reading, not writing. The higher iteration count (15 vs 10 for normal review) gives the agent more room to explore attack surfaces.

```bash
ralph-starter run "security audit the API endpoints" --preset adversarial-review
```

---

#### Documentation Presets

These presets focus on generating or organizing documentation.

##### `docs`

Generate comprehensive documentation.

| Setting | Value |
|---------|-------|
| Max Iterations | 20 |
| Validate | No |
| Commit | Yes |
| Prompt Prefix | Generate comprehensive documentation. Include: API docs, usage examples, architecture overview. Use clear language. |

```bash
ralph-starter run "document the REST API" --preset docs
```

##### `documentation-first`

Write documentation before implementation.

| Setting | Value |
|---------|-------|
| Max Iterations | 30 |
| Validate | No |
| Commit | Yes |
| Prompt Prefix | Write documentation first, then implement. Document: purpose, API, usage examples, edge cases. Implementation must match documentation. |

```bash
ralph-starter run "design and implement the notification service" --preset documentation-first
```

---

#### Specialized Presets

These presets address specific engineering workflows.

##### `api-design`

API design and implementation following REST best practices.

| Setting | Value |
|---------|-------|
| Max Iterations | 35 |
| Validate | Yes |
| Commit | Yes |
| Prompt Prefix | Design and implement the API following REST best practices. Include: proper HTTP methods, status codes, error handling, validation, documentation. |

```bash
ralph-starter run "create CRUD endpoints for products" --preset api-design
```

##### `migration-safety`

Safe database and data migrations with rollback support.

| Setting | Value |
|---------|-------|
| Max Iterations | 25 |
| Validate | Yes |
| Commit | Yes |
| Prompt Prefix | Create safe migrations. Ensure: reversibility, no data loss, backward compatibility, proper testing. Create rollback scripts. |
| Circuit Breaker | 1 consecutive failure, 2 same-error max |

The most aggressive circuit breaker of any preset (1 failure trips it) because a broken migration can cause data loss.

```bash
ralph-starter run "add email column to users table" --preset migration-safety
```

##### `performance-optimization`

Performance analysis and targeted optimization.

| Setting | Value |
|---------|-------|
| Max Iterations | 30 |
| Validate | Yes |
| Commit | Yes |
| Prompt Prefix | Analyze and optimize performance. Profile first, identify bottlenecks, make targeted improvements. Document performance gains. |

```bash
ralph-starter run "optimize the search query that times out on large datasets" --preset performance-optimization
```

##### `scientific-method`

Hypothesis-driven development.

| Setting | Value |
|---------|-------|
| Max Iterations | 40 |
| Validate | Yes |
| Commit | Yes |
| Prompt Prefix | Follow the scientific method: 1) Observe the problem, 2) Form a hypothesis, 3) Design an experiment (test), 4) Implement and test, 5) Analyze results, 6) Iterate. |

Use this when you are unsure what the right approach is and want the agent to systematically explore options.

```bash
ralph-starter run "reduce memory usage in the data processing pipeline" --preset scientific-method
```

##### `research`

Research and exploration without code changes.

| Setting | Value |
|---------|-------|
| Max Iterations | 25 |
| Validate | No |
| Commit | No |
| Prompt Prefix | Research the topic thoroughly. Explore options, compare alternatives, document findings. Create a summary report. |

```bash
ralph-starter run "evaluate ORMs for our Node.js backend" --preset research
```

##### `gap-analysis`

Compare specification to implementation and identify discrepancies.

| Setting | Value |
|---------|-------|
| Max Iterations | 20 |
| Validate | Yes |
| Commit | No |
| Prompt Prefix | Compare the specification to the current implementation. Identify gaps, missing features, and discrepancies. Create a prioritized TODO list. |

```bash
ralph-starter run "compare our API to the OpenAPI spec" --preset gap-analysis
```

---

### How `promptPrefix` Shapes Agent Behavior

The `promptPrefix` is injected at the beginning of the prompt sent to the agent on every iteration. It acts as a persistent system instruction that steers the agent's approach throughout the entire loop.

For example, the `tdd-red-green` preset injects:

> Follow strict TDD: 1) Write a failing test first, 2) Run tests to confirm failure, 3) Implement minimum code to pass, 4) Refactor if needed. Commit after each green test.

This means even if the agent's natural inclination is to implement first, the prefix overrides that behavior on every turn.

### How `completionPromise` Controls Stopping

The `completionPromise` is a specific string the agent must output for the loop to detect task completion. This is more reliable than heuristic-based completion detection.

- `feature` uses `FEATURE_COMPLETE` -- the agent must explicitly say this string.
- `spec-driven` uses `<promise>COMPLETE</promise>` -- a structured tag that is harder to trigger accidentally.
- Presets without a `completionPromise` rely on ralph-starter's built-in semantic completion detection and standard markers like `<TASK_DONE>` or `All tasks completed`.

### Combining Presets with CLI Flags

CLI flags always override preset values. This lets you use a preset as a starting point and customize specific settings.

```bash
# Use feature preset but increase iterations
ralph-starter run "implement complex auth flow" --preset feature --max-iterations 50

# Use tdd-red-green but skip commits
ralph-starter run "add unit tests" --preset tdd-red-green --no-commit

# Use debug preset but enable validation
ralph-starter run "fix the flaky test" --preset debug --validate

# Use review preset with a specific agent
ralph-starter run "review the auth module" --preset review --agent cursor
```

### Example Workflows

#### Workflow: TDD Feature Development

```bash
# Start with TDD preset
ralph-starter run "add password reset functionality" \
  --preset tdd-red-green \
  --validate \
  --commit

# Agent will:
# 1. Write a failing test for password reset
# 2. Run tests to confirm failure
# 3. Implement the minimum code to make the test pass
# 4. Commit
# 5. Repeat for the next test case
```

#### Workflow: Incident Response

```bash
# Production is down -- use incident-response preset
ralph-starter run "fix: 500 errors on /api/orders after deploy" \
  --preset incident-response \
  --push \
  --pr

# Agent will:
# 1. Identify the root cause (limited to 15 iterations)
# 2. Apply the minimal fix
# 3. Validate that tests pass
# 4. Commit, push, and create a PR
# Circuit breaker trips fast (2 failures) to avoid wasting time
```

#### Workflow: Adversarial Security Review

```bash
# Run a security audit
ralph-starter run "audit all API endpoints for OWASP Top 10" \
  --preset adversarial-review

# Agent will:
# 1. Enumerate all API endpoints
# 2. Check for injection vulnerabilities
# 3. Test authentication and authorization
# 4. Look for data leaks
# 5. Produce a security report (no code changes, no commits)
```

#### Workflow: Spec-Driven Implementation

```bash
# Place your spec files in specs/ and an IMPLEMENTATION_PLAN.md
ralph-starter run "implement the payment module per spec" \
  --preset spec-driven \
  --validate \
  --commit

# Agent will:
# 1. Read specs/ directory
# 2. Implement each requirement
# 3. Check off tasks in IMPLEMENTATION_PLAN.md
# 4. Output <promise>COMPLETE</promise> when done
```

### Listing Available Presets

To see all available presets from the command line:

```bash
ralph-starter run --help
```

The help output groups presets by category with their descriptions:

```
Available presets:

  Development:
    feature                Standard feature implementation with validation and commits
    feature-minimal        Quick feature implementation without validation
    tdd-red-green          Test-driven development: write failing test, then implement
    spec-driven            Implementation driven by specification files
    refactor               Safe refactoring with continuous test validation

  Debugging:
    debug                  Debugging session without auto-commits
    incident-response      Quick fix for production incidents
    code-archaeology       Investigate and document legacy code

  Review:
    review                 Code review and suggestions
    pr-review              Pull request review
    adversarial-review     Security-focused adversarial review

  Documentation:
    docs                   Generate documentation
    documentation-first    Write docs before implementation

  Specialized:
    api-design             API design and implementation
    migration-safety       Safe database/data migrations
    performance-optimization  Performance analysis and optimization
    scientific-method      Hypothesis-driven development
    research               Research and exploration
    gap-analysis           Compare spec to implementation
```

### Choosing the Right Preset

| Situation | Recommended Preset |
|---|---|
| Building a new feature | `feature` |
| Quick scaffolding or config changes | `feature-minimal` |
| Test-first development | `tdd-red-green` |
| Working from a detailed spec | `spec-driven` |
| Cleaning up code | `refactor` |
| Investigating a bug | `debug` |
| Production is down | `incident-response` |
| Understanding legacy code | `code-archaeology` |
| Reviewing code quality | `review` |
| Reviewing a pull request | `pr-review` |
| Security audit | `adversarial-review` |
| Writing documentation | `docs` |
| Design-first approach | `documentation-first` |
| Building REST APIs | `api-design` |
| Database migrations | `migration-safety` |
| Performance tuning | `performance-optimization` |
| Exploring solutions | `scientific-method` |
| Comparing options | `research` |
| Checking spec compliance | `gap-analysis` |


---

## PRD Workflow

A PRD (Product Requirements Document) workflow lets you define a structured list of tasks in a markdown file and have ralph-starter execute them one by one. Instead of describing a single open-ended task, you break the work into discrete checkboxes. The agent works through each checkbox, marking them complete as it goes.

### What Is a PRD File?

A PRD file is a standard markdown file with checkbox-formatted tasks. Ralph-starter parses the file, identifies incomplete tasks, and feeds them to the AI agent in order.

```bash
ralph-starter run --prd ./PRD.md
```

### PRD File Format

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

#### Format Rules

| Element | Syntax | Purpose |
|---|---|---|
| Title | `# Heading` | First `#` heading becomes the PRD title |
| Description | Plain text after title, before first task | Context for the agent |
| Section headers | `##` or `###` headings | Group related tasks |
| Incomplete task | `- [ ] Task description` | Work to be done |
| Completed task | `- [x] Task description` | Already done (skipped) |

Both `-` and `*` list markers are supported. The checkbox can use `x` or `X` for completed tasks.

### How Tasks Are Parsed

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

### How Tasks Are Executed

When you run `ralph-starter run --prd ./PRD.md`, the following happens:

#### Step 1: Parse and Filter

The parser reads the file and filters to only **incomplete** tasks (`- [ ]`). Already completed tasks (`- [x]`) are counted for progress display but skipped.

#### Step 2: Build the Agent Prompt

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

#### Step 3: Agent Loop

The agent receives this prompt and begins working. After completing each task, it is instructed to check off the corresponding checkbox in the original PRD file by changing `- [ ]` to `- [x]`.

#### Step 4: Progress Tracking

Each time the agent modifies the PRD file, ralph-starter can re-parse it to see updated progress. The `getPrdStats` function returns:

```typescript
{
  total: 10,        // Total tasks
  completed: 5,     // Checked off
  pending: 5,       // Remaining
  percentComplete: 50  // Percentage
}
```

### Combining with Loop Flags

The PRD workflow works with all standard loop flags:

#### With `--commit`

Auto-commit after each successful iteration. This creates a git history where each commit corresponds to progress on the PRD.

```bash
ralph-starter run --prd ./PRD.md --commit
```

#### With `--validate`

Run tests, lint, and build after each iteration. If validation fails, the agent gets the error output and fixes the issue before moving to the next task.

```bash
ralph-starter run --prd ./PRD.md --validate --commit
```

#### With `--push` and `--pr`

Push changes and create a pull request when the loop completes.

```bash
ralph-starter run --prd ./PRD.md --commit --push --pr
```

#### With a Preset

Combine PRD-driven execution with a preset's configuration:

```bash
ralph-starter run --prd ./PRD.md --preset feature
```

This gives you the `feature` preset's settings (30 max iterations, validation, commits, circuit breaker) while using the PRD file for task structure.

#### With `--max-iterations`

Set an iteration limit to prevent runaway execution:

```bash
ralph-starter run --prd ./PRD.md --max-iterations 20
```

### Example PRD Files

#### Example: New Feature

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

#### Example: Bug Fix Checklist

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

#### Example: Refactoring Plan

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

### Tips

#### Keep Tasks Atomic

Each checkbox should be a single, well-defined unit of work. Avoid tasks like "implement the entire backend" -- break that into specific endpoints, models, and tests.

#### Order Tasks by Dependency

Put foundational tasks first (database migrations before API endpoints, interfaces before implementations). The agent works through tasks in order, so dependencies should be resolved before dependent tasks.

#### Use Sections for Organization

Group related tasks under `##` headers. This makes the PRD easier to read and helps the agent understand the logical structure of the work.

#### Pre-Check Completed Work

If some tasks are already done, mark them with `[x]` before starting. The agent will see the progress ratio and skip completed items.

#### Combine with `--validate`

For best results, always use `--validate` with PRD workflows. This ensures each task produces code that passes your test suite before the agent moves on to the next task.


---

## Cost Tracking

Running autonomous AI loops consumes tokens, and tokens cost money. Ralph-starter includes a built-in cost tracker that estimates token usage and calculates costs per iteration, giving you visibility into how much each loop run is spending.

### Enabling Cost Tracking

Cost tracking is **enabled by default**. You can explicitly control it with CLI flags:

```bash
# Enabled by default -- these are equivalent:
ralph-starter run "add user dashboard" --preset feature
ralph-starter run "add user dashboard" --preset feature --track-cost

# Disable cost tracking:
ralph-starter run "add user dashboard" --preset feature --no-track-cost
```

### Token Estimation

Ralph-starter estimates token counts from the raw text of each agent interaction rather than relying on the provider's token counter. The estimation uses different ratios depending on content type:

| Content Type | Characters per Token | Example |
|---|---|---|
| Prose (English text, docs, explanations) | ~4 chars/token | A 2,000-character paragraph is ~500 tokens |
| Code (source files, config, commands) | ~3.5 chars/token | A 2,000-character code block is ~571 tokens |

The tracker detects code content by checking for common patterns like ` ``` `, `function`, `const`, `import`, `export`, `class`, `def`, `async`, and `await`. If any of these patterns are found, the lower 3.5 chars/token ratio is applied.

These are approximations. Actual token counts may vary by 10-20% depending on the model's tokenizer, language, and content structure.

### Model Pricing

The cost tracker uses the following pricing table to convert token estimates into dollar costs. Prices are per 1 million tokens.

| Model | Input (per 1M tokens) | Output (per 1M tokens) |
|---|---|---|
| Claude 3 Opus | $15.00 | $75.00 |
| Claude 3.5 Sonnet | $3.00 | $15.00 |
| Claude 3.5 Haiku | $0.25 | $1.25 |
| GPT-4 | $30.00 | $60.00 |
| GPT-4 Turbo | $10.00 | $30.00 |
| Default (unknown models) | $3.00 | $15.00 |

If the model you are using is not in the table, the tracker falls back to the **Default** pricing (Claude 3.5 Sonnet-equivalent rates), which provides a conservative middle-ground estimate.

You can specify the model for more accurate pricing:

```bash
ralph-starter run "add feature" --preset feature --model claude-3-opus
```

### Per-Iteration Cost Breakdown

When cost tracking is enabled and progress tracking is active, ralph-starter writes a cost summary to the `activity.md` file in your project directory. This summary is updated after each iteration.

The summary looks like this:

```markdown
## Cost Summary

| Metric | Value |
|--------|-------|
| Total Iterations | 12 |
| Total Tokens | 45.2K |
| Input Tokens | 38.1K |
| Output Tokens | 7.1K |
| Total Cost | $0.221 |
| Avg Cost/Iteration | $0.018 |
| Projected Max Cost | $0.552 |
```

#### Understanding the Metrics

| Metric | Description |
|---|---|
| **Total Iterations** | Number of agent loop iterations completed so far |
| **Total Tokens** | Combined input and output tokens across all iterations |
| **Input Tokens** | Tokens sent to the model (prompts, context, code) |
| **Output Tokens** | Tokens generated by the model (responses, code output) |
| **Total Cost** | Estimated cumulative cost in USD |
| **Avg Cost/Iteration** | Total cost divided by number of iterations |
| **Projected Max Cost** | Extrapolated cost if the loop runs to its `maxIterations` limit |

The **Projected Max Cost** is only shown after 3 or more iterations, since earlier projections would be unreliable. It multiplies the average cost per iteration by the remaining iteration budget and adds the cost already incurred.

### CLI Display

During loop execution, cost statistics are displayed in the terminal:

```
Tokens: 45.2K (38.1K in / 7.1K out)
Cost: $0.221 ($0.018/iteration avg)
Projected max cost: $0.552
```

Token counts use shorthand notation:
- Values under 1,000 are shown as-is (e.g., `847`)
- Values from 1,000 to 999,999 use `K` suffix (e.g., `45.2K`)
- Values above 1,000,000 use `M` suffix (e.g., `1.23M`)

Cost values are formatted for readability:
- Costs under $0.01 are shown with cent symbol (e.g., `0.50¢`)
- Costs from $0.01 to $0.99 show three decimal places (e.g., `$0.221`)
- Costs $1.00 and above show two decimal places (e.g., `$12.50`)

### Tips for Controlling Costs

#### Choose the Right Preset

Presets with lower `maxIterations` naturally cap spending:

| Preset | Max Iterations | Typical Use |
|---|---|---|
| `review` | 10 | Read-only analysis |
| `incident-response` | 15 | Quick focused fix |
| `feature-minimal` | 20 | Simple implementation |
| `debug` | 20 | Investigation |
| `feature` | 30 | Standard development |
| `tdd-red-green` | 50 | Full TDD cycle |

#### Use `--max-iterations` to Set Hard Limits

Override any preset's iteration cap:

```bash
# Cap at 10 iterations regardless of preset
ralph-starter run "add feature" --preset feature --max-iterations 10
```

#### Enable Circuit Breakers

Circuit breakers stop the loop when the agent is stuck, preventing token waste on repeated failures. See the [Circuit Breaker](/docs/advanced/circuit-breaker) documentation for details.

```bash
ralph-starter run "add feature" --circuit-breaker-failures 2 --circuit-breaker-errors 3
```

#### Use Cheaper Models

If your task does not require the most capable model, using a cheaper model reduces cost per iteration significantly. Claude 3.5 Haiku at $0.25/$1.25 per million tokens is 60x cheaper on input and 60x cheaper on output compared to Claude 3 Opus.

#### Use Rate Limiting

Rate limiting caps how fast the loop calls the API, giving you a natural spending brake. See the [Rate Limiting](/docs/advanced/rate-limiting) documentation.

```bash
ralph-starter run "add feature" --rate-limit 30  # Max 30 calls/hour
```

#### Monitor the Projected Cost

Watch the **Projected Max Cost** in the `activity.md` file. If the projection exceeds your budget, you can stop the loop early (Ctrl+C) and restart with a lower `--max-iterations` or a different approach.

### Cost Tracking Architecture

The cost tracker records each iteration independently:

1. **Input text** (the prompt sent to the agent) is measured and converted to estimated input tokens.
2. **Output text** (the agent's response) is measured and converted to estimated output tokens.
3. Both are combined into a `TokenEstimate` (inputTokens, outputTokens, totalTokens).
4. The estimate is multiplied by the model's pricing to produce a `CostEstimate` (inputCost, outputCost, totalCost).
5. Each iteration's data is stored and used to compute running averages and projections.

The tracker instance is created when the loop starts (if `trackCost` is true) and is available throughout the loop's lifetime. At the end of the loop, the final statistics are included in the `LoopResult.stats.costStats` object.


---

## Skills System

Skills are markdown files that provide domain-specific knowledge to AI agents during ralph-starter loops. A skill might teach the agent React best practices, Next.js patterns, or your team's coding conventions. When skills are detected, their content is injected into the agent's prompt, giving it specialized knowledge it would not otherwise have.

### Three Skill Sources

Ralph-starter detects skills from three locations, checked in order:

#### 1. Global Skills (`~/.claude/skills/`)

Skills installed in your home directory's `.claude/skills/` folder are available to every project on your machine.

```
~/.claude/skills/
  react-best-practices.md
  typescript-patterns.md
  testing-strategies.md
```

Each `.md` file in this directory is treated as a skill. The filename (without extension) becomes the skill name.

#### 2. Project Skills (`.claude/skills/`)

Skills placed in your project's `.claude/skills/` directory are specific to that project. These override or supplement global skills and can encode project-specific conventions.

```
your-project/
  .claude/
    skills/
      api-conventions.md
      database-patterns.md
```

#### 3. Skills from `skills.sh`

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

### Skill File Format

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

### Tech-Stack Filtering

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

#### Keyword Expansion

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

### How Skills Are Injected into Agent Prompts

When skills are detected, ralph-starter formats them into a prompt section using `formatSkillsForPrompt`:

```markdown
## Available Claude Code Skills

- **react-best-practices**: Guidelines for writing clean, performant React components.
- **typescript-patterns**: TypeScript patterns and idioms for large codebases.
- **api-conventions**: REST API conventions for this project.

Use these skills when appropriate by invoking them with /skill-name.
```

This block is included in the agent's system context, making the agent aware of the available skills and their purposes.

### Installing Skills with the CLI

Ralph-starter provides a `skill` command for managing skills:

#### Install a Skill

```bash
# Install from a GitHub repository
ralph-starter skill add vercel-labs/agent-skills

# Install globally (available to all projects)
ralph-starter skill add vercel-labs/agent-skills --global
```

This uses the `add-skill` CLI tool under the hood (`npx add-skill <repo>`). If `add-skill` is not installed, it runs via `npx` automatically.

#### List Popular Skills

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

#### Search for Skills

```bash
ralph-starter skill search react
```

Searches the curated skill registry by name, description, and skill names.

#### Browse Interactively

```bash
ralph-starter skill browse
```

Opens an interactive menu where you can select a skill to install.

### Creating Your Own Skills

#### Step 1: Create the Directory

For project-specific skills:

```bash
mkdir -p .claude/skills
```

For global skills:

```bash
mkdir -p ~/.claude/skills
```

#### Step 2: Write the Skill File

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

#### Step 3: Verify Detection

You can verify skills are detected by checking the `hasSkills` function or running a loop with verbose output. The detected skills will show their name, source, and description:

```
Detected skills:
- api-conventions (project): REST API patterns and conventions for the Acme project.
- react-best-practices (global): Guidelines for writing clean, performant React components.
```

### Practical Examples

#### Example: Team Coding Standards

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

#### Example: Database Patterns

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

#### Example: Using Skills with Presets

Skills are automatically detected and injected regardless of which preset you use:

```bash
# Skills are injected into the agent prompt automatically
ralph-starter run "add user profile endpoint" --preset api-design

# The agent will see both the api-design preset instructions AND
# any relevant skills (like api-conventions.md and database-patterns.md)
```

### Skill Precedence

When skills from multiple sources have the same name, all of them are included. They are listed in discovery order: global first, then project, then `skills.sh`. This means project skills appear after global skills in the prompt, giving them a "last word" effect -- the agent tends to weight later instructions more heavily.

For explicit overrides, use a project skill with the same name as a global skill and include a note like "This overrides the global skill" at the top.


---

## Testing ralph-starter Integrations

This guide walks you through testing ralph-starter features and setting up integrations.

### Configuring API Keys

You have two options for storing API keys:

Use the config command to set your API keys:

```bash
ralph-starter config set linear.apiKey lin_api_xxxxx
ralph-starter config set notion.token secret_xxxxx
ralph-starter config set github.token ghp_xxxxx
```

### Quick Start Testing (No API Keys)

You can test many features without any API keys:

#### 1. Test the Interactive Wizard

```bash
ralph-starter
```

This launches the wizard - follow the prompts to describe a project and see the AI refinement flow.

#### 2. Test Idea Mode

```bash
ralph-starter ideas
```

Choose a discovery method and see AI-generated project ideas.

#### 3. Test with Public URLs

Fetch specs from any public markdown or HTML page:

```bash
# Public GitHub raw file
ralph-starter run --from https://raw.githubusercontent.com/multivmlabs/ralph-starter/main/README.md

# Public gist
ralph-starter run --from https://gist.githubusercontent.com/user/id/raw/spec.md

# Any public webpage
ralph-starter run --from https://example.com/docs/feature-spec
```

#### 4. Test with Local Files

```bash
# Create a simple spec
echo "Build a counter app with React that increments and decrements" > test-spec.md

# Run with local file
ralph-starter run --from ./test-spec.md
```

#### 5. Test with PDF Files

```bash
# If you have a PDF spec
ralph-starter run --from ./requirements.pdf
```

---

### GitHub Integration (No API Key Usually Needed)

GitHub uses the `gh` CLI, which doesn't require a separate API key if you're logged in.

#### Setup

```bash
# Install GitHub CLI (if not installed)
# macOS
brew install gh

# Linux
sudo apt install gh

# Windows
winget install GitHub.cli
```

#### Authenticate

```bash
gh auth login
# Follow prompts to authenticate via browser
```

#### Test Connection

```bash
ralph-starter source test github
```

#### Test Fetching Issues

```bash
# Preview issues from any public repo
ralph-starter source preview github --project multivmlabs/ralph-starter --limit 5

# Run with a public repo
ralph-starter run --from github --project multivmlabs/ralph-starter --label "enhancement"
```

#### Alternative: Personal Access Token

If you prefer not to use `gh`:

1. Go to [GitHub Settings > Developer settings > Personal access tokens](https://github.com/settings/tokens)
2. Click "Generate new token (classic)"
3. Select scopes: `repo` (or just `public_repo` for public repos)
4. Copy the token

```bash
ralph-starter config set github.token ghp_xxxxxxxxxxxx
ralph-starter source test github
```

---

### Linear Integration

#### Get Your API Key

1. Go to [linear.app/settings/api](https://linear.app/settings/api)
2. Click "Create key" under "Personal API keys"
3. Name it "ralph-starter"
4. Copy the key (starts with `lin_api_`)

#### Configure

```bash
ralph-starter config set linear.apiKey lin_api_xxxxxxxxxxxx
```

#### Test Connection

```bash
ralph-starter source test linear
```

#### Test Fetching Issues

```bash
# Preview issues
ralph-starter source preview linear --limit 5

# Filter by label
ralph-starter source preview linear --label "bug" --limit 3

# Filter by project
ralph-starter source preview linear --project "My Project"
```

#### Create a Test Issue

In Linear:
1. Create a new issue with detailed description
2. Add a label like "ralph-test"

```bash
ralph-starter run --from linear --label "ralph-test"
```

---

### Notion Integration

Notion requires a few more steps because you need to create an integration and share pages with it.

#### 1. Create an Integration

1. Go to [notion.so/my-integrations](https://www.notion.so/my-integrations)
2. Click "New integration"
3. Fill in:
   - Name: "ralph-starter"
   - Associated workspace: Select your workspace
   - Capabilities: Read content, Read user information
4. Click "Submit"
5. Copy the "Internal Integration Secret" (starts with `secret_`)

#### 2. Configure ralph-starter

```bash
ralph-starter config set notion.token secret_xxxxxxxxxxxx
```

#### 3. Share Pages with the Integration

**This step is required!** Notion integrations can only access pages explicitly shared with them.

1. Open the Notion page or database you want to use
2. Click the "..." menu in the top right
3. Click "Add connections"
4. Search for "ralph-starter" and select it
5. Click "Confirm"

#### Test Connection

```bash
ralph-starter source test notion
```

#### Test Fetching Pages

```bash
# Preview pages from a database
ralph-starter source preview notion --project "My Database Name" --limit 5
```

#### Create a Test Page

1. Create a new page in a database shared with ralph-starter
2. Add content like:
   ```markdown
   Build a simple blog with Next.js

   Features:
   - List blog posts
   - View single post
   - Markdown support
   ```
3. Fetch it:
   ```bash
   ralph-starter run --from notion --project "Your Database Name" --limit 1
   ```

---

### Verifying Your Setup

#### Check All Sources

```bash
# List available sources
ralph-starter source list

# Test each configured source
ralph-starter source test github
ralph-starter source test linear
ralph-starter source test notion
```

#### View Current Config

```bash
ralph-starter config list
```

#### Check Specific Config

```bash
ralph-starter config get linear
ralph-starter config get notion
ralph-starter config get github
```

---

### Troubleshooting

#### "Source test failed"

1. Verify your API key is correct
2. Check the key hasn't expired
3. Ensure you have the right permissions

```bash
# Re-enter the API key
ralph-starter config set linear.apiKey <new-key>
```

#### "No items found"

1. For Linear: Make sure you have issues matching your filter
2. For Notion: Ensure the page/database is shared with your integration
3. For GitHub: Check the repo exists and you have access

#### "Authentication failed" for Notion

Notion is strict about sharing. Make sure:
1. The integration exists in your workspace
2. You've clicked "Add connections" on the specific page/database
3. You've refreshed the page after adding the connection

#### Config file location

All credentials are stored in:
```
~/.ralph-starter/sources.json
```

You can manually edit this file if needed.

---

### Security Notes

1. **API keys are stored locally** in `~/.ralph-starter/sources.json`
2. **Never commit** this file to version control
3. **Use read-only tokens** when possible
4. **Revoke unused tokens** periodically

#### Removing Credentials

```bash
# Remove a specific key
ralph-starter config delete linear.apiKey

# Remove all config for a source
ralph-starter config delete linear
```

---

### Testing the Full Workflow

Once integrations are set up, test the full workflow:

```bash
# 1. Initialize a new project
mkdir test-project && cd test-project
git init

# 2. Fetch a spec from your favorite source
ralph-starter run --from linear --label "ralph-test" --commit

# 3. Watch the magic happen!
```

Or use the wizard:
```bash
ralph-starter
# Follow prompts...
```


---

## Extending ralph-starter

This guide covers how developers can extend ralph-starter with custom input sources, use the programmatic API, and contribute to the project.

### Architecture Overview

```
ralph-starter/
├── src/
│   ├── cli.ts              # CLI entry point
│   ├── index.ts            # Public API exports
│   ├── commands/           # CLI commands
│   ├── sources/            # Input source system
│   │   ├── types.ts        # Source interface definitions
│   │   ├── base.ts         # Base source class
│   │   ├── builtin/        # Built-in sources (file, url, pdf)
│   │   └── integrations/   # Integration sources (linear, notion, etc.)
│   ├── wizard/             # Interactive wizard
│   ├── loop/               # Autonomous loop engine
│   ├── mcp/                # MCP server
│   └── automation/         # Git automation
```

---

### Creating Custom Input Sources

ralph-starter's source system is designed for extensibility. Here's how to create your own input source.

#### The Source Interface

```typescript
import type { InputSource, SourceResult, SourceOptions } from 'ralph-starter';

interface InputSource {
  // Unique identifier for the source
  name: string;

  // Human-readable description
  description: string;

  // Check if this source is available (e.g., CLI tool installed, API reachable)
  isAvailable(): Promise<boolean>;

  // Whether authentication is required
  requiresAuth(): boolean;

  // Fetch items from the source
  fetch(identifier: string, options?: SourceOptions): Promise<SourceResult>;
}
```

#### Example: Custom Source

Here's an example of creating a custom source that fetches from Trello:

```typescript
// src/sources/integrations/trello.ts
import { BaseSource } from '../base.js';
import type { SourceResult, SourceOptions } from '../types.js';
import { getSourceCredentials } from '../config.js';

export class TrelloSource extends BaseSource {
  name = 'trello';
  description = 'Fetch cards from Trello boards';

  async isAvailable(): Promise<boolean> {
    const creds = getSourceCredentials('trello');
    return !!(creds?.apiKey && creds?.token);
  }

  requiresAuth(): boolean {
    return true;
  }

  async fetch(boardId: string, options?: SourceOptions): Promise<SourceResult> {
    const creds = getSourceCredentials('trello');
    if (!creds?.apiKey || !creds?.token) {
      return {
        success: false,
        error: 'Trello API key and token required',
      };
    }

    try {
      const response = await fetch(
        `https://api.trello.com/1/boards/${boardId}/cards?key=${creds.apiKey}&token=${creds.token}`
      );
      const cards = await response.json();

      // Filter by label if specified
      let filtered = cards;
      if (options?.label) {
        filtered = cards.filter((card: any) =>
          card.labels.some((l: any) => l.name === options.label)
        );
      }

      // Apply limit
      if (options?.limit) {
        filtered = filtered.slice(0, options.limit);
      }

      // Convert to spec format
      const specs = filtered.map((card: any) => ({
        title: card.name,
        content: this.formatSpec(card),
        metadata: {
          source: 'trello',
          cardId: card.id,
          url: card.url,
        },
      }));

      return {
        success: true,
        items: specs,
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to fetch from Trello: ${error}`,
      };
    }
  }

  private formatSpec(card: any): string {
    return `# ${card.name}

Source: Trello Card
Board: ${card.idBoard}
Labels: ${card.labels.map((l: any) => l.name).join(', ')}

## Description

${card.desc || 'No description provided.'}

## Checklist Items

${card.checklists?.map((cl: any) =>
  cl.checkItems.map((item: any) =>
    `- [${item.state === 'complete' ? 'x' : ' '}] ${item.name}`
  ).join('\n')
).join('\n') || 'No checklists.'}
`;
  }
}
```

#### Registering Your Source

Add your source to the registry:

```typescript
// src/sources/index.ts
import { TrelloSource } from './integrations/trello.js';

// Add to the sources array
const sources: InputSource[] = [
  // ... existing sources
  new TrelloSource(),
];
```

#### Adding Environment Variable Support

Update the config to support your source's env vars:

```typescript
// src/sources/config.ts
const ENV_VAR_MAPPINGS: Record<string, Record<string, string>> = {
  // ... existing mappings
  trello: {
    apiKey: 'TRELLO_API_KEY',
    token: 'TRELLO_TOKEN',
  },
};
```

---

### Using ralph-starter Programmatically

ralph-starter exports its core functionality for use in other tools.

#### Installation

```bash
npm install ralph-starter
```

#### Available Exports

```typescript
import {
  // Commands
  initCommand,
  planCommand,
  runCommand,

  // Source system
  getSource,
  getAllSources,
  getSourceCredentials,
  setSourceCredential,

  // Wizard
  runWizard,
  runIdeaMode,

  // Loop
  detectBestAgent,
  runLoop,

  // Types
  type InputSource,
  type SourceResult,
  type SourceOptions,
} from 'ralph-starter';
```

#### Example: Running a Loop Programmatically

```typescript
import { runCommand, detectBestAgent } from 'ralph-starter';

async function buildFeature(spec: string) {
  // Check for available agent
  const agent = await detectBestAgent();
  if (!agent) {
    throw new Error('No coding agent available');
  }

  // Run the loop
  await runCommand(spec, {
    auto: true,
    commit: true,
    validate: true,
    maxIterations: 20,
  });
}

// Usage
await buildFeature('Add dark mode toggle to settings page');
```

#### Example: Fetching from Sources

```typescript
import { getSource } from 'ralph-starter';

async function fetchLinearIssues() {
  const source = getSource('linear');
  if (!source) {
    throw new Error('Linear source not found');
  }

  const result = await source.fetch('team-id', {
    label: 'ready-to-build',
    limit: 5,
  });

  if (!result.success) {
    throw new Error(result.error);
  }

  return result.items;
}
```

#### Example: Using the Wizard Programmatically

```typescript
import { runWizard, runIdeaMode } from 'ralph-starter';

// Run the full wizard
await runWizard();

// Or just idea mode
const selectedIdea = await runIdeaMode();
console.log('User selected:', selectedIdea);
```

---

### Adding New Agents

ralph-starter supports multiple coding agents. Here's how to add support for a new one.

#### Agent Detection

Agents are detected in `src/loop/agents.ts`:

```typescript
interface Agent {
  name: string;
  command: string;
  args: string[];
  isAvailable(): Promise<boolean>;
}

const agents: Agent[] = [
  {
    name: 'claude-code',
    command: 'claude',
    args: ['--dangerously-skip-permissions'],
    async isAvailable() {
      // Check if claude CLI is available
      try {
        await execa('claude', ['--version']);
        return true;
      } catch {
        return false;
      }
    },
  },
  // Add your agent here
  {
    name: 'my-agent',
    command: 'my-agent-cli',
    args: ['--auto'],
    async isAvailable() {
      try {
        await execa('my-agent-cli', ['--version']);
        return true;
      } catch {
        return false;
      }
    },
  },
];
```

#### Agent Priority

Agents are tried in order. Place your agent at the appropriate priority level:

```typescript
// Higher priority agents first
const agentPriority = [
  'claude-code',  // Most capable
  'cursor',
  'codex',
  'my-agent',     // Your custom agent
  'opencode',
];
```

---

### MCP Tools Extension

You can extend ralph-starter's MCP server with custom tools.

#### Adding a New Tool

```typescript
// src/mcp/tools.ts
import { z } from 'zod';

export const tools = [
  // ... existing tools
  {
    name: 'ralph_custom_action',
    description: 'Perform a custom action',
    inputSchema: z.object({
      action: z.string().describe('The action to perform'),
      options: z.record(z.string()).optional(),
    }),
    async handler(input: { action: string; options?: Record<string, string> }) {
      // Implement your tool logic
      return {
        success: true,
        result: `Performed action: ${input.action}`,
      };
    },
  },
];
```

---

### Contributing

#### Development Setup

```bash
# Clone the repo
git clone https://github.com/multivmlabs/ralph-starter.git
cd ralph-starter

# Install dependencies
npm install

# Build
npm run build

# Run locally
npm link
ralph-starter --version
```

#### Project Structure

| Directory | Purpose |
|-----------|---------|
| `src/cli.ts` | CLI entry point and command registration |
| `src/commands/` | Command implementations |
| `src/sources/` | Input source system |
| `src/wizard/` | Interactive wizard |
| `src/loop/` | Autonomous loop engine |
| `src/mcp/` | MCP server implementation |
| `src/automation/` | Git automation |
| `docs/` | Docusaurus documentation |

#### Testing

```bash
# Run tests
npm test

# Type check
npm run typecheck

# Lint
npm run lint
```

#### Pull Request Guidelines

1. **Branch from main** - Create a feature branch from `main`
2. **Keep PRs focused** - One feature or fix per PR
3. **Add tests** - For new functionality
4. **Update docs** - If you add/change features
5. **Follow conventions** - Use conventional commits

#### Conventional Commits

```
feat: add trello source integration
fix: handle empty linear responses
docs: add extension guide
refactor: extract source base class
```

---

### API Reference

#### Source Types

```typescript
interface SourceOptions {
  project?: string;
  label?: string;
  status?: string;
  limit?: number;
}

interface SourceResult {
  success: boolean;
  items?: SourceItem[];
  error?: string;
}

interface SourceItem {
  title: string;
  content: string;
  metadata?: Record<string, unknown>;
}

interface SourceCredentials {
  [key: string]: string;
}
```

#### Command Options

```typescript
interface RunOptions {
  auto?: boolean;
  commit?: boolean;
  push?: boolean;
  pr?: boolean;
  validate?: boolean;
  from?: string;
  project?: string;
  label?: string;
  status?: string;
  limit?: number;
  prd?: string;
  agent?: string;
  maxIterations?: number;
}

interface InitOptions {
  name?: string;
  force?: boolean;
}

interface PlanOptions {
  auto?: boolean;
}
```

---

### Need Help?

- [GitHub Issues](https://github.com/multivmlabs/ralph-starter/issues) - Bug reports and feature requests
- [Documentation](https://rubenmarcus.github.io/ralph-starter/) - Full docs
- [Templates](https://github.com/multivmlabs/ralph-templates) - Project templates


---

## Wizard

## Interactive Wizard

The interactive wizard is the easiest way to use ralph-starter. It guides you through the entire process of creating a project, from idea to running code.

### Launch the Wizard

```bash
ralph-starter
```

Or explicitly:

```bash
ralph-starter wizard
```

### How It Works

#### Step 1: Project Idea

The wizard first asks if you have a project idea:

- **"Yes, I know what I want to build"** - Proceed to describe your idea
- **"No, help me brainstorm ideas"** - Launch [Idea Mode](/docs/wizard/idea-mode)

#### Step 2: Idea Refinement

Once you describe your idea (e.g., "a habit tracker app"), the AI:

1. Suggests a project name
2. Determines the project type (web app, CLI, API, etc.)
3. Recommends a tech stack
4. Identifies core features
5. Suggests additional features
6. Estimates complexity

#### Step 3: Customization

You can then customize:

- **Project Type** - Web, API, CLI, Mobile, Library, Automation
- **Tech Stack** - Frontend, backend, database choices
- **Features** - Select which features to include
- **Complexity** - Prototype, MVP, or Full-featured

#### Step 4: Execution Options

Choose how to proceed:

- **Start building automatically** - Begin the AI coding loop
- **Just create the plan** - Generate files for manual execution later

Optional: Enable auto-commit to save changes as you build.

#### Step 5: Build

The wizard then:

1. Creates the project directory
2. Initializes Ralph Playbook files (AGENTS.md, specs/, etc.)
3. Writes a detailed specification
4. Generates an implementation plan
5. Starts building with AI (if auto-run enabled)

### Example Session

```
$ ralph-starter

  ╭─────────────────────────────────────────────────────────────╮
  │   Welcome to ralph-starter!                                 │
  │   Let's build something awesome together.                   │
  ╰─────────────────────────────────────────────────────────────╯

? Do you have a project idea?
❯ Yes, I know what I want to build
  No, help me brainstorm ideas

? Which idea do you want to build?
  (e.g., "a habit tracker app" or "an API for managing recipes")
> a personal finance tracker

✔ Got it!

  Here's what I understand:
  ────────────────────────────────────────
  Project: personal-finance-tracker
  Type: Web Application

  Tech Stack:
    Frontend: react
    Backend: nodejs
    Database: sqlite

  Key Features:
    • Transaction tracking
    • Budget management
    • Expense categories
    • Monthly reports

  Complexity: Working MVP

? Is this the right specs?
❯ Yes, let's build it!
  I want to change something
  Start over with a different idea
```

### Existing Project Detection

The wizard automatically detects existing projects when you select a working directory.

#### Ralph Playbook Projects

If the directory contains Ralph Playbook files (like AGENTS.md, IMPLEMENTATION_PLAN.md), the wizard recognizes it as an existing Ralph project:

```
  Ralph Playbook detected!
  ────────────────────────────────────────

  Directory: /path/to/my-project

  Found files:
    ✓ AGENTS.md
    ✓ IMPLEMENTATION_PLAN.md
    ✓ PROMPT_build.md
    ✓ PROMPT_plan.md
    ✓ specs/

  ────────────────────────────────────────

? This project is already set up for Ralph. What would you like to do?
❯ Continue working on this project
  Start fresh (will overwrite existing Ralph files)
  Choose a different directory
```

When you choose **"Continue working"**, you can:
- **Run the build loop** - Execute tasks from the implementation plan
- **Regenerate the implementation plan** - Re-analyze specs and update tasks
- **Add a new spec** - Add additional requirements to the project

#### Language Projects

If the directory contains a language project file (package.json, pyproject.toml, Cargo.toml, go.mod) but no Ralph Playbook, the wizard offers:

- **Add features to this existing project** - Set up Ralph in the existing project
- **Create new project in a subfolder** - Keep the existing project separate
- **Choose a different directory** - Pick a different location

### Non-Developer Friendly

The wizard uses plain language instead of technical jargon:

| Technical Term | Wizard Language |
|---------------|-----------------|
| "Configure database" | "How should it store data?" |
| "Select framework" | "What type of app?" |
| "Initialize repository" | "Let me set up the project" |
| "Run build pipeline" | "Start building" |

### Next Steps

- [Idea Mode](/docs/wizard/idea-mode) - For when you don't know what to build
- [Input Sources](/docs/sources/overview) - Fetch specs from external services


---

## Idea Mode

**Idea Mode** is for users who don't know what to build. It's a brainstorming session that helps you discover project ideas based on your preferences.

### Launch Idea Mode

Standalone:

```bash
ralph-starter ideas
```

Or through the wizard (select "No, help me brainstorm ideas").

### Discovery Methods

#### 1. Brainstorm with AI

Open-ended creative suggestions. The AI generates diverse project ideas across different types and complexity levels.

**Best for:** When you want to explore possibilities without constraints.

#### 2. Trending Ideas

Ideas based on 2025-2026 technology trends:

- AI/LLM integrations and tooling
- Local-first and privacy-focused apps
- Developer productivity tools
- Sustainable/green tech applications
- Accessibility and inclusive design

**Best for:** Building something relevant and timely.

#### 3. Based on My Skills

Personalized ideas that:

- Build on your existing skills
- Introduce adjacent technologies
- Could become portfolio pieces

You'll be asked to select technologies you know:
- JavaScript/TypeScript
- React
- Node.js
- Python
- Go, Rust, etc.

**Best for:** Leveraging what you already know.

#### 4. Solve a Problem

Describe a frustration or pain point, and get project ideas that could solve it.

Example problems:
- "I spend too much time organizing my notes"
- "Managing dotfiles is painful"
- "I can't find things in my bookmarks"

**Best for:** Building something personally useful.

### Example Session

```
$ ralph-starter ideas

  ╭─────────────────────────────────────────────────────────────╮
  │   Let's discover what to build!                             │
  │   Don't have a project idea? No problem.                    │
  │   I'll help you brainstorm something awesome.               │
  ╰─────────────────────────────────────────────────────────────╯

? How would you like to discover ideas?
❯ Brainstorm with AI - Get creative suggestions
  See trending ideas - Based on 2025-2026 tech trends
  Based on my skills - Personalized to what I know
  Solve a problem I have - Help me fix something

✔ Got some ideas!

  Here are some ideas for you:
  ────────────────────────────────────────────────────────────

  1. Personal Finance Tracker
     Track expenses, set budgets, and visualize spending patterns
     Type: Web App  |  Difficulty: moderate
     Why: Practical everyday use

  2. Markdown Note Organizer
     CLI tool to organize, search, and link markdown notes
     Type: CLI Tool  |  Difficulty: easy
     Why: Simple to start, can grow in complexity

  3. API Status Dashboard
     Monitor multiple API endpoints and get alerts when they go down
     Type: Web App  |  Difficulty: moderate
     Why: Useful for developers

  4. Git Commit Analyzer
     Analyze git history to show contribution patterns and stats
     Type: CLI Tool  |  Difficulty: easy
     Why: Work with familiar tools

  5. Recipe API
     RESTful API for storing and retrieving recipes
     Type: API  |  Difficulty: easy
     Why: Classic CRUD project

  ────────────────────────────────────────────────────────────

? Which idea interests you?
❯ Personal Finance Tracker - Track expenses, set budgets...
  Markdown Note Organizer - CLI tool to organize, search...
  API Status Dashboard - Monitor multiple API endpoints...
  Git Commit Analyzer - Analyze git history to show...
  Recipe API - RESTful API for storing and retrieving...
  None of these - I'll describe my own idea
  Generate more ideas
```

### Idea Properties

Each generated idea includes:

| Property | Description |
|----------|-------------|
| **Title** | Short, memorable project name |
| **Description** | One sentence about what it does |
| **Project Type** | web, api, cli, mobile, library, automation |
| **Difficulty** | easy, moderate, challenging |
| **Reasons** | Why this is a good project to build |

### Offline Fallback

If no LLM is available (no API key and no coding agent), Idea Mode uses 20 pre-built template ideas across all discovery methods.

### After Selecting an Idea

Once you select an idea:
- The idea is passed to the wizard
- The AI refines it further
- You can customize the tech stack and features
- Building begins

Or select "None of these - I'll describe my own idea" to enter a custom description.


---

## Advanced

## Validation (Backpressure)

The `--validate` flag enables backpressure validation, running tests/lint/build after each iteration to catch issues early.

### How It Works

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  AI codes   │ ──▶ │  Validate   │ ──▶ │   Pass?     │
└─────────────┘     └─────────────┘     └─────────────┘
                                               │
                    ┌──────────────────────────┤
                    │                          │
                    ▼                          ▼
              ┌─────────────┐           ┌─────────────┐
              │ Fix issues  │           │   Commit    │
              └─────────────┘           └─────────────┘
```

1. AI implements a task
2. Validation commands run
3. If failed → AI gets error output and fixes issues
4. If passed → Changes are committed (if `--commit`)
5. Loop continues

### Enable Validation

```bash
ralph-starter run "add feature" --validate
```

### Validation Commands

ralph-starter looks for validation commands in two places:

#### 1. AGENTS.md

```markdown
### Validation Commands
- test: npm test
- lint: npm run lint
- build: npm run build
- typecheck: npm run typecheck
```

#### 2. package.json (Fallback)

```json
{
  "scripts": {
    "test": "jest",
    "lint": "eslint src/",
    "build": "tsc && vite build",
    "typecheck": "tsc --noEmit"
  }
}
```

### Command Detection

ralph-starter automatically detects:

| Command | Detected From |
|---------|---------------|
| `test` | AGENTS.md or package.json `test` script |
| `lint` | AGENTS.md or package.json `lint` script |
| `build` | AGENTS.md or package.json `build` script |
| `typecheck` | AGENTS.md or package.json `typecheck` script |

### Validation Order

Commands run in order:
1. `test` - Run tests
2. `lint` - Check code style
3. `build` - Build project

If any command fails, validation stops and the AI receives the error output.

### Error Feedback

When validation fails, the AI receives:

```markdown
## Validation Failed

### npm run test
```
FAIL src/components/Dashboard.test.tsx
  ● Dashboard › renders habits
    Expected: 3
    Received: 0
```

Please fix the above issues before continuing.
```

The AI then attempts to fix the issues before continuing.

### Examples

#### With Commit

```bash
# Validate and commit if passed
ralph-starter run "add tests" --validate --commit
```

#### Full Automation

```bash
# Auto mode with validation and commit
ralph-starter run --auto --validate --commit
```

#### Maximum Iterations

```bash
# Limit iterations to prevent infinite fix loops
ralph-starter run --validate --max-iterations 20
```

### Custom Validation

#### In AGENTS.md

```markdown
### Validation Commands
- test: npm test -- --coverage --watchAll=false
- lint: npm run lint -- --max-warnings 0
- build: npm run build
- e2e: npm run test:e2e
```

#### Multiple Commands

You can specify multiple validation steps:

```markdown
### Validation Commands
- typecheck: npm run typecheck
- lint: npm run lint
- test: npm test
- build: npm run build
```

### Timeout

Each validation command has a 5-minute timeout. Long-running tests may need adjustment.

### Skipping Validation

For quick iterations without validation:

```bash
ralph-starter run "quick fix" --commit
```

### Tips

1. **Start with validation** - Catches issues early
2. **Fast tests** - Use watch mode disabled for CI-like behavior
3. **Strict lint** - Use `--max-warnings 0` for strict linting
4. **Build always** - Include build to catch TypeScript errors

### See Also

- [Git Automation](/docs/advanced/git-automation)
- [Ralph Playbook](/docs/advanced/ralph-playbook)


---

## Git Automation

ralph-starter can automatically commit changes, push to remote, and create pull requests.

### Flags

| Flag | Description |
|------|-------------|
| `--commit` | Auto-commit after each successful task |
| `--push` | Push commits to remote |
| `--pr` | Create a pull request when done |

### Commit Automation

#### Enable

```bash
ralph-starter run "add feature" --commit
```

#### Behavior

After each successful task (and validation if enabled):

1. Stage all changes
2. Create commit with descriptive message
3. Continue to next task

#### Commit Messages

Commits follow conventional commit format:

```
feat(auth): add login form component

- Created LoginForm component
- Added form validation
- Connected to auth API
```

### Push Automation

#### Enable

```bash
ralph-starter run "add feature" --commit --push
```

#### Behavior

After all tasks complete:

1. Push commits to remote
2. Uses current branch

#### Requirements

- Git remote configured
- Authentication set up (SSH or HTTPS)

### Pull Request Creation

#### Enable

```bash
ralph-starter run "add feature" --commit --push --pr
```

#### Behavior

After pushing:

1. Creates PR using GitHub CLI (`gh`)
2. Auto-generates title and description
3. Opens PR against default branch

#### Requirements

- [GitHub CLI](https://cli.github.com/) installed
- Authenticated (`gh auth login`)

#### PR Format

```markdown
## Summary
- Added user authentication
- Created login and registration forms
- Implemented session management

## Changes
- src/components/LoginForm.tsx
- src/components/RegisterForm.tsx
- src/lib/auth.ts
- src/pages/login.tsx

## Testing
- [x] Tests pass
- [x] Lint passes
- [x] Build succeeds
```

### Workflow Examples

#### Feature Development

```bash
# Create feature branch
git checkout -b feature/user-auth

# Run with full automation
ralph-starter run "add user authentication" --commit --push --pr --validate

# Result:
# - Multiple commits as tasks complete
# - Pushed to feature/user-auth
# - PR created against main
```

#### Bug Fix

```bash
git checkout -b fix/login-bug

ralph-starter run "fix login redirect bug" --commit --push --pr

# Single commit, PR created
```

#### Incremental Work

```bash
# Commit each task but don't push yet
ralph-starter run --commit

# Review changes
git log --oneline

# Push manually when ready
git push
```

### Best Practices

#### Branch Strategy

```bash
# Always work on feature branches
git checkout -b feature/my-feature
ralph-starter run --commit --pr
```

#### Atomic Commits

Each task creates one commit. Keep tasks small for atomic commits:

Good:
```markdown
- [ ] Add LoginForm component
- [ ] Add form validation
- [ ] Connect to API
```

Bad:
```markdown
- [ ] Add complete authentication system
```

#### Review Before Push

```bash
# Commit locally first
ralph-starter run --commit

# Review
git log -p

# Then push
git push
```

### Troubleshooting

#### Push Fails

```
error: failed to push some refs
```

Solution: Pull latest changes first

```bash
git pull --rebase origin main
ralph-starter run --commit --push
```

#### PR Creation Fails

```
gh: command not found
```

Solution: Install GitHub CLI

```bash
# macOS
brew install gh

# Then authenticate
gh auth login
```

#### No Changes to Commit

If validation fails repeatedly, no commits are made. Check validation output.

### See Also

- [Validation](/docs/advanced/validation)
- [Ralph Playbook](/docs/advanced/ralph-playbook)


---

## Circuit Breaker

The circuit breaker monitors agent loop iterations for failure patterns and automatically stops the loop when the agent appears stuck. Without it, an agent that keeps failing on the same error would burn through all its iterations (and your budget) without making progress.

### How It Works

The circuit breaker tracks two failure signals:

1. **Consecutive failures**: How many iterations in a row have failed without a success in between.
2. **Same-error repetition**: How many times the exact same error (after normalization) has occurred across all iterations.

If either signal exceeds its threshold, the circuit "trips" (opens) and the loop stops.

```
Iteration 1: Success     -> consecutiveFailures = 0
Iteration 2: Fail (err A) -> consecutiveFailures = 1, errA count = 1
Iteration 3: Fail (err A) -> consecutiveFailures = 2, errA count = 2
Iteration 4: Fail (err A) -> consecutiveFailures = 3, errA count = 3
                           -> CIRCUIT TRIPS (3 consecutive failures)
```

### Default Thresholds

The default circuit breaker configuration:

| Setting | Default Value | Description |
|---|---|---|
| `maxConsecutiveFailures` | **3** | Trip after N failures in a row |
| `maxSameErrorCount` | **5** | Trip after the same error occurs N times total |
| `cooldownMs` | **30,000** (30 seconds) | How long the circuit stays open before allowing a retry |

With defaults: 3 failures in a row trips the breaker, or seeing the same error 5 times total (even if interspersed with different errors or successes) also trips it.

### CLI Flags

#### `--circuit-breaker-failures`

Set the maximum consecutive failures before tripping:

```bash
# Trip after 5 consecutive failures instead of 3
ralph-starter run "add feature" --circuit-breaker-failures 5
```

#### `--circuit-breaker-errors`

Set the maximum same-error repetitions before tripping:

```bash
# Trip after the same error occurs 3 times instead of 5
ralph-starter run "add feature" --circuit-breaker-errors 3
```

#### Combining Both

```bash
ralph-starter run "add feature" \
  --circuit-breaker-failures 2 \
  --circuit-breaker-errors 3
```

This is a tight configuration: 2 consecutive failures OR 3 same-error occurrences will stop the loop.

### Error Hashing and Deduplication

Errors rarely have identical text across iterations. A stack trace might include different line numbers, timestamps, or memory addresses. The circuit breaker normalizes errors before comparing them:

#### Normalization Steps

1. **Numbers replaced**: All digit sequences become `N` (e.g., `line 42` becomes `line N`).
2. **Hex values replaced**: Patterns like `0x7f3a` become `HEX`.
3. **Stack traces replaced**: Patterns like `at Function (/path:42:10)` become `STACK`.
4. **Lowercased**: The entire string is converted to lowercase.
5. **Trimmed and truncated**: Whitespace is trimmed and the string is capped at 500 characters.

#### Hash Generation

After normalization, the error string is hashed with MD5 and truncated to 8 hex characters. This 8-character hash becomes the error's identity for deduplication.

**Example**:

```
Original:  "TypeError: Cannot read property 'id' of undefined at UserController (/src/controllers/user.ts:42:15)"
Normalized: "typeerror: cannot read property 'id' of undefined STACK"
Hash:       "a3f1b2c4"

Original:  "TypeError: Cannot read property 'id' of undefined at UserController (/src/controllers/user.ts:87:22)"
Normalized: "typeerror: cannot read property 'id' of undefined STACK"
Hash:       "a3f1b2c4"  <- Same hash! Counted as the same error.
```

This means the circuit breaker correctly identifies that both errors are fundamentally the same problem (accessing `id` on `undefined`), even though the stack trace line numbers differ.

### Cooldown Period

When the circuit trips, it enters a cooldown period (default: 30 seconds). During cooldown:

- `isTripped()` returns `true`.
- The loop is halted.

After the cooldown expires:

- `isTripped()` returns `false` (the circuit "half-opens").
- One retry attempt is allowed.
- If the retry succeeds, the circuit stays closed (normal operation resumes).
- If the retry fails, the circuit trips again and the cooldown restarts.

In practice, when used within ralph-starter's loop executor, a tripped circuit breaker typically causes the loop to exit immediately with `exitReason: 'circuit_breaker'` rather than waiting for the cooldown. The cooldown mechanism is more relevant for long-running or restarted loops.

### Success Resets Consecutive Failures

A successful iteration resets the consecutive failure counter to zero but does **not** clear the error history. This means:

- If the agent fails twice, succeeds once, then fails twice more, the consecutive count is 2 (not 4).
- But if those four failures all had the same error hash, the same-error count is 4 -- and one more would trip the breaker at the default threshold of 5.

This design catches both "the agent is completely stuck right now" (consecutive) and "the agent keeps circling back to the same problem" (same-error).

### Preset-Specific Circuit Breaker Configs

Several presets override the default circuit breaker thresholds to match their use case:

| Preset | Consecutive Failures | Same-Error Max | Rationale |
|---|---|---|---|
| `feature` | 3 | 5 | Standard defaults -- balanced tolerance |
| `tdd-red-green` | 5 | 3 | More consecutive tolerance (red-green cycling can look like failures), but less same-error tolerance |
| `refactor` | 2 | 3 | Tight guardrails -- refactoring should not produce repeated failures |
| `incident-response` | 2 | 2 | Very tight -- production fixes need to work fast or escalate |
| `migration-safety` | 1 | 2 | Strictest of all -- a single consecutive failure trips the breaker, because broken migrations risk data loss |

Presets that do not specify a circuit breaker (like `debug`, `review`, `docs`) use whatever default is set in the loop executor, which is the standard 3/5 configuration.

#### Using Preset Configs

When you use a preset, its circuit breaker config is applied automatically:

```bash
# Uses migration-safety's 1/2 circuit breaker
ralph-starter run "add email column" --preset migration-safety

# Override the preset's circuit breaker
ralph-starter run "add email column" --preset migration-safety --circuit-breaker-failures 3
```

CLI flags always take precedence over preset values.

### Trip Reason Reporting

When the circuit trips, ralph-starter reports exactly why:

**Consecutive failures:**
```
Circuit breaker tripped: 3 consecutive failures (threshold: 3)
```

**Same error repeated:**
```
Circuit breaker tripped: Same error repeated 5 times (threshold: 5)
```

The `getTripReason()` method returns a human-readable string, and the loop exits with:

```typescript
{
  success: false,
  exitReason: 'circuit_breaker',
  stats: {
    circuitBreakerStats: {
      consecutiveFailures: 3,
      totalFailures: 5,
      uniqueErrors: 2
    }
  }
}
```

The `uniqueErrors` count tells you how many distinct error patterns were seen, which helps diagnose whether the agent hit one problem repeatedly or multiple different problems.

### Practical Examples

#### Tight Breaker for Critical Code

When working on payment processing or authentication, use aggressive thresholds:

```bash
ralph-starter run "update payment webhook handler" \
  --circuit-breaker-failures 1 \
  --circuit-breaker-errors 2 \
  --validate \
  --commit
```

One failure stops the loop. You review the error manually before restarting.

#### Loose Breaker for Exploratory Work

When the agent is expected to try multiple approaches, loosen the thresholds:

```bash
ralph-starter run "find the best caching strategy" \
  --preset scientific-method \
  --circuit-breaker-failures 8 \
  --circuit-breaker-errors 10
```

The agent has room to experiment and fail without tripping the breaker.

#### Monitoring Circuit Breaker State

The circuit breaker's state is included in the loop result stats:

```typescript
const result = await runLoop(options);

if (result.exitReason === 'circuit_breaker') {
  console.log('Loop stopped by circuit breaker');
  console.log(`Consecutive failures: ${result.stats.circuitBreakerStats.consecutiveFailures}`);
  console.log(`Total failures: ${result.stats.circuitBreakerStats.totalFailures}`);
  console.log(`Unique errors: ${result.stats.circuitBreakerStats.uniqueErrors}`);
}
```

#### Combined with Rate Limiting

Circuit breakers and rate limiters address different failure modes:

| Mechanism | Protects Against |
|---|---|
| Circuit breaker | Agent stuck on the same error, wasting iterations |
| Rate limiter | Agent running too fast, burning through API quotas |

Use both together for comprehensive protection:

```bash
ralph-starter run "implement feature" \
  --rate-limit 50 \
  --circuit-breaker-failures 3 \
  --circuit-breaker-errors 5 \
  --preset feature
```

### Architecture Notes

The `CircuitBreaker` class is stateful and tracks:

- **`consecutiveFailures`**: Counter incremented on failure, reset to 0 on success.
- **`errorHistory`**: A `Map<string, number>` mapping error hashes to occurrence counts. This map is never cleared by a success -- it accumulates across the entire loop lifetime.
- **`isOpen`**: Boolean flag indicating whether the circuit is currently tripped.
- **`lastFailure`**: Timestamp of the most recent failure, used for cooldown calculation.
- **`totalFailures`**: Running total of all failures (never reset by success).

The `reset()` method clears all state, returning the circuit breaker to its initial condition. This is called when restarting a loop from scratch.


---

## Rate Limiting

The rate limiter controls how fast ralph-starter's loop can call AI agents. It prevents you from accidentally burning through API quotas or running up costs by enforcing both per-minute and per-hour call limits using a sliding window algorithm.

### Default Limits

The rate limiter ships with these default thresholds:

| Setting | Default Value | Description |
|---|---|---|
| `maxCallsPerHour` | **100** | Maximum API calls allowed in any rolling 60-minute window |
| `maxCallsPerMinute` | **10** | Maximum API calls allowed in any rolling 60-second window |
| `warningThreshold` | **0.8** (80%) | Percentage of either limit that triggers a warning |

With defaults, the agent can make at most 10 calls in any given minute and 100 calls in any given hour. These limits apply independently -- hitting the minute limit blocks calls even if the hour limit has room, and vice versa.

### CLI Configuration

#### Set a Custom Hourly Limit

Use the `--rate-limit` flag to set the maximum calls per hour:

```bash
# Allow only 30 API calls per hour
ralph-starter run "add feature" --rate-limit 30
```

This overrides the default of 100 calls per hour. The per-minute limit remains at 10 unless changed programmatically.

#### Combine with Other Flags

Rate limiting works alongside all other loop options:

```bash
ralph-starter run "implement auth" \
  --preset feature \
  --rate-limit 50 \
  --max-iterations 30 \
  --validate \
  --commit
```

### Sliding Window Behavior

The rate limiter uses a **sliding window** algorithm rather than fixed time buckets. This means:

- It tracks the exact timestamp of every API call.
- At any moment, it counts how many calls occurred in the last 60 seconds (minute window) and the last 3,600 seconds (hour window).
- Old timestamps outside the 1-hour window are automatically cleaned up.

#### Why Sliding Windows Matter

With fixed buckets (e.g., resetting at the top of each hour), you could make 100 calls at 12:59 and 100 more at 1:01 -- 200 calls in 2 minutes. Sliding windows prevent this by always looking backward from the current moment.

**Example timeline with 10 calls/minute limit:**

```
Time    Calls in last 60s    Allowed?
12:00   0                    Yes (call recorded)
12:05   1                    Yes (call recorded)
12:10   2                    Yes (call recorded)
...
12:50   10                   No (minute limit hit)
12:55   10                   No (still 10 in window)
13:01   9                    Yes (12:00 call expired from window)
```

### Warning vs. Blocking

The rate limiter has two escalation levels:

#### Warning State

When usage reaches 80% (the `warningThreshold`) of either limit, the rate limiter enters a warning state. During the warning state:

- The loop continues to execute.
- A warning message is displayed: `Warning: Approaching rate limit`.
- The current usage percentages are shown.

For example, with default settings:
- **Minute warning**: Triggers at 8 out of 10 calls in the last minute.
- **Hour warning**: Triggers at 80 out of 100 calls in the last hour.

#### Blocked State

When either limit is fully reached, the rate limiter blocks further calls:

- New calls are denied until capacity frees up.
- The display shows: `Blocked - retry in Ns` with a countdown.
- The loop waits automatically using the `waitAndAcquire` method.

The wait time is calculated precisely: it finds the oldest call in the saturated window and computes how long until that call expires from the window (plus a 100ms buffer).

### Automatic Wait and Retry

When the rate limiter blocks a call, the loop does not immediately fail. Instead, it uses `waitAndAcquire` to pause and retry:

1. The loop checks if a call is allowed (`tryAcquire`).
2. If blocked, it calculates the wait time until the next slot opens.
3. It sleeps for that duration (capped at 5-second polling intervals).
4. It retries the acquisition.
5. If still blocked after 5 minutes (default timeout), the acquisition fails and the loop exits with `rate_limit` as the exit reason.

This means the loop gracefully slows down rather than crashing when limits are hit.

### Reading Rate Limiter Stats

During execution, rate limiter statistics are displayed in a compact format:

```
Minute: 7/10 (70%) | Hour: 45/100 (45%)
```

When approaching limits:

```
Minute: 9/10 (90%) | Hour: 82/100 (82%) | Warning: Approaching rate limit
```

When blocked:

```
Minute: 10/10 (100%) | Hour: 85/100 (85%) | Blocked - retry in 12s
```

### Practical Examples

#### Conservative Rate for Expensive Models

When using expensive models like GPT-4 or Claude 3 Opus, limit the rate to control costs:

```bash
# Only 20 calls per hour with an expensive model
ralph-starter run "implement feature" \
  --preset feature \
  --rate-limit 20 \
  --model claude-3-opus
```

At Claude 3 Opus pricing, 20 iterations might cost $1-5 depending on context size. See the [Cost Tracking](/docs/guides/cost-tracking) guide for details.

#### High-Throughput Batch Processing

For batch processing with a cheaper model, you might want a higher limit:

```bash
ralph-starter run "process all pending issues" \
  --rate-limit 200 \
  --model claude-3-haiku
```

#### Combined with Circuit Breaker

Rate limiting and circuit breaking complement each other. Rate limiting controls speed; circuit breaking controls failure tolerance.

```bash
ralph-starter run "add feature" \
  --rate-limit 50 \
  --circuit-breaker-failures 3 \
  --circuit-breaker-errors 5
```

If the agent hits errors, the circuit breaker stops the loop before the rate limiter even becomes relevant. If the agent is succeeding but making many calls, the rate limiter slows it down.

### Loop Exit Behavior

When the rate limiter blocks a call and the wait timeout (5 minutes) expires without a slot opening, the loop exits with:

```typescript
{
  success: false,
  exitReason: 'rate_limit',
  error: 'Rate limit exceeded'
}
```

This is distinct from other exit reasons like `max_iterations`, `circuit_breaker`, or `completed`. You can check the `exitReason` field to determine why the loop stopped.

### Architecture Notes

The `RateLimiter` class maintains an in-memory array of call timestamps. Key implementation details:

- **Cleanup**: Old timestamps (older than 1 hour) are pruned on every operation to prevent memory growth.
- **Thread safety**: The rate limiter is designed for single-threaded Node.js execution. It does not use locks.
- **Reset**: Calling `reset()` clears all timestamps, immediately restoring full capacity.
- **Config updates**: You can update limits mid-run with `updateConfig()`, though this is not exposed via CLI.


---

## Ralph Playbook

ralph-starter follows the [Ralph Playbook](https://claytonfarr.github.io/ralph-playbook/) methodology for structuring AI-assisted development.

### Overview

The Ralph Playbook is a set of conventions for organizing projects so AI coding agents can work effectively. It provides:

1. **Clear instructions** for agents
2. **Structured specifications**
3. **Prioritized task lists**
4. **Validation commands**

### Files

#### AGENTS.md

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

#### PROMPT_plan.md

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

#### PROMPT_build.md

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

#### IMPLEMENTATION_PLAN.md

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

#### specs/

Directory containing feature specifications.

```
specs/
├── user-auth.md
├── dashboard.md
├── settings.md
└── notifications.md
```

### Workflow

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

### Best Practices

#### Writing Good Specs

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

#### AGENTS.md Tips

1. **Be specific about tech stack** - Include versions if important
2. **List all validation commands** - test, lint, build, typecheck
3. **Document file structure** - Help agent navigate codebase
4. **Include coding standards** - ESLint config, naming conventions

#### Task Breakdown

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

### See Also

- [Validation](/docs/advanced/validation)
- [Git Automation](/docs/advanced/git-automation)
- [Ralph Playbook (Original)](https://claytonfarr.github.io/ralph-playbook/)


---

## MCP Server

## MCP Integration

ralph-starter can run as an MCP (Model Context Protocol) server, allowing you to use it from Claude Desktop, Claude Code, or any MCP-compatible client.

### What is MCP?

[Model Context Protocol](https://modelcontextprotocol.io/) is a standard for connecting AI assistants to external tools and data sources. When ralph-starter runs as an MCP server, Claude can directly call ralph-starter tools.

### Start the MCP Server

```bash
ralph-starter mcp
```

This starts ralph-starter as a JSON-RPC 2.0 server over stdio.

### Available Tools

| Tool | Description |
|------|-------------|
| `ralph_init` | Initialize Ralph Playbook in a project |
| `ralph_plan` | Create implementation plan from specs |
| `ralph_run` | Execute autonomous coding loop |
| `ralph_status` | Check playbook status and progress |
| `ralph_validate` | Run tests/lint/build validation |

#### ralph_init

Initialize Ralph Playbook files in a project.

**Parameters:**
- `path` (required): Project path to initialize
- `name` (optional): Project name

**Example:**
```json
{
  "tool": "ralph_init",
  "arguments": {
    "path": "/path/to/project",
    "name": "my-app"
  }
}
```

#### ralph_plan

Create an implementation plan from specs.

**Parameters:**
- `path` (required): Project path
- `auto` (optional): Run in automated mode

#### ralph_run

Execute the autonomous coding loop.

**Parameters:**
- `path` (required): Project path
- `task` (optional): Specific task to execute
- `auto` (optional): Run in automated mode
- `commit` (optional): Auto-commit changes
- `validate` (optional): Run validation after changes
- `from` (optional): Source to fetch spec from
- `project` (optional): Project filter for source
- `label` (optional): Label filter for source

#### ralph_status

Check the current status of Ralph Playbook in a project.

**Parameters:**
- `path` (required): Project path

**Returns:**
- Files present (AGENTS.md, specs/, etc.)
- Implementation progress
- Available specs

#### ralph_validate

Run validation commands (tests, lint, build).

**Parameters:**
- `path` (required): Project path

### Available Resources

| Resource URI | Description |
|--------------|-------------|
| `ralph://project/implementation_plan` | IMPLEMENTATION_PLAN.md content |
| `ralph://project/agents` | AGENTS.md content |
| `ralph://project/prompt_build` | PROMPT_build.md content |
| `ralph://project/prompt_plan` | PROMPT_plan.md content |
| `ralph://project/specs/{name}` | Individual spec files |

### Available Prompts

| Prompt | Description |
|--------|-------------|
| `scaffold_project` | Initialize and build a new project |
| `continue_building` | Continue from implementation plan |
| `check_progress` | Check project status |
| `fetch_and_build` | Fetch spec from source and build |

### Next Steps

- [Claude Desktop Setup](/docs/mcp/claude-desktop) - Configure Claude Desktop to use ralph-starter


---

## Claude Desktop Setup

Configure Claude Desktop to use ralph-starter as an MCP server.

### Prerequisites

1. [Claude Desktop](https://claude.ai/download) installed
2. ralph-starter installed globally: `npm install -g ralph-starter`

### Configuration

#### 1. Find Config Location

The Claude Desktop config file is located at:

- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

#### 2. Add ralph-starter

Edit the config file and add ralph-starter to `mcpServers`:

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

If you have other MCP servers, add ralph-starter alongside them:

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@anthropic-ai/mcp-filesystem"]
    },
    "ralph-starter": {
      "command": "ralph-starter",
      "args": ["mcp"]
    }
  }
}
```

#### 3. Restart Claude Desktop

Close and reopen Claude Desktop for the changes to take effect.

### Verify Installation

In Claude Desktop, you should see ralph-starter tools available. Try:

> "Use ralph-starter to check the status of the current directory"

Claude should call `ralph_status` and show the Ralph Playbook status.

### Usage Examples

#### Scaffold a New Project

> "Use ralph-starter to scaffold a React todo app in ~/projects/my-todo"

Claude will:
1. Call `ralph_init` to initialize
2. Create a spec file
3. Call `ralph_plan` to create implementation plan
4. Call `ralph_run` to start building

#### Continue Building

> "Use ralph-starter to continue building the project in the current directory"

Claude will:
1. Call `ralph_status` to check progress
2. Call `ralph_run` to continue

#### Fetch and Build

> "Use ralph-starter to fetch specs from GitHub issues labeled 'ready' in my-org/my-repo and start building"

Claude will:
1. Call `ralph_run` with `from: "github"` and appropriate filters

### Prompts

Use the built-in prompts for common workflows:

#### scaffold_project

> "Use the scaffold_project prompt to build a habit tracker app"

#### continue_building

> "Use the continue_building prompt"

#### check_progress

> "Use the check_progress prompt to see what's left"

#### fetch_and_build

> "Use fetch_and_build with GitHub as the source"

### Resources

Access Ralph Playbook files as MCP resources:

> "Read the implementation plan resource from ralph-starter"

This reads `ralph://project/implementation_plan`.

### Troubleshooting

#### ralph-starter not found

Ensure it's installed globally and in your PATH:

```bash
which ralph-starter  # Should show path
ralph-starter --version  # Should show version
```

#### Tools not appearing

1. Check the config file syntax (must be valid JSON)
2. Restart Claude Desktop completely
3. Check Claude Desktop logs for errors

#### Permission errors

If ralph-starter needs to access certain directories, ensure Claude Desktop has the necessary permissions.

### Tips

1. **Use auto mode** - When asking Claude to build, mention "in auto mode" for fewer permission prompts
2. **Specify paths** - Be explicit about project paths to avoid confusion
3. **Check status first** - Ask Claude to check status before running commands
4. **Combine with filesystem MCP** - Use alongside filesystem MCP for full file access


---

## Community

## Contributing

Thank you for your interest in contributing to ralph-starter! This guide will help you get started.

### Ways to Contribute

#### Report Bugs

Found a bug? Please report it on [GitHub Issues](https://github.com/multivmlabs/ralph-starter/issues).

When reporting bugs, please include:
- ralph-starter version (`ralph-starter --version`)
- Node.js version (`node --version`)
- Operating system
- Steps to reproduce
- Expected vs actual behavior
- Error messages or logs

#### Submit Ideas

Have a feature idea? Submit it to [ralph-ideas](https://github.com/multivmlabs/ralph-ideas/issues).

Good idea submissions include:
- Clear description of the feature
- Use case / problem it solves
- Suggested implementation (optional)
- Examples from other tools (optional)

#### Contribute Code

1. **Fork the repository**
   ```bash
   gh repo fork multivmlabs/ralph-starter
   ```

2. **Clone your fork**
   ```bash
   git clone https://github.com/YOUR_USERNAME/ralph-starter
   cd ralph-starter
   ```

3. **Install dependencies**
   ```bash
   pnpm install
   ```

4. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

5. **Make your changes**
   - Follow the existing code style
   - Add tests for new functionality
   - Update documentation if needed

6. **Run tests**
   ```bash
   pnpm test
   ```

7. **Commit your changes**
   ```bash
   git commit -m "feat: add your feature description"
   ```

8. **Push and create a PR**
   ```bash
   git push origin feature/your-feature-name
   gh pr create
   ```

### Development Setup

#### Prerequisites

- Node.js 18+
- pnpm
- Git

#### Project Structure

```
ralph-starter/
├── src/              # Source code
│   ├── cli/          # CLI commands
│   ├── sources/      # Input source integrations
│   ├── core/         # Core functionality
│   └── utils/        # Utility functions
├── docs/             # Documentation (Docusaurus)
├── tests/            # Test files
└── package.json
```

#### Running Locally

```bash
# Build the project
pnpm build

# Run in development
pnpm dev

# Run tests
pnpm test

# Run linting
pnpm lint
```

### Code Style

- Use TypeScript
- Follow existing patterns in the codebase
- Use meaningful variable and function names
- Add JSDoc comments for public APIs
- Keep functions small and focused

### Commit Messages

We follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `chore:` Maintenance tasks
- `refactor:` Code refactoring
- `test:` Adding or updating tests

Examples:
```
feat: add Jira integration
fix: resolve GitHub auth token refresh issue
docs: update installation guide
```

### Pull Request Guidelines

- Keep PRs focused on a single change
- Include tests for new functionality
- Update documentation if needed
- Link to related issues
- Respond to review feedback promptly

### Questions?

- [Browse Templates](https://github.com/multivmlabs/ralph-templates)
- [Open an Issue](https://github.com/multivmlabs/ralph-starter/issues)

---

Thank you for contributing to ralph-starter!


---

## Changelog

All notable changes to ralph-starter are documented here. This project follows [Semantic Versioning](https://semver.org/).

---

### [0.1.1-beta.16] - 2026-02-07

#### Added
- SEO category for template filters
- Enforce pnpm, vitest v4, esbuild v0.27
- Security scanning and code quality tools

#### Fixed
- CodeQL action SHA and hardened workflow patterns
- Release workflow for pnpm compatibility
- Changelog script renamed to `.cjs` for ESM compatibility
- GitHub Actions pinned to SHA hashes

#### Security
- Added LICENSE file
- Pinned all GitHub Actions to commit SHAs

---

### [0.1.1-beta.15] - 2026-02-06

#### Added
- **Auto mode improvements**: semantic PR titles, AUTO label, PR body formatter with issue linking
- **Figma content extraction mode**: pull design content directly from Figma files

#### Fixed
- Auto mode cascading branches and PRs

#### Changed
- Landing page improvements and new standalone pages (Use Cases, Integrations, Templates)
- README structure improvements

---

### [0.1.1-beta.14] - 2026-02-05

#### Changed
- Updated and cleaned up root markdown files

---

### [0.1.1-beta.13] - 2026-02-05

#### Changed
- Updated README with Figma integration, expanded agent list, and LLM provider docs

---

### [0.1.1-beta.12] - 2026-02-05

#### Added
- **Figma integration** for design-to-code workflows — fetch designs, tokens, components, and assets

---

### [0.1.1-beta.11] - 2026-02-03

#### Changed
- Replaced Discussions links with [Templates](https://github.com/multivmlabs/ralph-templates)

---

### [0.1.1-beta.10] - 2026-02-03

#### Added
- [ralph-ideas](https://github.com/multivmlabs/ralph-ideas) and [ralph-templates](https://github.com/multivmlabs/ralph-templates) repository references

#### Security
- Prevent path traversal attacks in file operations
- Secure credential storage with proper file permissions

---

### [0.1.1-beta.9] - 2026-02-03

#### Fixed
- Removed broken docs and coverage badges

---

### [0.1.1-beta.8] - 2026-02-03

#### Added
- **`--prd` flag** for working through PRD task lists with checkbox tracking
- GitHub Sponsors funding configuration

---

### [0.1.1-beta.7] - 2026-02-03

#### Changed
- Dependency updates: commander, eslint, @types/node

#### Fixed
- Full pagination support for Notion integration

---

### [0.1.1-beta.6] - 2026-01-30

#### Fixed
- Task progression and iteration-specific instructions

---

### [0.1.1-beta.5] - 2026-01-30

#### Fixed
- Extract tasks from spec to enable dynamic loop headers
- CI: added missing permissions to release workflow

---

### [0.1.1-beta.4] - 2026-01-30

#### Fixed
- Always use smart iteration calculation instead of hardcoded default
- CI: create release PR after source PR is merged
- CI: trigger auto-label on PR open/sync events

#### Changed
- Removed unused ASCII art and functions

---

### [0.1.1-beta.3] - 2026-01-30

#### Changed
- Dependency updates: ora, lint-staged, eslint, react-dom

---

### [0.1.1-beta.2] - 2026-01-29

#### Added
- Dependabot configuration for automated dependency updates

---

### [0.1.1-beta.1] - 2026-01-28

#### Added
- Full Ralph ASCII art in CLI output
- Commitizen for conventional commits

---

### [0.1.1-beta.0] - 2026-01-28

#### Fixed
- Rate limit feedback improvements for users

#### Changed
- Migrated from ESLint/Prettier to Biome
- Added commitlint and npm release workflow

---

### [0.1.0] - Initial Release

#### Added
- Core CLI with `run`, `init`, `plan`, `config`, `source`, and `auto` commands
- **Input sources**: GitHub Issues & PRs, Linear tickets, Notion pages, Figma designs, URLs, PDFs, local files
- **AI agent support**: Claude Code, Cursor, OpenCode, Codex, Copilot, Gemini CLI, Amp, Openclaw
- **Autonomous coding loops** with configurable iterations, validation, and circuit breaker
- **19 workflow presets** across 5 categories (development, debugging, review, documentation, specialized)
- **Agent skills system** with global and per-project skill detection
- **Interactive wizard** with idea mode for brainstorming
- **MCP server** integration for Claude Desktop
- **Git automation**: auto-commit, push, and PR creation
- **Cost tracking** with token estimation per model
- **Rate limiting** with sliding window algorithm
- **Ralph Playbook** support for custom configurations
- **[Template marketplace](https://github.com/multivmlabs/ralph-templates)** with community templates

---

### Links

- [GitHub Releases](https://github.com/multivmlabs/ralph-starter/releases)
- [npm Package History](https://www.npmjs.com/package/ralph-starter?activeTab=versions)

### Upgrade

```bash
npm install -g ralph-starter@latest
ralph-starter --version
```


---

## Ideas & Roadmap

Browse and contribute to the future of ralph-starter. All ideas and feature requests are tracked in the [ralph-ideas](https://github.com/multivmlabs/ralph-ideas) repository.

### Quick Links

- [View All Ideas](https://github.com/multivmlabs/ralph-ideas/issues)
- [Submit New Idea](https://github.com/multivmlabs/ralph-ideas/issues/new)
- [Browse Templates](https://github.com/multivmlabs/ralph-templates) - Ready-to-use project templates
- [P1 - Critical Priority](https://github.com/multivmlabs/ralph-ideas/labels/P1)
- [P2 - High Priority](https://github.com/multivmlabs/ralph-ideas/labels/P2)
- [P3 - Medium Priority](https://github.com/multivmlabs/ralph-ideas/labels/P3)

### Categories

#### Templates

Browse available templates at [ralph-templates](https://github.com/multivmlabs/ralph-templates) or request new ones below:

| Template Request | Priority | Status |
|------------------|----------|--------|
| [Next.js SaaS Starter](https://github.com/multivmlabs/ralph-ideas/issues?q=label%3Atemplates+saas) | P1 | Planned |
| [Marketing Landing Page](https://github.com/multivmlabs/ralph-ideas/issues?q=label%3Atemplates+landing) | P1 | Planned |
| [GitHub Actions CI/CD](https://github.com/multivmlabs/ralph-ideas/issues?q=label%3Adevops+actions) | P1 | Planned |
| [Express.js REST API](https://github.com/multivmlabs/ralph-ideas/issues?q=label%3Atemplates+express) | P2 | Planned |
| [Chrome Extension](https://github.com/multivmlabs/ralph-ideas/issues?q=label%3Atemplates+extension) | P2 | Planned |
| [CLI Tool](https://github.com/multivmlabs/ralph-ideas/issues?q=label%3Atemplates+cli) | P2 | Planned |

[Request new template →](https://github.com/multivmlabs/ralph-ideas/issues/new?labels=templates)

#### Automation

Tools to streamline development workflows:

| Feature | Priority | Status |
|---------|----------|--------|
| [Auto PR Review Bot](https://github.com/multivmlabs/ralph-ideas/issues?q=label%3Aautomation+PR+review) | P1 | Planned |
| [Auto Release Notes](https://github.com/multivmlabs/ralph-ideas/issues?q=label%3Aautomation+release) | P1 | Planned |
| [Auto Issue Triage](https://github.com/multivmlabs/ralph-ideas/issues?q=label%3Aautomation+triage) | P2 | Planned |
| [Auto Dependency Updates](https://github.com/multivmlabs/ralph-ideas/issues?q=label%3Aautomation+dependency) | P2 | Planned |
| [Auto Documentation](https://github.com/multivmlabs/ralph-ideas/issues?q=label%3Aautomation+docs) | P2 | Planned |
| [Auto Test Generator](https://github.com/multivmlabs/ralph-ideas/issues?q=label%3Aautomation+test) | P2 | Planned |

[View all automation ideas →](https://github.com/multivmlabs/ralph-ideas/labels/automation)

#### Blockchain & Web3

Blockchain and decentralized application templates:

| Template | Priority | Status |
|----------|----------|--------|
| [Web3 dApp Frontend](https://github.com/multivmlabs/ralph-ideas/issues?q=label%3Ablockchain+dapp) | P2 | Planned |
| [ERC-20 Token](https://github.com/multivmlabs/ralph-ideas/issues?q=label%3Ablockchain+erc20) | P3 | Backlog |
| [NFT Collection](https://github.com/multivmlabs/ralph-ideas/issues?q=label%3Ablockchain+nft) | P3 | Backlog |
| [DeFi Staking Contract](https://github.com/multivmlabs/ralph-ideas/issues?q=label%3Ablockchain+defi) | P3 | Backlog |

[View all blockchain ideas →](https://github.com/multivmlabs/ralph-ideas/labels/blockchain)

#### DevOps & Infrastructure

CI/CD and infrastructure templates:

| Template | Priority | Status |
|----------|----------|--------|
| [Docker Compose Dev Environment](https://github.com/multivmlabs/ralph-ideas/issues?q=label%3Adevops+docker) | P2 | Planned |
| [Kubernetes + Helm Charts](https://github.com/multivmlabs/ralph-ideas/issues?q=label%3Adevops+kubernetes) | P3 | Backlog |
| [Terraform Infrastructure](https://github.com/multivmlabs/ralph-ideas/issues?q=label%3Adevops+terraform) | P3 | Backlog |
| [Monitoring Stack](https://github.com/multivmlabs/ralph-ideas/issues?q=label%3Adevops+monitoring) | P3 | Backlog |

[View all DevOps ideas →](https://github.com/multivmlabs/ralph-ideas/labels/devops)

#### Scripts & Utilities

Helpful scripts and developer tools:

| Utility | Priority | Status |
|---------|----------|--------|
| [Git Hooks Setup](https://github.com/multivmlabs/ralph-ideas/issues?q=label%3Ascripts+hooks) | P2 | Planned |
| [Database Seeder](https://github.com/multivmlabs/ralph-ideas/issues?q=label%3Ascripts+seeder) | P2 | Planned |
| [OpenAPI Client Generator](https://github.com/multivmlabs/ralph-ideas/issues?q=label%3Ascripts+openapi) | P3 | Backlog |
| [Environment Validator](https://github.com/multivmlabs/ralph-ideas/issues?q=label%3Ascripts+env) | P3 | Backlog |
| [Project Health Check](https://github.com/multivmlabs/ralph-ideas/issues?q=label%3Ascripts+health) | P3 | Backlog |

[View all scripts & utilities →](https://github.com/multivmlabs/ralph-ideas/labels/scripts)

### Integrations

Feature requests for ralph-starter core:

| Feature | Priority | Status |
|---------|----------|--------|
| [Slack Integration](https://github.com/multivmlabs/ralph-ideas/issues?q=slack) | Enhancement | Planned |
| [Figma Integration](https://github.com/multivmlabs/ralph-ideas/issues?q=figma) | Enhancement | Planned |
| [Debug/Interactive Mode](https://github.com/multivmlabs/ralph-ideas/issues?q=debug+mode) | Enhancement | Planned |
| [Swarm Mode](https://github.com/multivmlabs/ralph-ideas/issues?q=swarm) | Enhancement | Planned |
| [GitHub Action](https://github.com/multivmlabs/ralph-ideas/issues?q=github+action) | Enhancement | Planned |
| [Ollama Support](https://github.com/multivmlabs/ralph-ideas/issues?q=ollama) | Enhancement | Planned |
| [Google Gemini Provider](https://github.com/multivmlabs/ralph-ideas/issues?q=gemini) | Enhancement | Planned |

### Contributing Ideas

Have a feature request or idea? We'd love to hear it!

1. **Check existing issues** - Search [ralph-ideas](https://github.com/multivmlabs/ralph-ideas/issues) to avoid duplicates
2. **Create a new issue** - Use a clear, descriptive title
3. **Add labels** - Use appropriate priority (P1/P2/P3) and category labels
4. **Describe the use case** - Explain why this feature would be useful

#### Priority Guidelines

- **P1 (Critical)**: Core features that many users need
- **P2 (High)**: Important features that enhance the experience
- **P3 (Medium)**: Nice-to-have features for specific use cases


---

## FAQ

## Frequently Asked Questions

### General

#### What is ralph-starter?

ralph-starter is a CLI tool that runs autonomous AI coding loops. Give it a task or specification, and it will build production-ready code automatically using Claude Code or other AI coding agents.

#### What is Ralph Wiggum?

Ralph Wiggum is a technique for running AI coding agents in autonomous loops until tasks are completed. Instead of prompting back and forth with an AI, you give it a task and let it iterate until done. ralph-starter makes this technique accessible to everyone.

#### Do I need to be a developer to use ralph-starter?

No. ralph-starter includes an interactive wizard that guides anyone through creating projects. Just run `ralph-starter` with no arguments and follow the prompts.

#### Is ralph-starter free?

ralph-starter is open source and free to use. However, it uses AI APIs (like Anthropic's Claude) which may have associated costs depending on your usage.

---

### Installation

#### How do I install ralph-starter?

```bash
npm install -g ralph-starter
```

Or use without installing:

```bash
npx ralph-starter
```

#### What are the system requirements?

- Node.js 18 or higher
- npm or yarn
- Git (optional, for version control features)
- Claude Code CLI (for AI coding features)

#### How do I update ralph-starter?

```bash
npm update -g ralph-starter
```

---

### Usage

#### How do I start a new project?

Run the interactive wizard:

```bash
ralph-starter
```

Or specify a task directly:

```bash
ralph-starter run "build a todo app with React"
```

#### What is Idea Mode?

Idea Mode helps you brainstorm project ideas when you don't know what to build:

```bash
ralph-starter ideas
```

It uses AI to generate project suggestions based on your interests, skills, or trending technologies.

#### Can I fetch specifications from external tools?

Yes. ralph-starter supports fetching specs from:

- **GitHub Issues**: `ralph-starter run --from github --project owner/repo`
- **Linear**: `ralph-starter run --from linear --label "ready"`
- **Notion**: `ralph-starter run --from notion --project "Specs Database"`
- **URLs**: `ralph-starter run --from https://example.com/spec.md`
- **Local files**: `ralph-starter run --from ./requirements.pdf`

#### How do I configure API keys?

Use the config command:

```bash
ralph-starter config set linear.apiKey lin_api_xxxx
ralph-starter config set notion.token secret_xxxx
ralph-starter config set github.token ghp_xxxx
```

---

### Integrations

#### How do I connect GitHub?

GitHub integration uses the `gh` CLI. If you're logged into `gh`, no additional setup is needed:

```bash
gh auth login
ralph-starter source test github
```

#### How do I connect Linear?

1. Get your API key from [linear.app/settings/api](https://linear.app/settings/api)
2. Configure ralph-starter:

```bash
ralph-starter config set linear.apiKey lin_api_xxxx
ralph-starter source test linear
```

#### How do I connect Notion?

1. Create an integration at [notion.so/my-integrations](https://www.notion.so/my-integrations)
2. Share your pages/databases with the integration
3. Configure ralph-starter:

```bash
ralph-starter config set notion.token secret_xxxx
ralph-starter source test notion
```

#### Can I use public Notion pages without authentication?

Yes. For public Notion pages, use the URL source:

```bash
ralph-starter run --from https://notion.so/Your-Public-Page-abc123
```

Note: Content extraction is limited for public pages since Notion renders client-side.

---

### MCP Server

#### What is the MCP server?

ralph-starter can run as an MCP (Model Context Protocol) server, allowing AI assistants like Claude Desktop to use its capabilities directly.

#### How do I use ralph-starter with Claude Desktop?

Add this to your Claude Desktop config (`~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "ralph-starter": {
      "command": "npx",
      "args": ["ralph-starter", "mcp"]
    }
  }
}
```

---

### Troubleshooting

#### "Command not found: ralph-starter"

Ensure npm global binaries are in your PATH:

```bash
export PATH="$PATH:$(npm config get prefix)/bin"
```

Or use npx instead:

```bash
npx ralph-starter
```

#### "Source test failed"

1. Verify your API key is correct
2. Check the key hasn't expired
3. Ensure you have the required permissions

```bash
ralph-starter config set linear.apiKey <new-key>
ralph-starter source test linear
```

#### "No items found" when fetching from a source

- **Linear**: Make sure you have issues matching your filter
- **Notion**: Ensure the page/database is shared with your integration
- **GitHub**: Check the repo exists and you have access

#### Where are credentials stored?

Credentials are stored in `~/.ralph-starter/sources.json`. This file has user-only permissions (600). Never commit this file to version control.

---

### Workflow Presets

#### What are workflow presets?

Presets are pre-configured sets of loop options for common workflows. Instead of remembering flags like `--max-iterations 30 --validate --commit --circuit-breaker-failures 3`, you can just use `--preset feature`:

```bash
ralph-starter run "add auth" --preset feature
```

ralph-starter ships with 19 built-in presets across 5 categories: development, debugging, review, documentation, and specialized.

#### How do I see all available presets?

```bash
ralph-starter presets
```

#### Can I create custom presets?

Not yet — presets are currently built-in. Custom user presets are on the roadmap.

---

### Skills

#### What are agent skills?

Skills are markdown files that provide domain-specific knowledge to AI agents. For example, a "react-best-practices" skill teaches the agent React patterns. Skills are auto-matched to your project's tech stack.

#### How do I install skills?

```bash
ralph-starter skill add vercel-labs/agent-skills
```

Skills are installed to `~/.claude/skills/` (global) or `.claude/skills/` (per-project).

#### Where can I find community skills?

```bash
ralph-starter skill browse
```

---

### Cost & Rate Limiting

#### How much does ralph-starter cost to run?

ralph-starter itself is free. Costs depend on the AI agent you use and how many iterations your task requires. A typical feature implementation (5-15 iterations with Claude Sonnet) costs approximately $0.10-$1.00 (as of Feb 2026). See the [Cost Tracking](/docs/guides/cost-tracking) guide.

#### How do I limit API costs?

Use rate limiting and iteration caps:

```bash
ralph-starter run "add feature" --rate-limit 30 --max-iterations 10
```

#### What is the circuit breaker?

The circuit breaker automatically stops the loop when the agent is stuck on the same error. By default it trips after 3 consecutive failures or 5 occurrences of the same error. See [Circuit Breaker](/docs/advanced/circuit-breaker).

---

### Contributing

#### How can I contribute to ralph-starter?

1. Fork the repository on GitHub
2. Create a feature branch
3. Make your changes
4. Submit a pull request

See the [contributing guide](https://github.com/multivmlabs/ralph-starter/blob/main/CONTRIBUTING.md) for details.

#### How do I report bugs?

Open an issue on GitHub: [github.com/multivmlabs/ralph-starter/issues](https://github.com/multivmlabs/ralph-starter/issues)

---

### More Questions?

- Check the [full documentation](/docs/intro)
- Browse [Templates](https://github.com/multivmlabs/ralph-templates)
- Open an [issue](https://github.com/multivmlabs/ralph-starter/issues)


---
