---
sidebar_position: 2
title: Claude Desktop
description: Configure Claude Desktop to use ralph-starter
keywords: [claude desktop, mcp, configuration]
---

# Claude Desktop Setup

Configure Claude Desktop to use ralph-starter as an MCP server.

## Prerequisites

1. [Claude Desktop](https://claude.ai/download) installed
2. ralph-starter installed globally: `npm install -g ralph-starter`

## Configuration

### 1. Find Config Location

The Claude Desktop config file is located at:

- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

### 2. Add ralph-starter

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

### 3. Restart Claude Desktop

Close and reopen Claude Desktop for the changes to take effect.

## Verify Installation

In Claude Desktop, you should see ralph-starter tools available. Try:

> "Use ralph-starter to check the status of the current directory"

Claude should call `ralph_status` and show the Ralph Playbook status.

## Usage Examples

### Scaffold a New Project

> "Use ralph-starter to scaffold a React todo app in ~/projects/my-todo"

Claude will:
1. Call `ralph_init` to initialize
2. Create a spec file
3. Call `ralph_plan` to create implementation plan
4. Call `ralph_run` to start building

### Continue Building

> "Use ralph-starter to continue building the project in the current directory"

Claude will:
1. Call `ralph_status` to check progress
2. Call `ralph_run` to continue

### Fetch and Build

> "Use ralph-starter to fetch specs from GitHub issues labeled 'ready' in my-org/my-repo and start building"

Claude will:
1. Call `ralph_run` with `from: "github"` and appropriate filters

## Prompts

Use the built-in prompts for common workflows:

### scaffold_project

> "Use the scaffold_project prompt to build a habit tracker app"

### continue_building

> "Use the continue_building prompt"

### check_progress

> "Use the check_progress prompt to see what's left"

### fetch_and_build

> "Use fetch_and_build with GitHub as the source"

## Resources

Access Ralph Playbook files as MCP resources:

> "Read the implementation plan resource from ralph-starter"

This reads `ralph://project/implementation_plan`.

## Troubleshooting

### ralph-starter not found

Ensure it's installed globally and in your PATH:

```bash
which ralph-starter  # Should show path
ralph-starter --version  # Should show version
```

### Tools not appearing

1. Check the config file syntax (must be valid JSON)
2. Restart Claude Desktop completely
3. Check Claude Desktop logs for errors

### Permission errors

If ralph-starter needs to access certain directories, ensure Claude Desktop has the necessary permissions.

## Tips

1. **Use auto mode** - When asking Claude to build, mention "in auto mode" for fewer permission prompts
2. **Specify paths** - Be explicit about project paths to avoid confusion
3. **Check status first** - Ask Claude to check status before running commands
4. **Combine with filesystem MCP** - Use alongside filesystem MCP for full file access
