import chalk from 'chalk';
import type { ProjectInfo, RalphPlaybookInfo } from '../commands/init.js';
import {
  getRandomRalphQuote,
  RALPH_ERROR,
  RALPH_FULL,
  RALPH_WELCOME_SMALL,
  RALPH_WORKING_SMALL,
} from './ascii-art.js';
import type { WizardStep } from './types.js';

/**
 * Render step progress indicator
 * Output: ✓ Describe  > Refine  ○ Confirm  ○ Build
 */
export function renderSteps(steps: WizardStep[]): string {
  return steps
    .map((step) => {
      const icon = step.status === 'complete' ? '✓' : step.status === 'current' ? '>' : '○';
      const color =
        step.status === 'complete'
          ? chalk.green
          : step.status === 'current'
            ? chalk.cyan
            : chalk.gray;
      return color(`${icon} ${step.name}`);
    })
    .join('  ');
}

/**
 * Display welcome banner with Ralph ASCII art
 * Uses compact version to save terminal space
 */
export function showWelcome(): void {
  console.log();
  console.log(RALPH_FULL);
  console.log(chalk.cyan.bold('  ralph-starter'));
  console.log(chalk.dim('  AI-powered project generator'));
  console.log();
  console.log(chalk.dim(`  "${getRandomRalphQuote()}"`));
  console.log();
}

/**
 * Display compact welcome (for smaller terminals)
 */
export function showWelcomeCompact(): void {
  console.log();
  console.log(RALPH_WELCOME_SMALL);
  console.log(chalk.cyan.bold('  Welcome to ralph-starter!'));
  console.log(chalk.dim(`  "${getRandomRalphQuote()}"`));
  console.log();
}

/**
 * Display refined idea summary
 */
export function showRefinedSummary(
  projectName: string,
  projectType: string,
  stack: {
    frontend?: string;
    backend?: string;
    database?: string;
    styling?: string;
    uiLibrary?: string;
    language?: string;
  },
  features: string[],
  complexity: string
): void {
  const formatTechLabel = (tech: string): string => {
    const names: Record<string, string> = {
      astro: 'Astro',
      react: 'React',
      nextjs: 'Next.js',
      vue: 'Vue.js',
      svelte: 'Svelte',
      vanilla: 'Vanilla JavaScript',
      'react-native': 'React Native',
      expo: 'Expo (React Native)',
      nodejs: 'Node.js',
      python: 'Python',
      go: 'Go',
      sqlite: 'SQLite',
      postgres: 'PostgreSQL',
      mongodb: 'MongoDB',
      tailwind: 'Tailwind CSS',
      css: 'CSS',
      scss: 'SCSS',
      'styled-components': 'styled-components',
      shadcn: 'shadcn/ui',
      'shadcn-vue': 'shadcn-vue',
      'shadcn-svelte': 'shadcn-svelte',
      mui: 'Material UI',
      chakra: 'Chakra UI',
      typescript: 'TypeScript',
      javascript: 'JavaScript',
    };
    return names[tech] || tech;
  };

  console.log();
  console.log(chalk.cyan.bold("  Here's what I understand:"));
  console.log(chalk.gray('  ────────────────────────────────────────'));
  console.log();
  console.log(`  ${chalk.white('Project:')} ${chalk.yellow(projectName)}`);
  console.log(`  ${chalk.white('Type:')} ${projectType}`);
  console.log();

  if (
    stack.frontend ||
    stack.backend ||
    stack.database ||
    stack.styling ||
    stack.uiLibrary ||
    stack.language
  ) {
    console.log(`  ${chalk.white('Tech Stack:')}`);
    if (stack.frontend)
      console.log(`    ${chalk.dim('Frontend:')} ${formatTechLabel(stack.frontend)}`);
    if (stack.backend)
      console.log(`    ${chalk.dim('Backend:')} ${formatTechLabel(stack.backend)}`);
    if (stack.database)
      console.log(`    ${chalk.dim('Database:')} ${formatTechLabel(stack.database)}`);
    if (stack.styling)
      console.log(`    ${chalk.dim('Styling:')} ${formatTechLabel(stack.styling)}`);
    if (stack.uiLibrary)
      console.log(`    ${chalk.dim('UI Library:')} ${formatTechLabel(stack.uiLibrary)}`);
    if (stack.language)
      console.log(`    ${chalk.dim('Language:')} ${formatTechLabel(stack.language)}`);
    console.log();
  }

  if (features.length > 0) {
    console.log(`  ${chalk.white('Key Features:')}`);
    features.forEach((f) => console.log(`    ${chalk.dim('•')} ${f}`));
    console.log();
  }

  console.log(`  ${chalk.white('Complexity:')} ${complexity}`);
  console.log();
  console.log(chalk.gray('  ────────────────────────────────────────'));
  console.log();
}

/**
 * Display execution plan
 */
