/**
 * Batch Task Fetcher
 *
 * Fetches multiple tasks from GitHub/Linear for batch processing.
 */

import { execa } from 'execa';

/**
 * A task to be processed in auto mode
 */
export interface BatchTask {
  /** Unique identifier (issue number, ticket ID) */
  id: string;
  /** Task title */
  title: string;
  /** Full task description */
  description: string;
  /** Source integration */
  source: 'github' | 'linear';
  /** URL to the task */
  url: string;
  /** Priority (lower = higher priority) */
  priority?: number;
  /** Labels/tags */
  labels?: string[];
  /** Owner/repo for GitHub */
  project?: string;
}

/**
 * Options for fetching batch tasks
 */
export interface BatchFetchOptions {
  /** Source to fetch from */
  source: 'github' | 'linear';
  /** Project identifier */
  project?: string;
  /** Filter by label */
  label?: string;
  /** Maximum tasks to fetch */
  limit?: number;
  /** Status filter */
  status?: string;
}

/**
 * Fetch multiple tasks from a source
 */
export async function fetchBatchTasks(options: BatchFetchOptions): Promise<BatchTask[]> {
  switch (options.source) {
    case 'github':
      return fetchGitHubTasks(options);
    case 'linear':
      return fetchLinearTasks(options);
    default:
      throw new Error(`Unsupported source: ${options.source}`);
  }
}

/**
 * Fetch tasks from GitHub issues
 */
async function fetchGitHubTasks(options: BatchFetchOptions): Promise<BatchTask[]> {
  if (!options.project) {
    throw new Error('Project (owner/repo) is required for GitHub');
  }

  const args = [
    'issue',
    'list',
    '-R',
    options.project,
    '--json',
    'number,title,body,labels,state,url',
    '--state',
    options.status || 'open',
    '--limit',
    String(options.limit || 10),
  ];

  if (options.label) {
    args.push('--label', options.label);
  }

  const result = await execa('gh', args);
  const issues = JSON.parse(result.stdout) as Array<{
    number: number;
    title: string;
    body?: string;
    labels?: Array<{ name: string }>;
    url: string;
  }>;

  return issues.map((issue) => ({
    id: String(issue.number),
    title: issue.title,
    description: issue.body || '',
    source: 'github' as const,
    url: issue.url,
    labels: issue.labels?.map((l) => l.name),
    project: options.project,
  }));
}

/**
 * Fetch tasks from Linear
 */
async function fetchLinearTasks(options: BatchFetchOptions): Promise<BatchTask[]> {
  // For now, use the Linear CLI if available
  // TODO: Add direct API support
  try {
    const args = ['issue', 'list', '--format', 'json'];

    if (options.project) {
      args.push('--project', options.project);
    }

    if (options.label) {
      args.push('--label', options.label);
    }

    const result = await execa('linear', args);
    const issues = JSON.parse(result.stdout) as Array<{
      id: string;
      identifier: string;
      title: string;
      description?: string;
      url: string;
      priority: number;
      labels?: Array<{ name: string }>;
    }>;

    return issues.slice(0, options.limit || 10).map((issue) => ({
      id: issue.identifier,
      title: issue.title,
      description: issue.description || '',
      source: 'linear' as const,
      url: issue.url,
      priority: issue.priority,
      labels: issue.labels?.map((l) => l.name),
      project: options.project,
    }));
  } catch {
    throw new Error(
      'Linear CLI not found or not authenticated. Install: npm i -g @linear/cli && linear auth'
    );
  }
}

/**
 * Claim a task (mark as in-progress)
 */
export async function claimTask(task: BatchTask): Promise<void> {
  switch (task.source) {
    case 'github':
      // Add "in-progress" label or assign to bot
      if (task.project) {
        try {
          await execa('gh', [
            'issue',
            'edit',
            task.id,
            '-R',
            task.project,
            '--add-label',
            'in-progress',
          ]);
        } catch {
          // Label might not exist, that's ok
        }
      }
      break;
    case 'linear':
      // Update status to "In Progress"
      try {
        await execa('linear', ['issue', 'update', task.id, '--status', 'In Progress']);
      } catch {
        // Status might not exist, that's ok
      }
      break;
  }
}

/**
 * Mark a task as complete
 */
export async function completeTask(
  task: BatchTask,
  result: { success: boolean; prUrl?: string }
): Promise<void> {
  switch (task.source) {
    case 'github':
      if (task.project && result.success) {
        try {
          // Remove in-progress label if it exists
          await execa('gh', [
            'issue',
            'edit',
            task.id,
            '-R',
            task.project,
            '--remove-label',
            'in-progress',
          ]);
        } catch {
          // Label might not exist
        }

        // Add comment with PR link
        if (result.prUrl) {
          await execa('gh', [
            'issue',
            'comment',
            task.id,
            '-R',
            task.project,
            '--body',
            `Automated PR created: ${result.prUrl}\n\n*Generated by ralph-starter auto mode*`,
          ]);
        }
      }
      break;
    case 'linear':
      if (result.success) {
        try {
          // Update status to "Done" or link PR
          await execa('linear', ['issue', 'update', task.id, '--status', 'Done']);
        } catch {
          // Status might not exist
        }
      }
      break;
  }
}

/**
 * Skip a task (mark as skipped/blocked)
 */
export async function skipTask(task: BatchTask, reason: string): Promise<void> {
  switch (task.source) {
    case 'github':
      if (task.project) {
        try {
          await execa('gh', [
            'issue',
            'comment',
            task.id,
            '-R',
            task.project,
            '--body',
            `Skipped by ralph-starter auto mode: ${reason}`,
          ]);
        } catch {
          // Comment failed, that's ok
        }
      }
      break;
    case 'linear':
      // Add comment
      break;
  }
}
