import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GitHubSource } from '../integrations/github.js';

// Mock execa
vi.mock('execa', () => ({
  execa: vi.fn(),
}));

import { execa } from 'execa';

const mockExeca = vi.mocked(execa);

describe('GitHubSource', () => {
  let source: GitHubSource;

  beforeEach(() => {
    vi.clearAllMocks();
    source = new GitHubSource();
  });

  describe('isAvailable', () => {
    it('should return true when gh CLI is available', async () => {
      mockExeca.mockResolvedValueOnce({ stdout: 'Logged in', exitCode: 0 } as any);

      const available = await source.isAvailable();

      expect(available).toBe(true);
      expect(mockExeca).toHaveBeenCalledWith('gh', ['auth', 'status']);
    });

    it('should check gh CLI first', async () => {
      mockExeca.mockRejectedValueOnce(new Error('gh not found'));

      // Even if gh is not available, the source checks gh first
      await source.isAvailable();

      expect(mockExeca).toHaveBeenCalledWith('gh', ['auth', 'status']);
    });
  });

  describe('requiresAuth', () => {
    it('should return false (gh CLI handles auth)', () => {
      expect(source.requiresAuth()).toBe(false);
    });
  });

  describe('fetch', () => {
    describe('via gh CLI', () => {
      beforeEach(() => {
        // Make gh CLI available
        mockExeca.mockResolvedValueOnce({ stdout: 'Logged in', exitCode: 0 } as any);
      });

      it('should fetch issues using gh CLI', async () => {
        const mockIssues = [
          {
            number: 1,
            title: 'Bug: Something broken',
            body: 'Description of the bug',
            state: 'open',
            labels: [{ name: 'bug' }],
          },
        ];

        mockExeca.mockResolvedValueOnce({
          stdout: JSON.stringify(mockIssues),
          exitCode: 0,
        } as any);

        const result = await source.fetch('owner/repo');

        expect(result.content).toContain('Bug: Something broken');
        expect(result.content).toContain('Description of the bug');
        expect(result.metadata?.issues).toBe(1);
      });

      it('should parse full GitHub URLs', async () => {
        mockExeca.mockResolvedValueOnce({
          stdout: '[]',
          exitCode: 0,
        } as any);

        await source.fetch('https://github.com/facebook/react');

        expect(mockExeca).toHaveBeenLastCalledWith(
          'gh',
          expect.arrayContaining(['-R', 'facebook/react'])
        );
      });

      it('should apply label filter', async () => {
        mockExeca.mockResolvedValueOnce({
          stdout: '[]',
          exitCode: 0,
        } as any);

        await source.fetch('owner/repo', { label: 'bug' });

        expect(mockExeca).toHaveBeenLastCalledWith(
          'gh',
          expect.arrayContaining(['--label', 'bug'])
        );
      });

      it('should apply status filter', async () => {
        mockExeca.mockResolvedValueOnce({
          stdout: '[]',
          exitCode: 0,
        } as any);

        await source.fetch('owner/repo', { status: 'closed' });

        expect(mockExeca).toHaveBeenLastCalledWith(
          'gh',
          expect.arrayContaining(['--state', 'closed'])
        );
      });

      it('should apply limit', async () => {
        mockExeca.mockResolvedValueOnce({
          stdout: '[]',
          exitCode: 0,
        } as any);

        await source.fetch('owner/repo', { limit: 5 });

        expect(mockExeca).toHaveBeenLastCalledWith('gh', expect.arrayContaining(['--limit', '5']));
      });

      it('should handle empty issues response', async () => {
        mockExeca.mockResolvedValueOnce({
          stdout: '[]',
          exitCode: 0,
        } as any);

        const result = await source.fetch('owner/repo');

        expect(result.content).toContain('No issues found');
        expect(result.metadata?.issues).toBe(0);
      });

      it('should format multiple issues', async () => {
        const mockIssues = [
          { number: 1, title: 'Issue 1', body: 'Body 1', state: 'open', labels: [] },
          { number: 2, title: 'Issue 2', body: 'Body 2', state: 'open', labels: [] },
        ];

        mockExeca.mockResolvedValueOnce({
          stdout: JSON.stringify(mockIssues),
          exitCode: 0,
        } as any);

        const result = await source.fetch('owner/repo');

        expect(result.content).toContain('#1: Issue 1');
        expect(result.content).toContain('#2: Issue 2');
        expect(result.metadata?.issues).toBe(2);
      });

      it('should handle issues with labels', async () => {
        const mockIssues = [
          {
            number: 1,
            title: 'Bug',
            body: 'Description',
            state: 'open',
            labels: [{ name: 'bug' }, { name: 'critical' }],
          },
        ];

        mockExeca.mockResolvedValueOnce({
          stdout: JSON.stringify(mockIssues),
          exitCode: 0,
        } as any);

        const result = await source.fetch('owner/repo');

        expect(result.content).toContain('Labels: bug, critical');
      });

      it('should handle issues without body', async () => {
        const mockIssues = [{ number: 1, title: 'No body', state: 'open', labels: [] }];

        mockExeca.mockResolvedValueOnce({
          stdout: JSON.stringify(mockIssues),
          exitCode: 0,
        } as any);

        const result = await source.fetch('owner/repo');

        expect(result.content).toContain('No description provided');
      });
    });

    describe('error handling', () => {
      it('should throw on invalid repository format', async () => {
        await expect(source.fetch('invalid')).rejects.toThrow('Invalid repository format');
      });
    });
  });

  describe('getHelp', () => {
    it('should return help text', () => {
      const help = source.getHelp();

      expect(help).toContain('github');
      expect(help).toContain('owner/repo');
      expect(help).toContain('--label');
      expect(help).toContain('--status');
    });
  });
});
