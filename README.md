# ralph-starter

<p align="center">
  <img src="ralph.png" alt="Ralph Wiggum" width="400" />
</p>

> **Ralph Wiggum made easy.** One command to run autonomous AI coding loops.

## Summary

**ralph-starter** is a production-ready CLI tool for running autonomous AI coding loops using the [Ralph Wiggum technique](https://ghuntley.com/ralph/). It makes autonomous coding accessible to both developers and non-developers.

### Key Features

| Feature | Description |
|---------|-------------|
| 🧙 **Interactive Wizard** | Guided project creation with AI-refined specifications |
| 🔄 **Multi-Agent Support** | Works with Claude Code, Cursor, Codex, OpenCode |
| 📥 **Input Sources** | Fetch specs from URLs, files, GitHub, Todoist, Linear, Notion |
| 🎯 **16+ Workflow Presets** | Pre-configured modes: feature, tdd, debug, review, and more |
| 🔌 **Circuit Breaker** | Auto-stops stuck loops after repeated failures |
| 📊 **Progress Tracking** | Logs iterations to `activity.md` |
| ⏱️ **Rate Limiting** | Control API costs with `--rate-limit` |
| 🎯 **Smart Exit Detection** | Semantic analysis + completion promises + file signals |
| 🔧 **Git Automation** | Auto-commit, push, and PR creation |
| ✅ **Backpressure Validation** | Run tests/lint/build after each iteration |
| 🖥️ **MCP Server** | Use from Claude Desktop or any MCP client |

### Quick Example

```bash
# Simple task
ralph-starter run "build a todo app" --commit --validate

# With preset
ralph-starter run --preset tdd-red-green "add user authentication"

# With safety controls
ralph-starter run --rate-limit 50 --circuit-breaker-failures 3 "build X"

# Interactive wizard
ralph-starter
```

---

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

### Working with Existing Projects

ralph-starter automatically detects existing projects when you run the wizard:

**Ralph Playbook Project** (has AGENTS.md, IMPLEMENTATION_PLAN.md, etc.):
```bash
cd my-ralph-project
ralph-starter
```
The wizard will detect the Ralph Playbook files and let you:
- Continue working (run the build loop)
- Regenerate the implementation plan
- Add new specs

**Language Project** (has package.json, pyproject.toml, Cargo.toml, go.mod):
```bash
cd my-existing-app
ralph-starter
```
The wizard will detect the project type and let you:
- Add features to the existing project
- Create a new project in a subfolder

This makes ralph-starter compatible with other Ralph Wiggum tools like [ralph-cli](https://github.com/yemyat/ralph-cli), [ralph-tui](https://github.com/subsy/ralph-tui), [oh-my-claudecode](https://github.com/Yeachan-Heo/oh-my-claudecode), and more.

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
Fetch specs from anywhere - URLs, files, or your favorite project management tools:

```bash
# URLs (public markdown, HTML)
ralph-starter run --from https://example.com/spec.md
ralph-starter run --from https://gist.githubusercontent.com/user/id/raw/spec.md

# Local files (markdown, PDF)
ralph-starter run --from ./requirements.pdf
ralph-starter run --from ./specs/feature.md

# GitHub Issues (uses gh CLI - no API key needed if logged in)
ralph-starter run --from github --project owner/repo --label "sprint-1"

# Todoist tasks
ralph-starter run --from todoist --project "My App"

# Linear issues
ralph-starter run --from linear --label "in-progress"

# Notion pages
ralph-starter run --from notion --project "Product Specs"
```

#### Setting Up Integrations

**GitHub** - Uses the `gh` CLI tool (no API key required):
```bash
# Install and authenticate gh CLI
gh auth login
# Test it works
ralph-starter source test github
```

**Todoist** - Get your API key from [todoist.com/app/settings/integrations/developer](https://todoist.com/app/settings/integrations/developer):
```bash
ralph-starter config set todoist.apiKey your_api_key_here
ralph-starter source test todoist
```

**Linear** - Get your API key from [linear.app/settings/api](https://linear.app/settings/api):
```bash
ralph-starter config set linear.apiKey lin_api_xxxxx
ralph-starter source test linear
```

**Notion** - Create an integration at [notion.so/my-integrations](https://www.notion.so/my-integrations):
1. Create a new integration and copy the secret
2. Share your database/page with the integration
3. Configure ralph-starter:
```bash
ralph-starter config set notion.apiKey secret_xxxxx
ralph-starter source test notion
```

#### Testing Integrations

```bash
# List all available sources
ralph-starter source list

# Test connectivity for a source
ralph-starter source test todoist

# Preview items without running
ralph-starter source preview github --project owner/repo --limit 5
ralph-starter source preview todoist --project "My App"
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

### Workflow Presets

Pre-configured settings for common development scenarios:

```bash
# List all 16+ presets
ralph-starter presets

# Use a preset
ralph-starter run --preset feature "build login"
ralph-starter run --preset tdd-red-green "add tests"
ralph-starter run --preset debug "fix the bug"
ralph-starter run --preset refactor "clean up auth module"
ralph-starter run --preset pr-review "review changes"
```

**Available Presets:**
| Category | Presets |
|----------|---------|
| Development | `feature`, `feature-minimal`, `tdd-red-green`, `spec-driven`, `refactor` |
| Debugging | `debug`, `incident-response`, `code-archaeology` |
| Review | `review`, `pr-review`, `adversarial-review` |
| Documentation | `docs`, `documentation-first` |
| Specialized | `api-design`, `migration-safety`, `performance-optimization`, `scientific-method`, `research`, `gap-analysis` |

### Circuit Breaker

Automatically stops loops that are stuck:

```bash
# Stop after 3 consecutive failures (default)
ralph-starter run "build X" --validate

# Custom thresholds
ralph-starter run "build X" --circuit-breaker-failures 2 --circuit-breaker-errors 3
```

The circuit breaker monitors:
- **Consecutive failures**: Stops after N validation failures in a row
- **Same error count**: Stops if the same error repeats N times

### Progress Tracking

Writes iteration logs to `activity.md`:

```bash
# Enabled by default
ralph-starter run "build X"

# Disable if not needed
ralph-starter run "build X" --no-track-progress
```

Each iteration records:
- Timestamp and duration
- Status (completed, failed, blocked)
- Validation results
- Commit info

### File-Based Completion

The loop automatically checks for completion signals:
- `RALPH_COMPLETE` file in project root
- `.ralph-done` marker file
- All tasks marked `[x]` in `IMPLEMENTATION_PLAN.md`

### Rate Limiting

Control API call frequency to manage costs:

```bash
# Limit to 50 calls per hour
ralph-starter run --rate-limit 50 "build X"
```

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
| `ralph-starter presets` | List available workflow presets |
| `ralph-starter mcp` | Start as MCP server |
| `ralph-starter config <action>` | Manage source credentials |
| `ralph-starter source <action>` | Manage input sources |
| `ralph-starter skill add <repo>` | Install agent skills |

## Options for `run`

### Core Options

| Flag | Description |
|------|-------------|
| `--auto` | Skip permission prompts |
| `--commit` | Auto-commit after tasks |
| `--push` | Push commits to remote |
| `--pr` | Create pull request |
| `--validate` | Run tests/lint/build (backpressure) |
| `--agent <name>` | Specify agent to use |
| `--max-iterations <n>` | Max loop iterations (default: 50) |

### Workflow Presets

| Flag | Description |
|------|-------------|
| `--preset <name>` | Use a workflow preset (feature, tdd-red-green, debug, etc.) |

```bash
# List all available presets
ralph-starter presets

# Use a preset
ralph-starter run --preset feature "build login page"
ralph-starter run --preset tdd-red-green "add user validation"
ralph-starter run --preset debug "fix the auth bug"
```

### Exit Detection

| Flag | Description |
|------|-------------|
| `--completion-promise <string>` | Custom string to detect task completion |
| `--require-exit-signal` | Require explicit `EXIT_SIGNAL: true` for completion |

```bash
# Stop when agent outputs "FEATURE_DONE"
ralph-starter run --completion-promise "FEATURE_DONE" "build X"

# Require explicit exit signal
ralph-starter run --require-exit-signal "build Y"
```

### Safety Controls

| Flag | Description |
|------|-------------|
| `--rate-limit <n>` | Max API calls per hour (default: unlimited) |
| `--circuit-breaker-failures <n>` | Max consecutive failures before stopping (default: 3) |
| `--circuit-breaker-errors <n>` | Max same error occurrences before stopping (default: 5) |
| `--track-progress` | Write progress to activity.md (default: true) |
| `--no-track-progress` | Disable progress tracking |

```bash
# Limit to 50 API calls per hour
ralph-starter run --rate-limit 50 "build X"

# Stop after 2 consecutive failures
ralph-starter run --circuit-breaker-failures 2 "build Y"
```

### Source Options

| Flag | Description |
|------|-------------|
| `--from <source>` | Fetch spec from source |
| `--project <name>` | Project filter for sources |
| `--label <name>` | Label filter for sources |
| `--status <status>` | Status filter for sources |
| `--limit <n>` | Max items from source |
| `--prd <file>` | Read tasks from markdown |

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

## Testing ralph-starter

### Quick Test (No API Keys)

You can test ralph-starter with public URLs - no API keys required:

```bash
# Test with a public GitHub gist or raw markdown
ralph-starter run --from https://raw.githubusercontent.com/rubenmarcus/ralph-starter/main/README.md

# Test with GitHub issues (requires gh CLI login)
gh auth login
ralph-starter run --from github --project rubenmarcus/ralph-starter --label "enhancement"
```

### Testing the Wizard

```bash
# Launch the interactive wizard
ralph-starter

# Or test idea mode
ralph-starter ideas
```

### Testing with Your Own Specs

```bash
# Create a simple spec file
echo "Build a simple counter app with React" > my-spec.md

# Run with local file
ralph-starter run --from ./my-spec.md
```

### Verifying Source Connectivity

Before using an integration, verify it's working:

```bash
# Check what sources are available
ralph-starter source list

# Test each source
ralph-starter source test github
ralph-starter source test todoist
ralph-starter source test linear
ralph-starter source test notion

# Preview items (dry run)
ralph-starter source preview todoist --project "My App" --limit 3
```

## API Key Configuration

### Option 1: Environment Variables (Recommended for Developers)

Set environment variables in your shell profile or `.env` file:

```bash
# Add to ~/.bashrc, ~/.zshrc, or .env file
export TODOIST_API_KEY=your_api_key
export LINEAR_API_KEY=lin_api_xxxxx
export NOTION_API_KEY=secret_xxxxx
export GITHUB_TOKEN=ghp_xxxxx
```

Environment variables take precedence over the config file.

### Option 2: Config Command

Use the CLI to store credentials:

```bash
ralph-starter config set todoist.apiKey your_api_key
ralph-starter config set linear.apiKey lin_api_xxxxx
ralph-starter config set notion.apiKey secret_xxxxx
ralph-starter config set github.token ghp_xxxxx
```

Credentials are stored in `~/.ralph-starter/sources.json`.

### Environment Variable Reference

| Source | Environment Variable | Config Key |
|--------|---------------------|------------|
| Todoist | `TODOIST_API_KEY` | `todoist.apiKey` |
| Linear | `LINEAR_API_KEY` | `linear.apiKey` |
| Notion | `NOTION_API_KEY` | `notion.apiKey` |
| GitHub | `GITHUB_TOKEN` | `github.token` |

### Managing Config

```bash
ralph-starter config list           # View all config
ralph-starter config get todoist    # View specific source
ralph-starter config delete todoist.apiKey  # Remove a key
```

## Requirements

- Node.js 18+
- At least one coding agent installed (Claude Code, Cursor, etc.)
- Git (for automation features)
- GitHub CLI `gh` (for PR creation and GitHub source)

## Documentation

Full documentation available at: https://rubenmarcus.github.io/ralph-starter/

## Contributing

Contributions welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

For creating custom sources, agents, or using the programmatic API, see the [Developer Extension Guide](https://rubenmarcus.github.io/ralph-starter/docs/guides/extending-ralph-starter).

## License

MIT
