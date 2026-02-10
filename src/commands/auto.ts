/**
 * Auto Mode Command
 *
 * Runs ralph-starter in fully autonomous mode, processing multiple tasks
 * from GitHub/Linear with automatic commits and PRs.
 */

import chalk from 'chalk';
import ora from 'ora';
import { hasUncommittedChanges, isGitRepo } from '../automation/git.js';
import {
  type BatchRequest,
  type BatchResult,
  getBatchResults,
  submitBatch,
  waitForBatch,
} from '../llm/batch.js';
import { getProviderKeyFromEnv } from '../llm/providers.js';
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
  /** Use Anthropic Batch API for 50% cost reduction (no tool use) */
  batch?: boolean;
  /** Model to use for batch mode */
  model?: string;
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

  // Batch API mode: submit all tasks to Anthropic Batch API
  if (options.batch) {
    await executeBatchApi(tasks, options);
    return;
  }

  // Execute tasks (standard agent mode)
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

/**
 * Execute tasks via Anthropic Batch API for 50% cost reduction.
 *
 * NOTE: Batch mode uses the API directly (no tool use). Best for
 * planning, code generation, and review — not full agent loops.
 */
async function executeBatchApi(tasks: BatchTask[], options: AutoModeOptions): Promise<void> {
  const spinner = ora();

  // Check for Anthropic API key
  const apiKey = getProviderKeyFromEnv('anthropic');
  if (!apiKey) {
    console.log(chalk.red('Error: ANTHROPIC_API_KEY is required for batch mode'));
    console.log(chalk.dim('Set ANTHROPIC_API_KEY environment variable'));
    process.exit(1);
  }

  console.log(chalk.bold('Batch API mode (50% cost reduction)'));
  console.log(
    chalk.yellow('Note: Batch mode uses the API directly — no tool use or file editing.')
  );
  console.log(chalk.yellow('Best for: planning, code generation, and review tasks.'));
  console.log();

  // Build batch requests
  const batchRequests: BatchRequest[] = tasks.map((task) => ({
    customId: `${task.source}-${task.id}`,
    system:
      'You are an expert software engineer. Analyze the task and provide a detailed implementation plan with code snippets. Do NOT use tools — provide all code inline.',
    prompt: buildBatchTaskPrompt(task),
    model: options.model,
    maxTokens: 4096,
  }));

  // Submit batch
  spinner.start(`Submitting ${batchRequests.length} tasks to Anthropic Batch API...`);
  let batchId: string;
  try {
    batchId = await submitBatch(apiKey, batchRequests);
    spinner.succeed(`Batch submitted: ${chalk.cyan(batchId)}`);
  } catch (error) {
    spinner.fail(
      `Failed to submit batch: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
    process.exit(1);
  }

  // Poll for completion
  console.log();
  console.log(chalk.dim('Waiting for batch to complete (this can take up to 24 hours)...'));
  console.log(chalk.dim('You can safely Ctrl+C and check later with the batch ID above.'));
  console.log();

  try {
    const finalStatus = await waitForBatch(apiKey, batchId, {
      onProgress: (status) => {
        const progress =
          status.totalRequests > 0
            ? Math.round((status.completedRequests / status.totalRequests) * 100)
            : 0;
        process.stdout.write(
          `\r  ${chalk.cyan(`${progress}%`)} completed (${status.completedRequests}/${status.totalRequests} requests)  `
        );
      },
      initialIntervalMs: 10000, // Batch jobs take time, no need to poll fast
      maxIntervalMs: 120000,
    });

    console.log();
    console.log();
    console.log(chalk.green.bold('Batch completed!'));
    console.log(
      chalk.dim(
        `Completed: ${finalStatus.completedRequests}, Failed: ${finalStatus.failedRequests}`
      )
    );
    console.log();

    // Retrieve results
    spinner.start('Retrieving results...');
    const results = await getBatchResults(apiKey, batchId);
    spinner.succeed(`Retrieved ${results.length} results`);
    console.log();

    // Display results
    let totalInputTokens = 0;
    let totalOutputTokens = 0;

    for (const result of results) {
      const task = tasks.find((t) => `${t.source}-${t.id}` === result.customId);
      const taskTitle = task?.title || result.customId;

      if (result.success) {
        console.log(chalk.green(`  ${taskTitle}`));
        if (result.usage) {
          totalInputTokens += result.usage.inputTokens;
          totalOutputTokens += result.usage.outputTokens;
          console.log(
            chalk.dim(
              `    Tokens: ${result.usage.inputTokens} in / ${result.usage.outputTokens} out`
            )
          );
        }
        // Show first 200 chars of content as preview
        if (result.content) {
          const preview = result.content.slice(0, 200).replace(/\n/g, ' ');
          console.log(chalk.dim(`    Preview: ${preview}...`));
        }
      } else {
        console.log(chalk.red(`  ${taskTitle}: ${result.error}`));
      }
    }

    // Cost summary (batch API is 50% off)
    const successful = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    console.log();
    console.log(chalk.bold('Summary:'));
    console.log(`  ${chalk.green('Successful:')} ${successful}`);
    console.log(`  ${chalk.red('Failed:')} ${failed}`);

    if (totalInputTokens > 0 || totalOutputTokens > 0) {
      // Approximate cost at Sonnet pricing with 50% batch discount
      const inputCost = (totalInputTokens / 1_000_000) * 3 * 0.5;
      const outputCost = (totalOutputTokens / 1_000_000) * 15 * 0.5;
      const totalCost = inputCost + outputCost;
      const fullPriceCost = inputCost * 2 + outputCost * 2;

      console.log(`  ${chalk.dim('Tokens:')} ${totalInputTokens} in / ${totalOutputTokens} out`);
      console.log(
        `  ${chalk.dim('Cost:')} $${totalCost.toFixed(4)} (saved $${(fullPriceCost - totalCost).toFixed(4)} vs standard pricing)`
      );
    }

    console.log();
  } catch (error) {
    console.log();
    console.log(
      chalk.red(`Batch polling failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    );
    console.log(
      chalk.dim(
        `You can check the batch status later using the Anthropic API with batch ID: ${batchId}`
      )
    );
    process.exit(1);
  }
}

/**
 * Build a prompt for batch API mode (no tool use).
 */
function buildBatchTaskPrompt(task: BatchTask): string {
  const lines: string[] = [];

  lines.push(`# Task: ${task.title}`);
  lines.push('');
  lines.push(`Source: ${task.url}`);
  lines.push('');

  if (task.labels?.length) {
    lines.push(`Labels: ${task.labels.join(', ')}`);
    lines.push('');
  }

  lines.push('## Description');
  lines.push('');
  lines.push(task.description || '*No description provided*');
  lines.push('');
  lines.push('## Instructions');
  lines.push('');
  lines.push('Analyze the task above and provide:');
  lines.push('1. A clear implementation plan');
  lines.push('2. Complete code for all files that need to be created or modified');
  lines.push('3. Any test code needed');
  lines.push('4. Brief notes on potential edge cases');

  return lines.join('\n');
}
