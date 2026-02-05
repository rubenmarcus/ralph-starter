/**
 * Harvest Command - Knowledge Extraction and Archival
 *
 * Extracts learnings from activity.md and archives completed tasks:
 * 1. Parse activity.md for patterns and insights
 * 2. Update AGENTS.md with discovered patterns
 * 3. Archive completed tasks to history
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import chalk from 'chalk';
import { type Agent, detectBestAgent, runAgent } from '../loop/agents.js';
import { detectStepFromOutput } from '../loop/step-detector.js';
import { ProgressRenderer } from '../ui/progress-renderer.js';

export interface HarvestCommandOptions {
  /** Run in automated mode (skip permissions) */
  auto?: boolean;
  /** Activity file path (default: .ralph/activity.md) */
  activityFile?: string;
  /** AGENTS.md file path (default: AGENTS.md) */
  agentsFile?: string;
  /** Archive directory (default: .ralph/archive) */
  archiveDir?: string;
  /** Skip pattern extraction */
  skipPatterns?: boolean;
  /** Skip archival */
  skipArchive?: boolean;
  /** Verbose output */
  verbose?: boolean;
}

interface HarvestResult {
  patterns: string[];
  learnings: string[];
  archivedFile?: string;
}

/**
 * Parse activity.md to extract iteration data
 */
