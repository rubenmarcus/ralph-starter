/**
 * Linear Integration Source
 *
 * Fetches issues from Linear using GraphQL API.
 * Supports CLI auth (`linear auth login`) or API key.
 */

import { BaseIntegration, type IntegrationResult, type IntegrationOptions, type AuthMethod } from '../base.js';

interface LinearIssue {
  id: string;
  identifier: string;
  title: string;
  description: string | null;
  priority: number;
  priorityLabel: string | null;
  state: {
    name: string;
    type: string;
  } | null;
  labels: {
    nodes: Array<{ name: string }>;
  } | null;
  project: {
    name: string;
  } | null;
  team: {
    name: string;
    key: string;
  } | null;
}

interface LinearResponse {
  data: {
    issues: {
      nodes: LinearIssue[];
    };
  };
  errors?: Array<{ message: string }>;
}

export class LinearIntegration extends BaseIntegration {
  name = 'linear';
  displayName = 'Linear';
  description = 'Fetch issues from Linear';
  website = 'https://linear.app';

  // Supports CLI auth, API key, and OAuth
  authMethods: AuthMethod[] = ['cli', 'api-key', 'oauth'];

  private readonly API_URL = 'https://api.linear.app/graphql';
  private linearCliAvailable: boolean | null = null;

  /**
   * Check if Linear CLI is available and authenticated
   */
  protected async isCliAvailable(): Promise<boolean> {
    if (this.linearCliAvailable !== null) {
      return this.linearCliAvailable;
    }

    try {
      const { execa } = await import('execa');
      // Check if linear CLI is installed and authenticated
      const result = await execa('linear', ['whoami'], { reject: false });
      this.linearCliAvailable = result.exitCode === 0;
      return this.linearCliAvailable;
    } catch {
      this.linearCliAvailable = false;
      return false;
    }
  }

  async fetch(identifier: string, options?: IntegrationOptions): Promise<IntegrationResult> {
    const projectName = options?.project || identifier;
    const authMethod = await this.getConfiguredAuthMethod();

    if (!authMethod) {
      this.error(
        'No authentication configured. Options:\n' +
        '  1. Install Linear CLI: npm install -g @linear/cli && linear auth login\n' +
        '  2. Use API key: ralph-starter config set linear.apiKey <key>'
      );
    }

    // Get API key based on auth method
    let apiKey: string;

    if (authMethod === 'cli') {
      apiKey = await this.getApiKeyFromCli();
    } else {
      apiKey = await this.getApiKey();
    }

    const issues = await this.fetchIssues(apiKey, projectName, options);
    return this.formatIssues(issues, projectName);
  }

  private async getApiKeyFromCli(): Promise<string> {
    try {
      const { execa } = await import('execa');
      // Linear CLI stores token which we can use
      const result = await execa('linear', ['config', 'get', 'apiKey']);
      return result.stdout.trim();
    } catch {
      // Fall back to regular API key
      return this.getApiKey();
    }
  }

