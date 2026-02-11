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

## Workflow Presets

### What are workflow presets?

Presets are pre-configured sets of loop options for common workflows. Instead of remembering flags like `--max-iterations 30 --validate --commit --circuit-breaker-failures 3`, you can just use `--preset feature`:

```bash
ralph-starter run "add auth" --preset feature
```

ralph-starter ships with 19 built-in presets across 5 categories: development, debugging, review, documentation, and specialized.

### How do I see all available presets?

```bash
ralph-starter presets
```

### Can I create custom presets?

Not yet — presets are currently built-in. Custom user presets are on the roadmap.

---

## Skills

### What are agent skills?

Skills are markdown files that provide domain-specific knowledge to AI agents. For example, a "react-best-practices" skill teaches the agent React patterns. Skills are auto-matched to your project's tech stack.

### How do I install skills?

```bash
ralph-starter skill add vercel-labs/agent-skills
```

Skills are installed to `~/.claude/skills/` (global) or `.claude/skills/` (per-project).

### Where can I find community skills?

```bash
ralph-starter skill browse
```

---

## Cost & Rate Limiting

### How much does ralph-starter cost to run?

ralph-starter itself is free. Costs depend on the AI agent you use and how many iterations your task requires. A typical feature implementation (5-15 iterations with Claude Sonnet) costs approximately $0.10-$1.00 (as of Feb 2026). See the [Cost Tracking](/docs/guides/cost-tracking) guide.

### How do I limit API costs?

Use rate limiting and iteration caps:

```bash
ralph-starter run "add feature" --rate-limit 30 --max-iterations 10
```

### What is the circuit breaker?

The circuit breaker automatically stops the loop when the agent is stuck on the same error. By default it trips after 3 consecutive failures or 5 occurrences of the same error. See [Circuit Breaker](/docs/advanced/circuit-breaker).

---

## Contributing

### How can I contribute to ralph-starter?

1. Fork the repository on GitHub
2. Create a feature branch
3. Make your changes
4. Submit a pull request

See the [contributing guide](https://github.com/multivmlabs/ralph-starter/blob/main/CONTRIBUTING.md) for details.

### How do I report bugs?

Open an issue on GitHub: [github.com/multivmlabs/ralph-starter/issues](https://github.com/multivmlabs/ralph-starter/issues)

---

## More Questions?

- Check the [full documentation](/docs/intro)
- Browse [Templates](https://github.com/multivmlabs/ralph-templates)
- Open an [issue](https://github.com/multivmlabs/ralph-starter/issues)
