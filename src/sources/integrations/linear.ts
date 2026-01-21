import { IntegrationSource } from '../base.js';
import type { SourceResult, SourceOptions } from '../types.js';

/**
 * Linear source - fetches issues from Linear
 *
 * Uses Linear's GraphQL API
 * Requires API key from: https://linear.app/settings/api
 */
export class LinearSource extends IntegrationSource {
  name = 'linear';
  description = 'Fetch issues from Linear';

  private readonly API_URL = 'https://api.linear.app/graphql';

  async fetch(identifier: string, options?: SourceOptions): Promise<SourceResult> {
    const apiKey = await this.getApiKey();

    // identifier can be project/team name or 'all'
    const projectName = options?.project || identifier;

    // Fetch issues with GraphQL
    const issues = await this.fetchIssues(apiKey, projectName, options);

    return this.formatIssues(issues, projectName);
  }

  private async fetchIssues(
    apiKey: string,
    projectName: string,
    options?: SourceOptions
  ): Promise<LinearIssue[]> {
    const limit = options?.limit || 50;

    // Build filter
    const filter: Record<string, unknown> = {};

    if (projectName && projectName !== 'all') {
      // Try to match by project or team name
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

  private formatIssues(issues: LinearIssue[], projectName: string): SourceResult {
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
        const teamKey = issue.team?.key || '';
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

Setup:
  1. Get API key from: https://linear.app/settings/api
  2. Run: ralph-starter config set linear.apiKey <key>

Examples:
  ralph-starter run --from linear --project "Mobile App"
  ralph-starter run --from linear --project ENG --label "bug"
  ralph-starter run --from linear --project all --status "In Progress"
`.trim();
  }
}

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
