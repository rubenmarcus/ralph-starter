import chalk from 'chalk';
import ora from 'ora';
import { Agent, runAgent, AgentRunOptions } from './agents.js';
import { gitCommit, gitPush, hasUncommittedChanges, createPullRequest } from '../automation/git.js';
import { detectValidationCommands, runAllValidations, formatValidationFeedback } from './validation.js';

export interface LoopOptions {
  task: string;
  cwd: string;
  agent: Agent;
  maxIterations?: number;
  auto?: boolean;
  commit?: boolean;
  push?: boolean;
  pr?: boolean;
  prTitle?: string;
  validate?: boolean; // Run tests/lint/build as backpressure
}

export interface LoopResult {
  success: boolean;
  iterations: number;
  commits: string[];
  error?: string;
}

// Completion markers that indicate the task is done
const COMPLETION_MARKERS = [
  '<TASK_DONE>',
  '<TASK_COMPLETE>',
  'TASK COMPLETED',
  'All tasks completed',
  'Successfully completed',
];

// Blocked markers that indicate the task cannot continue
const BLOCKED_MARKERS = [
  '<TASK_BLOCKED>',
  'TASK BLOCKED',
  'Cannot proceed',
  'Blocked:',
];

function detectCompletion(output: string): 'done' | 'blocked' | 'continue' {
  const upperOutput = output.toUpperCase();

  for (const marker of BLOCKED_MARKERS) {
    if (upperOutput.includes(marker.toUpperCase())) {
      return 'blocked';
    }
  }

  for (const marker of COMPLETION_MARKERS) {
    if (upperOutput.includes(marker.toUpperCase())) {
      return 'done';
    }
  }

  return 'continue';
}

function summarizeChanges(output: string): string {
  // Try to extract a meaningful summary from the output
  const lines = output.split('\n').filter(l => l.trim());

  // Look for common patterns
  for (const line of lines) {
    if (line.includes('Created') || line.includes('Added') || line.includes('Updated')) {
      return line.slice(0, 50).trim();
    }
  }

  // Fallback to first meaningful line
  return lines[0]?.slice(0, 50) || 'Update from ralph loop';
}

export async function runLoop(options: LoopOptions): Promise<LoopResult> {
  const spinner = ora();
  const maxIterations = options.maxIterations || 50;
  const commits: string[] = [];

  // Detect validation commands if validation is enabled
  const validationCommands = options.validate ? detectValidationCommands(options.cwd) : [];

  console.log();
  console.log(chalk.cyan.bold('Starting Ralph Wiggum Loop'));
  console.log(chalk.dim(`Agent: ${options.agent.name}`));
  console.log(chalk.dim(`Task: ${options.task.slice(0, 60)}${options.task.length > 60 ? '...' : ''}`));
  if (validationCommands.length > 0) {
    console.log(chalk.dim(`Validation: ${validationCommands.map(c => c.name).join(', ')}`));
  }
  console.log();

  for (let i = 1; i <= maxIterations; i++) {
    spinner.start(chalk.yellow(`Loop ${i}/${maxIterations}: Running ${options.agent.name}...`));

    // Run the agent
    const agentOptions: AgentRunOptions = {
      task: options.task,
      cwd: options.cwd,
      auto: options.auto,
      maxTurns: 10, // Limit turns per loop iteration
    };

    const result = await runAgent(options.agent, agentOptions);

    // Check for completion
    const status = detectCompletion(result.output);

    if (status === 'blocked') {
      spinner.fail(chalk.red(`Loop ${i}: Task blocked`));
      console.log(chalk.dim(result.output.slice(0, 200)));
      return {
        success: false,
        iterations: i,
        commits,
        error: 'Task blocked - cannot continue',
      };
    }

    // Run validation (backpressure) if enabled and there are changes
    if (validationCommands.length > 0 && await hasUncommittedChanges(options.cwd)) {
      spinner.text = chalk.yellow(`Loop ${i}: Running validation...`);

      const validationResults = await runAllValidations(options.cwd, validationCommands);
      const allPassed = validationResults.every(r => r.success);

      if (!allPassed) {
        const feedback = formatValidationFeedback(validationResults);
        spinner.fail(chalk.red(`Loop ${i}: Validation failed`));

        // Continue loop with validation feedback
        options.task = `${options.task}\n\n${feedback}`;
        continue; // Go to next iteration to fix issues
      }
    }

    // Auto-commit if enabled and there are changes
    if (options.commit && await hasUncommittedChanges(options.cwd)) {
      const summary = summarizeChanges(result.output);
      const commitMsg = `feat: ${summary}`;

      try {
        await gitCommit(options.cwd, commitMsg);
        commits.push(commitMsg);
        spinner.succeed(chalk.green(`Loop ${i}: Committed - ${commitMsg}`));
      } catch (error) {
        spinner.warn(chalk.yellow(`Loop ${i}: Completed (commit failed)`));
      }
    } else {
      spinner.succeed(chalk.green(`Loop ${i}: Completed`));
    }

    if (status === 'done') {
      console.log();
      console.log(chalk.green.bold('Task completed successfully!'));
      break;
    }

    // Small delay between iterations
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Post-loop actions
  if (options.push && commits.length > 0) {
    spinner.start('Pushing to remote...');
    try {
      await gitPush(options.cwd);
      spinner.succeed('Pushed to remote');
    } catch (error) {
      spinner.fail('Failed to push');
    }
  }

  if (options.pr && commits.length > 0) {
    spinner.start('Creating pull request...');
    try {
      const prUrl = await createPullRequest(options.cwd, {
        title: options.prTitle || `Ralph: ${options.task.slice(0, 50)}`,
        body: `Automated PR created by ralph-starter\n\n## Task\n${options.task}\n\n## Commits\n${commits.map(c => `- ${c}`).join('\n')}`,
      });
      spinner.succeed(`Created PR: ${prUrl}`);
    } catch (error) {
      spinner.fail('Failed to create PR');
    }
  }

  return {
    success: true,
    iterations: maxIterations,
    commits,
  };
}
