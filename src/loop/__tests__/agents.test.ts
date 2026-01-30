import { spawn } from 'node:child_process';
import { EventEmitter } from 'node:events';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  type Agent,
  checkAgentAvailable,
  detectAvailableAgents,
  detectBestAgent,
  runAgent,
} from '../agents.js';

// Mock execa
vi.mock('execa', () => ({
  execa: vi.fn(),
}));

// Mock spawn from node:child_process
vi.mock('node:child_process', () => ({
  spawn: vi.fn(),
}));

import { execa } from 'execa';

const mockExeca = vi.mocked(execa);
const mockSpawn = vi.mocked(spawn);

// Helper to create a mock child process
function createMockChildProcess(exitCode: number, stdout = '', stderr = '') {
  const proc = new EventEmitter();
  const stdoutEmitter = new EventEmitter();
  const stderrEmitter = new EventEmitter();

  (proc as any).stdout = stdoutEmitter;
  (proc as any).stderr = stderrEmitter;
  (proc as any).kill = vi.fn();

  // Schedule emitting data and close
  setTimeout(() => {
    if (stdout) {
      stdoutEmitter.emit('data', Buffer.from(stdout));
    }
    if (stderr) {
      stderrEmitter.emit('data', Buffer.from(stderr));
    }
    proc.emit('close', exitCode);
  }, 0);

  return proc;
}

