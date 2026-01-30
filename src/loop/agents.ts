import { spawn } from 'node:child_process';
import chalk from 'chalk';
import { execa } from 'execa';

export type AgentType = 'claude-code' | 'cursor' | 'codex' | 'opencode' | 'unknown';

export interface Agent {
  type: AgentType;
  name: string;
  command: string;
  available: boolean;
}

export interface AgentRunOptions {
  task: string;
  cwd: string;
  auto?: boolean;
  maxTurns?: number;
  /** Stream output to console in real-time */
  streamOutput?: boolean;
  /** Callback for each line of output */
  onOutput?: (line: string) => void;
}

const AGENTS: Record<AgentType, { name: string; command: string; checkCmd: string[] }> = {
  'claude-code': {
    name: 'Claude Code',
    command: 'claude',
    checkCmd: ['claude', '--version'],
  },
  cursor: {
    name: 'Cursor',
    command: 'cursor',
    checkCmd: ['cursor', '--version'],
  },
  codex: {
    name: 'Codex CLI',
    command: 'codex',
    checkCmd: ['codex', '--version'],
  },
  opencode: {
    name: 'OpenCode',
    command: 'opencode',
    checkCmd: ['opencode', '--version'],
  },
  unknown: {
    name: 'Unknown',
    command: '',
    checkCmd: [],
  },
};

export async function checkAgentAvailable(type: AgentType): Promise<boolean> {
  if (type === 'unknown') return false;

  const agent = AGENTS[type];
  try {
    await execa(agent.checkCmd[0], agent.checkCmd.slice(1), { timeout: 5000 });
    return true;
  } catch {
    return false;
  }
}

export async function detectAvailableAgents(): Promise<Agent[]> {
  const agents: Agent[] = [];

  for (const [type, config] of Object.entries(AGENTS)) {
    if (type === 'unknown') continue;

    const available = await checkAgentAvailable(type as AgentType);
    agents.push({
      type: type as AgentType,
      name: config.name,
      command: config.command,
      available,
    });
  }

  return agents;
}

export async function detectBestAgent(): Promise<Agent | null> {
  const agents = await detectAvailableAgents();
  const available = agents.filter((a) => a.available);

  if (available.length === 0) return null;

  // Prefer Claude Code, then others
  const preferred = ['claude-code', 'cursor', 'codex', 'opencode'];
  for (const type of preferred) {
    const agent = available.find((a) => a.type === type);
    if (agent) return agent;
  }

  return available[0];
}

