import { execSync } from 'node:child_process';
import { appendFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import { readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';
import chalk from 'chalk';
import ora from 'ora';
import {
  createPullRequest,
  formatPrBody,
  generateSemanticPrTitle,
  getCurrentBranch,
  getHeadCommitHash,
  gitCommit,
  gitPush,
  hasIterationChanges,
  hasUncommittedChanges,
  type IssueRef,
  type SemanticPrType,
} from '../automation/git.js';
import { drawBox, drawSeparator, getTerminalWidth } from '../ui/box.js';
import { ProgressRenderer } from '../ui/progress-renderer.js';
import {
  displayRateLimitStats,
  parseRateLimitFromOutput,
  type SessionContext,
} from '../utils/rate-limit-display.js';
import { type Agent, type AgentRunOptions, runAgent } from './agents.js';
import { CircuitBreaker, type CircuitBreakerConfig } from './circuit-breaker.js';
import { buildIterationContext, buildSpecSummary } from './context-builder.js';
import { CostTracker, type CostTrackerStats, formatCost } from './cost-tracker.js';
import { estimateLoop, formatEstimateDetailed } from './estimator.js';
import { checkFileBasedCompletion, createProgressTracker, type ProgressEntry } from './progress.js';
import { RateLimiter } from './rate-limiter.js';
import { analyzeResponse, hasExitSignal } from './semantic-analyzer.js';
import { detectClaudeSkills, formatSkillsForPrompt } from './skills.js';
import { detectStepFromOutput } from './step-detector.js';
import { getCurrentTask, MAX_ESTIMATED_ITERATIONS, parsePlanTasks } from './task-counter.js';
import {
  detectBuildCommands,
  detectLintCommands,
  detectValidationCommands,
  formatValidationFeedback,
  runAllValidations,
  runBuildValidation,
  runLintValidation,
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
 * Filesystem snapshot for git-independent change detection.
 * Counts files and total bytes, skipping node_modules/.git/hidden dirs.
 */
async function getFilesystemSnapshot(
  dir: string
): Promise<{ fileCount: number; totalSize: number }> {
  let fileCount = 0;
  let totalSize = 0;

  async function walk(currentDir: string): Promise<void> {
    try {
      const entries = await readdir(currentDir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;
        const fullPath = join(currentDir, entry.name);
        try {
          const stats = await stat(fullPath);
          if (entry.isDirectory()) {
            await walk(fullPath);
          } else {
            fileCount++;
            totalSize += stats.size;
          }
        } catch {
          // File may have been deleted during walk
        }
      }
    } catch {
      // Directory unreadable
    }
  }

  await walk(dir);
  return { fileCount, totalSize };
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
  validationWarmup?: number; // Skip validation until N tasks completed (for greenfield builds)
  maxCost?: number; // Maximum cost in USD before stopping (0 = unlimited)
  agentTimeout?: number; // Agent timeout in milliseconds (default: 300000 = 5 min)
  initialValidationFeedback?: string; // Pre-populate with errors (used by `fix` command)
  maxSkills?: number; // Cap skills included in prompt (default: 5)
  skipPlanInstructions?: boolean; // Skip IMPLEMENTATION_PLAN.md rules in preamble (fix --design)
  fixMode?: 'design' | 'scan' | 'custom'; // Display mode for fix command headers
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
    | 'file_signal'
    | 'cost_ceiling';
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

/**
 * Detect completion status AND reason in a single pass.
 * Avoids running analyzeResponse() twice by combining detectCompletion + getCompletionReason.
 */
function detectCompletionWithReason(
  output: string,
  options: CompletionOptions = {}
): { status: 'done' | 'blocked' | 'continue'; reason: string } {
  const { completionPromise, requireExitSignal = false, minCompletionIndicators = 1 } = options;

  // --- Cheap checks first (string includes / simple regex) ---

  // 1. Explicit completion promise (highest priority)
  if (completionPromise && output.includes(completionPromise)) {
    return { status: 'done', reason: `Found completion promise: "${completionPromise}"` };
  }

  // 2. <promise>COMPLETE</promise> tag
  if (/<promise>COMPLETE<\/promise>/i.test(output)) {
    return { status: 'done', reason: 'Found <promise>COMPLETE</promise> marker' };
  }

  // 3. Explicit EXIT_SIGNAL (cheap regex)
  const hasExplicitSignal = hasExitSignal(output);
  if (hasExplicitSignal && !requireExitSignal) {
    return { status: 'done', reason: 'Found EXIT_SIGNAL: true' };
  }

  // 4. Legacy completion markers (cheap string search)
  const upperOutput = output.toUpperCase();
  if (!requireExitSignal) {
    for (const marker of COMPLETION_MARKERS) {
      if (upperOutput.includes(marker.toUpperCase())) {
        return { status: 'done', reason: `Found completion marker: "${marker}"` };
      }
    }
  }

  // 5. Blocked markers (cheap string search)
  for (const marker of BLOCKED_MARKERS) {
    if (upperOutput.includes(marker.toUpperCase())) {
      return { status: 'blocked', reason: `Found blocked marker: "${marker}"` };
    }
  }

  // --- Expensive check last (semantic analysis with many regex patterns) ---

  const analysis = analyzeResponse(output);

  if (analysis.stuckScore >= 0.7 && analysis.confidence !== 'low') {
    return { status: 'blocked', reason: 'Semantic analysis detected stuck state' };
  }

  // When exit signal is required, validate it with semantic indicators
  if (requireExitSignal) {
    if (hasExplicitSignal && analysis.indicators.completion.length >= minCompletionIndicators) {
      return { status: 'done', reason: 'Found EXIT_SIGNAL: true with completion indicators' };
    }
    return { status: 'continue', reason: '' };
  }

  // Semantic completion detection (only reached when no explicit markers matched)
  if (
    analysis.completionScore >= 0.7 &&
    analysis.indicators.completion.length >= minCompletionIndicators
  ) {
    const indicators = analysis.indicators.completion.slice(0, 3);
    return {
      status: 'done',
      reason: `Semantic analysis (${Math.round(analysis.completionScore * 100)}% confident): ${indicators.join(', ')}`,
    };
  }

  return { status: 'continue', reason: '' };
}

/**
 * Append an iteration summary to .ralph/iteration-log.md.
 * Gives the agent inter-iteration memory without session continuity.
 */
function appendIterationLog(
  cwd: string,
  iteration: number,
  summary: string,
  validationPassed: boolean,
  hasChanges: boolean
): void {
  try {
    const ralphDir = join(cwd, '.ralph');
    if (!existsSync(ralphDir)) mkdirSync(ralphDir, { recursive: true });

    const logPath = join(ralphDir, 'iteration-log.md');
    const entry = `## Iteration ${iteration}
- Status: ${validationPassed ? 'validation passed' : 'validation failed'}
- Changes: ${hasChanges ? 'yes' : 'no files changed'}
- Summary: ${summary.slice(0, 200)}
`;
    appendFileSync(logPath, entry);
  } catch {
    // Non-critical — don't break the loop if we can't write the log
  }
}

/**
 * Read the last N iteration summaries from .ralph/iteration-log.md.
 * Used by context-builder to give the agent memory of previous iterations.
 */
export function readIterationLog(cwd: string, maxEntries = 3): string | undefined {
  try {
    const logPath = join(cwd, '.ralph', 'iteration-log.md');
    if (!existsSync(logPath)) return undefined;

    const content = readFileSync(logPath, 'utf-8');
    const entries = content.split(/^## Iteration /m).filter((e) => e.trim());
    if (entries.length === 0) return undefined;

    const recent = entries.slice(-maxEntries).map((e) => `## Iteration ${e}`);
    return recent.join('\n');
  } catch {
    return undefined;
  }
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
  let maxIterations = options.maxIterations || 50;
  const commits: string[] = [];
  const startTime = Date.now();
  let validationFailures = 0;
  let exitReason: LoopResult['exitReason'] = 'max_iterations';
  let finalIteration = maxIterations;
  let consecutiveIdleIterations = 0;

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
        maxCost: options.maxCost,
      })
    : null;

  // Detect validation commands if validation is enabled
  const validationCommands = options.validate ? detectValidationCommands(options.cwd) : [];

  // Always-on build validation (not gated by --validate flag)
  // Re-detected inside the loop for greenfield projects where package.json appears mid-loop
  let buildCommands = detectBuildCommands(options.cwd);
  // Lightweight lint for intermediate iterations (build only runs on final iteration)
  let lintCommands = detectLintCommands(options.cwd);

  // Detect Claude Code skills (capped by maxSkills option)
  const detectedSkills = detectClaudeSkills(options.cwd);
  let taskWithSkills = options.task;
  if (detectedSkills.length > 0) {
    const skillsPrompt = formatSkillsForPrompt(detectedSkills, options.task, options.maxSkills);
    taskWithSkills = `${options.task}\n\n${skillsPrompt}`;
  }

  // Build abbreviated spec summary for context builder (iterations 2+)
  const specSummary = buildSpecSummary(options.cwd);

  // Track validation feedback separately — don't mutate taskWithSkills
  // initialValidationFeedback lets the `fix` command pre-populate errors for iteration 1
  let lastValidationFeedback = options.initialValidationFeedback || '';

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
    const effectiveSkills = options.maxSkills
      ? Math.min(detectedSkills.length, options.maxSkills)
      : Math.min(detectedSkills.length, 5);
    startupLines.push(
      `  Skills:      ${chalk.white(`${effectiveSkills} active (${detectedSkills.length} installed)`)}`
    );
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
  let previousTotalTasks = initialTaskCount.total;

  // Track whether we've already extended the loop for build-fix retries
  // When the build fails on the "final" iteration, we grant 2 extra iterations to fix it (once)
  let buildFixExtended = false;
  const BUILD_FIX_EXTRA_ITERATIONS = 2;

  // Filesystem snapshot for git-independent change detection
  let previousSnapshot = await getFilesystemSnapshot(options.cwd);

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
    // Skip if validation just failed — the agent needs a chance to fix build errors first
    if (options.checkFileCompletion && !lastValidationFeedback) {
      const fileCompletion = await checkFileBasedCompletion(options.cwd);
      if (fileCompletion.completed) {
        spinner.succeed(chalk.green(`File-based completion: ${fileCompletion.reason}`));
        finalIteration = i - 1;
        exitReason = 'file_signal';
        break;
      }
    }

    // Check cost ceiling before starting iteration
    if (costTracker) {
      const overBudget = costTracker.isOverBudget();
      if (overBudget) {
        console.log(
          chalk.red(
            `\n  Cost ceiling reached: ${formatCost(overBudget.currentCost)} >= ${formatCost(overBudget.maxCost)} budget`
          )
        );
        finalIteration = i - 1;
        exitReason = 'cost_ceiling';
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
      // Task completion is forward progress — reset circuit breaker consecutive failures
      circuitBreaker.recordSuccess();

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

    // Dynamic iteration budget: if agent expanded the plan (added more tasks),
    // recalculate maxIterations so we don't run out mid-project
    if (totalTasks > previousTotalTasks && totalTasks > 0) {
      const buffer = Math.max(3, Math.ceil(totalTasks * 0.3));
      const newMax = Math.min(
        MAX_ESTIMATED_ITERATIONS,
        Math.max(maxIterations, totalTasks + buffer)
      );
      if (newMax > maxIterations) {
        console.log(
          chalk.dim(
            `  Adjusting iterations: ${maxIterations} → ${newMax} (plan expanded to ${totalTasks} tasks)`
          )
        );
        maxIterations = newMax;
        finalIteration = maxIterations;
      }
      previousTotalTasks = totalTasks;
    }

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
      const modeLabel =
        options.fixMode === 'design'
          ? 'Design Fix'
          : options.fixMode
            ? 'Fix'
            : `Running ${options.agent.name}`;
      const fallbackLine = `  ${sourceIcon} Loop ${i}/${maxIterations} │ ${modeLabel}`;
      headerLines.push(chalk.white.bold(truncateToFit(fallbackLine, innerWidth)));
    }
    console.log();
    console.log(drawBox(headerLines, { color: chalk.cyan, width: boxWidth }));

    // Show subtask tree if current task has subtasks
    if (currentTask?.subtasks && currentTask.subtasks.length > 0) {
      for (const st of currentTask.subtasks) {
        const icon = st.completed ? chalk.green('  [x]') : chalk.dim('  [ ]');
        const name = truncateToFit(cleanTaskName(st.name), innerWidth - 8);
        console.log(`${icon} ${chalk.dim(name)}`);
      }
    }
    console.log();

    // Create progress renderer for this iteration
    const iterProgress = new ProgressRenderer();
    iterProgress.start('Working...');
    iterProgress.updateProgress(i, maxIterations, costTracker?.getStats()?.totalCost?.totalCost);

    // Build iteration-specific task with smart context windowing
    // Read iteration log for inter-iteration memory (iterations 2+)
    const iterationLog = i > 1 ? readIterationLog(options.cwd) : undefined;

    const builtContext = buildIterationContext({
      fullTask: options.task,
      taskWithSkills,
      currentTask,
      taskInfo,
      iteration: i,
      maxIterations,
      validationFeedback: lastValidationFeedback || undefined,
      maxInputTokens: options.contextBudget || 0,
      specSummary,
      skipPlanInstructions: options.skipPlanInstructions,
      iterationLog,
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
    // Snapshot HEAD before agent runs — used to detect commits made during iteration
    const iterationStartHash = await getHeadCommitHash(options.cwd);

    const agentOptions: AgentRunOptions = {
      task: iterationTask,
      cwd: options.cwd,
      auto: options.auto,
      // maxTurns removed - was causing issues, match wizard behavior
      streamOutput: !!process.env.RALPH_DEBUG, // Show raw JSON when debugging
      timeoutMs: options.agentTimeout,
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

    // Kill orphaned dev servers after design iterations (agent may crash without cleanup)
    if (options.fixMode === 'design') {
      try {
        const pids = execSync('lsof -ti :3000,:5173,:4321,:8080 2>/dev/null', {
          encoding: 'utf-8',
          timeout: 3000,
        }).trim();
        if (pids) {
          for (const pid of pids.split('\n').filter(Boolean)) {
            try {
              process.kill(Number(pid), 'SIGTERM');
            } catch {
              /* already dead */
            }
          }
        }
      } catch {
        /* no processes on those ports — normal */
      }
    }

    // Track cost for this iteration (silent - summary shown at end)
    if (costTracker) {
      costTracker.recordIteration(options.task, result.output);

      // Post-iteration cost ceiling check — prevent starting another expensive iteration
      const overBudget = costTracker.isOverBudget();
      if (overBudget) {
        console.log(
          chalk.red(
            `\n  Cost ceiling reached after iteration ${i}: ${formatCost(overBudget.currentCost)} >= ${formatCost(overBudget.maxCost)} budget`
          )
        );
        finalIteration = i;
        exitReason = 'cost_ceiling';
        break;
      }
    }

    // Check for completion using enhanced detection (single-pass: status + reason)
    const completionResult = detectCompletionWithReason(result.output, completionOptions);
    let status = completionResult.status;

    // Track file changes between iterations for stall detection
    // Primary: filesystem snapshot (works without git)
    // Secondary: git-based detection (catches committed changes when git available)
    const currentSnapshot = await getFilesystemSnapshot(options.cwd);
    const fsChanged =
      currentSnapshot.fileCount !== previousSnapshot.fileCount ||
      currentSnapshot.totalSize !== previousSnapshot.totalSize;
    const gitChanged = await hasIterationChanges(options.cwd, iterationStartHash);
    const hasChanges = fsChanged || gitChanged;
    previousSnapshot = currentSnapshot;

    // Task-aware stall detection: check both file changes AND task progress
    // Re-parse tasks after agent runs to catch newly completed tasks
    const postIterationTaskInfo = parsePlanTasks(options.cwd);
    const tasksProgressedThisIteration = postIterationTaskInfo.completed > previousCompletedTasks;
    // Build/validation failures are NOT idle — agent is actively debugging
    const hadValidationFailure = !!lastValidationFeedback;
    // Design mode: screenshot analysis is productive even without file changes
    const outputLower = result.output.toLowerCase();
    const hasDesignActivity =
      options.fixMode === 'design' &&
      (outputLower.includes('screenshot') || outputLower.includes('viewport'));
    const hasProductiveProgress =
      hasChanges || tasksProgressedThisIteration || hadValidationFailure || hasDesignActivity;

    if (!hasProductiveProgress) {
      consecutiveIdleIterations++;
    } else {
      consecutiveIdleIterations = 0;
    }

    // Verify completion - check if files were actually changed
    if (status === 'done' && !hasChanges) {
      if (i === 1) {
        console.log(chalk.yellow('  Agent reported done but no files changed - continuing...'));
        status = 'continue';
      }
      // On later iterations, allow done if agent genuinely finished (no more work to do)
    } else if (status === 'done' && hasChanges) {
      // Wait for filesystem to settle before declaring done
      await waitForFilesystemQuiescence(options.cwd, 2000);
    }

    // Stall detection: stop if no productive progress for consecutive iterations
    // More lenient for larger projects (5+ tasks) which need more iterations for scaffolding
    const staleThreshold = taskInfo.total > 5 ? 4 : 3;
    if (consecutiveIdleIterations >= staleThreshold && i > 3) {
      console.log(
        chalk.yellow(
          `  No progress for ${consecutiveIdleIterations} consecutive iterations - stopping`
        )
      );
      finalIteration = i;
      exitReason = 'completed';
      break;
    }

    // Don't allow completion while plan tasks remain (check plan file if it exists)
    if (status === 'done') {
      const latestTaskInfo = parsePlanTasks(options.cwd);
      if (latestTaskInfo.total > 0 && latestTaskInfo.pending > 0) {
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

    // --- Tiered validation: lint on intermediate iterations, build on final ---
    // Re-detect commands if none found yet (greenfield: package.json may appear mid-loop)
    if (buildCommands.length === 0) {
      buildCommands = detectBuildCommands(options.cwd);
      if (buildCommands.length > 0 && process.env.RALPH_DEBUG) {
        console.error(
          `[DEBUG] Build commands detected: ${buildCommands.map((c) => c.name).join(', ')}`
        );
      }
    }
    if (lintCommands.length === 0) {
      lintCommands = detectLintCommands(options.cwd);
    }

    const buildCoveredByFullValidation =
      options.validate &&
      validationCommands.some((vc) => vc.name === 'build' || vc.name === 'typecheck');

    // Determine if this is a "final" iteration where the full build should run:
    // - Last allowed iteration, OR all plan tasks are complete
    const preValidationTaskInfo = parsePlanTasks(options.cwd);
    const isFinalIteration = i === maxIterations || preValidationTaskInfo.pending === 0;

    if (!buildCoveredByFullValidation && i > 1) {
      const checkResults: ValidationResult[] = [];
      let checkLabel = '';

      if (isFinalIteration && buildCommands.length > 0) {
        // Final iteration: run full build validation (catches compile errors)
        checkLabel = 'build';
        spinner.start(chalk.yellow(`Loop ${i}: Running build check...`));
        for (const cmd of buildCommands) {
          checkResults.push(await runBuildValidation(options.cwd, cmd));
        }
      } else if (!isFinalIteration && lintCommands.length > 0) {
        // Intermediate iteration: run lightweight lint check (fast feedback)
        checkLabel = 'lint';
        spinner.start(chalk.yellow(`Loop ${i}: Running lint check...`));
        for (const cmd of lintCommands) {
          checkResults.push(await runLintValidation(options.cwd, cmd));
        }
      }

      if (checkResults.length > 0) {
        const allPassed = checkResults.every((r) => r.success);

        if (!allPassed) {
          validationFailures++;
          const feedback = formatValidationFeedback(checkResults);
          spinner.fail(
            chalk.red(`Loop ${i}: ${checkLabel === 'build' ? 'Build' : 'Lint'} check failed`)
          );

          const failedSummaries: string[] = [];
          for (const vr of checkResults) {
            if (!vr.success) {
              const errorText = vr.error || vr.output || '';
              const errorCount = (errorText.match(/error/gi) || []).length;
              const hint = errorCount > 0 ? `${errorCount} errors` : 'failed';
              failedSummaries.push(`${vr.command} (${hint})`);
            }
          }
          console.log(chalk.red(`  ✗ ${failedSummaries.join(' │ ')}`));

          const errorMsg = checkResults
            .filter((r) => !r.success)
            .map((r) => r.error?.slice(0, 200) || r.output?.slice(0, 200) || r.command)
            .join('\n');
          const tripped = circuitBreaker.recordFailure(errorMsg);

          if (tripped) {
            const reason = circuitBreaker.getTripReason();
            console.log(chalk.red(`Circuit breaker tripped: ${reason}`));
            if (progressTracker && progressEntry) {
              progressEntry.status = 'failed';
              progressEntry.summary = `Circuit breaker tripped (${checkLabel}): ${reason}`;
              progressEntry.validationResults = checkResults;
              progressEntry.duration = Date.now() - iterationStart;
              await progressTracker.appendEntry(progressEntry);
            }
            finalIteration = i;
            exitReason = 'circuit_breaker';
            break;
          }

          if (progressTracker && progressEntry) {
            progressEntry.status = 'validation_failed';
            progressEntry.summary = `${checkLabel === 'build' ? 'Build' : 'Lint'} check failed`;
            progressEntry.validationResults = checkResults;
            progressEntry.duration = Date.now() - iterationStart;
            await progressTracker.appendEntry(progressEntry);
          }

          // If build failed on the final iteration, extend the loop to let the agent fix it
          if (checkLabel === 'build' && isFinalIteration && !buildFixExtended) {
            const newMax = maxIterations + BUILD_FIX_EXTRA_ITERATIONS;
            console.log(
              chalk.yellow(
                `  Extending loop by ${BUILD_FIX_EXTRA_ITERATIONS} iterations to fix build errors (${maxIterations} → ${newMax})`
              )
            );
            maxIterations = newMax;
            finalIteration = maxIterations;
            buildFixExtended = true;
          }

          lastValidationFeedback = feedback;
          continue;
        }
        spinner.succeed(
          chalk.green(`Loop ${i}: ${checkLabel === 'build' ? 'Build' : 'Lint'} check passed`)
        );
        circuitBreaker.recordSuccess();
        lastValidationFeedback = '';
      }
    }

    // Run full validation (backpressure) if enabled and there are changes
    // Skip validation during warm-up period (greenfield builds where early tasks can't pass tests)
    let validationResults: ValidationResult[] = [];
    const warmupThreshold = options.validationWarmup ?? 0;
    const pastWarmup = completedTasks >= warmupThreshold;

    if (validationCommands.length > 0 && pastWarmup && i > 1) {
      spinner.start(chalk.yellow(`Loop ${i}: Running validation...`));

      validationResults = await runAllValidations(options.cwd, validationCommands);
      const allPassed = validationResults.every((r) => r.success);

      if (!allPassed) {
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

        // Pass validation feedback to context builder for next iteration
        // (don't mutate taskWithSkills — that defeats context trimming)
        lastValidationFeedback = feedback;
        continue; // Go to next iteration to fix issues
      } else {
        // Validation passed - record success and clear feedback
        spinner.succeed(chalk.green(`Loop ${i}: Validation passed`));
        circuitBreaker.recordSuccess();
        lastValidationFeedback = '';
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
      progressEntry.status = status === 'done' ? 'completed' : 'partial';
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

    // Write iteration summary for inter-iteration memory
    const iterSummary = summarizeChanges(result.output);
    const iterValidationPassed = validationResults.every((r) => r.success);
    appendIterationLog(options.cwd, i, iterSummary, iterValidationPassed, hasChanges);

    if (status === 'done') {
      const completionReason = completionResult.reason || 'Task marked as complete by agent';
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
