// Idea Mode - Brainstorming for users who don't know what to build

import chalk from 'chalk';
import ora from 'ora';
import { getConfiguredLLM, getLLMModel } from '../config/manager.js';
import { callLLM, type LLMProvider, PROVIDERS } from '../llm/index.js';
import { detectBestAgent, runAgent } from '../loop/agents.js';
import { getBrainstormPrompt, PROBLEM_PROMPT, SKILL_PROMPT, TREND_PROMPT } from './idea-prompts.js';
import {
  buildIdeaContext,
  selectIdea,
  showBrainstormResults,
  showIdeaLoading,
  showIdeaWelcome,
} from './idea-ui.js';
import type { IdeaContext, IdeaDiscoveryMethod, IdeaSuggestion, ProjectType } from './types.js';

// Timeout for agent calls (60 seconds - simplified prompt should be faster)
const AGENT_TIMEOUT_MS = 60000;

// Global spinner reference for cleanup on exit
let activeSpinner: ReturnType<typeof ora> | null = null;

/**
 * Check if error is an exit/interrupt error from inquirer
 */
function isExitError(error: unknown): boolean {
  if (error instanceof Error) {
    return (
      error.name === 'ExitPromptError' ||
      error.message.includes('User force closed') ||
      error.message.includes('SIGINT')
    );
  }
  return false;
}

/**
 * Run idea mode - brainstorming session for users without a project idea
 * Returns the selected idea's title/description for use in the wizard
 */
export async function runIdeaMode(): Promise<string | null> {
  const spinner = ora();
  activeSpinner = spinner;

  // Setup graceful exit for this mode
  const cleanup = () => {
    if (activeSpinner) {
      activeSpinner.stop();
    }
    console.log(chalk.dim('\n\nExiting...'));
    process.exit(0);
  };
  process.on('SIGINT', cleanup);

  try {
    return await runIdeaModeFlow(spinner);
  } catch (error) {
    if (isExitError(error)) {
      spinner.stop();
      console.log(chalk.dim('\n\nExiting...'));
      process.exit(0);
    }
    throw error;
  } finally {
    activeSpinner = null;
    process.removeListener('SIGINT', cleanup);
  }
}

/**
 * Main idea mode flow (extracted for cleaner error handling)
 */
async function runIdeaModeFlow(spinner: ReturnType<typeof ora>): Promise<string | null> {
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
      ideas = await generateIdeas(context, spinner);
      // Only show success if spinner is still active (API method)
      if (spinner.isSpinning) {
        spinner.succeed('Got some ideas!');
      } else {
        console.log(chalk.green('  ✓ Got some ideas!'));
      }
    } catch (_error) {
      if (spinner.isSpinning) {
        spinner.fail('Could not generate ideas');
      } else {
        console.log(chalk.red('  ✗ Could not generate ideas'));
      }
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
 * Result of idea generation including method used
 */
export interface IdeaGenerationResult {
  ideas: IdeaSuggestion[];
  method: 'api' | 'agent' | 'templates';
}

/**
 * Generate ideas based on context using hybrid LLM approach
 * Returns both the ideas and which method was used (for user feedback)
 * @param spinner - Optional spinner to stop before streaming output
 */
export async function generateIdeas(
  context: IdeaContext,
  spinner?: ReturnType<typeof ora>
): Promise<IdeaSuggestion[]> {
  const result = await generateIdeasWithMethod(context, spinner);
  return result.ideas;
}

/**
 * Wrap a promise with a timeout
 */
function withTimeout<T>(promise: Promise<T>, timeoutMs: number, message: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error(message)), timeoutMs)),
  ]);
}

/**
 * Generate ideas and return which method was used
 * Priority: Claude Code CLI (no API key needed) > Direct API > Template fallback
 * @param spinner - Optional spinner to stop before streaming output
 */
