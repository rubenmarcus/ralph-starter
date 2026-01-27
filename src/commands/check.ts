/**
 * Check command for ralph-starter
 * Verifies configuration and tests LLM connection
 */

import chalk from 'chalk';
import ora from 'ora';
import { getConfiguredLLM, readConfig } from '../config/manager.js';
import { PROVIDERS } from '../llm/index.js';
import { isClaudeCodeAvailable, testClaudeCodeConnection } from '../setup/agent-detector.js';
import { testApiConnection } from '../setup/llm-tester.js';

export interface CheckCommandOptions {
  verbose?: boolean;
}

/**
 * Mask an API key for display
 */
function maskKey(key: string): string {
  if (key.length <= 8) {
    return '*'.repeat(key.length);
  }
  return key.slice(0, 4) + '*'.repeat(key.length - 8) + key.slice(-4);
}

/**
 * Run the check command
 */
export async function checkCommand(options: CheckCommandOptions): Promise<void> {
  console.log();
  console.log(chalk.bold('Checking ralph-starter configuration...'));
  console.log();

  const _config = readConfig();
  let hasLLM = false;
  let usesClaudeCode = false;

  // Step 1: Check for Claude Code CLI (highest priority)
  console.log(chalk.dim('  Detecting LLM...'));

  const claudeCheck = await isClaudeCodeAvailable();

  if (claudeCheck.available) {
    const version = claudeCheck.version ? `v${claudeCheck.version}` : '';
    console.log(chalk.green(`  ✓ Claude Code CLI found ${version}`));
    if (options.verbose && claudeCheck.executablePath) {
      console.log(chalk.dim(`    Path: ${claudeCheck.executablePath}`));
    }
    hasLLM = true;
    usesClaudeCode = true;
  } else {
    console.log(chalk.dim('  ✗ Claude Code CLI not found'));
  }

  // Step 2: Check for API key configuration
  const llmConfig = getConfiguredLLM();

  if (llmConfig) {
    const providerName = PROVIDERS[llmConfig.provider].displayName;

    // Determine source of key
    const envVar = PROVIDERS[llmConfig.provider].envVar;
    const fromEnv = process.env[envVar] === llmConfig.apiKey;
    const source = fromEnv ? 'environment' : 'config file';

    console.log(chalk.green(`  ✓ API Key configured (${providerName})`));
    console.log(chalk.dim(`    Key: ${maskKey(llmConfig.apiKey)} (from ${source})`));
    hasLLM = true;
  } else if (!usesClaudeCode) {
    console.log(chalk.yellow('  ✗ No API key configured'));
  }

  // Step 3: Test connection
  if (!hasLLM) {
    console.log();
    console.log(chalk.red('  No LLM available!'));
    console.log();
    console.log(chalk.bold('  To get started, either:'));
    console.log(chalk.dim('    1. Install Claude Code: https://claude.ai/code'));
    console.log(chalk.dim('    2. Run setup wizard: ralph-starter setup'));
    console.log(chalk.dim('    3. Set API key: export ANTHROPIC_API_KEY=your-key'));
    console.log();
    process.exit(1);
  }

  console.log();
  const spinner = ora('Testing connection...').start();

  let testResult;
  if (usesClaudeCode) {
    // Test Claude Code connection
    const result = await testClaudeCodeConnection();
    testResult = {
      success: result.success,
      responseTime: result.responseTime,
      error: result.error,
      provider: 'Claude Code CLI' as const,
    };
  } else if (llmConfig) {
    // Test API connection
    const result = await testApiConnection(llmConfig.provider, llmConfig.apiKey);
    testResult = {
      success: result.success,
      responseTime: result.responseTime,
      error: result.error,
      provider: PROVIDERS[llmConfig.provider].displayName,
    };
  }

  if (testResult?.success) {
    const time = testResult.responseTime ? ` (${testResult.responseTime}ms)` : '';
    spinner.succeed(`Response received${time}`);
  } else {
    spinner.fail(`Connection failed: ${testResult?.error || 'Unknown error'}`);
    console.log();
    console.log(chalk.yellow('  The connection test failed. This could mean:'));
    console.log(chalk.dim('    • API key is invalid or expired'));
    console.log(chalk.dim('    • Network connectivity issues'));
    console.log(chalk.dim('    • Claude Code is not authenticated'));
    console.log();
    console.log(chalk.dim('  Try running: ralph-starter setup'));
    console.log();
    process.exit(1);
  }

  // Summary
  console.log();
  console.log(`${chalk.green.bold('  All checks passed!')} You're ready to go.`);
  console.log();

  const usingProvider = usesClaudeCode
    ? 'Claude Code CLI (no API key needed)'
    : llmConfig?.provider
      ? `${PROVIDERS[llmConfig.provider].displayName} API`
      : 'Unknown provider';

  console.log(chalk.dim(`  Using: ${usingProvider}`));
  console.log(chalk.dim("  Run 'ralph-starter' to launch the wizard."));
  console.log();
}
