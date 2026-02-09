---
sidebar_position: 12
title: presets
description: Pre-configured workflow presets for common development scenarios
keywords: [cli, presets, command, workflow, tdd, debug, review, documentation, feature]
---

# ralph-starter presets

List and use pre-configured workflow presets for common development scenarios.

## Synopsis

```bash
# List all available presets
ralph-starter presets

# Use a preset with the run command
ralph-starter run --preset <name> [task]
```

## Description

Presets are pre-configured workflow settings that tune ralph-starter's behavior for specific development scenarios. Each preset adjusts parameters like maximum iterations, validation behavior, auto-commit settings, and provides a specialized prompt prefix that guides the agent's approach.

Running `ralph-starter presets` lists all available presets grouped by category. To use a preset, pass `--preset <name>` to the `ralph-starter run` command.

## Preset Reference

### Development

#### `feature`

Standard feature implementation with validation and commits.

| Setting | Value |
|---------|-------|
| Max Iterations | 30 |
| Validate | Yes |
| Commit | Yes |
| Circuit Breaker | 3 consecutive failures, 5 same errors |

```bash
ralph-starter run --preset feature "add user authentication"
```

#### `feature-minimal`

Quick feature implementation without validation. Useful for rapid prototyping.

| Setting | Value |
|---------|-------|
| Max Iterations | 20 |
| Validate | No |
| Commit | Yes |

```bash
ralph-starter run --preset feature-minimal "scaffold dashboard layout"
```

#### `tdd-red-green`

Test-driven development workflow. The agent writes a failing test first, then implements the minimum code to make it pass, then refactors.

| Setting | Value |
|---------|-------|
| Max Iterations | 50 |
| Validate | Yes |
| Commit | Yes |
| Circuit Breaker | 5 consecutive failures, 3 same errors |

Agent instructions: Follow strict TDD -- write a failing test first, run tests to confirm failure, implement minimum code to pass, refactor if needed. Commit after each green test.

```bash
ralph-starter run --preset tdd-red-green "implement shopping cart service"
```

#### `spec-driven`

Implementation driven by specification files. The agent reads specs from a `specs/` directory and tracks progress in `IMPLEMENTATION_PLAN.md`.

| Setting | Value |
|---------|-------|
| Max Iterations | 40 |
| Validate | Yes |
| Commit | Yes |

Agent instructions: Read the specification files in the `specs/` directory. Implement according to the requirements. Mark tasks complete in `IMPLEMENTATION_PLAN.md` as you finish them.

```bash
ralph-starter run --preset spec-driven
```

#### `refactor`

Safe refactoring with continuous test validation. The agent makes small, incremental changes and commits after each successful refactoring step.

| Setting | Value |
|---------|-------|
| Max Iterations | 40 |
| Validate | Yes |
| Commit | Yes |
| Circuit Breaker | 2 consecutive failures, 3 same errors |

```bash
ralph-starter run --preset refactor "extract auth logic into separate module"
```

---

### Debugging

#### `debug`

Open-ended debugging session without auto-commits. The agent adds logging, analyzes outputs, and identifies root causes.

| Setting | Value |
|---------|-------|
| Max Iterations | 20 |
| Validate | No |
| Commit | No |

Agent instructions: Debug the issue step by step. Add logging, analyze outputs, identify root cause. Document findings.

```bash
ralph-starter run --preset debug "users report 500 errors on /api/orders"
```

#### `incident-response`

Quick fix for production incidents. The agent focuses on the minimal fix and avoids refactoring.

| Setting | Value |
|---------|-------|
| Max Iterations | 15 |
| Validate | Yes |
| Commit | Yes |
| Circuit Breaker | 2 consecutive failures, 2 same errors |

Agent instructions: This is a production incident. Focus on the minimal fix. Avoid refactoring. Document the issue and solution.

```bash
ralph-starter run --preset incident-response "fix: payments webhook returning 503"
```

#### `code-archaeology`

Investigate and document legacy code. The agent explores the codebase to understand how it works and adds documentation.

| Setting | Value |
|---------|-------|
| Max Iterations | 30 |
| Validate | No |
| Commit | No |

Agent instructions: Investigate the codebase to understand how it works. Add documentation and comments. Create diagrams if helpful.

```bash
ralph-starter run --preset code-archaeology "document the billing system architecture"
```

---

### Review

#### `review`

General code review and suggestions. The agent reviews for bugs, security issues, performance problems, and code quality without implementing changes.

| Setting | Value |
|---------|-------|
| Max Iterations | 10 |
| Validate | Yes |
| Commit | No |

Agent instructions: Review the code for bugs, security issues, performance problems, and code quality. Suggest improvements but do not implement.

```bash
ralph-starter run --preset review "review the authentication module"
```

#### `pr-review`

Pull request review. The agent checks for correctness, test coverage, documentation, and breaking changes.

| Setting | Value |
|---------|-------|
| Max Iterations | 10 |
| Validate | Yes |
| Commit | No |

Agent instructions: Review the changes in this PR. Check for correctness, test coverage, documentation, and breaking changes. Provide actionable feedback.

```bash
ralph-starter run --preset pr-review "review changes in feature/auth branch"
```

#### `adversarial-review`

Security-focused adversarial review. The agent looks for injection vulnerabilities, authentication bypasses, authorization issues, data leaks, and OWASP Top 10 concerns.

