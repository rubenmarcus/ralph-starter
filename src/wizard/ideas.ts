// Idea Mode - Brainstorming for users who don't know what to build

import ora from 'ora';
import type { IdeaSuggestion, IdeaContext, IdeaDiscoveryMethod, ProjectType } from './types.js';
import { BRAINSTORM_PROMPT, TREND_PROMPT, SKILL_PROMPT, PROBLEM_PROMPT } from './idea-prompts.js';
import {
  showIdeaWelcome,
  showBrainstormResults,
  selectIdea,
  buildIdeaContext,
  showIdeaLoading,
} from './idea-ui.js';
import { readConfig } from '../config/manager.js';
import { detectBestAgent, runAgent } from '../loop/agents.js';

/**
 * Run idea mode - brainstorming session for users without a project idea
 * Returns the selected idea's title/description for use in the wizard
 */
export async function runIdeaMode(): Promise<string | null> {
  const spinner = ora();

  // Show welcome
  showIdeaWelcome();

  // Get user preferences
  const context = await buildIdeaContext();

  let selectedIdea: IdeaSuggestion | null = null;

  while (!selectedIdea) {
    // Generate ideas
    spinner.start(showIdeaLoading(context.method));

    let ideas: IdeaSuggestion[];
    try {
      ideas = await generateIdeas(context);
      spinner.succeed('Got some ideas!');
    } catch (error) {
      spinner.fail('Could not generate ideas');
      ideas = getTemplateIdeas(context.method);
    }

    // Show results
    showBrainstormResults(ideas);

    // Let user select
    selectedIdea = await selectIdea(ideas);

    // Check for regenerate signal
    if (selectedIdea && selectedIdea.title === '__REGENERATE__') {
      selectedIdea = null;
      continue;
    }

    // User wants to describe their own
    if (selectedIdea === null) {
      return null;
    }
  }

  // Return the idea as a string for the wizard
  return `${selectedIdea.title}: ${selectedIdea.description}`;
}

/**
 * Generate ideas based on context using hybrid LLM approach
 */
export async function generateIdeas(context: IdeaContext): Promise<IdeaSuggestion[]> {
  // 1. Try direct API if key available
  const apiKey = getApiKeySilent();
  if (apiKey) {
    try {
      return await generateViaApi(context, apiKey);
    } catch (error) {
      // Fall through to agent
    }
  }

  // 2. Fall back to Claude Code agent
  const agent = await detectBestAgent();
  if (agent) {
    try {
      return await generateViaAgent(context, agent);
    } catch (error) {
      // Fall through to templates
    }
  }

  // 3. Ultimate fallback: template-based suggestions
  return getTemplateIdeas(context.method);
}

/**
 * Get API key silently (no prompt)
 */
function getApiKeySilent(): string | null {
  if (process.env.ANTHROPIC_API_KEY) {
    return process.env.ANTHROPIC_API_KEY;
  }
  const config = readConfig();
  return config.apiKey || null;
}

/**
 * Get the appropriate prompt for the context
 */
function getPromptForContext(context: IdeaContext): string {
  switch (context.method) {
    case 'brainstorm':
      return BRAINSTORM_PROMPT;
    case 'trending':
      return TREND_PROMPT;
    case 'skills':
      return SKILL_PROMPT.replace('{SKILLS}', context.skills?.join(', ') || 'general programming');
    case 'problem':
      return PROBLEM_PROMPT.replace('{PROBLEM}', context.problem || 'general productivity');
    default:
      return BRAINSTORM_PROMPT;
  }
}

/**
 * Generate ideas via direct Anthropic API
 */
async function generateViaApi(context: IdeaContext, apiKey: string): Promise<IdeaSuggestion[]> {
  const prompt = getPromptForContext(context);

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
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

  const parsed = JSON.parse(jsonMatch[0]);
  return parsed.ideas as IdeaSuggestion[];
}

/**
 * Generate ideas via Claude Code agent
 */
async function generateViaAgent(context: IdeaContext, agent: any): Promise<IdeaSuggestion[]> {
  const prompt = getPromptForContext(context);

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

  const parsed = JSON.parse(jsonMatch[0]);
  return parsed.ideas as IdeaSuggestion[];
}

/**
 * Template-based fallback when no LLM available
 */
