---
sidebar_position: 3
title: Contributing
description: How to contribute to ralph-starter
---

# Contributing

Thank you for your interest in contributing to ralph-starter! This guide will help you get started.

## Ways to Contribute

### Report Bugs

Found a bug? Please report it on [GitHub Issues](https://github.com/rubenmarcus/ralph-starter/issues).

When reporting bugs, please include:
- ralph-starter version (`ralph-starter --version`)
- Node.js version (`node --version`)
- Operating system
- Steps to reproduce
- Expected vs actual behavior
- Error messages or logs

### Submit Ideas

Have a feature idea? Submit it to [ralph-ideas](https://github.com/rubenmarcus/ralph-ideas/issues).

Good idea submissions include:
- Clear description of the feature
- Use case / problem it solves
- Suggested implementation (optional)
- Examples from other tools (optional)

### Contribute Code

1. **Fork the repository**
   ```bash
   gh repo fork rubenmarcus/ralph-starter
   ```

2. **Clone your fork**
   ```bash
   git clone https://github.com/YOUR_USERNAME/ralph-starter
   cd ralph-starter
   ```

3. **Install dependencies**
   ```bash
   pnpm install
   ```

4. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

5. **Make your changes**
   - Follow the existing code style
   - Add tests for new functionality
   - Update documentation if needed

6. **Run tests**
   ```bash
   pnpm test
   ```

7. **Commit your changes**
   ```bash
   git commit -m "feat: add your feature description"
   ```

8. **Push and create a PR**
   ```bash
   git push origin feature/your-feature-name
   gh pr create
   ```

## Development Setup

### Prerequisites

- Node.js 18+
- pnpm
- Git

### Project Structure

```
ralph-starter/
├── src/              # Source code
│   ├── cli/          # CLI commands
│   ├── sources/      # Input source integrations
│   ├── core/         # Core functionality
│   └── utils/        # Utility functions
├── docs/             # Documentation (Docusaurus)
├── tests/            # Test files
└── package.json
```

### Running Locally

```bash
# Build the project
pnpm build

# Run in development
pnpm dev

# Run tests
pnpm test

# Run linting
pnpm lint
```

## Code Style

- Use TypeScript
- Follow existing patterns in the codebase
- Use meaningful variable and function names
- Add JSDoc comments for public APIs
- Keep functions small and focused

## Commit Messages

We follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `chore:` Maintenance tasks
- `refactor:` Code refactoring
- `test:` Adding or updating tests

Examples:
```
feat: add Jira integration
fix: resolve GitHub auth token refresh issue
docs: update installation guide
```

## Pull Request Guidelines

- Keep PRs focused on a single change
- Include tests for new functionality
- Update documentation if needed
- Link to related issues
- Respond to review feedback promptly

## Questions?

- [Browse Templates](https://github.com/rubenmarcus/ralph-templates)
- [Open an Issue](https://github.com/rubenmarcus/ralph-starter/issues)

---

Thank you for contributing to ralph-starter!
