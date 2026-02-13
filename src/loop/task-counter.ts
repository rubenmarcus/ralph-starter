import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

export interface PlanTask {
  name: string;
  completed: boolean;
  index: number;
  subtasks?: { name: string; completed: boolean }[];
}

export interface TaskCount {
  total: number;
  completed: number;
  pending: number;
  tasks: PlanTask[];
}

/**
 * Parse tasks from IMPLEMENTATION_PLAN.md
 * Supports hierarchical format with ### Task N: headers and subtasks
 * Falls back to flat checkbox format if no headers found
 */
export function parsePlanTasks(cwd: string): TaskCount {
  const planPath = join(cwd, 'IMPLEMENTATION_PLAN.md');

  if (!existsSync(planPath)) {
    return { total: 0, completed: 0, pending: 0, tasks: [] };
  }

  try {
    const content = readFileSync(planPath, 'utf-8');
    const lines = content.split('\n');
    const tasks: PlanTask[] = [];

    let currentTask: PlanTask | null = null;
    let taskIndex = 0;
    let hasHeaders = false;

    // First pass: look for "### Phase N:" or "### Task N:" headers (hierarchical format)
    for (const line of lines) {
      const phaseHeaderMatch = line.match(/^#{2,3}\s*Phase\s*\d+[:\s-]+(.+)/i);
      const taskHeaderMatch = line.match(/^#{2,3}\s*Task\s*\d+[:\s-]+(.+)/i);
      const headingMatch = line.match(/^#{1,6}\s+/);

      if (phaseHeaderMatch || taskHeaderMatch) {
        hasHeaders = true;
        // Save previous task if exists
        if (currentTask) {
          tasks.push(currentTask);
        }
        const headerText = (phaseHeaderMatch?.[1] || taskHeaderMatch?.[1] || '').trim();
        currentTask = {
          name: headerText || `Task ${taskIndex + 1}`,
          completed: false, // Will be determined by subtasks
          index: taskIndex++,
          subtasks: [],
        };
        continue;
      }

      // If we hit another heading, close out the current task
      if (headingMatch && currentTask) {
        tasks.push(currentTask);
        currentTask = null;
        continue;
      }

      // Collect subtasks under current task
      if (currentTask) {
        const checkboxMatch = line.match(/^\s*[-*]\s*\[([xX ])\]\s*(.+)/);
        if (checkboxMatch) {
          const completed = checkboxMatch[1].toLowerCase() === 'x';
          const subtaskName = checkboxMatch[2].trim();
          currentTask.subtasks?.push({ name: subtaskName, completed });
        }
      }
    }

    // Don't forget the last task
    if (currentTask) {
      tasks.push(currentTask);
    }

    // If hierarchical format found, determine task completion from subtasks
    if (hasHeaders) {
      for (const task of tasks) {
        if (task.subtasks && task.subtasks.length > 0) {
          // Task is complete when ALL subtasks are complete
          task.completed = task.subtasks.every((st) => st.completed);
        } else {
          task.completed = false;
        }
      }
    } else {
      // Fallback: flat checkbox format (no task headers)
      tasks.length = 0;
      taskIndex = 0;
      const taskRegex = /^[-*]\s*\[([xX ])\]\s*(.+)/gm;
      let match;
      while ((match = taskRegex.exec(content)) !== null) {
        tasks.push({
          name: match[2].trim(),
          completed: match[1].toLowerCase() === 'x',
          index: taskIndex++,
        });
      }
    }

    const completed = tasks.filter((t) => t.completed).length;
    const pending = tasks.filter((t) => !t.completed).length;

    return {
      total: tasks.length,
      completed,
      pending,
      tasks,
    };
  } catch {
    return { total: 0, completed: 0, pending: 0, tasks: [] };
  }
}

/**
 * Get the current task (first uncompleted task)
 */
export function getCurrentTask(cwd: string): PlanTask | null {
  const { tasks } = parsePlanTasks(cwd);
  return tasks.find((t) => !t.completed) || null;
}

/**
 * Get task by index (0-based)
 */
export function getTaskByIndex(cwd: string, index: number): PlanTask | null {
  const { tasks } = parsePlanTasks(cwd);
  return tasks[index] || null;
}

/**
 * Estimate task complexity from spec/task content when no plan file exists.
 * Counts structural elements (headings, bullet points, numbered items)
 * and maps them to an estimated task count.
 */
export function estimateTasksFromContent(content: string): { estimated: number; reason: string } {
  if (!content || content.length < 20) {
    return { estimated: 0, reason: 'no content' };
  }

  const lines = content.split('\n');

  // Count structural signals
  const headings = lines.filter((l) => /^#{1,4}\s+/.test(l)).length;
  const bullets = lines.filter((l) => /^\s*[-*]\s+/.test(l)).length;
  const numbered = lines.filter((l) => /^\s*\d+[.)]\s+/.test(l)).length;
  const checkboxes = lines.filter((l) => /^\s*[-*]\s*\[[ xX]\]/.test(l)).length;

  // If there are explicit checkboxes, use that count
  if (checkboxes > 0) {
    return { estimated: checkboxes, reason: `${checkboxes} checkboxes in spec` };
  }

  // Estimate from structural elements: headings define major tasks,
  // dense bullet lists suggest subtasks within those
  const majorTasks = Math.max(1, headings);
  const detailItems = bullets + numbered;

  // Heuristic: ~4 detail items per iteration of work
  const fromDetails = Math.ceil(detailItems / 4);
  const estimated = Math.max(majorTasks, fromDetails, 1);

  return {
    estimated,
    reason: `estimated from spec (${headings} sections, ${bullets + numbered} items)`,
  };
}

/**
 * Calculate optimal number of loop iterations based on task count
 *
 * Formula:
 * - If plan exists: pendingTasks + buffer (for retries/validation fixes)
 * - Buffer = max(2, pendingTasks * 0.3) - at least 2, or 30% extra for retries
 * - If no plan but spec content: estimate from spec structure
 * - Minimum: 3 (even for small tasks)
 * - Maximum: 25 (prevent runaway loops)
 */
export function calculateOptimalIterations(
  cwd: string,
  taskContent?: string
): {
  iterations: number;
  taskCount: TaskCount;
  reason: string;
} {
  const taskCount = parsePlanTasks(cwd);

  // No implementation plan - estimate from spec content if available
  if (taskCount.total === 0) {
    const estimate = taskContent ? estimateTasksFromContent(taskContent) : null;
    if (estimate && estimate.estimated > 0) {
      const buffer = Math.max(2, Math.ceil(estimate.estimated * 0.3));
      let iterations = estimate.estimated + buffer;
      iterations = Math.max(3, iterations);
      iterations = Math.min(15, iterations);
      return { iterations, taskCount, reason: estimate.reason };
    }
    return {
      iterations: 7,
      taskCount,
      reason: 'No plan or spec structure found, using default',
    };
  }

  // All tasks already completed
  if (taskCount.pending === 0) {
    return {
      iterations: 3,
      taskCount,
      reason: 'All tasks completed, minimal iterations for verification',
    };
  }

  // Calculate buffer (at least 2, or 30% of pending tasks for retries)
  const buffer = Math.max(2, Math.ceil(taskCount.pending * 0.3));

  // Calculate iterations: pending tasks + buffer
  let iterations = taskCount.pending + buffer;

  // Apply bounds
  iterations = Math.max(3, iterations); // Minimum 3
  iterations = Math.min(25, iterations); // Maximum 25

  return {
    iterations,
    taskCount,
    reason: `${taskCount.pending} pending tasks + ${buffer} buffer`,
  };
}

// Keep backward compatibility
export const countPlanTasks = parsePlanTasks;
