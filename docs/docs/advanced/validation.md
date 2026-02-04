---
sidebar_position: 2
title: Validation
description: Running tests, lint, and build validation
keywords: [validation, tests, lint, build, backpressure]
---

# Validation (Backpressure)

The `--validate` flag enables backpressure validation, running tests/lint/build after each iteration to catch issues early.

## How It Works

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  AI codes   │ ──▶ │  Validate   │ ──▶ │   Pass?     │
└─────────────┘     └─────────────┘     └─────────────┘
                                               │
                    ┌──────────────────────────┤
                    │                          │
                    ▼                          ▼
              ┌─────────────┐           ┌─────────────┐
              │ Fix issues  │           │   Commit    │
              └─────────────┘           └─────────────┘
```

1. AI implements a task
2. Validation commands run
3. If failed → AI gets error output and fixes issues
4. If passed → Changes are committed (if `--commit`)
5. Loop continues

## Enable Validation

```bash
ralph-starter run "add feature" --validate
```

## Validation Commands

ralph-starter looks for validation commands in two places:

### 1. AGENTS.md

```markdown
### Validation Commands
- test: npm test
- lint: npm run lint
- build: npm run build
- typecheck: npm run typecheck
```

### 2. package.json (Fallback)

```json
{
  "scripts": {
    "test": "jest",
    "lint": "eslint src/",
    "build": "tsc && vite build",
    "typecheck": "tsc --noEmit"
  }
}
```

## Command Detection

ralph-starter automatically detects:

| Command | Detected From |
|---------|---------------|
| `test` | AGENTS.md or package.json `test` script |
| `lint` | AGENTS.md or package.json `lint` script |
| `build` | AGENTS.md or package.json `build` script |
| `typecheck` | AGENTS.md or package.json `typecheck` script |

## Validation Order

Commands run in order:
1. `test` - Run tests
2. `lint` - Check code style
3. `build` - Build project

If any command fails, validation stops and the AI receives the error output.

## Error Feedback

When validation fails, the AI receives:

```markdown
## Validation Failed

### npm run test
```
FAIL src/components/Dashboard.test.tsx
  ● Dashboard › renders habits
    Expected: 3
    Received: 0
```

Please fix the above issues before continuing.
```

The AI then attempts to fix the issues before continuing.

## Examples

### With Commit

```bash
# Validate and commit if passed
ralph-starter run "add tests" --validate --commit
```

### Full Automation

```bash
# Auto mode with validation and commit
ralph-starter run --auto --validate --commit
```

### Maximum Iterations

```bash
# Limit iterations to prevent infinite fix loops
ralph-starter run --validate --max-iterations 20
```

## Custom Validation

### In AGENTS.md

```markdown
### Validation Commands
- test: npm test -- --coverage --watchAll=false
- lint: npm run lint -- --max-warnings 0
- build: npm run build
- e2e: npm run test:e2e
```

### Multiple Commands

You can specify multiple validation steps:

```markdown
### Validation Commands
- typecheck: npm run typecheck
- lint: npm run lint
- test: npm test
- build: npm run build
```

## Timeout

Each validation command has a 5-minute timeout. Long-running tests may need adjustment.

## Skipping Validation

For quick iterations without validation:

```bash
ralph-starter run "quick fix" --commit
```

## Tips

1. **Start with validation** - Catches issues early
2. **Fast tests** - Use watch mode disabled for CI-like behavior
3. **Strict lint** - Use `--max-warnings 0` for strict linting
4. **Build always** - Include build to catch TypeScript errors

## See Also

- [Git Automation](/advanced/git-automation)
- [Ralph Playbook](/advanced/ralph-playbook)
