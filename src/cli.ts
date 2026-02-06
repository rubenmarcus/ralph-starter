#!/usr/bin/env node

import chalk from 'chalk';
import { Command } from 'commander';
import { authCommand } from './commands/auth.js';
import { autoCommand } from './commands/auto.js';
import { checkCommand } from './commands/check.js';
import { configCommand } from './commands/config.js';
import { initCommand } from './commands/init.js';
import { integrationsCommand } from './commands/integrations.js';
import { planCommand } from './commands/plan.js';
import { runCommand } from './commands/run.js';
import { setupCommand } from './commands/setup.js';
import { skillCommand } from './commands/skill.js';
import { sourceCommand } from './commands/source.js';
import { templateCommand } from './commands/template.js';
import { startMcpServer } from './mcp/server.js';
import { formatPresetsHelp, getPresetNames } from './presets/index.js';
import { getPackageVersion } from './utils/version.js';
import { runIdeaMode, runWizard } from './wizard/index.js';

const VERSION = getPackageVersion();

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
  .option('--auto', 'Run in fully automated mode (skip permissions)', true)
  .option('--no-auto', 'Require manual permission approval')
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
  // Figma integration options
  .option('--figma-mode <mode>', 'Figma mode: spec, tokens, components, assets, content')
  .option(
    '--figma-framework <framework>',
    'Component framework: react, vue, svelte, astro, nextjs, nuxt, html'
  )
  .option('--figma-format <format>', 'Token format: css, scss, json, tailwind')
  .option('--figma-nodes <ids>', 'Specific Figma node IDs (comma-separated)')
  .option('--figma-scale <n>', 'Image export scale (default: 1)')
  .option('--figma-target <path>', 'Target directory for content mode')
  .option('--figma-preview', 'Show content changes without applying (content mode)')
  .option('--figma-mapping <file>', 'Custom content mapping file (content mode)')
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
  .option('--auto', 'Run in automated mode (skip permissions)', true)
  .option('--no-auto', 'Require manual permission approval')
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

// ralph-starter auto - Autonomous batch task processing
program
  .command('auto')
  .description('Run in autonomous mode, processing multiple tasks from GitHub/Linear')
  .requiredOption('--source <source>', 'Source to fetch tasks from (github, linear)')
  .option('--project <name>', 'Project identifier (owner/repo for GitHub)')
  .option('--label <name>', 'Filter tasks by label (e.g., "auto-ready")')
  .option('--limit <n>', 'Maximum tasks to process (default: 10)', '10')
  .option('--dry-run', 'Preview mode - show tasks without executing')
  .option('--skip-pr', 'Skip PR creation (commit only)')
  .option('--agent <name>', 'Specify agent to use')
  .option('--validate', 'Run validation after each task', true)
  .option('--no-validate', 'Skip validation')
  .option('--max-iterations <n>', 'Max iterations per task (default: 15)')
  .action(async (options) => {
    await autoCommand({
      source: options.source,
      project: options.project,
      label: options.label,
      limit: parseInt(options.limit, 10),
      dryRun: options.dryRun,
      skipPr: options.skipPr,
      agent: options.agent,
      validate: options.validate,
      maxIterations: options.maxIterations ? parseInt(options.maxIterations, 10) : undefined,
    });
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

// ralph-starter template - Browse and use project templates
program
  .command('template [action] [args...]')
  .description('Browse and use project templates from ralph-templates')
  .option(
    '--category <name>',
    'Filter by category (web-dev, blockchain, devops, mobile, tools, seo)'
  )
  .option('--refresh', 'Force refresh the cache')
  .option('--auto', 'Skip confirmation prompts')
  .option('--output-dir <path>', 'Directory to create the project in')
  .option('--commit', 'Auto-commit after each successful task')
  .option('--push', 'Push commits to remote')
  .option('--pr', 'Create a pull request when done')
  .option('--validate', 'Run tests/lint/build after each iteration')
  .option('--max-iterations <n>', 'Maximum loop iterations')
  .option('--agent <name>', 'Specify agent (claude-code, cursor, codex, opencode)')
  .action(async (action: string | undefined, args: string[], options) => {
    await templateCommand(action, args, options);
  });

// Default action - launch interactive wizard
program.action(async () => {
  // If user passes --help, commander handles it
  // Otherwise, launch the wizard
  await runWizard();
});

program.parse();
