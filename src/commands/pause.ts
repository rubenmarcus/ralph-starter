/**
 * Pause command for ralph-starter
 * Pauses a running session for later resumption
 */

import chalk from 'chalk';
import {
  formatSessionSummary,
  hasActiveSession,
  loadSession,
  pauseSession,
} from '../loop/session.js';

export interface PauseCommandOptions {
  reason?: string;
}

/**
 * Run the pause command
 */
export async function pauseCommand(options: PauseCommandOptions): Promise<void> {
  const cwd = process.cwd();

  console.log();

  // Check if there's an active session
  const hasSession = await hasActiveSession(cwd);
  if (!hasSession) {
    console.log(chalk.yellow('  No active session found in this directory.'));
    console.log();
    console.log(chalk.dim('  Sessions are created when you run:'));
    console.log(chalk.dim('    ralph-starter run [task]'));
    console.log();
    process.exit(1);
  }

  // Load the session to check its status
  const session = await loadSession(cwd);
  if (!session) {
    console.log(chalk.red('  Failed to load session data.'));
    process.exit(1);
  }

  if (session.status === 'paused') {
    console.log(chalk.yellow('  Session is already paused.'));
    console.log();
    console.log(formatSessionSummary(session));
    console.log();
    console.log(chalk.dim('  To resume, run:'));
    console.log(chalk.dim('    ralph-starter resume'));
    console.log();
    process.exit(0);
  }

  if (session.status !== 'running') {
    console.log(chalk.yellow(`  Session is not running (status: ${session.status}).`));
    console.log();
    console.log(chalk.dim('  Only running sessions can be paused.'));
    console.log();
    process.exit(1);
  }

  // Pause the session
  const pausedSession = await pauseSession(cwd, options.reason);
  if (!pausedSession) {
    console.log(chalk.red('  Failed to pause session.'));
    process.exit(1);
  }

  console.log(chalk.green('  ✓ Session paused successfully'));
  console.log();
  console.log(formatSessionSummary(pausedSession));
  console.log();
  console.log(chalk.bold('  To resume later, run:'));
  console.log(chalk.cyan('    ralph-starter resume'));
  console.log();

  if (options.reason) {
    console.log(chalk.dim(`  Pause reason: ${options.reason}`));
    console.log();
  }
}