describe('agents', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('checkAgentAvailable', () => {
    it('should return false for unknown agent type', async () => {
      const result = await checkAgentAvailable('unknown');
      expect(result).toBe(false);
    });

    it('should return true when agent command succeeds', async () => {
      mockExeca.mockResolvedValueOnce({
        stdout: '1.0.0',
        stderr: '',
        exitCode: 0,
      } as any);

      const result = await checkAgentAvailable('claude-code');
      expect(result).toBe(true);
      expect(mockExeca).toHaveBeenCalledWith('claude', ['--version'], { timeout: 5000 });
    });

    it('should return false when agent command fails', async () => {
      mockExeca.mockRejectedValueOnce(new Error('Command not found'));

      const result = await checkAgentAvailable('claude-code');
      expect(result).toBe(false);
    });
  });

  describe('detectAvailableAgents', () => {
    it('should return all agents with availability status', async () => {
      // Mock claude-code available, others not
      mockExeca
        .mockResolvedValueOnce({ stdout: '1.0.0', exitCode: 0 } as any) // claude-code
        .mockRejectedValueOnce(new Error('not found')) // cursor
        .mockRejectedValueOnce(new Error('not found')) // codex
        .mockRejectedValueOnce(new Error('not found')); // opencode

      const agents = await detectAvailableAgents();

      expect(agents).toHaveLength(4);
      expect(agents.find((a) => a.type === 'claude-code')?.available).toBe(true);
      expect(agents.find((a) => a.type === 'cursor')?.available).toBe(false);
    });

    it('should not include unknown agent type', async () => {
      mockExeca.mockRejectedValue(new Error('not found'));

      const agents = await detectAvailableAgents();

      expect(agents.find((a) => a.type === 'unknown')).toBeUndefined();
    });
  });

  describe('detectBestAgent', () => {
    it('should return null when no agents are available', async () => {
      mockExeca.mockRejectedValue(new Error('not found'));

      const agent = await detectBestAgent();
      expect(agent).toBeNull();
    });

    it('should prefer claude-code over others', async () => {
      // All agents available
      mockExeca.mockResolvedValue({ stdout: '1.0.0', exitCode: 0 } as any);

      const agent = await detectBestAgent();
      expect(agent?.type).toBe('claude-code');
    });

    it('should fall back to cursor if claude-code is not available', async () => {
      mockExeca
        .mockRejectedValueOnce(new Error('not found')) // claude-code
        .mockResolvedValueOnce({ stdout: '1.0.0', exitCode: 0 } as any) // cursor
        .mockRejectedValueOnce(new Error('not found')) // codex
        .mockRejectedValueOnce(new Error('not found')); // opencode

      const agent = await detectBestAgent();
      expect(agent?.type).toBe('cursor');
    });
  });

  describe('runAgent', () => {
    const mockAgent: Agent = {
      type: 'claude-code',
      name: 'Claude Code',
      command: 'claude',
      available: true,
    };

    it('should run claude-code with correct arguments', async () => {
      mockSpawn.mockReturnValueOnce(createMockChildProcess(0, 'Task completed\n') as any);

      const result = await runAgent(mockAgent, {
        task: 'Fix the bug',
        cwd: '/test/dir',
      });

      // Claude Code uses -p for prompt, --verbose, --output-format stream-json
      expect(mockSpawn).toHaveBeenCalledWith(
        'claude',
        expect.arrayContaining([
          '-p',
          'Fix the bug',
          '--verbose',
          '--output-format',
          'stream-json',
        ]),
        expect.objectContaining({
          cwd: '/test/dir',
        })
      );
      expect(result.output).toContain('Task completed');
      expect(result.exitCode).toBe(0);
    });

    it('should add auto flag when specified', async () => {
      mockSpawn.mockReturnValueOnce(createMockChildProcess(0) as any);

      await runAgent(mockAgent, {
        task: 'Task',
        cwd: '/test',
        auto: true,
      });

      expect(mockSpawn).toHaveBeenCalledWith(
        'claude',
        expect.arrayContaining(['--dangerously-skip-permissions']),
        expect.any(Object)
      );
    });

    it('should add max-turns flag when specified', async () => {
      mockSpawn.mockReturnValueOnce(createMockChildProcess(0) as any);

      await runAgent(mockAgent, {
        task: 'Task',
        cwd: '/test',
        maxTurns: 10,
      });

      expect(mockSpawn).toHaveBeenCalledWith(
        'claude',
        expect.arrayContaining(['--max-turns', '10']),
        expect.any(Object)
      );
    });

    it('should handle cursor agent arguments', async () => {
      const cursorAgent: Agent = {
        type: 'cursor',
        name: 'Cursor',
        command: 'cursor',
        available: true,
      };

      mockSpawn.mockReturnValueOnce(createMockChildProcess(0) as any);

      await runAgent(cursorAgent, {
        task: 'Task',
        cwd: '/test',
      });

      expect(mockSpawn).toHaveBeenCalledWith('cursor', ['--agent', 'Task'], expect.any(Object));
    });

    it('should handle codex agent arguments', async () => {
      const codexAgent: Agent = {
        type: 'codex',
        name: 'Codex CLI',
        command: 'codex',
        available: true,
      };

      mockSpawn.mockReturnValueOnce(createMockChildProcess(0) as any);

      await runAgent(codexAgent, {
        task: 'Task',
        cwd: '/test',
        auto: true,
      });

      expect(mockSpawn).toHaveBeenCalledWith(
        'codex',
        expect.arrayContaining(['-p', 'Task', '--auto-approve']),
        expect.any(Object)
      );
    });

    it('should handle execution errors', async () => {
      // Create a mock process that emits an error
      const proc = new EventEmitter();
      const stdoutEmitter = new EventEmitter();
      const stderrEmitter = new EventEmitter();
      (proc as any).stdout = stdoutEmitter;
      (proc as any).stderr = stderrEmitter;
      (proc as any).kill = vi.fn();

      mockSpawn.mockReturnValueOnce(proc as any);

      const resultPromise = runAgent(mockAgent, {
        task: 'Task',
        cwd: '/test',
      });

      // Emit error after a short delay
      setTimeout(() => {
        proc.emit('error', new Error('Command failed'));
      }, 0);

      const result = await resultPromise;

      expect(result.exitCode).toBe(1);
      expect(result.output).toContain('Command failed');
    });

    it('should throw error for unknown agent type', async () => {
      const unknownAgent: Agent = {
        type: 'unknown',
        name: 'Unknown',
        command: '',
        available: false,
      };

      await expect(runAgent(unknownAgent, { task: 'Task', cwd: '/test' })).rejects.toThrow(
        'Unknown agent type'
      );
    });
  });
});
