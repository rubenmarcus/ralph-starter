import { readConfig } from '../config/manager.js';
import { detectBestAgent, runAgent } from '../loop/agents.js';
import type { RefinedIdea, ProjectType, Complexity, TechStack } from './types.js';

/**
 * Get API key silently (no prompt) - for wizard use
 * Returns null if no key is available (won't prompt user)
 */
function getApiKeySilent(): string | null {
  // Check environment variable first
  if (process.env.ANTHROPIC_API_KEY) {
    return process.env.ANTHROPIC_API_KEY;
  }

  // Check config file
  const config = readConfig();
  if (config.apiKey) {
    return config.apiKey;
  }

  return null;
}

const REFINEMENT_PROMPT = `You are a product analyst helping to refine a project idea.
Given a user's project idea, analyze it and return a JSON response.

User's idea: "{IDEA}"

Return ONLY valid JSON (no markdown, no explanation) in this exact format:
{
  "projectName": "suggested-name-in-kebab-case",
  "projectDescription": "A one-sentence description of what this project does",
  "projectType": "web|api|cli|mobile|library|automation",
  "suggestedStack": {
    "frontend": "react|nextjs|vue|svelte|vanilla|react-native|expo|null",
    "backend": "nodejs|python|go|null",
    "database": "sqlite|postgres|mongodb|null"
  },
  "coreFeatures": ["feature1", "feature2", "feature3"],
  "suggestedFeatures": ["additional-feature1", "additional-feature2"],
  "estimatedComplexity": "prototype|mvp|full"
}

Guidelines:
- projectName should be short, memorable, and lowercase with hyphens
- Choose the most appropriate projectType based on the idea
- For suggestedStack, pick practical defaults (e.g., React + Node.js + SQLite for web apps)
- coreFeatures are essential features implied by the idea
- suggestedFeatures are nice-to-haves that would enhance the project
- estimatedComplexity is based on scope (prototype=hours, mvp=day, full=days/weeks)`;

/**
 * Refine user's idea using LLM (hybrid approach)
 */
export async function refineIdea(idea: string): Promise<RefinedIdea> {
  // 1. Try direct API if key available
  const apiKey = getApiKeySilent();
  if (apiKey) {
    try {
      return await refineViaApi(idea, apiKey);
    } catch (error) {
      // Fall through to agent
      // Silent fallback - don't log error to user
    }
  }

  // 2. Fall back to Claude Code agent
  const agent = await detectBestAgent();
  if (agent) {
    try {
      return await refineViaAgent(idea, agent);
    } catch (error) {
      // Fall through to template - silent fallback
    }
  }

  // 3. Ultimate fallback: template-based suggestions
  return getTemplateSuggestions(idea);
}

/**
 * Refine via direct Anthropic API
 */
async function refineViaApi(idea: string, apiKey: string): Promise<RefinedIdea> {
  const prompt = REFINEMENT_PROMPT.replace('{IDEA}', idea);

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.content?.[0]?.text;

  if (!content) {
    throw new Error('No response content');
  }

  // Parse JSON from response
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('No JSON in response');
  }

  return JSON.parse(jsonMatch[0]) as RefinedIdea;
}

/**
 * Refine via Claude Code agent
 */
async function refineViaAgent(idea: string, agent: any): Promise<RefinedIdea> {
  const prompt = REFINEMENT_PROMPT.replace('{IDEA}', idea);

  const result = await runAgent(agent, {
    task: prompt,
    cwd: process.cwd(),
    auto: true,
    maxTurns: 1,
  });

  if (result.exitCode !== 0) {
    throw new Error('Agent failed');
  }

  // Parse JSON from output
  const jsonMatch = result.output.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('No JSON in agent output');
  }

  return JSON.parse(jsonMatch[0]) as RefinedIdea;
}

/**
 * Template-based fallback when no LLM available
 */
function getTemplateSuggestions(idea: string): RefinedIdea {
  const lowerIdea = idea.toLowerCase();

  // Detect project type from keywords
  let projectType: ProjectType = 'web';
  if (lowerIdea.includes('api') || lowerIdea.includes('backend') || lowerIdea.includes('server')) {
    projectType = 'api';
  } else if (lowerIdea.includes('cli') || lowerIdea.includes('command line') || lowerIdea.includes('terminal')) {
    projectType = 'cli';
  } else if (lowerIdea.includes('mobile') || lowerIdea.includes('ios') || lowerIdea.includes('android')) {
    projectType = 'mobile';
  } else if (lowerIdea.includes('library') || lowerIdea.includes('package') || lowerIdea.includes('sdk')) {
    projectType = 'library';
  } else if (lowerIdea.includes('script') || lowerIdea.includes('automate') || lowerIdea.includes('bot')) {
    projectType = 'automation';
  }

  // Generate project name from idea
  const projectName = idea
    .toLowerCase()
    .replace(/^(a|an|the)\s+/i, '')
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
    .split(/\s+/)
    .slice(0, 3)
    .join('-');

  // Suggest stack based on type
  const suggestedStack: TechStack = {};
  if (projectType === 'web') {
    suggestedStack.frontend = 'react';
    suggestedStack.backend = 'nodejs';
    suggestedStack.database = 'sqlite';
  } else if (projectType === 'api') {
    suggestedStack.backend = 'nodejs';
    suggestedStack.database = 'postgres';
  } else if (projectType === 'mobile') {
    suggestedStack.frontend = 'expo';
    suggestedStack.backend = 'nodejs';
  }

  // Common features based on type
  const typeFeatures: Record<ProjectType, string[]> = {
    web: ['User interface', 'Data persistence', 'Responsive design'],
    api: ['REST endpoints', 'Input validation', 'Error handling'],
    cli: ['Help command', 'Configuration file', 'Progress indicators'],
    mobile: ['Navigation', 'Data storage', 'User interface'],
    library: ['TypeScript support', 'Documentation', 'Tests'],
    automation: ['Error handling', 'Logging', 'Configuration'],
  };

  return {
    projectName: projectName || 'my-project',
    projectDescription: idea,
    projectType,
    suggestedStack,
    coreFeatures: typeFeatures[projectType] || [],
    suggestedFeatures: ['Dark mode', 'Error notifications', 'Loading states'],
    estimatedComplexity: 'mvp',
  };
}

/**
 * Check if LLM refinement is available
 */
export async function isLlmAvailable(): Promise<boolean> {
  const apiKey = getApiKeySilent();
  if (apiKey) return true;

  const agent = await detectBestAgent();
  return agent !== null;
}
