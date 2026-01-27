import chalk from 'chalk';
import ora from 'ora';
import { Agent, runAgent, AgentRunOptions } from './agents.js';
import { gitCommit, gitPush, hasUncommittedChanges, createPullRequest } from '../automation/git.js';
import { detectValidationCommands, runAllValidations, formatValidationFeedback, ValidationResult } from './validation.js';
import { CircuitBreaker, CircuitBreakerConfig } from './circuit-breaker.js';
import { analyzeResponse, hasExitSignal, countCompletionIndicators } from './semantic-analyzer.js';
import { createProgressTracker, checkFileBasedCompletion, ProgressEntry } from './progress.js';
import { RateLimiter, RateLimiterConfig } from './rate-limiter.js';
import { CostTracker, CostTrackerStats, formatCost, formatTokens } from './cost-tracker.js';

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
  // New options
  completionPromise?: string; // Custom completion promise string
  requireExitSignal?: boolean; // Require explicit EXIT_SIGNAL: true
  minCompletionIndicators?: number; // Minimum indicators needed (default: 1)
  circuitBreaker?: Partial<CircuitBreakerConfig>;
  rateLimit?: number; // Calls per hour
  trackProgress?: boolean; // Write to activity.md
  checkFileCompletion?: boolean; // Check for RALPH_COMPLETE file
  trackCost?: boolean; // Track token usage and cost
  model?: string; // Model name for cost estimation
}

