import { existsSync, readFileSync } from 'node:fs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  detectValidationCommands,
  formatValidationFeedback,
  runAllValidations,
  runValidation,
  type ValidationCommand,
  type ValidationResult,
} from '../validation.js';

// Mock fs
vi.mock('fs', () => ({
  existsSync: vi.fn(),
  readFileSync: vi.fn(),
}));

// Mock execa
vi.mock('execa', () => ({
  execa: vi.fn(),
}));

import { execa } from 'execa';

const mockExistsSync = vi.mocked(existsSync);
const mockReadFileSync = vi.mocked(readFileSync);
const mockExeca = vi.mocked(execa);

describe('validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('detectValidationCommands', () => {
    it('should return empty array when no config files exist', () => {
      mockExistsSync.mockReturnValue(false);

      const commands = detectValidationCommands('/test/dir');

      expect(commands).toHaveLength(0);
    });

    it('should detect commands from AGENTS.md', () => {
      mockExistsSync.mockImplementation((path: any) => path.toString().includes('AGENTS.md'));
      mockReadFileSync.mockReturnValue(`
# Project Commands

- **Test**: \`npm test\`
- **Lint**: \`npm run lint\`
- **Build**: \`npm run build\`
      `);

      const commands = detectValidationCommands('/test/dir');

      expect(commands).toHaveLength(3);
      expect(commands.find((c) => c.name === 'test')).toBeDefined();
      expect(commands.find((c) => c.name === 'lint')).toBeDefined();
      expect(commands.find((c) => c.name === 'build')).toBeDefined();
    });

    it('should parse command with arguments from AGENTS.md', () => {
      mockExistsSync.mockImplementation((path: any) => path.toString().includes('AGENTS.md'));
      mockReadFileSync.mockReturnValue('- test: `pytest -x --verbose`');

      const commands = detectValidationCommands('/test/dir');

      expect(commands[0]).toEqual({
        name: 'test',
        command: 'pytest',
        args: ['-x', '--verbose'],
      });
    });

    it('should fallback to package.json when no AGENTS.md', () => {
      mockExistsSync.mockImplementation((path: any) => path.toString().includes('package.json'));
      mockReadFileSync.mockReturnValue(
        JSON.stringify({
          scripts: {
            test: 'vitest',
            lint: 'eslint .',
            build: 'tsc',
          },
        })
      );

      const commands = detectValidationCommands('/test/dir');

      expect(commands).toHaveLength(3);
      expect(commands.find((c) => c.name === 'test')).toEqual({
        name: 'test',
        command: 'npm',
        args: ['run', 'test'],
      });
    });

    it('should skip default npm test error message', () => {
      mockExistsSync.mockImplementation((path: any) => path.toString().includes('package.json'));
      mockReadFileSync.mockReturnValue(
        JSON.stringify({
          scripts: {
            test: 'echo "Error: no test specified" && exit 1',
            lint: 'eslint .',
          },
        })
      );

      const commands = detectValidationCommands('/test/dir');

      expect(commands.find((c) => c.name === 'test')).toBeUndefined();
      expect(commands.find((c) => c.name === 'lint')).toBeDefined();
    });

    it('should detect typecheck script', () => {
      mockExistsSync.mockImplementation((path: any) => path.toString().includes('package.json'));
      mockReadFileSync.mockReturnValue(
        JSON.stringify({
          scripts: {
            typecheck: 'tsc --noEmit',
          },
        })
      );

      const commands = detectValidationCommands('/test/dir');

      expect(commands.find((c) => c.name === 'typecheck')).toBeDefined();
    });

    it('should handle invalid package.json', () => {
      mockExistsSync.mockImplementation((path: any) => path.toString().includes('package.json'));
      mockReadFileSync.mockReturnValue('not valid json');

      const commands = detectValidationCommands('/test/dir');

      expect(commands).toHaveLength(0);
    });
  });

  describe('runValidation', () => {
    it('should return success when command exits with 0', async () => {
      mockExeca.mockResolvedValueOnce({
        exitCode: 0,
        stdout: 'All tests passed',
        stderr: '',
      } as any);

      const command: ValidationCommand = {
        name: 'test',
        command: 'npm',
        args: ['test'],
      };

      const result = await runValidation('/test/dir', command);

      expect(result.success).toBe(true);
      expect(result.output).toBe('All tests passed');
    });

    it('should return failure when command exits with non-zero', async () => {
      mockExeca.mockResolvedValueOnce({
        exitCode: 1,
        stdout: '',
        stderr: 'Test failed: Expected 1 but got 2',
      } as any);

      const command: ValidationCommand = {
        name: 'test',
        command: 'npm',
        args: ['test'],
      };

      const result = await runValidation('/test/dir', command);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Test failed');
    });

    it('should handle command execution errors', async () => {
      mockExeca.mockRejectedValueOnce(new Error('Command not found: npm'));

      const command: ValidationCommand = {
        name: 'test',
        command: 'npm',
        args: ['test'],
      };

      const result = await runValidation('/test/dir', command);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Command not found');
    });

    it('should use stdout as error when stderr is empty', async () => {
      mockExeca.mockResolvedValueOnce({
        exitCode: 1,
        stdout: 'Error in stdout',
        stderr: '',
      } as any);

      const command: ValidationCommand = {
        name: 'test',
        command: 'npm',
        args: ['test'],
      };

      const result = await runValidation('/test/dir', command);

      expect(result.error).toBe('Error in stdout');
    });
  });

  describe('runAllValidations', () => {
    it('should run all commands when all pass', async () => {
      mockExeca.mockResolvedValue({
        exitCode: 0,
        stdout: 'Passed',
        stderr: '',
      } as any);

      const commands: ValidationCommand[] = [
        { name: 'test', command: 'npm', args: ['test'] },
        { name: 'lint', command: 'npm', args: ['run', 'lint'] },
        { name: 'build', command: 'npm', args: ['run', 'build'] },
      ];

      const results = await runAllValidations('/test/dir', commands);

      expect(results).toHaveLength(3);
      expect(results.every((r) => r.success)).toBe(true);
    });

    it('should run all commands even when some fail', async () => {
      mockExeca
        .mockResolvedValueOnce({ exitCode: 0, stdout: 'Passed', stderr: '' } as any)
        .mockResolvedValueOnce({ exitCode: 1, stdout: '', stderr: 'Failed' } as any)
        .mockResolvedValueOnce({ exitCode: 0, stdout: 'Passed', stderr: '' } as any);

      const commands: ValidationCommand[] = [
        { name: 'test', command: 'npm', args: ['test'] },
        { name: 'lint', command: 'npm', args: ['run', 'lint'] },
        { name: 'build', command: 'npm', args: ['run', 'build'] },
      ];

      const results = await runAllValidations('/test/dir', commands);

      expect(results).toHaveLength(3); // All commands run
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(false);
      expect(results[2].success).toBe(true);
    });

    it('should handle empty command list', async () => {
      const results = await runAllValidations('/test/dir', []);

      expect(results).toHaveLength(0);
    });
  });

  describe('formatValidationFeedback', () => {
    it('should return empty string when all validations pass', () => {
      const results: ValidationResult[] = [
        { success: true, command: 'npm test', output: 'Passed' },
        { success: true, command: 'npm run lint', output: 'No issues' },
      ];

      const feedback = formatValidationFeedback(results);

      expect(feedback).toBe('');
    });

    it('should format failed validation as feedback', () => {
      const results: ValidationResult[] = [
        { success: true, command: 'npm test', output: 'Passed' },
        {
          success: false,
          command: 'npm run lint',
          output: '',
          error: 'src/index.ts:10:5 - Unexpected any',
        },
      ];

      const feedback = formatValidationFeedback(results);

      expect(feedback).toContain('## Validation Failed');
      expect(feedback).toContain('npm run lint');
      expect(feedback).toContain('Unexpected any');
      expect(feedback).toContain('Please fix the above issues');
    });

    it('should include multiple failures', () => {
      const results: ValidationResult[] = [
        { success: false, command: 'npm test', output: '', error: 'Test 1 failed' },
        { success: false, command: 'npm run lint', output: '', error: 'Lint error' },
      ];

      const feedback = formatValidationFeedback(results);

      expect(feedback).toContain('Test 1 failed');
      expect(feedback).toContain('Lint error');
    });

    it('should use output when error is empty', () => {
      const results: ValidationResult[] = [
        { success: false, command: 'npm test', output: 'Output error', error: '' },
      ];

      const feedback = formatValidationFeedback(results);

      expect(feedback).toContain('Output error');
    });
  });
});
