/**
 * LLM-as-Judge for Subjective Quality Evaluation
 *
 * Uses an LLM to evaluate code quality, readability, and adherence to
 * project guidelines. This provides automated verification for criteria
 * that cannot be checked with traditional tests.
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import chalk from 'chalk';
import { type LLMResponse, tryCallLLM } from '../llm/api.js';
import type { LLMProvider } from '../llm/providers.js';

/**
 * Criteria types that the LLM judge can evaluate
 */
export type JudgeCriteriaType =
  | 'code-quality'
  | 'readability'
  | 'naming-conventions'
  | 'error-handling'
  | 'security'
  | 'performance'
  | 'accessibility'
  | 'documentation'
  | 'test-coverage'
  | 'architecture'
  | 'custom';

/**
 * A single evaluation criterion
 */
export interface JudgeCriterion {
  /** Type of criterion */
  type: JudgeCriteriaType;
  /** Human-readable description */
  description: string;
  /** Custom prompt for evaluation (used with 'custom' type) */
  prompt?: string;
  /** Weight for scoring (1-10, default 5) */
  weight?: number;
  /** Minimum acceptable score (1-10, default 6) */
  threshold?: number;
}

/**
 * Result of evaluating a single criterion
 */
export interface CriterionResult {
  criterion: JudgeCriterion;
  /** Score from 1-10 */
  score: number;
  /** Whether it passed the threshold */
  passed: boolean;
  /** LLM's explanation */
  explanation: string;
  /** Suggested improvements */
  suggestions?: string[];
}

/**
 * Overall judgment result
 */
export interface JudgmentResult {
  /** Whether all criteria passed */
  passed: boolean;
  /** Weighted average score (1-10) */
  overallScore: number;
  /** Individual criterion results */
  results: CriterionResult[];
  /** Files that were evaluated */
  filesEvaluated: string[];
  /** Timestamp */
  timestamp: string;
  /** Model used for evaluation */
  model?: string;
}

/**
 * Configuration for the LLM judge
 */
export interface LLMJudgeConfig {
  /** Enable LLM judge evaluation */
  enabled: boolean;
  /** Criteria to evaluate */
  criteria?: JudgeCriterion[];
  /** Files or patterns to evaluate */
  files?: string[];
  /** LLM provider to use */
  provider?: LLMProvider;
  /** Custom system context */
  context?: string;
  /** Project guidelines file */
  guidelinesFile?: string;
}

/**
 * Built-in evaluation prompts for each criterion type
 */
const CRITERION_PROMPTS: Record<Exclude<JudgeCriteriaType, 'custom'>, string> = {
  'code-quality': `
Evaluate the overall code quality of the provided code.
Consider:
- Clean code principles
- DRY (Don't Repeat Yourself)
- SOLID principles
- Appropriate abstraction levels
- No code smells
`,
  readability: `
Evaluate the readability of the provided code.
Consider:
- Clear and descriptive variable/function names
- Appropriate use of whitespace and formatting
- Logical code organization
- Easy to follow control flow
- Self-documenting code
`,
  'naming-conventions': `
Evaluate adherence to naming conventions.
Consider:
- Consistent casing (camelCase, PascalCase, snake_case)
- Descriptive names that reveal intent
- No cryptic abbreviations
- Appropriate prefixes/suffixes where needed
`,
  'error-handling': `
Evaluate the error handling in the provided code.
Consider:
- Appropriate try/catch blocks
- Meaningful error messages
- Proper error propagation
- No swallowed errors
- Graceful degradation
`,
  security: `
Evaluate the security aspects of the provided code.
Consider:
- Input validation
- No hardcoded secrets
- SQL injection prevention
- XSS prevention
- Proper authentication/authorization patterns
`,
  performance: `
Evaluate the performance characteristics of the provided code.
Consider:
- Efficient algorithms and data structures
- No unnecessary computations
- Appropriate caching
- Memory efficiency
- Async operations where appropriate
`,
  accessibility: `
Evaluate the accessibility of the provided code (for UI code).
Consider:
- Semantic HTML
- ARIA labels where needed
- Keyboard navigation support
- Color contrast considerations
- Screen reader compatibility
`,
  documentation: `
Evaluate the documentation quality of the provided code.
Consider:
- JSDoc/TSDoc comments for public APIs
- Inline comments for complex logic
- README or usage documentation
- Type annotations
- Examples where helpful
`,
  'test-coverage': `
Evaluate the test coverage and quality.
Consider:
- Critical paths covered
- Edge cases tested
- Meaningful assertions
- Test isolation
- No flaky tests
`,
  architecture: `
Evaluate the architectural quality of the provided code.
Consider:
- Separation of concerns
- Modularity
- Dependency management
- Appropriate design patterns
- Scalability considerations
`,
};

