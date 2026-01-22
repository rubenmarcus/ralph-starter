/**
 * Semantic Response Analyzer
 * Analyzes agent output for natural language completion/stuck signals
 */

export interface AnalysisResult {
  completionScore: number; // 0-1
  stuckScore: number; // 0-1
  confidence: 'high' | 'medium' | 'low';
  indicators: {
    completion: string[];
    stuck: string[];
  };
}

// Patterns indicating task completion
const COMPLETION_PATTERNS: Array<{ pattern: RegExp; weight: number }> = [
  // Explicit completion signals
  { pattern: /<promise>COMPLETE<\/promise>/i, weight: 1.0 },
  { pattern: /EXIT_SIGNAL:\s*true/i, weight: 1.0 },
  { pattern: /<TASK_DONE>/i, weight: 1.0 },
  { pattern: /<TASK_COMPLETE>/i, weight: 1.0 },

  // Strong completion indicators
  { pattern: /all\s+tasks?\s+(are\s+)?completed?/i, weight: 0.9 },
  { pattern: /implementation\s+(is\s+)?complete/i, weight: 0.9 },
  { pattern: /feature\s+(is\s+)?ready/i, weight: 0.8 },
  { pattern: /successfully\s+(implemented|completed|finished)/i, weight: 0.9 },
  { pattern: /no\s+more\s+tasks?\s+(remaining|left)/i, weight: 0.9 },

  // Medium completion indicators
  { pattern: /everything\s+(is\s+)?(done|working|complete)/i, weight: 0.7 },
  { pattern: /all\s+tests?\s+pass(ing|ed)?/i, weight: 0.6 },
  { pattern: /build\s+succeed(s|ed)?/i, weight: 0.5 },
  { pattern: /ready\s+(for|to)\s+(review|merge|deploy)/i, weight: 0.8 },
  { pattern: /task\s+(has\s+been\s+)?completed/i, weight: 0.7 },

  // Weaker indicators (might just be status updates)
  { pattern: /finished\s+(implementing|coding|writing)/i, weight: 0.5 },
  { pattern: /changes?\s+(have\s+been\s+)?committed/i, weight: 0.3 },
  { pattern: /pushed\s+to\s+(remote|origin)/i, weight: 0.3 },
];

