import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';

// Import core functions (these will be created/extracted)
import { type InitCoreResult, initCore } from './core/init.js';
import { type PlanCoreResult, planCore } from './core/plan.js';
import { type RunCoreResult, runCore } from './core/run.js';

/**
 * Tool definitions for ralph-starter MCP server
 */

const toolSchemas = {
  ralph_init: z.object({
    path: z.string().describe('Project path to initialize'),
    name: z.string().optional().describe('Project name'),
  }),

  ralph_plan: z.object({
    path: z.string().describe('Project path'),
    auto: z.boolean().optional().describe('Run in automated mode'),
  }),

  ralph_run: z.object({
    path: z.string().describe('Project path'),
    task: z.string().optional().describe('Task to execute'),
    auto: z.boolean().optional().describe('Run in automated mode'),
    commit: z.boolean().optional().describe('Auto-commit changes'),
    validate: z.boolean().optional().describe('Run validation after changes'),
    from: z.string().optional().describe('Source to fetch spec from'),
    project: z.string().optional().describe('Project filter for source'),
    label: z.string().optional().describe('Label filter for source'),
  }),

  ralph_status: z.object({
    path: z.string().describe('Project path'),
  }),

  ralph_validate: z.object({
    path: z.string().describe('Project path'),
  }),
};

/**
 * Get all available tools
 */
export function getTools(): Tool[] {
  return [
    {
      name: 'ralph_init',
      description:
        'Initialize Ralph Playbook in a project. Creates AGENTS.md, PROMPT_plan.md, PROMPT_build.md, specs/, and IMPLEMENTATION_PLAN.md.',
      inputSchema: {
        type: 'object',
        properties: {
          path: {
            type: 'string',
            description: 'Project path to initialize',
          },
          name: {
            type: 'string',
            description: 'Project name',
          },
        },
        required: ['path'],
      },
    },
    {
      name: 'ralph_plan',
      description:
        'Create an implementation plan from specs. Analyzes specs/ directory and generates IMPLEMENTATION_PLAN.md.',
      inputSchema: {
        type: 'object',
        properties: {
          path: {
            type: 'string',
            description: 'Project path',
          },
          auto: {
            type: 'boolean',
            description: 'Run in automated mode (skip permissions)',
          },
        },
        required: ['path'],
      },
    },
    {
      name: 'ralph_run',
      description:
        'Execute an autonomous coding loop. Uses the implementation plan and agents to build the project.',
      inputSchema: {
        type: 'object',
        properties: {
          path: {
            type: 'string',
            description: 'Project path',
          },
          task: {
            type: 'string',
            description: 'Task to execute (optional if using Ralph Playbook)',
          },
          auto: {
            type: 'boolean',
            description: 'Run in automated mode (skip permissions)',
          },
          commit: {
            type: 'boolean',
            description: 'Auto-commit changes after each task',
          },
          validate: {
            type: 'boolean',
            description: 'Run tests/lint/build validation',
          },
          from: {
            type: 'string',
            description: 'Source to fetch spec from (file, url, github, todoist, linear, notion)',
          },
          project: {
            type: 'string',
            description: 'Project/repo name for source integrations',
          },
          label: {
            type: 'string',
            description: 'Label filter for source integrations',
          },
        },
        required: ['path'],
      },
    },
    {
      name: 'ralph_status',
      description:
        'Check Ralph Playbook status. Shows available files, implementation progress, and agent availability.',
      inputSchema: {
        type: 'object',
        properties: {
          path: {
            type: 'string',
            description: 'Project path',
          },
        },
        required: ['path'],
      },
    },
    {
      name: 'ralph_validate',
      description:
        'Run validation commands (tests, lint, build). Checks project health and reports issues.',
      inputSchema: {
        type: 'object',
        properties: {
          path: {
            type: 'string',
            description: 'Project path',
          },
        },
        required: ['path'],
      },
    },
  ];
}

/**
 * Handle a tool call
 */
