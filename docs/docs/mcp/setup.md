---
sidebar_position: 1
title: MCP Setup
description: Use ralph-starter as an MCP server
keywords: [mcp, model context protocol, claude desktop, ai tools]
---

# MCP Integration

ralph-starter can run as an MCP (Model Context Protocol) server, allowing you to use it from Claude Desktop, Claude Code, or any MCP-compatible client.

## What is MCP?

[Model Context Protocol](https://modelcontextprotocol.io/) is a standard for connecting AI assistants to external tools and data sources. When ralph-starter runs as an MCP server, Claude can directly call ralph-starter tools.

## Start the MCP Server

```bash
ralph-starter mcp
```

This starts ralph-starter as a JSON-RPC 2.0 server over stdio.

## Available Tools

| Tool | Description |
|------|-------------|
| `ralph_init` | Initialize Ralph Playbook in a project |
| `ralph_plan` | Create implementation plan from specs |
| `ralph_run` | Execute autonomous coding loop |
| `ralph_status` | Check playbook status and progress |
| `ralph_validate` | Run tests/lint/build validation |

### ralph_init

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

### ralph_plan

Create an implementation plan from specs.

**Parameters:**
- `path` (required): Project path
- `auto` (optional): Run in automated mode

### ralph_run

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

### ralph_status

Check the current status of Ralph Playbook in a project.

**Parameters:**
- `path` (required): Project path

**Returns:**
- Files present (AGENTS.md, specs/, etc.)
- Implementation progress
- Available specs

### ralph_validate

Run validation commands (tests, lint, build).

**Parameters:**
- `path` (required): Project path

## Available Resources

| Resource URI | Description |
|--------------|-------------|
| `ralph://project/implementation_plan` | IMPLEMENTATION_PLAN.md content |
| `ralph://project/agents` | AGENTS.md content |
| `ralph://project/prompt_build` | PROMPT_build.md content |
| `ralph://project/prompt_plan` | PROMPT_plan.md content |
| `ralph://project/specs/{name}` | Individual spec files |

## Available Prompts

| Prompt | Description |
|--------|-------------|
| `scaffold_project` | Initialize and build a new project |
| `continue_building` | Continue from implementation plan |
| `check_progress` | Check project status |
| `fetch_and_build` | Fetch spec from source and build |

## Next Steps

- [Claude Desktop Setup](/mcp/claude-desktop) - Configure Claude Desktop to use ralph-starter
