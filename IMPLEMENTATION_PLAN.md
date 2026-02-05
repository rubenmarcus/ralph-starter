# Implementation Plan

> ralph-starter development roadmap. Update as tasks complete.

## Completed

### Phase 1: Core Loop Improvements
- [x] Circuit breaker pattern (`src/loop/circuit-breaker.ts`)
- [x] Completion promise support (`--completion-promise`)
- [x] Max iterations with warnings at 80%/90%
- [x] Progress tracking to `activity.md` (`src/loop/progress.ts`)

### Phase 2: Exit Detection
- [x] Semantic response analyzer (`src/loop/semantic-analyzer.ts`)
- [x] File-based completion signals (RALPH_COMPLETE, .ralph-done)
- [x] Dual-condition completion check
- [x] EXIT_SIGNAL support (`--require-exit-signal`)

### Phase 3: Workflow Enhancements
- [x] 16 workflow presets (`src/presets/index.ts`)
- [x] Preset CLI option (`--preset`)

### Phase 4: Rate Limiting & Cost Control
- [x] Rate limiter (`src/loop/rate-limiter.ts`)
- [x] Cost tracker (`src/loop/cost-tracker.ts`)
- [x] Per-iteration cost display
- [x] Cost summary and projections

### Phase 5: Multi-Agent Support
- [x] Claude Code integration (recommended)
- [x] Cursor integration
- [x] OpenCode integration
- [x] OpenAI Codex integration
- [x] GitHub Copilot integration
- [x] Gemini CLI integration
- [x] Amp integration
- [x] Openclaw integration

### Phase 6: Source Integrations
- [x] GitHub integration (issues, PRs, files)
- [x] Linear integration (issues by team/project)
- [x] Notion integration (pages, databases)
- [x] Figma integration (design specs, tokens, assets)
- [x] URL integration (public markdown/HTML)
- [x] Local file integration (markdown, PDF)

### Documentation
- [x] README.md with all features documented
- [x] DEVELOPMENT.md for custom integration guide
- [x] AGENTS.md for AI coding tool context
- [x] CLAUDE.md for Claude Code context
- [x] Cost tracking documentation
- [x] Safety controls documentation

---

## In Progress

### Session Management
- [ ] Create `src/loop/session.ts` for pause/resume support
- [ ] Add `ralph-starter pause` command
- [ ] Add `ralph-starter resume` command
- [ ] Store session state in `.ralph-session.json`

---

## Planned

### Auto Mode (Batch Processing)
- [ ] Add `--auto` flag to run command
- [ ] GitHub batch issue fetcher (fetch multiple issues by label/milestone)
- [ ] Linear batch ticket processor
- [ ] Sequential task execution with validation gates
- [ ] Progress dashboard for batch runs
- [ ] Failure recovery and retry logic

### 5-Phase Spec Generation
- [ ] Create `src/commands/spec.ts`
- [ ] Implement research phase (feasibility analysis)
- [ ] Implement requirements phase (user stories)
- [ ] Implement design phase (architecture)
- [ ] Implement tasks phase (breakdown)

### Knowledge Harvest
- [ ] Create `src/commands/harvest.ts`
- [ ] Extract learnings from `activity.md`
- [ ] Update AGENTS.md with patterns
- [ ] Archive completed tasks

### Enhanced Integrations
- [ ] Playwright MCP integration for visual verification
- [ ] LLM-as-judge tests for subjective criteria
- [ ] Slack integration for notifications
- [ ] Discord integration for notifications

### Developer Experience
- [ ] Add `--dry-run` flag to preview without executing
- [ ] Add `ralph-starter status` command
- [ ] Add `ralph-starter logs` command for activity.md viewer
- [ ] Improve error messages with suggestions
- [ ] Interactive TUI dashboard

---

## Notes

- All features should maintain backwards compatibility
- Run `pnpm build` after every change
- Run `pnpm lint` and `pnpm typecheck` before committing
- Update README.md for user-facing features
- Cost tracker uses estimated tokens (~4 chars/token)
