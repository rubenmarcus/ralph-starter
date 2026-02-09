---
sidebar_position: 3
title: "Workflow Presets"
description: "Deep guide on choosing, using, and combining workflow presets to tailor ralph-starter loops to your development scenario"
keywords: [presets, workflow, tdd, feature, debug, review, docs, incident-response, refactor, adversarial-review]
---

# Workflow Presets

Presets are pre-configured bundles of loop settings designed for common development scenarios. Instead of manually specifying `--max-iterations`, `--validate`, `--commit`, and other flags every time, you select a preset and ralph-starter applies the right combination automatically.

```bash
ralph-starter run "implement user authentication" --preset feature
```

## How Presets Work

A preset configures up to seven dimensions of loop behavior:

| Setting | Purpose |
|---------|---------|
| `maxIterations` | Hard cap on how many agent iterations the loop can run |
| `validate` | Whether to run tests/lint/build after each iteration |
| `commit` | Whether to auto-commit passing changes |
| `completionPromise` | A specific string the agent must output to signal completion |
| `promptPrefix` | Instructions injected at the start of the agent prompt |
| `rateLimit` | Maximum API calls per hour (optional) |
| `circuitBreaker` | Custom failure thresholds for the circuit breaker (optional) |

When you pass `--preset feature`, ralph-starter looks up the preset by name and merges its configuration into the loop options. Any flag you pass explicitly on the command line takes precedence over the preset value.

## Preset Categories

Presets are organized into five categories: Development, Debugging, Review, Documentation, and Specialized.

---

### Development Presets

These presets are for building and modifying code.

#### `feature`

The workhorse preset for standard feature implementation.

| Setting | Value |
|---------|-------|
| Max Iterations | 30 |
| Validate | Yes |
| Commit | Yes |
| Completion Promise | `FEATURE_COMPLETE` |
| Circuit Breaker | 3 consecutive failures, 5 same-error max |

The agent codes, validates, and commits in a tight loop. It stops when it outputs the string `FEATURE_COMPLETE` or hits 30 iterations. The circuit breaker prevents infinite loops if the agent keeps hitting the same error.

```bash
ralph-starter run "add pagination to the users API endpoint" --preset feature
```

#### `feature-minimal`

A lighter version of `feature` for quick tasks that do not need validation.

| Setting | Value |
|---------|-------|
| Max Iterations | 20 |
| Validate | No |
| Commit | Yes |

Use this when you trust the agent to produce correct code without a test/lint/build check, such as small config changes or straightforward boilerplate.

```bash
ralph-starter run "add .env.example file with all required vars" --preset feature-minimal
```

#### `tdd-red-green`

Strict test-driven development: write a failing test, implement minimum code to pass, refactor.

| Setting | Value |
|---------|-------|
| Max Iterations | 50 |
| Validate | Yes |
| Commit | Yes |
| Prompt Prefix | Follow strict TDD: write failing test, confirm failure, implement minimum code, refactor. Commit after each green test. |
| Circuit Breaker | 5 consecutive failures, 3 same-error max |

The higher iteration limit (50) accommodates the red-green-refactor cycle, which naturally takes more turns. The prompt prefix forces the agent to follow TDD discipline.

```bash
ralph-starter run "add email validation to signup form" --preset tdd-red-green
```

#### `spec-driven`

Implementation driven by specification files in a `specs/` directory.

| Setting | Value |
|---------|-------|
| Max Iterations | 40 |
| Validate | Yes |
| Commit | Yes |
| Prompt Prefix | Read specification files in specs/ directory. Implement according to requirements. Mark tasks complete in IMPLEMENTATION_PLAN.md. |
| Completion Promise | `<promise>COMPLETE</promise>` |

The agent reads your spec files, implements them, and tracks progress in an `IMPLEMENTATION_PLAN.md` file. It signals completion with the `<promise>COMPLETE</promise>` tag.

```bash
ralph-starter run "implement the payment module" --preset spec-driven
```

#### `refactor`

Safe refactoring with continuous test validation.

