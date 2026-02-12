import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';
import chalk from 'chalk';
import { execa } from 'execa';
import inquirer from 'inquirer';
import ora from 'ora';
import { type IssueRef, initGitRepo, isGitRepo } from '../automation/git.js';
import {
  type Agent,
  detectAvailableAgents,
  detectBestAgent,
  printAgentStatus,
} from '../loop/agents.js';
import { formatCost, formatTokens } from '../loop/cost-tracker.js';
import { type LoopOptions, runLoop } from '../loop/executor.js';
import { formatPrdPrompt, getPrdStats, parsePrdFile } from '../loop/prd-parser.js';
import { calculateOptimalIterations } from '../loop/task-counter.js';
import { formatPresetsHelp, getPreset, type PresetConfig } from '../presets/index.js';
import { autoInstallSkillsFromTask } from '../skills/auto-install.js';
import { getSourceDefaults } from '../sources/config.js';
import { fetchFromSource } from '../sources/index.js';
import { detectPackageManager, formatRunCommand, getRunCommand } from '../utils/package-manager.js';

/** Default fallback repo for GitHub issues when no project is specified */
const DEFAULT_GITHUB_ISSUES_REPO = 'multivmlabs/ralph-ideas';

function formatDurationSeconds(durationSec: number): string {
  const minutes = Math.floor(durationSec / 60);
  const seconds = durationSec % 60;
  return `${minutes}m ${seconds}s`;
}

/**
 * Detect how to run the project based on package.json scripts or common patterns
 */
function detectRunCommand(
  cwd: string
): { command: string; args: string[]; description: string } | null {
  // Check package.json for scripts
  const packageJsonPath = join(cwd, 'package.json');
  if (existsSync(packageJsonPath)) {
    try {
      const pkg = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
      const scripts = pkg.scripts || {};
      const pm = detectPackageManager(cwd);

      // Priority order for dev commands
      for (const script of ['dev', 'start', 'serve', 'preview']) {
        if (scripts[script]) {
          const cmd = getRunCommand(pm, script);
          return { ...cmd, description: formatRunCommand(pm, script) };
        }
      }
    } catch {
      // Ignore parse errors
    }
  }

  // Check for Python projects
  if (existsSync(join(cwd, 'main.py'))) {
    return { command: 'python', args: ['main.py'], description: 'python main.py' };
  }
  if (existsSync(join(cwd, 'app.py'))) {
    return { command: 'python', args: ['app.py'], description: 'python app.py' };
  }

  // Check for Go projects
  if (existsSync(join(cwd, 'main.go'))) {
    return { command: 'go', args: ['run', 'main.go'], description: 'go run main.go' };
  }

  return null;
}

/**
 * Extract tasks from spec content and format as implementation plan
 * Handles "### Task N:" headers with subtasks underneath
 * Ignores code blocks and example sections
 */
