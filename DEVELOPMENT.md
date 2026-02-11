# Development Guide

This guide covers how to extend ralph-starter with custom integrations, agents, and more.

## Architecture Overview

ralph-starter is built with a modular architecture:

```
src/
├── cli.ts              # CLI entry point and command registration
├── commands/           # CLI command implementations
│   ├── run.ts          # Main run command
│   ├── init.ts         # Project initialization
│   ├── plan.ts         # Implementation planning
│   └── ...
├── integrations/       # Source integrations (GitHub, Linear, etc.)
│   ├── base.ts         # Base integration interface
│   ├── github/         # GitHub integration
│   ├── linear/         # Linear integration
│   ├── notion/         # Notion integration
│   └── figma/          # Figma integration
├── loop/               # Autonomous loop execution
│   ├── executor.ts     # Main loop runner
│   ├── agents.ts       # Agent detection and invocation
│   └── ...
├── llm/                # LLM provider abstraction
│   ├── providers.ts    # Provider definitions
│   └── api.ts          # Unified API interface
├── automation/         # Git and validation automation
│   └── git.ts          # Branch, commit, PR operations
└── config/             # Configuration management
    └── manager.ts      # Config file handling
```

## Creating Custom Integrations

Integrations fetch specs from external sources. To create a new integration:

### 1. Create the Integration Class

Create a new directory under `src/integrations/`:

```typescript
// src/integrations/myservice/index.ts
import { BaseIntegration, IntegrationResult } from '../base';

export class MyServiceIntegration extends BaseIntegration {
  name = 'myservice';
  displayName = 'My Service';
  description = 'Fetch specs from My Service';
  website = 'https://myservice.com';
  authMethods = ['api_key'];

  async fetch(identifier: string, options?: IntegrationOptions): Promise<IntegrationResult> {
    const apiKey = await this.getApiKey();

    // Fetch data from your service
    const response = await fetch(`https://api.myservice.com/items/${identifier}`, {
      headers: { 'Authorization': `Bearer ${apiKey}` }
    });

    const data = await response.json();

    return {
      content: data.content,
      title: data.title,
      metadata: { source: 'myservice', id: identifier }
    };
  }

  async isAvailable(): Promise<boolean> {
    return !!(await this.getApiKey());
  }
}
```

### 2. Register the Integration

Add to `src/integrations/index.ts`:

```typescript
import { MyServiceIntegration } from './myservice';

const integrations: Integration[] = [
  // ... existing integrations
  new MyServiceIntegration(),
];
```

### 3. Add Environment Variable Support

Update `src/sources/config.ts`:

```typescript
const ENV_VAR_MAPPINGS: Record<string, Record<string, string>> = {
  // ... existing mappings
  myservice: { apiKey: 'MYSERVICE_API_KEY' },
};
```

## Creating Custom Agents

Agents are the AI coding assistants that ralph-starter orchestrates. To add a new agent:

### 1. Add Agent Definition

Update `src/loop/agents.ts`:

```typescript
const AGENTS: Record<AgentType, { name: string; command: string; checkCmd: string[] }> = {
  // ... existing agents
  'myagent': {
    name: 'My Agent',
    command: 'myagent',
    checkCmd: ['myagent', '--version'],
  },
};
```

### 2. Add Agent-Specific Invocation

In the `runAgent` function, add handling for your agent's specific flags:

```typescript
case 'myagent':
  args.push('--prompt', options.task);
  if (options.auto) {
    args.push('--auto-approve');
  }
  break;
```

## LLM Provider Integration

ralph-starter uses LLM providers for internal features. To add a new provider:

### 1. Add Provider Definition

Update `src/llm/providers.ts`:

```typescript
export const PROVIDERS: Record<LLMProvider, ProviderConfig> = {
  // ... existing providers
  myprovider: {
    name: 'myprovider',
    displayName: 'My Provider',
    envVar: 'MYPROVIDER_API_KEY',
    apiUrl: 'https://api.myprovider.com/v1/chat',
    defaultModel: 'my-model',
    consoleUrl: 'https://myprovider.com/api-keys',
  },
};
```

### 2. Handle Provider-Specific API Format

Update `src/llm/api.ts` if your provider has a different API format.

## Testing

Run tests with:

```bash
pnpm test
```

Run specific test files:

```bash
pnpm test src/integrations/github/source.test.ts
```

## Building

Build the project:

```bash
pnpm build
```

Run locally during development:

```bash
pnpm dev
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

## Resources

- [Documentation](https://ralphstarter.ai)
- [API Reference](https://ralphstarter.ai/docs/api)
- [Feature Ideas](https://github.com/multivmlabs/ralph-ideas)
- [Project Templates](https://github.com/multivmlabs/ralph-templates)
