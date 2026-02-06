import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import type { Resource } from '@modelcontextprotocol/sdk/types.js';

/**
 * Get available resources for the current working directory
 */
export async function getResources(): Promise<Resource[]> {
  const cwd = process.cwd();
  const resources: Resource[] = [];

  // Implementation Plan
  const planPath = join(cwd, 'IMPLEMENTATION_PLAN.md');
  if (existsSync(planPath)) {
    resources.push({
      uri: `ralph://project/implementation_plan`,
      name: 'Implementation Plan',
      description: 'Current implementation task list (IMPLEMENTATION_PLAN.md)',
      mimeType: 'text/markdown',
    });
  }

  // AGENTS.md
  const agentsPath = join(cwd, 'AGENTS.md');
  if (existsSync(agentsPath)) {
    resources.push({
      uri: `ralph://project/agents`,
      name: 'Agents Configuration',
      description: 'Agent configuration and validation commands (AGENTS.md)',
      mimeType: 'text/markdown',
    });
  }

  // PROMPT files
  const buildPromptPath = join(cwd, 'PROMPT_build.md');
  if (existsSync(buildPromptPath)) {
    resources.push({
      uri: `ralph://project/prompt_build`,
      name: 'Build Prompt',
      description: 'Building mode instructions (PROMPT_build.md)',
      mimeType: 'text/markdown',
    });
  }

  const planPromptPath = join(cwd, 'PROMPT_plan.md');
  if (existsSync(planPromptPath)) {
    resources.push({
      uri: `ralph://project/prompt_plan`,
      name: 'Plan Prompt',
      description: 'Planning mode instructions (PROMPT_plan.md)',
      mimeType: 'text/markdown',
    });
  }

  // Specs
  const specsDir = join(cwd, 'specs');
  if (existsSync(specsDir)) {
    const specFiles = readdirSync(specsDir).filter((f) => f.endsWith('.md'));
    for (const file of specFiles) {
      const name = basename(file, '.md');
      resources.push({
        uri: `ralph://project/specs/${name}`,
        name: `Spec: ${name}`,
        description: `Specification file (specs/${file})`,
        mimeType: 'text/markdown',
      });
    }
  }

  // Activity log
  const activityPath = join(cwd, '.ralph', 'activity.md');
  if (existsSync(activityPath)) {
    resources.push({
      uri: 'ralph://project/activity',
      name: 'Activity Log',
      description:
        'Loop execution history with timing, cost data, and task outcomes (.ralph/activity.md)',
      mimeType: 'text/markdown',
    });
  }

  return resources;
}

/**
 * Read a resource by URI
 */
export async function handleResourceRead(uri: string): Promise<{
  contents: Array<{ uri: string; mimeType: string; text: string }>;
}> {
  const cwd = process.cwd();

  // Parse URI
  const match = uri.match(/^ralph:\/\/project\/(.+)$/);
  if (!match) {
    throw new Error(`Invalid resource URI: ${uri}`);
  }

  const resourcePath = match[1];
  let filePath: string;
  let content: string;

  switch (resourcePath) {
    case 'implementation_plan':
      filePath = join(cwd, 'IMPLEMENTATION_PLAN.md');
      break;

    case 'agents':
      filePath = join(cwd, 'AGENTS.md');
      break;

    case 'prompt_build':
      filePath = join(cwd, 'PROMPT_build.md');
      break;

    case 'prompt_plan':
      filePath = join(cwd, 'PROMPT_plan.md');
      break;

    case 'activity':
      filePath = join(cwd, '.ralph', 'activity.md');
      break;

    default:
      // Handle specs
      if (resourcePath.startsWith('specs/')) {
        const specName = resourcePath.replace('specs/', '');
        filePath = join(cwd, 'specs', `${specName}.md`);
      } else {
        throw new Error(`Unknown resource: ${resourcePath}`);
      }
  }

  if (!existsSync(filePath)) {
    throw new Error(`Resource not found: ${uri}`);
  }

  content = readFileSync(filePath, 'utf-8');

  return {
    contents: [
      {
        uri,
        mimeType: 'text/markdown',
        text: content,
      },
    ],
  };
}