export async function generateIdeasWithMethod(
  context: IdeaContext,
  spinner?: ReturnType<typeof ora>
): Promise<IdeaGenerationResult> {
  // 1. Try Claude Code agent FIRST (most frictionless - no API key needed!)
  try {
    const agent = await withTimeout(detectBestAgent(), 5000, 'Agent detection timeout');
    if (agent) {
      console.log(chalk.dim('  Using Claude Code...'));
      // Stop spinner before animation (they would conflict)
      if (spinner) {
        spinner.stop();
        console.log();
      }
      // generateViaAgent shows loading animation internally
      const ideas = await generateViaAgent(context, agent);
      return { ideas, method: 'agent' };
    }
  } catch (_error) {
    // Silent fallback to API
  }

  // 2. Try direct API if key available - supports Anthropic, OpenAI, OpenRouter
  const llmConfig = getConfiguredLLM();
  if (llmConfig) {
    try {
      const providerName = PROVIDERS[llmConfig.provider].displayName;
      console.log(chalk.dim(`  Using ${providerName} API...`));
      const ideas = await generateViaApi(context, llmConfig.provider, llmConfig.apiKey);
      return { ideas, method: 'api' };
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'unknown error';
      console.log(chalk.dim(`  API error (${msg}), using templates...`));
    }
  }

  // 3. Fallback: curated template suggestions (instant, always works)
  console.log(chalk.dim('  Loading curated ideas...'));
  return { ideas: getTemplateIdeas(context.method), method: 'templates' };
}

/**
 * Get the appropriate prompt for the context
 */
function getPromptForContext(context: IdeaContext): string {
  switch (context.method) {
    case 'brainstorm':
      return getBrainstormPrompt(); // Dynamic prompt with randomness
    case 'trending':
      return TREND_PROMPT;
    case 'skills':
      return SKILL_PROMPT.replace('{SKILLS}', context.skills?.join(', ') || 'general programming');
    case 'problem':
      return PROBLEM_PROMPT.replace('{PROBLEM}', context.problem || 'general productivity');
    default:
      return getBrainstormPrompt();
  }
}

/**
 * Generate ideas via LLM API (supports multiple providers)
 */
async function generateViaApi(
  context: IdeaContext,
  provider: LLMProvider,
  apiKey: string
): Promise<IdeaSuggestion[]> {
  const prompt = getPromptForContext(context);
  const model = getLLMModel() || PROVIDERS[provider].defaultModel;

  const response = await callLLM(provider, apiKey, {
    prompt,
    maxTokens: 2048,
    model,
  });

  // Parse JSON from response
  const jsonMatch = response.content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('No JSON in response');
  }

  const parsed = JSON.parse(jsonMatch[0]);
  return parsed.ideas as IdeaSuggestion[];
}

/**
 * Generate ideas via Claude Code agent (uses existing CLI auth)
 * Uses a simplified prompt to avoid timeouts
 */
async function generateViaAgent(context: IdeaContext, agent: any): Promise<IdeaSuggestion[]> {
  // Use a MUCH simpler prompt for the agent to avoid timeouts
  // The full prompts are too complex and cause Claude Code to do extra work
  const simplePrompt = getSimpleAgentPrompt(context);

  console.log(chalk.dim('  Running Claude Code...'));
  console.log();

  try {
    const result = await withTimeout(
      runAgent(agent, {
        task: simplePrompt,
        cwd: process.cwd(),
        auto: true,
        maxTurns: 2, // Limit to 2 turns - just get the response
        streamOutput: true,
      }),
      AGENT_TIMEOUT_MS,
      `Agent timed out after ${AGENT_TIMEOUT_MS / 1000}s`
    );

    console.log(); // Newline after streaming

    if (result.exitCode !== 0) {
      throw new Error(`Agent exited with code ${result.exitCode}`);
    }

    // Parse JSON from output
    const jsonMatch = result.output.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.log(chalk.yellow('  Could not find JSON in output, using templates...'));
      throw new Error('No JSON in agent output');
    }

    const parsed = JSON.parse(jsonMatch[0]);
    console.log(chalk.green('  ✓ Ideas generated!'));
    return parsed.ideas as IdeaSuggestion[];
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.log(chalk.red(`  ✗ Agent error: ${msg}`));
    throw error;
  }
}

/**
 * Get a simplified prompt for Claude Code agent
 * Shorter prompt = faster response, less chance of timeout
 */
