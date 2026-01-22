import inquirer from 'inquirer';
import type { ProjectType, Complexity, TechStack, RefinedIdea } from './types.js';
import type { ProjectInfo, RalphPlaybookInfo } from '../commands/init.js';

/**
 * Ask if user has an idea or needs help brainstorming
 */
export async function askHasIdea(): Promise<'has_idea' | 'need_help'> {
  const { hasIdea } = await inquirer.prompt([
    {
      type: 'list',
      name: 'hasIdea',
      message: 'Do you have a project idea?',
      choices: [
        { name: 'Yes, I know what I want to build', value: 'has_idea' },
        { name: "No, help me brainstorm ideas", value: 'need_help' },
      ],
    },
  ]);

  return hasIdea;
}

/**
 * Ask for the user's idea
 */
export async function askForIdea(): Promise<string> {
  const { idea } = await inquirer.prompt([
    {
      type: 'input',
      name: 'idea',
      message: "What's your idea for today?",
      suffix: '\n  (e.g., "a habit tracker app" or "an API for managing recipes")\n  >',
      validate: (input: string) =>
        input.trim().length > 0 ? true : 'Please describe your idea',
    },
  ]);
  return idea.trim();
}

/**
 * Ask for project type if not detected
 */
export async function askForProjectType(
  suggestedType?: ProjectType
): Promise<ProjectType> {
  const choices = [
    { name: 'Web Application (React, Next.js, Vue, etc.)', value: 'web' },
    { name: 'API / Backend Service', value: 'api' },
    { name: 'Command Line Tool', value: 'cli' },
    { name: 'Mobile App (React Native, etc.)', value: 'mobile' },
    { name: 'Library / Package', value: 'library' },
    { name: 'Automation Script', value: 'automation' },
  ];

  // Move suggested type to top
  if (suggestedType) {
    const idx = choices.findIndex((c) => c.value === suggestedType);
    if (idx > 0) {
      const [choice] = choices.splice(idx, 1);
      choice.name = `${choice.name} (Recommended)`;
      choices.unshift(choice);
    }
  }

  const { projectType } = await inquirer.prompt([
    {
      type: 'list',
      name: 'projectType',
      message: 'What type of project is this?',
      choices,
    },
  ]);

  return projectType;
}

/**
 * Ask for tech stack preferences
 */
export async function askForTechStack(
  projectType: ProjectType,
  suggestedStack?: TechStack
): Promise<TechStack> {
  const stack: TechStack = {};

  // Frontend choice (for web/mobile)
  if (projectType === 'web' || projectType === 'mobile') {
    const frontendChoices =
      projectType === 'web'
        ? [
            { name: 'React', value: 'react' },
            { name: 'Next.js', value: 'nextjs' },
            { name: 'Vue', value: 'vue' },
            { name: 'Svelte', value: 'svelte' },
            { name: 'Vanilla JavaScript', value: 'vanilla' },
            { name: 'Let AI decide', value: 'auto' },
          ]
        : [
            { name: 'React Native', value: 'react-native' },
            { name: 'Expo', value: 'expo' },
            { name: 'Let AI decide', value: 'auto' },
          ];

    // Move suggested to top
    if (suggestedStack?.frontend) {
      const idx = frontendChoices.findIndex((c) => c.value === suggestedStack.frontend);
      if (idx > 0) {
        const [choice] = frontendChoices.splice(idx, 1);
        choice.name = `${choice.name} (Recommended)`;
        frontendChoices.unshift(choice);
      }
    }

    const { frontend } = await inquirer.prompt([
      {
        type: 'list',
        name: 'frontend',
        message:
          projectType === 'web' ? 'What frontend framework?' : 'What mobile framework?',
        choices: frontendChoices,
      },
    ]);

    if (frontend !== 'auto') {
      stack.frontend = frontend;
    }
  }

  // Backend choice (for web/api)
  if (projectType === 'web' || projectType === 'api') {
    const backendChoices = [
      { name: 'Node.js (Express/Fastify)', value: 'nodejs' },
      { name: 'Python (FastAPI/Flask)', value: 'python' },
      { name: 'Go', value: 'go' },
      { name: 'No backend needed', value: 'none' },
      { name: 'Let AI decide', value: 'auto' },
    ];

    if (suggestedStack?.backend) {
      const idx = backendChoices.findIndex((c) => c.value === suggestedStack.backend);
      if (idx > 0) {
        const [choice] = backendChoices.splice(idx, 1);
        choice.name = `${choice.name} (Recommended)`;
        backendChoices.unshift(choice);
      }
    }

    const { backend } = await inquirer.prompt([
      {
        type: 'list',
        name: 'backend',
        message: 'What backend/server?',
        choices: backendChoices,
      },
    ]);

    if (backend !== 'auto' && backend !== 'none') {
      stack.backend = backend;
    }
  }

  // Database choice
  if (projectType !== 'cli' && projectType !== 'library') {
    const dbChoices = [
      { name: 'SQLite (Simple, file-based)', value: 'sqlite' },
      { name: 'PostgreSQL', value: 'postgres' },
      { name: 'MongoDB', value: 'mongodb' },
      { name: 'No database needed', value: 'none' },
      { name: 'Let AI decide', value: 'auto' },
    ];

    if (suggestedStack?.database) {
      const idx = dbChoices.findIndex((c) => c.value === suggestedStack.database);
      if (idx > 0) {
        const [choice] = dbChoices.splice(idx, 1);
        choice.name = `${choice.name} (Recommended)`;
        dbChoices.unshift(choice);
      }
    }

    const { database } = await inquirer.prompt([
      {
        type: 'list',
        name: 'database',
        message: 'How should it store data?',
        choices: dbChoices,
      },
    ]);

    if (database !== 'auto' && database !== 'none') {
      stack.database = database;
    }
  }

  return stack;
}

