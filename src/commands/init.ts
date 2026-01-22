import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'fs';
import { join } from 'path';
import YAML from 'yaml';
import { detectAvailableAgents, printAgentStatus, Agent } from '../loop/agents.js';
import { isGitRepo, initGitRepo } from '../automation/git.js';

interface InitOptions {
  name?: string;
}

export type ProjectType = 'nodejs' | 'python' | 'rust' | 'go' | 'unknown';

export interface ProjectInfo {
  type: ProjectType;
  name: string;
  testCmd?: string;
  buildCmd?: string;
  lintCmd?: string;
}

export function detectProject(cwd: string): ProjectInfo {
  // Node.js
  if (existsSync(join(cwd, 'package.json'))) {
    try {
      const pkg = JSON.parse(readFileSync(join(cwd, 'package.json'), 'utf-8'));
      const scripts = pkg.scripts || {};
      return {
        type: 'nodejs',
        name: pkg.name || 'project',
        testCmd: scripts.test ? 'npm test' : undefined,
        buildCmd: scripts.build ? 'npm run build' : undefined,
        lintCmd: scripts.lint ? 'npm run lint' : undefined,
      };
    } catch {
      return { type: 'nodejs', name: 'project' };
    }
  }

  // Python
  if (existsSync(join(cwd, 'pyproject.toml')) || existsSync(join(cwd, 'setup.py'))) {
    return {
      type: 'python',
      name: 'project',
      testCmd: 'pytest',
      lintCmd: 'ruff check .',
    };
  }

  // Rust
  if (existsSync(join(cwd, 'Cargo.toml'))) {
    return {
      type: 'rust',
      name: 'project',
      testCmd: 'cargo test',
      buildCmd: 'cargo build',
      lintCmd: 'cargo clippy',
    };
  }

  // Go
  if (existsSync(join(cwd, 'go.mod'))) {
    return {
      type: 'go',
      name: 'project',
      testCmd: 'go test ./...',
      buildCmd: 'go build ./...',
      lintCmd: 'golangci-lint run',
    };
  }

  return { type: 'unknown', name: 'project' };
}

export interface RalphPlaybookInfo {
  hasPlaybook: boolean;
  files: {
    agentsMd: boolean;
    implementationPlan: boolean;
    promptBuild: boolean;
    promptPlan: boolean;
    specsDir: boolean;
    ralphConfig: boolean;
  };
  readme?: {
    exists: boolean;
    description?: string;
  };
}

export function detectRalphPlaybook(cwd: string): RalphPlaybookInfo {
  const files = {
    agentsMd: existsSync(join(cwd, 'AGENTS.md')),
    implementationPlan: existsSync(join(cwd, 'IMPLEMENTATION_PLAN.md')),
    promptBuild: existsSync(join(cwd, 'PROMPT_build.md')),
    promptPlan: existsSync(join(cwd, 'PROMPT_plan.md')),
    specsDir: existsSync(join(cwd, 'specs')),
    ralphConfig: existsSync(join(cwd, '.ralph', 'config.yaml')),
  };

  // Consider it a playbook if AGENTS.md exists (primary marker)
  const hasPlaybook = files.agentsMd;

  // Check for README.md and extract first paragraph as description
  let readme: RalphPlaybookInfo['readme'];
  const readmePath = join(cwd, 'README.md');
  if (existsSync(readmePath)) {
    try {
      const content = readFileSync(readmePath, 'utf-8');
      // Extract first non-heading, non-empty paragraph
      const lines = content.split('\n');
      let description: string | undefined;
      for (const line of lines) {
        const trimmed = line.trim();
        // Skip empty lines, headings, and blockquotes
        if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('>')) {
          continue;
        }
        // Found first content paragraph
        description = trimmed;
        break;
      }
      readme = { exists: true, description };
    } catch {
      readme = { exists: true };
    }
  }

  return { hasPlaybook, files, readme };
}

