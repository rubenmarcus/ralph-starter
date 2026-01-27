import { homedir } from 'os';
import { join } from 'path';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import inquirer from 'inquirer';
import chalk from 'chalk';
import {
  type LLMProvider,
  PROVIDERS,
  PROVIDER_NAMES,
  detectProviderFromEnv,
  getProviderKeyFromEnv,
} from '../llm/index.js';

export interface RalphConfig {
  // Legacy (backward compat)
  apiKey?: string;
  defaultModel?: string;

  // LLM provider settings
  llm?: {
    provider?: LLMProvider;
    model?: string;
  };
  providers?: {
    anthropic?: { apiKey: string };
    openai?: { apiKey: string };
    openrouter?: { apiKey: string };
  };

  // Agent settings
  agent?: {
    default?: string;
    usesClaudeCodeCLI?: boolean;
  };

  // Setup status
  setupCompleted?: boolean;
  setupVersion?: string;
}

const CONFIG_DIR = join(homedir(), '.ralph-starter');
const CONFIG_FILE = join(CONFIG_DIR, 'config.json');

export function ensureConfigDir(): void {
  if (!existsSync(CONFIG_DIR)) {
    mkdirSync(CONFIG_DIR, { recursive: true });
  }
}

export function readConfig(): RalphConfig {
  ensureConfigDir();

  if (!existsSync(CONFIG_FILE)) {
    return {};
  }

  try {
    const content = readFileSync(CONFIG_FILE, 'utf-8');
    return JSON.parse(content);
  } catch {
    return {};
  }
}

export function writeConfig(config: RalphConfig): void {
  ensureConfigDir();
  writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}

export async function getApiKey(): Promise<string | null> {
  // 1. Check CLI flag (handled by caller)

  // 2. Check environment variable
  if (process.env.ANTHROPIC_API_KEY) {
    return process.env.ANTHROPIC_API_KEY;
  }

  // 3. Check config file
  const config = readConfig();
  if (config.apiKey) {
    return config.apiKey;
  }

  // 4. Prompt user
  return promptForApiKey();
}

export async function promptForApiKey(): Promise<string | null> {
  console.log();
  console.log(chalk.yellow('No API key found.'));
  console.log(chalk.dim('You can get one at: https://console.anthropic.com/'));
  console.log();

  const { apiKey } = await inquirer.prompt([
    {
      type: 'password',
      name: 'apiKey',
      message: 'Enter your Anthropic API key:',
      mask: '*',
    }
  ]);

  if (!apiKey) {
    return null;
  }

  const { save } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'save',
      message: 'Save this API key for future use?',
      default: true,
    }
  ]);

  if (save) {
    const config = readConfig();
    config.apiKey = apiKey;
    writeConfig(config);
    console.log(chalk.green(`API key saved to ${CONFIG_FILE}`));
  }

  return apiKey;
}

export async function isClaudeCliInstalled(): Promise<boolean> {
  try {
    const { execa } = await import('execa');
    await execa('claude', ['--version']);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get the configured LLM provider
 * Priority: config file > auto-detect from env > default (anthropic)
 */
export function getLLMProvider(): LLMProvider {
  const config = readConfig();

  // Check explicit config
  if (config.llm?.provider) {
    return config.llm.provider;
  }

  // Auto-detect from environment
  const detected = detectProviderFromEnv();
  if (detected) {
    return detected;
  }

  // Default to anthropic
  return 'anthropic';
}

/**
 * Get API key for a specific provider
 * Priority: env var > config file providers.X.apiKey > legacy apiKey (for anthropic)
 */
export function getLLMApiKey(provider: LLMProvider): string | null {
  // Check environment variable first
  const envKey = getProviderKeyFromEnv(provider);
  if (envKey) {
    return envKey;
  }

  // Check config file
  const config = readConfig();

  // Check new providers.X.apiKey format
  const providerKey = config.providers?.[provider]?.apiKey;
  if (providerKey) {
    return providerKey;
  }

  // Legacy: check apiKey for anthropic
  if (provider === 'anthropic' && config.apiKey) {
    return config.apiKey;
  }

  return null;
}

/**
 * Get API key silently (no prompt) - for wizard use
 * Returns provider and key, or null if none available
 */
export function getConfiguredLLM(): { provider: LLMProvider; apiKey: string } | null {
  // Try configured provider first
  const config = readConfig();
  if (config.llm?.provider) {
    const key = getLLMApiKey(config.llm.provider);
    if (key) {
      return { provider: config.llm.provider, apiKey: key };
    }
  }

  // Auto-detect from environment
  for (const provider of PROVIDER_NAMES) {
    const key = getLLMApiKey(provider);
    if (key) {
      return { provider, apiKey: key };
    }
  }

  return null;
}

/**
 * Set LLM provider in config
 */
export function setLLMProvider(provider: LLMProvider): void {
  const config = readConfig();
  config.llm = { ...config.llm, provider };
  writeConfig(config);
}

/**
 * Set API key for a provider
 */
export function setLLMApiKey(provider: LLMProvider, apiKey: string): void {
  const config = readConfig();

  if (!config.providers) {
    config.providers = {};
  }

  config.providers[provider] = { apiKey };
  writeConfig(config);
}

/**
 * Get configured model for LLM
 */
export function getLLMModel(): string | null {
  const config = readConfig();
  return config.llm?.model || config.defaultModel || null;
}

/**
 * Interactive prompt for LLM provider selection and API key
 */
export async function promptForLLMSetup(): Promise<{ provider: LLMProvider; apiKey: string } | null> {
  console.log();
  console.log(chalk.yellow('No LLM API key configured.'));
  console.log();

  // Provider selection
  const { provider } = await inquirer.prompt([
    {
      type: 'list',
      name: 'provider',
      message: 'Choose your LLM provider:',
      choices: PROVIDER_NAMES.map((p) => ({
        name: PROVIDERS[p].displayName,
        value: p,
      })),
    },
  ]);

  const providerConfig = PROVIDERS[provider as LLMProvider];

  console.log();
  console.log(chalk.dim(`Get your API key at: ${providerConfig.consoleUrl}`));
  console.log();

  // API key input
  const { apiKey } = await inquirer.prompt([
    {
      type: 'password',
      name: 'apiKey',
      message: `Enter your ${providerConfig.displayName} API key:`,
      mask: '*',
    },
  ]);

  if (!apiKey) {
    return null;
  }

  // Save option
  const { save } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'save',
      message: 'Save this configuration for future use?',
      default: true,
    },
  ]);

  if (save) {
    setLLMProvider(provider as LLMProvider);
    setLLMApiKey(provider as LLMProvider, apiKey);
    console.log(chalk.green(`Configuration saved to ${CONFIG_FILE}`));
  }

  return { provider: provider as LLMProvider, apiKey };
}
