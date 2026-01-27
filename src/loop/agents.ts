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
    await execa(agent.checkCmd[0], agent.checkCmd.slice(1));
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
  let stdinInput: string | undefined;
  const env: Record<string, string | undefined> = { ...process.env };

  switch (agent.type) {
    case 'claude-code':
      // Claude Code specific flags - use structured output format
      // Pass prompt via stdin to avoid shell escaping issues with complex prompts
      args.push('--print');
      args.push('--verbose');
      args.push('--output-format', 'stream-json');
      if (options.auto) {
        args.push('--dangerously-skip-permissions');
        // Required for --dangerously-skip-permissions on some systems
        env.IS_SANDBOX = '1';
      }
      if (options.maxTurns) {
        args.push('--max-turns', String(options.maxTurns));
      }
      // Pass prompt via stdin instead of command arg
      stdinInput = options.task;
      break;

    case 'cursor':
      // Cursor agent mode
      args.push('--agent', options.task);
      break;

    case 'codex':
      // Codex specific flags
      args.push('-p', options.task);
      if (options.auto) {
        args.push('--auto-approve');
      }
      break;

    case 'opencode':
      // OpenCode specific flags
      args.push('-p', options.task);
      if (options.auto) {
        args.push('--auto');
      }
      break;

    default:
      throw new Error(`Unknown agent type: ${agent.type}`);
  }

  try {
    // Collect output while optionally streaming
    let output = '';

    const subprocess = execa(agent.command, args, {
      cwd: options.cwd,
      reject: false,
      stdout: 'pipe',
      stderr: 'pipe',
      env,
      // Pass prompt via stdin for agents that support it (e.g., Claude Code)
      input: stdinInput,
    });

    // Stream output if requested
    if (options.streamOutput || options.onOutput) {
      subprocess.stdout?.on('data', (data: Buffer) => {
        const text = data.toString();
        output += text;
        if (options.streamOutput) {
          process.stdout.write(chalk.dim(text));
        }
        if (options.onOutput) {
          // Call callback for each line
          const lines = text.split('\n').filter((l) => l.trim());
          for (const line of lines) {
            options.onOutput(line);
          }
        }
      });

      subprocess.stderr?.on('data', (data: Buffer) => {
        const text = data.toString();
        output += text;
        if (options.streamOutput) {
          process.stderr.write(chalk.dim(text));
        }
        if (options.onOutput) {
          const lines = text.split('\n').filter((l) => l.trim());
          for (const line of lines) {
            options.onOutput(line);
          }
        }
      });

      // Wait for completion
      const result = await subprocess;
      return {
        output,
        exitCode: result.exitCode ?? 0,
      };
    } else {
      // Original behavior - just capture output
      const result = await subprocess;
      return {
        output: result.stdout + result.stderr,
        exitCode: result.exitCode ?? 0,
      };
    }
  } catch (error) {
    return {
      output: error instanceof Error ? error.message : 'Unknown error',
      exitCode: 1,
    };
  }
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