function generateAgentsMd(project: ProjectInfo): string {
  const validationCmds = [
    project.testCmd,
    project.buildCmd,
    project.lintCmd,
  ].filter(Boolean);

  return `# AGENTS.md

This file defines how Ralph operates in this project.

## Validation Commands

Run these after each task to ensure quality:

\`\`\`bash
${validationCmds.length > 0 ? validationCmds.join('\n') : '# Add your test/build/lint commands here'}
\`\`\`

## Build Instructions

${project.type === 'nodejs' ? '1. Run `npm install` to install dependencies\n2. Run `npm run build` to build (if applicable)\n3. Run `npm test` to verify' : ''}
${project.type === 'python' ? '1. Create virtual environment: `python -m venv venv`\n2. Install dependencies: `pip install -e .`\n3. Run tests: `pytest`' : ''}
${project.type === 'rust' ? '1. Run `cargo build` to compile\n2. Run `cargo test` to verify' : ''}
${project.type === 'go' ? '1. Run `go mod tidy` to sync dependencies\n2. Run `go build ./...` to compile\n3. Run `go test ./...` to verify' : ''}
${project.type === 'unknown' ? '1. Add your build instructions here' : ''}

## Code Patterns

- Follow existing code style
- Add tests for new functionality
- Keep functions small and focused
- Use meaningful names

## Task Completion

A task is complete when:
1. All validation commands pass
2. Code is committed (if auto-commit enabled)
3. No TODO comments left unaddressed
`;
}

function generatePromptBuild(): string {
  return `# Building Mode

You are in BUILDING mode. Execute tasks from the implementation plan.

## Process

1. Read IMPLEMENTATION_PLAN.md for the current task
2. Implement the task following patterns in AGENTS.md
3. Run validation commands after each change
4. If tests fail, fix the issues before moving on
5. Mark the task as complete in IMPLEMENTATION_PLAN.md
6. Move to the next task

## Rules

- One task at a time
- Validate after each change
- Commit working code only
- Update the plan as you learn

## Completion Signal

When all tasks are done, output: <TASK_DONE>
If blocked, output: <TASK_BLOCKED> with explanation
`;
}

function generatePromptPlan(): string {
  return `# Planning Mode

You are in PLANNING mode. Analyze specs and create an implementation plan.

## Process

1. Read all files in specs/ folder
2. Analyze existing codebase
3. Identify gaps between specs and implementation
4. Create prioritized task list in IMPLEMENTATION_PLAN.md

## Task Format

Each task in IMPLEMENTATION_PLAN.md should have:
- [ ] Clear, actionable description
- Acceptance criteria
- Dependencies (if any)

## Rules

- Do NOT implement anything
- Only analyze and plan
- Keep tasks small (< 30 min each)
- Order by dependencies

## Output

Update IMPLEMENTATION_PLAN.md with the task list.
`;
}

function generateImplementationPlan(): string {
  return `# Implementation Plan

> Auto-generated by Ralph. Update as tasks complete.

## Status

- [ ] Task 1: (describe first task)
- [ ] Task 2: (describe second task)

## Notes

Add discoveries and learnings here as you work.
`;
}

function generateExampleSpec(projectName: string): string {
  return `# ${projectName} Specification

## Overview

Describe what this project does.

## Features

### Feature 1: (name)

Description of the feature.

**Acceptance Criteria:**
- [ ] Criterion 1
- [ ] Criterion 2

### Feature 2: (name)

Description of the feature.

## Technical Requirements

- List technical constraints
- Performance requirements
- Security considerations
`;
}

