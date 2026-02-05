/**
 * Session Management for pause/resume support
 * Allows saving and restoring loop state across CLI invocations
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import type { Agent } from './agents.js';
import type { CircuitBreakerConfig } from './circuit-breaker.js';
import type { CostTrackerStats } from './cost-tracker.js';

const SESSION_FILE = '.ralph-session.json';

/**
 * Session state that can be serialized and restored
 */
export interface SessionState {
  /** Unique session identifier */
  id: string;
  /** Session creation timestamp */
  createdAt: string;
  /** Last update timestamp */
  updatedAt: string;
  /** Session status */
  status: 'running' | 'paused' | 'completed' | 'failed';
  /** Current iteration number */
  iteration: number;
  /** Maximum iterations allowed */
  maxIterations: number;
  /** The original task description */
  task: string;
  /** Working directory */
  cwd: string;
  /** Agent being used */
  agent: {
    name: string;
    command: string;
  };
  /** Options that were passed to the loop */
  options: {
    auto?: boolean;
    commit?: boolean;
    push?: boolean;
    pr?: boolean;
    prTitle?: string;
    validate?: boolean;
    completionPromise?: string;
    requireExitSignal?: boolean;
    minCompletionIndicators?: number;
    circuitBreaker?: Partial<CircuitBreakerConfig>;
    rateLimit?: number;
    trackProgress?: boolean;
    checkFileCompletion?: boolean;
    trackCost?: boolean;
    model?: string;
  };
  /** Commits made so far */
  commits: string[];
  /** Accumulated statistics */
  stats: {
    totalDuration: number;
    validationFailures: number;
    costStats?: CostTrackerStats;
  };
  /** Reason for pausing (if paused) */
  pauseReason?: string;
  /** Error message (if failed) */
  error?: string;
  /** Exit reason */
  exitReason?:
    | 'completed'
    | 'blocked'
    | 'max_iterations'
    | 'circuit_breaker'
    | 'rate_limit'
    | 'file_signal'
    | 'paused';
}

/**
 * Generate a unique session ID
 */
function generateSessionId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `ralph-${timestamp}-${random}`;
}

/**
 * Get the session file path for a directory
 */
export function getSessionPath(cwd: string): string {
  return path.join(cwd, SESSION_FILE);
}

/**
 * Check if an active session exists
 */
export async function hasActiveSession(cwd: string): Promise<boolean> {
  const sessionPath = getSessionPath(cwd);
  try {
    await fs.access(sessionPath);
    const session = await loadSession(cwd);
    return session !== null && (session.status === 'running' || session.status === 'paused');
  } catch {
    return false;
  }
}

/**
 * Load an existing session from disk
 */
export async function loadSession(cwd: string): Promise<SessionState | null> {
  const sessionPath = getSessionPath(cwd);
  try {
    const content = await fs.readFile(sessionPath, 'utf-8');
    const session = JSON.parse(content) as SessionState;

    // Validate the session has required fields
    if (!session.id || !session.task || !session.agent) {
      return null;
    }

    return session;
  } catch {
    return null;
  }
}

/**
 * Save session state to disk
 */
export async function saveSession(session: SessionState): Promise<void> {
  const sessionPath = getSessionPath(session.cwd);
  const content = JSON.stringify(session, null, 2);
  await fs.writeFile(sessionPath, content, 'utf-8');
}

/**
 * Create a new session
 */
export function createSession(
  cwd: string,
  task: string,
  agent: Agent,
  options: SessionState['options'] = {},
  maxIterations: number = 50
): SessionState {
  const now = new Date().toISOString();
  return {
    id: generateSessionId(),
    createdAt: now,
    updatedAt: now,
    status: 'running',
    iteration: 0,
    maxIterations,
    task,
    cwd,
    agent: {
      name: agent.name,
      command: agent.command,
    },
    options,
    commits: [],
    stats: {
      totalDuration: 0,
      validationFailures: 0,
    },
  };
}

/**
 * Update session after an iteration
 */