function extractTasksFromSpec(specContent: string): string | null {
  const lines = specContent.split('\n');
  const planLines: string[] = [];
  let currentTaskNum = 0;
  let inTaskSection = false;
  let inCodeBlock = false;
  let inExampleSection = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Track code blocks (skip content inside ```)
    if (line.trim().startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      continue;
    }
    if (inCodeBlock) continue;

    // Track example sections (skip tasks inside examples)
    // But don't skip task headers that contain "format" or "example"
    const isTaskHeader = line.match(/^#{2,3}\s*Task\s*\d+/i);
    if (
      !isTaskHeader &&
      (line.match(/^#{1,3}\s+.*example/i) || line.match(/^#{1,2}\s+.*format\s*$/i))
    ) {
      inExampleSection = true;
      inTaskSection = false;
      continue;
    }

    // Exit example section on new main header (## Tasks, ## Overview, etc.)
    if (line.match(/^#{1,2}\s+[A-Z]/) && !line.toLowerCase().includes('example')) {
      inExampleSection = false;
    }

    // Skip if in example section
    if (inExampleSection) continue;

    // Match "### Task N: Description" or "## Task N: Description"
    const taskHeaderMatch = line.match(/^#{2,3}\s*Task\s*(\d+)[:\s]+(.+)/i);
    if (taskHeaderMatch) {
      currentTaskNum++;
      const taskName = taskHeaderMatch[2].trim();
      planLines.push(`\n### Task ${currentTaskNum}: ${taskName}`);
      planLines.push('');
      inTaskSection = true;
      continue;
    }

    // If we hit another major header, end the task section
    if (line.match(/^#{1,2}\s+[A-Z]/) && !line.toLowerCase().includes('task')) {
      inTaskSection = false;
    }

    // Collect checkboxes (subtasks) under the current task
    if (inTaskSection) {
      const checkboxMatch = line.match(/^(\s*)[-*]\s*\[([xX ])\]\s*(.+)/);
      if (checkboxMatch) {
        const indent = checkboxMatch[1] || '';
        const completed = checkboxMatch[2].toLowerCase() === 'x';
        const subtaskName = checkboxMatch[3].trim();
        const checkbox = completed ? '[x]' : '[ ]';
        planLines.push(`${indent}- ${checkbox} ${subtaskName}`);
      }
    }
  }

  // If no task headers found, fall back to just collecting top-level checkboxes
  if (currentTaskNum === 0) {
    inCodeBlock = false;
    inExampleSection = false;
    for (const line of lines) {
      if (line.trim().startsWith('```')) {
        inCodeBlock = !inCodeBlock;
        continue;
      }
      if (inCodeBlock) continue;
      if (line.match(/^#{1,3}\s+.*example/i)) {
        inExampleSection = true;
        continue;
      }
      if (line.match(/^#{1,2}\s+[A-Z]/) && !line.toLowerCase().includes('example')) {
        inExampleSection = false;
      }
      if (inExampleSection) continue;

      // Only match non-indented checkboxes (top-level tasks)
      const taskMatch = line.match(/^[-*]\s*\[([xX ])\]\s*(.+)/);
      if (taskMatch) {
        const completed = taskMatch[1].toLowerCase() === 'x';
        const taskName = taskMatch[2].trim();
        const checkbox = completed ? '[x]' : '[ ]';
        planLines.push(`- ${checkbox} ${taskName}`);
      }
    }
  }

  if (planLines.length === 0) {
    return null;
  }

  // Create implementation plan content
  const planContent = `# Implementation Plan

*Auto-generated from spec*

## Tasks
${planLines.join('\n')}
`;

  return planContent;
}

export interface RunCommandOptions {
  auto?: boolean;
  commit?: boolean;
  push?: boolean;
  pr?: boolean;
  validate?: boolean;
  docker?: boolean;
  prd?: string;
  maxIterations?: number;
  agent?: string;
  // Source options
  from?: string;
  project?: string;
  label?: string;
  status?: string;
  limit?: number;
  issue?: number;
  outputDir?: string;
  // New options
  preset?: string;
  completionPromise?: string;
  requireExitSignal?: boolean;
  rateLimit?: number;
  trackProgress?: boolean;
  trackCost?: boolean;
  circuitBreakerFailures?: number;
  circuitBreakerErrors?: number;
  contextBudget?: number;
  validationWarmup?: number;
  // Figma options
  figmaMode?: 'spec' | 'tokens' | 'components' | 'assets' | 'content';
  figmaFramework?: 'react' | 'vue' | 'svelte' | 'astro' | 'nextjs' | 'nuxt' | 'html';
  figmaFormat?: 'css' | 'scss' | 'json' | 'tailwind';
  figmaNodes?: string;
  figmaScale?: number;
  figmaTarget?: string;
  figmaPreview?: boolean;
  figmaMapping?: string;
}

export async function runCommand(
  task: string | undefined,
  options: RunCommandOptions
): Promise<void> {
  let cwd = process.cwd();
  const spinner = ora();

  // Handle --output-dir flag
  if (options.outputDir) {
    const expandedPath = options.outputDir.replace(/^~/, homedir());
    cwd = resolve(expandedPath);
    if (!existsSync(cwd)) {
      mkdirSync(cwd, { recursive: true });
    }
  }

  console.log();
  console.log(chalk.cyan.bold('ralph-starter'));
  console.log(chalk.dim('Ralph Wiggum made easy'));
  console.log();

  // Check for git repo
  if (options.commit || options.push || options.pr) {
    const isRepo = await isGitRepo(cwd);
    if (!isRepo) {
      const { initGit } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'initGit',
          message: 'Git repo not found. Initialize one?',
          default: true,
        },
      ]);

      if (initGit) {
        await initGitRepo(cwd);
        console.log(chalk.green('Git repository initialized'));
      } else {
        console.log(chalk.yellow('Git automation disabled (no repo)'));
        options.commit = false;
        options.push = false;
        options.pr = false;
      }
    }
  }

  // Handle --from source
  let sourceSpec: string | null = null;
  let sourceIssueRef: IssueRef | undefined;
  if (options.from) {
    spinner.start('Fetching spec from source...');
    try {
      // Default to configured repo when using --issue without --project for GitHub
      let projectId = options.project || '';
      if (options.from.toLowerCase() === 'github' && options.issue && !options.project) {
        const githubDefaults = getSourceDefaults('github');
        projectId = githubDefaults?.defaultIssuesRepo || DEFAULT_GITHUB_ISSUES_REPO;
        console.log(chalk.dim(`  Using default repo: ${projectId}`));
      }

      const result = await fetchFromSource(options.from, projectId, {
        label: options.label,
        status: options.status,
        limit: options.limit,
        issue: options.issue,
      });

      spinner.succeed(`Fetched spec from ${result.source}`);
      sourceSpec = result.content;

      // Extract issue reference from metadata for PR linking
      if (
        result.metadata?.type === 'github' &&
        result.metadata.owner &&
        result.metadata.repo &&
        result.metadata.issue
      ) {
        sourceIssueRef = {
          owner: result.metadata.owner as string,
          repo: result.metadata.repo as string,
          number: result.metadata.issue as number,
        };
      }

      // Write to specs directory
      const specsDir = join(cwd, 'specs');
      if (!existsSync(specsDir)) {
        mkdirSync(specsDir, { recursive: true });
      }

      const specFilename = result.title
        ? `${result.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.md`
        : 'source-spec.md';
      const specPath = join(specsDir, specFilename);
      writeFileSync(specPath, sourceSpec);
      console.log(chalk.dim(`  Written to: ${specPath}`));

      // Prompt for project location when fetching from integration sources
      // Skip if --auto or --output-dir was provided
      const integrationSources = ['github', 'linear', 'notion', 'todoist'];
      const isIntegrationSource = integrationSources.includes(options.from?.toLowerCase() || '');

      if (isIntegrationSource && !options.auto && !options.outputDir) {
        const { projectLocation } = await inquirer.prompt([
          {
            type: 'list',
            name: 'projectLocation',
            message: 'Where do you want to run this task?',
            choices: [
              { name: `Current directory (${cwd})`, value: 'current' },
              { name: 'Create new project folder', value: 'new' },
              { name: 'Enter custom path', value: 'custom' },
            ],
          },
        ]);

        if (projectLocation === 'new') {
          // Generate default name from spec title
          const defaultName =
            result.title
              ?.toLowerCase()
              .replace(/[^a-z0-9]+/g, '-')
              .replace(/^-|-$/g, '')
              .slice(0, 50) || 'new-project';

          const { folderName } = await inquirer.prompt([
            {
              type: 'input',
              name: 'folderName',
              message: 'Project folder name:',
              default: defaultName,
            },
          ]);

          const newCwd = join(process.cwd(), folderName);
          if (!existsSync(newCwd)) {
            mkdirSync(newCwd, { recursive: true });
          }
          cwd = newCwd;
          console.log(chalk.dim(`  Created: ${cwd}`));
        } else if (projectLocation === 'custom') {
          const { customPath } = await inquirer.prompt([
            {
              type: 'input',
              name: 'customPath',
              message: 'Enter path:',
            },
          ]);

          // Expand ~ to home directory
          const expandedPath = customPath.replace(/^~/, homedir());
          cwd = resolve(expandedPath);

          if (!existsSync(cwd)) {
            mkdirSync(cwd, { recursive: true });
          }
          console.log(chalk.dim(`  Using: ${cwd}`));
        }
        // 'current' - no change needed
      }
    } catch (error) {
      spinner.fail('Failed to fetch from source');
      console.error(chalk.red((error as Error).message));
      process.exit(1);
    }
  }

  // Detect agent - use explicit selection or auto-detect best
  let agent: Agent | null = null;

  if (options.agent) {
    // Explicit agent selection via --agent flag
    spinner.start('Checking agent...');
    const agents = await detectAvailableAgents();
    const found = agents.find(
      (a) => a.type === options.agent || a.name.toLowerCase() === options.agent?.toLowerCase()
    );
    spinner.stop();

    if (!found || !found.available) {
      console.log(chalk.red(`Agent "${options.agent}" not found or not available.`));
      printAgentStatus(agents);
      process.exit(1);
    }
    agent = found;
  } else {
    // Auto-detect best agent (same as plan.ts)
    spinner.start('Detecting coding agent...');
    agent = await detectBestAgent();
    spinner.stop();

    if (!agent) {
      console.log(chalk.red('No coding agents found!'));
      console.log();
      console.log(chalk.yellow('Please install one of these:'));
      console.log(chalk.gray('  Claude Code: npm install -g @anthropic-ai/claude-code'));
      console.log(chalk.gray('  Cursor:      https://cursor.sh'));
      console.log(chalk.gray('  Codex:       npm install -g codex'));
      console.log(chalk.gray('  OpenCode:    npm install -g opencode'));
      process.exit(1);
    }
  }

  console.log(chalk.dim(`Using agent: ${agent.name}`));

  // Check for Ralph Playbook files
  const buildPromptPath = join(cwd, 'PROMPT_build.md');
  const implementationPlanPath = join(cwd, 'IMPLEMENTATION_PLAN.md');
  const hasPlaybook = existsSync(buildPromptPath) && existsSync(implementationPlanPath);

  // Get task if not provided
  let finalTask = task;

  // If we fetched from a source, use that as the task
  if (sourceSpec && !finalTask) {
    // Extract tasks from spec and create implementation plan
    const extractedPlan = extractTasksFromSpec(sourceSpec);
    if (extractedPlan) {
      writeFileSync(implementationPlanPath, extractedPlan);
      console.log(chalk.cyan('Created IMPLEMENTATION_PLAN.md from spec'));

      finalTask = `Build the following project based on this specification:

${sourceSpec}

## Implementation Tracking

An IMPLEMENTATION_PLAN.md file has been created with tasks extracted from this spec.
As you complete each task, mark it done by changing [ ] to [x] in IMPLEMENTATION_PLAN.md.
Focus on one task at a time.`;
    } else {
      finalTask = `Build the following project based on this specification:

${sourceSpec}

Analyze the specification and implement all required features. Create a proper project structure with all necessary files.`;
    }
    console.log(chalk.cyan('Using fetched specification as task'));
  }

  if (!finalTask && !options.prd) {
    // Check for Ralph Playbook build mode
    if (hasPlaybook) {
      console.log(chalk.cyan('Ralph Playbook detected'));
      console.log(chalk.dim('Using build mode from IMPLEMENTATION_PLAN.md'));
      console.log();

      // Read the build prompt and implementation plan
      const buildPrompt = readFileSync(buildPromptPath, 'utf-8');
      const implementationPlan = readFileSync(implementationPlanPath, 'utf-8');

      finalTask = `${buildPrompt}

## Current Implementation Plan

${implementationPlan}

Work through the tasks in the implementation plan. Mark tasks as complete as you finish them.
Focus on one task at a time. After completing a task, update IMPLEMENTATION_PLAN.md.`;
    } else {
      const { inputTask } = await inquirer.prompt([
        {
          type: 'input',
          name: 'inputTask',
          message: 'What would you like to build?',
          validate: (input: string) => (input.trim() ? true : 'Please enter a task'),
        },
      ]);
      finalTask = inputTask;
    }
  }

  // Handle PRD file
  if (options.prd) {
    const prd = parsePrdFile(options.prd);
    if (!prd) {
      console.log(chalk.red(`PRD file not found: ${options.prd}`));
      process.exit(1);
    }

    const stats = getPrdStats(prd);
    console.log(chalk.cyan(`PRD: ${prd.title}`));
    console.log(
      chalk.dim(
        `Tasks: ${stats.pending} pending, ${stats.completed} completed (${stats.percentComplete}% done)`
      )
    );
    console.log();

    if (stats.pending === 0) {
      console.log(chalk.green('All PRD tasks are complete!'));
      return;
    }

    finalTask = formatPrdPrompt(prd);
  }

  if (!finalTask) {
    console.log(chalk.red('No task provided.'));
    console.log(
      chalk.dim('Either provide a task or run `ralph-starter init` to set up Ralph Playbook.')
    );
    process.exit(1);
  }

  // Docker mode
  if (options.docker) {
    console.log(chalk.yellow('Docker sandbox mode coming soon!'));
    return;
  }

  // Auto-install relevant skills from skills.sh (if available)
  await autoInstallSkillsFromTask(finalTask, cwd);

  // Apply preset if specified
  let preset: PresetConfig | undefined;
  if (options.preset) {
    preset = getPreset(options.preset);
    if (!preset) {
      console.log(chalk.red(`Unknown preset: ${options.preset}`));
      console.log();
      console.log(formatPresetsHelp());
      process.exit(1);
    }
    console.log(chalk.cyan(`Using preset: ${preset.name}`));
    console.log(chalk.dim(preset.description));
  }

  // Calculate smart iterations based on tasks (always, unless explicitly overridden)
  const { iterations: smartIterations, taskCount, reason } = calculateOptimalIterations(cwd);
  if (!options.maxIterations && !preset?.maxIterations) {
    if (taskCount.total > 0) {
      console.log(
        chalk.dim(`Tasks: ${taskCount.pending} pending, ${taskCount.completed} completed`)
      );
    }
    console.log(chalk.dim(`Max iterations: ${smartIterations} (${reason})`));
  }

  // Auto-detect greenfield builds: skip validation until enough tasks are done
  const isGreenfield = taskCount.total > 0 && taskCount.completed === 0;
  const autoWarmup = isGreenfield ? Math.max(2, Math.floor(taskCount.total * 0.5)) : 0;
  const validationWarmup = options.validationWarmup ? Number(options.validationWarmup) : autoWarmup;
  if (validationWarmup > 0 && options.validate) {
    console.log(
      chalk.dim(`Validation warm-up: skipping until ${validationWarmup} tasks completed`)
    );
  }

  // Apply preset values with CLI overrides
  const loopOptions: LoopOptions = {
    task: preset?.promptPrefix ? `${preset.promptPrefix}\n\n${finalTask}` : finalTask,
    cwd,
    agent,
    maxIterations: options.maxIterations ?? preset?.maxIterations ?? smartIterations,
    auto: options.auto,
    commit: options.commit ?? preset?.commit,
    push: options.push,
    pr: options.pr,
    prTitle: undefined, // Let executor generate semantic title
    prIssueRef: sourceIssueRef,
    prLabels: options.auto ? ['AUTO'] : undefined,
    validate: options.validate ?? preset?.validate,
    validationWarmup,
    sourceType: options.from?.toLowerCase(),
    // New options
    completionPromise: options.completionPromise ?? preset?.completionPromise,
    requireExitSignal: options.requireExitSignal,
    rateLimit: options.rateLimit ?? preset?.rateLimit,
    trackProgress: options.trackProgress ?? true, // Default to true
    trackCost: options.trackCost ?? true, // Default to true
    model: agent.type === 'claude-code' ? 'claude-3-sonnet' : 'default',
    checkFileCompletion: true, // Always check for file-based completion
    contextBudget: options.contextBudget ? Number(options.contextBudget) : undefined,
    circuitBreaker: preset?.circuitBreaker
      ? {
          maxConsecutiveFailures:
            options.circuitBreakerFailures ?? preset.circuitBreaker.maxConsecutiveFailures,
          maxSameErrorCount:
            options.circuitBreakerErrors ?? preset.circuitBreaker.maxSameErrorCount,
        }
      : options.circuitBreakerFailures || options.circuitBreakerErrors
        ? {
            maxConsecutiveFailures: options.circuitBreakerFailures ?? 3,
            maxSameErrorCount: options.circuitBreakerErrors ?? 5,
          }
        : undefined,
  };

  const result = await runLoop(loopOptions);

  // Print summary
  console.log();
  if (result.success) {
    console.log(chalk.green.bold('Loop completed!'));
    console.log(chalk.dim(`Exit reason: ${result.exitReason}`));
    console.log(chalk.dim(`Iterations: ${result.iterations}`));
    if (result.commits.length > 0) {
      console.log(chalk.dim(`Commits: ${result.commits.length}`));
    }
    if (result.stats) {
      const durationSec = Math.round(result.stats.totalDuration / 1000);
      console.log(chalk.dim(`Total duration: ${formatDurationSeconds(durationSec)}`));
      if (result.stats.validationFailures > 0) {
        console.log(chalk.dim(`Validation failures: ${result.stats.validationFailures}`));
      }
      if (result.stats.costStats) {
        const cost = result.stats.costStats;
        console.log(
          chalk.dim(
            `Total cost: ${formatCost(cost.totalCost.totalCost)} (${formatTokens(cost.totalTokens.totalTokens)} tokens)`
          )
        );
      }
    }

    // Offer to run the project
    const runCmd = detectRunCommand(cwd);
    if (runCmd) {
      console.log();
      const { shouldRun } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'shouldRun',
          message: `Run the project with ${chalk.cyan(runCmd.description)}?`,
          default: true,
        },
      ]);

      if (shouldRun) {
        console.log();
        console.log(chalk.cyan(`Starting: ${runCmd.description}`));
        console.log(chalk.dim('Press Ctrl+C to stop'));
        console.log();

        try {
          // Run with stdio inherited so user can see output and interact
          await execa(runCmd.command, runCmd.args, {
            cwd,
            stdio: 'inherit',
          });
        } catch (error: unknown) {
          // User likely pressed Ctrl+C, which is expected
          if (
            error &&
            typeof error === 'object' &&
            'signal' in error &&
            error.signal === 'SIGINT'
          ) {
            console.log();
            console.log(chalk.dim('Stopped.'));
          } else {
            console.log(chalk.yellow('Process exited'));
          }
        }
      }
    }
  } else {
    // Check if it's a rate limit issue (already shown detailed message in executor)
    const isRateLimit = result.error?.includes('Rate limit');

    if (!isRateLimit) {
      // Only show generic failure for non-rate-limit errors
      console.log(chalk.red.bold('Loop failed'));
      console.log(chalk.dim(`Exit reason: ${result.exitReason}`));
      if (result.error) {
        console.log(chalk.dim(result.error));
      }
      if (result.stats?.circuitBreakerStats) {
        const cb = result.stats.circuitBreakerStats;
        console.log(
          chalk.dim(
            `Circuit breaker: ${cb.consecutiveFailures} consecutive failures, ${cb.uniqueErrors} unique errors`
          )
        );
      }
    }
    // Rate limit message was already shown in executor
  }
}
