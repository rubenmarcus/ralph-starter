/**
 * Unified LLM API for ralph-starter
 * Supports Anthropic, OpenAI, and OpenRouter
 */

import { getProviderKeyFromEnv, type LLMProvider, PROVIDERS } from './providers.js';

// Timeout for API calls (30 seconds)
const API_TIMEOUT_MS = 30000;

export interface LLMRequest {
  prompt: string;
  maxTokens?: number;
  model?: string;
}

export interface LLMResponse {
  content: string;
  model: string;
  provider: LLMProvider;
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

/**
 * Call Anthropic API
 */
async function callAnthropic(apiKey: string, request: LLMRequest): Promise<LLMResponse> {
  const config = PROVIDERS.anthropic;
  const model = request.model || config.defaultModel;

  const response = await fetchWithTimeout(config.apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: request.maxTokens || 1024,
      messages: [
        {
          role: 'user',
          content: request.prompt,
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Anthropic API error ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  const content = data.content?.[0]?.text;

  if (!content) {
    throw new Error('No response content from Anthropic');
  }

  return {
    content,
    model,
    provider: 'anthropic',
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

  const response = await fetchWithTimeout(config.apiUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model,
      max_tokens: request.maxTokens || 1024,
      messages: [
        {
          role: 'user',
          content: request.prompt,
        },
      ],
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

  return {
    content,
    model,
    provider,
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