function parseActivityFile(content: string): {
  iterations: Array<{
    number: number;
    status: string;
    summary: string;
    duration?: string;
    cost?: string;
    validations?: string[];
  }>;
  task?: string;
  startDate?: string;
} {
  const lines = content.split('\n');
  const iterations: Array<{
    number: number;
    status: string;
    summary: string;
    duration?: string;
    cost?: string;
    validations?: string[];
  }> = [];

  let task: string | undefined;
  let startDate: string | undefined;
  let currentIteration: (typeof iterations)[0] | null = null;

  for (const line of lines) {
    // Extract task
    const taskMatch = line.match(/\*\*Task:\*\*\s*(.+)/);
    if (taskMatch) {
      task = taskMatch[1];
    }

    // Extract start date
    const dateMatch = line.match(/\*\*Started:\*\*\s*(.+)/);
    if (dateMatch) {
      startDate = dateMatch[1];
    }

    // Parse iteration headers
    const iterMatch = line.match(/^### Iteration (\d+)/);
    if (iterMatch) {
      if (currentIteration) {
        iterations.push(currentIteration);
      }
      currentIteration = {
        number: parseInt(iterMatch[1], 10),
        status: '',
        summary: '',
      };
    }

    if (currentIteration) {
      // Extract status
      const statusMatch = line.match(/\*\*Status:\*\*\s*(.+)/);
      if (statusMatch) {
        currentIteration.status = statusMatch[1];
      }

      // Extract summary
      const summaryMatch = line.match(/\*\*Summary:\*\*\s*(.+)/);
      if (summaryMatch) {
        currentIteration.summary = summaryMatch[1];
      }

      // Extract duration
      const durationMatch = line.match(/\*\*Duration:\*\*\s*(.+)/);
      if (durationMatch) {
        currentIteration.duration = durationMatch[1];
      }

      // Extract cost
      const costMatch = line.match(/\*\*Cost:\*\*\s*(.+)/);
      if (costMatch) {
        currentIteration.cost = costMatch[1];
      }

      // Extract validations
      const validMatch = line.match(/^- [✅❌]\s*(.+)/);
      if (validMatch) {
        if (!currentIteration.validations) {
          currentIteration.validations = [];
        }
        currentIteration.validations.push(validMatch[1]);
      }
    }
  }

  if (currentIteration) {
    iterations.push(currentIteration);
  }

  return { iterations, task, startDate };
}

/**
 * Extract patterns using AI agent
 */
async function extractPatternsWithAgent(
  agent: Agent,
  activityContent: string,
  agentsContent: string,
  cwd: string,
  options: HarvestCommandOptions
): Promise<{ patterns: string[]; learnings: string[] }> {
  const progress = new ProgressRenderer();
  progress.start('Analyzing activity log for patterns...');

  const prompt = `You are analyzing an AI coding session activity log to extract learnings and patterns.

Activity Log:
${activityContent}

Current AGENTS.md patterns:
${agentsContent || 'No existing patterns yet.'}

Your task is to:
1. Identify what worked well (successful patterns)
2. Identify what failed or caused issues (anti-patterns to avoid)
3. Extract any new code patterns that should be documented
4. Note any validation commands that were useful
5. Identify workflow improvements

Output a JSON object with two arrays:
- "patterns": Array of pattern descriptions to add to AGENTS.md
- "learnings": Array of key learnings from this session

Format:
{
  "patterns": ["Pattern 1 description", "Pattern 2 description"],
  "learnings": ["Learning 1", "Learning 2"]
}

Only include significant, actionable insights. Skip trivial observations.
Return ONLY the JSON object, no other text.`;

  const result = await runAgent(agent, {
    task: prompt,
    cwd,
    auto: options.auto,
    maxTurns: 5,
    streamOutput: options.verbose,
    onOutput: (line: string) => {
      const step = detectStepFromOutput(line);
      if (step) {
        progress.updateStep(`Analyzing: ${step}`);
      }
    },
  });

  progress.stop('Analysis complete');

  // Parse the JSON response
  try {
    // Extract JSON from the output
    const jsonMatch = result.output.match(/\{[\s\S]*"patterns"[\s\S]*"learnings"[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        patterns: parsed.patterns || [],
        learnings: parsed.learnings || [],
      };
    }
  } catch {
    // If parsing fails, return empty arrays
  }

  return { patterns: [], learnings: [] };
}

/**
 * Update AGENTS.md with new patterns
 */
function updateAgentsFile(agentsPath: string, patterns: string[], learnings: string[]): void {
  let content = '';

  if (existsSync(agentsPath)) {
    content = readFileSync(agentsPath, 'utf-8');
  } else {
    content = `# AGENTS.md

This file contains patterns and learnings for AI agents working on this project.

## Validation Commands

\`\`\`bash
npm run build
npm run lint
npm test
\`\`\`

`;
  }

  const timestamp = new Date().toISOString().split('T')[0];

  // Add patterns section if it doesn't exist
  if (!content.includes('## Discovered Patterns')) {
    content += '\n## Discovered Patterns\n\n';
  }

  // Add learnings section if it doesn't exist
  if (!content.includes('## Session Learnings')) {
    content += '\n## Session Learnings\n\n';
  }

  // Insert patterns
  if (patterns.length > 0) {
    const patternsSection = patterns.map((p) => `- ${p}`).join('\n');

    const patternMarker = '## Discovered Patterns';
    const patternIndex = content.indexOf(patternMarker);
    if (patternIndex !== -1) {
      const insertPoint = content.indexOf('\n', patternIndex + patternMarker.length) + 1;
      content =
        content.slice(0, insertPoint) +
        `\n### Patterns from ${timestamp}\n\n${patternsSection}\n` +
        content.slice(insertPoint);
    }
  }

  // Insert learnings
  if (learnings.length > 0) {
    const learningsSection = learnings.map((l) => `- ${l}`).join('\n');

    const learningsMarker = '## Session Learnings';
    const learningsIndex = content.indexOf(learningsMarker);
    if (learningsIndex !== -1) {
      const insertPoint = content.indexOf('\n', learningsIndex + learningsMarker.length) + 1;
      content =
        content.slice(0, insertPoint) +
        `\n### Learnings from ${timestamp}\n\n${learningsSection}\n` +
        content.slice(insertPoint);
    }
  }

  writeFileSync(agentsPath, content, 'utf-8');
}

/**
 * Archive the activity file
 */
function archiveActivityFile(activityPath: string, archiveDir: string, task?: string): string {
  if (!existsSync(archiveDir)) {
    mkdirSync(archiveDir, { recursive: true });
  }

  const content = readFileSync(activityPath, 'utf-8');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const taskSlug = task
    ? task
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .slice(0, 30)
    : 'session';

  const archiveFileName = `${timestamp}-${taskSlug}.md`;
  const archivePath = join(archiveDir, archiveFileName);

  writeFileSync(archivePath, content, 'utf-8');

  return archivePath;
}

/**
 * Main harvest command
 */
export async function harvestCommand(options: HarvestCommandOptions): Promise<void> {
  const cwd = process.cwd();

  console.log();
  console.log(chalk.cyan.bold('ralph-starter harvest'));
  console.log(chalk.dim('Knowledge Extraction and Archival'));
  console.log();

  // Resolve file paths
  const activityPath = options.activityFile || join(cwd, '.ralph', 'activity.md');
  const agentsPath = options.agentsFile || join(cwd, 'AGENTS.md');
  const archiveDir = options.archiveDir || join(cwd, '.ralph', 'archive');

  // Check if activity file exists
  if (!existsSync(activityPath)) {
    console.log(chalk.yellow('No activity file found at:'), chalk.dim(activityPath));
    console.log(chalk.dim('Run some tasks first to generate activity data.'));
    return;
  }

  // Read activity file
  const activityContent = readFileSync(activityPath, 'utf-8');
  const parsed = parseActivityFile(activityContent);

  console.log(chalk.bold('Activity Summary:'));
  if (parsed.task) {
    console.log(
      chalk.dim(`  Task: ${parsed.task.slice(0, 60)}${parsed.task.length > 60 ? '...' : ''}`)
    );
  }
  console.log(chalk.dim(`  Iterations: ${parsed.iterations.length}`));

  const completed = parsed.iterations.filter((i) => i.status.includes('Completed')).length;
  const failed = parsed.iterations.filter((i) => i.status.includes('Failed')).length;
  console.log(chalk.dim(`  Completed: ${completed}, Failed: ${failed}`));
  console.log();

  // Results tracking
  const result: HarvestResult = {
    patterns: [],
    learnings: [],
  };

  // Extract patterns (optionally)
  if (!options.skipPatterns && parsed.iterations.length > 0) {
    const detectProgress = new ProgressRenderer();
    detectProgress.start('Detecting coding agent...');
    const agent = await detectBestAgent();

    if (agent) {
      detectProgress.stop(`Using ${agent.name}`);
      console.log();

      // Read existing AGENTS.md
      const agentsContent = existsSync(agentsPath) ? readFileSync(agentsPath, 'utf-8') : '';

      // Extract patterns
      const extracted = await extractPatternsWithAgent(
        agent,
        activityContent,
        agentsContent,
        cwd,
        options
      );

      result.patterns = extracted.patterns;
      result.learnings = extracted.learnings;

      // Update AGENTS.md
      if (result.patterns.length > 0 || result.learnings.length > 0) {
        updateAgentsFile(agentsPath, result.patterns, result.learnings);
        console.log();
        console.log(chalk.green(`Updated ${agentsPath}:`));
        console.log(chalk.dim(`  Patterns: ${result.patterns.length}`));
        console.log(chalk.dim(`  Learnings: ${result.learnings.length}`));
      } else {
        console.log(chalk.dim('No new patterns or learnings to add.'));
      }
    } else {
      detectProgress.fail('No coding agent found');
      console.log(chalk.dim('Skipping pattern extraction.'));
    }
    console.log();
  }

  // Archive activity file (optionally)
  if (!options.skipArchive) {
    const archivePath = archiveActivityFile(activityPath, archiveDir, parsed.task);
    result.archivedFile = archivePath;
    console.log(chalk.green('Archived activity to:'), chalk.dim(archivePath));

    // Clear the activity file for the next session
    writeFileSync(activityPath, '', 'utf-8');
    console.log(chalk.dim('Cleared activity.md for next session.'));
    console.log();
  }

  // Summary
  console.log(chalk.green.bold('Harvest complete!'));
  console.log();

  if (result.patterns.length > 0) {
    console.log(chalk.bold('Discovered Patterns:'));
    for (const pattern of result.patterns.slice(0, 5)) {
      console.log(chalk.dim(`  - ${pattern.slice(0, 70)}${pattern.length > 70 ? '...' : ''}`));
    }
    if (result.patterns.length > 5) {
      console.log(chalk.dim(`  ... and ${result.patterns.length - 5} more`));
    }
    console.log();
  }

  if (result.learnings.length > 0) {
    console.log(chalk.bold('Key Learnings:'));
    for (const learning of result.learnings.slice(0, 5)) {
      console.log(chalk.dim(`  - ${learning.slice(0, 70)}${learning.length > 70 ? '...' : ''}`));
    }
    if (result.learnings.length > 5) {
      console.log(chalk.dim(`  ... and ${result.learnings.length - 5} more`));
    }
    console.log();
  }

  console.log(chalk.yellow('Next steps:'));
  console.log(chalk.dim('  1. Review the updated AGENTS.md'));
  console.log(chalk.dim('  2. Run: ralph-starter run [task]  # to start a new session'));
  console.log();
}
