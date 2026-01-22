import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import { existsSync, readFileSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { detectBestAgent, detectAvailableAgents, printAgentStatus, Agent } from '../loop/agents.js';
import { runLoop, LoopOptions } from '../loop/executor.js';
import { isGitRepo, initGitRepo } from '../automation/git.js';
import { fetchFromSource, detectSource } from '../sources/index.js';
import { getPreset, getPresetNames, formatPresetsHelp, PresetConfig } from '../presets/index.js';

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
  circuitBreakerFailures?: number;
  circuitBreakerErrors?: number;
}

export async function runCommand(task: string | undefined, options: RunCommandOptions): Promise<void> {
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
        }
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

  // Detect available agents
  spinner.start('Detecting available agents...');
  const agents = await detectAvailableAgents();
  const availableAgents = agents.filter(a => a.available);
  spinner.stop();

  if (availableAgents.length === 0) {
    console.log(chalk.red('No coding agents found!'));
    console.log();
    console.log(chalk.yellow('Please install one of these:'));
    console.log(chalk.gray('  Claude Code: npm install -g @anthropic-ai/claude-code'));
    console.log(chalk.gray('  Cursor:      https://cursor.sh'));
    console.log(chalk.gray('  Codex:       npm install -g codex'));
    console.log(chalk.gray('  OpenCode:    npm install -g opencode'));
    process.exit(1);
  }

  // Select agent
  let agent: Agent;
  if (options.agent) {
    const found = agents.find(a => a.type === options.agent || a.name.toLowerCase() === options.agent?.toLowerCase());
    if (!found || !found.available) {
      console.log(chalk.red(`Agent "${options.agent}" not found or not available.`));
      printAgentStatus(agents);
      process.exit(1);
    }
    agent = found;
  } else if (availableAgents.length === 1) {
    agent = availableAgents[0];
  } else {
    // Let user choose
    const { selectedAgent } = await inquirer.prompt([
      {
        type: 'list',
        name: 'selectedAgent',
        message: 'Select coding agent:',
        choices: availableAgents.map(a => ({
          name: a.name,
          value: a,
        })),
      }
    ]);
    agent = selectedAgent;
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
          validate: (input: string) => input.trim() ? true : 'Please enter a task',
        }
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
    console.log(chalk.dim('Either provide a task or run `ralph-starter init` to set up Ralph Playbook.'));
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

  // Apply preset values with CLI overrides
  const loopOptions: LoopOptions = {
    task: preset?.promptPrefix ? `${preset.promptPrefix}\n\n${finalTask}` : finalTask,
    cwd,
    agent,
    maxIterations: options.maxIterations ?? preset?.maxIterations ?? 50,
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
    checkFileCompletion: true, // Always check for file-based completion
    circuitBreaker: preset?.circuitBreaker
      ? {
          maxConsecutiveFailures: options.circuitBreakerFailures ?? preset.circuitBreaker.maxConsecutiveFailures,
          maxSameErrorCount: options.circuitBreakerErrors ?? preset.circuitBreaker.maxSameErrorCount,
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
    }
  } else {
    console.log(chalk.red.bold('Loop failed'));
    console.log(chalk.dim(`Exit reason: ${result.exitReason}`));
    if (result.error) {
      console.log(chalk.dim(result.error));
    }
    if (result.stats?.circuitBreakerStats) {
      const cb = result.stats.circuitBreakerStats;
      console.log(chalk.dim(`Circuit breaker: ${cb.consecutiveFailures} consecutive failures, ${cb.uniqueErrors} unique errors`));
    }
  }
}
