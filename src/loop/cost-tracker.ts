/**
 * Cost tracking for AI agent loops
 * Estimates token usage and calculates costs based on model pricing
 */

export interface ModelPricing {
  name: string;
  inputPricePerMillion: number; // USD per 1M input tokens
  outputPricePerMillion: number; // USD per 1M output tokens
}

// Pricing as of January 2026 (approximate)
export const MODEL_PRICING: Record<string, ModelPricing> = {
  'claude-3-opus': {
    name: 'Claude 3 Opus',
    inputPricePerMillion: 15,
    outputPricePerMillion: 75,
  },
  'claude-3-sonnet': {
    name: 'Claude 3.5 Sonnet',
    inputPricePerMillion: 3,
    outputPricePerMillion: 15,
  },
  'claude-3-haiku': {
    name: 'Claude 3.5 Haiku',
    inputPricePerMillion: 0.25,
    outputPricePerMillion: 1.25,
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

export interface IterationCost {
  iteration: number;
  tokens: TokenEstimate;
  cost: CostEstimate;
  timestamp: Date;
}

export interface CostTrackerStats {
  totalIterations: number;
  totalTokens: TokenEstimate;
  totalCost: CostEstimate;
  avgTokensPerIteration: TokenEstimate;
  avgCostPerIteration: CostEstimate;
  projectedCost?: CostEstimate; // Projected cost for remaining iterations
  iterations: IterationCost[];
}

export interface CostTrackerConfig {
  model: string;
  maxIterations?: number;
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
   * Record an iteration's token usage
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

    return {
      totalIterations,
      totalTokens,
      totalCost,
      avgTokensPerIteration,
      avgCostPerIteration,
      projectedCost,
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
${stats.projectedCost ? `| Projected Max Cost | ${formatCost(stats.projectedCost.totalCost)} |` : ''}
`;
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
