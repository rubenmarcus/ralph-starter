import chalk from 'chalk';
import ora from 'ora';
import { POPULAR_SKILLS } from '../commands/skill.js';
import { type ClaudeSkill, detectClaudeSkills, WEB_TASK_KEYWORDS } from '../loop/skills.js';

export interface SkillCandidate {
  fullName: string; // owner/repo@skill
  repo: string;
  skill: string;
  installs: number;
  score: number;
}

const MAX_SKILLS_TO_INSTALL = 5;

/**
 * Normalize a skill identifier for comparison.
 * Handles mismatches between YAML frontmatter names (may use spaces/caps)
 * and skills.sh API skillIds (always hyphenated lowercase).
 */
function normalizeSkillId(name: string): string {
  return name.toLowerCase().replace(/[\s_]+/g, '-');
}
const SKILLS_API_URL = 'https://skills.sh/api/search';
const SKILLS_CLI = 'skills';

/** Shape of a single skill from the skills.sh search API */
interface SkillsApiSkill {
  id: string;
  skillId: string;
  name: string;
  installs: number;
  source: string;
}

/** Keywords that indicate a skill is NOT relevant for standard web projects */
const WEB_NEGATIVE_KEYWORDS = [
  'react-native',
  'mobile',
  'ios',
  'android',
  'flutter',
  'swift',
  'kotlin',
];

function buildSkillQueries(task: string): string[] {
  const queries = new Set<string>();
  const text = task.toLowerCase();

  // Framework-specific skills
  if (text.includes('astro')) queries.add('astro');
  if (text.includes('react') || text.includes('jsx')) {
    queries.add('react best practices');
    queries.add('react composition patterns');
  }
  if (text.includes('next')) queries.add('nextjs');
  if (text.includes('vue')) queries.add('vue');
  if (text.includes('svelte')) queries.add('svelte');
  if (text.includes('tailwind')) queries.add('tailwind');
  if (text.includes('seo')) queries.add('seo');
  if (text.includes('accessibility') || text.includes('a11y')) queries.add('accessibility');

  // Landing/marketing pages get SEO + design skills automatically
  if (
    text.includes('landing') ||
    text.includes('website') ||
    text.includes('web app') ||
    text.includes('portfolio') ||
    text.includes('marketing')
  ) {
    queries.add('frontend design');
    queries.add('seo');
  }

  if (text.includes('design') || text.includes('ui') || text.includes('ux')) {
    queries.add('ui design');
  }

  // CSS/styling tasks get design skills
  const cssKeywords = [
    'css',
    'style',
    'styling',
    'padding',
    'margin',
    'spacing',
    'color',
    'colour',
    'background',
    'theme',
    'font',
    'typography',
    'border',
    'shadow',
    'layout',
    'responsive',
    'animation',
    'grid',
    'flex',
  ];
  if (cssKeywords.some((kw) => text.includes(kw))) {
    queries.add('frontend design');
    queries.add('ui design');
  }

  if (queries.size === 0) {
    queries.add('web design');
  }

  return Array.from(queries);
}

/**
 * Check if a skill is relevant to the given task.
 * Reuses the same logic as the executor's shouldAutoApplySkill.
 */
function isSkillRelevantToTask(skill: ClaudeSkill, task: string): boolean {
  const name = skill.name.toLowerCase();
  const desc = (skill.description || '').toLowerCase();
  const text = `${name} ${desc}`;
  const taskLower = task.toLowerCase();

  const taskIsWeb = WEB_TASK_KEYWORDS.some((kw) => taskLower.includes(kw));

  const isDesignSkill =
    text.includes('design') ||
    text.includes('ui') ||
    text.includes('ux') ||
    text.includes('frontend');

  if (taskIsWeb && isDesignSkill) return true;
  if (taskLower.includes('astro') && text.includes('astro')) return true;
  if (taskLower.includes('tailwind') && text.includes('tailwind')) return true;
  if (taskLower.includes('seo') && text.includes('seo')) return true;

  return false;
}

/**
 * Check if a candidate skill is irrelevant to the task (negative filtering).
 * E.g., react-native-design for a web landing page.
 */
function isCandidateIrrelevant(candidate: SkillCandidate, task: string): boolean {
  const taskLower = task.toLowerCase();
  const skillText = `${candidate.fullName} ${candidate.skill}`.toLowerCase();

  // If the task explicitly mentions a platform, don't filter it out
  for (const keyword of WEB_NEGATIVE_KEYWORDS) {
    if (taskLower.includes(keyword)) return false;
  }

  // For standard web tasks, filter out mobile/native skills
  return WEB_NEGATIVE_KEYWORDS.some((keyword) => skillText.includes(keyword));
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
  boost('best-practices', 2);
  boost('composition', 2);
  boost('guidelines', 2);
  boost('ui', 2);
  boost('ux', 2);
  boost('landing', 2);
  boost('astro', taskLower.includes('astro') ? 3 : 1);
  boost('react', taskLower.includes('react') ? 3 : 0);
  boost('next', taskLower.includes('next') ? 3 : 0);
  boost('tailwind', taskLower.includes('tailwind') ? 3 : 0);
  boost('seo', taskLower.includes('seo') ? 3 : 2); // SEO is always useful for web projects

  // Boost based on install count (popularity as quality signal)
  if (candidate.installs > 10000) score += 5;
  else if (candidate.installs > 1000) score += 3;
  else if (candidate.installs > 100) score += 1;

  return score;
}

