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

    if (failures.length === 0 && !customTask && !options.design) {
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
  } else if (!customTask && !options.design) {
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
    fixTask = `You are fixing design and visual issues in this project. Ignore IMPLEMENTATION_PLAN.md — this is a visual fix pass, not a feature build.

IMPORTANT: Your VERY FIRST action must be to start the dev server and take screenshots. Do NOT read files or explore the codebase first — start visually.

## Phase 1: Visual Audit (DO THIS FIRST)
1. Start the dev server (e.g. \`npm run dev\` or \`npx vite\`) — this OVERRIDES the "no dev server" rule
2. Take full-page screenshots at 3 viewports: desktop (1440px), tablet (768px), mobile (375px)
3. Analyze each screenshot carefully against the spec below

## Phase 2: Issue Identification (be SPECIFIC, not generic)
Look at the screenshots and identify CONCRETE issues you can actually see. Do NOT list generic improvements — only list problems visible in the screenshots.

Check in this priority order:
0. **CSS cascade conflicts** — If spacing/margin/padding from Tailwind classes aren't working but colors/fonts/grid work fine, check the main CSS file (e.g. index.css, globals.css) for unlayered rules like \`* { margin: 0; padding: 0; }\` that override Tailwind's @layer-based utilities. Remove any such rules — Tailwind v4's preflight already provides proper resets.
1. **Page structure** — Is content centered? Are sections contained in a max-width wrapper? Is anything stuck to the left/right edge when it shouldn't be? Are there huge empty gaps between sections?
2. **Layout & positioning** — Are grid/flex layouts rendering correctly? Are columns balanced? Is the hero section properly structured? Are elements overlapping or misaligned?
3. **Responsive issues** — Does the layout break at any viewport? Do elements overflow or get clipped?
4. **Spacing** — Is vertical rhythm consistent between sections? Are there abnormally large or small gaps?
5. **Typography & colors** — Are fonts loading? Is text readable against backgrounds? Are colors consistent?

IMPORTANT: Focus on what looks BROKEN, not what could be "improved." A centered layout with wrong padding is lower priority than content pinned to the left edge.

## Phase 3: Fix Plan
Create a DESIGN_FIX_PLAN.md. For each issue:
- Describe EXACTLY what's wrong (e.g., "Hero content is not centered — text hugs the left edge with no container")
- Specify the exact file and CSS property to change
- Keep fixes minimal — fix the actual problem, don't redesign the entire component

Prioritize: page structure > layout positioning > responsive > spacing > cosmetic.

## Phase 4: Execute & Verify
1. Fix structural issues FIRST (containers, centering, grid layout), then work down to cosmetic
2. After fixing each structural issue, re-screenshot to verify the layout improved
3. Final verification: screenshot all 3 viewports and confirm the page looks properly structured
4. CRITICAL: After confirming fixes look correct in final screenshots, output DESIGN_VERIFIED on its own line. Do NOT output this until you have taken verification screenshots and confirmed the design is correct.

## Phase 5: Cleanup
1. Stop the dev server (kill the process) when done — do NOT leave it running
2. If you have NOT already output DESIGN_VERIFIED, do it now after visual confirmation

IMPORTANT: The loop will NOT accept completion without the exact token DESIGN_VERIFIED. Do NOT say "All tasks completed" — it will be ignored.

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
  // Use the user's custom task (not the full generated prompt) to avoid keyword-spam
  // that triggers excessive skill searches from the design prompt boilerplate
  await autoInstallSkillsFromTask(customTask || (options.design ? 'design fix' : 'fix'), cwd);

  const defaultIter = options.design ? 7 : isDesignTask ? 4 : 3;
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
    maxSkills: options.design ? 4 : undefined,
    skipPlanInstructions: options.design,
    fixMode: options.design ? 'design' : customTask ? 'custom' : 'scan',
    // Design mode: require explicit DESIGN_VERIFIED token after visual verification
    ...(options.design && {
      completionPromise: 'DESIGN_VERIFIED',
      requireExitSignal: true,
    }),
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
