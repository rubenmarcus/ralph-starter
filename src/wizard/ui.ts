import chalk from 'chalk';
import type { WizardStep } from './types.js';
import type { ProjectInfo, RalphPlaybookInfo } from '../commands/init.js';
import {
  RALPH_WELCOME_SMALL,
  RALPH_SUCCESS,
  RALPH_ERROR,
  RALPH_WORKING_SMALL,
  RALPH_STARTER_BANNER,
  RALPH_FULL,
  getRandomRalphQuote,
} from './ascii-art.js';

/**
 * Render step progress indicator
 * Output: ✓ Describe  > Refine  ○ Confirm  ○ Build
 */
export function renderSteps(steps: WizardStep[]): string {
  return steps
    .map((step) => {
      const icon =
        step.status === 'complete' ? '✓' : step.status === 'current' ? '>' : '○';
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
 */
export function showWelcome(): void {
  console.log();
  console.log(RALPH_STARTER_BANNER);
  console.log(RALPH_FULL);
  console.log(chalk.dim(`  "${getRandomRalphQuote()}"`));
  console.log();
  console.log(chalk.dim("  Let's build something awesome together."));
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
  stack: { frontend?: string; backend?: string; database?: string },
  features: string[],
  complexity: string
): void {
  console.log();
  console.log(chalk.cyan.bold('  Here\'s what I understand:'));
  console.log(chalk.gray('  ────────────────────────────────────────'));
  console.log();
  console.log(`  ${chalk.white('Project:')} ${chalk.yellow(projectName)}`);
  console.log(`  ${chalk.white('Type:')} ${projectType}`);
  console.log();

  if (stack.frontend || stack.backend || stack.database) {
    console.log(`  ${chalk.white('Tech Stack:')}`);
    if (stack.frontend) console.log(`    ${chalk.dim('Frontend:')} ${stack.frontend}`);
    if (stack.backend) console.log(`    ${chalk.dim('Backend:')} ${stack.backend}`);
    if (stack.database) console.log(`    ${chalk.dim('Database:')} ${stack.database}`);
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
 * Display success message with happy Ralph
 */
export function showSuccess(message: string): void {
  console.log();
  console.log(RALPH_SUCCESS);
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
    console.log(`  ${chalk.white('Description:')} ${chalk.dim(playbook.readme.description.slice(0, 60))}${playbook.readme.description.length > 60 ? '...' : ''}`);
  }

  console.log();
  console.log(`  ${chalk.white('Found files:')}`);
  if (playbook.files.agentsMd) console.log(`    ${chalk.green('✓')} AGENTS.md`);
  if (playbook.files.implementationPlan) console.log(`    ${chalk.green('✓')} IMPLEMENTATION_PLAN.md`);
  if (playbook.files.promptBuild) console.log(`    ${chalk.green('✓')} PROMPT_build.md`);
  if (playbook.files.promptPlan) console.log(`    ${chalk.green('✓')} PROMPT_plan.md`);
  if (playbook.files.specsDir) console.log(`    ${chalk.green('✓')} specs/`);
  if (playbook.files.ralphConfig) console.log(`    ${chalk.green('✓')} .ralph/config.yaml`);

  console.log();
  console.log(chalk.gray('  ────────────────────────────────────────'));
  console.log();
}