export async function handleToolCall(
  name: string,
  args: Record<string, unknown> | undefined
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  try {
    switch (name) {
      case 'ralph_init':
        return await handleInit(args);

      case 'ralph_plan':
        return await handlePlan(args);

      case 'ralph_run':
        return await handleRun(args);

      case 'ralph_status':
        return await handleStatus(args);

      case 'ralph_validate':
        return await handleValidate(args);

      default:
        return {
          content: [
            {
              type: 'text',
              text: `Unknown tool: ${name}`,
            },
          ],
        };
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${(error as Error).message}`,
        },
      ],
    };
  }
}

async function handleInit(
  args: Record<string, unknown> | undefined
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  const parsed = toolSchemas.ralph_init.parse(args);

  const result = await initCore({
    path: parsed.path,
    name: parsed.name,
  });

  return {
    content: [
      {
        type: 'text',
        text: formatInitResult(result),
      },
    ],
  };
}

async function handlePlan(
  args: Record<string, unknown> | undefined
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  const parsed = toolSchemas.ralph_plan.parse(args);

  const result = await planCore({
    path: parsed.path,
    auto: parsed.auto,
  });

  return {
    content: [
      {
        type: 'text',
        text: formatPlanResult(result),
      },
    ],
  };
}

async function handleRun(
  args: Record<string, unknown> | undefined
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  const parsed = toolSchemas.ralph_run.parse(args);

  const result = await runCore({
    path: parsed.path,
    task: parsed.task,
    auto: parsed.auto,
    commit: parsed.commit,
    validate: parsed.validate,
    from: parsed.from,
    project: parsed.project,
    label: parsed.label,
  });

  return {
    content: [
      {
        type: 'text',
        text: formatRunResult(result),
      },
    ],
  };
}

async function handleStatus(
  args: Record<string, unknown> | undefined
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  const parsed = toolSchemas.ralph_status.parse(args);
  const path = parsed.path;

  // Check for Ralph Playbook files
  const files = {
    'AGENTS.md': existsSync(join(path, 'AGENTS.md')),
    'PROMPT_plan.md': existsSync(join(path, 'PROMPT_plan.md')),
    'PROMPT_build.md': existsSync(join(path, 'PROMPT_build.md')),
    'IMPLEMENTATION_PLAN.md': existsSync(join(path, 'IMPLEMENTATION_PLAN.md')),
    'specs/': existsSync(join(path, 'specs')),
  };

  const hasPlaybook = files['AGENTS.md'] && files['IMPLEMENTATION_PLAN.md'];

  // Read implementation plan if exists
  let planProgress = '';
  if (files['IMPLEMENTATION_PLAN.md']) {
    const planContent = readFileSync(join(path, 'IMPLEMENTATION_PLAN.md'), 'utf-8');
    const completedTasks = (planContent.match(/- \[x\]/gi) || []).length;
    const totalTasks = (planContent.match(/- \[[ x]\]/gi) || []).length;
    planProgress = `${completedTasks}/${totalTasks} tasks completed`;
  }

  // List specs if directory exists
  let specs: string[] = [];
  if (files['specs/']) {
    specs = readdirSync(join(path, 'specs')).filter((f) => f.endsWith('.md'));
  }

  const status = {
    hasPlaybook,
    files,
    planProgress,
    specs,
  };

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(status, null, 2),
      },
    ],
  };
}

async function handleValidate(
  args: Record<string, unknown> | undefined
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  const parsed = toolSchemas.ralph_validate.parse(args);

  // Import validation functions
  const { detectValidationCommands, runAllValidations } = await import('../loop/validation.js');

  const commands = detectValidationCommands(parsed.path);
  const results = await runAllValidations(parsed.path, commands);

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify({ commands, results }, null, 2),
      },
    ],
  };
}

function formatInitResult(result: InitCoreResult): string {
  if (result.success) {
    return `Successfully initialized Ralph Playbook at ${result.path}\n\nFiles created:\n${result.filesCreated.map((f) => `- ${f}`).join('\n')}`;
  }
  return `Failed to initialize: ${result.error}`;
}

function formatPlanResult(result: PlanCoreResult): string {
  if (result.success) {
    return `Implementation plan created at ${result.planPath}\n\nTasks: ${result.taskCount}`;
  }
  return `Failed to create plan: ${result.error}`;
}

function formatRunResult(result: RunCoreResult): string {
  if (result.success) {
    let text = `Loop completed successfully!\n\nIterations: ${result.iterations}`;
    if (result.commits.length > 0) {
      text += `\nCommits: ${result.commits.length}`;
    }
    return text;
  }
  return `Loop failed: ${result.error}`;
}
