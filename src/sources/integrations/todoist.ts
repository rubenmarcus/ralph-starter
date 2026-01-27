import { IntegrationSource } from '../base.js';
import type { SourceOptions, SourceResult } from '../types.js';

/**
 * Todoist source - fetches tasks from Todoist projects
 *
 * Requires API token from: https://todoist.com/prefs/integrations
 */
export class TodoistSource extends IntegrationSource {
  name = 'todoist';
  description = 'Fetch tasks from Todoist projects';

  private readonly API_BASE = 'https://api.todoist.com/rest/v2';

  async fetch(identifier: string, options?: SourceOptions): Promise<SourceResult> {
    const token = await this.getApiKey();

    // identifier can be project name or 'all'
    const projectName = options?.project || identifier;

    // Get projects to find the right one
    const projects = await this.fetchProjects(token);

    let projectId: string | null = null;
    let projectTitle = 'All Tasks';

    if (projectName && projectName !== 'all') {
      const project = projects.find(
        (p) => p.name.toLowerCase() === projectName.toLowerCase() || p.id === projectName
      );

      if (!project) {
        const available = projects.map((p) => p.name).join(', ');
        this.error(`Project not found: ${projectName}. Available: ${available}`);
      }

      projectId = project.id;
      projectTitle = project.name;
    }

    // Fetch tasks
    const tasks = await this.fetchTasks(token, projectId, options);

    return this.formatTasks(tasks, projectTitle);
  }

  private async fetchProjects(token: string): Promise<TodoistProject[]> {
    const response = await fetch(`${this.API_BASE}/projects`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        this.error(
          'Invalid Todoist API token. Run: ralph-starter config set todoist.apiKey <token>'
        );
      }
      this.error(`Todoist API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  private async fetchTasks(
    token: string,
    projectId: string | null,
    options?: SourceOptions
  ): Promise<TodoistTask[]> {
    const params = new URLSearchParams();

    if (projectId) {
      params.set('project_id', projectId);
    }

    const url = `${this.API_BASE}/tasks?${params.toString()}`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      this.error(`Todoist API error: ${response.status} ${response.statusText}`);
    }

    let tasks: TodoistTask[] = await response.json();

    // Filter by label if specified
    if (options?.label) {
      const labelLower = options.label.toLowerCase();
      tasks = tasks.filter((t) => t.labels.some((l) => l.toLowerCase() === labelLower));
    }

    // Apply limit
    const limit = options?.limit || 50;
    tasks = tasks.slice(0, limit);

    return tasks;
  }

  private formatTasks(tasks: TodoistTask[], projectTitle: string): SourceResult {
    if (tasks.length === 0) {
      return {
        content: `# ${projectTitle}\n\nNo tasks found.`,
        source: `todoist:${projectTitle}`,
        title: projectTitle,
        metadata: { type: 'todoist', tasks: 0 },
      };
    }

    const sections: string[] = [`# ${projectTitle}\n`];

    // Group by priority
    const priorities: Record<number, TodoistTask[]> = {
      4: [], // p1 (urgent)
      3: [], // p2
      2: [], // p3
      1: [], // p4 (default)
    };

    for (const task of tasks) {
      priorities[task.priority].push(task);
    }

    const priorityNames: Record<number, string> = {
      4: '🔴 Priority 1 (Urgent)',
      3: '🟠 Priority 2 (High)',
      2: '🟡 Priority 3 (Medium)',
      1: '⚪ Priority 4 (Normal)',
    };

    for (const priority of [4, 3, 2, 1]) {
      const priorityTasks = priorities[priority];
      if (priorityTasks.length === 0) continue;

      sections.push(`\n## ${priorityNames[priority]}\n`);

      for (const task of priorityTasks) {
        sections.push(`### ${task.content}`);

        if (task.description) {
          sections.push('', task.description);
        }

        const meta: string[] = [];
        if (task.labels.length > 0) {
          meta.push(`Labels: ${task.labels.join(', ')}`);
        }
        if (task.due) {
          meta.push(`Due: ${task.due.string}`);
        }

        if (meta.length > 0) {
          sections.push('', `*${meta.join(' | ')}*`);
        }

        sections.push('');
      }
    }

    return {
      content: sections.join('\n'),
      source: `todoist:${projectTitle}`,
      title: projectTitle,
      metadata: {
        type: 'todoist',
        project: projectTitle,
        tasks: tasks.length,
      },
    };
  }

  getHelp(): string {
    return `
todoist: Fetch tasks from Todoist projects

Usage:
  ralph-starter run --from todoist --project "My Project"
  ralph-starter run --from todoist --project all --label "feature"

Options:
  --project  Project name or 'all' for all projects
  --label    Filter by label name
  --limit    Maximum tasks to fetch (default: 50)

Setup:
  1. Get API token from: https://todoist.com/prefs/integrations
  2. Run: ralph-starter config set todoist.apiKey <token>

Examples:
  ralph-starter run --from todoist --project "App Ideas"
  ralph-starter run --from todoist --project all --label "mvp"
`.trim();
  }
}

interface TodoistProject {
  id: string;
  name: string;
  color: string;
  parent_id: string | null;
  order: number;
  comment_count: number;
  is_shared: boolean;
  is_favorite: boolean;
  is_inbox_project: boolean;
  is_team_inbox: boolean;
  view_style: string;
  url: string;
}

interface TodoistTask {
  id: string;
  project_id: string;
  content: string;
  description: string;
  is_completed: boolean;
  labels: string[];
  priority: number;
  due: {
    string: string;
    date: string;
    is_recurring: boolean;
    datetime?: string;
  } | null;
  parent_id: string | null;
  order: number;
  url: string;
}
