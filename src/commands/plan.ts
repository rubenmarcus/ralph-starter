import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import chalk from 'chalk';
import { detectBestAgent, runAgent } from '../loop/agents.js';
import { detectStepFromOutput } from '../loop/step-detector.js';
import { ProgressRenderer } from '../ui/progress-renderer.js';

export interface PlanCommandOptions {
  auto?: boolean;
}

export async function planCommand(options: PlanCommandOptions): Promise<void> {
  const cwd = process.cwd();

  console.log();
  console.log(chalk.cyan.bold('Ralph Planning Mode'));
  console.log(chalk.dim('Analyzing specs and creating implementation plan'));
  console.log();

  // Check for Ralph Playbook files
  const promptPlanPath = join(cwd, 'PROMPT_plan.md');
  const specsDir = join(cwd, 'specs');

  if (!existsSync(promptPlanPath)) {
    console.log(chalk.red('Ralph Playbook not found.'));
    console.log(chalk.dim('Run `ralph-starter init` first to set up the playbook files.'));
    return;
  }

  if (!existsSync(specsDir)) {
    console.log(chalk.yellow('No specs/ folder found.'));
    console.log(chalk.dim('Create specs in the specs/ folder first.'));
    return;
  }

  // Read planning prompt
  const planPrompt = readFileSync(promptPlanPath, 'utf-8');

  // Detect agent with progress
  const detectProgress = new ProgressRenderer();
  detectProgress.start('Detecting coding agent...');
  const agent = await detectBestAgent();

  if (!agent) {
    detectProgress.fail('No coding agent found');
    console.log(chalk.dim('Install Claude Code, Cursor, Codex, or OpenCode.'));
    return;
  }

  detectProgress.stop(`Using ${agent.name}`);
  console.log();

  // Build the full prompt
  const fullPrompt = `${planPrompt}

Please analyze the specs/ folder and update IMPLEMENTATION_PLAN.md with a prioritized task list.

Focus on:
1. Reading all specification files in specs/
2. Understanding the current codebase state
3. Identifying gaps between specs and implementation
4. Creating actionable, small tasks

Do not implement anything - only plan.`;

  // Run the agent in planning mode with progress feedback
  const planProgress = new ProgressRenderer();
  planProgress.start('Planning...');

  const result = await runAgent(agent, {
    task: fullPrompt,
    cwd,
    auto: options.auto,
    maxTurns: 10, // Increased from 5 for more complex projects
    streamOutput: false, // Don't dump raw JSON
    onOutput: (line: string) => {
      const step = detectStepFromOutput(line);
      if (step) {
        planProgress.updateStep(step);
      }
    },
  });

  if (result.exitCode === 0) {
    planProgress.stop('Planning complete');
    console.log();
    console.log(chalk.green('  Updated IMPLEMENTATION_PLAN.md'));
    console.log();
    console.log(chalk.yellow('  Next step:'));
    console.log(chalk.gray('    ralph-starter run    # Execute the plan'));
  } else {
    planProgress.fail('Planning failed');
    console.log(chalk.dim(result.output.slice(0, 500)));
  }
}
