// UI components for Idea Mode

import chalk from 'chalk';
import inquirer from 'inquirer';
import type { IdeaSuggestion, IdeaDiscoveryMethod, IdeaContext } from './types.js';

/**
 * Display the idea mode welcome banner
 */
export function showIdeaWelcome(): void {
  console.log();
  console.log(
    chalk.magenta('  ╭─────────────────────────────────────────────────────────────╮')
  );
  console.log(
    chalk.magenta('  │') +
      '                                                             ' +
      chalk.magenta('│')
  );
  console.log(
    chalk.magenta('  │') +
      '   ' +
      chalk.bold.white("Let's discover what to build!") +
      '                          ' +
      chalk.magenta('│')
  );
  console.log(
    chalk.magenta('  │') +
      '                                                             ' +
      chalk.magenta('│')
  );
  console.log(
    chalk.magenta('  │') +
      '   ' +
      chalk.dim("Don't have a project idea? No problem.") +
      '                  ' +
      chalk.magenta('│')
  );
  console.log(
    chalk.magenta('  │') +
      '   ' +
      chalk.dim("I'll help you brainstorm something awesome.") +
      '              ' +
      chalk.magenta('│')
  );
  console.log(
    chalk.magenta('  │') +
      '                                                             ' +
      chalk.magenta('│')
  );
  console.log(
    chalk.magenta('  ╰─────────────────────────────────────────────────────────────╯')
  );
  console.log();
}

/**
 * Ask how the user wants to discover ideas
 */
export async function askDiscoveryMethod(): Promise<IdeaDiscoveryMethod> {
  const { method } = await inquirer.prompt([
    {
      type: 'list',
      name: 'method',
      message: 'How would you like to discover ideas?',
      choices: [
        {
          name: 'Brainstorm with AI - Get creative suggestions',
          value: 'brainstorm',
        },
        {
          name: 'See trending ideas - Based on 2025-2026 tech trends',
          value: 'trending',
        },
        {
          name: 'Based on my skills - Personalized to what I know',
          value: 'skills',
        },
        {
          name: 'Solve a problem I have - Help me fix something',
          value: 'problem',
        },
      ],
    },
  ]);

  return method;
}

/**
 * Ask for user's skills for skill-based suggestions
 */
export async function askUserSkills(): Promise<string[]> {
  const { skills } = await inquirer.prompt([
    {
      type: 'checkbox',
      name: 'skills',
      message: 'What technologies do you know? (select all that apply)',
      choices: [
        { name: 'JavaScript/TypeScript', value: 'javascript' },
        { name: 'React', value: 'react' },
        { name: 'Node.js', value: 'nodejs' },
        { name: 'Python', value: 'python' },
        { name: 'Go', value: 'go' },
        { name: 'Rust', value: 'rust' },
        { name: 'SQL/Databases', value: 'sql' },
        { name: 'APIs/REST', value: 'api' },
        { name: 'DevOps/CLI', value: 'devops' },
        { name: 'Mobile Development', value: 'mobile' },
      ],
      validate: (input: string[]) =>
        input.length > 0 ? true : 'Please select at least one skill',
    },
  ]);

  // Ask for additional skills
  const { additional } = await inquirer.prompt([
    {
      type: 'input',
      name: 'additional',
      message: 'Any other skills or interests? (optional)',
      suffix: '\n  (e.g., "machine learning, gaming, productivity")\n  >',
    },
  ]);

  if (additional.trim()) {
    skills.push(...additional.split(',').map((s: string) => s.trim()));
  }

  return skills;
}

/**
 * Ask for the problem the user wants to solve
 */
export async function askUserProblem(): Promise<string> {
  const { problem } = await inquirer.prompt([
    {
      type: 'input',
      name: 'problem',
      message: "What problem or frustration do you want to solve?",
      suffix:
        '\n  (e.g., "I spend too much time organizing my notes" or "Managing dotfiles is painful")\n  >',
      validate: (input: string) =>
        input.trim().length > 0 ? true : 'Please describe your problem',
    },
  ]);

  return problem.trim();
}

/**
 * Display brainstorm results
 */
export function showBrainstormResults(ideas: IdeaSuggestion[]): void {
  console.log();
  console.log(chalk.cyan.bold('  Here are some ideas for you:'));
  console.log(chalk.gray('  ────────────────────────────────────────────────────────────'));
  console.log();

  ideas.forEach((idea, index) => {
    const difficultyColor =
      idea.difficulty === 'easy'
        ? chalk.green
        : idea.difficulty === 'moderate'
          ? chalk.yellow
          : chalk.red;

    console.log(
      `  ${chalk.bold.white(`${index + 1}.`)} ${chalk.bold.cyan(idea.title)}`
    );
    console.log(`     ${chalk.dim(idea.description)}`);
    console.log(
      `     ${chalk.gray('Type:')} ${formatProjectType(idea.projectType)}  ${chalk.gray('|')}  ${chalk.gray('Difficulty:')} ${difficultyColor(idea.difficulty)}`
    );
    if (idea.reasons.length > 0) {
      console.log(`     ${chalk.gray('Why:')} ${idea.reasons[0]}`);
    }
    console.log();
  });

  console.log(chalk.gray('  ────────────────────────────────────────────────────────────'));
  console.log();
}

/**
 * Ask user to select an idea
 */
export async function selectIdea(ideas: IdeaSuggestion[]): Promise<IdeaSuggestion | null> {
  const choices = ideas.map((idea, index) => ({
    name: `${idea.title} - ${idea.description.substring(0, 50)}...`,
    value: index,
  }));

  choices.push({
    name: "None of these - I'll describe my own idea",
    value: -1,
  });

  choices.push({
    name: 'Generate more ideas',
    value: -2,
  });

  const { selection } = await inquirer.prompt([
    {
      type: 'list',
      name: 'selection',
      message: 'Which idea interests you?',
      choices,
    },
  ]);

  if (selection === -1) {
    return null; // User wants to describe their own
  }

  if (selection === -2) {
    return { title: '__REGENERATE__' } as IdeaSuggestion; // Signal to regenerate
  }

  return ideas[selection];
}

/**
 * Build context from user preferences
 */
export async function buildIdeaContext(): Promise<IdeaContext> {
  const method = await askDiscoveryMethod();
  const context: IdeaContext = { method };

  if (method === 'skills') {
    context.skills = await askUserSkills();
  } else if (method === 'problem') {
    context.problem = await askUserProblem();
  }

  return context;
}

/**
 * Format project type for display
 */
function formatProjectType(type: string): string {
  const types: Record<string, string> = {
    web: 'Web App',
    api: 'API',
    cli: 'CLI Tool',
    mobile: 'Mobile App',
    library: 'Library',
    automation: 'Automation',
  };
  return types[type] || type;
}

/**
 * Show loading message for idea generation
 */
export function showIdeaLoading(method: IdeaDiscoveryMethod): string {
  const messages: Record<IdeaDiscoveryMethod, string> = {
    brainstorm: 'Brainstorming creative ideas...',
    trending: 'Looking at current tech trends...',
    skills: 'Finding ideas that match your skills...',
    problem: 'Thinking about solutions to your problem...',
  };
  return messages[method];
}
