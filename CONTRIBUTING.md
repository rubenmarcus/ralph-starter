# Contributing to ralph-starter

Thanks for your interest in contributing to ralph-starter! This document covers the basics to get you started.

## Quick Links

- [Documentation](https://ralphstarter.ai)
- [Developer Extension Guide](https://ralphstarter.ai/docs/guides/extending-ralph-starter) - For creating custom sources, agents, and more
- [Issues](https://github.com/rubenmarcus/ralph-starter/issues)
- [Discussions](https://github.com/rubenmarcus/ralph-starter/discussions)

## Development Setup

```bash
# Clone the repo
git clone https://github.com/rubenmarcus/ralph-starter.git
cd ralph-starter

# Install dependencies
pnpm install

# Build
pnpm build

# Link for local testing
pnpm link --global
ralph-starter --version
```

## Project Structure

```
ralph-starter/
├── src/
│   ├── cli.ts              # CLI entry point
│   ├── index.ts            # Public API exports
│   ├── commands/           # CLI commands (run, init, plan, etc.)
│   ├── sources/            # Input source system
│   │   ├── builtin/        # File, URL, PDF sources
│   │   └── integrations/   # Todoist, Linear, Notion, GitHub
│   ├── wizard/             # Interactive wizard & idea mode
│   ├── loop/               # Autonomous loop engine
│   ├── mcp/                # MCP server implementation
│   └── automation/         # Git automation
├── docs/                   # Docusaurus documentation
└── templates/              # Project templates
```

## Running Tests

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint

# Build (includes type checking)
pnpm build
```

## Making Changes

### 1. Create a Branch

```bash
git checkout -b feature/my-feature
# or
git checkout -b fix/my-fix
```

### 2. Make Your Changes

- Keep changes focused - one feature or fix per PR
- Follow existing code style
- Add types for new code
- **Update docs if you add/change features** (see Documentation Requirements below)

### 3. Documentation Requirements

**Every code change that affects user-facing behavior MUST include documentation updates.**

#### What Needs Documentation?

- New CLI flags or options
- New commands
- Changed behavior
- New features
- New integrations

#### Documentation Checklist

Before submitting a PR, ensure:

- [ ] **README.md** updated (if adding flags/features)
- [ ] **docs/docs/cli/*.md** updated (if changing CLI)
- [ ] **docs/docs/sources/*.md** updated (if changing sources)
- [ ] **CHANGELOG.md** updated (under `[Unreleased]`)

#### Where to Update

| Change Type | Files to Update |
|-------------|-----------------|
| New CLI flag | README.md, docs/docs/cli/run.md |
| New source | docs/docs/sources/, README.md integrations table |
| New command | README.md commands table, new file in docs/docs/cli/ |
| Bug fix | CHANGELOG.md only |

### 4. Test Locally

```bash
pnpm build
ralph-starter --help
```

### 5. Commit with Conventional Commits

```bash
git commit -m "feat: add trello source integration"
git commit -m "fix: handle empty API responses"
git commit -m "docs: update installation guide"
git commit -m "refactor: extract validation logic"
```

Prefixes:
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation only
- `refactor:` - Code change that doesn't fix a bug or add a feature
- `test:` - Adding tests
- `chore:` - Maintenance tasks

### 6. Submit a Pull Request

- Fill out the PR template
- Link any related issues
- Wait for review

## Common Contributions

### Adding a New Input Source

See the [extension guide](https://ralphstarter.ai/docs/guides/extending-ralph-starter#creating-custom-input-sources) for a complete walkthrough.

Quick overview:
1. Create `src/sources/integrations/mysource.ts`
2. Implement the `InputSource` interface
3. Register in `src/sources/index.ts`
4. Add env var mapping in `src/sources/config.ts`
5. Add documentation in `docs/docs/sources/`

### Adding a New Agent

1. Add detection logic in `src/loop/agents.ts`
2. Test that the agent works with the loop
3. Update docs

### Improving Documentation

Docs live in `docs/` and use [Docusaurus](https://docusaurus.io/).

```bash
cd docs
pnpm install
pnpm start  # Development server at localhost:3000
```

## Code Style

- TypeScript with strict mode
- ES modules (`.js` extensions in imports)
- Async/await over raw promises
- Descriptive variable names
- JSDoc comments for public APIs

## Questions?

- Open a [Discussion](https://github.com/rubenmarcus/ralph-starter/discussions) for questions
- Open an [Issue](https://github.com/rubenmarcus/ralph-starter/issues) for bugs or feature requests

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
