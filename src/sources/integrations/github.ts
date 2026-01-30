import { IntegrationSource } from '../base.js';
import type { SourceOptions, SourceResult } from '../types.js';

/**
 * GitHub source - fetches issues from GitHub repositories
 *
 * Uses the gh CLI for authentication (no API key needed if gh is configured)
 * Falls back to GitHub API with token if gh is not available
 */
export class GitHubSource extends IntegrationSource {
  name = 'github';
  description = 'Fetch issues from GitHub repositories';

  private ghAvailable: boolean | null = null;

  async isAvailable(): Promise<boolean> {
    // First check if gh CLI is available and authenticated
    if (await this.isGhCliAvailable()) {
      return true;
    }

    // Fall back to checking for API token
    return super.isAvailable();
  }

  requiresAuth(): boolean {
    // gh CLI handles auth, so we don't strictly require it
    return false;
  }

  private async isGhCliAvailable(): Promise<boolean> {
    if (this.ghAvailable !== null) {
      return this.ghAvailable;
    }

    try {
      const { execa } = await import('execa');
      await execa('gh', ['auth', 'status']);
      this.ghAvailable = true;
      return true;
    } catch {
      this.ghAvailable = false;
      return false;
    }
  }

  async fetch(identifier: string, options?: SourceOptions): Promise<SourceResult> {
    // Parse identifier: owner/repo, full URL, or issue URL
    const parsed = this.parseIdentifier(identifier);

    // If issue number provided via options or URL, fetch single issue
    const issueNumber = options?.issue || parsed.issue;
    if (issueNumber) {
      if (await this.isGhCliAvailable()) {
        return this.fetchSingleIssueViaCli(parsed.owner, parsed.repo, issueNumber);
      }
      return this.fetchSingleIssueViaApi(parsed.owner, parsed.repo, issueNumber);
    }

    // Determine which method to use for listing issues
    if (await this.isGhCliAvailable()) {
      return this.fetchViaGhCli(parsed.owner, parsed.repo, options);
    }

    return this.fetchViaApi(parsed.owner, parsed.repo, options);
  }

  private parseIdentifier(identifier: string): { owner: string; repo: string; issue?: number } {
    // Handle full GitHub issue URLs: https://github.com/owner/repo/issues/123
    if (identifier.includes('github.com') && identifier.includes('/issues/')) {
      const match = identifier.match(/github\.com\/([^/]+)\/([^/]+)\/issues\/(\d+)/);
      if (match) {
        return {
          owner: match[1],
          repo: match[2],
          issue: Number.parseInt(match[3], 10),
        };
      }
    }

    // Handle full GitHub repo URLs: https://github.com/owner/repo
    if (identifier.includes('github.com')) {
      const match = identifier.match(/github\.com\/([^/]+)\/([^/]+)/);
      if (match) {
        return { owner: match[1], repo: match[2].replace(/\.git$/, '') };
      }
    }

    // Handle owner/repo/issues/123 format
    if (identifier.includes('/issues/')) {
      const match = identifier.match(/([^/]+)\/([^/]+)\/issues\/(\d+)/);
      if (match) {
        return {
          owner: match[1],
          repo: match[2],
          issue: Number.parseInt(match[3], 10),
        };
      }
    }

    // Handle owner/repo format
    if (identifier.includes('/')) {
      const parts = identifier.split('/');
      return { owner: parts[0], repo: parts[1] };
    }

    this.error(`Invalid repository format: ${identifier}. Use owner/repo or GitHub URL.`);
  }

