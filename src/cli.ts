#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { runCommand } from './commands/run.js';
import { initCommand } from './commands/init.js';
import { skillCommand } from './commands/skill.js';
import { planCommand } from './commands/plan.js';
import { configCommand } from './commands/config.js';
import { sourceCommand } from './commands/source.js';
import { authCommand } from './commands/auth.js';
import { runWizard, runIdeaMode } from './wizard/index.js';
import { startMcpServer } from './mcp/server.js';

const VERSION = '0.1.0';

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
  .option('--max-iterations <n>', 'Maximum loop iterations', '50')
  .option('--agent <name>', 'Specify agent (claude-code, cursor, codex, opencode)')
  .option('--from <source>', 'Fetch spec from source (file, url, github, todoist, linear, notion)')
  .option('--project <name>', 'Project/repo name for --from integrations')
  .option('--label <name>', 'Label filter for --from integrations')
  .option('--status <status>', 'Status filter for --from integrations')
  .option('--limit <n>', 'Max items to fetch for --from integrations', '20')
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
  .description('Brainstorm project ideas when you don\'t know what to build')
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
  .command('config <action> [args...]')
  .description('Manage source configuration (list, get, set, delete)')
  .action(async (action: string, args: string[]) => {
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
  .command('source <action> [args...]')
  .description('Manage input sources (list, help, test, preview)')
  .option('--project <name>', 'Project/repo name for integrations')
  .option('--label <name>', 'Label filter')
  .option('--status <status>', 'Status filter')
  .option('--limit <n>', 'Max items to fetch', '10')
  .action(async (action: string, args: string[], options) => {
    await sourceCommand(action, args, options);
  });

// ralph-starter mcp - Start as MCP server
program
  .command('mcp')
  .description('Start as an MCP (Model Context Protocol) server for Claude Desktop/Code')
  .action(async () => {
    await startMcpServer();
  });

// Default action - launch interactive wizard
program.action(async () => {
  // If user passes --help, commander handles it
  // Otherwise, launch the wizard
  await runWizard();
});

program.parse();