// Patterns indicating the agent is stuck or blocked
const STUCK_PATTERNS: Array<{ pattern: RegExp; weight: number }> = [
  // Explicit blocked signals
  { pattern: /<TASK_BLOCKED>/i, weight: 1.0 },
  { pattern: /TASK\s+BLOCKED/i, weight: 1.0 },

  // Strong stuck indicators
  { pattern: /cannot\s+proceed/i, weight: 0.9 },
  { pattern: /blocked\s+by/i, weight: 0.9 },
  { pattern: /waiting\s+for\s+(human|user|manual)/i, weight: 0.9 },
  { pattern: /need(s)?\s+(your\s+)?clarification/i, weight: 0.8 },
  { pattern: /require(s)?\s+(human|manual)\s+intervention/i, weight: 0.9 },

  // Medium stuck indicators
  { pattern: /same\s+error\s+again/i, weight: 0.7 },
  { pattern: /stuck\s+(on|at|in)/i, weight: 0.8 },
  { pattern: /unable\s+to\s+(proceed|continue|resolve)/i, weight: 0.8 },
  { pattern: /can'?t\s+(figure\s+out|solve|fix)/i, weight: 0.6 },
  { pattern: /infinite\s+loop/i, weight: 0.9 },

  // Weaker indicators
  { pattern: /not\s+sure\s+(how|what)/i, weight: 0.4 },
  { pattern: /need(s)?\s+more\s+(information|context)/i, weight: 0.5 },
  { pattern: /missing\s+(dependency|file|configuration)/i, weight: 0.6 },
  { pattern: /permission\s+denied/i, weight: 0.7 },
  { pattern: /authentication\s+(failed|required)/i, weight: 0.7 },
];

// Patterns indicating progress is being made
const PROGRESS_PATTERNS: Array<{ pattern: RegExp; weight: number }> = [
  { pattern: /working\s+on/i, weight: 0.3 },
  { pattern: /implementing/i, weight: 0.3 },
  { pattern: /creating/i, weight: 0.3 },
  { pattern: /updating/i, weight: 0.3 },
  { pattern: /fixing/i, weight: 0.3 },
  { pattern: /next\s+(step|task)/i, weight: 0.2 },
];

function matchPatterns(
  text: string,
  patterns: Array<{ pattern: RegExp; weight: number }>
): { score: number; matches: string[] } {
  let totalWeight = 0;
  const matches: string[] = [];

  for (const { pattern, weight } of patterns) {
    const match = text.match(pattern);
    if (match) {
      totalWeight += weight;
      matches.push(match[0]);
    }
  }

  // Normalize score to 0-1 range, capped at 1
  const score = Math.min(totalWeight, 1.0);

  return { score, matches };
}

function determineConfidence(
  completionScore: number,
  stuckScore: number,
  progressMatches: number
): 'high' | 'medium' | 'low' {
  // High confidence: strong signal in one direction with no conflicting signals
  if (completionScore >= 0.8 && stuckScore < 0.2) {
    return 'high';
  }
  if (stuckScore >= 0.8 && completionScore < 0.2) {
    return 'high';
  }

  // Low confidence: conflicting signals
  if (completionScore >= 0.5 && stuckScore >= 0.5) {
    return 'low';
  }

  // Low confidence: no strong signals
  if (completionScore < 0.3 && stuckScore < 0.3) {
    return 'low';
  }

  return 'medium';
}

/**
 * Analyze agent output for completion/stuck signals
 */
export function analyzeResponse(output: string): AnalysisResult {
  const completion = matchPatterns(output, COMPLETION_PATTERNS);
  const stuck = matchPatterns(output, STUCK_PATTERNS);
  const progress = matchPatterns(output, PROGRESS_PATTERNS);

  const confidence = determineConfidence(
    completion.score,
    stuck.score,
    progress.matches.length
  );

  return {
    completionScore: completion.score,
    stuckScore: stuck.score,
    confidence,
    indicators: {
      completion: completion.matches,
      stuck: stuck.matches,
    },
  };
}

/**
 * Determine loop status based on semantic analysis
 */
export function determineStatus(
  analysis: AnalysisResult,
  options: {
    requireExitSignal?: boolean;
    minCompletionIndicators?: number;
  } = {}
): 'done' | 'blocked' | 'continue' {
  const { requireExitSignal = false, minCompletionIndicators = 1 } = options;

  // Check for blocked status first (higher priority)
  if (analysis.stuckScore >= 0.7 && analysis.confidence !== 'low') {
    return 'blocked';
  }

  // Check for explicit EXIT_SIGNAL if required
  const hasExitSignal = analysis.indicators.completion.some(
    (m) => /EXIT_SIGNAL:\s*true/i.test(m) || /<promise>COMPLETE<\/promise>/i.test(m)
  );

  // Check completion conditions
  if (analysis.completionScore >= 0.7) {
    // If exit signal is required, check for it
    if (requireExitSignal && !hasExitSignal) {
      return 'continue';
    }

    // Check minimum indicators
    if (analysis.indicators.completion.length >= minCompletionIndicators) {
      return 'done';
    }
  }

  // Explicit exit signals always count
  if (hasExitSignal) {
    return 'done';
  }

  return 'continue';
}

/**
 * Count completion indicators in output
 */
export function countCompletionIndicators(output: string): number {
  const analysis = analyzeResponse(output);
  return analysis.indicators.completion.length;
}

/**
 * Check if output contains explicit exit signal
 */
export function hasExitSignal(output: string): boolean {
  return (
    /EXIT_SIGNAL:\s*true/i.test(output) ||
    /<promise>COMPLETE<\/promise>/i.test(output)
  );
}