export async function initCommand(options: InitOptions): Promise<void> {
  const cwd = process.cwd();
  const spinner = ora();

  console.log();
  console.log(chalk.cyan.bold('Initialize Ralph Wiggum'));
  console.log(chalk.dim('Set up autonomous AI coding loops (Ralph Playbook)'));
  console.log();

  // Check if already initialized
  if (existsSync(join(cwd, 'AGENTS.md'))) {
    console.log(chalk.yellow('Ralph Playbook files already exist.'));
    console.log(chalk.dim('Files: AGENTS.md, PROMPT_*.md, specs/'));
    return;
  }

  // Detect project
  const project = detectProject(cwd);
  console.log(chalk.dim(`Detected: ${project.type === 'unknown' ? 'New project' : project.type}`));
  console.log();

  // Check git
  const hasGit = await isGitRepo(cwd);
  if (!hasGit) {
    const { initGit } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'initGit',
        message: 'No git repo found. Initialize one?',
        default: true,
      }
    ]);

    if (initGit) {
      await initGitRepo(cwd);
      console.log(chalk.green('Git repository initialized'));
    }
  }

  // Detect available agents
  spinner.start('Detecting available agents...');
  const agents = await detectAvailableAgents();
  const availableAgents = agents.filter(a => a.available);
  spinner.stop();

  if (availableAgents.length === 0) {
    console.log(chalk.red('No coding agents found!'));
    printAgentStatus(agents);
    console.log(chalk.yellow('Please install one of the agents above first.'));
    return;
  }

  printAgentStatus(agents);

  // Select default agent
  let selectedAgent: Agent;
  if (availableAgents.length === 1) {
    selectedAgent = availableAgents[0];
    console.log(chalk.dim(`Using: ${selectedAgent.name}`));
  } else {
    const { agent } = await inquirer.prompt([
      {
        type: 'list',
        name: 'agent',
        message: 'Select default coding agent:',
        choices: availableAgents.map(a => ({
          name: a.name,
          value: a,
        })),
      }
    ]);
    selectedAgent = agent;
  }

  // Create Ralph Playbook files
  spinner.start('Creating Ralph Playbook files...');

  // AGENTS.md
  writeFileSync(join(cwd, 'AGENTS.md'), generateAgentsMd(project));

  // PROMPT files
  writeFileSync(join(cwd, 'PROMPT_build.md'), generatePromptBuild());
  writeFileSync(join(cwd, 'PROMPT_plan.md'), generatePromptPlan());

  // Implementation plan
  writeFileSync(join(cwd, 'IMPLEMENTATION_PLAN.md'), generateImplementationPlan());

  // specs folder with example
  const specsDir = join(cwd, 'specs');
  if (!existsSync(specsDir)) {
    mkdirSync(specsDir, { recursive: true });
    writeFileSync(
      join(specsDir, 'example.md'),
      generateExampleSpec(project.name)
    );
  }

  spinner.succeed('Ralph Playbook files created');

  // Create .ralph config
  const ralphDir = join(cwd, '.ralph');
  if (!existsSync(ralphDir)) {
    mkdirSync(ralphDir, { recursive: true });
    const config = {
      agent: selectedAgent.type,
      auto_commit: true,
      max_iterations: 50,
      validation: {
        test: project.testCmd || null,
        build: project.buildCmd || null,
        lint: project.lintCmd || null,
      },
    };
    writeFileSync(join(ralphDir, 'config.yaml'), YAML.stringify(config));
  }

  // Create .claude/CLAUDE.md if using Claude Code
  if (selectedAgent.type === 'claude-code') {
    const claudeDir = join(cwd, '.claude');
    if (!existsSync(claudeDir)) {
      mkdirSync(claudeDir, { recursive: true });
    }

    const claudeMd = `# Project

This project uses Ralph Wiggum methodology for autonomous AI development.

## Quick Reference

- **Planning**: \`ralph-starter plan\` - Analyze specs and create task list
- **Building**: \`ralph-starter run\` - Execute tasks from the plan
- **Specs**: See \`specs/\` folder for requirements
- **Plan**: See \`IMPLEMENTATION_PLAN.md\` for current tasks

## Workflow

1. Write specs in \`specs/\` folder
2. Run \`ralph-starter plan\` to generate tasks
3. Run \`ralph-starter run --commit\` to execute

## Validation

Always run these after changes:
${project.testCmd ? `- \`${project.testCmd}\`` : ''}
${project.buildCmd ? `- \`${project.buildCmd}\`` : ''}
${project.lintCmd ? `- \`${project.lintCmd}\`` : ''}
`;

    writeFileSync(join(claudeDir, 'CLAUDE.md'), claudeMd);
    console.log(chalk.dim('Created .claude/CLAUDE.md'));
  }

  console.log();
  console.log(chalk.green.bold('Ralph Playbook initialized!'));
  console.log();
  console.log(chalk.yellow('Created files:'));
  console.log(chalk.gray('  AGENTS.md              # How to build/test'));
  console.log(chalk.gray('  PROMPT_build.md        # Building mode instructions'));
  console.log(chalk.gray('  PROMPT_plan.md         # Planning mode instructions'));
  console.log(chalk.gray('  IMPLEMENTATION_PLAN.md # Task list'));
  console.log(chalk.gray('  specs/example.md       # Example spec'));
  console.log();
  console.log(chalk.yellow('Next steps:'));
  console.log(chalk.gray('  1. Edit specs/example.md with your requirements'));
  console.log(chalk.gray('  2. Run: ralph-starter plan    # Generate task list'));
  console.log(chalk.gray('  3. Run: ralph-starter run     # Execute tasks'));
  console.log();
}
