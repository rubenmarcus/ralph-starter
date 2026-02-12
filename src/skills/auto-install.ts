import chalk from 'chalk';
import { execa } from 'execa';
import ora from 'ora';
import { findSkill } from '../loop/skills.js';

export interface SkillCandidate {
  fullName: string; // owner/repo@skill
  repo: string;
  skill: string;
  score: number;
}

const MAX_SKILLS_TO_INSTALL = 2;
const SKILLS_CLI = 'skills';

function buildSkillQueries(task: string): string[] {
  const queries = new Set<string>();
  const text = task.toLowerCase();

  if (text.includes('astro')) queries.add('astro');
  if (text.includes('react')) queries.add('react');
  if (text.includes('next')) queries.add('nextjs');
  if (text.includes('tailwind')) queries.add('tailwind');
  if (text.includes('seo')) queries.add('seo');
  if (text.includes('accessibility') || text.includes('a11y')) queries.add('accessibility');

  if (
    text.includes('landing') ||
    text.includes('website') ||
    text.includes('web app') ||
    text.includes('portfolio') ||
    text.includes('marketing')
  ) {
    queries.add('frontend design');
    queries.add('web design');
  }

  if (text.includes('design') || text.includes('ui') || text.includes('ux')) {
    queries.add('ui design');
  }

  if (queries.size === 0) {
    queries.add('web design');
  }

  return Array.from(queries);
}

function parseSkillLine(line: string): SkillCandidate | null {
  const match = line.match(/([a-z0-9_.-]+\/[a-z0-9_.-]+@[a-z0-9_.-]+)/i);
  if (!match) return null;

  const fullName = match[1];
  const [repo, skill] = fullName.split('@');
  if (!repo || !skill) return null;

  return {
    fullName,
    repo,
    skill,
    score: 0,
  };
}

function scoreCandidate(candidate: SkillCandidate, task: string): number {
  const text = `${candidate.fullName}`.toLowerCase();
  const taskLower = task.toLowerCase();
  let score = 0;

  const boost = (keyword: string, weight: number) => {
    if (text.includes(keyword)) score += weight;
  };

  boost('frontend', 3);
  boost('design', 3);
  boost('ui', 2);
  boost('ux', 2);
  boost('landing', 2);
  boost('astro', taskLower.includes('astro') ? 3 : 1);
  boost('react', taskLower.includes('react') ? 2 : 0);
  boost('next', taskLower.includes('next') ? 2 : 0);
  boost('tailwind', taskLower.includes('tailwind') ? 2 : 0);
  boost('seo', taskLower.includes('seo') ? 2 : 0);

  return score;
}

function rankCandidates(candidates: SkillCandidate[], task: string): SkillCandidate[] {
  for (const candidate of candidates) {
    candidate.score = scoreCandidate(candidate, task);
  }

  return candidates.sort((a, b) => b.score - a.score);
}

async function findSkillsByQuery(query: string): Promise<SkillCandidate[]> {
  try {
    const result = await execa('npx', [SKILLS_CLI, 'find', query], {
      stdio: 'pipe',
    });

    const lines = result.stdout.split('\n').map((line) => line.trim());
    const candidates: SkillCandidate[] = [];

    for (const line of lines) {
      const candidate = parseSkillLine(line);
      if (candidate) {
        candidates.push(candidate);
      }
    }

    return candidates;
  } catch {
    return [];
  }
}

async function installSkill(candidate: SkillCandidate, globalInstall: boolean): Promise<boolean> {
  const args = [SKILLS_CLI, 'add', candidate.fullName, '-y'];
  if (globalInstall) args.push('-g');

  try {
    await execa('npx', args, { stdio: 'inherit' });
    return true;
  } catch {
    return false;
  }
}

export async function autoInstallSkillsFromTask(task: string, cwd: string): Promise<string[]> {
  if (!task.trim()) return [];
  const autoInstallEnabled = process.env.RALPH_ENABLE_SKILL_AUTO_INSTALL === '1';
  if (!autoInstallEnabled || process.env.RALPH_DISABLE_SKILL_AUTO_INSTALL === '1') return [];

  const queries = buildSkillQueries(task);
  if (queries.length === 0) return [];

  const spinner = ora('Searching skills.sh for relevant skills...').start();
  const allCandidates = new Map<string, SkillCandidate>();

  for (const query of queries) {
    const candidates = await findSkillsByQuery(query);
    for (const candidate of candidates) {
      if (!allCandidates.has(candidate.fullName)) {
        allCandidates.set(candidate.fullName, candidate);
      }
    }
  }

  if (allCandidates.size === 0) {
    spinner.warn('No skills found from skills.sh');
    return [];
  }

  const ranked = rankCandidates(Array.from(allCandidates.values()), task);
  const toInstall = ranked
    .filter((candidate) => !findSkill(cwd, candidate.skill))
    .slice(0, MAX_SKILLS_TO_INSTALL);

  if (toInstall.length === 0) {
    spinner.succeed('Relevant skills already installed');
    return [];
  }

  spinner.stop();
  console.log(chalk.cyan('Installing recommended skills from skills.sh...'));

  const installed: string[] = [];
  for (const candidate of toInstall) {
    console.log(chalk.dim(`  • ${candidate.fullName}`));
    const ok = await installSkill(candidate, true);
    if (ok) {
      installed.push(candidate.skill);
    }
  }

  if (installed.length > 0) {
    console.log(chalk.green(`Installed skills: ${installed.join(', ')}`));
  } else {
    console.log(chalk.yellow('No skills were installed.'));
  }

  return installed;
}
