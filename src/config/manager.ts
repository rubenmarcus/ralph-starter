import { homedir } from 'os';
import { join } from 'path';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import inquirer from 'inquirer';
import chalk from 'chalk';

export interface RalphConfig {
  apiKey?: string;
  defaultModel?: string;
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
