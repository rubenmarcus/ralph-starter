# Contributing to ralph-starter

Thanks for your interest in contributing to ralph-starter! This document covers the basics to get you started.

## Quick Links

- [Documentation](https://rubenmarcus.github.io/ralph-starter/)
- [Developer Extension Guide](https://rubenmarcus.github.io/ralph-starter/docs/guides/extending-ralph-starter) - For creating custom sources, agents, and more
- [Issues](https://github.com/rubenmarcus/ralph-starter/issues)
- [Discussions](https://github.com/rubenmarcus/ralph-starter/discussions)

## Development Setup

```bash
# Clone the repo
git clone https://github.com/rubenmarcus/ralph-starter.git
cd ralph-starter

# Install dependencies
npm install

# Build
npm run build

# Link for local testing
npm link
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
npm run typecheck

# Lint
npm run lint

# Build (includes type checking)
npm run build
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
- Update docs if you add/change features

### 3. Test Locally

```bash
npm run build
ralph-starter --help
```

### 4. Commit with Conventional Commits

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

### 5. Submit a Pull Request

- Fill out the PR template
- Link any related issues
- Wait for review

## Common Contributions

### Adding a New Input Source

See the [extension guide](https://rubenmarcus.github.io/ralph-starter/docs/guides/extending-ralph-starter#creating-custom-input-sources) for a complete walkthrough.

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
npm install
npm start  # Development server at localhost:3000
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
