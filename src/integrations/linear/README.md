# Linear Integration

Fetch issues from Linear workspaces.

## Authentication

### Option 1: Linear CLI (Recommended)

The easiest way to authenticate.

```bash
# Install Linear CLI
npm install -g @linear/cli

# Login
linear auth login
```

### Option 2: API Key

Create an API key and configure ralph-starter.

```bash
# 1. Get API key from https://linear.app/settings/api
# 2. Configure
ralph-starter config set linear.apiKey lin_api_xxxxx
```

## Usage

```bash
# Fetch issues from a project
ralph-starter run --from linear --project "My Project"

# Fetch issues from a team by key
ralph-starter run --from linear --project ENG

# Filter by label
ralph-starter run --from linear --project ENG --label bug

# Filter by status
ralph-starter run --from linear --project all --status "In Progress"

# Limit results
ralph-starter run --from linear --project all --limit 10
```

## Options

| Option | Description | Default |
|--------|-------------|---------|
| `--project` | Project name, team name, or team key | Required |
| `--label` | Filter by label name | None |
| `--status` | Filter by status (In Progress, Todo, etc.) | Non-completed |
| `--limit` | Max issues to fetch | 50 |

## Special Values

- `all` - Fetch from all projects/teams

## Examples

```bash
# All high-priority issues
ralph-starter run --from linear --project all --label "high priority"

# Issues in progress for mobile team
ralph-starter run --from linear --project "Mobile App" --status "In Progress"

# Bugs from engineering team
ralph-starter run --from linear --project ENG --label bug
```

## Data Fetched

- Issue identifier and title
- Description
- Priority (grouped by Urgent/High/Medium/Low)
- Status
- Labels
- Team and project names

## Output Format

Issues are grouped by priority level for easy scanning:

```markdown
# My Project Issues

## 🔴 Urgent
### ENG-123: Fix critical bug
*Status: In Progress | Team: Engineering | Labels: bug*
...

## 🟠 High
### ENG-124: Implement feature
...
```
