import chalk from 'chalk';
import { execa } from 'execa';
import inquirer from 'inquirer';
import ora from 'ora';

interface SkillOptions {
  global?: boolean;
}

// Popular skills registry (curated list)
const POPULAR_SKILLS = [
  {
    name: 'vercel-labs/agent-skills',
    description: 'React, Next.js, and Vercel best practices',
    skills: [
      'react-best-practices',
      'nextjs-best-practices',
      'vercel-best-practices',
      'web-design-review',
    ],
  },
  // Add more as the ecosystem grows
];

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

  for (const repo of POPULAR_SKILLS) {
    console.log(chalk.white.bold(`  ${repo.name}`));
    console.log(chalk.dim(`  ${repo.description}`));
    console.log(chalk.gray(`  Skills: ${repo.skills.join(', ')}`));
    console.log();
  }

  console.log(chalk.dim('Install with: ralph-starter skill add <repo>'));
  console.log(chalk.dim('Browse more: https://github.com/topics/agent-skills'));
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
    console.log();
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
  console.log(chalk.gray('  list           List popular skills'));
  console.log(chalk.gray('  search <term>  Search for skills'));
  console.log(chalk.gray('  browse         Interactive skill browser'));
  console.log();
  console.log('Examples:');
  console.log(chalk.gray('  ralph-starter skill add vercel-labs/agent-skills'));
  console.log(chalk.gray('  ralph-starter skill list'));
  console.log(chalk.gray('  ralph-starter skill search react'));
}
