import { execa } from 'execa';
import { type SimpleGit, simpleGit } from 'simple-git';

export async function hasUncommittedChanges(cwd: string): Promise<boolean> {
  const git: SimpleGit = simpleGit({ baseDir: cwd });

  try {
    const status = await git.status();
    return !status.isClean();
  } catch {
    return false;
  }
}

export async function gitCommit(cwd: string, message: string): Promise<void> {
  const git: SimpleGit = simpleGit({ baseDir: cwd });

  // Stage all changes
  await git.add('.');

  // Commit with message
  await git.commit(message);
}

export async function gitPush(cwd: string, branch?: string): Promise<void> {
  const git: SimpleGit = simpleGit({ baseDir: cwd });

  if (branch) {
    await git.push('origin', branch);
  } else {
    await git.push();
  }
}

export async function getCurrentBranch(cwd: string): Promise<string> {
  const git: SimpleGit = simpleGit({ baseDir: cwd });
  const branch = await git.revparse(['--abbrev-ref', 'HEAD']);
  return branch.trim();
}

export async function createBranch(cwd: string, branchName: string): Promise<void> {
  const git: SimpleGit = simpleGit({ baseDir: cwd });
  await git.checkoutLocalBranch(branchName);
}

export interface PROptions {
  title: string;
  body: string;
  base?: string;
  labels?: string[];
}

export async function createPullRequest(cwd: string, options: PROptions): Promise<string> {
  // Create labels if they don't exist (silently ignore errors)
  if (options.labels && options.labels.length > 0) {
    for (const label of options.labels) {
      try {
        await execa('gh', ['label', 'create', label, '--force'], { cwd });
      } catch {
        // Label may already exist or other error, continue anyway
      }
    }
  }

  // Use GitHub CLI (gh) to create PR
  const args = ['pr', 'create', '--title', options.title, '--body', options.body];

  if (options.base) {
    args.push('--base', options.base);
  }

  // Add labels
  if (options.labels && options.labels.length > 0) {
    for (const label of options.labels) {
      args.push('--label', label);
    }
  }

  const result = await execa('gh', args, { cwd });

  // Extract PR URL from output
  const urlMatch = result.stdout.match(/https:\/\/github\.com\/[^\s]+/);
  return urlMatch ? urlMatch[0] : result.stdout;
}

export async function isGitRepo(cwd: string): Promise<boolean> {
  const git: SimpleGit = simpleGit({ baseDir: cwd });

  try {
    await git.revparse(['--git-dir']);
    return true;
  } catch {
    return false;
  }
}

export async function initGitRepo(cwd: string): Promise<void> {
  const git: SimpleGit = simpleGit({ baseDir: cwd });
  await git.init();
}

export async function getRecentCommits(cwd: string, count: number = 5): Promise<string[]> {
  const git: SimpleGit = simpleGit({ baseDir: cwd });

  try {
    const log = await git.log({ maxCount: count });
    return log.all.map((commit) => commit.message);
  } catch {
    return [];
  }
}

export type SemanticPrType =
  | 'feat'
  | 'fix'
  | 'docs'
  | 'chore'
  | 'refactor'
  | 'test'
  | 'build'
  | 'perf'
  | 'ci';

export interface SemanticTitleOptions {
  type?: SemanticPrType;
  scope?: string;
  isBuildMode?: boolean;
}

/**
 * Generate a semantic PR title from a task description
 * Follows conventional commit format: type(scope): description
 */
export function generateSemanticPrTitle(task: string, options: SemanticTitleOptions = {}): string {
  const { scope = 'auto', isBuildMode = false } = options;

  // Determine type from task content if not explicitly provided
  let inferredType: SemanticPrType = options.type || 'feat';
  const lowerTask = task.toLowerCase();

  if (!options.type) {
    if (lowerTask.includes('fix') || lowerTask.includes('bug') || lowerTask.includes('error')) {
      inferredType = 'fix';
    } else if (lowerTask.includes('test') || lowerTask.includes('spec')) {
      inferredType = 'test';
    } else if (lowerTask.includes('doc') || lowerTask.includes('readme')) {
      inferredType = 'docs';
    } else if (lowerTask.includes('refactor') || lowerTask.includes('cleanup')) {
      inferredType = 'refactor';
    } else if (lowerTask.includes('perf') || lowerTask.includes('optimi')) {
      inferredType = 'perf';
    }
  }

  // Extract a clean description
  let description: string;
  if (isBuildMode) {
    description = 'implement planned changes';
  } else {
    // Take first meaningful part of task, lowercase, remove special chars
    description = task
      .split('\n')[0] // First line only
      .replace(/^(build|create|implement|add|fix|update)\s+/i, '') // Remove action verbs
      .replace(/[^\w\s-]/g, '') // Remove special chars
      .trim()
      .toLowerCase()
      .slice(0, 50); // Limit length

    // Ensure it starts with lowercase letter
    if (description && !/^[a-z]/.test(description)) {
      description = description.charAt(0).toLowerCase() + description.slice(1);
    }
  }

  // Build the title: type(scope): description
  return `${inferredType}(${scope}): ${description || 'automated changes'}`;
}

export interface IssueRef {
  owner: string;
  repo: string;
  number: number;
}

export interface PrBodyOptions {
  task: string;
  commits: string[];
  issueRef?: IssueRef;
  iterations?: number;
}

/**
 * Format PR body with proper markdown and issue linking
 */
export function formatPrBody(options: PrBodyOptions): string {
  const sections: string[] = [];

  // Summary section
  sections.push('## Summary');
  sections.push('');
  sections.push('Automated PR created by [ralph-starter](https://github.com/rubenmarcus/ralph-starter).');
  sections.push('');

  // Task section
  sections.push('## Task');
  sections.push('');
  // Truncate very long tasks but keep first paragraph
  const taskPreview = options.task.split('\n\n')[0].slice(0, 500);
  sections.push(taskPreview);
  if (options.task.length > 500) {
    sections.push('');
    sections.push('...');
  }
  sections.push('');

  // Commits section
  if (options.commits.length > 0) {
    sections.push('## Commits');
    sections.push('');
    for (const commit of options.commits) {
      sections.push(`- ${commit}`);
    }
    sections.push('');
  }

  // Issue linking section (important for pr-issue-check.yml)
  if (options.issueRef) {
    sections.push('## Related Issue');
    sections.push('');
    const { owner, repo, number } = options.issueRef;
    // Use "Closes" for auto-close on merge
    sections.push(`Closes ${owner}/${repo}#${number}`);
    sections.push('');
  }

  // Execution details footer
  if (options.iterations) {
    sections.push('## Execution Details');
    sections.push('');
    sections.push(`- Iterations: ${options.iterations}`);
    sections.push('');
  }

  sections.push('---');
  sections.push('');
  sections.push('*Generated by [ralph-starter](https://github.com/rubenmarcus/ralph-starter) auto mode*');

  return sections.join('\n');
}
