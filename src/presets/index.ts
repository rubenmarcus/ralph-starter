/**
 * Workflow Presets for Ralph Loop
 * Pre-configured settings for common development scenarios
 */

export interface PresetConfig {
  name: string;
  description: string;
  maxIterations: number;
  validate: boolean;
  commit: boolean;
  completionPromise?: string;
  promptPrefix?: string;
  rateLimit?: number; // calls per hour
  circuitBreaker?: {
    maxConsecutiveFailures: number;
    maxSameErrorCount: number;
  };
}

export const PRESETS: Record<string, PresetConfig> = {
  // Development presets
  feature: {
    name: 'feature',
    description: 'Standard feature implementation with validation and commits',
    maxIterations: 30,
    validate: true,
    commit: true,
    completionPromise: 'FEATURE_COMPLETE',
    circuitBreaker: {
      maxConsecutiveFailures: 3,
      maxSameErrorCount: 5,
    },
  },

  'feature-minimal': {
    name: 'feature-minimal',
    description: 'Quick feature implementation without validation',
    maxIterations: 20,
    validate: false,
    commit: true,
  },

  'tdd-red-green': {
    name: 'tdd-red-green',
    description: 'Test-driven development: write failing test, then implement',
    maxIterations: 50,
    validate: true,
    commit: true,
    promptPrefix:
      'Follow strict TDD: 1) Write a failing test first, 2) Run tests to confirm failure, 3) Implement minimum code to pass, 4) Refactor if needed. Commit after each green test.',
    circuitBreaker: {
      maxConsecutiveFailures: 5,
      maxSameErrorCount: 3,
    },
  },

  'spec-driven': {
    name: 'spec-driven',
    description: 'Implementation driven by specification files',
    maxIterations: 40,
    validate: true,
    commit: true,
    promptPrefix:
      'Read the specification files in specs/ directory. Implement according to the requirements. Mark tasks complete in IMPLEMENTATION_PLAN.md as you finish them.',
    completionPromise: '<promise>COMPLETE</promise>',
  },

  refactor: {
    name: 'refactor',
    description: 'Safe refactoring with continuous test validation',
    maxIterations: 40,
    validate: true,
    commit: true,
    promptPrefix:
      'Refactor the code while maintaining all tests passing. Make small, incremental changes. Commit after each successful refactoring step.',
    circuitBreaker: {
      maxConsecutiveFailures: 2,
      maxSameErrorCount: 3,
    },
  },

  // Debugging presets
  debug: {
    name: 'debug',
    description: 'Debugging session without auto-commits',
    maxIterations: 20,
    validate: false,
    commit: false,
    promptPrefix:
      'Debug the issue step by step. Add logging, analyze outputs, identify root cause. Document findings.',
  },

  'incident-response': {
    name: 'incident-response',
    description: 'Quick fix for production incidents',
    maxIterations: 15,
    validate: true,
    commit: true,
    promptPrefix:
      'This is a production incident. Focus on the minimal fix. Avoid refactoring. Document the issue and solution.',
    circuitBreaker: {
      maxConsecutiveFailures: 2,
      maxSameErrorCount: 2,
    },
  },

  'code-archaeology': {
    name: 'code-archaeology',
    description: 'Investigate and document legacy code',
    maxIterations: 30,
    validate: false,
    commit: false,
    promptPrefix:
      'Investigate the codebase to understand how it works. Add documentation and comments. Create diagrams if helpful.',
  },

  // Review presets
  review: {
    name: 'review',
    description: 'Code review and suggestions',
    maxIterations: 10,
    validate: true,
    commit: false,
    promptPrefix:
      'Review the code for: bugs, security issues, performance problems, code quality. Suggest improvements but do not implement.',
  },

  'pr-review': {
    name: 'pr-review',
    description: 'Pull request review',
    maxIterations: 10,
    validate: true,
    commit: false,
    promptPrefix:
      'Review the changes in this PR. Check for: correctness, test coverage, documentation, breaking changes. Provide actionable feedback.',
  },

  'adversarial-review': {
    name: 'adversarial-review',
    description: 'Security-focused adversarial review',
    maxIterations: 15,
    validate: false,
    commit: false,
    promptPrefix:
      'Perform an adversarial security review. Look for: injection vulnerabilities, authentication bypasses, authorization issues, data leaks, OWASP Top 10.',
  },

  // Documentation presets
  docs: {
    name: 'docs',
    description: 'Generate documentation',
    maxIterations: 20,
    validate: false,
    commit: true,
    promptPrefix:
      'Generate comprehensive documentation. Include: API docs, usage examples, architecture overview. Use clear language.',
  },

  'documentation-first': {
    name: 'documentation-first',
    description: 'Write docs before implementation',
    maxIterations: 30,
    validate: false,
    commit: true,
    promptPrefix:
      'Write documentation first, then implement. Document: purpose, API, usage examples, edge cases. Implementation must match documentation.',
  },

  // Specialized presets
  'api-design': {
    name: 'api-design',
    description: 'API design and implementation',
    maxIterations: 35,
    validate: true,
    commit: true,
    promptPrefix:
      'Design and implement the API following REST best practices. Include: proper HTTP methods, status codes, error handling, validation, documentation.',
  },

  'migration-safety': {
    name: 'migration-safety',
    description: 'Safe database/data migrations',
    maxIterations: 25,
    validate: true,
    commit: true,
    promptPrefix:
      'Create safe migrations. Ensure: reversibility, no data loss, backward compatibility, proper testing. Create rollback scripts.',
    circuitBreaker: {
      maxConsecutiveFailures: 1,
      maxSameErrorCount: 2,
    },
  },

  'performance-optimization': {
    name: 'performance-optimization',
    description: 'Performance analysis and optimization',
    maxIterations: 30,
    validate: true,
    commit: true,
    promptPrefix:
      'Analyze and optimize performance. Profile first, identify bottlenecks, make targeted improvements. Document performance gains.',
  },

  'scientific-method': {
    name: 'scientific-method',
    description: 'Hypothesis-driven development',
    maxIterations: 40,
    validate: true,
    commit: true,
    promptPrefix:
      'Follow the scientific method: 1) Observe the problem, 2) Form a hypothesis, 3) Design an experiment (test), 4) Implement and test, 5) Analyze results, 6) Iterate.',
  },

  research: {
    name: 'research',
    description: 'Research and exploration',
    maxIterations: 25,
    validate: false,
    commit: false,
    promptPrefix:
      'Research the topic thoroughly. Explore options, compare alternatives, document findings. Create a summary report.',
  },

  'gap-analysis': {
    name: 'gap-analysis',
    description: 'Compare spec to implementation',
    maxIterations: 20,
    validate: true,
    commit: false,
    promptPrefix:
      'Compare the specification to the current implementation. Identify gaps, missing features, and discrepancies. Create a prioritized TODO list.',
  },
};