export async function runAgent(
  agent: Agent,
  options: AgentRunOptions
): Promise<{ output: string; exitCode: number }> {
  const args: string[] = [];

  switch (agent.type) {
    case 'claude-code':
      // Prompt first
      args.push('-p', options.task);
      // Auto mode
      if (options.auto) {
        args.push('--dangerously-skip-permissions');
      }
      // Streaming JSONL output for real-time progress
      args.push('--verbose');
      args.push('--output-format', 'stream-json');
      // Turn limit
      if (options.maxTurns) {
        args.push('--max-turns', String(options.maxTurns));
      }
      break;

    case 'cursor':
      args.push('--agent', options.task);
      break;

    case 'codex':
      args.push('-p', options.task);
      if (options.auto) {
        args.push('--auto-approve');
      }
      break;

    case 'opencode':
      args.push('-p', options.task);
      if (options.auto) {
        args.push('--auto');
      }
      break;

    default:
      throw new Error(`Unknown agent type: ${agent.type}`);
  }

  // Use spawn for real-time streaming with timeout
  return new Promise((resolve) => {
    // Debug: log the exact command being run
    if (process.env.RALPH_DEBUG) {
      console.error('\n[DEBUG] === SPAWNING AGENT ===');
      console.error('[DEBUG] Command:', agent.command);
      console.error(
        '[DEBUG] Args:',
        args.map((a) => (a.length > 100 ? a.slice(0, 100) + '...' : a))
      );
      console.error('[DEBUG] CWD:', options.cwd);
    }

    const proc = spawn(agent.command, args, {
      cwd: options.cwd,
      // stdin: 'ignore' - we don't need stdin, and leaving it as 'pipe' without closing causes hangs!
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let output = '';
    let stdoutBuffer = '';

    // Track data timing for debugging and silence warnings
    let lastDataTime = Date.now();
    let silenceWarningShown = false;

    // Warn if no data received for 30 seconds
    const silenceChecker = setInterval(() => {
      const silentMs = Date.now() - lastDataTime;
      if (silentMs > 30000 && !silenceWarningShown) {
        silenceWarningShown = true;
        console.warn('\n[WARNING] No output from agent for 30+ seconds. Claude may be:');
        console.warn('  - Processing a complex task');
        console.warn('  - Stuck/rate limited');
        console.warn('  - Waiting for something');
        console.warn('Use RALPH_DEBUG=1 for detailed output\n');
      }
    }, 5000);

    // Timeout: 5 minutes for actual work
    const timeoutMs = 300000;
    const timeout = setTimeout(() => {
      clearInterval(silenceChecker);
      if (process.env.RALPH_DEBUG) {
        console.error('[DEBUG] TIMEOUT reached after', timeoutMs, 'ms');
        console.error('[DEBUG] Output so far:', output.slice(-500));
      }
      proc.kill('SIGTERM');
      resolve({ output: output + '\nProcess timed out', exitCode: 124 });
    }, timeoutMs);

    // Process stdout line-by-line for real-time updates
    proc.stdout?.on('data', (data: Buffer) => {
      const chunk = data.toString();
      output += chunk;
      stdoutBuffer += chunk;
      lastDataTime = Date.now();
      silenceWarningShown = false; // Reset warning flag when data received

      // Debug: log data timing
      if (process.env.RALPH_DEBUG) {
        console.error('[DEBUG] Data chunk received, length:', chunk.length);
      }

      // Split into lines and process complete ones
      const lines = stdoutBuffer.split('\n');
      stdoutBuffer = lines.pop() || '';

      for (const line of lines) {
        if (line.trim()) {
          // Call onOutput callback for each line (enables progress detection)
          if (options.onOutput) {
            options.onOutput(line);
          }
          // Optionally stream to console
          if (options.streamOutput) {
            process.stdout.write(chalk.dim(line + '\n'));
          }
        }
      }
    });

    proc.stderr?.on('data', (data: Buffer) => {
      const chunk = data.toString();
      output += chunk;
      // Debug: log stderr output
      if (process.env.RALPH_DEBUG) {
        console.error('[DEBUG] STDERR:', chunk.slice(0, 200));
      }
    });

    proc.on('close', (code: number | null) => {
      clearTimeout(timeout);
      clearInterval(silenceChecker);
      // Debug: log process close
      if (process.env.RALPH_DEBUG) {
        console.error('[DEBUG] Process closed with code:', code);
        console.error('[DEBUG] Total output length:', output.length);
      }
      // Process any remaining buffer
      if (stdoutBuffer.trim()) {
        if (options.onOutput) {
          options.onOutput(stdoutBuffer);
        }
      }
      resolve({ output, exitCode: code ?? 0 });
    });

    proc.on('error', (err: Error) => {
      clearTimeout(timeout);
      clearInterval(silenceChecker);
      resolve({ output: err.message, exitCode: 1 });
    });
  });
}

export function printAgentStatus(agents: Agent[]): void {
  console.log();
  console.log(chalk.cyan.bold('Available Agents:'));
  console.log();

  for (const agent of agents) {
    const status = agent.available ? chalk.green('✓ installed') : chalk.gray('✗ not found');
    console.log(`  ${agent.name.padEnd(15)} ${status}`);
  }
  console.log();
}
