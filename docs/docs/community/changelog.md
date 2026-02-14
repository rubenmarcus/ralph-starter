---
sidebar_position: 2
title: Changelog
description: Release notes and version history for ralph-starter
keywords: [changelog, releases, version history, updates]
---

# Changelog

All notable changes to ralph-starter are documented here. This project follows [Semantic Versioning](https://semver.org/).

---

## [0.1.1-beta.17] - 2026-02-14

### Added
- **`fix --design` mode**: Structured 5-phase visual fix workflow with screenshot verification, CSS cascade conflict detection, and `DESIGN_VERIFIED` completion token
- **Smart UI defaults**: Web projects now default to Tailwind CSS + shadcn/ui + motion-primitives when no styling is specified (framework-aware: shadcn-vue for Vue, shadcn-svelte for Svelte)
- **`uiLibrary` field** in TechStack for explicit UI component library selection
- **Rich spec generation**: Specs and AGENTS.md now include Tailwind v4 setup notes, CSS cascade layer warnings, and shadcn component setup instructions

### Fixed
- Design loop premature exit — `fix --design` now requires explicit `DESIGN_VERIFIED` token after visual confirmation (prevents 1-iteration false completions)
- Design loop stall detection — screenshot/viewport analysis no longer falsely triggers idle detection
- Default design iterations increased from 5 to 7 for more thorough visual fixes

### Changed
- Completion instruction in agent preamble is now conditional — design mode uses task-specific completion flow instead of generic "All tasks completed"

---

## [0.1.1-beta.16] - 2026-02-07

### Added
- SEO category for template filters
- Enforce pnpm, vitest v4, esbuild v0.27
- Security scanning and code quality tools

### Fixed
- CodeQL action SHA and hardened workflow patterns
- Release workflow for pnpm compatibility
- Changelog script renamed to `.cjs` for ESM compatibility
- GitHub Actions pinned to SHA hashes

### Security
- Added LICENSE file
- Pinned all GitHub Actions to commit SHAs

---

## [0.1.1-beta.15] - 2026-02-06

### Added
- **Auto mode improvements**: semantic PR titles, AUTO label, PR body formatter with issue linking
- **Figma content extraction mode**: pull design content directly from Figma files

### Fixed
- Auto mode cascading branches and PRs

### Changed
- Landing page improvements and new standalone pages (Use Cases, Integrations, Templates)
- README structure improvements

---

## [0.1.1-beta.14] - 2026-02-05

### Changed
- Updated and cleaned up root markdown files

---

## [0.1.1-beta.13] - 2026-02-05

### Changed
- Updated README with Figma integration, expanded agent list, and LLM provider docs

---

## [0.1.1-beta.12] - 2026-02-05

### Added
- **Figma integration** for design-to-code workflows — fetch designs, tokens, components, and assets

---

## [0.1.1-beta.11] - 2026-02-03

### Changed
- Replaced Discussions links with [Templates](https://github.com/multivmlabs/ralph-templates)

---

## [0.1.1-beta.10] - 2026-02-03

### Added
- [ralph-ideas](https://github.com/multivmlabs/ralph-ideas) and [ralph-templates](https://github.com/multivmlabs/ralph-templates) repository references

### Security
- Prevent path traversal attacks in file operations
- Secure credential storage with proper file permissions

---

## [0.1.1-beta.9] - 2026-02-03

### Fixed
- Removed broken docs and coverage badges

---

## [0.1.1-beta.8] - 2026-02-03

### Added
- **`--prd` flag** for working through PRD task lists with checkbox tracking
- GitHub Sponsors funding configuration

---

## [0.1.1-beta.7] - 2026-02-03

### Changed
- Dependency updates: commander, eslint, @types/node

### Fixed
- Full pagination support for Notion integration

---

## [0.1.1-beta.6] - 2026-01-30

### Fixed
- Task progression and iteration-specific instructions

---

## [0.1.1-beta.5] - 2026-01-30

### Fixed
- Extract tasks from spec to enable dynamic loop headers
- CI: added missing permissions to release workflow

---

## [0.1.1-beta.4] - 2026-01-30

### Fixed
- Always use smart iteration calculation instead of hardcoded default
- CI: create release PR after source PR is merged
- CI: trigger auto-label on PR open/sync events

### Changed
- Removed unused ASCII art and functions

---

## [0.1.1-beta.3] - 2026-01-30

### Changed
- Dependency updates: ora, lint-staged, eslint, react-dom

---

## [0.1.1-beta.2] - 2026-01-29

### Added
- Dependabot configuration for automated dependency updates

---

## [0.1.1-beta.1] - 2026-01-28

### Added
- Full Ralph ASCII art in CLI output
- Commitizen for conventional commits

---

## [0.1.1-beta.0] - 2026-01-28

### Fixed
- Rate limit feedback improvements for users

### Changed
- Migrated from ESLint/Prettier to Biome
- Added commitlint and npm release workflow

---

## [0.1.0] - Initial Release

### Added
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

## Links

- [GitHub Releases](https://github.com/multivmlabs/ralph-starter/releases)
- [npm Package History](https://www.npmjs.com/package/ralph-starter?activeTab=versions)

## Upgrade

```bash
npm install -g ralph-starter@latest
ralph-starter --version
```
