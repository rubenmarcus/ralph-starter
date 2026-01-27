/**
 * Setup Wizard for ralph-starter
 * Interactive setup to configure LLM providers and agents
 */

import chalk from 'chalk';
import inquirer from 'inquirer';
import ora from 'ora';
import { getConfiguredLLM, readConfig, writeConfig } from '../config/manager.js';
import {
  getProviderKeyFromEnv,
  type LLMProvider,
  PROVIDER_NAMES,
  PROVIDERS,
} from '../llm/index.js';
import { type AgentDetectionResult, detectAllAgents } from './agent-detector.js';
import { testApiConnection, testClaudeCode } from './llm-tester.js';

export interface SetupResult {
  success: boolean;
  usesClaudeCode: boolean;
  provider?: LLMProvider;
  agent?: string;
  error?: string;
}

/**
 * Show setup banner
 */
function showBanner(): void {
  console.log();
  console.log(chalk.cyan('  ╭─────────────────────────────────────────╮'));
  console.log(
    chalk.cyan('  │') +
      chalk.bold.white('  ralph-starter Setup Wizard            ') +
      chalk.cyan('│')
  );
  console.log(
    chalk.cyan('  │') + chalk.dim("  Let's get you configured!             ") + chalk.cyan('│')
  );
  console.log(chalk.cyan('  ╰─────────────────────────────────────────╯'));
  console.log();
}

/**
 * Step 1: Detect installed agents
 */
async function stepDetectAgents(): Promise<{
  agents: AgentDetectionResult[];
  claudeAvailable: boolean;
}> {
  console.log(chalk.bold('Step 1: Detecting Installed Agents'));
  console.log();

  const spinner = ora('Scanning for AI coding agents...').start();

  const agents = await detectAllAgents();

  spinner.stop();

  for (const agent of agents) {
    if (agent.available) {
      const version = agent.version ? `v${agent.version}` : '';
      console.log(chalk.green(`  ✓ ${agent.name} ${version}`));
      if (agent.executablePath) {
        console.log(chalk.dim(`    ${agent.executablePath}`));
      }
    } else {
      console.log(chalk.dim(`  ✗ ${agent.name} not found`));
    }
  }
  console.log();

  const claudeAvailable = agents.some((a) => a.id === 'claude' && a.available);

  return { agents, claudeAvailable };
}

/**
 * Step 2: Configure LLM provider
 */
async function stepConfigureLLM(claudeAvailable: boolean): Promise<{
  usesClaudeCode: boolean;
  provider?: LLMProvider;
  apiKey?: string;
}> {
  console.log(chalk.bold('Step 2: Configure LLM Provider'));
  console.log();

  // If Claude Code is available, offer to use it
  if (claudeAvailable) {
    console.log(chalk.green('  ✓ Claude Code CLI detected!'));
    console.log(chalk.dim('    No API key needed - uses your Claude Code authentication.'));
    console.log();

    const { useClaudeCode } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'useClaudeCode',
        message: 'Use Claude Code CLI? (recommended - no API key needed)',
        default: true,
      },
    ]);

    if (useClaudeCode) {
      return { usesClaudeCode: true };
    }
  }

  // Check for existing API keys in environment
  for (const providerName of PROVIDER_NAMES) {
    const envKey = getProviderKeyFromEnv(providerName);
    if (envKey) {
      console.log(chalk.green(`  ✓ Found ${PROVIDERS[providerName].envVar} in environment`));
      console.log();

      const { useEnvKey } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'useEnvKey',
          message: `Use ${PROVIDERS[providerName].displayName} from environment?`,
          default: true,
        },
      ]);

      if (useEnvKey) {
        return { usesClaudeCode: false, provider: providerName, apiKey: envKey };
      }
    }
  }

  // Check for existing config
  const existingConfig = getConfiguredLLM();
  if (existingConfig) {
    console.log(
      chalk.green(
        `  ✓ Found existing ${PROVIDERS[existingConfig.provider].displayName} configuration`
      )
    );
    console.log();

    const { useExisting } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'useExisting',
        message: 'Use existing configuration?',
        default: true,
      },
    ]);

    if (useExisting) {
      return {
        usesClaudeCode: false,
        provider: existingConfig.provider,
        apiKey: existingConfig.apiKey,
      };
    }
  }

  // No existing config - prompt for provider and key
  console.log();
  const { provider } = await inquirer.prompt([
    {
      type: 'list',
      name: 'provider',
      message: 'Choose your LLM provider:',
      choices: PROVIDER_NAMES.map((p) => ({
        name: `${PROVIDERS[p].displayName}`,
        value: p,
      })),
    },
  ]);

  const providerConfig = PROVIDERS[provider as LLMProvider];

  console.log();
  console.log(chalk.dim(`Get your API key at: ${providerConfig.consoleUrl}`));
  console.log();

  const { apiKey } = await inquirer.prompt([
    {
      type: 'password',
      name: 'apiKey',
      message: `Enter your ${providerConfig.displayName} API key:`,
      mask: '*',
      validate: (input: string) => {
        if (!input || input.trim().length === 0) {
          return 'API key is required';
        }
        return true;
      },
    },
  ]);

  return { usesClaudeCode: false, provider: provider as LLMProvider, apiKey };
}

/**
 * Step 3: Test connection
 */
