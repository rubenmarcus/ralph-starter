---
sidebar_position: 2
title: Idea Mode
description: Brainstorm project ideas when you don't know what to build
keywords: [brainstorm, ideas, creativity, project discovery]
---

# Idea Mode

**Idea Mode** is for users who don't know what to build. It's a brainstorming session that helps you discover project ideas based on your preferences.

## Launch Idea Mode

Standalone:

```bash
ralph-starter ideas
```

Or through the wizard (select "No, help me brainstorm ideas").

## Discovery Methods

### 1. Brainstorm with AI

Open-ended creative suggestions. The AI generates diverse project ideas across different types and complexity levels.

**Best for:** When you want to explore possibilities without constraints.

### 2. Trending Ideas

Ideas based on 2025-2026 technology trends:

- AI/LLM integrations and tooling
- Local-first and privacy-focused apps
- Developer productivity tools
- Sustainable/green tech applications
- Accessibility and inclusive design

**Best for:** Building something relevant and timely.

### 3. Based on My Skills

Personalized ideas that:

- Build on your existing skills
- Introduce adjacent technologies
- Could become portfolio pieces

You'll be asked to select technologies you know:
- JavaScript/TypeScript
- React
- Node.js
- Python
- Go, Rust, etc.

**Best for:** Leveraging what you already know.

### 4. Solve a Problem

Describe a frustration or pain point, and get project ideas that could solve it.

Example problems:
- "I spend too much time organizing my notes"
- "Managing dotfiles is painful"
- "I can't find things in my bookmarks"

**Best for:** Building something personally useful.

## Example Session

```
$ ralph-starter ideas

  ╭─────────────────────────────────────────────────────────────╮
  │   Let's discover what to build!                             │
  │   Don't have a project idea? No problem.                    │
  │   I'll help you brainstorm something awesome.               │
  ╰─────────────────────────────────────────────────────────────╯

? How would you like to discover ideas?
❯ Brainstorm with AI - Get creative suggestions
  See trending ideas - Based on 2025-2026 tech trends
  Based on my skills - Personalized to what I know
  Solve a problem I have - Help me fix something

✔ Got some ideas!

  Here are some ideas for you:
  ────────────────────────────────────────────────────────────

  1. Personal Finance Tracker
     Track expenses, set budgets, and visualize spending patterns
     Type: Web App  |  Difficulty: moderate
     Why: Practical everyday use

  2. Markdown Note Organizer
     CLI tool to organize, search, and link markdown notes
     Type: CLI Tool  |  Difficulty: easy
     Why: Simple to start, can grow in complexity

  3. API Status Dashboard
     Monitor multiple API endpoints and get alerts when they go down
     Type: Web App  |  Difficulty: moderate
     Why: Useful for developers

  4. Git Commit Analyzer
     Analyze git history to show contribution patterns and stats
     Type: CLI Tool  |  Difficulty: easy
     Why: Work with familiar tools

  5. Recipe API
     RESTful API for storing and retrieving recipes
     Type: API  |  Difficulty: easy
     Why: Classic CRUD project

  ────────────────────────────────────────────────────────────

? Which idea interests you?
❯ Personal Finance Tracker - Track expenses, set budgets...
  Markdown Note Organizer - CLI tool to organize, search...
  API Status Dashboard - Monitor multiple API endpoints...
  Git Commit Analyzer - Analyze git history to show...
  Recipe API - RESTful API for storing and retrieving...
  None of these - I'll describe my own idea
  Generate more ideas
```

## Idea Properties

Each generated idea includes:

| Property | Description |
|----------|-------------|
| **Title** | Short, memorable project name |
| **Description** | One sentence about what it does |
| **Project Type** | web, api, cli, mobile, library, automation |
| **Difficulty** | easy, moderate, challenging |
| **Reasons** | Why this is a good project to build |

## Offline Fallback

If no LLM is available (no API key and no coding agent), Idea Mode uses 20 pre-built template ideas across all discovery methods.

## After Selecting an Idea

Once you select an idea:
- The idea is passed to the wizard
- The AI refines it further
- You can customize the tech stack and features
- Building begins

Or select "None of these - I'll describe my own idea" to enter a custom description.
