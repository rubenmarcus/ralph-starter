/**
 * GitHub Integration Source
 *
 * Fetches issues from GitHub repositories.
 * Uses the `gh` CLI for authentication (if available) or falls back to API token.
 */

import {
  type AuthMethod,
  BaseIntegration,
  type IntegrationOptions,
  type IntegrationResult,
} from '../base.js';

interface GitHubIssue {
  number: number;
  title: string;
  body?: string;
  state: string;
  labels?: Array<string | { name: string }>;
}

export class GitHubIntegration extends BaseIntegration {
  name = 'github';
  displayName = 'GitHub';
  description = 'Fetch issues from GitHub repositories';
  website = 'https://github.com';

  // CLI is preferred, API token is fallback
  authMethods: AuthMethod[] = ['cli', 'api-key'];

  private ghCliAvailable: boolean | null = null;

  /**
   * Check if gh CLI is available and authenticated
   */
  protected async isCliAvailable(): Promise<boolean> {
    if (this.ghCliAvailable !== null) {
      return this.ghCliAvailable;
    }

    try {
      const { execa } = await import('execa');
      await execa('gh', ['auth', 'status']);
      this.ghCliAvailable = true;
      return true;
    } catch {
      this.ghCliAvailable = false;
      return false;
    }
  }

  async fetch(identifier: string, options?: IntegrationOptions): Promise<IntegrationResult> {
    const { owner, repo } = this.parseRepoIdentifier(identifier);

    // Prefer CLI if available
    if (await this.isCliAvailable()) {
      return this.fetchViaCli(owner, repo, options);
    }

    return this.fetchViaApi(owner, repo, options);
  }

  private parseRepoIdentifier(identifier: string): { owner: string; repo: string } {
    // Handle full GitHub URLs
    if (identifier.includes('github.com')) {
      const match = identifier.match(/github\.com\/([^/]+)\/([^/]+)/);
      if (match) {
        return { owner: match[1], repo: match[2].replace(/\.git$/, '') };
      }
    }

    // Handle owner/repo format
    if (identifier.includes('/')) {
      const [owner, repo] = identifier.split('/');
      return { owner, repo };
    }

    this.error(`Invalid repository format: ${identifier}. Use owner/repo or GitHub URL.`);
  }

  private async fetchViaCli(
    owner: string,
    repo: string,
    options?: IntegrationOptions
  ): Promise<IntegrationResult> {
    const { execa } = await import('execa');

    const args = [
      'issue',
      'list',
      '-R',
      `${owner}/${repo}`,
      '--json',
      'number,title,body,labels,state',
    ];

    // Add filters
    if (options?.label) {
      args.push('--label', options.label);
    }

    if (options?.status) {
      args.push('--state', options.status);
    } else {
      args.push('--state', 'open');
    }

    if (options?.limit) {
      args.push('--limit', String(options.limit));
    } else {
      args.push('--limit', '20');
    }

    const result = await execa('gh', args);
    const issues = JSON.parse(result.stdout) as GitHubIssue[];

    return this.formatIssues(issues, owner, repo);
  }

  private async fetchViaApi(
    owner: string,
    repo: string,
    options?: IntegrationOptions
  ): Promise<IntegrationResult> {
    const token = await this.getApiKey('token');

    let url = `https://api.github.com/repos/${owner}/${repo}/issues?`;
    const params = new URLSearchParams();

    params.set('state', options?.status || 'open');
    params.set('per_page', String(options?.limit || 20));

    if (options?.label) {
      params.set('labels', options.label);
    }

    url += params.toString();

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'User-Agent': 'ralph-starter/0.1.0',
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        this.error('Invalid GitHub token. Run: ralph-starter config set github.token <value>');
      }
      if (response.status === 404) {
        this.error(`Repository not found: ${owner}/${repo}`);
      }
      this.error(`GitHub API error: ${response.status} ${response.statusText}`);
    }

    const issues = (await response.json()) as GitHubIssue[];
    return this.formatIssues(issues, owner, repo);
  }

  private formatIssues(issues: GitHubIssue[], owner: string, repo: string): IntegrationResult {
    if (issues.length === 0) {
      return {
        content: `# ${owner}/${repo}\n\nNo issues found matching the criteria.`,
        source: `github:${owner}/${repo}`,
        title: `${owner}/${repo} Issues`,
        metadata: { type: 'github', issues: 0 },
      };
    }

    const sections: string[] = [`# ${owner}/${repo} Issues\n`];

    for (const issue of issues) {
      const labels = issue.labels
        ?.map((l) => (typeof l === 'string' ? l : l.name))
        .filter(Boolean)
        .join(', ');

      sections.push(`## #${issue.number}: ${issue.title}`);

      if (labels) {
        sections.push(`*Labels: ${labels}*`);
      }

      sections.push('');

      if (issue.body) {
        sections.push(issue.body);
      } else {
        sections.push('*No description provided*');
      }

      sections.push('\n---\n');
    }

    return {
      content: sections.join('\n'),
      source: `github:${owner}/${repo}`,
      title: `${owner}/${repo} Issues`,
      metadata: {
        type: 'github',
        owner,
        repo,
        issues: issues.length,
      },
    };
  }

  getHelp(): string {
    return `
github: Fetch issues from GitHub repositories

Usage:
  ralph-starter run --from github --project owner/repo
  ralph-starter run --from github --project owner/repo --label bug
  ralph-starter run --from github --project https://github.com/owner/repo

Options:
  --project  Repository in owner/repo format or GitHub URL
  --label    Filter by label name
  --status   Issue state: open, closed, all (default: open)
  --limit    Maximum issues to fetch (default: 20)

Authentication:
  Uses 'gh' CLI if available and authenticated (recommended)
  Otherwise requires: ralph-starter config set github.token <token>

Setup with gh CLI (recommended):
  1. Install: https://cli.github.com/
  2. Run: gh auth login

Setup with token:
  1. Create token at: https://github.com/settings/tokens
  2. Run: ralph-starter config set github.token <token>

Examples:
  ralph-starter run --from github --project facebook/react --label "good first issue"
  ralph-starter run --from github --project my-org/my-repo --status all
`.trim();
  }
}
