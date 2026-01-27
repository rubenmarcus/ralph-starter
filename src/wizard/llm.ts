import chalk from 'chalk';
import type { Ora } from 'ora';
import { getConfiguredLLM, getLLMModel } from '../config/manager.js';
import { callLLM, type LLMProvider, PROVIDERS } from '../llm/index.js';
import { detectBestAgent, runAgent } from '../loop/agents.js';
import { RalphAnimator } from './ascii-art.js';
import type { RefinedIdea, ProjectType, Complexity, TechStack } from './types.js';

// Timeout for agent calls (60 seconds - agents take longer)
const AGENT_TIMEOUT_MS = 60000;

/**
 * Wrap a promise with a timeout
 */
function withTimeout<T>(promise: Promise<T>, timeoutMs: number, message: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(message)), timeoutMs)
    ),
  ]);
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
 * Priority: Claude Code CLI (no API key needed) > Direct API > Template fallback
 * @param spinner - Optional spinner to stop before streaming output
 */
export async function refineIdea(idea: string, spinner?: Ora): Promise<RefinedIdea> {
  // 1. Try Claude Code agent FIRST (most frictionless - no API key needed!)
  const agent = await detectBestAgent();
  if (agent) {
    try {
      // Stop spinner before showing loading animation
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
      } catch (error) {
        animator.stop(chalk.red('✗ Could not analyze idea'));
        // Fall through to API
      }
    } catch (error) {
      // Fall through to API - silent fallback
    }
  }

  // 2. Try direct API if key available (supports Anthropic, OpenAI, OpenRouter)
  const llmConfig = getConfiguredLLM();
  if (llmConfig) {
    try {
      return await refineViaApi(idea, llmConfig.provider, llmConfig.apiKey);
    } catch (error) {
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
 * Refine via Claude Code agent
 */
async function refineViaAgent(idea: string, agent: any): Promise<RefinedIdea> {
  const prompt = REFINEMENT_PROMPT.replace('{IDEA}', idea);

  // NOTE: Don't use maxTurns:1 - it's too restrictive and causes "Reached max turns" error
  const result = await withTimeout(
    runAgent(agent, {
      task: prompt,
      cwd: process.cwd(),
      auto: true,
      // Don't stream - Ralph animation provides visual feedback
      // No maxTurns - let agent complete naturally
    }),
    AGENT_TIMEOUT_MS,
    `Agent timed out after ${AGENT_TIMEOUT_MS / 1000}s`
  );

  if (result.exitCode !== 0) {
    throw new Error('Agent failed');
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
 * Refine via Claude Code agent with streaming output to animator
 */
async function refineViaAgentWithAnimator(
  idea: string,
  agent: any,
  animator: RalphAnimator
): Promise<RefinedIdea> {
  const prompt = REFINEMENT_PROMPT.replace('{IDEA}', idea);

  const result = await withTimeout(
    runAgent(agent, {
      task: prompt,
      cwd: process.cwd(),
      auto: true,
      onOutput: (line: string) => {
        // Parse JSONL lines to extract meaningful text for display
        try {
          const parsed = JSON.parse(line);
          // Show assistant text content (not tool calls or system messages)
          if (parsed.type === 'assistant' && parsed.message?.content) {
            for (const block of parsed.message.content) {
              if (block.type === 'text' && typeof block.text === 'string') {
                const text = block.text.trim();
                // Filter out JSON fragments, only show meaningful text
                if (text && !text.startsWith('{') && !text.startsWith('"') && text.length > 10) {
                  animator.addOutput(text);
                }
              }
            }
          }
        } catch {
          // Not JSON - show if meaningful
          if (line && !line.startsWith('{') && !line.startsWith('"') && line.trim().length > 10) {
            animator.addOutput(line.trim());
          }
        }
      },
    }),
    AGENT_TIMEOUT_MS,
    `Agent timed out after ${AGENT_TIMEOUT_MS / 1000}s`
  );

  if (result.exitCode !== 0) {
    throw new Error('Agent failed');
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
