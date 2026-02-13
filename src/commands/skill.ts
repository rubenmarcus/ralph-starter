import { readFileSync } from 'node:fs';
import chalk from 'chalk';
import { execa } from 'execa';
import inquirer from 'inquirer';
import ora from 'ora';
import { findSkill } from '../loop/skills.js';

interface SkillOptions {
  global?: boolean;
}

export interface SkillEntry {
  name: string;
  description: string;
  category: string;
  skills: string[];
}

// Popular skills registry (curated list)
export const POPULAR_SKILLS: SkillEntry[] = [
  // Agents
  {
    name: 'vercel-labs/agent-skills',
    description: 'React, Next.js, and Vercel best practices',
    category: 'agents',
    skills: [
      'react-best-practices',
      'nextjs-best-practices',
      'vercel-best-practices',
      'web-design-review',
    ],
  },
  {
    name: 'anthropics/claude-code-best-practices',
    description: 'Claude Code optimization patterns and workflows',
    category: 'agents',
    skills: ['claude-code-patterns', 'prompt-engineering'],
  },
  // Development
  {
    name: 'nicepkg/aide-skill',
    description: 'Universal coding assistant skills for multiple editors',
    category: 'development',
    skills: ['code-generation', 'refactoring'],
  },
  {
    name: 'nickbaumann98/cursor-skills',
    description: 'Cursor IDE rules and development patterns',
    category: 'development',
    skills: ['cursor-rules', 'code-review'],
  },
  // Testing
  {
    name: 'testing-patterns/vitest-skills',
    description: 'Testing best practices with Vitest and Jest',
    category: 'testing',
    skills: ['vitest-patterns', 'testing-strategies', 'mocking'],
  },
  // Design
  {
    name: 'design-system/figma-to-code',
    description: 'Figma design to code conversion workflows',
    category: 'design',
    skills: ['figma-react', 'design-tokens', 'component-extraction'],
  },
];

// Category display names and order
const CATEGORY_LABELS: Record<string, string> = {
  agents: 'Agent Skills',
  development: 'Development',
  testing: 'Testing',
  design: 'Design',
};

export async function skillCommand(
  action: string,
  skillName?: string,
  options: SkillOptions = {}
): Promise<void> {
  switch (action) {
    case 'add':
    case 'install':
    case 'i':
      if (!skillName) {
        console.log(chalk.red('Please specify a skill to install.'));
        console.log(chalk.gray('  Example: ralph-starter skill add vercel-labs/agent-skills'));
        return;
      }
      await addSkill(skillName, options);
      break;

    case 'list':
    case 'ls':
      await listSkills();
      break;

    case 'search':
      await searchSkills(skillName);
      break;

    case 'browse':
      await browseSkills();
      break;

    case 'info':
      await showSkillInfo(skillName);
      break;

    default:
      console.log(chalk.red(`Unknown action: ${action}`));
      showSkillHelp();
  }
}

async function addSkill(skillName: string, options: SkillOptions): Promise<void> {
  const spinner = ora();

  console.log();
  console.log(chalk.cyan(`Installing skill: ${chalk.bold(skillName)}`));
  console.log();

  // Check if add-skill is available
  spinner.start('Checking for add-skill CLI...');

  try {
    await execa('npx', ['add-skill', '--version']);
    spinner.succeed('add-skill CLI available');
  } catch {
    spinner.warn('add-skill not found, will use npx');
  }

  // Install the skill using add-skill
  spinner.start('Installing skill...');

  try {
    const args = [skillName];
    if (options.global) {
      args.push('--global');
    }

    await execa('npx', ['add-skill', ...args], {
      stdio: 'inherit',
    });

    spinner.succeed('Skill installed successfully!');
  } catch (_error) {
    spinner.fail('Failed to install skill');
    console.log();
    console.log(chalk.yellow('Try running manually:'));
    console.log(chalk.gray(`  npx add-skill ${skillName}`));
  }
}

async function listSkills(): Promise<void> {
  console.log();
  console.log(chalk.cyan.bold('Popular Skills'));
  console.log();

  // Group by category
  const categories = [...new Set(POPULAR_SKILLS.map((s) => s.category))];

  for (const category of categories) {
    const label = CATEGORY_LABELS[category] || category;
    console.log(chalk.dim(`  ── ${label} ──`));
    console.log();

    const categorySkills = POPULAR_SKILLS.filter((s) => s.category === category);
    for (const repo of categorySkills) {
      console.log(chalk.white.bold(`  ${repo.name}`));
      console.log(chalk.dim(`  ${repo.description}`));
      console.log(chalk.gray(`  Skills: ${repo.skills.join(', ')}`));
      console.log();
    }
  }

  console.log(chalk.dim('Install with: ralph-starter skill add <repo>'));
  console.log(chalk.dim('Show details: ralph-starter skill info <name>'));
  console.log(chalk.dim('Browse more:  https://github.com/topics/agent-skills'));
}

