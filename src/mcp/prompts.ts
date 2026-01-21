import type { Prompt, GetPromptResult } from '@modelcontextprotocol/sdk/types.js';

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
      description: 'Fetch a spec from a source and start building',
      arguments: [
        {
          name: 'source',
          description: 'Source to fetch from (url, github, todoist, linear, notion)',
          required: true,
        },
        {
          name: 'identifier',
          description: 'Source identifier (URL, project name, etc.)',
          required: true,
        },
        {
          name: 'path',
          description: 'Directory to build in',
          required: false,
        },
      ],
    },
  ];
}

/**
 * Get a specific prompt with arguments filled in
 */
export function handleGetPrompt(
  name: string,
  args?: Record<string, string>
): GetPromptResult {
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

Source: ${args?.source || '(specify source)'}
Identifier: ${args?.identifier || '(specify identifier)'}
Path: ${cwd}

1. First, initialize Ralph Playbook at the path if needed
2. Use ralph_run with the --from option to fetch the spec and start building
3. Monitor progress and help resolve any issues

Let's build it!`,
            },
          },
        ],
      };

    default:
      throw new Error(`Unknown prompt: ${name}`);
  }
}
