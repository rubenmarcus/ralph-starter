import chalk from 'chalk';
import type { Ora } from 'ora';
import { getConfiguredLLM, getLLMModel } from '../config/manager.js';
import { callLLM, type LLMProvider, PROVIDERS } from '../llm/index.js';
import { type Agent, detectBestAgent, runAgent } from '../loop/agents.js';
import { RalphAnimator } from './ascii-art.js';
import type { ProjectType, RefinedIdea, TechStack } from './types.js';

// Timeout for agent calls (60 seconds - agents take longer)
const AGENT_TIMEOUT_MS = 60000;

/**
 * Wrap a promise with a timeout - properly cleans up the timer
 */
function withTimeout<T>(promise: Promise<T>, timeoutMs: number, message: string): Promise<T> {
  let timeoutId: NodeJS.Timeout;
  const timeoutPromise = new Promise<T>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(message)), timeoutMs);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timeoutId));
}

/**
 * Parse JSONL stream output from Claude Code to extract text content.
 * Claude Code's stream-json format emits one JSON object per line.
 * We look for:
 * 1. "type": "result" -> contains the final response in "result" field
 * 2. "type": "assistant" -> contains message content with text blocks
 */
function parseStreamJsonOutput(output: string): string {
  const lines = output.split('\n').filter(Boolean);
  let resultText = '';
  let assistantText = '';

  for (const line of lines) {
    try {
      const parsed = JSON.parse(line);

      // Check for result event (contains final summary)
      if (parsed.type === 'result' && parsed.result) {
        resultText = parsed.result;
      }

      // Check for assistant message (contains actual response content)
      if (parsed.type === 'assistant' && parsed.message?.content) {
        for (const block of parsed.message.content) {
          if (block.type === 'text' && typeof block.text === 'string') {
            assistantText += block.text;
          }
        }
      }
    } catch {
      // Ignore non-JSON lines
    }
  }

  // Prefer result text if available, fall back to assistant text
  return resultText || assistantText;
}

/**
 * Check for error events in stream-json output
 */
function checkForErrors(output: string): string | null {
  const lines = output.split('\n').filter(Boolean);
  for (const line of lines) {
    try {
      const parsed = JSON.parse(line);
      if (parsed.type === 'error') {
        return parsed.error?.message || parsed.message || 'Unknown error';
      }
    } catch {
      // Ignore non-JSON lines
    }
  }
  return null;
}

/**
 * Extract JSON object from text (handles markdown code blocks and plain JSON)
 */
function extractJsonFromText(text: string): string | null {
  // First, try to find JSON in markdown code blocks
  const codeBlockMatch = text.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
  if (codeBlockMatch) {
    return codeBlockMatch[1];
  }

  // Fall back to raw JSON match
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  return jsonMatch ? jsonMatch[0] : null;
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
    "frontend": "react|nextjs|vue|svelte|astro|remix|vanilla|react-native|expo|null",
    "backend": "nodejs|express|fastify|hono|python|django|flask|fastapi|go|gin|rust|null",
    "database": "sqlite|postgres|mysql|mongodb|redis|supabase|firebase|prisma|drizzle|null",
    "styling": "tailwind|css|scss|styled-components|null",
    "uiLibrary": "shadcn|shadcn-vue|shadcn-svelte|mui|chakra|null",
    "language": "typescript|javascript|python|go|rust"
  },
  "coreFeatures": ["feature1", "feature2", "feature3"],
  "suggestedFeatures": ["additional-feature1", "additional-feature2"],
  "estimatedComplexity": "prototype|mvp|full"
}

Guidelines:
- projectName should be short, memorable, and lowercase with hyphens
- Choose the most appropriate projectType based on the idea
- CRITICAL: If the user mentions ANY specific technology, framework, library, or tool, you MUST use it exactly as specified. This applies to:
  - Frontend: Astro, Next.js, Vue, Svelte, React, Remix, etc.
  - Backend: Express, Fastify, Hono, Django, Flask, FastAPI, Gin, etc.
  - Database: PostgreSQL, MySQL, MongoDB, Supabase, Firebase, Prisma, Drizzle, etc.
  - Styling: Tailwind, SCSS, styled-components, etc.
  - Language: TypeScript, Python, Go, Rust, etc.