  private async fetchViaGhCli(
    owner: string,
    repo: string,
    options?: SourceOptions
  ): Promise<SourceResult> {
    const { execa } = await import('execa');

    // Build gh command
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
    options?: SourceOptions
  ): Promise<SourceResult> {
    const token = await this.getApiKey();

    // Build API URL
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

  private async fetchSingleIssueViaCli(
    owner: string,
    repo: string,
    issueNumber: number
  ): Promise<SourceResult> {
    const { execa } = await import('execa');

    const result = await execa('gh', [
      'issue',
      'view',
      String(issueNumber),
      '-R',
      `${owner}/${repo}`,
      '--json',
      'number,title,body,labels,state,comments',
    ]);

    const issue = JSON.parse(result.stdout) as GitHubIssueWithComments;
    return this.formatSingleIssue(issue, owner, repo);
  }

  private async fetchSingleIssueViaApi(
    owner: string,
    repo: string,
    issueNumber: number
  ): Promise<SourceResult> {
    const token = await this.getApiKey();

    // Fetch issue
    const issueResponse = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/issues/${issueNumber}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
          'User-Agent': 'ralph-starter/0.1.0',
        },
      }
    );

    if (!issueResponse.ok) {
      if (issueResponse.status === 404) {
        this.error(`Issue #${issueNumber} not found in ${owner}/${repo}`);
      }
      this.error(`GitHub API error: ${issueResponse.status} ${issueResponse.statusText}`);
    }

    const issue = (await issueResponse.json()) as GitHubIssue;

    // Fetch comments
    const commentsResponse = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/issues/${issueNumber}/comments`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
          'User-Agent': 'ralph-starter/0.1.0',
        },
      }
    );

    let comments: GitHubComment[] = [];
    if (commentsResponse.ok) {
      comments = (await commentsResponse.json()) as GitHubComment[];
    }

    return this.formatSingleIssue({ ...issue, comments }, owner, repo);
  }

  private formatSingleIssue(
    issue: GitHubIssueWithComments,
    owner: string,
    repo: string
  ): SourceResult {
    const labels = issue.labels
      ?.map((l) => (typeof l === 'string' ? l : l.name))
      .filter(Boolean)
      .join(', ');

    const sections: string[] = [
      `# Issue #${issue.number}: ${issue.title}`,
      '',
      `**Repository:** ${owner}/${repo}`,
      `**State:** ${issue.state}`,
    ];

    if (labels) {
      sections.push(`**Labels:** ${labels}`);
    }

    sections.push('', '---', '');

    if (issue.body) {
      sections.push(issue.body);
    } else {
      sections.push('*No description provided*');
    }

    // Add comments if present
    if (issue.comments && issue.comments.length > 0) {
      sections.push('', '---', '', '## Comments', '');
      for (const comment of issue.comments) {
        const author = typeof comment.author === 'string' ? comment.author : comment.author?.login;
        const user = comment.user?.login;
        sections.push(`### ${author || user || 'Unknown'}:`);
        sections.push('');
        sections.push(comment.body || '*No content*');
        sections.push('');
      }
    }

    return {
      content: sections.join('\n'),
      source: `github:${owner}/${repo}#${issue.number}`,
      title: `Issue #${issue.number}: ${issue.title}`,
      metadata: {
        type: 'github',
        owner,
        repo,
        issue: issue.number,
        state: issue.state,
      },
    };
  }

  private formatIssues(issues: GitHubIssue[], owner: string, repo: string): SourceResult {
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

  protected getRequiredCredentialKey(): string {
    return 'token';
  }

  getHelp(): string {
    return `
github: Fetch issues from GitHub repositories

Usage:
  ralph-starter run --from github --issue 123
  ralph-starter run --from github --project owner/repo
  ralph-starter run --from github --project owner/repo --label bug
  ralph-starter run --from github --project owner/repo --issue 123
  ralph-starter run --from github --project https://github.com/owner/repo/issues/123

Options:
  --project  Repository in owner/repo format or GitHub URL
             (defaults to configured defaultIssuesRepo when using --issue alone)
  --issue    Specific issue number to fetch
  --label    Filter by label name (for listing issues)
  --status   Issue state: open, closed, all (default: open)
  --limit    Maximum issues to fetch (default: 20)

Authentication:
  Uses 'gh' CLI if available and authenticated
  Otherwise requires: ralph-starter config set github.token <token>

Configuration:
  Set default issues repository:
  ralph-starter config set github.defaultIssuesRepo owner/repo

Examples:
  # Fetch from default repo (uses configured defaultIssuesRepo)
  ralph-starter run --from github --issue 18

  # Fetch a single issue from specific repo
  ralph-starter run --from github --project facebook/react --issue 12345
  ralph-starter run --from github --project https://github.com/facebook/react/issues/12345

  # Fetch multiple issues with filters
  ralph-starter run --from github --project facebook/react --label "good first issue"
  ralph-starter run --from github --project my-org/my-repo --status all --limit 5
`.trim();
  }
}

interface GitHubIssue {
  number: number;
  title: string;
  body?: string;
  state: string;
  labels?: Array<string | { name: string }>;
}

interface GitHubComment {
  body?: string;
  author?: string | { login: string };
  user?: { login: string };
}

interface GitHubIssueWithComments extends GitHubIssue {
  comments?: GitHubComment[];
}
