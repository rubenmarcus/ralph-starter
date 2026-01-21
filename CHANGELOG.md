# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-01-21

### Added

#### Interactive Wizard
- Launch with `ralph-starter` (no args) for a guided experience
- AI-powered idea refinement using hybrid approach (API → Agent → Template fallback)
- Tech stack selection with recommendations
- Feature customization
- Auto-runs init → plan → build

#### Idea Mode
- New `ralph-starter ideas` command for brainstorming
- Four discovery methods:
  - Brainstorm with AI - Open-ended creative suggestions
  - Trending ideas - Based on 2025-2026 tech trends
  - Based on my skills - Personalized to user's technologies
  - Solve a problem - Solutions for specific pain points
- 20 pre-built template ideas for offline fallback
- Integrated into wizard flow ("Do you have a project idea?")

#### Extensible Input Sources
- Fetch specs from anywhere with `--from` flag
- Built-in sources:
  - `file` - Local files and directories
  - `url` - Remote URLs (markdown, HTML)
  - `pdf` - PDF documents
- Integration sources:
  - `github` - GitHub Issues via gh CLI or API
  - `todoist` - Todoist tasks via REST API
  - `linear` - Linear issues via GraphQL API
  - `notion` - Notion pages via API
- Source management commands:
  - `ralph-starter source list` - List available sources
  - `ralph-starter source help <name>` - Get help for a source
  - `ralph-starter source test <name>` - Test connectivity
  - `ralph-starter source preview <name>` - Preview items

#### Configuration Management
- Centralized credential storage at `~/.ralph-starter/sources.json`
- Config commands:
  - `ralph-starter config list` - View all config
  - `ralph-starter config get <key>` - Get specific value
  - `ralph-starter config set <key> <value>` - Set value
  - `ralph-starter config delete <key>` - Remove value

#### MCP Server
- New `ralph-starter mcp` command to start as MCP server
- JSON-RPC 2.0 over stdio transport
- MCP Tools:
  - `ralph_init` - Initialize Ralph Playbook
  - `ralph_plan` - Create implementation plan
  - `ralph_run` - Execute coding loop
  - `ralph_status` - Check playbook status
  - `ralph_validate` - Run tests/lint/build
- MCP Resources:
  - `ralph://project/implementation_plan` - IMPLEMENTATION_PLAN.md
  - `ralph://project/agents` - AGENTS.md
  - `ralph://project/prompt_build` - PROMPT_build.md
  - `ralph://project/prompt_plan` - PROMPT_plan.md
  - `ralph://project/specs/{name}` - Spec files
- MCP Prompts:
  - `scaffold_project` - Initialize and build a new project
  - `continue_building` - Continue from implementation plan
  - `check_progress` - Check project status
  - `fetch_and_build` - Fetch spec from source and build

#### Core Functions
- Extracted core logic for MCP and programmatic use:
  - `initCore()` - Initialize Ralph Playbook
  - `planCore()` - Create implementation plan
  - `runCore()` - Execute coding loop

### Changed
- Default action (no args) now launches interactive wizard instead of showing help

### Dependencies
- Added `@modelcontextprotocol/sdk` for MCP server
- Added `zod` for schema validation
- Added `pdf-parse` for PDF source

## [0.0.3] - 2026-01-15

### Added
- Loop orchestration with multi-agent support
- Ralph Playbook alignment (AGENTS.md, specs/, IMPLEMENTATION_PLAN.md)
- Git automation (`--commit`, `--push`, `--pr` flags)
- Backpressure validation (`--validate` flag)
- Plan/Build modes with `ralph-starter plan` command
- Agent detection for Claude Code, Cursor, Codex, OpenCode
- Skills integration with `ralph-starter skill` command

### Changed
- Improved loop executor with iteration limits
- Better error handling and feedback

## [0.0.2] - 2026-01-10

### Added
- Basic CLI structure with Commander.js
- `ralph-starter run` command
- `ralph-starter init` command
- Agent detection and selection
- Basic loop execution

## [0.0.1] - 2026-01-05

### Added
- Initial project setup
- Package structure
- Basic documentation
