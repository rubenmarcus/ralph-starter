import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import chalk from 'chalk';
import { execa } from 'execa';
import inquirer from 'inquirer';
import ora from 'ora';
import { initGitRepo, isGitRepo } from '../automation/git.js';
import {
  type Agent,
  detectAvailableAgents,
  detectBestAgent,
  printAgentStatus,
} from '../loop/agents.js';
import { formatCost, formatTokens } from '../loop/cost-tracker.js';
import { type LoopOptions, runLoop } from '../loop/executor.js';
import { calculateOptimalIterations } from '../loop/task-counter.js';
import { formatPresetsHelp, getPreset, type PresetConfig } from '../presets/index.js';
import { fetchFromSource } from '../sources/index.js';

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

      // Priority order for dev commands
      if (scripts.dev) {
        return { command: 'npm', args: ['run', 'dev'], description: 'npm run dev' };
      }
      if (scripts.start) {
        return { command: 'npm', args: ['run', 'start'], description: 'npm run start' };
      }
      if (scripts.serve) {
        return { command: 'npm', args: ['run', 'serve'], description: 'npm run serve' };
      }
      if (scripts.preview) {
        return { command: 'npm', args: ['run', 'preview'], description: 'npm run preview' };
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
  // New options
  preset?: string;
  completionPromise?: string;
  requireExitSignal?: boolean;
  rateLimit?: number;
  trackProgress?: boolean;
  trackCost?: boolean;
  circuitBreakerFailures?: number;
  circuitBreakerErrors?: number;
}

export async function runCommand(
  task: string | undefined,
  options: RunCommandOptions
): Promise<void> {
  const cwd = process.cwd();
  const spinner = ora();

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
  if (options.from) {
    spinner.start('Fetching spec from source...');
    try {
      const result = await fetchFromSource(options.from, {
        project: options.project,
        label: options.label,
        status: options.status,
        limit: options.limit,
      });

      spinner.succeed(`Fetched spec from ${result.source}`);
      sourceSpec = result.content;

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
  let isBuildMode = false;

  // If we fetched from a source, use that as the task
  if (sourceSpec && !finalTask) {
    finalTask = `Build the following project based on this specification:

${sourceSpec}

Analyze the specification and implement all required features. Create a proper project structure with all necessary files.`;
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

      isBuildMode = true;
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
    // TODO: Implement PRD parsing
    console.log(chalk.yellow('PRD mode coming soon!'));
    console.log(chalk.dim(`Would read tasks from: ${options.prd}`));
    return;
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

  // Run the loop
  const prTitle = isBuildMode
    ? 'Ralph: Implementation from plan'
    : `Ralph: ${finalTask.slice(0, 50)}`;

  // Calculate smart iterations based on tasks (if in build mode and no explicit override)
  let smartIterations = 10; // default
  if (isBuildMode && !options.maxIterations && !preset?.maxIterations) {
    const { iterations, taskCount, reason } = calculateOptimalIterations(cwd);
    smartIterations = iterations;
    if (taskCount.total > 0) {
      console.log(
        chalk.dim(`Tasks: ${taskCount.pending} pending, ${taskCount.completed} completed`)
      );
      console.log(chalk.dim(`Max iterations: ${iterations} (${reason})`));
    }
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
    prTitle,
    validate: options.validate ?? preset?.validate,
    // New options
    completionPromise: options.completionPromise ?? preset?.completionPromise,
    requireExitSignal: options.requireExitSignal,
    rateLimit: options.rateLimit ?? preset?.rateLimit,
    trackProgress: options.trackProgress ?? true, // Default to true
    trackCost: options.trackCost ?? true, // Default to true
    model: agent.type === 'claude-code' ? 'claude-3-sonnet' : 'default',
    checkFileCompletion: true, // Always check for file-based completion
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
      console.log(chalk.dim(`Total duration: ${durationSec}s`));
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
