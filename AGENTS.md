# AGENTS.md

Configuration for AI coding agents working on ralph-starter.

## Project Overview

ralph-starter is a CLI tool for running autonomous AI coding loops. It connects to external sources (GitHub, Linear, Notion, Figma) and orchestrates AI coding agents to build software autonomously.

**Tech Stack:** TypeScript, Node.js 20+, pnpm

## Validation Commands

Run after each change:

```bash
pnpm build        # TypeScript compilation
pnpm lint         # ESLint checks
pnpm test         # Run tests
pnpm typecheck    # Type checking only
```

## Project Structure

```
src/
├── cli.ts              # CLI entry point
├── commands/           # Command implementations
│   ├── run.ts          # Main run command
│   ├── init.ts         # Project initialization
│   ├── plan.ts         # Implementation planning
│   └── ...
├── integrations/       # Source integrations
│   ├── base.ts         # Base integration interface
│   ├── github/         # GitHub issues, PRs
│   ├── linear/         # Linear tickets
│   ├── notion/         # Notion pages
│   └── figma/          # Figma designs
├── loop/               # Core loop execution
│   ├── executor.ts     # Main loop runner (900+ lines)
│   ├── agents.ts       # Agent detection/invocation
│   ├── validation.ts   # Backpressure validation
│   ├── circuit-breaker.ts
│   ├── cost-tracker.ts
│   └── ...
├── llm/                # LLM provider abstraction
│   ├── providers.ts    # Anthropic, OpenAI, OpenRouter
│   └── api.ts          # Unified LLM API
├── automation/         # Git operations
│   └── git.ts          # Branch, commit, PR
├── config/             # Configuration
│   └── manager.ts      # Config file handling
└── mcp/                # MCP server
```

## Supported Agents

ralph-starter works with these coding agents:
- Claude Code (recommended)
- Cursor
- OpenCode
- OpenAI Codex
- GitHub Copilot
- Gemini CLI
- Amp
- Openclaw

## Supported Integrations

- GitHub (gh CLI or API token)
- Linear (API key)
- Notion (API token)
- Figma (API token)
- URLs (public)
- Local files

## LLM Providers

For internal features (task analysis, completion detection):
- Anthropic (ANTHROPIC_API_KEY)
- OpenAI (OPENAI_API_KEY)
- OpenRouter (OPENROUTER_API_KEY)

## Code Conventions

- ESM imports with `.js` extensions
- Use `chalk` for colored output
- Use `ora` for spinners
- Use `inquirer` for interactive prompts
- Use `commander` for CLI parsing
- Prefer async/await over callbacks

## Adding Features

1. Add types/interfaces first
2. Implement in appropriate module
3. Wire to CLI in `src/cli.ts`
4. Update README.md if user-facing
5. Add tests if applicable

## Task Completion Criteria

A task is complete when:
1. `pnpm build` passes
2. `pnpm lint` passes (or only pre-existing errors)
3. Code follows existing patterns
4. README.md updated (if user-facing)
5. No unresolved TODOs

## Key Files

- `src/loop/executor.ts` - Main loop logic
- `src/loop/agents.ts` - Agent detection and invocation
- `src/commands/run.ts` - Run command
- `src/integrations/base.ts` - Integration interface
- `src/llm/providers.ts` - LLM provider definitions

## Documentation

- Website: https://ralphstarter.ai
- Docs source: `docs/` (Docusaurus)
- Build docs: `cd docs && pnpm build`
