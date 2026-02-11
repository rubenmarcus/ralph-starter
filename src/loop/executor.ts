import { readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';
import chalk from 'chalk';
import ora from 'ora';
import {
  createPullRequest,
  formatPrBody,
  generateSemanticPrTitle,
  getCurrentBranch,
  gitCommit,
  gitPush,
  hasUncommittedChanges,
  type IssueRef,
  type SemanticPrType,
} from '../automation/git.js';
import { drawBox, drawSeparator, getTerminalWidth } from '../ui/box.js';
import { ProgressRenderer } from '../ui/progress-renderer.js';
import {
  displayRateLimitStats,
  parseRateLimitFromOutput,
  type RateLimitInfo,
  type SessionContext,
} from '../utils/rate-limit-display.js';
import { type Agent, type AgentRunOptions, runAgent } from './agents.js';
import { CircuitBreaker, type CircuitBreakerConfig } from './circuit-breaker.js';
import { buildIterationContext, compressValidationFeedback } from './context-builder.js';
import { CostTracker, type CostTrackerStats, formatCost } from './cost-tracker.js';
import { estimateLoop, formatEstimateDetailed } from './estimator.js';
import { checkFileBasedCompletion, createProgressTracker, type ProgressEntry } from './progress.js';
import { RateLimiter } from './rate-limiter.js';
import { analyzeResponse, hasExitSignal } from './semantic-analyzer.js';
import { detectClaudeSkills, formatSkillsForPrompt } from './skills.js';
import { detectStepFromOutput } from './step-detector.js';
import { getCurrentTask, parsePlanTasks } from './task-counter.js';
import {
  detectValidationCommands,
  formatValidationFeedback,
  runAllValidations,
  type ValidationResult,
} from './validation.js';

/**
 * Sleep for a given number of milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Truncate text to fit within available width
 */
function truncateToFit(text: string, maxWidth: number): string {
  if (text.length <= maxWidth) return text;
  return `${text.slice(0, maxWidth - 3)}...`;
}

/**
 * Get a compact icon for the task source integration
 */
function getSourceIcon(source?: string): string {
  switch (source?.toLowerCase()) {
    case 'github':
      return '';
    case 'linear':
      return '◫';
    case 'figma':
      return '◆';
    case 'notion':
      return '▤';
    case 'file':
    case 'pdf':
      return '▫';
    case 'url':
      return '◎';
    default:
      return '▸';
  }
}

/**
 * Strip markdown and list formatting from task names
 */
function cleanTaskName(name: string): string {
  let cleaned = name
    .replace(/\*\*/g, '') // Remove bold **
    .replace(/\*/g, '') // Remove italic *
    .replace(/`/g, '') // Remove code backticks
    .replace(/^\d+\.\s+/, '') // Remove numbered list prefix (1. )
    .replace(/^[-*]\s+/, '') // Remove bullet list prefix (- or * )
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Convert [text](url) to text
    .replace(/\s+/g, ' ') // Collapse whitespace
    .trim();

  // Loop HTML tag removal to handle nested/incomplete tags like <scr<script>ipt>
  let prev: string;
  do {
    prev = cleaned;
    cleaned = cleaned.replace(/<[^>]+>/g, '');
  } while (cleaned !== prev);

  return cleaned;
}

/**
 * Get the latest modification time in a directory (recursive)
 */
async function getLatestMtime(dir: string): Promise<number> {
  let latestMtime = 0;

  try {
    const entries = await readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      // Skip hidden files, node_modules, and .git
      if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;

      const fullPath = join(dir, entry.name);

      try {
        const stats = await stat(fullPath);

        if (stats.mtimeMs > latestMtime) {
          latestMtime = stats.mtimeMs;
        }

        if (entry.isDirectory()) {
          const subMtime = await getLatestMtime(fullPath);
          if (subMtime > latestMtime) {
            latestMtime = subMtime;
          }
        }
      } catch {
        // Ignore stat errors (file might have been deleted)
      }
    }
  } catch {
    // Ignore readdir errors
  }

  return latestMtime;
}

/**
 * Wait for filesystem to settle (no new writes)
 */
async function waitForFilesystemQuiescence(dir: string, timeoutMs = 3000): Promise<void> {
  const startTime = Date.now();
  let lastMtime = 0;

  while (Date.now() - startTime < timeoutMs) {
    const currentMtime = await getLatestMtime(dir);

    if (currentMtime === lastMtime && lastMtime > 0) {
      // No changes for 500ms, check again
      await sleep(500);
      const afterWait = await getLatestMtime(dir);
      if (afterWait === currentMtime) {
        return; // Filesystem is stable
      }
    }

    lastMtime = currentMtime;
    await sleep(100);
  }
}

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
  prLabels?: string[]; // Labels to apply to PR
  prIssueRef?: IssueRef; // Issue to link in PR body
  prType?: SemanticPrType; // Type for semantic PR title
  validate?: boolean; // Run tests/lint/build as backpressure
  sourceType?: string; // Source integration type (github, linear, figma, notion, file)
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
  contextBudget?: number; // Max input tokens per iteration (0 = unlimited)
}

export interface LoopResult {
  success: boolean;
  iterations: number;
  commits: string[];
  error?: string;
  exitReason?:
    | 'completed'
    | 'blocked'
    | 'max_iterations'
    | 'circuit_breaker'
    | 'rate_limit'
    | 'file_signal';
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
const BLOCKED_MARKERS = ['<TASK_BLOCKED>', 'TASK BLOCKED', 'Cannot proceed', 'Blocked:'];

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
  if (
    analysis.completionScore >= 0.7 &&
    analysis.indicators.completion.length >= minCompletionIndicators
  ) {
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
  const { completionPromise } = options;

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
  const lines = output.split('\n').filter((l) => l.trim());

  // If output is JSONL (from Claude Code --output-format stream-json), extract text
  const textContent: string[] = [];
  for (const line of lines) {
    if (line.startsWith('{')) {
      try {
        const parsed = JSON.parse(line);
        // Extract text from result message (final summary)
        if (parsed.type === 'result' && parsed.result) {
          return parsed.result.slice(0, 100);
        }
        // Extract text from assistant messages
        if (parsed.type === 'assistant' && parsed.message?.content) {
          const content = parsed.message.content;
          if (Array.isArray(content)) {
            for (const block of content) {
              if (block.type === 'text' && block.text) {
                textContent.push(block.text);
              }
            }
          }
        }
      } catch {
        // Not valid JSON, treat as regular text
      }
    } else {
      // Regular text line - check for action patterns
      if (line.includes('Created') || line.includes('Added') || line.includes('Updated')) {
        return line.slice(0, 100).trim();
      }
      textContent.push(line);
    }
  }

  // Return last meaningful text content (usually the summary)
  const lastText = textContent[textContent.length - 1];
  if (lastText) {
    return lastText.slice(0, 100).trim();
  }

  return 'Update from ralph loop';
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

  // Detect Claude Code skills
  const detectedSkills = detectClaudeSkills(options.cwd);
  let taskWithSkills = options.task;
  if (detectedSkills.length > 0) {
    const skillsPrompt = formatSkillsForPrompt(detectedSkills);
    taskWithSkills = `${options.task}\n\n${skillsPrompt}`;
  }

  // Completion detection options
  const completionOptions: CompletionOptions = {
    completionPromise: options.completionPromise,
    requireExitSignal: options.requireExitSignal,
    minCompletionIndicators: options.minCompletionIndicators,
  };

  // Get initial task count for estimates
  const initialTaskCount = parsePlanTasks(options.cwd);

  // Show startup summary box
  const startupLines: string[] = [];
  startupLines.push(chalk.cyan.bold('  Ralph-Starter'));
  startupLines.push(`  Agent:       ${chalk.white(options.agent.name)}`);
  startupLines.push(`  Max loops:   ${chalk.white(String(maxIterations))}`);
  if (validationCommands.length > 0) {
    startupLines.push(
      `  Validation:  ${chalk.white(validationCommands.map((c) => c.name).join(', '))}`
    );
  }
  if (options.commit) {
    startupLines.push(`  Auto-commit: ${chalk.green('enabled')}`);
  }
  if (detectedSkills.length > 0) {
    startupLines.push(`  Skills:      ${chalk.white(`${detectedSkills.length} detected`)}`);
  }
  if (rateLimiter) {
    startupLines.push(`  Rate limit:  ${chalk.white(`${options.rateLimit}/hour`)}`);
  }

  console.log();
  console.log(drawBox(startupLines, { color: chalk.cyan }));

  // Show task count and estimates if we have tasks
  if (initialTaskCount.total > 0) {
    console.log(
      chalk.dim(
        `  Tasks: ${initialTaskCount.pending} pending, ${initialTaskCount.completed} completed`
      )
    );

    // Show estimate
    const estimate = estimateLoop(initialTaskCount);
    console.log();
    for (const line of formatEstimateDetailed(estimate)) {
      console.log(chalk.dim(`  ${line}`));
    }
  } else {
    console.log(
      chalk.dim(`  Task: ${options.task.slice(0, 60)}${options.task.length > 60 ? '...' : ''}`)
    );
  }
  console.log();

  // Track completed tasks to show progress diff between iterations
  let previousCompletedTasks = initialTaskCount.completed;

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
      process.stdout.write(`\r${' '.repeat(40)}\r`); // Clear countdown line

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

    // Get current task from implementation plan (re-parse to catch updates)
    const currentTask = getCurrentTask(options.cwd);
    const taskInfo = parsePlanTasks(options.cwd);
    const totalTasks = taskInfo.total;
    const completedTasks = taskInfo.completed;

    // Check if tasks were completed since last iteration
    const newlyCompleted = completedTasks - previousCompletedTasks;
    if (newlyCompleted > 0 && i > 1) {
      // Get names of newly completed tasks (strip markdown)
      const maxNameWidth = Math.max(30, getTerminalWidth() - 30);
      const completedNames = taskInfo.tasks
        .filter((t) => t.completed && t.index >= previousCompletedTasks && t.index < completedTasks)
        .map((t) => truncateToFit(cleanTaskName(t.name), maxNameWidth));

      if (completedNames.length > 0) {
        console.log(
          chalk.green(`  ✓ Completed ${newlyCompleted} task(s): ${completedNames.join(', ')}`)
        );
      }
    }
    previousCompletedTasks = completedTasks;

    // Show loop header with task info
    const sourceIcon = getSourceIcon(options.sourceType);
    const headerLines: string[] = [];
    const boxWidth = Math.min(60, getTerminalWidth() - 4);
    const innerWidth = boxWidth - 2;
    if (currentTask && totalTasks > 0) {
      const taskNum = completedTasks + 1;
      const cleanName = cleanTaskName(currentTask.name);
      const prefix = `  ${sourceIcon} Task ${taskNum}/${totalTasks} │ `;
      const available = innerWidth - prefix.length;
      if (available > 0) {
        const taskName = truncateToFit(cleanName, Math.max(8, available));
        headerLines.push(`${prefix}${chalk.white.bold(taskName)}`);
      } else {
        headerLines.push(truncateToFit(`${prefix}${cleanName}`, innerWidth));
      }
      headerLines.push(
        chalk.dim(truncateToFit(`  ${options.agent.name} │ Iter ${i}/${maxIterations}`, innerWidth))
      );
    } else {
      const fallbackLine = `  ${sourceIcon} Loop ${i}/${maxIterations} │ Running ${options.agent.name}`;
      headerLines.push(chalk.white.bold(truncateToFit(fallbackLine, innerWidth)));
    }
    console.log();
    console.log(drawBox(headerLines, { color: chalk.cyan, width: boxWidth }));
    console.log();

    // Create progress renderer for this iteration
    const iterProgress = new ProgressRenderer();
    iterProgress.start('Working...');
    iterProgress.updateProgress(i, maxIterations, costTracker?.getStats()?.totalCost?.totalCost);

    // Build iteration-specific task with smart context windowing
    const builtContext = buildIterationContext({
      fullTask: options.task,
      taskWithSkills,
      currentTask,
      taskInfo,
      iteration: i,
      maxIterations,
      validationFeedback: undefined, // Validation feedback handled separately below
      maxInputTokens: options.contextBudget || 0,
    });
    const iterationTask = builtContext.prompt;

    // Debug: log context builder output
    if (process.env.RALPH_DEBUG) {
      console.error(`[DEBUG] Context: ${builtContext.debugInfo}`);
      console.error(`[DEBUG] Trimmed: ${builtContext.wasTrimmed}`);
    }

    // Debug: log the prompt being sent
    if (process.env.RALPH_DEBUG) {
      console.error('\n[DEBUG] === LOOP ITERATION START ===');
      console.error('[DEBUG] Task prompt length:', iterationTask.length);
      console.error(
        '[DEBUG] Task prompt preview:',
        iterationTask.slice(0, 300).replace(/\n/g, '\\n')
      );
      console.error('[DEBUG] Agent:', options.agent.name, '| Auto:', options.auto);
    }

    // Run the agent with step detection (include skills in task)
    // NOTE: Don't use maxTurns - it can cause issues. Let agent complete naturally.
    const agentOptions: AgentRunOptions = {
      task: iterationTask,
      cwd: options.cwd,
      auto: options.auto,
      // maxTurns removed - was causing issues, match wizard behavior
      streamOutput: !!process.env.RALPH_DEBUG, // Show raw JSON when debugging
      onOutput: (line: string) => {
        const step = detectStepFromOutput(line);
        if (step) {
          iterProgress.updateStep(step);
        }
        // Debug: log each output line
        if (process.env.RALPH_DEBUG) {
          console.error('[DEBUG] Output:', line.slice(0, 200));
        }
      },
    };

    const startAgentTime = Date.now();
    const result = await runAgent(options.agent, agentOptions);

    // Debug: log agent completion
    if (process.env.RALPH_DEBUG) {
      const duration = Date.now() - startAgentTime;
      console.error('\n[DEBUG] === AGENT COMPLETED ===');
      console.error('[DEBUG] Duration:', duration, 'ms');
      console.error('[DEBUG] Exit code:', result.exitCode);
      console.error('[DEBUG] Output length:', result.output.length);
      console.error('[DEBUG] Output preview:', result.output.slice(0, 500).replace(/\n/g, '\\n'));
    }

    iterProgress.stop('Iteration complete');

    // Track cost for this iteration (silent - summary shown at end)
    if (costTracker) {
      costTracker.recordIteration(options.task, result.output);
    }

    // Check for completion using enhanced detection
    let status = detectCompletion(result.output, completionOptions);

    // Verify completion - check if files were actually changed
    if (status === 'done' && i === 1) {
      // On first iteration, verify that files were actually created/modified
      const hasChanges = await hasUncommittedChanges(options.cwd);
      if (!hasChanges) {
        console.log(chalk.yellow('  Agent reported done but no files changed - continuing...'));
        status = 'continue';
      } else {
        // Wait for filesystem to settle before declaring done
        await waitForFilesystemQuiescence(options.cwd, 2000);
      }
    }

    // In build mode, don't allow completion while plan tasks remain
    if (status === 'done' && options.task.includes('IMPLEMENTATION_PLAN.md')) {
      const latestTaskInfo = parsePlanTasks(options.cwd);
      if (latestTaskInfo.pending > 0) {
        console.log(
          chalk.yellow(
            `  Agent reported done but ${latestTaskInfo.pending} task(s) remain - continuing...`
          )
        );
        status = 'continue';
      }
    }

    if (status === 'blocked') {
      // Detect specific block reasons for better user feedback
      const output = result.output.toLowerCase();
      const isRateLimit =
        output.includes('rate limit') ||
        output.includes('usage limit') ||
        output.includes('100%') ||
        output.includes('exceeded') ||
        output.includes('too many requests');
      const isPermission =
        output.includes('permission') || output.includes('unauthorized') || output.includes('403');

      console.log();
      if (isRateLimit) {
        // Parse rate limit info from output
        const rateLimitInfo = parseRateLimitFromOutput(result.output);

        // Build session context for display
        const taskCount = parsePlanTasks(options.cwd);
        let currentBranch: string | undefined;
        try {
          currentBranch = await getCurrentBranch(options.cwd);
        } catch {
          // Ignore branch detection errors
        }
        const currentTask = getCurrentTask(options.cwd);

        const sessionContext: SessionContext = {
          tasksCompleted: taskCount.completed,
          totalTasks: taskCount.total,
          currentTask: currentTask?.name,
          branch: currentBranch,
          iterations: i,
        };

        // Display detailed rate limit stats
        displayRateLimitStats(rateLimitInfo, taskCount.total > 0 ? sessionContext : undefined);
      } else if (isPermission) {
        console.log(chalk.red.bold('  ⚠ Permission denied'));
        console.log();
        console.log(chalk.yellow('  Claude Code requires permission to continue.'));
        console.log(chalk.dim('  Run with --no-auto to approve permissions interactively.'));
      } else {
        console.log(chalk.red(`  ✗ Task blocked - cannot continue`));
        console.log();
        console.log(chalk.dim('  The AI agent was blocked from continuing.'));
        console.log(chalk.dim('  This may be due to rate limits or permissions.'));
      }
      console.log();

      if (progressTracker && progressEntry) {
        progressEntry.status = 'blocked';
        progressEntry.summary = isRateLimit
          ? 'Rate limit reached'
          : isPermission
            ? 'Permission denied'
            : 'Task blocked';
        progressEntry.duration = Date.now() - iterationStart;
        await progressTracker.appendEntry(progressEntry);
      }

      finalIteration = i;
      exitReason = 'blocked';
      return {
        success: false,
        iterations: i,
        commits,
        error: isRateLimit
          ? 'Rate limit reached - wait and try again'
          : isPermission
            ? 'Permission denied'
            : 'Task blocked - cannot continue',
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
    let _validationPassed = true;
    let validationResults: ValidationResult[] = [];

    if (validationCommands.length > 0 && (await hasUncommittedChanges(options.cwd))) {
      spinner.start(chalk.yellow(`Loop ${i}: Running validation...`));

      validationResults = await runAllValidations(options.cwd, validationCommands);
      const allPassed = validationResults.every((r) => r.success);

      if (!allPassed) {
        _validationPassed = false;
        validationFailures++;
        const feedback = formatValidationFeedback(validationResults);
        spinner.fail(chalk.red(`Loop ${i}: Validation failed`));

        // Show compact validation summary
        const failedSummaries: string[] = [];
        for (const vr of validationResults) {
          if (!vr.success) {
            const errorText = vr.error || vr.output || '';
            const failCount = (errorText.match(/fail/gi) || []).length;
            const errorCount = (errorText.match(/error/gi) || []).length;
            const hint =
              failCount > 0
                ? `${failCount} failures`
                : errorCount > 0
                  ? `${errorCount} errors`
                  : 'failed';
            failedSummaries.push(`${vr.command} (${hint})`);
          }
        }
        console.log(chalk.red(`  ✗ ${failedSummaries.join(' │ ')}`));

        // Record failure in circuit breaker
        const errorMsg = validationResults
          .filter((r) => !r.success)
          .map((r) => r.error?.slice(0, 200) || r.output?.slice(0, 200) || r.command)
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

        // Continue loop with compressed validation feedback
        const compressedFeedback = compressValidationFeedback(feedback);
        taskWithSkills = `${taskWithSkills}\n\n${compressedFeedback}`;
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

    // Get current task info for display (re-parse to catch updates from agent)
    const displayTaskInfo = parsePlanTasks(options.cwd);
    // Show the task number we just worked on (completed count after this iteration)
    const currentTaskNum = Math.min(displayTaskInfo.completed + 1, displayTaskInfo.total);
    const iterationLabel =
      displayTaskInfo.total > 0
        ? `Task ${currentTaskNum}/${displayTaskInfo.total}`
        : `Iteration ${i}`;

    if (options.commit && (await hasUncommittedChanges(options.cwd))) {
      const summary = summarizeChanges(result.output);
      commitMsg = `feat: ${summary}`;

      try {
        await gitCommit(options.cwd, commitMsg);
        commits.push(commitMsg);
        committed = true;
        console.log(chalk.green(`✓ ${iterationLabel}: Committed - ${commitMsg}`));
      } catch (_error) {
        console.log(chalk.yellow(`⚠ ${iterationLabel}: Completed (commit failed)`));
      }
    } else {
      console.log(chalk.green(`✓ ${iterationLabel}: Completed`));
    }

    // Update progress entry
    if (progressTracker && progressEntry) {
      progressEntry.status = status === 'done' ? 'completed' : 'completed';
      progressEntry.summary = summarizeChanges(result.output);
      progressEntry.validationResults =
        validationResults.length > 0 ? validationResults : undefined;
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
      const completionReason = getCompletionReason(result.output, completionOptions);
      const duration = Date.now() - startTime;
      const minutes = Math.floor(duration / 60000);
      const seconds = Math.floor((duration % 60000) / 1000);

      const completionLines: string[] = [];
      completionLines.push(chalk.green.bold('  ✓ Task completed successfully'));
      const details: string[] = [`Iterations: ${i}`, `Time: ${minutes}m ${seconds}s`];
      if (costTracker) {
        const stats = costTracker.getStats();
        details.push(`Cost: ${formatCost(stats.totalCost.totalCost)}`);
      }
      completionLines.push(chalk.dim(`  ${details.join(' │ ')}`));
      completionLines.push(chalk.dim(`  Reason: ${completionReason}`));

      console.log();
      console.log(drawBox(completionLines, { color: chalk.green }));
      console.log();

      finalIteration = i;
      exitReason = 'completed';
      break;
    }

    // Status separator between iterations
    const elapsed = Date.now() - startTime;
    const elapsedMin = Math.floor(elapsed / 60000);
    const elapsedSec = Math.floor((elapsed % 60000) / 1000);
    const costLabel = costTracker
      ? ` │ ${formatCost(costTracker.getStats().totalCost.totalCost)}`
      : '';
    const taskLabel = completedTasks > 0 ? ` │ Tasks: ${completedTasks}/${totalTasks}` : '';
    console.log(
      drawSeparator(
        `Iter ${i}/${maxIterations}${taskLabel}${costLabel} │ ${elapsedMin}m ${elapsedSec}s`
      )
    );

    // Small delay between iterations
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  // Post-loop actions
  if (options.push && commits.length > 0) {
    spinner.start('Pushing to remote...');
    try {
      await gitPush(options.cwd);
      spinner.succeed('Pushed to remote');
    } catch (_error) {
      spinner.fail('Failed to push');
    }
  }

  if (options.pr && commits.length > 0) {
    spinner.start('Creating pull request...');
    try {
      // Generate semantic title if not provided
      const prTitle =
        options.prTitle ||
        generateSemanticPrTitle(options.task, {
          type: options.prType,
          scope: 'auto',
          isBuildMode: options.task.includes('IMPLEMENTATION_PLAN.md'),
        });

      // Format PR body with issue linking
      const prBody = formatPrBody({
        task: options.task,
        commits,
        issueRef: options.prIssueRef,
        iterations: finalIteration,
      });

      // Determine labels - always include AUTO for auto mode
      const labels = [...(options.prLabels || [])];
      if (options.auto && !labels.includes('AUTO')) {
        labels.push('AUTO');
      }

      const prUrl = await createPullRequest(options.cwd, {
        title: prTitle,
        body: prBody,
        labels: labels.length > 0 ? labels : undefined,
      });
      spinner.succeed(`Created PR: ${prUrl}`);
    } catch (_error) {
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
