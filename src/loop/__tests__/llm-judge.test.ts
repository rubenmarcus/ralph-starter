import { existsSync, readFileSync } from 'node:fs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  formatJudgeFeedback,
  type JudgeCriterion,
  type JudgmentResult,
  loadJudgeConfig,
  quickEvaluate,
  runLLMJudge,
} from '../llm-judge.js';

// Mock fs
vi.mock('node:fs', () => ({
  existsSync: vi.fn(),
  readFileSync: vi.fn(),
}));

// Mock LLM API
vi.mock('../../llm/api.js', () => ({
  tryCallLLM: vi.fn(),
}));

import { tryCallLLM } from '../../llm/api.js';

const mockExistsSync = vi.mocked(existsSync);
const mockReadFileSync = vi.mocked(readFileSync);
const mockTryCallLLM = vi.mocked(tryCallLLM);

describe('llm-judge', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('loadJudgeConfig', () => {
    it('should return null when no config exists', () => {
      mockExistsSync.mockReturnValue(false);

      const config = loadJudgeConfig('/test/dir');

      expect(config).toBeNull();
    });

    it('should parse criteria from AGENTS.md', () => {
      mockExistsSync.mockImplementation((path: any) => path.toString().includes('AGENTS.md'));
      mockReadFileSync.mockReturnValue(`
# Project

## LLM Judge
- code-quality
- readability (7)
- error-handling
      `);

      const config = loadJudgeConfig('/test/dir');

      expect(config).not.toBeNull();
      expect(config?.enabled).toBe(true);
      expect(config?.criteria).toHaveLength(3);
      expect(config?.criteria?.[0].type).toBe('code-quality');
      expect(config?.criteria?.[1].type).toBe('readability');
      expect(config?.criteria?.[1].threshold).toBe(7);
    });

    it('should parse custom criteria from AGENTS.md', () => {
      mockExistsSync.mockImplementation((path: any) => path.toString().includes('AGENTS.md'));
      mockReadFileSync.mockReturnValue(`
## LLM Judge
- custom: "Follow TypeScript best practices" (8)
- code-quality
      `);

      const config = loadJudgeConfig('/test/dir');

      expect(config?.criteria).toHaveLength(2);
      // Standard criteria are parsed first, then custom
      expect(config?.criteria?.[0].type).toBe('code-quality');
      expect(config?.criteria?.[1].type).toBe('custom');
      expect(config?.criteria?.[1].description).toBe('Follow TypeScript best practices');
      expect(config?.criteria?.[1].threshold).toBe(8);
    });

    it('should parse files pattern from AGENTS.md', () => {
      mockExistsSync.mockImplementation((path: any) => path.toString().includes('AGENTS.md'));
      mockReadFileSync.mockReturnValue(`
## LLM Judge
- code-quality
files: \`src/**/*.ts\`
      `);

      const config = loadJudgeConfig('/test/dir');

      expect(config?.files).toEqual(['src/**/*.ts']);
    });

    it('should load from ralph config file', () => {
      mockExistsSync.mockImplementation((path: any) => path.toString().includes('config.json'));
      mockReadFileSync.mockReturnValue(
        JSON.stringify({
          llmJudge: {
            criteria: [{ type: 'security', description: 'Security review' }],
            files: ['src/auth/*.ts'],
          },
        })
      );

      const config = loadJudgeConfig('/test/dir');

      expect(config?.enabled).toBe(true);
      expect(config?.criteria?.[0].type).toBe('security');
      expect(config?.files).toEqual(['src/auth/*.ts']);
    });

    it('should return null for AGENTS.md without LLM Judge section', () => {
      mockExistsSync.mockImplementation((path: any) => path.toString().includes('AGENTS.md'));
      mockReadFileSync.mockReturnValue(`
# Project

## Commands
- test: npm test
      `);

      const config = loadJudgeConfig('/test/dir');

      expect(config).toBeNull();
    });
  });

  describe('runLLMJudge', () => {
    it('should return passed result when disabled', async () => {
      const result = await runLLMJudge('/test/dir', { enabled: false });

      expect(result.passed).toBe(true);
      expect(result.overallScore).toBe(10);
      expect(result.results).toHaveLength(0);
    });

    it('should return passed result when no files to evaluate', async () => {
      const result = await runLLMJudge('/test/dir', {
        enabled: true,
        criteria: [{ type: 'code-quality', description: 'Code quality' }],
      });

      expect(result.passed).toBe(true);
      expect(result.filesEvaluated).toHaveLength(0);
    });

    it('should evaluate files with criteria', async () => {
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue('const x = 1;');
      mockTryCallLLM.mockResolvedValue({
        content: JSON.stringify({
          score: 8,
          explanation: 'Good code quality',
          suggestions: ['Add type annotation'],
        }),
        model: 'test-model',
        provider: 'anthropic',
      });

      const result = await runLLMJudge('/test/dir', {
        enabled: true,
        criteria: [{ type: 'code-quality', description: 'Code quality' }],
        files: ['test.ts'],
      });

      expect(result.passed).toBe(true);
      expect(result.filesEvaluated).toContain('test.ts');
      expect(result.results).toHaveLength(1);
      expect(result.results[0].score).toBe(8);
      expect(result.results[0].passed).toBe(true);
    });

    it('should fail when score below threshold', async () => {
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue('const x = 1;');
      mockTryCallLLM.mockResolvedValue({
        content: JSON.stringify({
          score: 4,
          explanation: 'Needs improvement',
          suggestions: ['Refactor code'],
        }),
        model: 'test-model',
        provider: 'anthropic',
      });

      const result = await runLLMJudge('/test/dir', {
        enabled: true,
        criteria: [{ type: 'code-quality', description: 'Code quality', threshold: 6 }],
        files: ['test.ts'],
      });

      expect(result.passed).toBe(false);
      expect(result.results[0].score).toBe(4);
      expect(result.results[0].passed).toBe(false);
    });

    it('should handle LLM API failure gracefully', async () => {
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue('const x = 1;');
      mockTryCallLLM.mockResolvedValue(null);

      const result = await runLLMJudge('/test/dir', {
        enabled: true,
        criteria: [{ type: 'code-quality', description: 'Code quality' }],
        files: ['test.ts'],
      });

      expect(result.passed).toBe(false);
      expect(result.results[0].score).toBe(0);
      expect(result.results[0].explanation).toContain('Failed to get LLM response');
    });

    it('should calculate weighted average score', async () => {
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue('const x = 1;');

      let callCount = 0;
      mockTryCallLLM.mockImplementation(async () => {
        callCount++;
        const score = callCount === 1 ? 10 : 6;
        return {
          content: JSON.stringify({ score, explanation: 'Test' }),
          model: 'test-model',
          provider: 'anthropic' as const,
        };
      });

      const result = await runLLMJudge('/test/dir', {
        enabled: true,
        criteria: [
          { type: 'code-quality', description: 'Code quality', weight: 10 },
          { type: 'readability', description: 'Readability', weight: 5 },
        ],
        files: ['test.ts'],
      });

      // Weighted average: (10*10 + 6*5) / (10+5) = 130/15 = 8.67
      expect(result.overallScore).toBeCloseTo(8.7, 1);
    });

    it('should use default criteria when none specified', async () => {
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue('const x = 1;');
      mockTryCallLLM.mockResolvedValue({
        content: JSON.stringify({ score: 7, explanation: 'Good' }),
        model: 'test-model',
        provider: 'anthropic',
      });

      const result = await runLLMJudge('/test/dir', {
        enabled: true,
        files: ['test.ts'],
      });

      // Default criteria: code-quality, readability
      expect(result.results.length).toBe(2);
    });
  });

  describe('formatJudgeFeedback', () => {
    it('should format passed result', () => {
      const result: JudgmentResult = {
        passed: true,
        overallScore: 8.5,
        results: [
          {
            criterion: { type: 'code-quality', description: 'Code quality' },
            score: 8.5,
            passed: true,
            explanation: 'Good code quality overall',
          },
        ],
        filesEvaluated: ['test.ts'],
        timestamp: '2024-01-01T00:00:00.000Z',
      };

      const feedback = formatJudgeFeedback(result);

      expect(feedback).toContain('✅ Overall Score: 8.5/10 - PASSED');
      expect(feedback).toContain('Code quality');
      expect(feedback).toContain('8.5/10');
      expect(feedback).toContain('test.ts');
    });

    it('should format failed result with suggestions', () => {
      const result: JudgmentResult = {
        passed: false,
        overallScore: 4.5,
        results: [
          {
            criterion: {
              type: 'code-quality',
              description: 'Code quality',
              threshold: 6,
            },
            score: 4.5,
            passed: false,
            explanation: 'Needs improvement',
            suggestions: ['Add error handling', 'Use TypeScript strict mode'],
          },
        ],
        filesEvaluated: ['test.ts'],
        timestamp: '2024-01-01T00:00:00.000Z',
      };

      const feedback = formatJudgeFeedback(result);

      expect(feedback).toContain('❌ Overall Score: 4.5/10 - NEEDS IMPROVEMENT');
      expect(feedback).toContain('threshold: 6');
      expect(feedback).toContain('Add error handling');
      expect(feedback).toContain('Use TypeScript strict mode');
      expect(feedback).toContain('Please address the above issues');
    });

    it('should handle empty files list', () => {
      const result: JudgmentResult = {
        passed: true,
        overallScore: 10,
        results: [],
        filesEvaluated: [],
        timestamp: '2024-01-01T00:00:00.000Z',
      };

      const feedback = formatJudgeFeedback(result);

      expect(feedback).toContain('No files evaluated');
    });
  });

  describe('quickEvaluate', () => {
    it('should evaluate code with default criteria', async () => {
      mockTryCallLLM.mockResolvedValue({
        content: JSON.stringify({
          score: 7,
          explanation: 'Decent code',
          suggestions: ['Minor improvements possible'],
        }),
        model: 'test-model',
        provider: 'anthropic',
      });

      const result = await quickEvaluate('const x: number = 1;');

      expect(result.score).toBe(7);
      expect(result.passed).toBe(true);
      expect(result.feedback).toContain('code quality');
    });

    it('should evaluate code with specific criteria', async () => {
      mockTryCallLLM.mockResolvedValue({
        content: JSON.stringify({
          score: 9,
          explanation: 'Excellent security practices',
        }),
        model: 'test-model',
        provider: 'anthropic',
      });

      const result = await quickEvaluate('validate(input)', ['security']);

      expect(result.score).toBe(9);
      expect(result.passed).toBe(true);
      expect(result.feedback).toContain('security');
    });

    it('should fail when score below threshold', async () => {
      mockTryCallLLM.mockResolvedValue({
        content: JSON.stringify({
          score: 4,
          explanation: 'Poor quality',
        }),
        model: 'test-model',
        provider: 'anthropic',
      });

      const result = await quickEvaluate('var x = 1');

      expect(result.score).toBe(4);
      expect(result.passed).toBe(false);
    });
  });
});
