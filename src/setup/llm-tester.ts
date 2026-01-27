/**
 * LLM Connection Tester for ralph-starter
 * Tests connections to various LLM providers
 */

import { callLLM, type LLMProvider, PROVIDERS } from '../llm/index.js';
import { isClaudeCodeAvailable, testClaudeCodeConnection } from './agent-detector.js';

export interface LLMTestResult {
  success: boolean;
  provider?: LLMProvider | 'claude-code';
  responseTime?: number;
  error?: string;
  details?: string;
}

/**
 * Test direct API connection to an LLM provider
 */
export async function testApiConnection(
  provider: LLMProvider,
  apiKey: string
): Promise<LLMTestResult> {
  const startTime = Date.now();

  try {
    const response = await callLLM(provider, apiKey, {
      prompt: 'Respond with just the word OK',
      maxTokens: 10,
    });

    const responseTime = Date.now() - startTime;

    if (response.content) {
      return {
        success: true,
        provider,
        responseTime,
        details: `Model: ${response.model}`,
      };
    }

    return {
      success: false,
      provider,
      error: 'Empty response from API',
    };
  } catch (error) {
    const err = error as Error;
    return {
      success: false,
      provider,
      error: err.message || 'Connection failed',
    };
  }
}

/**
 * Test Claude Code CLI connection
 */
export async function testClaudeCode(): Promise<LLMTestResult> {
  // First check if Claude Code is available
  const detection = await isClaudeCodeAvailable();

  if (!detection.available) {
    return {
      success: false,
      provider: 'claude-code',
      error: detection.error || 'Claude Code CLI not found',
    };
  }

  // Then test the connection
  const result = await testClaudeCodeConnection();

  if (result.success) {
    return {
      success: true,
      provider: 'claude-code',
      responseTime: result.responseTime,
      details: `Version: ${detection.version || 'unknown'}`,
    };
  }

  return {
    success: false,
    provider: 'claude-code',
    error: result.error || 'Connection test failed',
  };
}

/**
 * Test the best available LLM option
 * Priority: Claude Code CLI > API key > nothing
 */
export async function testBestAvailable(options?: {
  provider?: LLMProvider;
  apiKey?: string;
}): Promise<LLMTestResult> {
  // Priority 1: Try Claude Code CLI first (no API key needed)
  const claudeCheck = await isClaudeCodeAvailable();
  if (claudeCheck.available) {
    const result = await testClaudeCode();
    if (result.success) {
      return result;
    }
    // Claude Code found but test failed - try API next
  }

  // Priority 2: Try API if key provided
  if (options?.provider && options?.apiKey) {
    return testApiConnection(options.provider, options.apiKey);
  }

  // Nothing available
  return {
    success: false,
    error: 'No LLM configured. Install Claude Code or set an API key.',
  };
}

/**
 * Get a human-readable description of the test result
 */
export function formatTestResult(result: LLMTestResult): string {
  if (result.success) {
    const time = result.responseTime ? ` (${result.responseTime}ms)` : '';
    const details = result.details ? `\n    ${result.details}` : '';
    return `Connection successful${time}${details}`;
  }

  return `Connection failed: ${result.error}`;
}
