/**
 * Unified LLM API for ralph-starter
 * Supports Anthropic (via SDK with prompt caching), OpenAI, and OpenRouter
 */

import Anthropic from '@anthropic-ai/sdk';
import { getProviderKeyFromEnv, type LLMProvider, PROVIDERS } from './providers.js';

// Timeout for API calls (30 seconds)
const API_TIMEOUT_MS = 30000;

export interface LLMRequest {
  prompt: string;
  /** Optional system message (will be cached for Anthropic) */
  system?: string;
  maxTokens?: number;
  model?: string;
}

export interface LLMUsage {
  inputTokens: number;
  outputTokens: number;
  cacheCreationInputTokens?: number;
  cacheReadInputTokens?: number;
}

export interface LLMResponse {
  content: string;
  model: string;
  provider: LLMProvider;
  usage?: LLMUsage;
}

/**
 * Fetch with timeout using AbortController
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs: number = API_TIMEOUT_MS
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Request timed out after ${timeoutMs / 1000}s`);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

// Singleton Anthropic client (reused for connection pooling and caching)
let anthropicClient: Anthropic | null = null;

function getAnthropicClient(apiKey: string): Anthropic {
  if (!anthropicClient) {
    anthropicClient = new Anthropic({ apiKey, timeout: API_TIMEOUT_MS });
  }
  return anthropicClient;
}

/**
 * Call Anthropic API using the official SDK with prompt caching support.
 *
 * When a `system` message is provided, it is marked with `cache_control`
 * so that repeated calls with the same system prompt benefit from
 * Anthropic's prompt caching (90% cheaper on cache reads).
 */
async function callAnthropic(apiKey: string, request: LLMRequest): Promise<LLMResponse> {
  const config = PROVIDERS.anthropic;
  const model = request.model || config.defaultModel;
  const client = getAnthropicClient(apiKey);

  // Build system message with cache control if provided
  const system: Anthropic.Messages.TextBlockParam[] | undefined = request.system
    ? [
        {
          type: 'text' as const,
          text: request.system,
          cache_control: { type: 'ephemeral' as const },
        },
      ]
    : undefined;

  const response = await client.messages.create({
    model,
    max_tokens: request.maxTokens || 1024,
    system,
    messages: [
      {
        role: 'user',
        content: request.prompt,
      },
    ],
  });

  const textBlock = response.content.find((block) => block.type === 'text');
  const content = textBlock && 'text' in textBlock ? textBlock.text : undefined;

  if (!content) {
    throw new Error('No response content from Anthropic');
  }

  // Extract usage including cache metrics
  // Cache fields may exist on the usage object but aren't in the base type
  const rawUsage = response.usage as unknown as Record<string, number>;
  const usage: LLMUsage = {
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
    cacheCreationInputTokens: rawUsage.cache_creation_input_tokens,
    cacheReadInputTokens: rawUsage.cache_read_input_tokens,
  };

  return {
    content,
    model,
    provider: 'anthropic',
    usage,
  };
}

/**
 * Call OpenAI-compatible API (OpenAI and OpenRouter)
 */
async function callOpenAICompatible(
  provider: 'openai' | 'openrouter',
  apiKey: string,
  request: LLMRequest
): Promise<LLMResponse> {
  const config = PROVIDERS[provider];
  const model = request.model || config.defaultModel;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${apiKey}`,
  };

  // OpenRouter requires additional headers
  if (provider === 'openrouter') {
    headers['HTTP-Referer'] = 'https://github.com/ralph-starter';
    headers['X-Title'] = 'ralph-starter';
  }

  // Build messages array, optionally including system message
  const messages: { role: string; content: string }[] = [];
  if (request.system) {
    messages.push({ role: 'system', content: request.system });
  }
  messages.push({ role: 'user', content: request.prompt });

  const response = await fetchWithTimeout(config.apiUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model,
      max_tokens: request.maxTokens || 1024,
      messages,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`${config.displayName} API error ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error(`No response content from ${config.displayName}`);
  }

  // Extract usage if available
  const usage: LLMUsage | undefined = data.usage
    ? {
        inputTokens: data.usage.prompt_tokens || 0,
        outputTokens: data.usage.completion_tokens || 0,
      }
    : undefined;

  return {
    content,
    model,
    provider,
    usage,
  };
}

/**
 * Unified LLM call function
 * Calls the appropriate provider API based on provider type
 */
export async function callLLM(
  provider: LLMProvider,
  apiKey: string,
  request: LLMRequest
): Promise<LLMResponse> {
  switch (provider) {
    case 'anthropic':
      return callAnthropic(apiKey, request);
    case 'openai':
    case 'openrouter':
      return callOpenAICompatible(provider, apiKey, request);
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}

/**
 * Try to call LLM with auto-detected or specified provider
 * Returns null if no API key is available
 */
export async function tryCallLLM(
  request: LLMRequest,
  options?: {
    provider?: LLMProvider;
    apiKey?: string;
  }
): Promise<LLMResponse | null> {
  const { provider, apiKey } = options || {};

  // If provider and key specified, use them
  if (provider && apiKey) {
    return callLLM(provider, apiKey, request);
  }

  // Try to find an available provider
  const providers: LLMProvider[] = provider ? [provider] : ['anthropic', 'openai', 'openrouter'];

  for (const p of providers) {
    const key = apiKey || getProviderKeyFromEnv(p);
    if (key) {
      try {
        return await callLLM(p, key, request);
      } catch {}
    }
  }

  return null;
}
