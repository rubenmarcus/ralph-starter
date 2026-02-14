---
sidebar_position: 2
title: fix
description: Fix build errors, lint issues, or design problems
keywords: [cli, fix, command, build errors, lint, design, visual, css]
---

# ralph-starter fix

Fix build errors, lint issues, or design problems.

## Synopsis

```bash
ralph-starter fix [task] [options]
```

## Description

The `fix` command runs a focused AI loop to fix project issues. It scans for build, lint, typecheck, and test failures, then orchestrates a coding agent to fix them automatically.

When given a custom task describing a visual or design problem (e.g., "fix the paddings and make the colors brighter"), the fix command detects CSS/design keywords and:

- Auto-applies installed design skills (frontend-design, ui-ux-designer, etc.)
- Instructs the agent to visually verify changes using browser screenshots

For structured visual fix passes, use the `--design` flag — see [Design Mode](#design-mode) below.

## Arguments

| Argument | Description |
|----------|-------------|
| `task` | Optional description of what to fix. If not provided, scans for build/lint errors. |

## Options

| Option | Description | Default |
|--------|-------------|---------|
| `--scan` | Force full project scan (build + lint + typecheck + tests) | false |
| `--design` | Structured visual fix mode with screenshot verification | false |
| `--agent <name>` | Specify agent (claude-code, cursor, codex, opencode) | auto-detect |
| `--commit` | Auto-commit the fix | false |
| `--max-iterations <n>` | Maximum fix iterations | 3 (scan), 4 (design keywords), 7 (--design) |
| `--output-dir <path>` | Project directory | cwd |

## Examples

### Fix Build Errors

```bash
# Auto-detect and fix build/lint errors
ralph-starter fix

# Force full project scan
ralph-starter fix --scan
```

### Fix Design Issues

```bash
# Structured visual fix pass (recommended for design work)
ralph-starter fix --design

# Design mode with specific notes
ralph-starter fix --design "the hero section spacing is off and colors are too muted"

# Ad-hoc CSS/design fix (auto-detected as design task)
ralph-starter fix "fix the paddings and make the colors brighter"

# Fix responsive layout
ralph-starter fix "make the layout responsive on mobile"
```

### With Options

```bash
# Auto-commit the fix
ralph-starter fix --scan --commit

# Use a specific agent
ralph-starter fix "fix lint errors" --agent claude-code

# Allow more iterations for complex fixes
ralph-starter fix "fix all test failures" --max-iterations 5

# Design fix with more room to iterate
ralph-starter fix --design --max-iterations 10
```

## Behavior

1. **Error Detection**:
   - If `task` provided → runs build check for baseline, then fixes the described issue
   - If no task and previous failures exist → re-runs failed validations from `.ralph/activity.md`
   - If `--scan` → runs full validation suite (build + lint + typecheck + tests)

2. **Skill Detection**:
   - Detects installed Claude Code skills relevant to the task
   - For CSS/design tasks → auto-applies design skills and adds visual verification instructions
   - Searches skills.sh for complementary skills if needed

3. **Fix Loop**:
   - Agent works on fixing issues (default: 3 iterations for scan, 7 for `--design`)
   - Lint checks run between iterations (fast feedback)
   - Full build check runs on final iteration
   - If build fails on final iteration → extends loop by 2 extra iterations

4. **Verification**:
   - Re-runs original validation commands after the loop
   - Reports success only if all checks pass (not just agent completion)

## Design Mode

The `--design` flag enables a structured visual fix workflow specifically designed for CSS, layout, and styling issues. It runs the agent through a 5-phase process:

### Phase 1: Visual Audit

The agent's **first action** is to start the dev server and take screenshots at 3 viewports:
- Desktop (1440px)
- Tablet (768px)
- Mobile (375px)

### Phase 2: Issue Identification

The agent analyzes screenshots against the project spec and checks for issues in priority order:

0. **CSS cascade conflicts** — Detects unlayered CSS resets (e.g., `* { margin: 0; padding: 0; }`) that silently override Tailwind v4 utilities. This is the most common cause of "classes are correct but nothing works."
1. **Page structure** — Content centering, max-width wrappers, empty gaps
2. **Layout & positioning** — Grid/flex rendering, column balance, overlaps
3. **Responsive issues** — Viewport breakage, overflow, clipping
4. **Spacing** — Vertical rhythm, abnormal gaps
5. **Typography & colors** — Font loading, readability, consistency

### Phase 3: Fix Plan

The agent creates a `DESIGN_FIX_PLAN.md` with specific issues, exact files, and CSS properties to change.

### Phase 4: Execute & Verify

Fixes are applied in priority order (structural first, cosmetic last). The agent re-screenshots after each structural fix to verify improvement.

### Phase 5: Completion

The loop requires the agent to output `DESIGN_VERIFIED` after taking final verification screenshots. The loop will **not** accept generic completion signals like "All tasks completed" — only `DESIGN_VERIFIED` after visual confirmation.

### Why Design Mode Exists

Without `--design`, agents often:
- Read code and see "correct" Tailwind classes, then declare victory without visual verification
- Add more CSS classes on top of cascade conflicts instead of fixing the root cause
- Complete in 1 iteration without actually verifying the visual result

Design mode forces visual-first debugging and prevents premature exit.

## Exit Codes

| Code | Description |
|------|-------------|
| 0 | All issues fixed |
| 1 | Could not fix all issues automatically |

## See Also

- [ralph-starter run](/docs/cli/run)
- [ralph-starter skill](/docs/cli/skill)
- [Validation](/docs/advanced/validation)
- [Skills System](/docs/guides/skills-system)
