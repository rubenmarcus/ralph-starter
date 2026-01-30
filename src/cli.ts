#!/usr/bin/env node

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import chalk from 'chalk';
import { Command } from 'commander';
import { authCommand } from './commands/auth.js';
import { checkCommand } from './commands/check.js';
import { configCommand } from './commands/config.js';
import { initCommand } from './commands/init.js';
import { integrationsCommand } from './commands/integrations.js';
import { planCommand } from './commands/plan.js';
import { runCommand } from './commands/run.js';
import { setupCommand } from './commands/setup.js';
import { skillCommand } from './commands/skill.js';
import { sourceCommand } from './commands/source.js';
import { startMcpServer } from './mcp/server.js';
import { formatPresetsHelp, getPresetNames } from './presets/index.js';
import { runIdeaMode, runWizard } from './wizard/index.js';

// Read version from package.json dynamically
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageJson = JSON.parse(readFileSync(join(__dirname, '..', 'package.json'), 'utf-8'));
const VERSION = packageJson.version;

const program = new Command();

const banner = `
  ${chalk.cyan('╭─────────────────────────────────────────────────────────────╮')}
  ${chalk.cyan('│')}                                                             ${chalk.cyan('│')}
  ${chalk.cyan('│')}   ${chalk.bold.white('ralph-starter')} ${chalk.gray(`v${VERSION}`)}                                   ${chalk.cyan('│')}
  ${chalk.cyan('│')}                                                             ${chalk.cyan('│')}
  ${chalk.cyan('│')}   ${chalk.dim('Ralph Wiggum made easy.')}                                   ${chalk.cyan('│')}
  ${chalk.cyan('│')}   ${chalk.dim('One command to run autonomous AI coding loops.')}            ${chalk.cyan('│')}
  ${chalk.cyan('│')}                                                             ${chalk.cyan('│')}
  ${chalk.cyan('╰─────────────────────────────────────────────────────────────╯')}
`;

program
  .name('ralph-starter')
  .description('Ralph Wiggum made easy. Run autonomous AI coding loops with one command.')
  .version(VERSION)
  .addHelpText('beforeAll', banner);

// ralph-starter run [task] - Main command to run a loop
program
  .command('run [task]')
  .description('Run an autonomous AI coding loop')
  .option('--auto', 'Run in fully automated mode (skip permissions)')
  .option('--commit', 'Auto-commit after each successful task')
  .option('--push', 'Push commits to remote')
  .option('--pr', 'Create a pull request when done')
  .option('--validate', 'Run tests/lint/build after each iteration (backpressure)')
  .option('--docker', 'Run in Docker sandbox (coming soon)')
  .option('--prd <file>', 'Read tasks from a PRD markdown file')
  .option('--max-iterations <n>', 'Maximum loop iterations (auto-calculated if not specified)')
  .option('--agent <name>', 'Specify agent (claude-code, cursor, codex, opencode)')
  .option('--from <source>', 'Fetch spec from source (file, url, github, todoist, linear, notion)')
  .option('--project <name>', 'Project/repo name for --from integrations')
  .option('--label <name>', 'Label filter for --from integrations')
  .option('--status <status>', 'Status filter for --from integrations')
  .option('--limit <n>', 'Max items to fetch for --from integrations', '20')
  .option('--issue <n>', 'Specific issue number to fetch (for github)')
  .option('--output-dir <path>', 'Directory to run the task in (skips location prompt)')
  // New options
  .option(
    '--preset <name>',
    `Use a workflow preset (${getPresetNames().slice(0, 5).join(', ')}...)`
  )
  .option('--completion-promise <string>', 'Custom completion promise string to detect task done')
  .option('--require-exit-signal', 'Require explicit EXIT_SIGNAL: true for completion')
  .option('--rate-limit <n>', 'Max API calls per hour (default: unlimited)')
  .option('--track-progress', 'Write progress to activity.md (default: true)')
  .option('--no-track-progress', 'Disable progress tracking')
  .option('--track-cost', 'Track token usage and estimated cost (default: true)')
  .option('--no-track-cost', 'Disable cost tracking')
  .option('--circuit-breaker-failures <n>', 'Max consecutive failures before stopping (default: 3)')
  .option('--circuit-breaker-errors <n>', 'Max same error occurrences before stopping (default: 5)')
  .action(runCommand);

