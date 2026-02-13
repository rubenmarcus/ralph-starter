import { beforeEach, describe, expect, it } from 'vitest';
import {
  CostTracker,
  calculateCost,
  estimateTokens,
  formatCost,
  formatTokens,
  MODEL_PRICING,
} from '../cost-tracker.js';

describe('cost-tracker', () => {
  describe('estimateTokens', () => {
    it('should return 0 for empty string', () => {
      expect(estimateTokens('')).toBe(0);
    });

    it('should estimate tokens for regular text', () => {
      const text = 'Hello, this is a test sentence.';
      const tokens = estimateTokens(text);
      // ~4 chars per token for prose
      expect(tokens).toBeGreaterThan(0);
      expect(tokens).toBeLessThan(text.length);
    });

    it('should estimate more tokens for code', () => {
      const code = 'const foo = async () => { await bar(); }';
      const prose = 'The quick brown fox jumps over the lazy dog.';

      const codeTokens = estimateTokens(code);
      const proseTokens = estimateTokens(prose);

      // Code should have more tokens per character
      const codeRatio = code.length / codeTokens;
      const proseRatio = prose.length / proseTokens;
      expect(codeRatio).toBeLessThanOrEqual(proseRatio);
    });

    it('should detect code patterns', () => {
      const codeExamples = [
        'function test() {}',
        'const x = 1',
        'import foo from "bar"',
        'export default class Foo',
        '```typescript\ncode\n```',
        'async function getData() { await fetch(); }',
      ];

      for (const code of codeExamples) {
        const tokens = estimateTokens(code);
        expect(tokens).toBeGreaterThan(0);
      }
    });
  });

  describe('calculateCost', () => {
    it('should calculate cost correctly', () => {
      const tokens = {
        inputTokens: 1000000, // 1M tokens
        outputTokens: 500000,
        totalTokens: 1500000,
      };

      const pricing = MODEL_PRICING['claude-3-sonnet'];
      const cost = calculateCost(tokens, pricing);

      expect(cost.inputCost).toBe(3); // 1M * $3/M
      expect(cost.outputCost).toBe(7.5); // 0.5M * $15/M
      expect(cost.totalCost).toBe(10.5);
    });

    it('should handle small token counts', () => {
      const tokens = {
        inputTokens: 100,
        outputTokens: 50,
        totalTokens: 150,
      };

      const pricing = MODEL_PRICING['claude-3-sonnet'];
      const cost = calculateCost(tokens, pricing);

      expect(cost.totalCost).toBeLessThan(0.01);
      expect(cost.totalCost).toBeGreaterThan(0);
    });
  });

  describe('formatCost', () => {
    it('should format very small costs in cents', () => {
      expect(formatCost(0.005)).toContain('¢');
    });

    it('should format small costs with 3 decimal places', () => {
      const formatted = formatCost(0.123);
      expect(formatted).toBe('$0.123');
    });

    it('should format large costs with 2 decimal places', () => {
      const formatted = formatCost(12.345);
      expect(formatted).toBe('$12.35');
    });
  });

  describe('formatTokens', () => {
    it('should format small numbers without suffix', () => {
      expect(formatTokens(500)).toBe('500');
    });

    it('should format thousands with K suffix', () => {
      expect(formatTokens(1500)).toBe('1.5K');
    });

    it('should format millions with M suffix', () => {
      expect(formatTokens(1500000)).toBe('1.50M');
    });
  });

  describe('CostTracker', () => {
    let tracker: CostTracker;

    beforeEach(() => {
      tracker = new CostTracker({ model: 'claude-3-sonnet' });
    });

    describe('recordIteration', () => {
      it('should record iteration with token estimates', () => {
        const input = 'This is the input prompt';
        const output = 'This is the output response';

        const cost = tracker.recordIteration(input, output);

        expect(cost.iteration).toBe(1);
        expect(cost.tokens.inputTokens).toBeGreaterThan(0);
        expect(cost.tokens.outputTokens).toBeGreaterThan(0);
        expect(cost.cost.totalCost).toBeGreaterThan(0);
      });

      it('should increment iteration count', () => {
        tracker.recordIteration('input 1', 'output 1');
        tracker.recordIteration('input 2', 'output 2');
        tracker.recordIteration('input 3', 'output 3');

        const stats = tracker.getStats();
        expect(stats.totalIterations).toBe(3);
      });
    });

    describe('getStats', () => {
      it('should return zero stats when no iterations', () => {
        const stats = tracker.getStats();

        expect(stats.totalIterations).toBe(0);
        expect(stats.totalTokens.totalTokens).toBe(0);
        expect(stats.totalCost.totalCost).toBe(0);
      });

      it('should calculate totals correctly', () => {
        tracker.recordIteration('input 1', 'output 1');
        tracker.recordIteration('input 2', 'output 2');

        const stats = tracker.getStats();

        expect(stats.totalIterations).toBe(2);
        expect(stats.totalTokens.totalTokens).toBeGreaterThan(0);
        expect(stats.avgTokensPerIteration.totalTokens).toBeGreaterThan(0);
      });

      it('should calculate averages correctly', () => {
        tracker.recordIteration('input', 'output');
        tracker.recordIteration('input', 'output');
        tracker.recordIteration('input', 'output');

        const stats = tracker.getStats();

        expect(stats.avgCostPerIteration.totalCost).toBeCloseTo(stats.totalCost.totalCost / 3, 5);
      });

      it('should calculate projected cost when maxIterations is set', () => {
        const trackerWithMax = new CostTracker({
          model: 'claude-3-sonnet',
          maxIterations: 10,
        });

        // Need at least 3 iterations for projection
        trackerWithMax.recordIteration('input', 'output');
        trackerWithMax.recordIteration('input', 'output');
        trackerWithMax.recordIteration('input', 'output');

        const stats = trackerWithMax.getStats();

        expect(stats.projectedCost).toBeDefined();
        expect(stats.projectedCost?.totalCost).toBeGreaterThan(stats.totalCost.totalCost);
      });
    });

    describe('formatStats', () => {
      it('should return message when no iterations', () => {
        const formatted = tracker.formatStats();
        expect(formatted).toBe('No iterations recorded');
      });

      it('should format stats with tokens and cost', () => {
        tracker.recordIteration('input', 'output');

        const formatted = tracker.formatStats();

        expect(formatted).toContain('Tokens:');
        expect(formatted).toContain('Cost:');
      });
    });

    describe('getLastIterationCost', () => {
      it('should return undefined when no iterations', () => {
        expect(tracker.getLastIterationCost()).toBeUndefined();
      });

      it('should return the last iteration', () => {
        tracker.recordIteration('input 1', 'output 1');
        tracker.recordIteration('input 2', 'output 2');

        const last = tracker.getLastIterationCost();
        expect(last?.iteration).toBe(2);
      });
    });

    describe('reset', () => {
      it('should clear all iterations', () => {
        tracker.recordIteration('input', 'output');
        tracker.recordIteration('input', 'output');

        tracker.reset();

        const stats = tracker.getStats();
        expect(stats.totalIterations).toBe(0);
      });
    });

    describe('isOverBudget', () => {
      it('should return null when no maxCost is set', () => {
        tracker.recordIteration('input', 'output');
        expect(tracker.isOverBudget()).toBeNull();
      });

      it('should return null when under budget', () => {
        const budgetTracker = new CostTracker({
          model: 'claude-3-sonnet',
          maxCost: 100, // $100 budget
        });
        budgetTracker.recordIteration('input', 'output');
        expect(budgetTracker.isOverBudget()).toBeNull();
      });

      it('should return budget info when over budget', () => {
        const budgetTracker = new CostTracker({
          model: 'claude-3-sonnet',
          maxCost: 0.0001, // Extremely low budget
        });
        // Record enough iterations to exceed tiny budget
        budgetTracker.recordIteration('a'.repeat(10000), 'b'.repeat(10000));

        const result = budgetTracker.isOverBudget();
        expect(result).not.toBeNull();
        expect(result?.maxCost).toBe(0.0001);
        expect(result?.currentCost).toBeGreaterThan(0);
      });
    });

    describe('model pricing', () => {
      it('should use default pricing for unknown models', () => {
        const unknownTracker = new CostTracker({ model: 'unknown-model' });
        unknownTracker.recordIteration('input', 'output');

        const stats = unknownTracker.getStats();
        expect(stats.totalCost.totalCost).toBeGreaterThan(0);
      });

      it('should use correct pricing for known models', () => {
        const opusTracker = new CostTracker({ model: 'claude-3-opus' });
        const haikuTracker = new CostTracker({ model: 'claude-3-haiku' });

        opusTracker.recordIteration('same input', 'same output');
        haikuTracker.recordIteration('same input', 'same output');

        const opusStats = opusTracker.getStats();
        const haikuStats = haikuTracker.getStats();

        // Opus should be more expensive than Haiku
        expect(opusStats.totalCost.totalCost).toBeGreaterThan(haikuStats.totalCost.totalCost);
      });
    });
  });
});
