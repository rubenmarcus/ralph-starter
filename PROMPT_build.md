# Building Mode

You are in BUILDING mode for ralph-starter development.

## Your Task

Execute tasks from `IMPLEMENTATION_PLAN.md` one at a time.

## Process

1. **Read the plan** - Find next unchecked task in `IMPLEMENTATION_PLAN.md`
2. **Implement** - Make the changes following patterns in `AGENTS.md`
3. **Validate** - Run `pnpm build` to ensure no errors
4. **Mark complete** - Check off the task `[x]`
5. **Repeat** - Move to next task

## Validation After Each Change

```bash
pnpm build
```

If build fails:
1. Read the error message
2. Fix the issue
3. Run build again
4. Only proceed when build passes

## Code Patterns

### Adding CLI Options

```typescript
// In src/cli.ts
.option('--new-flag', 'Description of the flag')

// In src/commands/run.ts - add to RunCommandOptions
newFlag?: boolean;

// Pass to loopOptions
newFlag: options.newFlag,
```

### Adding Loop Features

```typescript
// In src/loop/executor.ts - add to LoopOptions
newFeature?: boolean;

// Use in runLoop function
if (options.newFeature) {
  // implementation
}
```

### Adding New Module

```typescript
// Create src/loop/new-module.ts
export interface NewModuleConfig { ... }
export class NewModule { ... }

// Import in executor.ts
import { NewModule } from './new-module.js';
```

## Rules

- One task at a time
- Run `pnpm build` after each change
- Update README.md for user-facing changes
- Commit working code only
- Mark tasks complete immediately after finishing

## Completion Signals

When all tasks are done: `<TASK_DONE>`
If blocked: `<TASK_BLOCKED>` with explanation
