# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Single issue fetching with `--issue <n>` flag for GitHub source
- `--output-dir <path>` flag to specify task directory
- Project location prompt when fetching from integration sources
- Support for GitHub issue URLs as project identifiers

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
