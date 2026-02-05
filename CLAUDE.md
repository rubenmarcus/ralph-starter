# CLAUDE.md

Context for Claude Code when working on ralph-starter.

## What is ralph-starter?

A CLI tool that runs autonomous AI coding loops. It fetches specs from GitHub, Linear, Notion, Figma, then orchestrates coding agents (like you!) to build software automatically.

## Quick Commands

```bash
pnpm build      # Build TypeScript
pnpm lint       # Lint code
pnpm test       # Run tests
pnpm dev        # Development mode
```

## Repository Structure

- `src/` - TypeScript source code
- `docs/` - Docusaurus documentation site
- `dist/` - Compiled output
- `projects/` - Example/test projects

## Key Concepts

**Integrations** - Fetch specs from external sources:
- GitHub: Issues, PRs, files
- Linear: Tickets by team/project
- Notion: Pages and databases
- Figma: Design specs and tokens

**Agents** - AI coding assistants ralph-starter orchestrates:
- Claude Code, Cursor, OpenCode, Codex, Copilot, Gemini CLI, Amp, Openclaw

**Loop Executor** - Runs agents in autonomous loops until task completion

**LLM Providers** - For internal features (Anthropic, OpenAI, OpenRouter)

## Important Files

| File | Purpose |
|------|---------|
| `src/loop/executor.ts` | Main loop logic (900+ lines) |
| `src/loop/agents.ts` | Agent detection and invocation |
| `src/commands/run.ts` | Run command implementation |
| `src/integrations/base.ts` | Integration interface |
| `src/llm/providers.ts` | LLM provider definitions |
| `src/cli.ts` | CLI entry point |

## When Making Changes

1. Run `pnpm build` after changes
2. Update README.md for user-facing features
3. Follow existing code patterns
4. Use ESM imports with `.js` extensions

## Current Priorities

- Multi-agent support expansion
- Auto mode (batch issue processing)
- OpenRouter integration
- Figma integration improvements

## Links

- Docs: https://ralphstarter.ai
- Ideas: https://github.com/rubenmarcus/ralph-ideas
- Templates: https://github.com/rubenmarcus/ralph-templates
