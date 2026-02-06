# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.1-beta.15] - 2026-02-06

### Added
- Auto mode improvements with semantic PR titles and AUTO label
- PR body formatter with issue linking
- Figma content extraction mode

### Fixed
- Auto mode cascading branches and PRs issue

### Changed
- Landing page improvements and new standalone documentation pages
- README structure improvements

## [0.1.1-beta.14] - 2026-02-05

### Changed
- Updated and cleaned up root markdown files

## [0.1.1-beta.13] - 2026-02-05

### Changed
- Updated README with Figma integration, more agents, and LLM providers documentation

## [0.1.1-beta.12] - 2026-02-05

### Added
- Figma integration for design-to-code workflows

## [0.1.1-beta.11] - 2026-02-03

### Changed
- Replaced Discussions links with Templates

## [0.1.1-beta.10] - 2026-02-03

### Added
- ralph-ideas and ralph-templates repository references

### Fixed
- Security: prevent path traversal and secure credential storage

## [0.1.1-beta.9] - 2026-02-03

### Fixed
- Removed broken docs and coverage badges

## [0.1.1-beta.8] - 2026-02-03

### Added
- `--prd` flag to work through PRD task lists
- GitHub Sponsors funding configuration

## [0.1.1-beta.7] - 2026-02-03

### Changed
- Dependency updates (commander, eslint, @types/node)

## [0.1.1-beta.6] - 2026-01-30

### Fixed
- Task progression and iteration-specific instructions

## [0.1.1-beta.5] - 2026-01-30

### Fixed
- Extract tasks from spec to enable dynamic loop headers
- CI: added missing permissions to release workflow

## [0.1.1-beta.4] - 2026-01-30

### Fixed
- Always use smart iteration calculation instead of hardcoded default
- CI: create release PR after source PR is merged
- CI: trigger auto-label on PR open/sync events

### Changed
- Removed unused ASCII art and functions

## [0.1.1-beta.3] - 2026-01-30

### Added
- ralph-ideas integration and configurable default issues repo
- Automated release workflow with candidate-release labels
- OSS best practices and community health files
- Answer Engine Optimization (AEO) features for docs

### Fixed
- GitHub source improvements
- Docs meta tags and removed Todoist integration

### Changed
- Dynamic CLI version display
- Dependency updates (zod, pdf-parse, actions/checkout, etc.)

## [0.1.1-beta.2] - 2026-01-30

### Changed
- Dynamic CLI version bump

## [0.1.1-beta.1] - 2026-01-30

### Added
- Initial beta release with automated release workflow

## [0.1.0-beta.1] - 2025-01-27

### Added
- Interactive wizard for project generation (`ralph-starter`)
- Idea brainstorming mode with curated project ideas (`ralph-starter ideas`)
- Multi-provider LLM support (Anthropic, OpenAI, OpenRouter)
- Claude Code CLI integration for zero-config AI execution
- Setup wizard for first-time configuration (`ralph-starter setup`)
- Task progress tracking with time and cost estimates
- Validation loop with auto-retry on failures
- "Improve existing project" wizard option for Ralph projects
- Conventional commits enforcement with commitlint
- Release scripts for npm publishing

### Fixed
- Task name markdown stripping in progress display
- Footer link reliability rules in generated projects
- Time estimate accuracy (reduced from conservative estimates)
- Loop/task number display consistency

### Changed
- Removed ASCII art from completion screen
- Unified task/loop numbering in executor output
- Simplified progress display with real-time step detection