function getSimpleAgentPrompt(context: IdeaContext): string {
  const base = `Generate 5 project ideas as JSON. Return ONLY this JSON format:
{"ideas":[{"title":"Name","description":"One sentence","projectType":"web|api|cli","difficulty":"easy|moderate|challenging","reasons":["reason1","reason2"]}]}`;

  switch (context.method) {
    case 'trending':
      return `${base}\n\nFocus on 2025 trends: AI tools, local-first apps, developer productivity.`;
    case 'skills':
      return `${base}\n\nFor someone who knows: ${context.skills?.join(', ') || 'programming'}`;
    case 'problem':
      return `${base}\n\nTo solve: ${context.problem || 'general productivity'}`;
    default:
      return `${base}\n\nMix of web apps, CLI tools, and APIs. Be creative!`;
  }
}

/**
 * Shuffle array randomly (Fisher-Yates)
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Template-based fallback when no LLM available - now with more variety and randomness!
 */
function getTemplateIdeas(method: IdeaDiscoveryMethod): IdeaSuggestion[] {
  // Large pool of ideas to pick from
  const allIdeas: IdeaSuggestion[] = [
    // Productivity & Tools
    {
      title: 'Personal Finance Tracker',
      description: 'Track expenses, set budgets, and visualize spending patterns',
      projectType: 'web' as ProjectType,
      difficulty: 'moderate',
      reasons: ['Practical everyday use', 'Great for learning data visualization'],
    },
    {
      title: 'Habit Tracker',
      description: 'Build streaks, track daily habits, and see your progress over time',
      projectType: 'web' as ProjectType,
      difficulty: 'easy',
      reasons: ['Personal growth tool', 'Great for beginners'],
    },
    {
      title: 'Pomodoro Timer',
      description: 'Focus timer with stats, break reminders, and daily productivity reports',
      projectType: 'web' as ProjectType,
      difficulty: 'easy',
      reasons: ['Simple but useful', 'Good first project'],
    },
    {
      title: 'Reading List Manager',
      description: 'Track books to read, currently reading, and finished with notes',
      projectType: 'web' as ProjectType,
      difficulty: 'easy',
      reasons: ['Personal utility', 'Classic CRUD app'],
    },
    {
      title: 'Meal Planner',
      description: 'Plan weekly meals, generate shopping lists, and track nutrition',
      projectType: 'web' as ProjectType,
      difficulty: 'moderate',
      reasons: ['Practical tool', 'Good data modeling exercise'],
    },

    // Developer Tools
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
      title: 'Code Snippet Manager',
      description: 'Save, organize, and search your code snippets with syntax highlighting',
      projectType: 'web' as ProjectType,
      difficulty: 'moderate',
      reasons: ['Developer utility', 'Good for learning'],
    },
    {
      title: 'Regex Tester',
      description: 'Interactive regex builder with real-time matching and explanations',
      projectType: 'web' as ProjectType,
      difficulty: 'easy',
      reasons: ['Everyone needs this', 'Great learning tool'],
    },
    {
      title: 'JSON/YAML Converter',
      description: 'Convert between JSON, YAML, and TOML with formatting options',
      projectType: 'web' as ProjectType,
      difficulty: 'easy',
      reasons: ['Practical utility', 'Quick to build'],
    },
    {
      title: 'Environment Variable Manager',
      description: 'Manage and sync .env files across projects securely',
      projectType: 'cli' as ProjectType,
      difficulty: 'moderate',
      reasons: ['Solves real problem', 'Security focused'],
    },

    // APIs
    {
      title: 'Recipe API',
      description: 'RESTful API for storing and retrieving recipes with ingredients',
      projectType: 'api' as ProjectType,
      difficulty: 'easy',
      reasons: ['Classic CRUD project', 'Easy to extend'],
    },
    {
      title: 'Quote of the Day API',
      description: 'API serving random quotes with categories and authors',
      projectType: 'api' as ProjectType,
      difficulty: 'easy',
      reasons: ['Simple and fun', 'Good API basics'],
    },
    {
      title: 'URL Shortener',
      description: 'Create short links with click tracking and analytics',
      projectType: 'api' as ProjectType,
      difficulty: 'easy',
      reasons: ['Classic project', 'Real-world useful'],
    },
    {
      title: 'Currency Converter API',
      description: 'Convert between currencies with historical rates',
      projectType: 'api' as ProjectType,
      difficulty: 'easy',
      reasons: ['Practical utility', 'Good for caching'],
    },
    {
      title: 'Weather Aggregator API',
      description: 'Aggregate weather data from multiple sources',
      projectType: 'api' as ProjectType,
      difficulty: 'moderate',
      reasons: ['Learn API integration', 'Data normalization'],
    },

    // Creative & Fun
    {
      title: 'Random Color Palette Generator',
      description: 'Generate harmonious color palettes for design projects',
      projectType: 'web' as ProjectType,
      difficulty: 'easy',
      reasons: ['Fun to build', 'Visual feedback'],
    },
    {
      title: 'ASCII Art Generator',
      description: 'Convert images to ASCII art with customizable characters',
      projectType: 'cli' as ProjectType,
      difficulty: 'moderate',
      reasons: ['Fun project', 'Image processing basics'],
    },
    {
      title: 'Playlist Shuffler',
      description: 'Create smart shuffled playlists based on mood or genre',
      projectType: 'web' as ProjectType,
      difficulty: 'moderate',
      reasons: ['Music is fun', 'Algorithm practice'],
    },
    {
      title: 'Daily Journal',
      description: 'Private daily journaling app with mood tracking and search',
      projectType: 'web' as ProjectType,
      difficulty: 'easy',
      reasons: ['Personal tool', 'Privacy focused'],
    },
    {
      title: 'Meme Generator',
      description: 'Create memes with templates and custom text',
      projectType: 'web' as ProjectType,
      difficulty: 'easy',
      reasons: ['Fun project', 'Image manipulation'],
    },

    // Automation
    {
      title: 'File Organizer',
      description: 'Automatically organize files by type, date, or custom rules',
      projectType: 'automation' as ProjectType,
      difficulty: 'moderate',
      reasons: ['Practical utility', 'File system practice'],
    },
    {
      title: 'Screenshot Organizer',
      description: 'Watch folder and organize screenshots by date and content',
      projectType: 'automation' as ProjectType,
      difficulty: 'easy',
      reasons: ['Solves real problem', 'File watching'],
    },
    {
      title: 'Email Digest Generator',
      description: 'Summarize and categorize emails into daily digests',
      projectType: 'automation' as ProjectType,
      difficulty: 'challenging',
      reasons: ['Time saver', 'API integration'],
    },
    {
      title: 'Social Media Scheduler',
      description: 'Schedule and auto-post content across platforms',
      projectType: 'automation' as ProjectType,
      difficulty: 'challenging',
      reasons: ['Marketing utility', 'OAuth practice'],
    },

    // AI/Trending
    {
      title: 'AI Prompt Library',
      description: 'Store, organize, and version prompts for LLM applications',
      projectType: 'web' as ProjectType,
      difficulty: 'moderate',
      reasons: ['AI tooling', 'Version control'],
    },
    {
      title: 'Local-First Notes',
      description: 'Offline-first note app with optional cloud sync',
      projectType: 'web' as ProjectType,
      difficulty: 'moderate',
      reasons: ['Privacy focused', 'Modern patterns'],
    },
    {
      title: 'Voice Memo Transcriber',
      description: 'Record voice memos and auto-transcribe with AI',
      projectType: 'web' as ProjectType,
      difficulty: 'moderate',
      reasons: ['AI integration', 'Audio processing'],
    },
    {
      title: 'Smart Bookmark Tagger',
      description: 'Auto-tag and categorize bookmarks using AI',
      projectType: 'automation' as ProjectType,
      difficulty: 'moderate',
      reasons: ['AI utility', 'Browser extension'],
    },
  ];

  // Get method-specific ideas or use all
  const methodSpecific: Record<IdeaDiscoveryMethod, string[]> = {
    brainstorm: [], // Use all
    trending: ['AI', 'Local-First', 'Smart', 'Voice'],
    skills: ['CLI', 'API', 'Generator', 'Manager'],
    problem: ['Organizer', 'Tracker', 'Manager', 'Scheduler'],
  };

  let pool = allIdeas;
  const keywords = methodSpecific[method];
  if (keywords && keywords.length > 0) {
    // Filter to method-relevant ideas
    const filtered = allIdeas.filter((idea) =>
      keywords.some((kw) => idea.title.includes(kw) || idea.description.includes(kw))
    );
    // If we have enough filtered, use them; otherwise use all
    if (filtered.length >= 5) {
      pool = filtered;
    }
  }

  // Shuffle and return 5 random ideas
  return shuffleArray(pool).slice(0, 5);
}
