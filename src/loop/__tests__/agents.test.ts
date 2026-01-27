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

import { execa } from 'execa';

const mockExeca = vi.mocked(execa);

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
      expect(mockExeca).toHaveBeenCalledWith('claude', ['--version']);
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
      mockExeca.mockResolvedValueOnce({
        stdout: 'Task completed',
        stderr: '',
        exitCode: 0,
      } as any);

      const result = await runAgent(mockAgent, {
        task: 'Fix the bug',
        cwd: '/test/dir',
      });

      // Claude Code uses --print, --verbose, --output-format stream-json
      // and passes prompt via stdin (input option)
      expect(mockExeca).toHaveBeenCalledWith(
        'claude',
        expect.arrayContaining(['--print', '--verbose', '--output-format', 'stream-json']),
        expect.objectContaining({
          input: 'Fix the bug',
        })
      );
      expect(result.output).toContain('Task completed');
      expect(result.exitCode).toBe(0);
    });

    it('should add auto flag when specified', async () => {
      mockExeca.mockResolvedValueOnce({
        stdout: '',
        stderr: '',
        exitCode: 0,
      } as any);

      await runAgent(mockAgent, {
        task: 'Task',
        cwd: '/test',
        auto: true,
      });

      expect(mockExeca).toHaveBeenCalledWith(
        'claude',
        expect.arrayContaining(['--dangerously-skip-permissions']),
        expect.any(Object)
      );
    });

    it('should add max-turns flag when specified', async () => {
      mockExeca.mockResolvedValueOnce({
        stdout: '',
        stderr: '',
        exitCode: 0,
      } as any);

      await runAgent(mockAgent, {
        task: 'Task',
        cwd: '/test',
        maxTurns: 10,
      });

      expect(mockExeca).toHaveBeenCalledWith(
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

      mockExeca.mockResolvedValueOnce({
        stdout: '',
        stderr: '',
        exitCode: 0,
      } as any);

      await runAgent(cursorAgent, {
        task: 'Task',
        cwd: '/test',
      });

      expect(mockExeca).toHaveBeenCalledWith('cursor', ['--agent', 'Task'], expect.any(Object));
    });

    it('should handle codex agent arguments', async () => {
      const codexAgent: Agent = {
        type: 'codex',
        name: 'Codex CLI',
        command: 'codex',
        available: true,
      };

      mockExeca.mockResolvedValueOnce({
        stdout: '',
        stderr: '',
        exitCode: 0,
      } as any);

      await runAgent(codexAgent, {
        task: 'Task',
        cwd: '/test',
        auto: true,
      });

      expect(mockExeca).toHaveBeenCalledWith(
        'codex',
        expect.arrayContaining(['-p', 'Task', '--auto-approve']),
        expect.any(Object)
      );
    });

    it('should handle execution errors', async () => {
      mockExeca.mockRejectedValueOnce(new Error('Command failed'));

      const result = await runAgent(mockAgent, {
        task: 'Task',
        cwd: '/test',
      });

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
