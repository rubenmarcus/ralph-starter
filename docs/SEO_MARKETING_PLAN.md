# ralph-starter SEO & Marketing Strategy

> Last updated: February 2026 | v0.2.0 release

---

## Table of Contents

1. [Current SEO Audit](#part-1-current-seo-audit)
2. [Keyword Strategy (4 Tiers)](#part-2-keyword-strategy)
3. [Full Article Roadmap (35+ Articles)](#part-3-full-article-roadmap)
4. [Twitter Strategy](#part-4-twitter-strategy)
5. [LinkedIn Strategy](#part-5-linkedin-strategy)
6. [Backlink & Distribution](#part-6-backlink--distribution-strategy)
7. [Priority Actions](#part-7-priority-action-table)

---

## Part 1: Current SEO Audit

### What's Already Working

| Area | Status | Details |
|------|--------|---------|
| Structured Data (JSON-LD) | Good | SoftwareApplication, Organization, WebSite, TechArticle schemas |
| Open Graph & Twitter Cards | Good | og:type, og:image, twitter:card configured on homepage |
| AI Crawler Optimization | Excellent | robots.txt allows GPTBot, ClaudeBot, PerplexityBot, Bingbot, 8+ AI crawlers |
| LLM Discoverability | Excellent | llms.txt, llms-full.txt, docs.json, ai-index.json, sidebar.json, docs-urls.txt |
| Doc Page Frontmatter | Good | All 39 doc pages have title, description, keywords |
| Sitemap | Good | Docusaurus sitemap plugin, daily changefreq, 0.7 priority |
| Google Analytics | Good | G-4HSM6GRG3R with IP anonymization |
| CORS & Headers | Good | _headers file with proper Content-Type for markdown/JSON |
| Brand Search | Good | #1 for "ralph-starter", "ralphstarter" |

### Critical Issues

| Issue | Impact | Fix |
|-------|--------|-----|
| **Blog is DISABLED** | HIGH | 4 blog posts exist in `docs/blog/` but `blog: false` in docusaurus.config.ts. Content is written but not indexed. |
| **Not in any roundup articles** | HIGH | ralph-starter is missing from ALL major "best AI coding tools 2026" lists |
| **No community backlinks** | HIGH | 20+ Medium articles about Ralph loops don't mention ralph-starter |
| **No v0.2.0 blog post** | MEDIUM | Latest blog post is v0.1.0 release from January |
| **No canonical URLs** | MEDIUM | Risk of duplicate content across docs/blog |
| **No per-page OG images** | LOW | Only global thumbnail.png, no unique images per section |
| **No FAQ schema** | LOW | FAQ page exists but lacks FAQ structured data |
| **No last_update dates** | LOW | Doc frontmatter missing freshness signals |

### Quick Config Fixes (< 30 min total)

1. **Enable blog**: Change `blog: false` to proper blog config in `docs/docusaurus.config.ts`
2. **Add canonical plugin**: Install `@docusaurus/plugin-canonical`
3. **Add FAQ schema**: Add JSON-LD FAQ markup to `docs/docs/faq.md`
4. **Add last_update**: Add `last_update.date` to high-traffic doc pages
5. **Create v0.2.0 blog post**: Announce the stable release

---

## Part 2: Keyword Strategy

### Tier 1 -- Brand Keywords (Defend Position)

These are queries where people are already looking for ralph-starter specifically.

| Keyword | Current Rank | Goal | Action |
|---------|-------------|------|--------|
| `ralph-starter` | #1 (GitHub), #2 (site) | Maintain #1 | Keep optimizing homepage meta |
| `ralphstarter` | #1 | Maintain | No action needed |
| `ralph-starter AI` | Top 3 | #1 | Add more backlinks |
| `ralphstarter.ai` | #1 | Maintain | No action needed |
| `ralph-starter npm` | Top 5 | #1 | Ensure npm page links back |
| `ralph-starter CLI` | Top 5 | #1 | Covered by docs |
| `ralph-starter docs` | Top 3 | #1 | Covered |
| `ralph-starter v0.2.0` | Unranked | #1 | Publish release blog post |
| `ralph-starter vs aider` | Unranked | #1 | Write comparison article |
| `ralph-starter tutorial` | Unranked | #1 | Write getting-started tutorial |

### Tier 2 -- Ralph Ecosystem Keywords (Capture the Wave)

The Ralph Wiggum technique is trending. These keywords capture people looking for Ralph tooling.

| Keyword | Search Intent | Article Title |
|---------|--------------|---------------|
| `ralph wiggum coding` | Learn about the technique | "What is the Ralph Wiggum Technique? The Complete Guide" |
| `ralph wiggum coding tool` | Find a tool | "ralph-starter: The Complete Ralph Wiggum Tool" |
| `ralph loop tutorial` | How to use it | "How to Run Your First Ralph Loop in 5 Minutes" |
| `ralph wiggum claude code` | Specific pairing | "Ralph Loops + Claude Code: The Complete Setup Guide" |
| `ralph autonomous coding` | General interest | "Autonomous AI Coding with Ralph: From Spec to Production" |
| `ralph coding technique` | Learn the concept | Covered by "What is Ralph Wiggum" article |
| `best ralph wiggum tool` | Comparison shopping | "Best Ralph Wiggum Tools in 2026 (Compared)" |
| `ralph loop github` | Use with GitHub | "Run Ralph Loops from GitHub Issues Automatically" |
| `ralph wiggum setup` | Getting started | "ralph-starter Setup: Zero to Autonomous Coding in 5 Minutes" |
| `ralph loop cost` | Pricing concerns | "How Much Does a Ralph Loop Cost? (With Optimization Tips)" |
| `ralph wiggum cursor` | Use with Cursor | "Ralph Loops with Cursor: Setup and Best Practices" |
| `ralph loop validation` | Quality control | "Validation-Driven Ralph Loops: Let Tests Guide the AI" |
| `ralph wiggum figma` | Design-to-code | "Ralph Loops from Figma Designs: Automated Design Implementation" |
| `ralph loop linear` | Use with Linear | "Process Linear Tickets with Ralph Loops Automatically" |
| `awesome ralph` | Resource discovery | Ensure listed in awesome-ralph repo |

### Tier 3 -- Feature-Specific Long-Tail Keywords

Articles targeting each ralph-starter feature. Low competition, high conversion.

#### Auto Mode
| Keyword | Article Title |
|---------|---------------|
| `AI batch process github issues` | "Turn 10 GitHub Issues Into 10 PRs -- Automatically" |
| `auto mode AI coding` | "Auto Mode: Batch Processing for AI Coding Agents" |
| `AI process linear tickets automatically` | "Auto-Process Linear Tickets with AI: A Complete Guide" |
| `autonomous PR creation AI` | "Zero-Touch PR Creation: Let AI Handle Your Issue Backlog" |

#### Idea Mode
| Keyword | Article Title |
|---------|---------------|
| `AI project idea generator` | "Don't Know What to Build? Let AI Brainstorm Project Ideas" |
| `AI brainstorm coding projects` | "Idea Mode: AI-Powered Project Discovery for Developers" |
| `trending developer project ideas 2026` | "Trending Project Ideas for Developers in 2026" |
| `what to build as a developer` | "What Should You Build Next? AI-Powered Idea Discovery" |

#### GitHub Integration
| Keyword | Article Title |
|---------|---------------|
| `AI code from github issues` | "From GitHub Issue to Working Code: An AI-Powered Workflow" |
| `automate github issue implementation` | "Automate GitHub Issue Implementation with AI Agents" |
| `github issue to PR automation` | "GitHub Issues to PRs: Fully Automated with ralph-starter" |

#### Linear Integration
| Keyword | Article Title |
|---------|---------------|
| `linear ticket automation AI` | "Automate Linear Ticket Implementation with AI" |
| `linear to code AI agent` | "From Linear Ticket to Production Code Automatically" |
| `process linear sprint with AI` | "Let AI Process Your Entire Sprint Backlog" |

#### Notion Integration
| Keyword | Article Title |
|---------|---------------|
| `notion specs to code` | "Turn Notion Docs Into Working Code with AI" |
| `notion project management AI coding` | "Notion + AI Coding: From Spec to Implementation" |

#### Figma Integration
| Keyword | Article Title |
|---------|---------------|
| `figma to code AI tool` | "From Figma to Code: AI-Powered Design Implementation" |
| `figma design tokens extraction` | "Extract Design Tokens from Figma Automatically" |
| `figma component to react AI` | "Figma to React Components: Automated with AI" |
| `figma assets export automation` | "Automate Figma Asset Exports for Your Dev Workflow" |

#### Workflow Presets
| Keyword | Article Title |
|---------|---------------|
| `AI test driven development workflow` | "TDD with AI: The Red-Green-Refactor Loop, Automated" |
| `AI code review CLI tool` | "Adversarial Code Review: AI Security Audits from Your Terminal" |
| `AI debugging workflow tool` | "AI Debugging Preset: Step-by-Step Bug Hunting with AI" |
| `AI documentation generator` | "Documentation-First Development with AI Agents" |
| `AI API design tool` | "AI-Powered API Design: From Spec to Endpoints" |
| `safe database migration AI` | "Migration Safety: AI-Assisted Database Migrations" |
| `AI performance optimization tool` | "Performance Optimization with AI: Profile, Analyze, Fix" |
| `AI incident response tool` | "Incident Response Preset: Fix Production Bugs Fast with AI" |
| `AI code archaeology` | "Code Archaeology: Let AI Document Your Legacy Codebase" |
| `AI refactoring tool CLI` | "Safe AI Refactoring: Automated with Validation Guardrails" |

#### MCP Server
| Keyword | Article Title |
|---------|---------------|
| `ralph MCP server claude desktop` | "Use ralph-starter Inside Claude Desktop with MCP" |
| `MCP server coding tool` | "MCP Server for AI Coding: Connect ralph-starter to Claude Desktop" |
| `claude desktop coding automation` | "Automate Coding Tasks in Claude Desktop with MCP Tools" |

#### Skills System
| Keyword | Article Title |
|---------|---------------|
| `AI coding agent skills` | "The Skills System: Teach Your AI Agent New Tricks" |
| `custom AI coding workflows` | "Build Custom AI Coding Workflows with Skills" |
| `shared AI agent skills` | "Share AI Agent Skills Across Your Team" |

#### PRD Workflow
| Keyword | Article Title |
|---------|---------------|
| `PRD to code AI` | "PRD Workflow: From Product Requirements to Working Code" |
| `implementation plan AI coding` | "AI Implementation Plans: Structured Task Execution" |
| `spec driven development tool` | "Spec-Driven Development: The Future of AI-Assisted Coding" |

#### Cost Tracking & Optimization
| Keyword | Article Title |
|---------|---------------|
| `AI coding cost tracking` | "Track and Optimize Your AI Coding Costs in Real Time" |
| `reduce AI API costs coding` | "How to Cut AI Coding Costs by 90% with Prompt Caching" |
| `anthropic batch API coding` | "Batch API: 50% Cost Reduction for AI Coding Tasks" |
| `cheap AI coding agent` | "The Most Cost-Effective Way to Run AI Coding Loops" |

#### Circuit Breaker & Safety
| Keyword | Article Title |
|---------|---------------|
| `AI coding loop safety` | "Circuit Breakers: Preventing Runaway AI Coding Loops" |
| `AI coding rate limiting` | "Rate Limiting AI Agents: Control Costs and API Usage" |
| `AI coding guardrails` | "Guardrails for Autonomous AI Coding: Best Practices" |

#### Git Automation
| Keyword | Article Title |
|---------|---------------|
| `AI auto commit code` | "Auto-Commit: Let AI Handle Your Git Workflow" |
| `AI create pull requests automatically` | "Automatic PR Creation: From AI Code to Review-Ready PRs" |
| `AI git workflow automation` | "The Complete Guide to AI-Powered Git Workflows" |

#### Validation & Testing
| Keyword | Article Title |
|---------|---------------|
| `AI coding with test validation` | "Validation-Driven AI Development: Tests as Guardrails" |
| `AI run tests after coding` | "Backpressure: Run Tests After Every AI Iteration" |
| `AI coding quality assurance` | "QA for AI-Generated Code: Automated Validation Loops" |

#### Session Management
| Keyword | Article Title |
|---------|---------------|
| `pause resume AI coding session` | "Pause & Resume: Long-Running AI Coding Sessions" |
| `AI coding session management` | "Managing Multi-Hour AI Coding Sessions" |

#### Context Windowing
| Keyword | Article Title |
|---------|---------------|
| `AI coding context optimization` | "Smart Context Windowing: How ralph-starter Manages Token Budgets" |
| `reduce AI token usage coding` | "Token Optimization: Get More AI Coding for Less" |

#### Multi-Agent Support
| Keyword | Article Title |
|---------|---------------|
| `best AI coding agent 2026` | "8 AI Coding Agents Compared: Which Works Best with ralph-starter?" |
| `claude code vs cursor vs copilot CLI` | "CLI Coding Agents Compared: Claude Code, Cursor, Copilot, and More" |
| `switch AI coding agents` | "Agent-Agnostic AI Loops: Switch Between Claude, Cursor, and Copilot" |

#### Templates
| Keyword | Article Title |
|---------|---------------|
| `AI project templates` | "40+ Project Templates: Start Building Faster with AI" |
| `AI coding starter templates` | "ralph-starter Templates: From Blockchain to SEO Tools" |

### Tier 4 -- Generic Search Keywords (Funnel Unaware Traffic)

People searching for solutions to problems ralph-starter solves, without knowing about Ralph.

#### Developer Automation
| Keyword | Search Volume Signal | Article Title | ralph-starter Feature |
|---------|---------------------|---------------|----------------------|
| `how to automate coding tasks` | High | "Automate Your Entire Coding Workflow with One CLI Tool" | Core loop |
| `automate pull requests with AI` | High | "Automated PR Creation: AI That Opens Pull Requests for You" | --pr flag |
| `automate github issues to code` | Medium | "Turn GitHub Issues Into Working Code Automatically" | GitHub integration |
| `AI that writes code from tickets` | Medium | "From Ticket to Code: AI Agents That Implement Your Backlog" | Auto mode |
| `automate software development` | High | "The Developer's Guide to Automating Software Development in 2026" | All features |
| `AI developer productivity tools 2026` | High | "10 Ways AI Boosts Developer Productivity in 2026" | All features |
| `autonomous software development` | Medium | "What Autonomous Software Development Actually Looks Like in 2026" | Core concept |

#### AI Coding Workflow
| Keyword | Article Title | ralph-starter Feature |
|---------|---------------|----------------------|
| `AI coding workflow 2026` | "The Complete AI Coding Workflow for 2026" | All features |
| `how to use AI for coding effectively` | "Beyond Autocomplete: Using AI as an Autonomous Coding Agent" | Core loop |
| `AI pair programming CLI` | "AI Pair Programming from the Terminal: A Practical Guide" | Core loop + agents |
| `agentic coding tutorial` | "Getting Started with Agentic Coding: A Hands-On Tutorial" | Core loop |
| `AI coding best practices` | "AI Coding Best Practices: Validation, Cost Control, and Safety" | Validation + circuit breaker |
| `vibe coding tool` | "Beyond Vibe Coding: Structured AI Development with Specs" | Spec-driven workflow |

#### Spec & Design to Code
| Keyword | Article Title | ralph-starter Feature |
|---------|---------------|----------------------|
| `figma to code tool 2026` | "Best Figma-to-Code Tools in 2026 (Including AI-Powered)" | Figma integration |
| `design to code automation` | "Automated Design-to-Code: From Figma to Production" | Figma integration |
| `convert design to code AI` | "How AI Converts Designs to Code: A Practical Walkthrough" | Figma integration |
| `notion to code` | "Notion as a Spec Source: Build Code from Your Docs" | Notion integration |
| `product requirements to code` | "From PRD to Production: AI-Powered Spec Implementation" | PRD workflow |
| `write code from specifications` | "Spec-Driven Development: Let AI Build What You Specify" | Spec-driven workflow |

#### Project Management Automation
| Keyword | Article Title | ralph-starter Feature |
|---------|---------------|----------------------|
| `linear ticket automation tools` | "Automate Linear Ticket Implementation: Tools Compared" | Linear integration |
| `github issue automation tools` | "Best GitHub Issue Automation Tools for Developers in 2026" | GitHub integration |
| `AI project management for developers` | "AI-Powered Project Execution: From Issue Tracker to Code" | All integrations |
| `automate sprint backlog` | "Automate Your Sprint Backlog with AI Coding Agents" | Auto mode |
| `AI process development tasks` | "Batch Process Development Tasks with AI: A Real-World Guide" | Auto mode |

#### Cost & Efficiency
| Keyword | Article Title | ralph-starter Feature |
|---------|---------------|----------------------|
| `AI coding cost comparison` | "How Much Does AI Coding Really Cost? A Breakdown" | Cost tracking |
| `reduce claude API costs` | "5 Ways to Reduce Your Claude API Costs for Coding" | Prompt caching + batch |
| `cheap AI coding solution` | "AI Coding on a Budget: Optimize Costs Without Sacrificing Quality" | Batch API + context windowing |
| `prompt caching for developers` | "Prompt Caching Explained: Save 90% on AI Coding Costs" | Prompt caching |
| `anthropic batch API tutorial` | "Anthropic Batch API for Coding: 50% Cheaper AI Development" | Batch API |

#### Testing & Quality
| Keyword | Article Title | ralph-starter Feature |
|---------|---------------|----------------------|
| `AI test driven development` | "TDD with AI Agents: Write Tests, AI Writes Code" | TDD preset |
| `AI code review tool CLI` | "CLI-Based AI Code Review: Security Audits from Your Terminal" | Review presets |
| `validate AI generated code` | "How to Validate AI-Generated Code: Automated Testing Strategies" | Validation system |
| `AI security code review` | "AI-Powered Security Reviews: OWASP Audits on Autopilot" | Adversarial review preset |
| `test AI written code` | "Testing AI-Written Code: Automated Quality Gates" | Validation backpressure |

#### Documentation & Legacy Code
| Keyword | Article Title | ralph-starter Feature |
|---------|---------------|----------------------|
| `AI documentation generation tool` | "Generate Documentation with AI: Automated and Accurate" | Docs preset |
| `document legacy code with AI` | "Code Archaeology: Use AI to Document Your Legacy Codebase" | Code archaeology preset |
| `AI generate API docs` | "Auto-Generate API Documentation with AI Coding Agents" | Docs preset + API design |

#### Debugging & Incident Response
| Keyword | Article Title | ralph-starter Feature |
|---------|---------------|----------------------|
| `AI debugging tool 2026` | "AI Debugging: Let AI Step Through Your Code" | Debug preset |
| `AI fix production bugs` | "Incident Response with AI: Fix Production Bugs in Minutes" | Incident response preset |
| `AI automated bug fixing` | "Automated Bug Fixing: AI Agents That Debug for You" | Debug preset + validation |

#### Comparisons & Alternatives
| Keyword | Article Title | ralph-starter Feature |
|---------|---------------|----------------------|
| `best CLI AI coding tool 2026` | "Best CLI AI Coding Tools in 2026: A Developer's Guide" | All features |
| `alternatives to cursor for coding` | "Beyond Cursor: CLI-Based AI Coding Alternatives" | Multi-agent |
| `aider alternatives 2026` | "Aider Alternatives: 5 AI Coding Tools Worth Trying" | Core loop |
| `github copilot CLI alternatives` | "GitHub Copilot CLI Alternatives for Autonomous Coding" | Multi-agent |
| `AI coding tool with integrations` | "The Only AI Coding Tool with GitHub, Linear, Notion, and Figma" | All integrations |
| `AI coding tool with test validation` | "AI Coding Tools That Actually Run Your Tests" | Validation system |

---

## Part 3: Full Article Roadmap

### Phase 1: Publish Immediately (Week 1)

#### Article 1: "What is the Ralph Wiggum Technique? The Complete Guide to AI Coding Loops"
- **Priority:** CRITICAL -- captures trending traffic
- **Target keywords:** `ralph wiggum coding`, `ralph loop explained`, `ralph wiggum technique`, `ralph coding pattern`
- **Format:** Evergreen guide, 2000 words
- **Sections:** What is it, History, How it works, Best practices, Tools (featuring ralph-starter), Getting started
- **Cross-post:** Medium (Dev Genius or Coding Nexus), dev.to, Hashnode
- **Distribution:** Submit to HN, Reddit r/ClaudeAI, r/programming

#### Article 2: "ralph-starter v0.2.0: From Beta to Stable"
- **Priority:** HIGH -- timely release announcement
- **Target keywords:** `ralph-starter v0.2.0`, `ralph-starter release`, `ralph-starter update`
- **Format:** Release post, 800 words
- **Sections:** What's new (auto mode, idea mode, 16 presets, cost savings, CLI improvements), Migration guide, What's next
- **Cross-post:** dev.to
- **Distribution:** Twitter, LinkedIn, npm package description update

#### Article 3: "Turn 10 GitHub Issues Into 10 PRs -- Automatically"
- **Priority:** HIGH -- most viral-worthy feature
- **Target keywords:** `AI batch process github issues`, `automate github issues to code`, `autonomous PR creation`
- **Format:** Tutorial with screen recordings, 1200 words
- **Sections:** The problem, Demo walkthrough, Setup guide, Cost breakdown, Results
- **Cross-post:** Medium, dev.to
- **Distribution:** Twitter thread, LinkedIn post, HN

### Phase 2: Publish Within 2 Weeks (Week 2-3)

#### Article 4: "How to Run Your First Ralph Loop in 5 Minutes"
- **Target keywords:** `ralph loop tutorial`, `ralph wiggum setup`, `ralph-starter tutorial`
- **Format:** Quick-start tutorial, 800 words
- **Sections:** Install, First command, Understanding output, Next steps

#### Article 5: "Spec-Driven Development: From GitHub Issues to Production Code"
- **Target keywords:** `spec driven development`, `AI coding from specs`, `write code from specifications`
- **Format:** Thought leadership + tutorial, 1500 words
- **Cross-post:** Medium (Coding Nexus), dev.to

#### Article 6: "How to Cut AI Coding Costs by 90% with Prompt Caching and Batch API"
- **Target keywords:** `reduce AI API costs`, `prompt caching for developers`, `anthropic batch API tutorial`
- **Format:** Data-driven guide with cost comparisons, 1200 words
- **Cross-post:** Medium, dev.to

#### Article 7: "TDD with AI Agents: The Red-Green-Refactor Loop, Automated"
- **Target keywords:** `AI test driven development`, `TDD AI coding`, `AI pair programming`
- **Format:** Tutorial, 1200 words
- **Sections:** TDD preset setup, Demo, How validation backpressure works, Results

#### Article 8: "From Figma to Code: AI-Powered Design Implementation"
- **Target keywords:** `figma to code AI tool`, `design to code automation`, `figma to react AI`
- **Format:** Tutorial with before/after screenshots, 1500 words
- **Sections:** 5 Figma modes, Token extraction, Component generation, Asset export

### Phase 3: Weekly Cadence (Month 1-2)

#### Article 9: "The Complete AI Coding Workflow for 2026"
- **Target keywords:** `AI coding workflow 2026`, `agentic coding tutorial`, `AI developer productivity`
- **Format:** Comprehensive guide, 2000 words
- **Goal:** Rank for broad "AI coding" queries and funnel to ralph-starter

#### Article 10: "ralph-starter vs Aider: A Developer's Honest Comparison"
- **Target keywords:** `ralph vs aider`, `aider alternatives`, `best ralph wiggum tool`
- **Format:** Comparison, 1500 words
- **Approach:** Be honest about trade-offs. Aider = lightweight pair programming. ralph-starter = full autonomous pipeline with integrations.

#### Article 11: "19 Workflow Presets for AI Coding: TDD, Debugging, Security, and More"
- **Target keywords:** `AI coding workflow`, `AI code review CLI`, `AI debugging workflow`
- **Format:** Showcase/catalog, 1800 words
- **Sections:** One section per preset category with use cases and examples

#### Article 12: "Automate Your Sprint Backlog: AI Processes Linear Tickets While You Sleep"
- **Target keywords:** `linear ticket automation`, `automate sprint backlog`, `AI process development tasks`
- **Format:** Case study style, 1200 words

#### Article 13: "AI-Powered Security Reviews: OWASP Audits from Your Terminal"
- **Target keywords:** `AI security code review`, `AI code review tool CLI`, `adversarial code review`
- **Format:** Tutorial, 1200 words
- **Sections:** Adversarial review preset, What it checks, Demo, Findings

#### Article 14: "Use ralph-starter Inside Claude Desktop with MCP"
- **Target keywords:** `MCP server coding tool`, `claude desktop coding automation`, `ralph MCP server`
- **Format:** Setup guide, 800 words

#### Article 15: "Circuit Breakers for AI Coding: Preventing Runaway Loops"
- **Target keywords:** `AI coding loop safety`, `AI coding guardrails`, `AI coding rate limiting`
- **Format:** Best practices guide, 1000 words

#### Article 16: "The Skills System: Teach Your AI Agent New Tricks"
- **Target keywords:** `AI coding agent skills`, `custom AI coding workflows`
- **Format:** Tutorial + showcase, 1200 words

### Phase 4: Ongoing Monthly Content (Month 2+)

#### Article 17: "Code Archaeology: Use AI to Document Your Legacy Codebase"
- **Target keywords:** `document legacy code with AI`, `AI code archaeology`
- **Format:** Case study, 1200 words

#### Article 18: "Incident Response with AI: Fix Production Bugs in Minutes"
- **Target keywords:** `AI fix production bugs`, `AI incident response tool`
- **Format:** Scenario walkthrough, 1000 words

#### Article 19: "40+ Project Templates: Start Building Faster with AI"
- **Target keywords:** `AI project templates`, `AI coding starter templates`
- **Format:** Catalog/showcase, 1500 words

#### Article 20: "PRD Workflow: From Product Requirements to Working Code"
- **Target keywords:** `PRD to code AI`, `product requirements to code`
- **Format:** Guide, 1200 words

#### Article 21: "Notion as a Spec Source: Build Code from Your Docs"
- **Target keywords:** `notion to code`, `notion specs to code`
- **Format:** Tutorial, 1000 words

#### Article 22: "8 AI Coding Agents Compared: Which Works Best?"
- **Target keywords:** `best AI coding agent 2026`, `claude code vs cursor vs copilot CLI`
- **Format:** Comparison, 2000 words
- **Agents:** Claude Code, Cursor, Copilot, Gemini CLI, Aider, OpenCode, Amp, Openclaw

#### Article 23: "Auto-Commit and PR Creation: Let AI Handle Your Git Workflow"
- **Target keywords:** `AI auto commit code`, `AI git workflow automation`
- **Format:** Tutorial, 1000 words

#### Article 24: "Validation-Driven AI Development: Tests as Guardrails"
- **Target keywords:** `validate AI generated code`, `test AI written code`, `AI coding quality`
- **Format:** Best practices, 1200 words

#### Article 25: "Smart Context Windowing: How to Optimize Token Usage in AI Loops"
- **Target keywords:** `reduce AI token usage`, `AI coding context optimization`
- **Format:** Technical deep-dive, 1000 words

#### Article 26: "Pause & Resume: Managing Long-Running AI Coding Sessions"
- **Target keywords:** `pause resume AI coding`, `AI coding session management`
- **Format:** Feature guide, 800 words

#### Article 27: "Documentation-First Development: Write Docs Before Code with AI"
- **Target keywords:** `AI documentation generation`, `documentation first development`
- **Format:** Methodology guide, 1200 words

#### Article 28: "Safe AI Refactoring: Automated with Validation Guardrails"
- **Target keywords:** `AI refactoring tool`, `safe code refactoring AI`
- **Format:** Tutorial, 1000 words

#### Article 29: "Extract Design Tokens from Figma Automatically"
- **Target keywords:** `figma design tokens extraction`, `design tokens automation`
- **Format:** Technical tutorial, 1000 words

#### Article 30: "The Only AI Coding Tool with GitHub, Linear, Notion, and Figma"
- **Target keywords:** `AI coding tool with integrations`, `all-in-one AI coding`
- **Format:** Feature showcase, 1500 words

#### Article 31: "API Design with AI: From Spec to Endpoints"
- **Target keywords:** `AI API design tool`, `API design automation`
- **Format:** Tutorial, 1200 words

#### Article 32: "Migration Safety: AI-Assisted Database Migrations"
- **Target keywords:** `safe database migration AI`, `AI database migration`
- **Format:** Guide with safety considerations, 1000 words

#### Article 33: "Performance Optimization with AI: Profile, Analyze, Fix"
- **Target keywords:** `AI performance optimization tool`, `AI code performance`
- **Format:** Tutorial, 1200 words

#### Article 34: "Beyond Cursor: CLI-Based AI Coding Alternatives"
- **Target keywords:** `alternatives to cursor`, `CLI AI coding tools`
- **Format:** Comparison, 1500 words

#### Article 35: "How Much Does AI Coding Really Cost? A Full Breakdown"
- **Target keywords:** `AI coding cost comparison`, `AI coding pricing`
- **Format:** Data-driven analysis, 1500 words
- **Include:** Cost per feature, cost per PR, cost per iteration, optimization tips

---

## Part 4: Twitter Strategy (@ralphstarter)

### Content Pillars (Rotate Weekly)

| Day | Pillar | Format | Example |
|-----|--------|--------|---------|
| Mon | Feature demo | Video tweet (30-60s) | Screen recording of auto mode |
| Tue | Tip / trick | Text + code snippet | "TIL you can --validate to run tests after every iteration" |
| Wed | Community | RT + comment | RT a Ralph Wiggum article with helpful context |
| Thu | Behind the scenes | Text + screenshot | "Working on Figma integration improvements" |
| Fri | Thought leadership | Thread (3-5 tweets) | "The future of coding is writing specs, not code" |

### Tweet Templates That Perform Well

**Feature demos:**
```
[Feature name] in ralph-starter:

[One command]

[What it does in 2-3 lines]

[Video]
```

**Before/After:**
```
Before ralph-starter:
- Read issue
- Create branch
- Write code
- Run tests
- Fix failures
- Commit
- Open PR

After ralph-starter:
ralph-starter run --from github --issue 42 --commit --pr

[Video]
```

**One-liner impact:**
```
One command. 10 issues. 10 PRs. Zero babysitting.

ralph-starter auto --source github --project org/repo --label ready

[Video]
```

**Quick tips:**
```
ralph-starter tip:

Use --preset tdd-red-green to run test-driven development loops.

The AI writes failing tests first, then implements until they pass.

Autonomous TDD.
```

**Engagement bait (genuine):**
```
What's your biggest pain point with AI coding tools?

We're building ralph-starter to solve exactly this:
- Specs from GitHub/Linear/Notion/Figma
- Autonomous loops with validation
- Auto-commit and PR creation

What would you add?
```

### Hashtags

Primary: `#RalphWiggum` `#AutonomousCoding` `#AIDevTools`
Secondary: `#ClaudeCode` `#VibeCoding` `#AgenticCoding` `#DevTools`
Trending: `#AI` `#CodingWithAI` `#BuildInPublic`

### Engagement Playbook

1. **Monitor and reply** to every tweet mentioning "ralph wiggum", "ralph loop", "autonomous coding loop"
2. **Quote-tweet** Medium articles about Ralph loops with a ralph-starter demo
3. **Engage with influencers**: Addy Osmani, AI dev tool creators, Claude/Anthropic accounts
4. **Reply on awesome-ralph** repo issues/PRs with helpful context
5. **Post during peak hours**: 10am-12pm and 2pm-4pm EST, Tuesday-Thursday
6. **Thread on blog post days**: Every blog post gets a Twitter thread summarizing it
7. **Pin tweet**: Keep the best demo video or thread pinned

### Accounts to Engage With

- @anthropaborad (Anthropic)
- @addyosmani (AI coding workflow influencer)
- @aikiinc (AI dev tools)
- @cursor_ai (competitor -- engage respectfully)
- Anyone tweeting about Ralph Wiggum coding

---

## Part 5: LinkedIn Strategy

### Why LinkedIn Matters for ralph-starter

| Metric | Value | Source |
|--------|-------|--------|
| Carousel engagement rate | 24.42% | vs 6.67% for text (4x higher) |
| #1 ranking factor | Dwell time | How long someone reads your post |
| Golden hour | First 90 min | Determines 70% of post's reach |
| Optimal text length | 1,200-1,500 chars | Long enough for value, short enough to keep attention |

### LinkedIn Content Calendar

#### Week 1: Release Announcement

**Text post: "We just shipped ralph-starter v0.2.0"**
```
After months of beta testing, ralph-starter v0.2.0 is stable.

One thing changed our roadmap: watching developers manually copy
GitHub issue descriptions into Claude Code, over and over.

So we built integrations. GitHub. Linear. Notion. Figma.
Your specs live in these tools. Now your AI agent can read them.

v0.2.0 also adds:
- Auto mode: batch-process 10 issues into 10 PRs
- 16 workflow presets (TDD, debugging, security review...)
- 90% cost reduction with prompt caching
- Idea mode for when you don't know what to build

Try it: npm i -g ralph-starter

#AutonomousCoding #AIDevTools #DeveloperProductivity
```

#### Week 2: Auto Mode Showcase

**Carousel: "I Let AI Process 10 GitHub Issues While I Slept"**
- Slide 1: Hook -- "What if your issue backlog solved itself?"
- Slide 2: The problem -- manual issue-to-code workflow
- Slide 3: Auto mode explained (one command)
- Slide 4: Screenshot of PRs being created
- Slide 5: Results -- 10 issues, 10 PRs, cost breakdown
- Slide 6: How it works (diagram)
- Slide 7: Code snippet to try it
- Slide 8: CTA -- "Try ralph-starter"

#### Week 3: Thought Leadership

**Text post: "The future of coding isn't writing code. It's writing specs."**
```
Hot take: In 2026, the most productive developers don't write code.

They write specifications.

Here's why:

AI coding agents can now:
- Read your GitHub issue
- Create a branch
- Write the implementation
- Run your tests
- Fix what breaks
- Open a PR

The bottleneck isn't code generation. It's specification quality.

The developers who write great specs get 10x output from AI.
The ones who write vague one-liners get vague results.

This is the real skill shift. Not "prompt engineering."
It's specification engineering.

We built ralph-starter around this idea: connect your spec sources
(GitHub, Linear, Notion, Figma) and let AI agents do the rest.

What's your experience with spec-driven AI development?

#SpecDrivenDevelopment #AIDevTools #FutureOfCoding
```

#### Week 4: Feature Deep-Dive

**Carousel: "The Evolution of AI Coding: From Autocomplete to Autonomous Loops"**
- Slide 1: 2020 -- Autocomplete (GitHub Copilot)
- Slide 2: 2023 -- Chat-based coding (ChatGPT)
- Slide 3: 2024 -- Agentic coding (Claude Code, Cursor Agent)
- Slide 4: 2025 -- Ralph Wiggum loops (persistent autonomous coding)
- Slide 5: 2026 -- Spec-to-production pipelines (ralph-starter)
- Slide 6: What's different about autonomous loops
- Slide 7: The ralph-starter approach
- Slide 8: CTA

#### Ongoing: Monthly Cadence

| Week | Content Type | Topic |
|------|-------------|-------|
| 1st week | Text post | New feature/update announcement |
| 2nd week | Carousel | Feature deep-dive with screenshots |
| 3rd week | Text post | Thought leadership / opinion |
| 4th week | Carousel | Tutorial or comparison |

### LinkedIn Engagement Tactics

1. **Comment strategy**: Comment on AI coding posts within 60 min of publishing (golden hour)
2. **Tag people**: Tag authors of Ralph-related articles when sharing insights
3. **Groups**: Post in AI Developers, DevOps, Software Architecture LinkedIn groups
4. **Employee amplification**: Have team members share/comment within first hour
5. **Respond to every comment**: Increases dwell time and signals engagement
6. **No links in post body**: LinkedIn deprioritizes external links. Put them in first comment.

---

## Part 6: Backlink & Distribution Strategy

### Priority 1: Get Listed in Roundup Articles

ralph-starter is missing from every major "best AI coding tools" article. Reach out to each author:

| Article | Author/Site | Action |
|---------|-------------|--------|
| [Best AI Coding Agents 2026](https://www.faros.ai/blog/best-ai-coding-agents-2026) | Faros AI | Email: suggest adding ralph-starter as autonomous loop tool |
| [Top 5 CLI Coding Agents](https://pinggy.io/blog/top_cli_based_ai_coding_agents/) | Pinggy | Email: ralph-starter fills a gap (spec integration + autonomous loops) |
| [15 AI Agents Compared](https://www.tembo.io/blog/coding-cli-tools-comparison) | Tembo | Email: offer to provide details for inclusion |
| [Top 8 Open Source AI Coding](https://research.aimultiple.com/open-source-ai-coding/) | AIMultiple | Email: ralph-starter is open source on GitHub |
| [Best AI Coding Agents](https://playcode.io/blog/best-ai-coding-agents-2026) | PlayCode | Email: suggest adding |
| [Agentic CLI Comparison](https://aimultiple.com/agentic-cli) | AIMultiple | Email: ralph-starter wraps these agents with integrations |
| [Best AI Tools for Coding 2026](https://www.builder.io/blog/best-ai-tools-2026) | Builder.io | Email: suggest adding |

**Outreach template:**
```
Subject: ralph-starter -- missing from your AI coding tools roundup

Hi [Name],

Loved your article on [topic]. Noticed ralph-starter isn't listed -- it's an open-source CLI that runs autonomous AI coding loops with integrations to GitHub, Linear, Notion, and Figma.

Key differentiators vs other tools:
- Connects to spec sources (not just manual prompts)
- Auto mode: batch-processes issues into PRs
- 16 workflow presets (TDD, security review, debugging, etc.)
- Works with 8 different AI agents (Claude Code, Cursor, Copilot, etc.)
- Prompt caching + batch API for cost optimization

GitHub: https://github.com/multivmlabs/ralph-starter
Docs: https://ralphstarter.ai
npm: https://www.npmjs.com/package/ralph-starter

Happy to provide any details for inclusion. Thanks!
```

### Priority 2: awesome-ralph

Submit PR to [awesome-ralph](https://github.com/snwfdhmp/awesome-ralph) to list ralph-starter as a primary tool.

**PR description:**
```
Add ralph-starter -- CLI tool for autonomous AI coding loops with
GitHub/Linear/Notion/Figma integrations, 16 workflow presets,
auto mode for batch processing, and multi-agent support.
```

### Priority 3: Cross-Post Blog Content

| Platform | Audience | Best for | Notes |
|----------|----------|----------|-------|
| Medium (Dev Genius) | 200K+ followers | Technical tutorials | Active Ralph content publisher |
| Medium (Coding Nexus) | Growing | Ralph-specific content | Already has ralph-starter article |
| Medium (Vibe Coding) | Growing | AI coding trends | Active Ralph discussions |
| dev.to | Developer community | Tutorials & guides | Good Google indexing, free |
| Hashnode | Developer blogs | Long-form content | Good SEO, developer audience |

**Cross-posting rules:**
- Publish on ralphstarter.ai/blog FIRST (canonical URL)
- Wait 24-48 hours before cross-posting
- Always include canonical link back to original
- Adapt headlines for each platform's audience

### Priority 4: Community Seeding

| Community | What to post | Rules |
|-----------|-------------|-------|
| Hacker News | "What is Ralph Wiggum Technique" article | Show HN format. No self-promotion in comments. |
| Reddit r/ClaudeAI | Feature demos, tutorials | Genuine value first. Disclose you're the creator. |
| Reddit r/ChatGPTCoding | Comparison articles, tutorials | Be helpful, not promotional |
| Reddit r/programming | Thought leadership articles | Technical depth required |
| Reddit r/LocalLLaMA | Cost optimization article | Focus on cost savings angle |
| Discord: Claude Code | Feature announcements | Engage as community member |
| Discord: Cursor | Multi-agent support guide | Show how ralph-starter works with Cursor |

### Priority 5: Influencer Engagement

| Person | Platform | Why | Action |
|--------|----------|-----|--------|
| Addy Osmani | Twitter + Blog | Wrote about AI coding workflows | Comment on his posts, share ralph-starter as tool |
| JP Caparas | Medium (Dev Genius) | Active Ralph content creator | Reach out for collaboration or mention |
| CodeBun | Medium (Coding Nexus) | Wrote "Claude Code + Ralph" article | Suggest ralph-starter for follow-up article |
| awesome-ralph maintainer | GitHub | Curates Ralph resources | Submit PR + engage on issues |

---

## Part 7: Priority Action Table

### Immediate (This Week)

| # | Action | Impact | Effort | Owner |
|---|--------|--------|--------|-------|
| 1 | Enable blog in docusaurus.config.ts | HIGH | 15 min | Dev |
| 2 | Publish v0.2.0 release blog post | HIGH | 1 hour | Marketing |
| 3 | Submit PR to awesome-ralph | MEDIUM | 30 min | Dev |
| 4 | Post v0.2.0 tweet + LinkedIn announcement | HIGH | 30 min | Marketing |

### Week 2

| # | Action | Impact | Effort | Owner |
|---|--------|--------|--------|-------|
| 5 | Write "What is Ralph Wiggum Technique" article | VERY HIGH | 3 hours | Content |
| 6 | Write "10 Issues to 10 PRs" auto mode article | HIGH | 2 hours | Content |
| 7 | Create LinkedIn carousel for auto mode | HIGH | 2 hours | Design |
| 8 | Start Twitter engagement routine (daily) | MEDIUM | 15 min/day | Marketing |

### Week 3-4

| # | Action | Impact | Effort | Owner |
|---|--------|--------|--------|-------|
| 9 | Write "First Ralph Loop in 5 Minutes" tutorial | HIGH | 1 hour | Content |
| 10 | Write "Cut AI Costs by 90%" article | HIGH | 2 hours | Content |
| 11 | Write "TDD with AI Agents" article | MEDIUM | 2 hours | Content |
| 12 | Write "Figma to Code" article | MEDIUM | 2 hours | Content |
| 13 | Email roundup article authors (5 outreach emails) | VERY HIGH | 2 hours | Marketing |
| 14 | Cross-post top articles to Medium + dev.to | MEDIUM | 1 hour each | Content |

### Month 2

| # | Action | Impact | Effort | Owner |
|---|--------|--------|--------|-------|
| 15 | Write comparison article (vs Aider) | HIGH | 3 hours | Content |
| 16 | Write "Complete AI Coding Workflow 2026" | HIGH | 3 hours | Content |
| 17 | Write "19 Workflow Presets" showcase | MEDIUM | 2 hours | Content |
| 18 | Create LinkedIn carousel: "Evolution of AI Coding" | HIGH | 2 hours | Design |
| 19 | Submit to HN, Reddit communities | HIGH | 1 hour | Marketing |
| 20 | Write 4 more feature-specific articles (weekly) | MEDIUM | 2 hours each | Content |

### Ongoing (Monthly)

| Action | Frequency | Owner |
|--------|-----------|-------|
| Publish 4 blog articles | Monthly | Content |
| Cross-post to Medium + dev.to | Per article | Content |
| Twitter: 5 posts/week | Weekly | Marketing |
| LinkedIn: 1 post/week | Weekly | Marketing |
| Monitor and reply to Ralph mentions | Daily | Marketing |
| Email new roundup articles for inclusion | Monthly | Marketing |
| Update keyword rankings and adjust strategy | Monthly | SEO |

---

## Appendix: Feature-to-Article Coverage Matrix

Ensuring every ralph-starter feature has at least one article targeting it.

| Feature | Primary Article | Secondary Article |
|---------|----------------|-------------------|
| Core loop | "First Ralph Loop in 5 Minutes" | "Complete AI Coding Workflow 2026" |
| Auto mode | "10 Issues to 10 PRs" | "Automate Sprint Backlog" |
| Idea mode | "Don't Know What to Build?" | "Trending Project Ideas 2026" |
| GitHub integration | "GitHub Issue to Working Code" | "10 Issues to 10 PRs" |
| Linear integration | "Automate Linear Tickets" | "Automate Sprint Backlog" |
| Notion integration | "Notion as a Spec Source" | "AI Project Management" |
| Figma integration | "Figma to Code" | "Design Tokens Extraction" |
| Figma tokens | "Design Tokens from Figma" | "Figma to Code" |
| Figma components | "Figma to React Components" | "Figma to Code" |
| Figma assets | "Figma Asset Export Automation" | "Figma to Code" |
| TDD preset | "TDD with AI Agents" | "19 Workflow Presets" |
| Debug preset | "AI Debugging" | "19 Workflow Presets" |
| Review preset | "AI Code Review CLI" | "19 Workflow Presets" |
| Adversarial review | "OWASP Audits from Terminal" | "19 Workflow Presets" |
| Docs preset | "AI Documentation Generation" | "19 Workflow Presets" |
| Doc-first preset | "Documentation-First Development" | "19 Workflow Presets" |
| API design preset | "AI API Design" | "19 Workflow Presets" |
| Migration preset | "Safe Database Migration" | "19 Workflow Presets" |
| Performance preset | "Performance Optimization with AI" | "19 Workflow Presets" |
| Incident response | "Fix Production Bugs in Minutes" | "19 Workflow Presets" |
| Code archaeology | "Document Legacy Codebase" | "19 Workflow Presets" |
| Refactor preset | "Safe AI Refactoring" | "19 Workflow Presets" |
| Feature preset | "First Ralph Loop in 5 Minutes" | "Complete AI Coding Workflow" |
| Research preset | "19 Workflow Presets" | -- |
| Gap analysis preset | "19 Workflow Presets" | -- |
| MCP server | "ralph-starter Inside Claude Desktop" | "MCP Server for Coding" |
| Skills system | "Teach Your AI Agent New Tricks" | "Custom AI Coding Workflows" |
| PRD workflow | "PRD to Working Code" | "Spec-Driven Development" |
| Circuit breaker | "Preventing Runaway Loops" | "AI Coding Guardrails" |
| Cost tracking | "Track AI Coding Costs" | "Cut Costs by 90%" |
| Prompt caching | "Cut Costs by 90%" | "Prompt Caching Explained" |
| Batch API | "50% Cost Reduction" | "Cut Costs by 90%" |
| Validation | "Validation-Driven AI Development" | "Tests as Guardrails" |
| Rate limiting | "Rate Limiting AI Agents" | "Preventing Runaway Loops" |
| Git automation | "AI Git Workflow" | "Auto-Commit and PR Creation" |
| Session pause/resume | "Long-Running AI Sessions" | "Session Management" |
| Context windowing | "Smart Context Windowing" | "Token Optimization" |
| Multi-agent support | "8 AI Agents Compared" | "Agent-Agnostic Loops" |
| Templates | "40+ Project Templates" | "Start Building Faster" |
| Wizard | "First Ralph Loop in 5 Minutes" | -- |
| Config/auth | Covered in tutorials | -- |
| Check command | Covered in tutorials | -- |
| Plan command | "PRD to Working Code" | -- |
| Init command | "First Ralph Loop in 5 Minutes" | -- |

**Coverage: 100% of features mapped to articles.**
