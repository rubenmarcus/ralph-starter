---
sidebar_position: 2
title: Changelog
description: Release notes and version history for ralph-starter
---

# Changelog

All notable changes to ralph-starter are documented here.

## [Unreleased]

### Planned
- Interactive wizard mode improvements
- Additional input source integrations
- Template marketplace

---

## [0.1.x] - Initial Release

### Added
- Core CLI with `run`, `init`, `plan`, `config`, and `source` commands
- GitHub integration for fetching issues and PRs
- Linear integration for fetching issues
- Notion integration for fetching pages
- Interactive wizard with idea mode
- MCP server integration for Claude Desktop
- Ralph Playbook support for custom configurations
- Git automation for commits and PRs
- Validation system for specs

### Features
- **Multi-source support**: Fetch specs from GitHub, Linear, or Notion
- **Autonomous coding loops**: Let AI agents build from specs
- **Interactive wizard**: Step-by-step project setup
- **MCP integration**: Use with Claude Desktop

---

## Version History

For the complete version history and release notes, see:

- [GitHub Releases](https://github.com/rubenmarcus/ralph-starter/releases)
- [npm Package History](https://www.npmjs.com/package/ralph-starter?activeTab=versions)

## Upgrade Guide

### Upgrading to latest

```bash
npm install -g ralph-starter@latest
# or
pnpm add -g ralph-starter@latest
```

### Check current version

```bash
ralph-starter --version
```

## Contributing

Found a bug or want to contribute?

- [Report Issues](https://github.com/rubenmarcus/ralph-starter/issues)
- [Submit Ideas](https://github.com/rubenmarcus/ralph-ideas/issues)
- [View Source](https://github.com/rubenmarcus/ralph-starter)
