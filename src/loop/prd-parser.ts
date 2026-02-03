import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

export interface PrdTask {
  name: string;
  completed: boolean;
  index: number;
  section?: string;
}

export interface PrdContent {
  title: string;
  description: string;
  tasks: PrdTask[];
  rawContent: string;
}

/**
 * Parse tasks from a PRD markdown file
 *
 * Supports:
 * - Checkbox format: `- [ ] Task description` or `- [x] Completed task`
 * - Hierarchical sections with ## or ### headers
 * - Title from first # header
 * - Description from content before first task list
 */
export function parsePrdFile(filePath: string): PrdContent | null {
  const resolvedPath = resolve(filePath);

  if (!existsSync(resolvedPath)) {
    return null;
  }

  try {
    const content = readFileSync(resolvedPath, 'utf-8');
    return parsePrdContent(content);
  } catch {
    return null;
  }
}

/**
 * Parse PRD content from a string
 */
export function parsePrdContent(content: string): PrdContent {
  const lines = content.split('\n');
  const tasks: PrdTask[] = [];

  let title = '';
  let description = '';
  let currentSection = '';
  let taskIndex = 0;
  let foundFirstTask = false;
  const descriptionLines: string[] = [];

  for (const line of lines) {
    // Extract title from first # header
    if (!title) {
      const titleMatch = line.match(/^#\s+(.+)/);
      if (titleMatch) {
        title = titleMatch[1].trim();
        continue;
      }
    }

    // Track current section from ## or ### headers
    const sectionMatch = line.match(/^#{2,3}\s+(.+)/);
    if (sectionMatch) {
      currentSection = sectionMatch[1].trim();
      continue;
    }

    // Parse checkbox tasks
    const checkboxMatch = line.match(/^\s*[-*]\s*\[([xX ])\]\s*(.+)/);
    if (checkboxMatch) {
      foundFirstTask = true;
      const completed = checkboxMatch[1].toLowerCase() === 'x';
      const taskName = checkboxMatch[2].trim();
      tasks.push({
        name: taskName,
        completed,
        index: taskIndex++,
        section: currentSection || undefined,
      });
      continue;
    }

    // Collect description lines (before first task)
    if (!foundFirstTask && title && line.trim()) {
      // Skip header lines for description
      if (!line.startsWith('#')) {
        descriptionLines.push(line);
      }
    }
  }

  description = descriptionLines.join('\n').trim();

  return {
    title: title || 'Untitled PRD',
    description,
    tasks,
    rawContent: content,
  };
}

/**
 * Format PRD tasks as a prompt for the AI agent
 */
export function formatPrdPrompt(prd: PrdContent): string {
  const pendingTasks = prd.tasks.filter((t) => !t.completed);
  const completedCount = prd.tasks.filter((t) => t.completed).length;

  let prompt = `# ${prd.title}\n\n`;

  if (prd.description) {
    prompt += `${prd.description}\n\n`;
  }

  prompt += `## Task Progress\n\n`;
  prompt += `- Completed: ${completedCount}/${prd.tasks.length}\n`;
  prompt += `- Remaining: ${pendingTasks.length}\n\n`;

  if (pendingTasks.length > 0) {
    prompt += `## Tasks to Complete\n\n`;

    // Group by section if sections exist
    const bySection = new Map<string, PrdTask[]>();
    for (const task of pendingTasks) {
      const section = task.section || 'General';
      if (!bySection.has(section)) {
        bySection.set(section, []);
      }
      bySection.get(section)!.push(task);
    }

    if (bySection.size > 1 || (bySection.size === 1 && !bySection.has('General'))) {
      // Multiple sections - show with headers
      for (const [section, sectionTasks] of bySection) {
        prompt += `### ${section}\n\n`;
        for (const task of sectionTasks) {
          prompt += `- [ ] ${task.name}\n`;
        }
        prompt += '\n';
      }
    } else {
      // Single section or no sections - flat list
      for (const task of pendingTasks) {
        prompt += `- [ ] ${task.name}\n`;
      }
      prompt += '\n';
    }

    prompt += `## Instructions\n\n`;
    prompt += `Work through the tasks above one by one. Focus on completing each task fully before moving to the next.\n`;
    prompt += `After completing a task, mark it as done by changing \`- [ ]\` to \`- [x]\` in the original PRD file.\n`;
  } else {
    prompt += `All tasks have been completed!\n`;
  }

  return prompt;
}

/**
 * Get summary stats for a PRD
 */
export function getPrdStats(prd: PrdContent): {
  total: number;
  completed: number;
  pending: number;
  percentComplete: number;
} {
  const total = prd.tasks.length;
  const completed = prd.tasks.filter((t) => t.completed).length;
  const pending = total - completed;
  const percentComplete = total > 0 ? Math.round((completed / total) * 100) : 0;

  return { total, completed, pending, percentComplete };
}