/**
 * Get a preset by name
 */
export function getPreset(name: string): PresetConfig | undefined {
  return PRESETS[name];
}

/**
 * Get all available preset names
 */
export function getPresetNames(): string[] {
  return Object.keys(PRESETS);
}

/**
 * Get presets grouped by category
 */
export function getPresetsByCategory(): Record<string, PresetConfig[]> {
  return {
    Development: [
      PRESETS.feature,
      PRESETS['feature-minimal'],
      PRESETS['tdd-red-green'],
      PRESETS['spec-driven'],
      PRESETS.refactor,
    ],
    Debugging: [PRESETS.debug, PRESETS['incident-response'], PRESETS['code-archaeology']],
    Review: [PRESETS.review, PRESETS['pr-review'], PRESETS['adversarial-review']],
    Documentation: [PRESETS.docs, PRESETS['documentation-first']],
    Specialized: [
      PRESETS['api-design'],
      PRESETS['migration-safety'],
      PRESETS['performance-optimization'],
      PRESETS['scientific-method'],
      PRESETS.research,
      PRESETS['gap-analysis'],
    ],
  };
}

/**
 * Format presets for CLI help
 */
export function formatPresetsHelp(): string {
  const categories = getPresetsByCategory();
  const lines: string[] = ['Available presets:', ''];

  for (const [category, presets] of Object.entries(categories)) {
    lines.push(`  ${category}:`);
    for (const preset of presets) {
      lines.push(`    ${preset.name.padEnd(22)} ${preset.description}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}
