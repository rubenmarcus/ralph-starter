import { execa } from 'execa';
import { existsSync } from 'fs';
import { join } from 'path';
import chalk from 'chalk';

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
}

const AGENTS: Record<AgentType, { name: string; command: string; checkCmd: string[] }> = {
  'claude-code': {
    name: 'Claude Code',
    command: 'claude',
    checkCmd: ['claude', '--version'],
  },
  'cursor': {
    name: 'Cursor',
    command: 'cursor',
    checkCmd: ['cursor', '--version'],
  },
  'codex': {
    name: 'Codex CLI',
    command: 'codex',
    checkCmd: ['codex', '--version'],
  },
  'opencode': {
    name: 'OpenCode',
    command: 'opencode',
    checkCmd: ['opencode', '--version'],
  },
  'unknown': {
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
  const available = agents.filter(a => a.available);

  if (available.length === 0) return null;

  // Prefer Claude Code, then others
  const preferred = ['claude-code', 'cursor', 'codex', 'opencode'];
  for (const type of preferred) {
    const agent = available.find(a => a.type === type);
    if (agent) return agent;
  }

  return available[0];
}

export async function runAgent(agent: Agent, options: AgentRunOptions): Promise<{ output: string; exitCode: number }> {
  const args: string[] = [];

  switch (agent.type) {
    case 'claude-code':
      // Claude Code specific flags
      args.push('-p', options.task);
      if (options.auto) {
        args.push('--dangerously-skip-permissions');
      }
      if (options.maxTurns) {
        args.push('--max-turns', String(options.maxTurns));
      }
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
    const result = await execa(agent.command, args, {
      cwd: options.cwd,
      stdio: 'pipe',
      reject: false,
    });

    return {
      output: result.stdout + result.stderr,
      exitCode: result.exitCode ?? 0,
    };
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
    const status = agent.available
      ? chalk.green('✓ installed')
      : chalk.gray('✗ not found');
    console.log(`  ${agent.name.padEnd(15)} ${status}`);
  }
  console.log();
}