function rankCandidates(candidates: SkillCandidate[], task: string): SkillCandidate[] {
  for (const candidate of candidates) {
    candidate.score = scoreCandidate(candidate, task);
  }

  return candidates.sort((a, b) => b.score - a.score);
}

/**
 * Search skills.sh HTTP API for skills matching a query.
 * Returns structured results with real repo names and install counts.
 */
async function findSkillsByQuery(query: string): Promise<SkillCandidate[]> {
  try {
    const url = `${SKILLS_API_URL}?q=${encodeURIComponent(query)}`;
    const resp = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!resp.ok) return [];

    const data = (await resp.json()) as { skills?: SkillsApiSkill[] };
    return (data.skills || []).map((s) => ({
      fullName: `${s.source}@${s.skillId}`,
      repo: s.source,
      skill: s.skillId,
      installs: s.installs ?? 0,
      score: 0,
    }));
  } catch {
    return []; // Timeout or network error — caller falls back to POPULAR_SKILLS
  }
}

/**
 * Fallback: match task keywords against the curated POPULAR_SKILLS registry
 * when the skills.sh API is unreachable.
 */
function fallbackFromPopularSkills(task: string): SkillCandidate[] {
  const taskLower = task.toLowerCase();
  const candidates: SkillCandidate[] = [];

  for (const entry of POPULAR_SKILLS) {
    const entryText = `${entry.name} ${entry.description} ${entry.category}`.toLowerCase();
    const matches =
      entry.skills.some((s) => taskLower.includes(s.split('-')[0])) ||
      entryText.includes('frontend') ||
      entryText.includes('design');

    if (matches) {
      for (const skill of entry.skills) {
        candidates.push({
          fullName: `${entry.name}@${skill}`,
          repo: entry.name,
          skill,
          installs: 0,
          score: 0,
        });
      }
    }
  }

  return candidates;
}

async function installSkill(candidate: SkillCandidate, globalInstall: boolean): Promise<boolean> {
  const { execa } = await import('execa');
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
  // Explicit disable is the only way to turn this off
  if (process.env.RALPH_DISABLE_SKILL_AUTO_INSTALL === '1') return [];

  // Detect what's already installed
  const installedSkills = detectClaudeSkills(cwd);
  const relevantInstalled = installedSkills.filter((s) => isSkillRelevantToTask(s, task));

  // Show installed skills to the user
  if (relevantInstalled.length > 0) {
    const names = relevantInstalled.map((s) => s.name);
    console.log(chalk.cyan(`Using installed skills: ${names.join(', ')}`));
  }

  // Skip API search when enough relevant skills are already installed
  const SUFFICIENT_RELEVANT_SKILLS = 3;
  if (relevantInstalled.length >= SUFFICIENT_RELEVANT_SKILLS) {
    console.log(
      chalk.green(`Sufficient skills installed (${relevantInstalled.length}), skipping search.`)
    );
    return relevantInstalled.map((s) => s.name);
  }

  // Search for complementary skills if we don't have enough relevant ones
  const queries = buildSkillQueries(task);
  if (queries.length === 0) return relevantInstalled.map((s) => s.name);

  const spinner = ora('Checking for complementary skills...').start();
  const allCandidates = new Map<string, SkillCandidate>();

  for (const query of queries) {
    const candidates = await findSkillsByQuery(query);
    for (const candidate of candidates) {
      if (!allCandidates.has(candidate.fullName)) {
        allCandidates.set(candidate.fullName, candidate);
      }
    }
  }

  // Fallback to curated registry if API returned nothing
  if (allCandidates.size === 0) {
    const fallback = fallbackFromPopularSkills(task);
    for (const candidate of fallback) {
      if (!allCandidates.has(candidate.fullName)) {
        allCandidates.set(candidate.fullName, candidate);
      }
    }
  }

  if (allCandidates.size === 0) {
    spinner.stop();
    return relevantInstalled.map((s) => s.name);
  }

  const ranked = rankCandidates(Array.from(allCandidates.values()), task);
  const toInstall = ranked
    .filter((candidate) => !isCandidateIrrelevant(candidate, task))
    .filter(
      (candidate) =>
        !installedSkills.some((s) => normalizeSkillId(s.name) === normalizeSkillId(candidate.skill))
    )
    .slice(0, MAX_SKILLS_TO_INSTALL);

  if (toInstall.length === 0) {
    spinner.succeed('All relevant skills already installed');
    return relevantInstalled.map((s) => s.name);
  }

  spinner.stop();
  console.log(chalk.cyan('Installing complementary skills from skills.sh...'));

  const installed: string[] = relevantInstalled.map((s) => s.name);
  for (const candidate of toInstall) {
    console.log(chalk.dim(`  • ${candidate.fullName}`));
    const ok = await installSkill(candidate, true);
    if (ok) {
      installed.push(candidate.skill);
    }
  }

  const newlyInstalled = installed.slice(relevantInstalled.length);
  if (newlyInstalled.length > 0) {
    console.log(chalk.green(`Installed: ${newlyInstalled.join(', ')}`));
  }

  return installed;
}