/**
 * Load LLM judge config from AGENTS.md or ralph config
 */
export function loadJudgeConfig(cwd: string): LLMJudgeConfig | null {
  // Check AGENTS.md for LLM judge config
  const agentsPath = join(cwd, 'AGENTS.md');
  if (existsSync(agentsPath)) {
    const content = readFileSync(agentsPath, 'utf-8');

    // Look for LLM judge section
    const judgeMatch = content.match(/## LLM Judge[\s\S]*?(?=\n## |$)/i);
    if (judgeMatch) {
      const section = judgeMatch[0];
      const criteria: JudgeCriterion[] = [];

      // Parse criteria
      const criteriaMatches = section.matchAll(
        /- (code-quality|readability|naming-conventions|error-handling|security|performance|accessibility|documentation|test-coverage|architecture)(?:\s*\((\d+)\))?/gi
      );
      for (const match of criteriaMatches) {
        const type = match[1].toLowerCase() as JudgeCriteriaType;
        const threshold = match[2] ? Number.parseInt(match[2], 10) : undefined;
        criteria.push({
          type,
          description: type.replace(/-/g, ' '),
          threshold,
        });
      }

      // Parse custom criteria
      const customMatches = section.matchAll(/- custom:\s*"([^"]+)"(?:\s*\((\d+)\))?/gi);
      for (const match of customMatches) {
        criteria.push({
          type: 'custom',
          description: match[1],
          prompt: match[1],
          threshold: match[2] ? Number.parseInt(match[2], 10) : undefined,
        });
      }

      // Parse files pattern
      const filesMatch = section.match(/files:\s*`([^`]+)`/i);
      const files = filesMatch ? [filesMatch[1]] : undefined;

      if (criteria.length > 0) {
        return {
          enabled: true,
          criteria,
          files,
        };
      }
    }
  }

  // Check ralph config file
  const ralphConfigPath = join(cwd, '.ralph', 'config.json');
  if (existsSync(ralphConfigPath)) {
    try {
      const config = JSON.parse(readFileSync(ralphConfigPath, 'utf-8'));
      if (config.llmJudge) {
        return {
          enabled: true,
          ...config.llmJudge,
        };
      }
    } catch {
      // Invalid config
    }
  }

  return null;
}

/**
 * Build the evaluation prompt for a criterion
 */
function buildEvaluationPrompt(
  criterion: JudgeCriterion,
  code: string,
  context?: string,
  guidelines?: string
): string {
  const basePrompt =
    criterion.type === 'custom'
      ? criterion.prompt || criterion.description
      : CRITERION_PROMPTS[criterion.type];

  return `You are an expert code reviewer evaluating code quality.

${context ? `PROJECT CONTEXT:\n${context}\n` : ''}
${guidelines ? `PROJECT GUIDELINES:\n${guidelines}\n` : ''}

EVALUATION CRITERION: ${criterion.description}
${basePrompt}

CODE TO EVALUATE:
\`\`\`
${code}
\`\`\`

Provide your evaluation in the following JSON format:
{
  "score": <number 1-10>,
  "explanation": "<brief explanation of the score>",
  "suggestions": ["<improvement suggestion 1>", "<improvement suggestion 2>"]
}

Be constructive and specific. A score of:
- 1-3: Poor - significant issues that must be addressed
- 4-5: Below average - notable issues that should be fixed
- 6-7: Acceptable - meets basic standards with minor improvements needed
- 8-9: Good - high quality with only minor suggestions
- 10: Excellent - exemplary code

Respond ONLY with the JSON object, no additional text.`;
}

/**
 * Parse the LLM's evaluation response
 */
function parseEvaluationResponse(
  response: string,
  criterion: JudgeCriterion
): { score: number; explanation: string; suggestions?: string[] } {
  try {
    // Try to extract JSON from the response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        score: Math.max(1, Math.min(10, Number(parsed.score) || 5)),
        explanation: String(parsed.explanation || 'No explanation provided'),
        suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions.map(String) : undefined,
      };
    }
  } catch {
    // Failed to parse JSON
  }

  // Fallback: try to extract score from text
  const scoreMatch = response.match(/score[:\s]+(\d+)/i);
  const score = scoreMatch ? Number.parseInt(scoreMatch[1], 10) : 5;

  return {
    score: Math.max(1, Math.min(10, score)),
    explanation: response.substring(0, 500),
  };
}