  private async fetchIssues(
    apiKey: string,
    projectName: string,
    options?: IntegrationOptions
  ): Promise<LinearIssue[]> {
    const limit = options?.limit || 50;

    // Build filter
    const filter: Record<string, unknown> = {};

    if (projectName && projectName !== 'all') {
      filter.or = [
        { project: { name: { containsIgnoreCase: projectName } } },
        { team: { name: { containsIgnoreCase: projectName } } },
        { team: { key: { eq: projectName.toUpperCase() } } },
      ];
    }

    if (options?.label) {
      filter.labels = { name: { containsIgnoreCase: options.label } };
    }

    if (options?.status) {
      filter.state = { name: { containsIgnoreCase: options.status } };
    } else {
      // Default to non-completed issues
      filter.completedAt = { null: true };
    }

    const query = `
      query GetIssues($filter: IssueFilter, $first: Int) {
        issues(filter: $filter, first: $first, orderBy: updatedAt) {
          nodes {
            id
            identifier
            title
            description
            priority
            priorityLabel
            state {
              name
              type
            }
            labels {
              nodes {
                name
              }
            }
            project {
              name
            }
            team {
              name
              key
            }
          }
        }
      }
    `;

    const response = await fetch(this.API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: apiKey,
      },
      body: JSON.stringify({
        query,
        variables: {
          filter: Object.keys(filter).length > 0 ? filter : undefined,
          first: limit,
        },
      }),
    });

    if (!response.ok) {
      if (response.status === 401) {
        this.error(
          'Invalid Linear API key. Run: ralph-starter config set linear.apiKey <key>'
        );
      }
      this.error(`Linear API error: ${response.status} ${response.statusText}`);
    }

    const data = (await response.json()) as LinearResponse;

    if (data.errors) {
      this.error(`Linear API error: ${data.errors[0].message}`);
    }

    return data.data.issues.nodes;
  }

  private formatIssues(issues: LinearIssue[], projectName: string): IntegrationResult {
    const title = projectName === 'all' ? 'All Issues' : `${projectName} Issues`;

    if (issues.length === 0) {
      return {
        content: `# ${title}\n\nNo issues found.`,
        source: `linear:${projectName}`,
        title,
        metadata: { type: 'linear', issues: 0 },
      };
    }

    const sections: string[] = [`# ${title}\n`];

    // Group by priority
    const priorityOrder = ['Urgent', 'High', 'Medium', 'Low', 'No priority'];
    const byPriority: Record<string, LinearIssue[]> = {};

    for (const issue of issues) {
      const priority = issue.priorityLabel || 'No priority';
      if (!byPriority[priority]) {
        byPriority[priority] = [];
      }
      byPriority[priority].push(issue);
    }

    const priorityEmoji: Record<string, string> = {
      Urgent: '🔴',
      High: '🟠',
      Medium: '🟡',
      Low: '🔵',
      'No priority': '⚪',
    };

    for (const priority of priorityOrder) {
      const priorityIssues = byPriority[priority];
      if (!priorityIssues || priorityIssues.length === 0) continue;

      sections.push(`\n## ${priorityEmoji[priority] || '⚪'} ${priority}\n`);

      for (const issue of priorityIssues) {
        sections.push(`### ${issue.identifier}: ${issue.title}`);

        const meta: string[] = [];
        if (issue.state?.name) {
          meta.push(`Status: ${issue.state.name}`);
        }
        if (issue.team?.name) {
          meta.push(`Team: ${issue.team.name}`);
        }
        if (issue.project?.name) {
          meta.push(`Project: ${issue.project.name}`);
        }

        const labels = issue.labels?.nodes?.map((l) => l.name).filter(Boolean);
        if (labels && labels.length > 0) {
          meta.push(`Labels: ${labels.join(', ')}`);
        }

        if (meta.length > 0) {
          sections.push(`*${meta.join(' | ')}*`);
        }

        sections.push('');

        if (issue.description) {
          sections.push(issue.description);
        } else {
          sections.push('*No description*');
        }

        sections.push('');
      }
    }

    return {
      content: sections.join('\n'),
      source: `linear:${projectName}`,
      title,
      metadata: {
        type: 'linear',
        project: projectName,
        issues: issues.length,
      },
    };
  }

  getHelp(): string {
    return `
linear: Fetch issues from Linear

Usage:
  ralph-starter run --from linear --project "My Project"
  ralph-starter run --from linear --project TEAM-KEY --label "feature"

Options:
  --project  Project name, team name, or team key (e.g., ENG)
  --label    Filter by label name
  --status   Filter by status name (e.g., "In Progress", "Todo")
  --limit    Maximum issues to fetch (default: 50)

Authentication:

Option 1: Linear CLI (recommended)
  1. Install: npm install -g @linear/cli
  2. Login: linear auth login

Option 2: API Key
  1. Get API key from: https://linear.app/settings/api
  2. Run: ralph-starter config set linear.apiKey <key>

Examples:
  ralph-starter run --from linear --project "Mobile App"
  ralph-starter run --from linear --project ENG --label "bug"
  ralph-starter run --from linear --project all --status "In Progress"
`.trim();
  }
}
