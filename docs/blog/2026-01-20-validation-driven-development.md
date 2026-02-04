---
slug: validation-driven-development
title: "Validation-Driven Development: Let Your Tests Guide the AI"
authors: [ralph]
tags: [testing, validation, quality, best-practices]
---

# Validation-Driven Development: Let Your Tests Guide the AI

AI can write code fast. But can it write *correct* code? The answer is yes—if you let your validation pipeline guide it.

<!-- truncate -->

## The Quality Problem

AI-generated code has a reputation: it looks right but breaks in subtle ways. Missing edge cases. Type errors. Failed tests. The usual response is manual review and iteration.

But what if the AI could iterate itself?

## Validation-Driven Loops

ralph-starter runs your validation suite after every coding loop:

```bash
ralph-starter run "add payment processing" \
  --test \
  --lint \
  --build \
  --loops 5
```

Here's what happens:

```
Loop 1: Implementing payment processing...
  → Running tests... 2 failed
  → Analyzing failures...

Loop 2: Fixing test failures...
  → Running tests... passed
  → Running linter... 3 issues
  → Analyzing issues...

Loop 3: Fixing lint issues...
  → Running tests... passed
  → Running linter... passed
  → Running build... success

✨ Completed in 3 loops
```

The AI doesn't just generate code—it iterates until validation passes.

## Configure Your Validators

### Built-in Commands

```yaml
# ralph.config.yaml
validation:
  test: "npm test"
  lint: "npm run lint"
  build: "npm run build"
```

### Custom Validators

```yaml
validation:
  test: "pytest -x"
  lint: "ruff check ."
  typecheck: "mypy ."
  security: "bandit -r src/"
```

### Per-Project Overrides

```bash
# Override for a single run
ralph-starter run "fix the bug" \
  --test "npm test -- --coverage" \
  --lint "eslint --fix ."
```

## Error Recovery

When validation fails, ralph-starter:

1. **Captures the error output**
2. **Analyzes what went wrong**
3. **Generates a fix in the next loop**
4. **Re-runs validation**

```
Loop 2: Running tests...
  FAIL src/payment.test.ts
    ✕ should handle declined cards (15ms)
      Expected: "DECLINED"
      Received: undefined

Loop 3: Fixing test failure...
  → Added error handling for declined cards
  → Running tests... passed
```

## Best Practices

### 1. Start with Good Tests

The better your test coverage, the better ralph-starter performs. Tests act as a specification the AI must satisfy.

### 2. Use Strict Linting

Strict linting catches issues early. Enable type checking, unused variable detection, and style enforcement.

### 3. Set Appropriate Loop Limits

```bash
# Simple fixes: 2-3 loops
ralph-starter run "fix typo in header" --loops 2

# Complex features: 5-7 loops
ralph-starter run "add OAuth integration" --loops 7

# Exploratory: 10+ loops
ralph-starter run "refactor auth system" --loops 10
```

### 4. Review the Diffs

Even with validation, review the changes:

```bash
# Don't auto-commit—review first
ralph-starter run "add feature" --test --lint

# Check what changed
git diff

# Then commit manually
git add . && git commit -m "feat: add feature"
```

## The Feedback Loop

Validation-driven development creates a tight feedback loop:

```
Spec → Generate → Validate → Fix → Validate → Ship
```

Each iteration improves the code. The AI learns from your test suite what "correct" means for your project.

## Metrics That Matter

Track your validation-driven development:

```bash
ralph-starter run "task" --verbose
```

```
Summary:
  Loops: 4
  Test runs: 4 (2 failed, 2 passed)
  Lint runs: 3 (1 failed, 2 passed)
  Build runs: 2 (0 failed, 2 passed)
  Total cost: $0.34
  Time: 2m 15s
```

---

Ready to let your tests guide the AI? [Configure validation](/advanced/validation).