/**
 * Evaluate a single criterion
 */
async function evaluateCriterion(
  criterion: JudgeCriterion,
  code: string,
  options?: {
    provider?: LLMProvider;
    context?: string;
    guidelines?: string;
  }
): Promise<CriterionResult> {
  const prompt = buildEvaluationPrompt(criterion, code, options?.context, options?.guidelines);

  const response = await tryCallLLM({ prompt, maxTokens: 1024 }, { provider: options?.provider });

  if (!response) {
    return {
      criterion,
      score: 0,
      passed: false,
      explanation: 'Failed to get LLM response (no API key available)',
    };
  }

  const evaluation = parseEvaluationResponse(response.content, criterion);
  const threshold = criterion.threshold ?? 6;

  return {
    criterion,
    score: evaluation.score,
    passed: evaluation.score >= threshold,
    explanation: evaluation.explanation,
    suggestions: evaluation.suggestions,
  };
}

/**
 * Read files for evaluation
 */
function readFilesForEvaluation(
  cwd: string,
  patterns: string[]
): { path: string; content: string }[] {
  const files: { path: string; content: string }[] = [];

  for (const pattern of patterns) {
    // Simple pattern matching (exact files or basic glob)
    const filePath = join(cwd, pattern);
    if (existsSync(filePath)) {
      try {
        const content = readFileSync(filePath, 'utf-8');
        files.push({ path: pattern, content });
      } catch {
        // Skip unreadable files
      }
    }
  }

  return files;
}

/**
 * Load project guidelines if available
 */
function loadGuidelines(cwd: string, guidelinesFile?: string): string | undefined {
  const possibleFiles = guidelinesFile
    ? [guidelinesFile]
    : ['CODING_GUIDELINES.md', 'CONTRIBUTING.md', '.github/CONTRIBUTING.md', 'AGENTS.md'];

  for (const file of possibleFiles) {
    const filePath = join(cwd, file);
    if (existsSync(filePath)) {
      try {
        const content = readFileSync(filePath, 'utf-8');
        // Extract relevant sections (limit size)
        const relevant = content.substring(0, 2000);
        return relevant;
      } catch {
        // Continue to next file
      }
    }
  }

  return undefined;
}

/**
 * Run LLM judge evaluation on code
 */
export async function runLLMJudge(
  cwd: string,
  config: LLMJudgeConfig,
  changedFiles?: string[]
): Promise<JudgmentResult> {
  if (!config.enabled) {
    return {
      passed: true,
      overallScore: 10,
      results: [],
      filesEvaluated: [],
      timestamp: new Date().toISOString(),
    };
  }

  // Determine which files to evaluate
  const filesToEvaluate = changedFiles || config.files || [];
  if (filesToEvaluate.length === 0) {
    return {
      passed: true,
      overallScore: 10,
      results: [],
      filesEvaluated: [],
      timestamp: new Date().toISOString(),
    };
  }

  // Read files
  const files = readFilesForEvaluation(cwd, filesToEvaluate);
  if (files.length === 0) {
    return {
      passed: true,
      overallScore: 10,
      results: [],
      filesEvaluated: [],
      timestamp: new Date().toISOString(),
    };
  }

  // Combine code for evaluation
  const combinedCode = files.map((f) => `// File: ${f.path}\n${f.content}`).join('\n\n');

  // Limit code size to avoid token limits
  const truncatedCode = combinedCode.substring(0, 8000);

  // Load guidelines
  const guidelines = loadGuidelines(cwd, config.guidelinesFile);

  // Default criteria if none specified
  const criteria = config.criteria?.length
    ? config.criteria
    : [
        { type: 'code-quality' as const, description: 'Code quality' },
        { type: 'readability' as const, description: 'Readability' },
      ];

  // Evaluate each criterion
  const results: CriterionResult[] = [];
  let model: string | undefined;

  for (const criterion of criteria) {
    const result = await evaluateCriterion(criterion, truncatedCode, {
      provider: config.provider,
      context: config.context,
      guidelines,
    });
    results.push(result);
  }

  // Calculate overall score (weighted average)
  const totalWeight = results.reduce((sum, r) => sum + (r.criterion.weight ?? 5), 0);
  const weightedSum = results.reduce((sum, r) => sum + r.score * (r.criterion.weight ?? 5), 0);
  const overallScore = totalWeight > 0 ? weightedSum / totalWeight : 0;

  // All criteria must pass
  const passed = results.every((r) => r.passed);

  return {
    passed,
    overallScore: Math.round(overallScore * 10) / 10,
    results,
    filesEvaluated: files.map((f) => f.path),
    timestamp: new Date().toISOString(),
    model,
  };
}

