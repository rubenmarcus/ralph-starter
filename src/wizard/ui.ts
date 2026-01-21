import chalk from 'chalk';
import type { WizardStep } from './types.js';

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
 * Display welcome banner
 */
export function showWelcome(): void {
  console.log();
  console.log(
    chalk.cyan('  ╭─────────────────────────────────────────────────────────────╮')
  );
  console.log(
    chalk.cyan('  │') +
      '                                                             ' +
      chalk.cyan('│')
  );
  console.log(
    chalk.cyan('  │') +
      '   ' +
      chalk.bold.white("Welcome to ralph-starter!") +
      '                              ' +
      chalk.cyan('│')
  );
  console.log(
    chalk.cyan('  │') +
      '                                                             ' +
      chalk.cyan('│')
  );
  console.log(
    chalk.cyan('  │') +
      '   ' +
      chalk.dim("Let's build something awesome together.") +
      '                 ' +
      chalk.cyan('│')
  );
  console.log(
    chalk.cyan('  │') +
      '                                                             ' +
      chalk.cyan('│')
  );
  console.log(
    chalk.cyan('  ╰─────────────────────────────────────────────────────────────╯')
  );
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
 * Display error message
 */
export function showError(title: string, message: string, suggestion?: string): void {
  console.log();
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
 * Display success message
 */
export function showSuccess(message: string): void {
  console.log();
  console.log(chalk.green.bold(`  ✓ ${message}`));
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
