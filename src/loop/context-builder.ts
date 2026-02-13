/**
 * Context builder for intelligent prompt trimming across loop iterations.
 *
 * Reduces input tokens by progressively narrowing the context sent to the agent:
 * - Iteration 1: Full spec + skills + full implementation plan
 * - Iterations 2-3: Abbreviated spec + current task only + compressed feedback
 * - Iterations 4+: Current task only + error summary
 */

import { estimateTokens } from './cost-tracker.js';
import type { PlanTask, TaskCount } from './task-counter.js';

export interface ContextBuildOptions {
  /** The full task/spec content (original prompt) */
  fullTask: string;
  /** Task with skills appended */
  taskWithSkills: string;
  /** Current task from IMPLEMENTATION_PLAN.md */
  currentTask: PlanTask | null;
  /** Task count info */
  taskInfo: TaskCount;
  /** Current iteration number (1-based) */
  iteration: number;
  /** Max iterations for this loop */
  maxIterations: number;
  /** Validation feedback from previous iteration */
  validationFeedback?: string;
  /** Maximum input tokens budget (0 = unlimited) */
  maxInputTokens?: number;
}

export interface BuiltContext {
  /** The assembled prompt to send to the agent */
  prompt: string;
  /** Estimated token count */
  estimatedTokens: number;
  /** Whether the context was trimmed */
  wasTrimmed: boolean;
  /** Debug info about what was included/excluded */
  debugInfo: string;
}

/**
 * Strip ANSI escape codes from text
 */
