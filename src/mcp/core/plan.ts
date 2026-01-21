import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { detectBestAgent, runAgent } from '../../loop/agents.js';

export interface PlanCoreOptions {
  path: string;
  auto?: boolean;
}

export interface PlanCoreResult {
  success: boolean;
  planPath: string;
  taskCount: number;
  error?: string;
}

/**
 * Core planning logic without CLI dependencies
 */
export async function planCore(options: PlanCoreOptions): Promise<PlanCoreResult> {
  const cwd = options.path;
  const planPath = join(cwd, 'IMPLEMENTATION_PLAN.md');

  try {
    // Check for Ralph Playbook files
    const promptPlanPath = join(cwd, 'PROMPT_plan.md');
    const specsDir = join(cwd, 'specs');

    if (!existsSync(promptPlanPath)) {
      return {
        success: false,
        planPath,
        taskCount: 0,
        error: 'Ralph Playbook not found. Run init first.',
      };
    }

    if (!existsSync(specsDir)) {
      return {
        success: false,
        planPath,
        taskCount: 0,
        error: 'No specs/ folder found. Create specs first.',
      };
    }

    // Read planning prompt
    const planPrompt = readFileSync(promptPlanPath, 'utf-8');

    // Detect agent
    const agent = await detectBestAgent();

    if (!agent) {
      return {
        success: false,
        planPath,
        taskCount: 0,
        error: 'No coding agent found.',
      };
    }

    // Build the full prompt
    const fullPrompt = `${planPrompt}

Please analyze the specs/ folder and update IMPLEMENTATION_PLAN.md with a prioritized task list.

Focus on:
1. Reading all specification files in specs/
2. Understanding the current codebase state
3. Identifying gaps between specs and implementation
4. Creating actionable, small tasks

Do not implement anything - only plan.`;

    // Run the agent in planning mode
    const result = await runAgent(agent, {
      task: fullPrompt,
      cwd,
      auto: options.auto,
      maxTurns: 5, // Limited turns for planning
    });

    if (result.exitCode !== 0) {
      return {
        success: false,
        planPath,
        taskCount: 0,
        error: 'Planning failed: ' + result.output.slice(0, 200),
      };
    }

    // Count tasks in the plan
    let taskCount = 0;
    if (existsSync(planPath)) {
      const planContent = readFileSync(planPath, 'utf-8');
      taskCount = (planContent.match(/- \[[ x]\]/g) || []).length;
    }

    return {
      success: true,
      planPath,
      taskCount,
    };
  } catch (error) {
    return {
      success: false,
      planPath,
      taskCount: 0,
      error: (error as Error).message,
    };
  }
}
