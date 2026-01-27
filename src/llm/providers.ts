/**
 * LLM Provider configurations for ralph-starter
 */

export type LLMProvider = 'anthropic' | 'openai' | 'openrouter';

export interface ProviderConfig {
  name: LLMProvider;
  displayName: string;
  envVar: string;
  apiUrl: string;
  defaultModel: string;
  consoleUrl: string;
}

export const PROVIDERS: Record<LLMProvider, ProviderConfig> = {
  anthropic: {
    name: 'anthropic',
    displayName: 'Anthropic (Claude)',
    envVar: 'ANTHROPIC_API_KEY',
    apiUrl: 'https://api.anthropic.com/v1/messages',
    defaultModel: 'claude-sonnet-4-20250514',
    consoleUrl: 'https://console.anthropic.com/',
  },
  openai: {
    name: 'openai',
    displayName: 'OpenAI (GPT-4)',
    envVar: 'OPENAI_API_KEY',
    apiUrl: 'https://api.openai.com/v1/chat/completions',
    defaultModel: 'gpt-4-turbo',
    consoleUrl: 'https://platform.openai.com/api-keys',
  },
  openrouter: {
    name: 'openrouter',
    displayName: 'OpenRouter (Multiple models)',
    envVar: 'OPENROUTER_API_KEY',
    apiUrl: 'https://openrouter.ai/api/v1/chat/completions',
    defaultModel: 'anthropic/claude-3.5-sonnet',
    consoleUrl: 'https://openrouter.ai/keys',
  },
};

export const PROVIDER_NAMES = Object.keys(PROVIDERS) as LLMProvider[];

/**
 * Auto-detect available provider from environment variables
 * Returns the first provider with an available API key, or null
 */
export function detectProviderFromEnv(): LLMProvider | null {
  for (const provider of PROVIDER_NAMES) {
    const envVar = PROVIDERS[provider].envVar;
    if (process.env[envVar]) {
      return provider;
    }
  }
  return null;
}

/**
 * Get API key for a provider from environment
 */
export function getProviderKeyFromEnv(provider: LLMProvider): string | null {
  const envVar = PROVIDERS[provider].envVar;
  return process.env[envVar] || null;
}