function stripAnsi(text: string): string {
  // biome-ignore lint/suspicious/noControlCharactersInRegex: stripping ANSI escape codes requires control chars
  return text.replace(/\x1b\[[0-9;]*m/g, '');
}

/**
 * Compress validation feedback to reduce token usage.
 * Keeps only the failing command names and truncated error output.
 */
export function compressValidationFeedback(feedback: string, maxChars: number = 2000): string {
  if (!feedback) return '';

  const stripped = stripAnsi(feedback);

  // Already under budget
  if (stripped.length <= maxChars) return stripped;

  const lines = stripped.split('\n');
  const compressed: string[] = ['## Validation Failed\n'];
  let currentLength = compressed[0].length;

  for (const line of lines) {
    // Always include headers (### command name)
    if (line.startsWith('### ') || line.startsWith('## ')) {
      compressed.push(line);
      currentLength += line.length + 1;
      continue;
    }

    // Include error lines up to budget
    if (currentLength + line.length + 1 <= maxChars - 50) {
      compressed.push(line);
      currentLength += line.length + 1;
    }
  }

  compressed.push('\nPlease fix the above issues before continuing.');
  return compressed.join('\n');
}

/**
 * Build a trimmed implementation plan context showing only the current task
 * with a summary of completed and pending tasks.
 */
export function buildTrimmedPlanContext(currentTask: PlanTask, taskInfo: TaskCount): string {
  const completedCount = taskInfo.completed;
  const pendingCount = taskInfo.pending;
  const taskNum = completedCount + 1;

  const subtasksList =
    currentTask.subtasks
      ?.map((st) => {
        const checkbox = st.completed ? '[x]' : '[ ]';
        return `- ${checkbox} ${st.name}`;
      })
      .join('\n') || '';

  const lines: string[] = [];

  if (completedCount > 0) {
    lines.push(`> ${completedCount} task(s) already completed.`);
  }

  lines.push(`\n## Current Task (${taskNum}/${taskInfo.total}): ${currentTask.name}\n`);

  if (subtasksList) {
    lines.push('Subtasks:');
    lines.push(subtasksList);
  }

  if (pendingCount > 1) {
    lines.push(`\n> ${pendingCount - 1} more task(s) remaining after this one.`);
  }

  lines.push(
    '\nComplete these subtasks, then mark them done in IMPLEMENTATION_PLAN.md by changing [ ] to [x].'
  );

  return lines.join('\n');
}

/**
 * Build the iteration context with intelligent trimming.
 */
export function buildIterationContext(opts: ContextBuildOptions): BuiltContext {
  const {
    fullTask: _fullTask,
    taskWithSkills,
    currentTask,
    taskInfo,
    iteration,
    validationFeedback,
    maxInputTokens = 0,
  } = opts;

  const totalTasks = taskInfo.total;
  const completedTasks = taskInfo.completed;
  const debugParts: string[] = [];
  let prompt: string;

  // Loop-aware preamble — gives the agent behavioral context
  const preamble = `You are a coding agent in an autonomous development loop (iteration ${iteration}/${opts.maxIterations}).

Rules:
- Study IMPLEMENTATION_PLAN.md and work on ONE task at a time
- Mark each subtask [x] in IMPLEMENTATION_PLAN.md immediately when done
- Study specs/ directory for original requirements
- Don't assume functionality is not already implemented — search the codebase first
- Implement completely — no placeholders or stubs
- Create files before importing them — never import components or modules that don't exist yet
- After creating or modifying files, verify the project compiles by running the build or dev command
- When ALL tasks are complete, explicitly state "All tasks completed"
- If you learn how to run/build the project, update AGENTS.md
`;

  // No structured tasks — just pass the task as-is
  if (!currentTask || totalTasks === 0) {
    prompt = `${preamble}\n${taskWithSkills}`;
    if (validationFeedback) {
      const compressed = compressValidationFeedback(validationFeedback);
      prompt = `${prompt}\n\n${compressed}`;
    }
    debugParts.push('mode=raw (no structured tasks)');
  } else if (iteration === 1) {
    // Iteration 1: Full context — spec + skills + full current task details
    const taskNum = completedTasks + 1;
    const subtasksList = currentTask.subtasks?.map((st) => `- [ ] ${st.name}`).join('\n') || '';

    prompt = `${preamble}
${taskWithSkills}

## Current Task (${taskNum}/${totalTasks}): ${currentTask.name}

Subtasks:
${subtasksList}

Complete these subtasks, then mark them done in IMPLEMENTATION_PLAN.md by changing [ ] to [x].`;

    debugParts.push('mode=full (iteration 1)');
    debugParts.push(`included: full spec + skills + task ${taskNum}/${totalTasks}`);
  } else if (iteration <= 3) {
    // Iterations 2-3: Trimmed plan context + abbreviated spec reference
    const planContext = buildTrimmedPlanContext(currentTask, taskInfo);

    prompt = `${preamble}
Continue working on the project. Study specs/ for requirements if needed. Check IMPLEMENTATION_PLAN.md for full progress.

${planContext}`;

    // Add compressed validation feedback if present
    if (validationFeedback) {
      const compressed = compressValidationFeedback(validationFeedback, 2000);
      prompt = `${prompt}\n\n${compressed}`;
      debugParts.push('included: compressed validation feedback');
    }

    debugParts.push(`mode=trimmed (iteration ${iteration})`);
    debugParts.push(`excluded: full spec, skills`);
  } else {
    // Iterations 4+: Minimal context — just current task
    const planContext = buildTrimmedPlanContext(currentTask, taskInfo);

    prompt = `${preamble}
Continue working on the project. Specs in specs/. Check IMPLEMENTATION_PLAN.md for progress.

${planContext}`;

    // Add heavily compressed validation feedback if present
    if (validationFeedback) {
      const compressed = compressValidationFeedback(validationFeedback, 500);
      prompt = `${prompt}\n\n${compressed}`;
      debugParts.push('included: minimal validation feedback (500 chars)');
    }

    debugParts.push(`mode=minimal (iteration ${iteration})`);
    debugParts.push('excluded: spec, skills, plan history');
  }

  // Apply token budget if set
  let wasTrimmed = iteration > 1 && currentTask !== null && totalTasks > 0;
  const estimatedTokens = estimateTokens(prompt);

  if (maxInputTokens > 0 && estimatedTokens > maxInputTokens) {
    // Aggressively trim: truncate the prompt to fit budget
    const targetChars = maxInputTokens * 3.5; // rough chars-per-token
    if (prompt.length > targetChars) {
      prompt = `${prompt.slice(0, targetChars)}\n\n[Context truncated to fit ${maxInputTokens} token budget]`;
      wasTrimmed = true;
      debugParts.push(`truncated: ${estimatedTokens} -> ~${maxInputTokens} tokens`);
    }
  }

  const finalTokens = estimateTokens(prompt);
  debugParts.push(`tokens: ~${finalTokens}`);

  return {
    prompt,
    estimatedTokens: finalTokens,
    wasTrimmed,
    debugInfo: debugParts.join(' | '),
  };
}
