---
sidebar_position: 1
title: Testing Integrations
description: How to test ralph-starter integrations and verify everything works
keywords: [testing, integrations, api keys, setup, verification, environment variables]
---

# Testing ralph-starter Integrations

This guide walks you through testing ralph-starter features and setting up integrations.

## Configuring API Keys

You have two options for storing API keys:

Use the config command to set your API keys:

```bash
ralph-starter config set linear.apiKey lin_api_xxxxx
ralph-starter config set notion.token secret_xxxxx
ralph-starter config set github.token ghp_xxxxx
```

## Quick Start Testing (No API Keys)

You can test many features without any API keys:

### 1. Test the Interactive Wizard

```bash
ralph-starter
```

This launches the wizard - follow the prompts to describe a project and see the AI refinement flow.

### 2. Test Idea Mode

```bash
ralph-starter ideas
```

Choose a discovery method and see AI-generated project ideas.

### 3. Test with Public URLs

Fetch specs from any public markdown or HTML page:

```bash
# Public GitHub raw file
ralph-starter run --from https://raw.githubusercontent.com/multivmlabs/ralph-starter/main/README.md

# Public gist
ralph-starter run --from https://gist.githubusercontent.com/user/id/raw/spec.md

# Any public webpage
ralph-starter run --from https://example.com/docs/feature-spec
```

### 4. Test with Local Files

```bash
# Create a simple spec
echo "Build a counter app with React that increments and decrements" > test-spec.md

# Run with local file
ralph-starter run --from ./test-spec.md
```

### 5. Test with PDF Files

```bash
# If you have a PDF spec
ralph-starter run --from ./requirements.pdf
```

---

## GitHub Integration (No API Key Usually Needed)

GitHub uses the `gh` CLI, which doesn't require a separate API key if you're logged in.

### Setup

```bash
# Install GitHub CLI (if not installed)
# macOS
brew install gh

# Linux
sudo apt install gh

# Windows
winget install GitHub.cli
```

### Authenticate

```bash
gh auth login
# Follow prompts to authenticate via browser
```

### Test Connection

```bash
ralph-starter source test github
```

### Test Fetching Issues

```bash
# Preview issues from any public repo
ralph-starter source preview github --project multivmlabs/ralph-starter --limit 5

# Run with a public repo
ralph-starter run --from github --project multivmlabs/ralph-starter --label "enhancement"
```

### Alternative: Personal Access Token

If you prefer not to use `gh`:

1. Go to [GitHub Settings > Developer settings > Personal access tokens](https://github.com/settings/tokens)
2. Click "Generate new token (classic)"
3. Select scopes: `repo` (or just `public_repo` for public repos)
4. Copy the token

```bash
ralph-starter config set github.token ghp_xxxxxxxxxxxx
ralph-starter source test github
```

---

## Linear Integration

### Get Your API Key

1. Go to [linear.app/settings/api](https://linear.app/settings/api)
2. Click "Create key" under "Personal API keys"
3. Name it "ralph-starter"
4. Copy the key (starts with `lin_api_`)

### Configure

```bash
ralph-starter config set linear.apiKey lin_api_xxxxxxxxxxxx
```

### Test Connection

```bash
ralph-starter source test linear
```

### Test Fetching Issues

```bash
# Preview issues
ralph-starter source preview linear --limit 5

# Filter by label
ralph-starter source preview linear --label "bug" --limit 3

# Filter by project
ralph-starter source preview linear --project "My Project"
```

### Create a Test Issue

In Linear:
1. Create a new issue with detailed description
2. Add a label like "ralph-test"

```bash
ralph-starter run --from linear --label "ralph-test"
```

---

## Notion Integration

Notion requires a few more steps because you need to create an integration and share pages with it.

### 1. Create an Integration

1. Go to [notion.so/my-integrations](https://www.notion.so/my-integrations)
2. Click "New integration"
3. Fill in:
   - Name: "ralph-starter"
   - Associated workspace: Select your workspace
   - Capabilities: Read content, Read user information
4. Click "Submit"
5. Copy the "Internal Integration Secret" (starts with `secret_`)

### 2. Configure ralph-starter

```bash
ralph-starter config set notion.token secret_xxxxxxxxxxxx
```

### 3. Share Pages with the Integration

**This step is required!** Notion integrations can only access pages explicitly shared with them.

1. Open the Notion page or database you want to use
2. Click the "..." menu in the top right
3. Click "Add connections"
4. Search for "ralph-starter" and select it
5. Click "Confirm"

### Test Connection

```bash
ralph-starter source test notion
```

### Test Fetching Pages

```bash
# Preview pages from a database
ralph-starter source preview notion --project "My Database Name" --limit 5
```

### Create a Test Page

1. Create a new page in a database shared with ralph-starter
2. Add content like:
   ```markdown
   Build a simple blog with Next.js

   Features:
   - List blog posts
   - View single post
   - Markdown support
   ```
3. Fetch it:
   ```bash
   ralph-starter run --from notion --project "Your Database Name" --limit 1
   ```

---

## Verifying Your Setup

### Check All Sources

```bash
# List available sources
ralph-starter source list

# Test each configured source
ralph-starter source test github
ralph-starter source test linear
ralph-starter source test notion
```

### View Current Config

```bash
ralph-starter config list
```

### Check Specific Config

```bash
ralph-starter config get linear
ralph-starter config get notion
ralph-starter config get github
```

---

## Troubleshooting

### "Source test failed"

1. Verify your API key is correct
2. Check the key hasn't expired
3. Ensure you have the right permissions

```bash
# Re-enter the API key
ralph-starter config set linear.apiKey <new-key>
```

### "No items found"

1. For Linear: Make sure you have issues matching your filter
2. For Notion: Ensure the page/database is shared with your integration
3. For GitHub: Check the repo exists and you have access

### "Authentication failed" for Notion

Notion is strict about sharing. Make sure:
1. The integration exists in your workspace
2. You've clicked "Add connections" on the specific page/database
3. You've refreshed the page after adding the connection

### Config file location

All credentials are stored in:
```
~/.ralph-starter/sources.json
```

You can manually edit this file if needed.

---

## Security Notes

1. **API keys are stored locally** in `~/.ralph-starter/sources.json`
2. **Never commit** this file to version control
3. **Use read-only tokens** when possible
4. **Revoke unused tokens** periodically

### Removing Credentials

```bash
# Remove a specific key
ralph-starter config delete linear.apiKey

# Remove all config for a source
ralph-starter config delete linear
```

---

## Testing the Full Workflow

Once integrations are set up, test the full workflow:

```bash
# 1. Initialize a new project
mkdir test-project && cd test-project
git init

# 2. Fetch a spec from your favorite source
ralph-starter run --from linear --label "ralph-test" --commit

# 3. Watch the magic happen!
```

Or use the wizard:
```bash
ralph-starter
# Follow prompts...
```
