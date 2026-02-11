import type { TaskCount } from './task-counter.js';

export interface LoopEstimate {
  estimatedTimeMinutes: number;
  estimatedTokens: number;
  estimatedCost: number;
  confidence: 'low' | 'medium' | 'high';
}

// Average estimates per task (based on typical Claude Code usage)
const ESTIMATES = {
  // Time in minutes per task
  timePerTask: {
    simple: 0.5, // Simple file edits
    medium: 1.5, // New files, multiple edits
    complex: 3, // Complex features, multiple files
  },
  // Tokens per task
  tokensPerTask: {
    simple: 2000,
    medium: 5000,
    complex: 10000,
  },
  // Cost per 1K tokens (Claude Sonnet pricing approximation)
  costPer1kTokens: {
    input: 0.003,
    output: 0.015,
  },
};

/**
 * Estimate loop duration, tokens, and cost based on task count
 */
export function estimateLoop(taskCount: TaskCount): LoopEstimate {
  const pendingTasks = taskCount.pending;

  if (pendingTasks === 0) {
    return {
      estimatedTimeMinutes: 1,
      estimatedTokens: 2000,
      estimatedCost: 0.05,
      confidence: 'high',
    };
  }

  // Classify tasks by complexity based on name keywords
  let simpleCount = 0;
  let mediumCount = 0;
  let complexCount = 0;

  for (const task of taskCount.tasks.filter((t) => !t.completed)) {
    const name = task.name.toLowerCase();

    // Complex indicators
    if (
      name.includes('implement') ||
      name.includes('create') ||
      name.includes('build') ||
      name.includes('feature') ||
      name.includes('integration') ||
      name.includes('api')
    ) {
      complexCount++;
    }
    // Simple indicators
    else if (
      name.includes('fix') ||
      name.includes('update') ||
      name.includes('rename') ||
      name.includes('move') ||
      name.includes('delete') ||
      name.includes('config')
    ) {
      simpleCount++;
    }
    // Default to medium
    else {
      mediumCount++;
    }
  }

  // Calculate estimates
  const estimatedTimeMinutes =
    simpleCount * ESTIMATES.timePerTask.simple +
    mediumCount * ESTIMATES.timePerTask.medium +
    complexCount * ESTIMATES.timePerTask.complex;

  const estimatedTokens =
    simpleCount * ESTIMATES.tokensPerTask.simple +
    mediumCount * ESTIMATES.tokensPerTask.medium +
    complexCount * ESTIMATES.tokensPerTask.complex;

  // Cost = input tokens + output tokens (assume 30% input, 70% output)
  const inputTokens = estimatedTokens * 0.3;
  const outputTokens = estimatedTokens * 0.7;
  const estimatedCost =
    (inputTokens / 1000) * ESTIMATES.costPer1kTokens.input +
    (outputTokens / 1000) * ESTIMATES.costPer1kTokens.output;

  // Confidence based on task count
  let confidence: LoopEstimate['confidence'] = 'medium';
  if (pendingTasks <= 3) {
    confidence = 'high';
  } else if (pendingTasks >= 18) {
    confidence = 'low';
  }

  return {
    estimatedTimeMinutes: Math.round(estimatedTimeMinutes),
    estimatedTokens: Math.round(estimatedTokens),
    estimatedCost: Math.round(estimatedCost * 100) / 100, // Round to cents
    confidence,
  };
}

/**
 * Format estimate for display
 */
export function formatEstimate(estimate: LoopEstimate): string {
  const time = estimate.estimatedTimeMinutes;
  const timeStr = time >= 60 ? `${Math.floor(time / 60)}h ${time % 60}m` : `~${time}m`;

  const tokens = estimate.estimatedTokens;
  const tokensStr = tokens >= 1000 ? `~${(tokens / 1000).toFixed(1)}K` : `~${tokens}`;

  const costStr =
    estimate.estimatedCost < 1
      ? `~${Math.round(estimate.estimatedCost * 100)}¢`
      : `~$${estimate.estimatedCost.toFixed(2)}`;

  return `${timeStr} │ ${tokensStr} tokens │ ${costStr}`;
}

/**
 * Format estimate as multiple lines for detailed display
 */
export function formatEstimateDetailed(estimate: LoopEstimate): string[] {
  const lines: string[] = [];

  const time = estimate.estimatedTimeMinutes;
  const timeStr = time >= 60 ? `${Math.floor(time / 60)}h ${time % 60}m` : `${time} minutes`;
  lines.push(`⏱  Estimated time: ${timeStr}`);

  const tokens = estimate.estimatedTokens;
  const tokensStr = tokens >= 1000 ? `${(tokens / 1000).toFixed(1)}K` : `${tokens}`;
  lines.push(`📊 Estimated tokens: ${tokensStr}`);

  const costStr =
    estimate.estimatedCost < 1
      ? `${Math.round(estimate.estimatedCost * 100)}¢`
      : `$${estimate.estimatedCost.toFixed(2)}`;
  lines.push(`💰 Estimated cost: ${costStr}`);

  if (estimate.confidence !== 'high') {
    lines.push(`📈 Confidence: ${estimate.confidence}`);
  }

  return lines;
}
