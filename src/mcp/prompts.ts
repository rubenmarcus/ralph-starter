import type { GetPromptResult, Prompt } from '@modelcontextprotocol/sdk/types.js';

/**
 * Pre-built workflow prompts for ralph-starter
 */
export function getPrompts(): Prompt[] {
  return [
    {
      name: 'scaffold_project',
      description: 'Initialize a new project with Ralph Playbook and start building',
      arguments: [
        {
          name: 'idea',
          description: 'Description of what you want to build',
          required: true,
        },
        {
          name: 'path',
          description: 'Directory to create the project in',
          required: false,
        },
      ],
    },
    {
      name: 'continue_building',
      description: 'Continue working on the current implementation plan',
      arguments: [
        {
          name: 'path',
          description: 'Project directory path',
          required: false,
        },
      ],
    },
    {
      name: 'check_progress',
      description: 'Check the status of the current project and what tasks remain',
      arguments: [
        {
          name: 'path',
          description: 'Project directory path',
          required: false,
        },
      ],
    },
    {
      name: 'fetch_and_build',
      description:
        'Fetch a spec from an external source (GitHub, Linear, Notion, Figma) and start building',
      arguments: [
        {
          name: 'source',
          description: 'Source to fetch from (url, github, linear, notion, figma)',
          required: true,
        },
        {
          name: 'identifier',
          description: 'Source identifier (URL, project name, issue number, Figma file URL, etc.)',
          required: true,
        },
        {
          name: 'path',
          description: 'Directory to build in',
          required: false,
        },
      ],
    },
    {
      name: 'figma_to_code',
      description:
        'Extract a Figma design and build it as code. Supports design specs, tokens, components, and content extraction.',
      arguments: [
        {
          name: 'figma_url',
          description: 'Figma file or frame URL',
          required: true,
        },
        {
          name: 'framework',
          description:
            'Target framework: react, vue, svelte, astro, nextjs, nuxt, html (default: react)',
          required: false,
        },
        {
          name: 'mode',
          description:
            'Extraction mode: spec (full design spec), tokens (design tokens as CSS/Tailwind), components (component code), content (text/IA extraction)',
          required: false,
        },
        {
          name: 'path',
          description: 'Project directory to build in',
          required: false,
        },
      ],
    },
    {
      name: 'batch_issues',
      description:
        'Process multiple GitHub or Linear issues automatically in sequence. Each issue becomes a task with its own branch, commits, and PR.',
      arguments: [
        {
          name: 'source',
          description: 'Issue source: github or linear',
          required: true,
        },
        {
          name: 'project',
          description: 'GitHub repo (owner/repo) or Linear project name',
          required: true,
        },
        {
          name: 'label',
          description: 'Filter issues by label (e.g., "good first issue", "bug", "enhancement")',
          required: false,
        },
        {
          name: 'path',
          description: 'Project directory path',
          required: false,
        },
      ],
    },
  ];
}

/**
 * Get a specific prompt with arguments filled in
 */
export function handleGetPrompt(name: string, args?: Record<string, string>): GetPromptResult {
  const cwd = args?.path || process.cwd();

  switch (name) {
    case 'scaffold_project':
      return {
        description: 'Initialize and build a new project',
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `I want to build: ${args?.idea || '(describe your project)'}

Please help me scaffold this project using ralph-starter:

1. First, use the ralph_init tool to initialize Ralph Playbook at "${cwd}"
2. Then create a detailed spec in the specs/ folder based on my description
3. Use ralph_plan to create an implementation plan
4. Finally, use ralph_run to start building

Let's begin!`,
            },
          },
        ],
      };

    case 'continue_building':
      return {
        description: 'Continue building from the implementation plan',
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Please continue building the project at "${cwd}".

1. First, use ralph_status to check the current progress
2. Then use ralph_run to continue executing tasks from the implementation plan
3. If there are any blocking issues, help me resolve them

Let's continue!`,
            },
          },
        ],
      };

    case 'check_progress':
      return {
        description: 'Check project status and progress',
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Please check the status of the project at "${cwd}".

1. Use ralph_status to see the current state
2. Read the implementation plan to see what tasks remain
3. Give me a summary of:
   - Completed tasks
   - Remaining tasks
   - Any blockers or issues

Show me where we are!`,
            },
          },
        ],
      };

    case 'fetch_and_build':
      return {
        description: 'Fetch spec from source and build',
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Please fetch a spec and build a project from it.

Source: ${args?.source || '(specify source: github, linear, notion, or figma)'}
Identifier: ${args?.identifier || '(specify identifier)'}
Path: ${cwd}

1. First, use ralph_fetch_spec to preview the spec content
2. Initialize Ralph Playbook at the path if needed
3. Use ralph_run with the --from option to fetch the spec and start building
4. Monitor progress and help resolve any issues

Let's build it!`,
            },
          },
        ],
      };

    case 'figma_to_code': {
      const framework = args?.framework || 'react';
      const displayFramework = framework.charAt(0).toUpperCase() + framework.slice(1);
      return {
        description: 'Convert Figma design to code',
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Please extract a Figma design and build it as code.

Figma URL: ${args?.figma_url || '(specify Figma file URL)'}
Framework: ${framework}
Mode: ${args?.mode || 'spec'}
Path: ${cwd}

1. First, use ralph_fetch_spec with source "figma" to extract the design:
   - Use mode "${args?.mode || 'spec'}" to get ${args?.mode === 'tokens' ? 'design tokens' : args?.mode === 'components' ? 'component structure' : args?.mode === 'content' ? 'text content and IA' : 'the full design specification'}
2. Review the extracted spec — check colors, typography, spacing, and component structure
3. Initialize Ralph Playbook if needed, then use ralph_run to build the ${displayFramework} implementation
4. The agent will iterate until the UI matches the design spec, running validation between iterations

Let's bring this design to life!`,
            },
          },
        ],
      };
    }

    case 'batch_issues':
      return {
        description: 'Process multiple issues automatically',
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Please process multiple issues from ${args?.source || '(github or linear)'} automatically.

Source: ${args?.source || '(specify: github or linear)'}
Project: ${args?.project || '(specify repo or project name)'}
${args?.label ? `Label filter: ${args.label}` : 'Label: (all issues)'}
Path: ${cwd}

1. Use ralph_run with auto mode to batch-process issues from ${args?.source || 'the source'}:
   - Set from="${args?.source || '(github or linear)'}" and project="${args?.project || '(specify)'}"
   ${args?.label ? `- Filter by label: "${args.label}"` : ''}
   - Enable auto=true, commit=true, and validate=true
   - Each issue gets its own branch
   - Code changes are validated and auto-committed
   - A PR is created for each completed issue
2. Monitor progress across all issues
3. If an individual issue fails, note the failure and continue to the next one

Let's batch process these issues!`,
            },
          },
        ],
      };

    default:
      throw new Error(`Unknown prompt: ${name}`);
  }
}