async function stepTestConnection(options: {
  usesClaudeCode: boolean;
  provider?: LLMProvider;
  apiKey?: string;
}): Promise<boolean> {
  console.log();
  console.log(chalk.bold('Step 3: Testing Connection'));
  console.log();

  const spinner = ora('Testing connection...').start();

  let result;
  if (options.usesClaudeCode) {
    result = await testClaudeCode();
  } else if (options.provider && options.apiKey) {
    result = await testApiConnection(options.provider, options.apiKey);
  } else {
    spinner.fail('No LLM configured');
    return false;
  }

  if (result.success) {
    const time = result.responseTime ? ` (${result.responseTime}ms)` : '';
    spinner.succeed(`Connection successful${time}`);
    if (result.details) {
      console.log(chalk.dim(`    ${result.details}`));
    }
    return true;
  } else {
    spinner.fail(`Connection failed: ${result.error}`);
    return false;
  }
}

/**
 * Step 4: Save configuration
 */
async function stepSaveConfig(options: {
  usesClaudeCode: boolean;
  provider?: LLMProvider;
  apiKey?: string;
  selectedAgent?: string;
}): Promise<void> {
  console.log();
  console.log(chalk.bold('Step 4: Saving Configuration'));
  console.log();

  const config = readConfig();

  // Set agent preference
  config.agent = {
    default: options.usesClaudeCode ? 'claude' : options.selectedAgent || 'claude',
    usesClaudeCodeCLI: options.usesClaudeCode,
  };

  // Set LLM config if using API
  if (!options.usesClaudeCode && options.provider) {
    config.llm = { provider: options.provider };

    // Ask to save API key
    const { saveKey } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'saveKey',
        message: 'Save API key to config file?',
        default: true,
      },
    ]);

    if (saveKey && options.apiKey) {
      if (!config.providers) {
        config.providers = {};
      }
      config.providers[options.provider] = { apiKey: options.apiKey };
    }
  }

  // Mark setup as complete
  config.setupCompleted = true;
  config.setupVersion = '1.0';

  writeConfig(config);

  console.log(chalk.green('  ✓ Configuration saved'));
}

/**
 * Step 5: Show success message
 */
function showSuccess(options: { usesClaudeCode: boolean; provider?: LLMProvider }): void {
  console.log();
  console.log(chalk.cyan('  ╭─────────────────────────────────────────╮'));
  console.log(
    chalk.cyan('  │') +
      chalk.bold.green('  Setup Complete!                       ') +
      chalk.cyan('│')
  );
  console.log(`${chalk.cyan('  │')}                                         ${chalk.cyan('│')}`);

  if (options.usesClaudeCode) {
    console.log(`${chalk.cyan('  │')}  Using: Claude Code CLI                 ${chalk.cyan('│')}`);
    console.log(
      chalk.cyan('  │') + chalk.dim('  No API key needed                     ') + chalk.cyan('│')
    );
  } else if (options.provider) {
    const name = PROVIDERS[options.provider].displayName;
    const padding = ' '.repeat(Math.max(0, 25 - name.length));
    console.log(`${chalk.cyan('  │')}  Provider: ${name}${padding}${chalk.cyan('│')}`);
  }

  console.log(`${chalk.cyan('  │')}                                         ${chalk.cyan('│')}`);
  console.log(chalk.cyan('  ╰─────────────────────────────────────────╯'));
  console.log();

  console.log(chalk.bold('  Next steps:'));
  console.log(chalk.dim('    • ralph-starter           Launch wizard to build a project'));
  console.log(chalk.dim('    • ralph-starter ideas     Brainstorm project ideas'));
  console.log(chalk.dim('    • ralph-starter check     Verify configuration'));
  console.log();
}

/**
 * Run the full setup wizard
 */
export async function runSetupWizard(options?: { force?: boolean }): Promise<SetupResult> {
  showBanner();

  // Check if already configured (unless --force)
  if (!options?.force) {
    const config = readConfig();
    if (config.setupCompleted) {
      console.log(chalk.yellow('  Setup has already been completed.'));
      console.log(chalk.dim('  Run with --force to reconfigure.'));
      console.log();

      const { proceed } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'proceed',
          message: 'Continue anyway?',
          default: false,
        },
      ]);

      if (!proceed) {
        return { success: true, usesClaudeCode: false };
      }
      console.log();
    }
  }

  try {
    // Step 1: Detect agents
    const { claudeAvailable } = await stepDetectAgents();

    // Step 2: Configure LLM
    const llmConfig = await stepConfigureLLM(claudeAvailable);

    // Step 3: Test connection
    const testPassed = await stepTestConnection(llmConfig);

    if (!testPassed) {
      console.log();
      console.log(chalk.yellow('  Connection test failed. You can still save the config'));
      console.log(chalk.yellow('  and try again later with: ralph-starter check'));
      console.log();

      const { saveAnyway } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'saveAnyway',
          message: 'Save configuration anyway?',
          default: false,
        },
      ]);

      if (!saveAnyway) {
        return { success: false, usesClaudeCode: false, error: 'Connection test failed' };
      }
    }

    // Step 4: Save configuration
    await stepSaveConfig(llmConfig);

    // Step 5: Show success
    showSuccess(llmConfig);

    return {
      success: true,
      usesClaudeCode: llmConfig.usesClaudeCode,
      provider: llmConfig.provider,
    };
  } catch (error) {
    if ((error as Error).message?.includes('User force closed')) {
      console.log();
      console.log(chalk.dim('  Setup cancelled.'));
      return { success: false, usesClaudeCode: false, error: 'Cancelled' };
    }
    throw error;
  }
}