export interface LoopResult {
  success: boolean;
  iterations: number;
  commits: string[];
  error?: string;
  exitReason?: 'completed' | 'blocked' | 'max_iterations' | 'circuit_breaker' | 'rate_limit' | 'file_signal';
  stats?: {
    totalDuration: number;
    avgIterationDuration: number;
    validationFailures: number;
    circuitBreakerStats?: {
      consecutiveFailures: number;
      totalFailures: number;
      uniqueErrors: number;
    };
    costStats?: CostTrackerStats;
  };
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

interface CompletionOptions {
  completionPromise?: string;
  requireExitSignal?: boolean;
  minCompletionIndicators?: number;
}

function detectCompletion(
  output: string,
  options: CompletionOptions = {}
): 'done' | 'blocked' | 'continue' {
  const { completionPromise, requireExitSignal = false, minCompletionIndicators = 1 } = options;

  // 1. Check explicit completion promise first (highest priority)
  if (completionPromise && output.includes(completionPromise)) {
    return 'done';
  }

  // 2. Check for <promise>COMPLETE</promise> tag
  if (/<promise>COMPLETE<\/promise>/i.test(output)) {
    return 'done';
  }

  // 3. Use semantic analyzer for more nuanced detection
  const analysis = analyzeResponse(output);

  // Check for blocked status
  if (analysis.stuckScore >= 0.7 && analysis.confidence !== 'low') {
    return 'blocked';
  }

  // Check blocked markers (legacy support)
  const upperOutput = output.toUpperCase();
  for (const marker of BLOCKED_MARKERS) {
    if (upperOutput.includes(marker.toUpperCase())) {
      return 'blocked';
    }
  }

  // Check for explicit EXIT_SIGNAL
  const hasExplicitSignal = hasExitSignal(output);

  // If exit signal is required, check for it
  if (requireExitSignal) {
    if (hasExplicitSignal && analysis.indicators.completion.length >= minCompletionIndicators) {
      return 'done';
    }
    // Continue if no explicit signal
    if (!hasExplicitSignal) {
      return 'continue';
    }
  }

  // Check completion indicators
  if (analysis.completionScore >= 0.7 && analysis.indicators.completion.length >= minCompletionIndicators) {
    return 'done';
  }

  // Explicit exit signals always count
  if (hasExplicitSignal) {
    return 'done';
  }

  // Legacy marker support
  for (const marker of COMPLETION_MARKERS) {
    if (upperOutput.includes(marker.toUpperCase())) {
      return 'done';
    }
  }

  return 'continue';
}

/**
 * Get human-readable reason for completion (UX 3)
 */
function getCompletionReason(output: string, options: CompletionOptions): string {
  const { completionPromise, requireExitSignal } = options;

  // Check explicit completion promise first
  if (completionPromise && output.includes(completionPromise)) {
    return `Found completion promise: "${completionPromise}"`;
  }

  // Check for <promise>COMPLETE</promise> tag
  if (/<promise>COMPLETE<\/promise>/i.test(output)) {
    return 'Found <promise>COMPLETE</promise> marker';
  }

  // Check for explicit EXIT_SIGNAL
  if (hasExitSignal(output)) {
    return 'Found EXIT_SIGNAL: true';
  }

  // Check completion markers
  const upperOutput = output.toUpperCase();
  for (const marker of COMPLETION_MARKERS) {
    if (upperOutput.includes(marker.toUpperCase())) {
      return `Found completion marker: "${marker}"`;
    }
  }

  // Use semantic analysis
  const analysis = analyzeResponse(output);
  if (analysis.completionScore >= 0.7) {
    const indicators = analysis.indicators.completion.slice(0, 3);
    return `Semantic analysis (${Math.round(analysis.completionScore * 100)}% confident): ${indicators.join(', ')}`;
  }

  return 'Task marked as complete by agent';
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
  const startTime = Date.now();
  let validationFailures = 0;
  let exitReason: LoopResult['exitReason'] = 'max_iterations';
  let finalIteration = maxIterations;

  // Initialize circuit breaker
  const circuitBreaker = new CircuitBreaker(options.circuitBreaker);

  // Initialize rate limiter
  const rateLimiter = options.rateLimit
    ? new RateLimiter({ maxCallsPerHour: options.rateLimit })
    : null;

  // Initialize progress tracker
  const progressTracker = options.trackProgress
    ? createProgressTracker(options.cwd, options.task)
    : null;

  // Initialize cost tracker
  const costTracker = options.trackCost
    ? new CostTracker({
        model: options.model || 'claude-3-sonnet',
        maxIterations: maxIterations,
      })
    : null;

  // Detect validation commands if validation is enabled
  const validationCommands = options.validate ? detectValidationCommands(options.cwd) : [];

  // Completion detection options
  const completionOptions: CompletionOptions = {
    completionPromise: options.completionPromise,
    requireExitSignal: options.requireExitSignal,
    minCompletionIndicators: options.minCompletionIndicators,
  };

  console.log();
  console.log(chalk.cyan.bold('Starting Ralph Wiggum Loop'));
  console.log(chalk.dim(`Agent: ${options.agent.name}`));
  console.log(chalk.dim(`Task: ${options.task.slice(0, 60)}${options.task.length > 60 ? '...' : ''}`));
  if (validationCommands.length > 0) {
    console.log(chalk.dim(`Validation: ${validationCommands.map(c => c.name).join(', ')}`));
  }
  if (options.completionPromise) {
    console.log(chalk.dim(`Completion promise: ${options.completionPromise}`));
  }
  if (rateLimiter) {
    console.log(chalk.dim(`Rate limit: ${options.rateLimit}/hour`));
  }
  if (costTracker) {
    console.log(chalk.dim(`Cost tracking: enabled (${options.model || 'claude-3-sonnet'})`));
  }
  console.log();

  for (let i = 1; i <= maxIterations; i++) {
    const iterationStart = Date.now();

    // Check circuit breaker
    if (circuitBreaker.isTripped()) {
      const reason = circuitBreaker.getTripReason();
      spinner.fail(chalk.red(`Circuit breaker tripped: ${reason}`));
      finalIteration = i - 1;
      exitReason = 'circuit_breaker';
      break;
    }

    // Check rate limiter with countdown (UX 10)
    if (rateLimiter && !rateLimiter.canMakeCall()) {
      const waitTimeMs = rateLimiter.getWaitTime();
      const waitTimeSec = Math.ceil(waitTimeMs / 1000);

      console.log(chalk.yellow(`\n⏳ Rate limited. Waiting ${waitTimeSec}s...`));
      console.log(chalk.dim(rateLimiter.formatStats()));

      // Show countdown
      const countdownInterval = setInterval(() => {
        const remaining = rateLimiter.getWaitTime();
        if (remaining > 0) {
          process.stdout.write(chalk.dim(`\r  ⏱  ${Math.ceil(remaining / 1000)}s remaining...  `));
        }
      }, 1000);

      const acquired = await rateLimiter.waitAndAcquire(60000); // Wait up to 1 minute
      clearInterval(countdownInterval);
      process.stdout.write('\r' + ' '.repeat(40) + '\r'); // Clear countdown line

      if (!acquired) {
        console.log(chalk.red('✗ Rate limit timeout - stopping loop'));
        finalIteration = i - 1;
        exitReason = 'rate_limit';
        break;
      }
      console.log(chalk.green('✓ Rate limit cleared, continuing...\n'));
    } else if (rateLimiter) {
      rateLimiter.recordCall();
    }

    // Check for file-based completion signals
    if (options.checkFileCompletion) {
      const fileCompletion = await checkFileBasedCompletion(options.cwd);
      if (fileCompletion.completed) {
        spinner.succeed(chalk.green(`File-based completion: ${fileCompletion.reason}`));
        finalIteration = i - 1;
        exitReason = 'file_signal';
        break;
      }
    }

    // Log iteration warnings
    const progressPercent = (i / maxIterations) * 100;
    if (progressPercent >= 90 && progressPercent < 95) {
      console.log(chalk.yellow(`⚠️  Warning: 90% of iterations used (${i}/${maxIterations})`));
    } else if (progressPercent >= 80 && progressPercent < 85) {
      console.log(chalk.yellow(`⚠️  Warning: 80% of iterations used (${i}/${maxIterations})`));
    }

    // Track progress entry
    let progressEntry: ProgressEntry | null = null;
    if (progressTracker) {
      progressEntry = {
        timestamp: new Date().toISOString(),
        iteration: i,
        status: 'started',
        summary: '',
      };
    }

    // Show loop header
    console.log(chalk.cyan(`\n═══════════════════════════════════════════════════════════════`));
    console.log(chalk.cyan.bold(`  Loop ${i}/${maxIterations} │ Running ${options.agent.name}`));
    console.log(chalk.cyan(`═══════════════════════════════════════════════════════════════\n`));

    // Run the agent with streaming output
    const agentOptions: AgentRunOptions = {
      task: options.task,
      cwd: options.cwd,
      auto: options.auto,
      maxTurns: 10, // Limit turns per loop iteration
      streamOutput: true, // Stream output so user can see progress
    };

    const result = await runAgent(options.agent, agentOptions);

    console.log(); // Newline after streaming output

    // Track cost for this iteration
    if (costTracker) {
      const iterationCost = costTracker.recordIteration(options.task, result.output);
      const stats = costTracker.getStats();
      console.log(chalk.dim(`  💰 Iteration cost: ${formatCost(iterationCost.cost.totalCost)} | Total: ${formatCost(stats.totalCost.totalCost)} (${formatTokens(stats.totalTokens.totalTokens)} tokens)`));
    }

    // Check for completion using enhanced detection
    const status = detectCompletion(result.output, completionOptions);

    if (status === 'blocked') {
      console.log(chalk.red(`✗ Loop ${i}: Task blocked`));
      console.log(chalk.dim(result.output.slice(0, 200)));

      if (progressTracker && progressEntry) {
        progressEntry.status = 'blocked';
        progressEntry.summary = 'Task blocked - cannot continue';
        progressEntry.duration = Date.now() - iterationStart;
        await progressTracker.appendEntry(progressEntry);
      }

      finalIteration = i;
      exitReason = 'blocked';
      return {
        success: false,
        iterations: i,
        commits,
        error: 'Task blocked - cannot continue',
        exitReason,
        stats: {
          totalDuration: Date.now() - startTime,
          avgIterationDuration: (Date.now() - startTime) / i,
          validationFailures,
          circuitBreakerStats: circuitBreaker.getStats(),
          costStats: costTracker?.getStats(),
        },
      };
    }

    // Run validation (backpressure) if enabled and there are changes
    let validationPassed = true;
    let validationResults: ValidationResult[] = [];

    if (validationCommands.length > 0 && await hasUncommittedChanges(options.cwd)) {
      spinner.start(chalk.yellow(`Loop ${i}: Running validation...`));

      validationResults = await runAllValidations(options.cwd, validationCommands);
      const allPassed = validationResults.every(r => r.success);

      if (!allPassed) {
        validationPassed = false;
        validationFailures++;
        const feedback = formatValidationFeedback(validationResults);
        spinner.fail(chalk.red(`Loop ${i}: Validation failed`));

        // Show which validations failed (UX 4: specific validation errors)
        for (const vr of validationResults) {
          if (!vr.success) {
            console.log(chalk.red(`  ✗ ${vr.command}`));
            if (vr.error) {
              const errorLines = vr.error.split('\n').slice(0, 5);
              for (const line of errorLines) {
                console.log(chalk.dim(`    ${line}`));
              }
            } else if (vr.output) {
              const outputLines = vr.output.split('\n').slice(0, 5);
              for (const line of outputLines) {
                console.log(chalk.dim(`    ${line}`));
              }
            }
          }
        }

        // Record failure in circuit breaker
        const errorMsg = validationResults
          .filter(r => !r.success)
          .map(r => r.error?.slice(0, 200) || r.output?.slice(0, 200) || r.command)
          .join('\n');
        const tripped = circuitBreaker.recordFailure(errorMsg);

        if (tripped) {
          const reason = circuitBreaker.getTripReason();
          console.log(chalk.red(`Circuit breaker tripped: ${reason}`));

          if (progressTracker && progressEntry) {
            progressEntry.status = 'failed';
            progressEntry.summary = `Circuit breaker tripped: ${reason}`;
            progressEntry.validationResults = validationResults;
            progressEntry.duration = Date.now() - iterationStart;
            await progressTracker.appendEntry(progressEntry);
          }

          finalIteration = i;
          exitReason = 'circuit_breaker';
          break;
        }

        if (progressTracker && progressEntry) {
          progressEntry.status = 'validation_failed';
          progressEntry.summary = 'Validation failed';
          progressEntry.validationResults = validationResults;
          progressEntry.duration = Date.now() - iterationStart;
          await progressTracker.appendEntry(progressEntry);
        }

        // Continue loop with validation feedback
        options.task = `${options.task}\n\n${feedback}`;
        continue; // Go to next iteration to fix issues
      } else {
        // Validation passed - record success
        spinner.succeed(chalk.green(`Loop ${i}: Validation passed`));
        circuitBreaker.recordSuccess();
      }
    }

    // Auto-commit if enabled and there are changes
    let committed = false;
    let commitMsg = '';
    if (options.commit && await hasUncommittedChanges(options.cwd)) {
      const summary = summarizeChanges(result.output);
      commitMsg = `feat: ${summary}`;

      try {
        await gitCommit(options.cwd, commitMsg);
        commits.push(commitMsg);
        committed = true;
        console.log(chalk.green(`✓ Loop ${i}: Committed - ${commitMsg}`));
      } catch (error) {
        console.log(chalk.yellow(`⚠ Loop ${i}: Completed (commit failed)`));
      }
    } else {
      console.log(chalk.green(`✓ Loop ${i}: Completed`));
    }

    // Update progress entry
    if (progressTracker && progressEntry) {
      progressEntry.status = status === 'done' ? 'completed' : 'completed';
      progressEntry.summary = summarizeChanges(result.output);
      progressEntry.validationResults = validationResults.length > 0 ? validationResults : undefined;
      progressEntry.commitHash = committed ? commitMsg : undefined;
      progressEntry.duration = Date.now() - iterationStart;
      // Add cost info from tracker
      if (costTracker) {
        const lastCost = costTracker.getLastIterationCost();
        if (lastCost) {
          progressEntry.cost = lastCost.cost;
          progressEntry.tokens = lastCost.tokens;
        }
      }
      await progressTracker.appendEntry(progressEntry);
    }

    if (status === 'done') {
      console.log();
      console.log(chalk.green.bold('═══════════════════════════════════════════════════════════════'));
      console.log(chalk.green.bold('  ✓ Task completed successfully!'));
      console.log(chalk.green.bold('═══════════════════════════════════════════════════════════════'));

      // Show completion reason (UX 3: clear completion signals)
      const completionReason = getCompletionReason(result.output, completionOptions);
      console.log(chalk.dim(`  Reason: ${completionReason}`));
      console.log(chalk.dim(`  Iterations: ${i}`));
      if (costTracker) {
        const stats = costTracker.getStats();
        console.log(chalk.dim(`  Total cost: ${formatCost(stats.totalCost.totalCost)}`));
      }
      const duration = Date.now() - startTime;
      const minutes = Math.floor(duration / 60000);
      const seconds = Math.floor((duration % 60000) / 1000);
      console.log(chalk.dim(`  Time: ${minutes}m ${seconds}s`));
      console.log();

      finalIteration = i;
      exitReason = 'completed';
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

  const totalDuration = Date.now() - startTime;

  // Print cost summary if tracking enabled
  if (costTracker) {
    console.log();
    console.log(chalk.cyan('💰 Cost Summary:'));
    console.log(chalk.dim(costTracker.formatStats()));
  }

  return {
    success: exitReason === 'completed' || exitReason === 'file_signal',
    iterations: finalIteration,
    commits,
    exitReason,
    stats: {
      totalDuration,
      avgIterationDuration: totalDuration / finalIteration,
      validationFailures,
      circuitBreakerStats: circuitBreaker.getStats(),
      costStats: costTracker?.getStats(),
    },
  };
}