| Setting | Value |
|---------|-------|
| Max Iterations | 40 |
| Validate | Yes |
| Commit | Yes |
| Prompt Prefix | Refactor while maintaining all tests passing. Make small, incremental changes. Commit after each successful refactoring step. |
| Circuit Breaker | 2 consecutive failures, 3 same-error max |

The tight circuit breaker (2 consecutive failures) catches regressions fast. The prompt forces small, incremental changes so each commit is safe to revert individually.

```bash
ralph-starter run "extract shared utilities from controllers" --preset refactor
```

---

### Debugging Presets

These presets are for investigating and fixing issues.

#### `debug`

General debugging session without auto-commits.

| Setting | Value |
|---------|-------|
| Max Iterations | 20 |
| Validate | No |
| Commit | No |
| Prompt Prefix | Debug step by step. Add logging, analyze outputs, identify root cause. Document findings. |

No commits and no validation -- the agent is free to add temporary logging, experiment, and explore without polluting your git history.

```bash
ralph-starter run "figure out why WebSocket connections drop after 30 seconds" --preset debug
```

#### `incident-response`

Quick fix for production incidents with tight guardrails.

| Setting | Value |
|---------|-------|
| Max Iterations | 15 |
| Validate | Yes |
| Commit | Yes |
| Prompt Prefix | This is a production incident. Focus on the minimal fix. Avoid refactoring. Document the issue and solution. |
| Circuit Breaker | 2 consecutive failures, 2 same-error max |

Low iteration cap (15) and aggressive circuit breaker (2/2) keep the agent focused. The prompt explicitly discourages refactoring -- you want the smallest safe fix, not a rewrite.

```bash
ralph-starter run "fix: users getting 500 on /api/checkout" --preset incident-response
```

#### `code-archaeology`

Investigate and document legacy code without changing anything.

| Setting | Value |
|---------|-------|
| Max Iterations | 30 |
| Validate | No |
| Commit | No |
| Prompt Prefix | Investigate the codebase to understand how it works. Add documentation and comments. Create diagrams if helpful. |

```bash
ralph-starter run "document the payment processing pipeline" --preset code-archaeology
```

---

### Review Presets

These presets produce analysis and feedback without implementing changes.

#### `review`

General code review and suggestions.

| Setting | Value |
|---------|-------|
| Max Iterations | 10 |
| Validate | Yes |
| Commit | No |
| Prompt Prefix | Review the code for: bugs, security issues, performance problems, code quality. Suggest improvements but do not implement. |

```bash
ralph-starter run "review the authentication middleware" --preset review
```

#### `pr-review`

Pull request review.

| Setting | Value |
|---------|-------|
| Max Iterations | 10 |
| Validate | Yes |
| Commit | No |
| Prompt Prefix | Review changes in this PR. Check for: correctness, test coverage, documentation, breaking changes. Provide actionable feedback. |

```bash
ralph-starter run "review PR #42" --preset pr-review --source github
```

#### `adversarial-review`

Security-focused adversarial review.

| Setting | Value |
|---------|-------|
| Max Iterations | 15 |
| Validate | No |
| Commit | No |
| Prompt Prefix | Perform an adversarial security review. Look for: injection vulnerabilities, authentication bypasses, authorization issues, data leaks, OWASP Top 10. |

No validation is needed because the agent is reading, not writing. The higher iteration count (15 vs 10 for normal review) gives the agent more room to explore attack surfaces.

```bash
ralph-starter run "security audit the API endpoints" --preset adversarial-review
```

---

### Documentation Presets

These presets focus on generating or organizing documentation.

#### `docs`

Generate comprehensive documentation.

| Setting | Value |
|---------|-------|
| Max Iterations | 20 |
| Validate | No |
| Commit | Yes |
| Prompt Prefix | Generate comprehensive documentation. Include: API docs, usage examples, architecture overview. Use clear language. |

```bash
ralph-starter run "document the REST API" --preset docs
```

#### `documentation-first`

Write documentation before implementation.

| Setting | Value |
|---------|-------|
| Max Iterations | 30 |
| Validate | No |
| Commit | Yes |
| Prompt Prefix | Write documentation first, then implement. Document: purpose, API, usage examples, edge cases. Implementation must match documentation. |

