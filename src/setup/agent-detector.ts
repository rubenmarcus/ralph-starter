/**
 * Agent Detection for ralph-starter
 * Detects installed AI coding agents (Claude Code, OpenCode, Codex, Aider)
 */

import { platform } from 'os';

export interface AgentInfo {
  id: string;
  name: string;
  command: string;
  versionFlag: string;
  description: string;
}

export interface AgentDetectionResult {
  id: string;
  name: string;
  available: boolean;
  version?: string;
  executablePath?: string;
  error?: string;
}

/**
 * List of supported AI agents
 */
export const SUPPORTED_AGENTS: AgentInfo[] = [
  {
    id: 'claude',
    name: 'Claude Code',
    command: 'claude',
    versionFlag: '--version',
    description: 'Anthropic\'s Claude Code CLI',
  },
  {
    id: 'opencode',
    name: 'OpenCode',
    command: 'opencode',
    versionFlag: '--version',
    description: 'OpenCode AI coding assistant',
  },
  {
    id: 'codex',
    name: 'Codex',
    command: 'codex',
    versionFlag: '--version',
    description: 'OpenAI Codex CLI',
  },
  {
    id: 'aider',
    name: 'Aider',
    command: 'aider',
    versionFlag: '--version',
    description: 'AI pair programming in your terminal',
  },
];

/**
 * Find executable in PATH
 */
async function findExecutable(command: string): Promise<string | null> {
  try {
    const { execa } = await import('execa');
    const isWindows = platform() === 'win32';
    const whichCmd = isWindows ? 'where' : 'which';

    const result = await execa(whichCmd, [command], { timeout: 5000 });
    const path = result.stdout.trim().split('\n')[0];
    return path || null;
  } catch {
    return null;
  }
}

/**
 * Get version of an executable
 */
async function getVersion(command: string, versionFlag: string): Promise<string | null> {
  try {
    const { execa } = await import('execa');
    const result = await execa(command, [versionFlag], { timeout: 5000 });
    const output = result.stdout.trim();

    // Extract version number (e.g., "1.0.12" from various formats)
    const versionMatch = output.match(/v?(\d+\.\d+(?:\.\d+)?(?:-[a-zA-Z0-9.]+)?)/);
    return versionMatch ? versionMatch[1] : output.split('\n')[0];
  } catch {
    return null;
  }
}

/**
 * Detect a single agent
 */
export async function detectAgent(agent: AgentInfo): Promise<AgentDetectionResult> {
  const executablePath = await findExecutable(agent.command);

  if (!executablePath) {
    return {
      id: agent.id,
      name: agent.name,
      available: false,
      error: `${agent.command} not found in PATH`,
    };
  }

  const version = await getVersion(agent.command, agent.versionFlag);

  return {
    id: agent.id,
    name: agent.name,
    available: true,
    version: version || undefined,
    executablePath,
  };
}

/**
 * Detect all supported agents
 */
export async function detectAllAgents(): Promise<AgentDetectionResult[]> {
  const results = await Promise.all(
    SUPPORTED_AGENTS.map((agent) => detectAgent(agent))
  );
  return results;
}

/**
 * Get the first available agent
 */
export async function getFirstAvailableAgent(): Promise<AgentDetectionResult | null> {
  const results = await detectAllAgents();
  return results.find((r) => r.available) || null;
}

/**
 * Check if Claude Code CLI is available
 */
export async function isClaudeCodeAvailable(): Promise<AgentDetectionResult> {
  const claudeAgent = SUPPORTED_AGENTS.find((a) => a.id === 'claude')!;
  return detectAgent(claudeAgent);
}

/**
 * Quick test to verify Claude Code CLI is functional
 * Uses --version which is fast and doesn't require authentication
 */
export async function testClaudeCodeConnection(): Promise<{
  success: boolean;
  responseTime?: number;
  error?: string;
}> {
  const startTime = Date.now();

  try {
    const { execa } = await import('execa');

    // Quick test using --version (fast, no auth needed)
    const result = await execa('claude', ['--version'], { timeout: 10000 });

    const responseTime = Date.now() - startTime;

    if (result.exitCode === 0) {
      return { success: true, responseTime };
    }

    return {
      success: false,
      error: 'Claude CLI returned non-zero exit code',
    };
  } catch (error) {
    const err = error as Error;
    return {
      success: false,
      error: err.message || 'Connection failed',
    };
  }
}

/**
 * Full test with actual LLM prompt (slower, requires auth)
 */
export async function testClaudeCodeWithPrompt(): Promise<{
  success: boolean;
  responseTime?: number;
  error?: string;
}> {
  const startTime = Date.now();

  try {
    const { execa } = await import('execa');

    // Run a simple test prompt
    const result = await execa(
      'claude',
      ['-p', 'say OK', '--no-markdown'],
      { timeout: 60000 }
    );

    const responseTime = Date.now() - startTime;

    if (result.stdout || result.exitCode === 0) {
      return { success: true, responseTime };
    }

    return { success: true, responseTime };
  } catch (error) {
    const err = error as Error;
    if (err.message?.includes('timed out')) {
      return {
        success: false,
        error: 'Request timed out - Claude may be slow or not authenticated',
      };
    }
    return {
      success: false,
      error: err.message || 'Connection failed',
    };
  }
}