export function showExecutionPlan(autoCommit: boolean): void {
  console.log();
  console.log(chalk.cyan.bold('  Ready to build!'));
  console.log();
  console.log(chalk.dim('  This will:'));
  console.log(chalk.gray('    1. Create project files and Ralph Playbook'));
  console.log(chalk.gray('    2. Generate an implementation plan'));
  console.log(chalk.gray('    3. Start building with AI'));
  if (autoCommit) {
    console.log(chalk.gray('    4. Auto-commit changes as we go'));
  }
  console.log();
}

/**
 * Display error message with sad Ralph
 */
export function showError(title: string, message: string, suggestion?: string): void {
  console.log();
  console.log(RALPH_ERROR);
  console.log(chalk.red.bold(`  ${title}`));
  console.log();
  console.log(chalk.dim(`  ${message}`));
  if (suggestion) {
    console.log();
    console.log(chalk.yellow(`  ${suggestion}`));
  }
  console.log();
}

/**
 * Display success message (clean, no ASCII art)
 */
export function showSuccess(message: string): void {
  console.log();
  console.log(chalk.green.bold(`  ✓ ${message}`));
  console.log();
}

/**
 * Display working/processing state with waving Ralph
 */
export function showWorking(message: string): void {
  console.log();
  console.log(RALPH_WORKING_SMALL);
  console.log(chalk.cyan(`  ${message}`));
  console.log();
}

/**
 * Format project type for display
 */
export function formatProjectType(type: string): string {
  const types: Record<string, string> = {
    web: 'Web Application',
    api: 'API / Backend Service',
    cli: 'Command Line Tool',
    mobile: 'Mobile App',
    library: 'Library / Package',
    automation: 'Automation Script',
  };
  return types[type] || type;
}

/**
 * Format complexity for display
 */
export function formatComplexity(complexity: string): string {
  const levels: Record<string, string> = {
    prototype: 'Quick Prototype',
    mvp: 'Working MVP',
    full: 'Full Featured',
  };
  return levels[complexity] || complexity;
}

/**
 * Display detected existing project info
 */
export function showDetectedProject(projectInfo: ProjectInfo, directory: string): void {
  const typeLabels: Record<string, string> = {
    nodejs: 'Node.js',
    python: 'Python',
    rust: 'Rust',
    go: 'Go',
    unknown: 'Unknown',
  };

  console.log();
  console.log(chalk.cyan.bold('  Existing project detected!'));
  console.log(chalk.gray('  ────────────────────────────────────────'));
  console.log();
  console.log(`  ${chalk.white('Directory:')} ${chalk.yellow(directory)}`);
  console.log(`  ${chalk.white('Type:')} ${typeLabels[projectInfo.type] || projectInfo.type}`);
  if (projectInfo.name && projectInfo.name !== 'project') {
    console.log(`  ${chalk.white('Name:')} ${projectInfo.name}`);
  }

  const commands = [
    projectInfo.testCmd && `Test: ${projectInfo.testCmd}`,
    projectInfo.buildCmd && `Build: ${projectInfo.buildCmd}`,
    projectInfo.lintCmd && `Lint: ${projectInfo.lintCmd}`,
  ].filter(Boolean);

  if (commands.length > 0) {
    console.log();
    console.log(`  ${chalk.white('Available commands:')}`);
    commands.forEach((cmd) => console.log(`    ${chalk.dim('•')} ${cmd}`));
  }

  console.log();
  console.log(chalk.gray('  ────────────────────────────────────────'));
  console.log();
}

/**
 * Display detected Ralph Playbook project info
 */
export function showDetectedRalphPlaybook(playbook: RalphPlaybookInfo, directory: string): void {
  console.log();
  console.log(chalk.cyan.bold('  Ralph Playbook detected!'));
  console.log(chalk.gray('  ────────────────────────────────────────'));
  console.log();
  console.log(`  ${chalk.white('Directory:')} ${chalk.yellow(directory)}`);

  if (playbook.readme?.description) {
    console.log(
      `  ${chalk.white('Description:')} ${chalk.dim(playbook.readme.description.slice(0, 60))}${playbook.readme.description.length > 60 ? '...' : ''}`
    );
  }

  console.log();
  console.log(`  ${chalk.white('Found files:')}`);
  if (playbook.files.agentsMd) console.log(`    ${chalk.green('✓')} AGENTS.md`);
  if (playbook.files.implementationPlan)
    console.log(`    ${chalk.green('✓')} IMPLEMENTATION_PLAN.md`);
  if (playbook.files.promptBuild) console.log(`    ${chalk.green('✓')} PROMPT_build.md`);
  if (playbook.files.promptPlan) console.log(`    ${chalk.green('✓')} PROMPT_plan.md`);
  if (playbook.files.specsDir) console.log(`    ${chalk.green('✓')} specs/`);
  if (playbook.files.ralphConfig) console.log(`    ${chalk.green('✓')} .ralph/config.yaml`);

  console.log();
  console.log(chalk.gray('  ────────────────────────────────────────'));
  console.log();
}
