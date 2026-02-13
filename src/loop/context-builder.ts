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
  let sectionCount = 0;
  let totalSections = 0;

  // Count total ### sections for the omission summary
  for (const line of lines) {
    if (line.startsWith('### ')) totalSections++;
  }

  for (const line of lines) {
    // Track section headers (### command name)
    if (line.startsWith('### ')) {
      // If we already have one complete section and are over budget, stop
      if (sectionCount >= 1 && currentLength + line.length + 1 > maxChars - 100) {
        const remaining = totalSections - sectionCount;
        if (remaining > 0) {
          compressed.push(`\n[${remaining} more failing section(s) omitted]`);
        }
        break;
      }
      sectionCount++;
    }

    // Always include ## and ### headers
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
  let wasTrimmed = false;

  // Loop-aware preamble — gives the agent behavioral context per Ralph Playbook patterns
  const preamble = `You are a coding agent in an autonomous development loop (iteration ${iteration}/${opts.maxIterations}).

Rules:
- IMPORTANT: The current working directory IS the project root. Create ALL files here — do NOT create a subdirectory for the project (e.g., do NOT run \`mkdir my-app\` or \`npx create-vite my-app\`). If you use a scaffolding tool, run it with \`.\` as the target (e.g., \`npm create vite@latest . -- --template react\`).
- Study IMPLEMENTATION_PLAN.md and work on ONE task at a time
- Mark each subtask [x] in IMPLEMENTATION_PLAN.md immediately when done
- Study specs/ directory for original requirements
- Don't assume functionality is not already implemented — search the codebase first
- Implement completely — no placeholders or stubs
- Create files before importing them — never import components or modules that don't exist yet
- After creating or modifying files, verify the project compiles by running the build command (e.g., \`npm run build\`). NEVER start a dev server (\`npm run dev\`, \`npx vite\`, etc.) — it blocks forever and wastes resources
- When ALL tasks are complete, explicitly state "All tasks completed"
- If you learn how to run/build the project, update AGENTS.md

Technology gotchas (CRITICAL — follow these exactly):
- Tailwind CSS v4 (current version): The setup has changed significantly from v3.
  * Install: \`npm install tailwindcss @tailwindcss/postcss postcss\`
  * postcss.config.js must use: \`plugins: { '@tailwindcss/postcss': {} }\` (NOT \`tailwindcss\`)
  * CSS file must use: \`@import "tailwindcss";\` (NOT \`@tailwind base/components/utilities\` — those are v3 directives)
  * Do NOT create tailwind.config.js — Tailwind v4 uses CSS-based configuration
- JSX: Never put unescaped quotes inside attribute strings. For SVG backgrounds or data URLs, use a CSS file or encodeURIComponent().
- Run \`npm run build\` (NOT \`npm run dev\`) to verify the project compiles before marking setup tasks complete.

Design quality (IMPORTANT — avoid generic AI aesthetics):
- NEVER use purple-blue gradient backgrounds or gradient text — this is the #1 AI design tell
- NEVER default to Inter, Roboto, or system fonts — pick distinctive typography (e.g. DM Sans, Playfair Display, Space Mono)
- NEVER use glass morphism, neumorphism, or frosted-glass cards
- Choose ONE clear design direction (bold/minimal/retro/editorial/playful) and commit to it
- Use a specific color palette with max 3-4 colors, not rainbow gradients
- Prefer flat or subtle shadows over glassmorphism effects
`;

  // No structured tasks — pass the task with preamble
  if (!currentTask || totalTasks === 0) {
    if (iteration > 1) {
      // Later iterations without structured tasks — remind agent to create a plan
      prompt = `${preamble}
Continue working on the project.
If you haven't already, create an IMPLEMENTATION_PLAN.md with structured tasks.
Study the specs/ directory for the original specification.

${taskWithSkills}`;
    } else {
      prompt = `${preamble}\n${taskWithSkills}`;
    }
    if (validationFeedback) {
      const compressed = compressValidationFeedback(validationFeedback);
      prompt = `${prompt}\n\n${compressed}`;
    }
    debugParts.push('mode=raw (no structured tasks)');
  } else if (iteration === 1) {
    // Iteration 1: Full context — preamble + spec + skills + full current task details
    const taskNum = completedTasks + 1;
    const subtasksList = currentTask.subtasks?.map((st) => `- [ ] ${st.name}`).join('\n') || '';

    prompt = `${preamble}
${taskWithSkills}

## Current Task (${taskNum}/${totalTasks}): ${currentTask.name}

Subtasks:
${subtasksList}

Complete these subtasks, then mark them done in IMPLEMENTATION_PLAN.md by changing [ ] to [x].`;

    debugParts.push('mode=full (iteration 1)');
    debugParts.push(`included: preamble + full spec + skills + task ${taskNum}/${totalTasks}`);
  } else if (iteration <= 3) {
    // Iterations 2-3: Preamble + trimmed plan context + spec reference
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

    wasTrimmed = true;
    debugParts.push(`mode=trimmed (iteration ${iteration})`);
    debugParts.push(`excluded: full spec, skills`);
  } else {
    // Iterations 4+: Preamble + minimal context
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

    wasTrimmed = true;
    debugParts.push(`mode=minimal (iteration ${iteration})`);
    debugParts.push('excluded: spec, skills, plan history');
  }

  // Apply token budget if set
  const estimatedTokens = estimateTokens(prompt);

  if (maxInputTokens > 0 && estimatedTokens > maxInputTokens) {
    // Semantic trimming: cut at paragraph/line boundaries instead of mid-instruction
    const targetChars = maxInputTokens * 3.5; // rough chars-per-token
    if (prompt.length > targetChars) {
      // Find the last paragraph break before the budget
      let cutPoint = prompt.lastIndexOf('\n\n', targetChars);
      if (cutPoint < targetChars * 0.5) {
        // No paragraph break in the second half — fall back to last line break
        cutPoint = prompt.lastIndexOf('\n', targetChars);
      }
      if (cutPoint < targetChars * 0.5) {
        // No suitable break found — hard cut (rare edge case)
        cutPoint = targetChars;
      }
      prompt = `${prompt.slice(0, cutPoint)}\n\n[Context truncated to fit ${maxInputTokens} token budget]`;
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