| Setting | Value |
|---------|-------|
| Max Iterations | 15 |
| Validate | No |
| Commit | No |

```bash
ralph-starter run --preset adversarial-review "security audit of the API layer"
```

---

### Documentation

#### `docs`

Generate comprehensive documentation including API docs, usage examples, and architecture overviews.

| Setting | Value |
|---------|-------|
| Max Iterations | 20 |
| Validate | No |
| Commit | Yes |

```bash
ralph-starter run --preset docs "generate API documentation for the payments module"
```

#### `documentation-first`

Write documentation before implementation. The agent documents purpose, API, usage examples, and edge cases first, then implements to match the documentation.

| Setting | Value |
|---------|-------|
| Max Iterations | 30 |
| Validate | No |
| Commit | Yes |

```bash
ralph-starter run --preset documentation-first "design and document the notification service API"
```

---

### Specialized

#### `api-design`

API design and implementation following REST best practices, including proper HTTP methods, status codes, error handling, validation, and documentation.

| Setting | Value |
|---------|-------|
| Max Iterations | 35 |
| Validate | Yes |
| Commit | Yes |

```bash
ralph-starter run --preset api-design "design REST API for user management"
```

#### `migration-safety`

Safe database and data migrations with a focus on reversibility, zero data loss, backward compatibility, and rollback scripts. Has a strict circuit breaker to stop early on failures.

| Setting | Value |
|---------|-------|
| Max Iterations | 25 |
| Validate | Yes |
| Commit | Yes |
| Circuit Breaker | 1 consecutive failure, 2 same errors |

```bash
ralph-starter run --preset migration-safety "migrate users table to add role column"
```

#### `performance-optimization`

Performance analysis and optimization. The agent profiles first, identifies bottlenecks, makes targeted improvements, and documents performance gains.

| Setting | Value |
|---------|-------|
| Max Iterations | 30 |
| Validate | Yes |
| Commit | Yes |

```bash
ralph-starter run --preset performance-optimization "optimize database queries in the dashboard"
```

#### `scientific-method`

Hypothesis-driven development. The agent follows the scientific method: observe the problem, form a hypothesis, design an experiment (test), implement and test, analyze results, and iterate.

| Setting | Value |
|---------|-------|
| Max Iterations | 40 |
| Validate | Yes |
| Commit | Yes |

```bash
ralph-starter run --preset scientific-method "investigate and fix flaky test in auth.spec.ts"
```

#### `research`

Research and exploration without code changes. The agent explores options, compares alternatives, and documents findings in a summary report.

| Setting | Value |
|---------|-------|
| Max Iterations | 25 |
| Validate | No |
| Commit | No |

```bash
ralph-starter run --preset research "evaluate state management solutions for the frontend"
```

#### `gap-analysis`

Compare a specification to the current implementation. The agent identifies gaps, missing features, and discrepancies, then creates a prioritized TODO list.

| Setting | Value |
|---------|-------|
| Max Iterations | 20 |
| Validate | Yes |
| Commit | No |

```bash
ralph-starter run --preset gap-analysis "compare API spec to current implementation"
```

## Preset Settings Reference

Every preset configures the following settings:

| Setting | Description |
|---------|-------------|
| `maxIterations` | Maximum number of loop iterations the agent can run |
| `validate` | Whether to run tests/lint/build after each iteration |
| `commit` | Whether to auto-commit after successful iterations |
| `promptPrefix` | Instructions prepended to the agent's task prompt |
| `completionPromise` | String the agent outputs to signal task completion |
| `circuitBreaker` | Automatic stop conditions to prevent infinite loops |

### Circuit Breaker

Some presets include a circuit breaker that stops execution early when the agent is stuck:

- **`maxConsecutiveFailures`** -- Stop after N consecutive failed iterations.
- **`maxSameErrorCount`** -- Stop after seeing the same error N times.

Presets with strict circuit breakers (like `migration-safety`) stop quickly to prevent cascading damage. Presets for exploration (like `debug`, `research`) omit circuit breakers to allow more freedom.

## Quick Reference Table

| Preset | Iterations | Validate | Commit | Category |
|--------|-----------|----------|--------|----------|
| `feature` | 30 | Yes | Yes | Development |
| `feature-minimal` | 20 | No | Yes | Development |
| `tdd-red-green` | 50 | Yes | Yes | Development |
| `spec-driven` | 40 | Yes | Yes | Development |
| `refactor` | 40 | Yes | Yes | Development |
| `debug` | 20 | No | No | Debugging |
| `incident-response` | 15 | Yes | Yes | Debugging |
| `code-archaeology` | 30 | No | No | Debugging |
| `review` | 10 | Yes | No | Review |
| `pr-review` | 10 | Yes | No | Review |
| `adversarial-review` | 15 | No | No | Review |
| `docs` | 20 | No | Yes | Documentation |
| `documentation-first` | 30 | No | Yes | Documentation |
| `api-design` | 35 | Yes | Yes | Specialized |
| `migration-safety` | 25 | Yes | Yes | Specialized |
| `performance-optimization` | 30 | Yes | Yes | Specialized |
| `scientific-method` | 40 | Yes | Yes | Specialized |
| `research` | 25 | No | No | Specialized |
| `gap-analysis` | 20 | Yes | No | Specialized |

## See Also

- [ralph-starter run](/docs/cli/run) - Use presets with the `--preset` flag
- [ralph-starter auto](/docs/cli/auto) - Combine presets with batch processing
