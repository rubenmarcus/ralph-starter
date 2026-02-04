---
sidebar_position: 3
title: Git Automation
description: Auto-commit, push, and create pull requests
keywords: [git, commit, push, pull request, automation]
---

# Git Automation

ralph-starter can automatically commit changes, push to remote, and create pull requests.

## Flags

| Flag | Description |
|------|-------------|
| `--commit` | Auto-commit after each successful task |
| `--push` | Push commits to remote |
| `--pr` | Create a pull request when done |

## Commit Automation

### Enable

```bash
ralph-starter run "add feature" --commit
```

### Behavior

After each successful task (and validation if enabled):

1. Stage all changes
2. Create commit with descriptive message
3. Continue to next task

### Commit Messages

Commits follow conventional commit format:

```
feat(auth): add login form component

- Created LoginForm component
- Added form validation
- Connected to auth API
```

## Push Automation

### Enable

```bash
ralph-starter run "add feature" --commit --push
```

### Behavior

After all tasks complete:

1. Push commits to remote
2. Uses current branch

### Requirements

- Git remote configured
- Authentication set up (SSH or HTTPS)

## Pull Request Creation

### Enable

```bash
ralph-starter run "add feature" --commit --push --pr
```

### Behavior

After pushing:

1. Creates PR using GitHub CLI (`gh`)
2. Auto-generates title and description
3. Opens PR against default branch

### Requirements

- [GitHub CLI](https://cli.github.com/) installed
- Authenticated (`gh auth login`)

### PR Format

```markdown
## Summary
- Added user authentication
- Created login and registration forms
- Implemented session management

## Changes
- src/components/LoginForm.tsx
- src/components/RegisterForm.tsx
- src/lib/auth.ts
- src/pages/login.tsx

## Testing
- [x] Tests pass
- [x] Lint passes
- [x] Build succeeds
```

## Workflow Examples

### Feature Development

```bash
# Create feature branch
git checkout -b feature/user-auth

# Run with full automation
ralph-starter run "add user authentication" --commit --push --pr --validate

# Result:
# - Multiple commits as tasks complete
# - Pushed to feature/user-auth
# - PR created against main
```

### Bug Fix

```bash
git checkout -b fix/login-bug

ralph-starter run "fix login redirect bug" --commit --push --pr

# Single commit, PR created
```

### Incremental Work

```bash
# Commit each task but don't push yet
ralph-starter run --commit

# Review changes
git log --oneline

# Push manually when ready
git push
```

## Best Practices

### Branch Strategy

```bash
# Always work on feature branches
git checkout -b feature/my-feature
ralph-starter run --commit --pr
```

### Atomic Commits

Each task creates one commit. Keep tasks small for atomic commits:

Good:
```markdown
- [ ] Add LoginForm component
- [ ] Add form validation
- [ ] Connect to API
```

Bad:
```markdown
- [ ] Add complete authentication system
```

### Review Before Push

```bash
# Commit locally first
ralph-starter run --commit

# Review
git log -p

# Then push
git push
```

## Troubleshooting

### Push Fails

```
error: failed to push some refs
```

Solution: Pull latest changes first

```bash
git pull --rebase origin main
ralph-starter run --commit --push
```

### PR Creation Fails

```
gh: command not found
```

Solution: Install GitHub CLI

```bash
# macOS
brew install gh

# Then authenticate
gh auth login
```

### No Changes to Commit

If validation fails repeatedly, no commits are made. Check validation output.

## See Also

- [Validation](/docs/advanced/validation)
- [Ralph Playbook](/docs/advanced/ralph-playbook)
