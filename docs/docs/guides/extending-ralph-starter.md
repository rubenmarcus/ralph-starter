---
sidebar_position: 2
title: Extending ralph-starter
description: Developer guide for extending ralph-starter with custom sources, agents, and integrations
keywords: [developer, extension, custom sources, api, contributing, plugins]
---

# Extending ralph-starter

This guide covers how developers can extend ralph-starter with custom input sources, use the programmatic API, and contribute to the project.

## Architecture Overview

```
ralph-starter/
├── src/
│   ├── cli.ts              # CLI entry point
│   ├── index.ts            # Public API exports
│   ├── commands/           # CLI commands
│   ├── sources/            # Input source system
│   │   ├── types.ts        # Source interface definitions
│   │   ├── base.ts         # Base source class
│   │   ├── builtin/        # Built-in sources (file, url, pdf)
│   │   └── integrations/   # Integration sources (linear, notion, etc.)
│   ├── wizard/             # Interactive wizard
│   ├── loop/               # Autonomous loop engine
│   ├── mcp/                # MCP server
│   └── automation/         # Git automation
```

---

## Creating Custom Input Sources

ralph-starter's source system is designed for extensibility. Here's how to create your own input source.

### The Source Interface

```typescript
import type { InputSource, SourceResult, SourceOptions } from 'ralph-starter';

interface InputSource {
  // Unique identifier for the source
  name: string;

  // Human-readable description
  description: string;

  // Check if this source is available (e.g., CLI tool installed, API reachable)
  isAvailable(): Promise<boolean>;

  // Whether authentication is required
  requiresAuth(): boolean;

  // Fetch items from the source
  fetch(identifier: string, options?: SourceOptions): Promise<SourceResult>;
}
```

### Example: Custom Source

Here's an example of creating a custom source that fetches from Trello:

