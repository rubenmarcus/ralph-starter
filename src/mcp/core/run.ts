import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { detectBestAgent } from '../../loop/agents.js';
import { type LoopOptions, runLoop } from '../../loop/executor.js';
import { calculateOptimalIterations } from '../../loop/task-counter.js';
import { fetchFromSource } from '../../sources/index.js';

export interface RunCoreOptions {
  path: string;
  task?: string;
  auto?: boolean;
  commit?: boolean;
  push?: boolean;
  pr?: boolean;
  validate?: boolean;
  maxIterations?: number;
  // Source options
  from?: string;
  project?: string;
  label?: string;
  status?: string;
  limit?: number;
}

export interface RunCoreResult {
  success: boolean;
  iterations: number;
  commits: string[];
  error?: string;
}

/**
 * Core run logic without CLI dependencies
 */
export async function runCore(options: RunCoreOptions): Promise<RunCoreResult> {
  const cwd = options.path;

  try {
    // Handle --from source
    let sourceSpec: string | null = null;
    if (options.from) {
      const result = await fetchFromSource(options.from, {
        project: options.project,
        label: options.label,
        status: options.status,
        limit: options.limit,
      });

      sourceSpec = result.content;

      // Write to specs directory
      const specsDir = join(cwd, 'specs');
      if (!existsSync(specsDir)) {
        mkdirSync(specsDir, { recursive: true });
      }

      const specFilename = result.title
        ? `${result.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.md`
        : 'source-spec.md';
      writeFileSync(join(specsDir, specFilename), sourceSpec);
    }

    // Detect agent
    const agent = await detectBestAgent();

    if (!agent) {
      return {
        success: false,
        iterations: 0,
        commits: [],
        error: 'No coding agent found.',
      };
    }

    // Check for Ralph Playbook files
    const buildPromptPath = join(cwd, 'PROMPT_build.md');
    const implementationPlanPath = join(cwd, 'IMPLEMENTATION_PLAN.md');
    const hasPlaybook = existsSync(buildPromptPath) && existsSync(implementationPlanPath);

    // Get task
    let finalTask = options.task;
    let isBuildMode = false;

    // If we fetched from a source, use that as the task
    if (sourceSpec && !finalTask) {
      finalTask = `Build the following project based on this specification:

${sourceSpec}

Analyze the specification and implement all required features. Create a proper project structure with all necessary files.`;
    }

    if (!finalTask) {
      // Check for Ralph Playbook build mode
      if (hasPlaybook) {
        const buildPrompt = readFileSync(buildPromptPath, 'utf-8');
        const implementationPlan = readFileSync(implementationPlanPath, 'utf-8');

        finalTask = `${buildPrompt}

## Current Implementation Plan

${implementationPlan}

Work through the tasks in the implementation plan. Mark tasks as complete as you finish them.
Focus on one task at a time. After completing a task, update IMPLEMENTATION_PLAN.md.`;

        isBuildMode = true;
      } else {
        return {
          success: false,
          iterations: 0,
          commits: [],
          error: 'No task provided and no Ralph Playbook found.',
        };
      }
    }

    // Run the loop
    const prTitle = isBuildMode
      ? 'Ralph: Implementation from plan'
      : `Ralph: ${finalTask.slice(0, 50)}`;

    // Calculate smart iterations based on tasks
    const { iterations: smartIterations } = calculateOptimalIterations(cwd);

    const loopOptions: LoopOptions = {
      task: finalTask,
      cwd,
      agent,
      maxIterations: options.maxIterations ?? smartIterations,
      auto: options.auto,
      commit: options.commit,
      push: options.push,
      pr: options.pr,
      prTitle,
      validate: options.validate,
    };

    const result = await runLoop(loopOptions);

    return {
      success: result.success,
      iterations: result.iterations,
      commits: result.commits,
      error: result.error,
    };
  } catch (error) {
    return {
      success: false,
      iterations: 0,
      commits: [],
      error: (error as Error).message,
    };
  }
}
