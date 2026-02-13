import fs from 'node:fs/promises';
import path from 'node:path';
import type { CostEstimate, TokenEstimate } from './cost-tracker.js';
import type { ValidationResult } from './validation.js';

export interface ProgressEntry {
  timestamp: string;
  iteration: number;
  status: 'started' | 'completed' | 'partial' | 'failed' | 'blocked' | 'validation_failed';
  summary: string;
  validationResults?: ValidationResult[];
  commitHash?: string;
  duration?: number; // milliseconds
  cost?: CostEstimate;
  tokens?: TokenEstimate;
}

export interface ProgressTracker {
  appendEntry(entry: ProgressEntry): Promise<void>;
  getEntries(): Promise<ProgressEntry[]>;
  clear(): Promise<void>;
}

const ACTIVITY_FILE = '.ralph/activity.md';

/**
 * Format a progress entry as markdown
 */
function formatEntry(entry: ProgressEntry): string {
  const lines: string[] = [];

  // Header with timestamp and iteration
  lines.push(`### Iteration ${entry.iteration} - ${entry.timestamp}`);
  lines.push('');

  // Status badge
  const statusBadge = getStatusBadge(entry.status);
  lines.push(`**Status:** ${statusBadge}`);

  // Summary
  if (entry.summary) {
    lines.push(`**Summary:** ${entry.summary}`);
  }

  // Duration
  if (entry.duration !== undefined) {
    const durationStr = formatDuration(entry.duration);
    lines.push(`**Duration:** ${durationStr}`);
  }

  // Commit hash
  if (entry.commitHash) {
    lines.push(`**Commit:** \`${entry.commitHash.slice(0, 7)}\``);
  }

  // Cost info
  if (entry.cost) {
    const costStr =
      entry.cost.totalCost < 0.01
        ? `${(entry.cost.totalCost * 100).toFixed(2)}¢`
        : `$${entry.cost.totalCost.toFixed(3)}`;
    const tokensStr = entry.tokens ? ` (${entry.tokens.totalTokens.toLocaleString()} tokens)` : '';
    lines.push(`**Cost:** ${costStr}${tokensStr}`);
  }

  // Validation results
  if (entry.validationResults && entry.validationResults.length > 0) {
    lines.push('');
    lines.push('**Validation:**');
    for (const result of entry.validationResults) {
      const icon = result.success ? '✅' : '❌';
      lines.push(`- ${icon} ${result.command}`);
    }
  }

  lines.push('');
  lines.push('---');
  lines.push('');

  return lines.join('\n');
}

function getStatusBadge(status: ProgressEntry['status']): string {
  switch (status) {
    case 'started':
      return '🔄 Started';
    case 'completed':
      return '✅ Completed';
    case 'partial':
      return '🔶 Partial';
    case 'failed':
      return '❌ Failed';
    case 'blocked':
      return '🚫 Blocked';
    case 'validation_failed':
      return '⚠️ Validation Failed';
    default:
      return status;
  }
}

function formatDuration(ms: number): string {
  if (ms < 1000) {
    return `${ms}ms`;
  }
  if (ms < 60000) {
    return `${(ms / 1000).toFixed(1)}s`;
  }
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}m ${seconds}s`;
}

/**
 * Get the header for a new activity file
 */
function getFileHeader(task: string): string {
  return `# Ralph Loop Activity Log

**Task:** ${task.slice(0, 100)}${task.length > 100 ? '...' : ''}
**Started:** ${new Date().toISOString()}

---

`;
}

/**
 * Create a progress tracker for a directory
 */
export function createProgressTracker(cwd: string, task: string): ProgressTracker {
  const filePath = path.join(cwd, ACTIVITY_FILE);
  const dirPath = path.dirname(filePath);
  let initialized = false;

  return {
    async appendEntry(entry: ProgressEntry): Promise<void> {
      // Initialize file if needed
      if (!initialized) {
        // Ensure .ralph directory exists
        await fs.mkdir(dirPath, { recursive: true });

        try {
          await fs.access(filePath);
        } catch {
          // File doesn't exist, create with header
          await fs.writeFile(filePath, getFileHeader(task), 'utf-8');
        }
        initialized = true;
      }

      const formatted = formatEntry(entry);
      await fs.appendFile(filePath, formatted, 'utf-8');
    },

    async getEntries(): Promise<ProgressEntry[]> {
      // This is a simplified implementation - in production you'd want to parse the markdown
      try {
        await fs.access(filePath);
        return []; // Would parse the file here
      } catch {
        return [];
      }
    },

    async clear(): Promise<void> {
      try {
        await fs.unlink(filePath);
      } catch {
        // File doesn't exist, that's fine
      }
      initialized = false;
    },
  };
}

/**
 * Check if a file-based completion signal exists
 */
export async function checkFileBasedCompletion(cwd: string): Promise<{
  completed: boolean;
  reason?: string;
}> {
  // Check for RALPH_COMPLETE file
  const completeFile = path.join(cwd, 'RALPH_COMPLETE');
  try {
    await fs.access(completeFile);
    return { completed: true, reason: 'RALPH_COMPLETE file found' };
  } catch {
    // File doesn't exist
  }

  // Check for .ralph-done marker
  const doneMarker = path.join(cwd, '.ralph-done');
  try {
    await fs.access(doneMarker);
    return { completed: true, reason: '.ralph-done marker found' };
  } catch {
    // File doesn't exist
  }

  // Check IMPLEMENTATION_PLAN.md for all tasks completed
  const planFile = path.join(cwd, 'IMPLEMENTATION_PLAN.md');
  try {
    const content = await fs.readFile(planFile, 'utf-8');
    const uncheckedTasks = content.match(/- \[ \]/g);
    const checkedTasks = content.match(/- \[x\]/gi);

    if (checkedTasks && checkedTasks.length > 0 && !uncheckedTasks) {
      return {
        completed: true,
        reason: `All ${checkedTasks.length} tasks in IMPLEMENTATION_PLAN.md completed`,
      };
    }
  } catch {
    // File doesn't exist
  }

  return { completed: false };
}

/**
 * Create a RALPH_COMPLETE marker file
 */
export async function markComplete(cwd: string, summary?: string): Promise<void> {
  const completeFile = path.join(cwd, 'RALPH_COMPLETE');
  const content = summary
    ? `Completed: ${new Date().toISOString()}\n\n${summary}`
    : `Completed: ${new Date().toISOString()}`;
  await fs.writeFile(completeFile, content, 'utf-8');
}
