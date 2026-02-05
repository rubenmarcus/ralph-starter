/**
 * Auto Mode Command
 *
 * Runs ralph-starter in fully autonomous mode, processing multiple tasks
 * from GitHub/Linear with automatic commits and PRs.
 */

import chalk from 'chalk';
import ora from 'ora';
import { hasUncommittedChanges, isGitRepo } from '../automation/git.js';
import { detectBestAgent } from '../loop/agents.js';
import { type BatchTask, completeTask, fetchBatchTasks } from '../loop/batch-fetcher.js';
import { executeTaskBatch } from '../loop/task-executor.js';

export interface AutoModeOptions {
  /** Source to fetch tasks from */
  source: 'github' | 'linear';
  /** Project identifier (owner/repo for GitHub, project name for Linear) */
  project?: string;
  /** Filter tasks by label */
  label?: string;
  /** Maximum number of tasks to process */
  limit?: number;
  /** Preview mode - don't execute, just show what would be done */
  dryRun?: boolean;
  /** Skip PR creation (commit only) */
  skipPr?: boolean;
  /** Agent to use */
  agent?: string;
  /** Run validation after each task */
  validate?: boolean;
  /** Max iterations per task */
  maxIterations?: number;
}

/**
 * Main auto mode command
 */
export async function autoCommand(options: AutoModeOptions): Promise<void> {
  const cwd = process.cwd();
  const spinner = ora();

  console.log();
  console.log(chalk.cyan.bold('ralph-starter auto'));
  console.log(chalk.dim('Autonomous batch task processing'));
  console.log();

  // Validate git repo
  if (!(await isGitRepo(cwd))) {
    console.log(chalk.red('Error: Not a git repository'));
    console.log(chalk.dim('Run this command in a git repository'));
    process.exit(1);
  }

  // Check for uncommitted changes
  if (await hasUncommittedChanges(cwd)) {
    console.log(chalk.yellow('Warning: You have uncommitted changes'));
    console.log(chalk.dim('Consider committing or stashing them before running auto mode'));
    console.log();
  }

  // Validate source
  if (!options.source) {
    console.log(chalk.red('Error: --source is required'));
    console.log(chalk.dim('Use --source github or --source linear'));
    process.exit(1);
  }

  // Validate project for sources that need it
  if (!options.project && options.source !== 'linear') {
    console.log(chalk.red('Error: --project is required for GitHub source'));
    console.log(chalk.dim('Use --project owner/repo'));
    process.exit(1);
  }

  // Detect agent
  spinner.start('Detecting available agent...');
  const agent = await detectBestAgent();
  if (!agent) {
    spinner.fail('No coding agent found');
    console.log(chalk.dim('Install Claude Code: npm i -g @anthropic-ai/claude-code'));
    process.exit(1);
  }
  spinner.succeed(`Using agent: ${chalk.cyan(agent.name)}`);

  // Fetch tasks
  spinner.start(`Fetching tasks from ${options.source}...`);
  let tasks: BatchTask[];
  try {
    tasks = await fetchBatchTasks({
      source: options.source,
      project: options.project,
      label: options.label,
      limit: options.limit || 10,
    });
  } catch (error) {
    spinner.fail(
      `Failed to fetch tasks: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
    process.exit(1);
  }

  if (tasks.length === 0) {
    spinner.succeed('No tasks found matching criteria');
    console.log();
    console.log(chalk.dim('Try adjusting your filters:'));
    console.log(chalk.dim('  --label <name>  Filter by label'));
    console.log(chalk.dim('  --limit <n>     Increase task limit'));
    return;
  }

  spinner.succeed(`Found ${chalk.cyan(tasks.length)} tasks`);
  console.log();

  // Display tasks
  console.log(chalk.bold('Tasks to process:'));
  console.log();
  for (let i = 0; i < tasks.length; i++) {
    const task = tasks[i];
    const labels = task.labels?.length ? chalk.dim(` [${task.labels.join(', ')}]`) : '';
    console.log(`  ${chalk.cyan(`${i + 1}.`)} ${task.title}${labels}`);
    console.log(chalk.dim(`     ${task.url}`));
  }
  console.log();

  // Dry run mode
  if (options.dryRun) {
    console.log(chalk.yellow('Dry run mode - no changes will be made'));
    console.log();
    console.log(chalk.dim('Would execute:'));
    for (const task of tasks) {
      console.log(chalk.dim(`  - Create branch: auto/${task.id}`));
      console.log(chalk.dim(`  - Run agent with task: "${task.title}"`));
      console.log(chalk.dim(`  - Commit changes`));
      if (!options.skipPr) {
        console.log(chalk.dim(`  - Create PR`));
      }
    }
    return;
  }

  // Execute tasks
  console.log(chalk.bold('Starting batch execution...'));
  console.log();

  const results = await executeTaskBatch({
    tasks,
    cwd,
    agent,
    auto: true,
    commit: true,
    push: true,
    pr: !options.skipPr,
    validate: options.validate ?? true,
    maxIterations: options.maxIterations,
    onTaskStart: (task, index) => {
      console.log();
      console.log(chalk.cyan.bold(`Task ${index + 1}/${tasks.length}: ${task.title}`));
      console.log(chalk.dim(`Source: ${task.url}`));
      console.log();
    },
    onTaskComplete: async (task, result, index) => {
      console.log();
      if (result.success) {
        console.log(chalk.green(`Task ${index + 1} completed successfully`));
        if (result.prUrl) {
          console.log(chalk.dim(`PR: ${result.prUrl}`));
        }
        // Mark task as complete in source
        try {
          await completeTask(task, result);
        } catch (error) {
          console.log(
            chalk.yellow(
              `Warning: Could not mark task as complete: ${error instanceof Error ? error.message : 'Unknown error'}`
            )
          );
        }
      } else {
        console.log(chalk.red(`Task ${index + 1} failed: ${result.error}`));
      }
    },
    onTaskFail: (_task, error, index) => {
      console.log();
      console.log(chalk.red(`Task ${index + 1} error: ${error.message}`));
    },
  });

  // Summary
  console.log();
  console.log(chalk.bold('Batch execution complete'));
  console.log();

  const successful = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;

  console.log(`  ${chalk.green('Successful:')} ${successful}`);
  console.log(`  ${chalk.red('Failed:')} ${failed}`);

  if (results.some((r) => r.prUrl)) {
    console.log();
    console.log(chalk.bold('Pull Requests:'));
    for (const result of results) {
      if (result.prUrl) {
        console.log(`  ${chalk.cyan(result.prUrl)}`);
      }
    }
  }

  console.log();
}