// ralph-starter init - Initialize Ralph in a project
program
  .command('init')
  .description('Initialize Ralph Wiggum in an existing project')
  .option('-n, --name <name>', 'Project name')
  .action(initCommand);

// ralph-starter skill - Manage agent skills
program
  .command('skill <action> [name]')
  .description('Manage agent skills (add, list, search, browse)')
  .option('-g, --global', 'Install skill globally')
  .action(skillCommand);

// ralph-starter plan - Create implementation plan from specs
program
  .command('plan')
  .description('Analyze specs and create implementation plan (Ralph Playbook planning mode)')
  .option('--auto', 'Run in automated mode (skip permissions)')
  .action(planCommand);

// ralph-starter setup - Interactive setup wizard
program
  .command('setup')
  .description('Interactive setup wizard to configure LLM and agents')
  .option('--force', 'Force re-run setup even if already configured')
  .action(setupCommand);

// ralph-starter check - Check configuration and test connection
program
  .command('check')
  .description('Check configuration and test LLM connection')
  .option('--verbose', 'Show detailed output')
  .action(checkCommand);

// ralph-starter wizard - Interactive wizard (explicit command)
program
  .command('wizard')
  .description('Launch the interactive wizard to build a new project')
  .action(async () => {
    await runWizard();
  });

// ralph-starter ideas - Brainstorm project ideas
program
  .command('ideas')
  .description("Brainstorm project ideas when you don't know what to build")
  .action(async () => {
    const idea = await runIdeaMode();
    if (idea) {
      console.log();
      console.log('  Selected idea:', idea);
      console.log();
      console.log('  To build this project, run:');
      console.log('    ralph-starter wizard');
      console.log();
    }
  });

// ralph-starter config - Manage source configuration
program
  .command('config [action] [args...]')
  .description('Manage source configuration (list, get, set, delete)')
  .action(async (action: string | undefined, args: string[]) => {
    if (!action) {
      // Show help when no action provided
      await configCommand('help', []);
      return;
    }
    await configCommand(action, args);
  });

// ralph-starter auth - Browser-based OAuth authentication
program
  .command('auth [service]')
  .description('Browser-based OAuth authentication for integrations')
  .option('--list', 'Show authentication status for all services')
  .option('--logout <service>', 'Remove credentials for a service')
  .action(async (service: string | undefined, options: { list?: boolean; logout?: string }) => {
    await authCommand(service, options);
  });

// ralph-starter source - Manage input sources
program
  .command('source [action] [args...]')
  .description('Manage input sources (list, help, test, preview)')
  .option('--project <name>', 'Project/repo name for integrations')
  .option('--label <name>', 'Label filter')
  .option('--status <status>', 'Status filter')
  .option('--limit <n>', 'Max items to fetch', '10')
  .option('--issue <n>', 'Specific issue number to fetch (for github)')
  .action(async (action: string | undefined, args: string[], options) => {
    if (!action) {
      // Show help when no action provided
      await sourceCommand('help', []);
      return;
    }
    await sourceCommand(action, args, options);
  });

// ralph-starter integrations - Manage integrations (unified architecture)
program
  .command('integrations [action] [args...]')
  .description('Manage integrations (list, help, test, fetch)')
  .option('--project <name>', 'Project/repo name')
  .option('--label <name>', 'Label filter')
  .option('--status <status>', 'Status filter')
  .option('--limit <n>', 'Max items to fetch', '10')
  .action(async (action: string | undefined, args: string[], options) => {
    if (!action) {
      // Default to list when no action provided
      await integrationsCommand('list', [], options);
      return;
    }
    await integrationsCommand(action, args, options);
  });

// ralph-starter mcp - Start as MCP server
program
  .command('mcp')
  .description('Start as an MCP (Model Context Protocol) server for Claude Desktop/Code')
  .action(async () => {
    await startMcpServer();
  });

// ralph-starter presets - List available workflow presets
program
  .command('presets')
  .description('List available workflow presets')
  .action(() => {
    console.log();
    console.log(formatPresetsHelp());
    console.log('Use with: ralph-starter run --preset <name> [task]');
    console.log();
  });

// Default action - launch interactive wizard
program.action(async () => {
  // If user passes --help, commander handles it
  // Otherwise, launch the wizard
  await runWizard();
});

program.parse();