function getTemplateIdeas(method: IdeaDiscoveryMethod): IdeaSuggestion[] {
  const templates: Record<IdeaDiscoveryMethod, IdeaSuggestion[]> = {
    brainstorm: [
      {
        title: 'Personal Finance Tracker',
        description: 'Track expenses, set budgets, and visualize spending patterns',
        projectType: 'web' as ProjectType,
        difficulty: 'moderate',
        reasons: ['Practical everyday use', 'Great for learning data visualization'],
      },
      {
        title: 'Markdown Note Organizer',
        description: 'CLI tool to organize, search, and link markdown notes',
        projectType: 'cli' as ProjectType,
        difficulty: 'easy',
        reasons: ['Simple to start', 'Can grow in complexity'],
      },
      {
        title: 'API Status Dashboard',
        description: 'Monitor multiple API endpoints and get alerts when they go down',
        projectType: 'web' as ProjectType,
        difficulty: 'moderate',
        reasons: ['Useful for developers', 'Good full-stack project'],
      },
      {
        title: 'Git Commit Analyzer',
        description: 'Analyze git history to show contribution patterns and stats',
        projectType: 'cli' as ProjectType,
        difficulty: 'easy',
        reasons: ['Work with familiar tools', 'Interesting data to explore'],
      },
      {
        title: 'Recipe API',
        description: 'RESTful API for storing and retrieving recipes with ingredients and instructions',
        projectType: 'api' as ProjectType,
        difficulty: 'easy',
        reasons: ['Classic CRUD project', 'Easy to extend with features'],
      },
    ],
    trending: [
      {
        title: 'Local-First Todo App',
        description: 'A todo app that works offline-first with optional sync',
        projectType: 'web' as ProjectType,
        difficulty: 'moderate',
        reasons: ['Privacy-focused trend', 'Modern web capabilities'],
      },
      {
        title: 'AI Prompt Manager',
        description: 'Organize, version, and test prompts for LLM applications',
        projectType: 'web' as ProjectType,
        difficulty: 'moderate',
        reasons: ['AI tooling is hot', 'Useful for AI developers'],
      },
      {
        title: 'Carbon Footprint Calculator',
        description: 'Calculate and track personal or project carbon emissions',
        projectType: 'web' as ProjectType,
        difficulty: 'moderate',
        reasons: ['Sustainability focus', 'Meaningful impact'],
      },
      {
        title: 'CLI for Generating Accessibility Reports',
        description: 'Scan websites and generate accessibility audit reports',
        projectType: 'cli' as ProjectType,
        difficulty: 'challenging',
        reasons: ['Accessibility is important', 'Helps make web better'],
      },
      {
        title: 'Personal AI Assistant API',
        description: 'Build a custom AI assistant API with memory and tools',
        projectType: 'api' as ProjectType,
        difficulty: 'challenging',
        reasons: ['Learn AI integration', 'Extensible architecture'],
      },
    ],
    skills: [
      {
        title: 'Portfolio Website Generator',
        description: 'Generate a portfolio site from a JSON/YAML config file',
        projectType: 'cli' as ProjectType,
        difficulty: 'easy',
        reasons: ['Practice existing skills', 'Create something useful'],
      },
      {
        title: 'Code Snippet Library',
        description: 'Personal library to store and search code snippets',
        projectType: 'web' as ProjectType,
        difficulty: 'moderate',
        reasons: ['Practical tool', 'Good for learning'],
      },
      {
        title: 'Webhook Tester',
        description: 'Tool to receive, inspect, and replay webhooks for debugging',
        projectType: 'web' as ProjectType,
        difficulty: 'moderate',
        reasons: ['Useful for API work', 'Learn about webhooks'],
      },
      {
        title: 'Config File Validator',
        description: 'CLI to validate JSON, YAML, and TOML config files with custom rules',
        projectType: 'cli' as ProjectType,
        difficulty: 'easy',
        reasons: ['Practical DevOps tool', 'Good CLI practice'],
      },
      {
        title: 'Time Zone Converter API',
        description: 'Simple API for converting times between time zones',
        projectType: 'api' as ProjectType,
        difficulty: 'easy',
        reasons: ['Quick to build', 'Genuinely useful'],
      },
    ],
    problem: [
      {
        title: 'Meeting Notes Organizer',
        description: 'Automatically organize and summarize meeting notes',
        projectType: 'web' as ProjectType,
        difficulty: 'moderate',
        reasons: ['Solves real pain point', 'Can integrate with calendars'],
      },
      {
        title: 'Dotfiles Manager',
        description: 'CLI to sync and manage dotfiles across machines',
        projectType: 'cli' as ProjectType,
        difficulty: 'moderate',
        reasons: ['Common developer problem', 'Practical daily use'],
      },
      {
        title: 'Bookmark Organizer',
        description: 'Clean up and organize browser bookmarks with tags',
        projectType: 'web' as ProjectType,
        difficulty: 'easy',
        reasons: ['Everyone has messy bookmarks', 'Simple but useful'],
      },
      {
        title: 'Dependency Update Bot',
        description: 'Monitor and update dependencies across projects',
        projectType: 'automation' as ProjectType,
        difficulty: 'moderate',
        reasons: ['Automates tedious work', 'Keeps projects healthy'],
      },
      {
        title: 'Email Template Builder',
        description: 'Visual builder for creating email templates',
        projectType: 'web' as ProjectType,
        difficulty: 'challenging',
        reasons: ['HTML emails are painful', 'WYSIWYG is valuable'],
      },
    ],
  };

  return templates[method] || templates.brainstorm;
}
