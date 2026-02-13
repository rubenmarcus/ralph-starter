/**
 * Cost tracking for AI agent loops
 * Estimates token usage and calculates costs based on model pricing
 */

export interface ModelPricing {
  name: string;
  inputPricePerMillion: number; // USD per 1M input tokens
  outputPricePerMillion: number; // USD per 1M output tokens
  cacheWritePricePerMillion?: number; // USD per 1M cache write tokens (1.25x input)
  cacheReadPricePerMillion?: number; // USD per 1M cache read tokens (0.1x input)
}

// Pricing as of January 2026 (approximate)
export const MODEL_PRICING: Record<string, ModelPricing> = {
  'claude-3-opus': {
    name: 'Claude 3 Opus',
    inputPricePerMillion: 15,
    outputPricePerMillion: 75,
    cacheWritePricePerMillion: 18.75, // 1.25x input
    cacheReadPricePerMillion: 1.5, // 0.1x input
  },
  'claude-3-sonnet': {
    name: 'Claude 3.5 Sonnet',
    inputPricePerMillion: 3,
    outputPricePerMillion: 15,
    cacheWritePricePerMillion: 3.75, // 1.25x input
    cacheReadPricePerMillion: 0.3, // 0.1x input
  },
  'claude-3-haiku': {
    name: 'Claude 3.5 Haiku',
    inputPricePerMillion: 0.25,
    outputPricePerMillion: 1.25,
    cacheWritePricePerMillion: 0.3125, // 1.25x input
    cacheReadPricePerMillion: 0.025, // 0.1x input
  },
  'gpt-4': {
    name: 'GPT-4',
    inputPricePerMillion: 30,
    outputPricePerMillion: 60,
  },
  'gpt-4-turbo': {
    name: 'GPT-4 Turbo',
    inputPricePerMillion: 10,
    outputPricePerMillion: 30,
  },
  // Default for unknown models (conservative estimate)
  default: {
    name: 'Default',
    inputPricePerMillion: 3,
    outputPricePerMillion: 15,
  },
};

export interface TokenEstimate {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
}

export interface CostEstimate {
  inputCost: number;
  outputCost: number;
  totalCost: number;
}

export interface CacheMetrics {
  cacheCreationTokens: number;
  cacheReadTokens: number;
  cacheSavings: number; // USD saved by cache reads vs full-price input
}

export interface IterationCost {
  iteration: number;
  tokens: TokenEstimate;
  cost: CostEstimate;
  cache?: CacheMetrics;
  timestamp: Date;
}

export interface CostTrackerStats {
  totalIterations: number;
  totalTokens: TokenEstimate;
  totalCost: CostEstimate;
  avgTokensPerIteration: TokenEstimate;
  avgCostPerIteration: CostEstimate;
  projectedCost?: CostEstimate; // Projected cost for remaining iterations
  totalCacheSavings: number; // USD saved by prompt caching
  iterations: IterationCost[];
}

export interface CostTrackerConfig {
  model: string;
  maxIterations?: number;
  /** Maximum cost in USD before the loop should stop (0 = unlimited) */
  maxCost?: number;
}

/**
 * Estimate token count from text
 * Rough approximation: ~4 characters per token for English text
 */
