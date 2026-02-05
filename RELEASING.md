# Release Process

This document describes how releases are managed for ralph-starter.

## Overview

ralph-starter uses an automated release process based on GitHub Actions. Releases are triggered when a release PR is merged to `main`.

## Release Flow

```
Feature PR → main → Release PR → Tag → GitHub Release → npm publish
```

### 1. Feature Development

1. Create a feature branch from `main`
2. Make your changes
3. Open a PR to `main`
4. If your PR includes changes to `src/` or `package.json`, it automatically gets the `candidate-release` label

### 2. Release PR Creation

When a PR with the `candidate-release` label is merged:

1. A release branch (`release/vX.Y.Z`) is automatically created
2. Version in `package.json` is bumped based on conventional commit prefixes:
   - `feat:` or `feat(scope):` → **minor** bump (0.1.0 → 0.2.0)
   - `fix:`, `chore:`, etc. → **patch** bump (0.1.0 → 0.1.1)
   - `BREAKING` or `!` in title → **major** bump (0.1.0 → 1.0.0)
3. A release PR is automatically opened

### 3. Release Execution

When the release PR is merged:

1. Git tag `vX.Y.Z` is created and pushed
2. GitHub Release is published with auto-generated release notes
3. Package is published to npm with appropriate tag:
   - Stable versions → `latest` tag
   - Prerelease versions (e.g., `1.0.0-beta.1`) → `beta` tag

## Version Types

### Stable Releases

Standard semver versions: `0.1.0`, `1.0.0`, `2.3.1`

```bash
npm install -g ralph-starter
```

### Prerelease Versions

Versions with prerelease identifiers: `0.2.0-beta.1`, `1.0.0-alpha.3`

```bash
npm install -g ralph-starter@beta
# or specific version
npm install -g ralph-starter@0.2.0-beta.1
```

## Manual Release (Emergency)

If you need to release manually:

```bash
# 1. Ensure you're on main and up to date
git checkout main
git pull origin main

# 2. Update version
pnpm version patch  # or minor/major

# 3. Push with tags
git push origin main --tags

# 4. The release workflow will detect the tag and publish
```

## Changelog

Changelogs are automatically generated during releases based on commit messages. To ensure good changelogs:

- Use [Conventional Commits](https://www.conventionalcommits.org/)
- Write clear, descriptive commit messages
- Reference issues when applicable (`Fixes #123`)

### Commit Types

| Type | Description | Changelog Section |
|------|-------------|-------------------|
| `feat` | New features | Features |
| `fix` | Bug fixes | Bug Fixes |
| `docs` | Documentation | Documentation |
| `chore` | Maintenance | (usually excluded) |
| `refactor` | Code refactoring | (usually excluded) |
| `test` | Test changes | (usually excluded) |
| `ci` | CI/CD changes | (usually excluded) |

## npm Tags

| Tag | Description | Install Command |
|-----|-------------|-----------------|
| `latest` | Stable releases | `npm i -g ralph-starter` |
| `beta` | Beta prereleases | `npm i -g ralph-starter@beta` |
| `alpha` | Alpha prereleases | `npm i -g ralph-starter@alpha` |

## Troubleshooting

### Release PR not created

- Check that the source PR had the `candidate-release` label
- Verify the label was added before the PR was merged
- Check GitHub Actions logs for errors

### npm publish failed

- Verify `NPM_TOKEN` secret is set and valid
- Check if the version already exists on npm
- Review GitHub Actions logs for specific errors

### Tag already exists

- If re-releasing the same version, delete the existing tag first:
  ```bash
  git tag -d vX.Y.Z
  git push origin :refs/tags/vX.Y.Z
  ```

## Required Secrets

| Secret | Description |
|--------|-------------|
| `NPM_TOKEN` | npm automation token for publishing |
| `GITHUB_TOKEN` | Automatically provided by GitHub Actions |
