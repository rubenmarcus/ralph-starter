import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import chalk from 'chalk';
import ora from 'ora';
import { type Agent, detectAvailableAgents, detectBestAgent } from '../loop/agents.js';
import { runLoop } from '../loop/executor.js';
import {
  detectBuildCommands,
  detectValidationCommands,
  formatValidationFeedback,
  runAllValidations,
  type ValidationCommand,
} from '../loop/validation.js';
import { autoInstallSkillsFromTask } from '../skills/auto-install.js';

interface FixOptions {
  agent?: string;
  commit?: boolean;
  maxIterations?: string;
  outputDir?: string;
  scan?: boolean;
  design?: boolean;
}

/**
 * Parse the last validation failure from .ralph/activity.md.
 * Returns the names of commands that failed (e.g., ["npm run build"]).
 */
function parseLastFailedValidations(cwd: string): string[] {
  const activityPath = join(cwd, '.ralph', 'activity.md');
  if (!existsSync(activityPath)) return [];

  const content = readFileSync(activityPath, 'utf-8');
  // Split into iteration blocks and find the last one with a validation failure
  const blocks = content.split(/^### Iteration/m);
  const lastFailed = blocks.reverse().find((b) => b.includes('Validation Failed'));
  if (!lastFailed) return [];

  const failedNames: string[] = [];
  for (const match of lastFailed.matchAll(/- ❌\s+(.+)/g)) {
    failedNames.push(match[1].trim());
  }
  return failedNames;
}

export async function fixCommand(customTask: string | undefined, options: FixOptions) {
  const cwd = options.outputDir || process.cwd();

  // --- Step 1: Determine which commands to run ---
  let commands: ValidationCommand[] | undefined;
  let mode: 'activity' | 'scan' | 'custom' = 'scan';
  let feedback = '';

  if (customTask) {
    // Custom task provided — still run build to check for errors, but don't bail if clean
    mode = 'custom';
    commands = detectBuildCommands(cwd);
  } else if (!options.scan) {
    const failedNames = parseLastFailedValidations(cwd);
    if (failedNames.length > 0) {
      mode = 'activity';
      const allCommands = detectValidationCommands(cwd);
      commands = allCommands.filter((c) => failedNames.some((name) => name.includes(c.name)));
      if (commands.length === 0) commands = detectBuildCommands(cwd);
    }
  }

  if (!commands || commands.length === 0) {
    if (mode !== 'custom') mode = 'scan';
    commands = detectValidationCommands(cwd);
    if (commands.length === 0) commands = detectBuildCommands(cwd);
  }

  // Run validations if we have commands
  if (commands.length > 0) {
    const spinner = ora(
      mode === 'custom'
        ? 'Checking project health...'
        : `Scanning project (${mode === 'activity' ? 'from last run' : 'full scan'})...`
    ).start();

    const results = await runAllValidations(cwd, commands);
    const failures = results.filter((r) => !r.success);

    if (failures.length === 0 && !customTask) {
      spinner.succeed(chalk.green('All checks passed — nothing to fix!'));
      return;
    }

    if (failures.length > 0) {
      spinner.fail(chalk.red(`Found ${failures.length} issue(s):`));
      for (const f of failures) {
        const errorText = f.error || f.output || '';
        const errorCount = (errorText.match(/error/gi) || []).length;
        console.log(chalk.red(`  ✗ ${f.command}${errorCount ? ` (${errorCount} errors)` : ''}`));
      }
      feedback = formatValidationFeedback(results);
    } else {
      spinner.succeed(chalk.green('Build passing'));
    }
    console.log();
  } else if (!customTask) {
    console.log(chalk.yellow('No build/lint/test commands detected in this project.'));
    return;
  }

  // --- Step 3: Detect agent ---
  let agent: Agent | null = null;

  if (options.agent) {
    const agents = await detectAvailableAgents();
    const found = agents.find(
      (a) => a.type === options.agent || a.name.toLowerCase() === options.agent?.toLowerCase()
    );
    if (!found) {
      console.log(chalk.red(`Agent not found: ${options.agent}`));
      return;
    }
    if (!found.available) {
      console.log(chalk.red(`Agent not available: ${found.name}`));
      return;
    }
    agent = found;
  } else {
    agent = await detectBestAgent();
  }

  if (!agent) {
    console.log(
      chalk.red(
        'No coding agent detected. Install Claude Code, Cursor, or another supported agent.'
      )
    );
    return;
  }

  console.log(chalk.cyan(`Using ${agent.name} to fix issues...\n`));

  // --- Step 4: Build task and run fix loop ---
  let fixTask: string;
  if (customTask) {
    fixTask = feedback
      ? `${customTask}\n\nAlso fix any build/validation errors found during the scan.`
      : customTask;
  } else if (mode === 'activity') {
    fixTask =
      'Fix the build/validation errors in this project. Study the error output below, identify the root cause, and implement the minimal fix. Do not refactor or make unnecessary changes.';
  } else {
    fixTask =
      'Fix all project issues found by the scan below. Prioritize: build errors first, then type errors, then lint violations, then test failures. Make minimal, focused fixes.';
  }

  // Include original spec context so the agent knows what "correct" looks like
  const specsDir = join(cwd, 'specs');
  const planPath = join(cwd, 'IMPLEMENTATION_PLAN.md');
  let specContext = '';

  if (existsSync(specsDir)) {
    try {
      const specFiles = readdirSync(specsDir).filter((f) => f.endsWith('.md'));
      for (const file of specFiles) {
        const content = readFileSync(join(specsDir, file), 'utf-8');
        const truncated =
          content.length > 3000
            ? `${content.slice(0, 3000)}\n\n[... spec truncated for brevity ...]`
            : content;
        specContext += `\n### Spec: ${file}\n${truncated}\n`;
      }
    } catch {
      // Specs directory unreadable
    }
  }

  if (existsSync(planPath)) {
    try {
      const planContent = readFileSync(planPath, 'utf-8');
      const planSummary =
        planContent.length > 2000
          ? `${planContent.slice(0, 2000)}\n\n[... plan truncated ...]`
          : planContent;
      specContext += `\n### Implementation Plan\n${planSummary}\n`;
    } catch {
      // Plan file unreadable
    }
  }

  if (specContext) {
    fixTask = `${fixTask}\n\n## Original Design Specification\n\nIMPORTANT: Use the following specification as the source of truth for what the design should look like. Match the described colors, spacing, layout, and styling exactly.\n${specContext}`;
  }

  // For design/visual tasks, add instructions to visually verify with screenshots
  const DESIGN_KEYWORDS = [
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
    'design',
    'ui',
    'ux',
    'brighter',
    'darker',
    'visual',
  ];
  const isDesignTask =
    options.design ||
    (customTask && DESIGN_KEYWORDS.some((kw) => customTask.toLowerCase().includes(kw)));

  // --design flag: structured visual-first fix flow
  if (options.design) {
    fixTask = `You are fixing design and visual issues in this project. Follow this structured methodology:

## Phase 1: Visual Audit
1. Start the dev server (e.g. \`npm run dev\` or \`npx vite\`) — this OVERRIDES the "no dev server" rule
2. Take full-page screenshots at 3 viewports: desktop (1440px), tablet (768px), mobile (375px)
3. Analyze each screenshot carefully against the spec below

## Phase 2: Issue Identification
List ALL design issues you find:
- Layout/spacing problems (misalignment, excess whitespace, overflow)
- Typography issues (wrong fonts, sizes, weights, line-heights)
- Color mismatches (wrong palette, poor contrast, inconsistent usage)
- Responsive breakage (elements overlapping, content clipping, bad stacking)
- Component styling (borders, shadows, padding, margins)

## Phase 3: Fix Plan
Create a DESIGN_FIX_PLAN.md with prioritized issues and specific CSS/component fixes for each.

## Phase 4: Execute & Verify
1. Fix issues one by one, starting with layout/structure, then typography, then colors
2. After each major fix, re-screenshot to verify improvement
3. Final verification: screenshot all 3 viewports and confirm all issues are resolved

## Phase 5: Cleanup
CRITICAL: Stop the dev server (kill the process) when done — do NOT leave it running.

${customTask ? `\nUser notes: ${customTask}\n` : ''}${specContext ? `\n## Original Design Specification\n${specContext}` : ''}${feedback ? `\n\n## Build Errors (also fix these)\n${feedback}` : ''}`;
  } else if (isDesignTask) {
    fixTask += `\n\nVisual verification (IMPORTANT — OVERRIDES the "no dev server" rule):
This is a visual/design task. After making your CSS and styling changes, you MUST visually verify the result:
1. Start a local dev server (e.g. npm run dev) — this is the ONE exception to the "never start a dev server" rule
2. Take browser screenshots at desktop (1440px) and mobile (375px) viewports
3. Compare screenshots against the spec above — check colors, spacing, layout, and typography match
4. Fix any visual issues you spot (spacing, colors, alignment, contrast)
5. CRITICAL: Stop the dev server (kill the process) when done — do NOT leave it running`;
  }

  // Install relevant skills so the agent has design/quality context
  await autoInstallSkillsFromTask(fixTask, cwd);

  const defaultIter = options.design ? 7 : isDesignTask ? 5 : 3;
  const maxIter = options.maxIterations ? Number.parseInt(options.maxIterations, 10) : defaultIter;

  const result = await runLoop({
    task: fixTask,
    cwd,
    agent,
    maxIterations: maxIter,
    auto: true,
    commit: options.commit,
    initialValidationFeedback: feedback || undefined,
    trackProgress: true,
    checkFileCompletion: false,
    validate: mode === 'scan',
  });

  // --- Step 5: Verify fix by re-running validations ---
  // The loop's exit reason may be max_iterations even if the build now passes.
  // For the fix command, success = "do the checks pass now?", not "did the agent say done?"
  let fixed = result.success;

  if (!fixed && commands.length > 0) {
    const verifySpinner = ora('Verifying fix...').start();
    const verifyResults = await runAllValidations(cwd, commands);
    const stillFailing = verifyResults.filter((r) => !r.success);

    if (stillFailing.length === 0) {
      verifySpinner.succeed(chalk.green('All checks passing now!'));
      fixed = true;
    } else {
      verifySpinner.fail(chalk.red(`${stillFailing.length} issue(s) still failing`));
      for (const f of stillFailing) {
        console.log(chalk.red(`  ✗ ${f.command}`));
      }
    }
  }

  // --- Step 6: Report ---
  console.log();
  if (fixed) {
    console.log(chalk.green('All issues fixed!'));
  } else {
    console.log(chalk.red('Could not fix all issues automatically.'));
    console.log(chalk.dim('  Run again or fix remaining issues manually.'));
  }
}
