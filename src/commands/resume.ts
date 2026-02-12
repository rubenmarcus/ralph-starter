/**
 * Resume command for ralph-starter
 * Resumes a paused session from where it left off
 */

import chalk from 'chalk';
import ora from 'ora';
import { type LoopOptions, runLoop } from '../loop/executor.js';
import {
  canResume,
  formatSessionSummary,
  getRemainingIterations,
  hasActiveSession,
  loadSession,
  reconstructAgent,
  resumeSession,
} from '../loop/session.js';

export interface ResumeCommandOptions {
  /** Force resume even if session is not paused */
  force?: boolean;
}

/**
 * Run the resume command
 */
export async function resumeCommand(options: ResumeCommandOptions = {}): Promise<void> {
  const cwd = process.cwd();
  const spinner = ora();

  console.log();
  console.log(chalk.cyan.bold('ralph-starter resume'));
  console.log(chalk.dim('Resume a paused session'));
  console.log();

  // Check if there's an active session
  const hasSession = await hasActiveSession(cwd);
  if (!hasSession) {
    console.log(chalk.yellow('  No active session found in this directory.'));
    console.log();
    console.log(chalk.dim('  Sessions are created when you run:'));
    console.log(chalk.dim('    ralph-starter run [task]'));
    console.log(chalk.dim('    ralph-starter auto --source github --label auto-ready'));
    console.log();
    process.exit(1);
  }

  // Load the session
  const session = await loadSession(cwd);
  if (!session) {
    console.log(chalk.red('  Failed to load session data.'));
    process.exit(1);
  }

  // Check if session can be resumed
  if (!canResume(session) && !options.force) {
    console.log(chalk.yellow(`  Session cannot be resumed (status: ${session.status}).`));
    console.log();
    console.log(formatSessionSummary(session));
    console.log();

    if (session.status === 'running') {
      console.log(chalk.dim('  A session is already running.'));
      console.log(chalk.dim('  Use `ralph-starter pause` to pause it first.'));
    } else if (session.status === 'completed') {
      console.log(chalk.dim('  Session has already completed.'));
      console.log(chalk.dim('  Start a new session with `ralph-starter run [task]`.'));
    } else if (session.status === 'failed') {
      console.log(chalk.dim('  Session failed. Use --force to attempt to resume anyway.'));
      console.log(chalk.dim('  Or start a new session with `ralph-starter run [task]`.'));
    }
    console.log();
    process.exit(1);
  }

  // Display session info before resuming
  console.log(chalk.bold('  Session details:'));
  console.log();
  const summaryLines = formatSessionSummary(session).split('\n');
  for (const line of summaryLines) {
    console.log(`    ${line}`);
  }
  console.log();

  // Calculate remaining iterations
  const remainingIterations = getRemainingIterations(session);
  if (remainingIterations === 0) {
    console.log(chalk.yellow('  No remaining iterations.'));
    console.log(chalk.dim('  The session has reached its maximum iteration count.'));
    console.log();
    process.exit(1);
  }

  console.log(chalk.dim(`  Remaining iterations: ${remainingIterations}`));
  console.log();

  // Resume the session
  spinner.start('Resuming session...');
  const resumedSession = await resumeSession(cwd);
  if (!resumedSession) {
    spinner.fail('Failed to resume session');
    process.exit(1);
  }
  spinner.succeed('Session resumed');
  console.log();

  // Reconstruct the agent from session data
  const agent = reconstructAgent(session);

  // Build loop options from session state
  const loopOptions: LoopOptions = {
    task: session.task,
    cwd: session.cwd,
    agent,
    maxIterations: remainingIterations,
    auto: session.options.auto,
    commit: session.options.commit,
    push: session.options.push,
    pr: session.options.pr,
    prTitle: session.options.prTitle,
    validate: session.options.validate,
    completionPromise: session.options.completionPromise,
    requireExitSignal: session.options.requireExitSignal,
    circuitBreaker: session.options.circuitBreaker,
    rateLimit: session.options.rateLimit,
    trackProgress: session.options.trackProgress,
    checkFileCompletion: session.options.checkFileCompletion,
    trackCost: session.options.trackCost,
    model: session.options.model,
  };

  // Run the loop
  console.log(chalk.cyan('  Continuing from iteration'), chalk.bold(session.iteration));
  console.log();

  const result = await runLoop(loopOptions);

  // Print summary
  console.log();
  if (result.success) {
    console.log(chalk.green.bold('  ✓ Session completed successfully!'));
    console.log(chalk.dim(`    Exit reason: ${result.exitReason}`));
    console.log(chalk.dim(`    Total iterations: ${session.iteration + result.iterations}`));
    if (result.commits.length > 0) {
      console.log(chalk.dim(`    New commits: ${result.commits.length}`));
    }
    if (result.stats?.costStats) {
      const cost = result.stats.costStats.totalCost.totalCost;
      console.log(chalk.dim(`    Session cost: $${cost.toFixed(3)}`));
    }
  } else {
    // Check if it's a rate limit issue
    const isRateLimit = result.error?.includes('Rate limit');

    if (isRateLimit) {
      console.log(chalk.yellow.bold('  ⏸ Session paused due to rate limit'));
      console.log();
      console.log(chalk.dim('  To resume later, run:'));
      console.log(chalk.cyan('    ralph-starter resume'));
    } else {
      console.log(chalk.red.bold('  ✗ Session failed'));
      console.log(chalk.dim(`    Exit reason: ${result.exitReason}`));
      if (result.error) {
        console.log(chalk.dim(`    Error: ${result.error}`));
      }
    }
  }
  console.log();
}
