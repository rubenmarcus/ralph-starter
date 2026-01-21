import { simpleGit, SimpleGit } from 'simple-git';
import { execa } from 'execa';

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
}

export async function createPullRequest(cwd: string, options: PROptions): Promise<string> {
  // Use GitHub CLI (gh) to create PR
  const args = [
    'pr', 'create',
    '--title', options.title,
    '--body', options.body,
  ];

  if (options.base) {
    args.push('--base', options.base);
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
    return log.all.map(commit => commit.message);
  } catch {
    return [];
  }
}