/**
 * Ask user to select features
 */
export async function askForFeatures(
  coreFeatures: string[],
  suggestedFeatures: string[]
): Promise<string[]> {
  const allFeatures = [...new Set([...coreFeatures, ...suggestedFeatures])];

  if (allFeatures.length === 0) {
    return [];
  }

  const { selectedFeatures } = await inquirer.prompt([
    {
      type: 'checkbox',
      name: 'selectedFeatures',
      message: 'Which features do you want to include?',
      choices: allFeatures.map((f) => ({
        name: f,
        checked: coreFeatures.includes(f), // Pre-check core features
      })),
    },
  ]);

  return selectedFeatures;
}

/**
 * Ask for project complexity
 */
export async function askForComplexity(
  suggestedComplexity?: Complexity
): Promise<Complexity> {
  const choices = [
    {
      name: 'Quick Prototype - Basic functionality, minimal polish',
      value: 'prototype',
    },
    {
      name: 'Working MVP - Core features, ready to use',
      value: 'mvp',
    },
    {
      name: 'Full Featured - Complete implementation',
      value: 'full',
    },
  ];

  if (suggestedComplexity) {
    const idx = choices.findIndex((c) => c.value === suggestedComplexity);
    if (idx > 0) {
      const [choice] = choices.splice(idx, 1);
      choice.name = `${choice.name} (Recommended)`;
      choices.unshift(choice);
    }
  }

  const { complexity } = await inquirer.prompt([
    {
      type: 'list',
      name: 'complexity',
      message: 'How comprehensive should the implementation be?',
      choices,
    },
  ]);

  return complexity;
}

/**
 * Confirm the refined plan
 */
export async function confirmPlan(): Promise<'proceed' | 'modify' | 'restart'> {
  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: 'Does this look right?',
      choices: [
        { name: "Yes, let's build it!", value: 'proceed' },
        { name: 'I want to change something', value: 'modify' },
        { name: 'Start over with a different idea', value: 'restart' },
      ],
    },
  ]);

  return action;
}

/**
 * Ask what to modify
 */
export async function askWhatToModify(): Promise<
  'type' | 'stack' | 'features' | 'complexity'
> {
  const { modify } = await inquirer.prompt([
    {
      type: 'list',
      name: 'modify',
      message: 'What would you like to change?',
      choices: [
        { name: 'Project type', value: 'type' },
        { name: 'Tech stack', value: 'stack' },
        { name: 'Features', value: 'features' },
        { name: 'Complexity level', value: 'complexity' },
      ],
    },
  ]);

  return modify;
}

/**
 * Ask for execution options
 */
export async function askExecutionOptions(): Promise<{
  autoRun: boolean;
  autoCommit: boolean;
}> {
  const { autoRun } = await inquirer.prompt([
    {
      type: 'list',
      name: 'autoRun',
      message: 'How should we proceed?',
      choices: [
        { name: 'Start building automatically', value: true },
        { name: 'Just create the plan (I\'ll run it manually)', value: false },
      ],
    },
  ]);

  let autoCommit = false;
  if (autoRun) {
    const { commit } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'commit',
        message: 'Auto-commit changes as we build?',
        default: false,
      },
    ]);
    autoCommit = commit;
  }

  return { autoRun, autoCommit };
}

/**
 * Ask for working directory
 */
export async function askWorkingDirectory(
  suggestedName: string
): Promise<string> {
  const defaultDir = `./${suggestedName.toLowerCase().replace(/\s+/g, '-')}`;

  const { directory } = await inquirer.prompt([
    {
      type: 'input',
      name: 'directory',
      message: 'Where should we create the project?',
      default: defaultDir,
      validate: (input: string) => {
        if (!input.trim()) return 'Please enter a directory';
        return true;
      },
    },
  ]);

  return directory;
}

/**
 * Ask what to do when an existing project is detected
 */
export type ExistingProjectAction = 'enhance' | 'subfolder' | 'different';

export async function askExistingProjectAction(
  projectInfo: ProjectInfo
): Promise<ExistingProjectAction> {
  const projectTypeLabel = projectInfo.type === 'unknown' ? 'project' : projectInfo.type;

  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: `Found an existing ${projectTypeLabel} project. What would you like to do?`,
      choices: [
        {
          name: 'Add features to this existing project',
          value: 'enhance'
        },
        {
          name: 'Create new project in a subfolder',
          value: 'subfolder'
        },
        {
          name: 'Choose a different directory',
          value: 'different'
        },
      ],
    },
  ]);

  return action;
}

/**
 * Ask what to do when a Ralph Playbook is detected
 */
export type RalphPlaybookAction = 'continue' | 'fresh' | 'different';

export async function askRalphPlaybookAction(): Promise<RalphPlaybookAction> {
  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: 'This project is already set up for Ralph. What would you like to do?',
      choices: [
        { name: 'Continue working on this project', value: 'continue' },
        { name: 'Start fresh (will overwrite existing Ralph files)', value: 'fresh' },
        { name: 'Choose a different directory', value: 'different' },
      ],
    },
  ]);
  return action;
}

/**
 * Ask what action to take when continuing on an existing Ralph project
 */
export type ContinueAction = 'run' | 'plan' | 'add_spec';

export async function askContinueAction(): Promise<ContinueAction> {
  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: 'What would you like to do?',
      choices: [
        { name: 'Run the build loop', value: 'run' },
        { name: 'Regenerate the implementation plan', value: 'plan' },
        { name: 'Add a new spec to the project', value: 'add_spec' },
      ],
    },
  ]);
  return action;
}