export function estimateTokens(text: string): number {
  if (!text) return 0;
  // More accurate estimation considering code vs prose
  // Code typically has more tokens per character due to special characters
  const hasCode = /```|function|const |let |var |import |export |class |def |async |await /.test(
    text
  );
  const charsPerToken = hasCode ? 3.5 : 4;
  return Math.ceil(text.length / charsPerToken);
}

/**
 * Calculate cost from tokens and pricing
 */
export function calculateCost(tokens: TokenEstimate, pricing: ModelPricing): CostEstimate {
  const inputCost = (tokens.inputTokens / 1_000_000) * pricing.inputPricePerMillion;
  const outputCost = (tokens.outputTokens / 1_000_000) * pricing.outputPricePerMillion;
  return {
    inputCost,
    outputCost,
    totalCost: inputCost + outputCost,
  };
}

/**
 * Format cost as USD string
 */
export function formatCost(cost: number): string {
  if (cost < 0.01) {
    return `$${(cost * 100).toFixed(2)}¢`;
  }
  if (cost < 1) {
    return `$${cost.toFixed(3)}`;
  }
  return `$${cost.toFixed(2)}`;
}

/**
 * Format token count with K/M suffixes
 */
export function formatTokens(tokens: number): string {
  if (tokens < 1000) {
    return `${tokens}`;
  }
  if (tokens < 1_000_000) {
    return `${(tokens / 1000).toFixed(1)}K`;
  }
  return `${(tokens / 1_000_000).toFixed(2)}M`;
}

/**
 * Cost tracker for monitoring loop expenses
 */
export class CostTracker {
  private config: CostTrackerConfig;
  private pricing: ModelPricing;
  private iterations: IterationCost[] = [];

  constructor(config: CostTrackerConfig) {
    this.config = config;
    this.pricing = MODEL_PRICING[config.model] || MODEL_PRICING.default;
  }

  /**
   * Record an iteration's token usage (estimated from text)
   */
  recordIteration(input: string, output: string): IterationCost {
    const inputTokens = estimateTokens(input);
    const outputTokens = estimateTokens(output);

    const tokens: TokenEstimate = {
      inputTokens,
      outputTokens,
      totalTokens: inputTokens + outputTokens,
    };

    const cost = calculateCost(tokens, this.pricing);

    const iterationCost: IterationCost = {
      iteration: this.iterations.length + 1,
      tokens,
      cost,
      timestamp: new Date(),
    };

    this.iterations.push(iterationCost);
    return iterationCost;
  }

  /**
   * Record an iteration with actual API usage data (includes cache metrics)
   */
  recordIterationWithUsage(usage: {
    inputTokens: number;
    outputTokens: number;
    cacheCreationInputTokens?: number;
    cacheReadInputTokens?: number;
  }): IterationCost {
    const tokens: TokenEstimate = {
      inputTokens: usage.inputTokens,
      outputTokens: usage.outputTokens,
      totalTokens: usage.inputTokens + usage.outputTokens,
    };

    const cost = calculateCost(tokens, this.pricing);

    // Calculate cache metrics if available
    let cache: CacheMetrics | undefined;
    if (usage.cacheCreationInputTokens || usage.cacheReadInputTokens) {
      const cacheCreationTokens = usage.cacheCreationInputTokens || 0;
      const cacheReadTokens = usage.cacheReadInputTokens || 0;

      // Cache savings = what those cache-read tokens would have cost at full price minus cache price
      const fullPriceCost = (cacheReadTokens / 1_000_000) * this.pricing.inputPricePerMillion;
      const cachedCost = this.pricing.cacheReadPricePerMillion
        ? (cacheReadTokens / 1_000_000) * this.pricing.cacheReadPricePerMillion
        : fullPriceCost;

      cache = {
        cacheCreationTokens,
        cacheReadTokens,
        cacheSavings: fullPriceCost - cachedCost,
      };
    }

    const iterationCost: IterationCost = {
      iteration: this.iterations.length + 1,
      tokens,
      cost,
      cache,
      timestamp: new Date(),
    };

    this.iterations.push(iterationCost);
    return iterationCost;
  }

  /**
   * Get current statistics
   */
  getStats(): CostTrackerStats {
    const totalIterations = this.iterations.length;

    if (totalIterations === 0) {
      return {
        totalIterations: 0,
        totalTokens: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
        totalCost: { inputCost: 0, outputCost: 0, totalCost: 0 },
        avgTokensPerIteration: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
        avgCostPerIteration: { inputCost: 0, outputCost: 0, totalCost: 0 },
        totalCacheSavings: 0,
        iterations: [],
      };
    }

    const totalTokens: TokenEstimate = {
      inputTokens: this.iterations.reduce((sum, i) => sum + i.tokens.inputTokens, 0),
      outputTokens: this.iterations.reduce((sum, i) => sum + i.tokens.outputTokens, 0),
      totalTokens: this.iterations.reduce((sum, i) => sum + i.tokens.totalTokens, 0),
    };

    const totalCost: CostEstimate = {
      inputCost: this.iterations.reduce((sum, i) => sum + i.cost.inputCost, 0),
      outputCost: this.iterations.reduce((sum, i) => sum + i.cost.outputCost, 0),
      totalCost: this.iterations.reduce((sum, i) => sum + i.cost.totalCost, 0),
    };

    const avgTokensPerIteration: TokenEstimate = {
      inputTokens: Math.round(totalTokens.inputTokens / totalIterations),
      outputTokens: Math.round(totalTokens.outputTokens / totalIterations),
      totalTokens: Math.round(totalTokens.totalTokens / totalIterations),
    };

    const avgCostPerIteration: CostEstimate = {
      inputCost: totalCost.inputCost / totalIterations,
      outputCost: totalCost.outputCost / totalIterations,
      totalCost: totalCost.totalCost / totalIterations,
    };

    // Calculate projected cost if max iterations is set
    let projectedCost: CostEstimate | undefined;
    if (this.config.maxIterations && totalIterations >= 3) {
      const remainingIterations = this.config.maxIterations - totalIterations;
      if (remainingIterations > 0) {
        projectedCost = {
          inputCost: totalCost.inputCost + avgCostPerIteration.inputCost * remainingIterations,
          outputCost: totalCost.outputCost + avgCostPerIteration.outputCost * remainingIterations,
          totalCost: totalCost.totalCost + avgCostPerIteration.totalCost * remainingIterations,
        };
      }
    }

    // Sum cache savings across all iterations
    const totalCacheSavings = this.iterations.reduce(
      (sum, i) => sum + (i.cache?.cacheSavings || 0),
      0
    );

    return {
      totalIterations,
      totalTokens,
      totalCost,
      avgTokensPerIteration,
      avgCostPerIteration,
      projectedCost,
      totalCacheSavings,
      iterations: this.iterations,
    };
  }

  /**
   * Format stats for CLI display
   */
  formatStats(): string {
    const stats = this.getStats();

    if (stats.totalIterations === 0) {
      return 'No iterations recorded';
    }

    const lines: string[] = [
      `Tokens: ${formatTokens(stats.totalTokens.totalTokens)} (${formatTokens(stats.totalTokens.inputTokens)} in / ${formatTokens(stats.totalTokens.outputTokens)} out)`,
      `Cost: ${formatCost(stats.totalCost.totalCost)} (${formatCost(stats.avgCostPerIteration.totalCost)}/iteration avg)`,
    ];

    if (stats.totalCacheSavings > 0) {
      lines.push(`Cache savings: ${formatCost(stats.totalCacheSavings)}`);
    }

    if (stats.projectedCost) {
      lines.push(`Projected max cost: ${formatCost(stats.projectedCost.totalCost)}`);
    }

    return lines.join('\n');
  }

  /**
   * Format a summary for activity.md
   */
  formatSummary(): string {
    const stats = this.getStats();

    if (stats.totalIterations === 0) {
      return '';
    }

    return `
## Cost Summary

| Metric | Value |
|--------|-------|
| Total Iterations | ${stats.totalIterations} |
| Total Tokens | ${formatTokens(stats.totalTokens.totalTokens)} |
| Input Tokens | ${formatTokens(stats.totalTokens.inputTokens)} |
| Output Tokens | ${formatTokens(stats.totalTokens.outputTokens)} |
| Total Cost | ${formatCost(stats.totalCost.totalCost)} |
| Avg Cost/Iteration | ${formatCost(stats.avgCostPerIteration.totalCost)} |
${stats.totalCacheSavings > 0 ? `| Cache Savings | ${formatCost(stats.totalCacheSavings)} |\n` : ''}${stats.projectedCost ? `| Projected Max Cost | ${formatCost(stats.projectedCost.totalCost)} |` : ''}
`;
  }

  /**
   * Check if accumulated cost exceeds the configured budget.
   * Returns the budget and current total if over, null otherwise.
   */
  isOverBudget(): { maxCost: number; currentCost: number } | null {
    if (!this.config.maxCost || this.config.maxCost <= 0) return null;
    const total = this.iterations.reduce((sum, i) => sum + i.cost.totalCost, 0);
    if (total >= this.config.maxCost) {
      return { maxCost: this.config.maxCost, currentCost: total };
    }
    return null;
  }

  /**
   * Get the last iteration's cost
   */
  getLastIterationCost(): IterationCost | undefined {
    return this.iterations[this.iterations.length - 1];
  }

  /**
   * Reset the tracker
   */
  reset(): void {
    this.iterations = [];
  }
}