```bash
ralph-starter run "design and implement the notification service" --preset documentation-first
```

---

### Specialized Presets

These presets address specific engineering workflows.

#### `api-design`

API design and implementation following REST best practices.

| Setting | Value |
|---------|-------|
| Max Iterations | 35 |
| Validate | Yes |
| Commit | Yes |
| Prompt Prefix | Design and implement the API following REST best practices. Include: proper HTTP methods, status codes, error handling, validation, documentation. |

```bash
ralph-starter run "create CRUD endpoints for products" --preset api-design
```

#### `migration-safety`

Safe database and data migrations with rollback support.

| Setting | Value |
|---------|-------|
| Max Iterations | 25 |
| Validate | Yes |
| Commit | Yes |
| Prompt Prefix | Create safe migrations. Ensure: reversibility, no data loss, backward compatibility, proper testing. Create rollback scripts. |
| Circuit Breaker | 1 consecutive failure, 2 same-error max |

The most aggressive circuit breaker of any preset (1 failure trips it) because a broken migration can cause data loss.

```bash
ralph-starter run "add email column to users table" --preset migration-safety
```

#### `performance-optimization`

Performance analysis and targeted optimization.

| Setting | Value |
|---------|-------|
| Max Iterations | 30 |
| Validate | Yes |
| Commit | Yes |
| Prompt Prefix | Analyze and optimize performance. Profile first, identify bottlenecks, make targeted improvements. Document performance gains. |

```bash
ralph-starter run "optimize the search query that times out on large datasets" --preset performance-optimization
```

#### `scientific-method`

Hypothesis-driven development.

| Setting | Value |
|---------|-------|
| Max Iterations | 40 |
| Validate | Yes |
| Commit | Yes |
| Prompt Prefix | Follow the scientific method: 1) Observe the problem, 2) Form a hypothesis, 3) Design an experiment (test), 4) Implement and test, 5) Analyze results, 6) Iterate. |

Use this when you are unsure what the right approach is and want the agent to systematically explore options.

```bash
ralph-starter run "reduce memory usage in the data processing pipeline" --preset scientific-method
```

#### `research`

Research and exploration without code changes.

| Setting | Value |
|---------|-------|
| Max Iterations | 25 |
| Validate | No |
| Commit | No |
| Prompt Prefix | Research the topic thoroughly. Explore options, compare alternatives, document findings. Create a summary report. |

```bash
ralph-starter run "evaluate ORMs for our Node.js backend" --preset research
```

#### `gap-analysis`

Compare specification to implementation and identify discrepancies.

| Setting | Value |
|---------|-------|
| Max Iterations | 20 |
| Validate | Yes |
| Commit | No |
| Prompt Prefix | Compare the specification to the current implementation. Identify gaps, missing features, and discrepancies. Create a prioritized TODO list. |

```bash
ralph-starter run "compare our API to the OpenAPI spec" --preset gap-analysis
```

---

## How `promptPrefix` Shapes Agent Behavior

The `promptPrefix` is injected at the beginning of the prompt sent to the agent on every iteration. It acts as a persistent system instruction that steers the agent's approach throughout the entire loop.

For example, the `tdd-red-green` preset injects:

> Follow strict TDD: 1) Write a failing test first, 2) Run tests to confirm failure, 3) Implement minimum code to pass, 4) Refactor if needed. Commit after each green test.

This means even if the agent's natural inclination is to implement first, the prefix overrides that behavior on every turn.

## How `completionPromise` Controls Stopping

The `completionPromise` is a specific string the agent must output for the loop to detect task completion. This is more reliable than heuristic-based completion detection.

- `feature` uses `FEATURE_COMPLETE` -- the agent must explicitly say this string.
- `spec-driven` uses `<promise>COMPLETE</promise>` -- a structured tag that is harder to trigger accidentally.
- Presets without a `completionPromise` rely on ralph-starter's built-in semantic completion detection and standard markers like `<TASK_DONE>` or `All tasks completed`.

## Combining Presets with CLI Flags

CLI flags always override preset values. This lets you use a preset as a starting point and customize specific settings.