/**
 * Format judgment result for agent feedback
 */
export function formatJudgeFeedback(result: JudgmentResult): string {
  const lines: string[] = [];

  lines.push('## LLM Quality Judge');
  lines.push('');

  if (result.filesEvaluated.length === 0) {
    lines.push('No files evaluated.');
    return lines.join('\n');
  }

  // Overall result
  if (result.passed) {
    lines.push(`✅ Overall Score: ${result.overallScore}/10 - PASSED`);
  } else {
    lines.push(`❌ Overall Score: ${result.overallScore}/10 - NEEDS IMPROVEMENT`);
  }

  lines.push('');
  lines.push(`Files evaluated: ${result.filesEvaluated.join(', ')}`);
  lines.push('');

  // Individual results
  lines.push('### Criterion Results');
  lines.push('');

  for (const r of result.results) {
    const icon = r.passed ? '✅' : '❌';
    const threshold = r.criterion.threshold ?? 6;
    lines.push(`${icon} **${r.criterion.description}**: ${r.score}/10 (threshold: ${threshold})`);
    lines.push(`   ${r.explanation}`);

    if (r.suggestions && r.suggestions.length > 0) {
      lines.push('   Suggestions:');
      for (const s of r.suggestions) {
        lines.push(`   - ${s}`);
      }
    }
    lines.push('');
  }

  if (!result.passed) {
    lines.push('Please address the above issues before continuing.');
  }

  return lines.join('\n');
}

/**
 * Print judge result to console
 */
export function printJudgeStatus(result: JudgmentResult): void {
  console.log();
  if (result.filesEvaluated.length === 0) {
    console.log(chalk.dim('  LLM Judge: No files to evaluate'));
    return;
  }

  if (result.passed) {
    console.log(
      chalk.green('  ✓'),
      chalk.dim('LLM Judge:'),
      `Score ${result.overallScore}/10 - All criteria passed`
    );
  } else {
    console.log(
      chalk.red('  ✗'),
      chalk.dim('LLM Judge:'),
      `Score ${result.overallScore}/10 - Needs improvement`
    );

    // Show failed criteria
    for (const r of result.results.filter((r) => !r.passed)) {
      console.log(
        chalk.dim(`    ${r.criterion.description}:`),
        chalk.yellow(`${r.score}/10`),
        chalk.dim(`- ${r.explanation.substring(0, 80)}...`)
      );
    }
  }
}

/**
 * Quick evaluation for a single file
 */
export async function quickEvaluate(
  code: string,
  criteriaTypes: JudgeCriteriaType[] = ['code-quality', 'readability'],
  options?: { provider?: LLMProvider }
): Promise<{
  score: number;
  passed: boolean;
  feedback: string;
}> {
  const criteria: JudgeCriterion[] = criteriaTypes.map((type) => ({
    type,
    description: type.replace(/-/g, ' '),
  }));

  const results: CriterionResult[] = [];

  for (const criterion of criteria) {
    const result = await evaluateCriterion(criterion, code, {
      provider: options?.provider,
    });
    results.push(result);
  }

  const avgScore =
    results.length > 0 ? results.reduce((sum, r) => sum + r.score, 0) / results.length : 0;

  const passed = results.every((r) => r.passed);

  const feedback = results
    .map((r) => `${r.criterion.description}: ${r.score}/10 - ${r.explanation}`)
    .join('\n');

  return {
    score: Math.round(avgScore * 10) / 10,
    passed,
    feedback,
  };
}