```typescript
// src/sources/integrations/trello.ts
import { BaseSource } from '../base.js';
import type { SourceResult, SourceOptions } from '../types.js';
import { getSourceCredentials } from '../config.js';

export class TrelloSource extends BaseSource {
  name = 'trello';
  description = 'Fetch cards from Trello boards';

  async isAvailable(): Promise<boolean> {
    const creds = getSourceCredentials('trello');
    return !!(creds?.apiKey && creds?.token);
  }

  requiresAuth(): boolean {
    return true;
  }

  async fetch(boardId: string, options?: SourceOptions): Promise<SourceResult> {
    const creds = getSourceCredentials('trello');
    if (!creds?.apiKey || !creds?.token) {
      return {
        success: false,
        error: 'Trello API key and token required',
      };
    }

    try {
      const response = await fetch(
        `https://api.trello.com/1/boards/${boardId}/cards?key=${creds.apiKey}&token=${creds.token}`
      );
      const cards = await response.json();

      // Filter by label if specified
      let filtered = cards;
      if (options?.label) {
        filtered = cards.filter((card: any) =>
          card.labels.some((l: any) => l.name === options.label)
        );
      }

      // Apply limit
      if (options?.limit) {
        filtered = filtered.slice(0, options.limit);
      }

      // Convert to spec format
      const specs = filtered.map((card: any) => ({
        title: card.name,
        content: this.formatSpec(card),
        metadata: {
          source: 'trello',
          cardId: card.id,
          url: card.url,
        },
      }));

      return {
        success: true,
        items: specs,
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to fetch from Trello: ${error}`,
      };
    }
  }

  private formatSpec(card: any): string {
    return `# ${card.name}

Source: Trello Card
Board: ${card.idBoard}
Labels: ${card.labels.map((l: any) => l.name).join(', ')}

## Description

${card.desc || 'No description provided.'}

## Checklist Items

${card.checklists?.map((cl: any) =>
  cl.checkItems.map((item: any) =>
    `- [${item.state === 'complete' ? 'x' : ' '}] ${item.name}`
  ).join('\n')
).join('\n') || 'No checklists.'}
`;
  }
}
```

### Registering Your Source

Add your source to the registry:

```typescript
// src/sources/index.ts
import { TrelloSource } from './integrations/trello.js';

// Add to the sources array
const sources: InputSource[] = [
  // ... existing sources
  new TrelloSource(),
];
```

### Adding Environment Variable Support

Update the config to support your source's env vars:

```typescript
// src/sources/config.ts
const ENV_VAR_MAPPINGS: Record<string, Record<string, string>> = {
  // ... existing mappings
  trello: {
    apiKey: 'TRELLO_API_KEY',
    token: 'TRELLO_TOKEN',
  },
};
```

---

## Using ralph-starter Programmatically

ralph-starter exports its core functionality for use in other tools.

### Installation

```bash
npm install ralph-starter
```

### Available Exports

```typescript
import {
  // Commands
  initCommand,
  planCommand,
  runCommand,

  // Source system
  getSource,
  getAllSources,
  getSourceCredentials,
  setSourceCredential,

  // Wizard
  runWizard,
  runIdeaMode,

  // Loop
  detectBestAgent,
  runLoop,

  // Types
  type InputSource,
  type SourceResult,
  type SourceOptions,
} from 'ralph-starter';
```

### Example: Running a Loop Programmatically

```typescript
import { runCommand, detectBestAgent } from 'ralph-starter';

async function buildFeature(spec: string) {
  // Check for available agent
  const agent = await detectBestAgent();
  if (!agent) {
    throw new Error('No coding agent available');
  }

  // Run the loop
  await runCommand(spec, {
    auto: true,
    commit: true,
    validate: true,
    maxIterations: 20,
  });
}

// Usage
await buildFeature('Add dark mode toggle to settings page');
```

### Example: Fetching from Sources

```typescript
import { getSource } from 'ralph-starter';

async function fetchLinearIssues() {
  const source = getSource('linear');
  if (!source) {
    throw new Error('Linear source not found');
  }

  const result = await source.fetch('team-id', {
    label: 'ready-to-build',
    limit: 5,
  });

  if (!result.success) {
    throw new Error(result.error);
  }

  return result.items;
}
```

### Example: Using the Wizard Programmatically

```typescript
import { runWizard, runIdeaMode } from 'ralph-starter';

// Run the full wizard
await runWizard();

// Or just idea mode
const selectedIdea = await runIdeaMode();
console.log('User selected:', selectedIdea);
```

---

## Adding New Agents

ralph-starter supports multiple coding agents. Here's how to add support for a new one.

### Agent Detection

Agents are detected in `src/loop/agents.ts`:

```typescript
interface Agent {
  name: string;
  command: string;
  args: string[];
  isAvailable(): Promise<boolean>;
}

const agents: Agent[] = [
  {
    name: 'claude-code',
    command: 'claude',
    args: ['--dangerously-skip-permissions'],
    async isAvailable() {
      // Check if claude CLI is available
      try {
        await execa('claude', ['--version']);
        return true;
      } catch {
        return false;
      }
    },
  },
  // Add your agent here
  {
    name: 'my-agent',
    command: 'my-agent-cli',
    args: ['--auto'],
    async isAvailable() {
      try {
        await execa('my-agent-cli', ['--version']);
        return true;
      } catch {
        return false;
      }
    },
  },
];
```

### Agent Priority

Agents are tried in order. Place your agent at the appropriate priority level:

```typescript
// Higher priority agents first
const agentPriority = [
  'claude-code',  // Most capable
  'cursor',
  'codex',
  'my-agent',     // Your custom agent
  'opencode',
];
```

---

## MCP Tools Extension

You can extend ralph-starter's MCP server with custom tools.

### Adding a New Tool

```typescript
// src/mcp/tools.ts
import { z } from 'zod';

export const tools = [
  // ... existing tools
  {
    name: 'ralph_custom_action',
    description: 'Perform a custom action',
    inputSchema: z.object({
      action: z.string().describe('The action to perform'),
      options: z.record(z.string()).optional(),
    }),
    async handler(input: { action: string; options?: Record<string, string> }) {
      // Implement your tool logic
      return {
        success: true,
        result: `Performed action: ${input.action}`,
      };
    },
  },
];
```

---

## Contributing

### Development Setup

```bash
# Clone the repo
git clone https://github.com/rubenmarcus/ralph-starter.git
cd ralph-starter

# Install dependencies
npm install

# Build
npm run build

# Run locally
npm link
ralph-starter --version
```

### Project Structure

| Directory | Purpose |
|-----------|---------|
| `src/cli.ts` | CLI entry point and command registration |
| `src/commands/` | Command implementations |
| `src/sources/` | Input source system |
| `src/wizard/` | Interactive wizard |
| `src/loop/` | Autonomous loop engine |
| `src/mcp/` | MCP server implementation |
| `src/automation/` | Git automation |
| `docs/` | Docusaurus documentation |

### Testing

```bash
# Run tests
npm test

# Type check
npm run typecheck

# Lint
npm run lint
```

### Pull Request Guidelines

1. **Branch from main** - Create a feature branch from `main`
2. **Keep PRs focused** - One feature or fix per PR
3. **Add tests** - For new functionality
4. **Update docs** - If you add/change features
5. **Follow conventions** - Use conventional commits

### Conventional Commits

```
feat: add trello source integration
fix: handle empty linear responses
docs: add extension guide
refactor: extract source base class
```

---

## API Reference

### Source Types

```typescript
interface SourceOptions {
  project?: string;
  label?: string;
  status?: string;
  limit?: number;
}

interface SourceResult {
  success: boolean;
  items?: SourceItem[];
  error?: string;
}

interface SourceItem {
  title: string;
  content: string;
  metadata?: Record<string, unknown>;
}

interface SourceCredentials {
  [key: string]: string;
}
```

### Command Options

```typescript
interface RunOptions {
  auto?: boolean;
  commit?: boolean;
  push?: boolean;
  pr?: boolean;
  validate?: boolean;
  from?: string;
  project?: string;
  label?: string;
  status?: string;
  limit?: number;
  prd?: string;
  agent?: string;
  maxIterations?: number;
}

interface InitOptions {
  name?: string;
  force?: boolean;
}

interface PlanOptions {
  auto?: boolean;
}
```

---

## Need Help?

- [GitHub Issues](https://github.com/rubenmarcus/ralph-starter/issues) - Bug reports and feature requests
- [Documentation](https://rubenmarcus.github.io/ralph-starter/) - Full docs
- [Discussions](https://github.com/rubenmarcus/ralph-starter/discussions) - Questions and ideas