export async function updateSessionIteration(
  cwd: string,
  iteration: number,
  duration: number,
  commits: string[],
  costStats?: CostTrackerStats
): Promise<SessionState | null> {
  const session = await loadSession(cwd);
  if (!session) return null;

  session.updatedAt = new Date().toISOString();
  session.iteration = iteration;
  session.commits = commits;
  session.stats.totalDuration += duration;
  if (costStats) {
    session.stats.costStats = costStats;
  }

  await saveSession(session);
  return session;
}

/**
 * Pause the current session
 */
export async function pauseSession(cwd: string, reason?: string): Promise<SessionState | null> {
  const session = await loadSession(cwd);
  if (!session) return null;

  session.updatedAt = new Date().toISOString();
  session.status = 'paused';
  session.exitReason = 'paused';
  session.pauseReason = reason;

  await saveSession(session);
  return session;
}

/**
 * Resume a paused session
 */
export async function resumeSession(cwd: string): Promise<SessionState | null> {
  const session = await loadSession(cwd);
  if (!session) return null;

  if (session.status !== 'paused') {
    return null; // Can only resume paused sessions
  }

  session.updatedAt = new Date().toISOString();
  session.status = 'running';
  session.exitReason = undefined;
  session.pauseReason = undefined;

  await saveSession(session);
  return session;
}

/**
 * Mark session as completed
 */
export async function completeSession(
  cwd: string,
  exitReason: SessionState['exitReason'],
  error?: string
): Promise<SessionState | null> {
  const session = await loadSession(cwd);
  if (!session) return null;

  session.updatedAt = new Date().toISOString();
  session.status =
    exitReason === 'completed' || exitReason === 'file_signal' ? 'completed' : 'failed';
  session.exitReason = exitReason;
  session.error = error;

  await saveSession(session);
  return session;
}

/**
 * Delete the session file
 */
export async function deleteSession(cwd: string): Promise<boolean> {
  const sessionPath = getSessionPath(cwd);
  try {
    await fs.unlink(sessionPath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get a summary of the session for display
 */
export function formatSessionSummary(session: SessionState): string {
  const lines: string[] = [];

  lines.push(`Session: ${session.id}`);
  lines.push(`Status: ${session.status}`);
  lines.push(`Task: ${session.task.slice(0, 60)}${session.task.length > 60 ? '...' : ''}`);
  lines.push(`Progress: ${session.iteration}/${session.maxIterations} iterations`);
  lines.push(`Agent: ${session.agent.name}`);

  if (session.commits.length > 0) {
    lines.push(`Commits: ${session.commits.length}`);
  }

  const duration = session.stats.totalDuration;
  if (duration > 0) {
    const minutes = Math.floor(duration / 60000);
    const seconds = Math.floor((duration % 60000) / 1000);
    lines.push(`Duration: ${minutes}m ${seconds}s`);
  }

  if (session.stats.costStats) {
    const cost = session.stats.costStats.totalCost.totalCost;
    lines.push(`Cost: $${cost.toFixed(3)}`);
  }

  if (session.pauseReason) {
    lines.push(`Pause reason: ${session.pauseReason}`);
  }

  if (session.error) {
    lines.push(`Error: ${session.error}`);
  }

  return lines.join('\n');
}

/**
 * Check if session can be resumed
 */
export function canResume(session: SessionState): boolean {
  return session.status === 'paused';
}

/**
 * Check if session is still active (running or paused)
 */
export function isActiveSession(session: SessionState): boolean {
  return session.status === 'running' || session.status === 'paused';
}

/**
 * Calculate remaining iterations
 */
export function getRemainingIterations(session: SessionState): number {
  return Math.max(0, session.maxIterations - session.iteration);
}

/**
 * Reconstruct agent object from session data
 */
export function reconstructAgent(session: SessionState): Agent {
  // Determine agent type from command
  const typeMap: Record<string, Agent['type']> = {
    claude: 'claude-code',
    cursor: 'cursor',
    codex: 'codex',
    opencode: 'opencode',
  };
  const agentType = typeMap[session.agent.command] || 'unknown';

  return {
    type: agentType,
    name: session.agent.name,
    command: session.agent.command,
    available: true, // Assume available since it was used before
  };
}