```bash
# Use feature preset but increase iterations
ralph-starter run "implement complex auth flow" --preset feature --max-iterations 50

# Use tdd-red-green but skip commits
ralph-starter run "add unit tests" --preset tdd-red-green --no-commit

# Use debug preset but enable validation
ralph-starter run "fix the flaky test" --preset debug --validate

# Use review preset with a specific agent
ralph-starter run "review the auth module" --preset review --agent cursor
```

## Example Workflows

### Workflow: TDD Feature Development

```bash
# Start with TDD preset
ralph-starter run "add password reset functionality" \
  --preset tdd-red-green \
  --validate \
  --commit

# Agent will:
# 1. Write a failing test for password reset
# 2. Run tests to confirm failure
# 3. Implement the minimum code to make the test pass
# 4. Commit
# 5. Repeat for the next test case
```

### Workflow: Incident Response

```bash
# Production is down -- use incident-response preset
ralph-starter run "fix: 500 errors on /api/orders after deploy" \
  --preset incident-response \
  --push \
  --pr

# Agent will:
# 1. Identify the root cause (limited to 15 iterations)
# 2. Apply the minimal fix
# 3. Validate that tests pass
# 4. Commit, push, and create a PR
# Circuit breaker trips fast (2 failures) to avoid wasting time
```

### Workflow: Adversarial Security Review

```bash
# Run a security audit
ralph-starter run "audit all API endpoints for OWASP Top 10" \
  --preset adversarial-review

# Agent will:
# 1. Enumerate all API endpoints
# 2. Check for injection vulnerabilities
# 3. Test authentication and authorization
# 4. Look for data leaks
# 5. Produce a security report (no code changes, no commits)
```

### Workflow: Spec-Driven Implementation

```bash
# Place your spec files in specs/ and an IMPLEMENTATION_PLAN.md
ralph-starter run "implement the payment module per spec" \
  --preset spec-driven \
  --validate \
  --commit

# Agent will:
# 1. Read specs/ directory
# 2. Implement each requirement
# 3. Check off tasks in IMPLEMENTATION_PLAN.md
# 4. Output <promise>COMPLETE</promise> when done
```

## Listing Available Presets

To see all available presets from the command line:

```bash
ralph-starter run --help
```

The help output groups presets by category with their descriptions:

```
Available presets:

  Development:
    feature                Standard feature implementation with validation and commits
    feature-minimal        Quick feature implementation without validation
    tdd-red-green          Test-driven development: write failing test, then implement
    spec-driven            Implementation driven by specification files
    refactor               Safe refactoring with continuous test validation

  Debugging:
    debug                  Debugging session without auto-commits
    incident-response      Quick fix for production incidents
    code-archaeology       Investigate and document legacy code

  Review:
    review                 Code review and suggestions
    pr-review              Pull request review
    adversarial-review     Security-focused adversarial review

  Documentation:
    docs                   Generate documentation
    documentation-first    Write docs before implementation

  Specialized:
    api-design             API design and implementation
    migration-safety       Safe database/data migrations
    performance-optimization  Performance analysis and optimization
    scientific-method      Hypothesis-driven development
    research               Research and exploration
    gap-analysis           Compare spec to implementation
```

## Choosing the Right Preset

| Situation | Recommended Preset |
|---|---|
| Building a new feature | `feature` |
| Quick scaffolding or config changes | `feature-minimal` |
| Test-first development | `tdd-red-green` |
| Working from a detailed spec | `spec-driven` |
| Cleaning up code | `refactor` |
| Investigating a bug | `debug` |
| Production is down | `incident-response` |
| Understanding legacy code | `code-archaeology` |
| Reviewing code quality | `review` |
| Reviewing a pull request | `pr-review` |
| Security audit | `adversarial-review` |
| Writing documentation | `docs` |
| Design-first approach | `documentation-first` |
| Building REST APIs | `api-design` |
| Database migrations | `migration-safety` |
| Performance tuning | `performance-optimization` |
| Exploring solutions | `scientific-method` |
| Comparing options | `research` |
| Checking spec compliance | `gap-analysis` |