- NEVER substitute a user-specified technology with a different one
- Only suggest defaults when the user doesn't specify (e.g., TypeScript + React for unspecified web apps)
- For web projects, default to Tailwind CSS + shadcn/ui (or framework variant) + motion-primitives unless the user explicitly specifies different styling/UI libraries. Use shadcn for React/Next.js, shadcn-vue for Vue, shadcn-svelte for Svelte.
- coreFeatures are essential features implied by the idea
- suggestedFeatures are nice-to-haves that would enhance the project
- estimatedComplexity is based on scope (prototype=hours, mvp=day, full=days/weeks)`;

/**
 * Refine user's idea using LLM (hybrid approach)
 * Priority: Claude Code CLI (no API key needed) > Direct API > Template fallback
 * @param idea - The user's project idea
 * @param spinner - Optional spinner to stop before streaming output
 * @param providedAgent - Optional pre-detected agent to avoid duplicate detection
 */
export async function refineIdea(
  idea: string,
  spinner?: Ora,
  providedAgent?: Agent | null
): Promise<RefinedIdea> {
  // 1. Try Claude Code agent FIRST (most frictionless - no API key needed!)
  // Use provided agent or detect (avoids calling detectBestAgent twice)
  const agent = providedAgent !== undefined ? providedAgent : await detectBestAgent();
  if (agent) {
    try {
      // Stop spinner before showing loading animation (avoids two spinners)
      if (spinner) {
        spinner.stop();
        console.log();
      }

      // Use loading animation while agent works
      const animator = new RalphAnimator();
      animator.start('Analyzing your idea...');

      try {
        const result = await refineViaAgentWithAnimator(idea, agent, animator);
        animator.stop(chalk.green('✓ Idea analyzed!'));
        return result;
      } catch (_error) {
        animator.stop(chalk.red('✗ Could not analyze idea'));
        // Fall through to API
      }
    } catch (_error) {
      // Fall through to API - silent fallback
    }
  } else if (spinner) {
    // No agent available, stop spinner before API fallback
    spinner.stop();
  }

  // 2. Try direct API if key available (supports Anthropic, OpenAI, OpenRouter)
  const llmConfig = getConfiguredLLM();
  if (llmConfig) {
    try {
      return await refineViaApi(idea, llmConfig.provider, llmConfig.apiKey);
    } catch (_error) {
      // Fall through to template - silent fallback
    }
  }

  // 3. Ultimate fallback: template-based suggestions
  return getTemplateSuggestions(idea);
}

/**
 * Refine via LLM API (supports multiple providers)
 */
async function refineViaApi(
  idea: string,
  provider: LLMProvider,
  apiKey: string
): Promise<RefinedIdea> {
  const prompt = REFINEMENT_PROMPT.replace('{IDEA}', idea);
  const model = getLLMModel() || PROVIDERS[provider].defaultModel;

  const response = await callLLM(provider, apiKey, {
    prompt,
    maxTokens: 1024,
    model,
  });

  // Parse JSON from response
  const jsonMatch = response.content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('No JSON in response');
  }

  return JSON.parse(jsonMatch[0]) as RefinedIdea;
}

/**
 * Refine via Claude Code agent (unused - kept for reference)
 */
async function _refineViaAgent(idea: string, agent: any): Promise<RefinedIdea> {
  const prompt = REFINEMENT_PROMPT.replace('{IDEA}', idea);

  // NOTE: Don't use maxTurns:1 - it's too restrictive and causes "Reached max turns" error
  const result = await withTimeout(
    runAgent(agent, {
      task: prompt,
      cwd: process.cwd(),
      auto: true,
      // No maxTurns - let agent complete naturally
    }),
    AGENT_TIMEOUT_MS,
    `Agent timed out after ${AGENT_TIMEOUT_MS / 1000}s`
  );

  // Check for errors in stream-json output first
  const error = checkForErrors(result.output);
  if (error) {
    throw new Error(`Claude error: ${error}`);
  }

  if (result.exitCode !== 0) {
    throw new Error(`Agent failed with exit code ${result.exitCode}`);
  }

  // Parse JSONL stream output to extract text content
  const textContent = parseStreamJsonOutput(result.output);

  // Extract JSON from the text content
  const jsonText = extractJsonFromText(textContent || result.output);
  if (!jsonText) {
    throw new Error('No JSON in agent output');
  }

  return JSON.parse(jsonText) as RefinedIdea;
}

/**
 * Detect status message from JSONL event
 */
function getStatusFromEvent(parsed: any): string | null {
  // System events
  if (parsed.type === 'system') {
    if (parsed.subtype === 'init') return 'Starting up...';
    return null;
  }

  // Assistant is thinking/responding
  if (parsed.type === 'assistant') {
    const content = parsed.message?.content;
    if (content && Array.isArray(content)) {
      for (const block of content) {
        // Tool use - show what tool is being used
        if (block.type === 'tool_use') {
          const toolName = block.name?.toLowerCase() || '';
          if (toolName.includes('read')) return 'Reading files...';
          if (toolName.includes('write') || toolName.includes('edit')) return 'Writing...';
          if (toolName.includes('glob') || toolName.includes('grep')) return 'Searching...';
          if (toolName.includes('bash')) return 'Running command...';
          if (toolName.includes('task')) return 'Processing...';
          return `Using ${block.name}...`;
        }
        // Text content - Claude is thinking
        if (block.type === 'text') {
          return 'Thinking...';
        }
      }
    }
    return 'Thinking...';
  }

  // User/tool result
  if (parsed.type === 'user') {
    return 'Processing result...';
  }

  // Result event
  if (parsed.type === 'result') {
    return 'Finishing up...';
  }

  return null;
}

/**
 * Refine via Claude Code agent with streaming output to animator
 */
async function refineViaAgentWithAnimator(
  idea: string,
  agent: any,
  animator: RalphAnimator
): Promise<RefinedIdea> {
  const prompt = REFINEMENT_PROMPT.replace('{IDEA}', idea);

  // NOTE: Don't use maxTurns:1 - it's too restrictive and causes "Reached max turns" error
  // Let the agent complete naturally within the timeout
  const result = await withTimeout(
    runAgent(agent, {
      task: prompt,
      cwd: process.cwd(),
      auto: true,
    }),
    AGENT_TIMEOUT_MS,
    `Agent timed out after ${AGENT_TIMEOUT_MS / 1000}s`
  );

  // Check for errors in stream-json output first
  const error = checkForErrors(result.output);
  if (error) {
    throw new Error(`Claude error: ${error}`);
  }

  if (result.exitCode !== 0) {
    throw new Error(`Agent failed with exit code ${result.exitCode}`);
  }

  // Parse JSONL stream output to extract text content
  const textContent = parseStreamJsonOutput(result.output);

  // Extract JSON from the text content
  const jsonText = extractJsonFromText(textContent || result.output);
  if (!jsonText) {
    // Include output preview for debugging
    const preview = result.output.slice(0, 200);
    throw new Error(`No JSON in agent output. Preview: ${preview}`);
  }

  return JSON.parse(jsonText) as RefinedIdea;
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
  } else if (
    lowerIdea.includes('cli') ||
    lowerIdea.includes('command line') ||
    lowerIdea.includes('terminal')
  ) {
    projectType = 'cli';
  } else if (
    lowerIdea.includes('mobile') ||
    lowerIdea.includes('ios') ||
    lowerIdea.includes('android')
  ) {
    projectType = 'mobile';
  } else if (
    lowerIdea.includes('library') ||
    lowerIdea.includes('package') ||
    lowerIdea.includes('sdk')
  ) {
    projectType = 'library';
  } else if (
    lowerIdea.includes('script') ||
    lowerIdea.includes('automate') ||
    lowerIdea.includes('bot')
  ) {
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

  // Detect specific technologies from idea
  const detectTech = (patterns: [string, string][]): string | undefined => {
    for (const [pattern, value] of patterns) {
      if (lowerIdea.includes(pattern)) return value;
    }
    return undefined;
  };

  const detectedFrontend = detectTech([
    ['astro', 'astro'],
    ['nextjs', 'nextjs'],
    ['next.js', 'nextjs'],
    ['remix', 'remix'],
    ['vue', 'vue'],
    ['svelte', 'svelte'],
    ['react native', 'react-native'],
    ['expo', 'expo'],
  ]);

  const detectedBackend = detectTech([
    ['express', 'express'],
    ['fastify', 'fastify'],
    ['hono', 'hono'],
    ['django', 'django'],
    ['flask', 'flask'],
    ['fastapi', 'fastapi'],
    ['gin', 'gin'],
  ]);

  const detectedDatabase = detectTech([
    ['supabase', 'supabase'],
    ['firebase', 'firebase'],
    ['prisma', 'prisma'],
    ['drizzle', 'drizzle'],
    ['postgres', 'postgres'],
    ['postgresql', 'postgres'],
    ['mysql', 'mysql'],
    ['mongodb', 'mongodb'],
    ['mongo', 'mongodb'],
    ['redis', 'redis'],
  ]);

  const detectedStyling = detectTech([
    ['tailwind', 'tailwind'],
    ['styled-components', 'styled-components'],
    ['scss', 'scss'],
    ['sass', 'scss'],
  ]);

  const detectedLanguage = detectTech([
    ['typescript', 'typescript'],
    ['python', 'python'],
    ['golang', 'go'],
    [' go ', 'go'],
    ['rust', 'rust'],
  ]);

  // Suggest stack based on type and detected tech
  const suggestedStack: TechStack = {};

  if (projectType === 'web') {
    suggestedStack.frontend = detectedFrontend || 'react';
    suggestedStack.backend =
      detectedBackend || (detectedFrontend === 'astro' ? undefined : 'nodejs');
    suggestedStack.database =
      detectedDatabase || (detectedFrontend === 'astro' ? undefined : 'sqlite');

    // Default UI stack: Tailwind + shadcn (framework-appropriate variant) + motion-primitives
    if (!detectedStyling) {
      suggestedStack.styling = 'tailwind';
      const frontend = suggestedStack.frontend;
      if (frontend === 'vue') {
        suggestedStack.uiLibrary = 'shadcn-vue';
      } else if (frontend === 'svelte') {
        suggestedStack.uiLibrary = 'shadcn-svelte';
      } else if (frontend && frontend !== 'vanilla' && frontend !== 'astro') {
        suggestedStack.uiLibrary = 'shadcn';
      }
    }
  } else if (projectType === 'api') {
    suggestedStack.backend = detectedBackend || 'nodejs';
    suggestedStack.database = detectedDatabase || 'postgres';
  } else if (projectType === 'mobile') {
    suggestedStack.frontend = detectedFrontend || 'expo';
    suggestedStack.backend = detectedBackend || 'nodejs';
  } else if (projectType === 'cli') {
    suggestedStack.language = detectedLanguage || 'typescript';
  }

  // Add detected styling and language if found
  if (detectedStyling) suggestedStack.styling = detectedStyling;
  if (detectedLanguage) suggestedStack.language = detectedLanguage;

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
 * Priority: Claude Code agent (no API key needed) > API key configured
 */
export async function isLlmAvailable(): Promise<boolean> {
  // Check for Claude Code agent first (most frictionless)
  const agent = await detectBestAgent();
  if (agent) return true;

  // Check for API key
  const llmConfig = getConfiguredLLM();
  return llmConfig !== null;
}