async function searchSkills(query?: string): Promise<void> {
  if (!query) {
    console.log(chalk.yellow('Please provide a search term.'));
    console.log(chalk.gray('  Example: ralph-starter skill search react'));
    return;
  }

  console.log();
  console.log(chalk.cyan(`Searching for: ${chalk.bold(query)}`));
  console.log();

  // Filter popular skills by query
  const results = POPULAR_SKILLS.filter(
    (repo) =>
      repo.name.toLowerCase().includes(query.toLowerCase()) ||
      repo.description.toLowerCase().includes(query.toLowerCase()) ||
      repo.category.toLowerCase().includes(query.toLowerCase()) ||
      repo.skills.some((s) => s.toLowerCase().includes(query.toLowerCase()))
  );

  if (results.length === 0) {
    console.log(chalk.gray('No skills found. Try browsing GitHub:'));
    console.log(chalk.blue('  https://github.com/topics/agent-skills'));
    return;
  }

  for (const repo of results) {
    console.log(chalk.white.bold(`  ${repo.name}`));
    console.log(chalk.dim(`  ${repo.description}`));
    console.log(chalk.gray(`  Category: ${CATEGORY_LABELS[repo.category] || repo.category}`));
    console.log();
  }
}

async function showSkillInfo(name?: string): Promise<void> {
  if (!name) {
    console.log(chalk.yellow('Please specify a skill name.'));
    console.log(chalk.gray('  Example: ralph-starter skill info react-best-practices'));
    return;
  }

  const cwd = process.cwd();
  const skill = findSkill(cwd, name);

  if (!skill) {
    console.log(chalk.yellow(`Skill "${name}" not found locally.`));
    console.log(chalk.dim('  Searched: ~/.claude/skills/, .claude/skills/, .agents/skills/'));
    console.log();

    // Check if it's in the registry
    const registered = POPULAR_SKILLS.find(
      (s) =>
        s.name.toLowerCase().includes(name.toLowerCase()) ||
        s.skills.some((sk) => sk.toLowerCase().includes(name.toLowerCase()))
    );
    if (registered) {
      console.log(chalk.cyan(`Found in registry: ${registered.name}`));
      console.log(chalk.dim(`  ${registered.description}`));
      console.log(chalk.dim(`  Install: ralph-starter skill add ${registered.name}`));
    }
    return;
  }

  console.log();
  console.log(chalk.cyan.bold(`Skill: ${skill.name}`));
  console.log(chalk.dim(`  Source: ${skill.source}`));
  console.log(chalk.dim(`  Path: ${skill.path}`));
  if (skill.description) {
    console.log(chalk.dim(`  Description: ${skill.description}`));
  }
  console.log();

  // Show skill content
  try {
    const content = readFileSync(skill.path, 'utf-8');
    console.log(chalk.dim('─'.repeat(60)));
    console.log(content);
    console.log(chalk.dim('─'.repeat(60)));
  } catch {
    console.log(chalk.red('  Could not read skill file'));
  }
}

async function browseSkills(): Promise<void> {
  const { skill } = await inquirer.prompt([
    {
      type: 'list',
      name: 'skill',
      message: 'Select a skill to install:',
      choices: [
        ...POPULAR_SKILLS.map((repo) => ({
          name: `${repo.name} - ${chalk.dim(repo.description)}`,
          value: repo.name,
        })),
        new inquirer.Separator(),
        { name: chalk.dim('Cancel'), value: null },
      ],
    },
  ]);

  if (skill) {
    await addSkill(skill, {});
  }
}

function showSkillHelp(): void {
  console.log();
  console.log(chalk.cyan.bold('ralph-starter skill'));
  console.log();
  console.log('Commands:');
  console.log(chalk.gray('  add <repo>     Install a skill from a git repository'));
  console.log(chalk.gray('  list           List popular skills by category'));
  console.log(chalk.gray('  search <term>  Search for skills'));
  console.log(chalk.gray('  info <name>    Show details of an installed skill'));
  console.log(chalk.gray('  browse         Interactive skill browser'));
  console.log();
  console.log('Examples:');
  console.log(chalk.gray('  ralph-starter skill add vercel-labs/agent-skills'));
  console.log(chalk.gray('  ralph-starter skill list'));
  console.log(chalk.gray('  ralph-starter skill search react'));
  console.log(chalk.gray('  ralph-starter skill info frontend-design'));
}
