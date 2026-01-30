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

    // First pass: look for "### Task N:" headers (hierarchical format)
    for (const line of lines) {
      // Match "### Task N: Description"
      const taskHeaderMatch = line.match(/^#{2,3}\s*Task\s*\d+[:\s]+(.+)/i);
      if (taskHeaderMatch) {
        // Save previous task if exists
        if (currentTask) {
          tasks.push(currentTask);
        }
        currentTask = {
          name: taskHeaderMatch[1].trim(),
          completed: false, // Will be determined by subtasks
          index: taskIndex++,
          subtasks: [],
        };
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
    if (tasks.length > 0 && tasks.some((t) => t.subtasks && t.subtasks.length > 0)) {
      for (const task of tasks) {
        if (task.subtasks && task.subtasks.length > 0) {
          // Task is complete when ALL subtasks are complete
          task.completed = task.subtasks.every((st) => st.completed);
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
 * Calculate optimal number of loop iterations based on task count
 *
 * Formula:
 * - If tasks exist: pendingTasks + buffer (for retries/validation fixes)
 * - Buffer = max(2, pendingTasks * 0.3) - at least 2, or 30% extra for retries
 * - Minimum: 3 (even for small tasks)
 * - Maximum: 25 (prevent runaway loops)
 * - If no plan: 10 (sensible default)
 */
export function calculateOptimalIterations(cwd: string): {
  iterations: number;
  taskCount: TaskCount;
  reason: string;
} {
  const taskCount = parsePlanTasks(cwd);

  // No implementation plan - use default
  if (taskCount.total === 0) {
    return {
      iterations: 10,
      taskCount,
      reason: 'No implementation plan found, using default',
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
