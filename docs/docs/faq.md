---
sidebar_position: 99
title: FAQ
description: Frequently asked questions about ralph-starter - AI-powered autonomous coding
keywords: [faq, questions, help, troubleshooting, support]
---

# Frequently Asked Questions

## General

### What is ralph-starter?

ralph-starter is a CLI tool that runs autonomous AI coding loops. Give it a task or specification, and it will build production-ready code automatically using Claude Code or other AI coding agents.

### What is Ralph Wiggum?

Ralph Wiggum is a technique for running AI coding agents in autonomous loops until tasks are completed. Instead of prompting back and forth with an AI, you give it a task and let it iterate until done. ralph-starter makes this technique accessible to everyone.

### Do I need to be a developer to use ralph-starter?

No. ralph-starter includes an interactive wizard that guides anyone through creating projects. Just run `ralph-starter` with no arguments and follow the prompts.

### Is ralph-starter free?

ralph-starter is open source and free to use. However, it uses AI APIs (like Anthropic's Claude) which may have associated costs depending on your usage.

---

## Installation

### How do I install ralph-starter?

```bash
npm install -g ralph-starter
```

Or use without installing:

```bash
npx ralph-starter
```

### What are the system requirements?

- Node.js 18 or higher
- npm or yarn
- Git (optional, for version control features)
- Claude Code CLI (for AI coding features)

### How do I update ralph-starter?

```bash
npm update -g ralph-starter
```

---

## Usage

### How do I start a new project?

Run the interactive wizard:

```bash
ralph-starter
```

Or specify a task directly:

```bash
ralph-starter run "build a todo app with React"
```

### What is Idea Mode?

Idea Mode helps you brainstorm project ideas when you don't know what to build:

```bash
ralph-starter ideas
```

It uses AI to generate project suggestions based on your interests, skills, or trending technologies.

### Can I fetch specifications from external tools?

Yes. ralph-starter supports fetching specs from:

- **GitHub Issues**: `ralph-starter run --from github --project owner/repo`
- **Linear**: `ralph-starter run --from linear --label "ready"`
- **Notion**: `ralph-starter run --from notion --project "Specs Database"`
- **URLs**: `ralph-starter run --from https://example.com/spec.md`
- **Local files**: `ralph-starter run --from ./requirements.pdf`

### How do I configure API keys?

Use the config command:

```bash
ralph-starter config set linear.apiKey lin_api_xxxx
ralph-starter config set notion.token secret_xxxx
ralph-starter config set github.token ghp_xxxx
```

Or set environment variables:

```bash
export LINEAR_API_KEY=lin_api_xxxx
export NOTION_API_KEY=secret_xxxx
export GITHUB_TOKEN=ghp_xxxx
```

---

## Integrations

### How do I connect GitHub?

GitHub integration uses the `gh` CLI. If you're logged into `gh`, no additional setup is needed:

```bash
gh auth login
ralph-starter source test github
```

### How do I connect Linear?

1. Get your API key from [linear.app/settings/api](https://linear.app/settings/api)
2. Configure ralph-starter:

```bash
ralph-starter config set linear.apiKey lin_api_xxxx
ralph-starter source test linear
```

### How do I connect Notion?

1. Create an integration at [notion.so/my-integrations](https://www.notion.so/my-integrations)
2. Share your pages/databases with the integration
3. Configure ralph-starter:

```bash
ralph-starter config set notion.token secret_xxxx
ralph-starter source test notion
```

### Can I use public Notion pages without authentication?

Yes. For public Notion pages, use the URL source:

```bash
ralph-starter run --from https://notion.so/Your-Public-Page-abc123
```

Note: Content extraction is limited for public pages since Notion renders client-side.

---

## MCP Server

### What is the MCP server?

ralph-starter can run as an MCP (Model Context Protocol) server, allowing AI assistants like Claude Desktop to use its capabilities directly.

### How do I use ralph-starter with Claude Desktop?

Add this to your Claude Desktop config (`~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "ralph-starter": {
      "command": "npx",
      "args": ["ralph-starter", "mcp"]
    }
  }
}
```

---

## Troubleshooting

### "Command not found: ralph-starter"

Ensure npm global binaries are in your PATH:

```bash
export PATH="$PATH:$(npm config get prefix)/bin"
```

Or use npx instead:

```bash
npx ralph-starter
```

### "Source test failed"

1. Verify your API key is correct
2. Check the key hasn't expired
3. Ensure you have the required permissions

```bash
ralph-starter config set linear.apiKey <new-key>
ralph-starter source test linear
```

### "No items found" when fetching from a source

- **Linear**: Make sure you have issues matching your filter
- **Notion**: Ensure the page/database is shared with your integration
- **GitHub**: Check the repo exists and you have access

### Where are credentials stored?

Credentials are stored in `~/.ralph-starter/sources.json`. This file has user-only permissions (600). Never commit this file to version control.

---

## Contributing

### How can I contribute to ralph-starter?

1. Fork the repository on GitHub
2. Create a feature branch
3. Make your changes
4. Submit a pull request

See the [contributing guide](https://github.com/rubenmarcus/ralph-starter/blob/main/CONTRIBUTING.md) for details.

### How do I report bugs?

Open an issue on GitHub: [github.com/rubenmarcus/ralph-starter/issues](https://github.com/rubenmarcus/ralph-starter/issues)

---

## More Questions?

- Check the [full documentation](/docs/intro)
- Ask on [GitHub Discussions](https://github.com/rubenmarcus/ralph-starter/discussions)
- Open an [issue](https://github.com/rubenmarcus/ralph-starter/issues)
