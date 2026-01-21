import chalk from 'chalk';
import ora from 'ora';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { detectBestAgent, runAgent } from '../loop/agents.js';

export interface PlanCommandOptions {
  auto?: boolean;
}

export async function planCommand(options: PlanCommandOptions): Promise<void> {
  const cwd = process.cwd();
  const spinner = ora();

  console.log();
  console.log(chalk.cyan.bold('Ralph Planning Mode'));
  console.log(chalk.dim('Analyzing specs and creating implementation plan'));
  console.log();

  // Check for Ralph Playbook files
  const promptPlanPath = join(cwd, 'PROMPT_plan.md');
  const specsDir = join(cwd, 'specs');

  if (!existsSync(promptPlanPath)) {
    console.log(chalk.red('Ralph Playbook not found.'));
    console.log(chalk.dim('Run `ralph-starter init` first to set up the playbook files.'));
    return;
  }

  if (!existsSync(specsDir)) {
    console.log(chalk.yellow('No specs/ folder found.'));
    console.log(chalk.dim('Create specs in the specs/ folder first.'));
    return;
  }

  // Read planning prompt
  const planPrompt = readFileSync(promptPlanPath, 'utf-8');

  // Detect agent
  spinner.start('Detecting coding agent...');
  const agent = await detectBestAgent();
  spinner.stop();

  if (!agent) {
    console.log(chalk.red('No coding agent found!'));
    console.log(chalk.dim('Install Claude Code, Cursor, Codex, or OpenCode.'));
    return;
  }

  console.log(chalk.dim(`Using: ${agent.name}`));
  console.log();

  // Build the full prompt
  const fullPrompt = `${planPrompt}

Please analyze the specs/ folder and update IMPLEMENTATION_PLAN.md with a prioritized task list.

Focus on:
1. Reading all specification files in specs/
2. Understanding the current codebase state
3. Identifying gaps between specs and implementation
4. Creating actionable, small tasks

Do not implement anything - only plan.`;

  // Run the agent in planning mode
  spinner.start('Running planning analysis...');

  const result = await runAgent(agent, {
    task: fullPrompt,
    cwd,
    auto: options.auto,
    maxTurns: 5, // Limited turns for planning
  });

  if (result.exitCode === 0) {
    spinner.succeed('Planning complete');
    console.log();
    console.log(chalk.green('Updated IMPLEMENTATION_PLAN.md'));
    console.log();
    console.log(chalk.yellow('Next step:'));
    console.log(chalk.gray('  ralph-starter run    # Execute the plan'));
  } else {
    spinner.fail('Planning failed');
    console.log(chalk.dim(result.output.slice(0, 500)));
  }
}
