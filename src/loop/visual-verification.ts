/**
 * Visual Verification for the AI Coding Loop
 *
 * Integrates with Playwright to provide visual verification capabilities
 * during autonomous coding loops. Can verify UI changes, take screenshots,
 * and compare against baselines.
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import chalk from 'chalk';
import {
  PlaywrightIntegration,
  type PlaywrightOptions,
  type VisualCheck,
  type VisualVerificationResult,
} from '../integrations/playwright/index.js';

export interface VisualVerificationConfig {
  /** Enable visual verification */
  enabled: boolean;
  /** URL to verify (usually localhost dev server) */
  url?: string;
  /** List of visual checks to perform */
  checks?: VisualCheck[];
  /** Browser to use */
  browser?: 'chromium' | 'firefox' | 'webkit';
  /** Device emulation */
  device?: 'mobile' | 'tablet' | 'desktop';
  /** Wait time before screenshots */
  waitTime?: number;
  /** Viewport dimensions */
  viewport?: { width: number; height: number };
  /** Similarity threshold for screenshot comparison (0-100) */
  threshold?: number;
}

export interface VisualVerificationFeedback {
  success: boolean;
  message: string;
  details?: string;
  results?: VisualVerificationResult;
}

/**
 * Load visual verification config from AGENTS.md or ralph config
 */
export function loadVisualConfig(cwd: string): VisualVerificationConfig | null {
  // Check AGENTS.md for visual verification config
  const agentsPath = join(cwd, 'AGENTS.md');
  if (existsSync(agentsPath)) {
    const content = readFileSync(agentsPath, 'utf-8');

    // Look for visual verification section
    const visualMatch = content.match(/## Visual Verification[\s\S]*?(?=\n## |$)/i);
    if (visualMatch) {
      const section = visualMatch[0];

      // Extract URL
      const urlMatch = section.match(/url:\s*`?([^`\n]+)`?/i);
      const url = urlMatch ? urlMatch[1].trim() : undefined;

      // Extract checks
      const checks: VisualCheck[] = [];

      // Parse element-visible checks
      const visibleMatches = section.matchAll(/element-visible:\s*`([^`]+)`/gi);
      for (const match of visibleMatches) {
        checks.push({ type: 'element-visible', selector: match[1] });
      }

      // Parse element-text checks
      const textMatches = section.matchAll(/element-text:\s*`([^`]+)`\s*contains\s*"([^"]+)"/gi);
      for (const match of textMatches) {
        checks.push({
          type: 'element-text',
          selector: match[1],
          expected: match[2],
        });
      }

      // Parse screenshot-match checks
      const screenshotMatches = section.matchAll(/screenshot-match:\s*`([^`]+)`/gi);
      for (const match of screenshotMatches) {
        checks.push({ type: 'screenshot-match', baseline: match[1] });
      }

      // Parse no-console-errors
      if (section.match(/no-console-errors/i)) {
        checks.push({ type: 'no-console-errors' });
      }

      if (url || checks.length > 0) {
        return {
          enabled: true,
          url,
          checks: checks.length > 0 ? checks : undefined,
        };
      }
    }
  }

  // Check ralph config file
  const ralphConfigPath = join(cwd, '.ralph', 'config.json');
  if (existsSync(ralphConfigPath)) {
    try {
      const config = JSON.parse(readFileSync(ralphConfigPath, 'utf-8'));
      if (config.visualVerification) {
        return {
          enabled: true,
          ...config.visualVerification,
        };
      }
    } catch {
      // Invalid config
    }
  }

  return null;
}

/**
 * Run visual verification checks
 */
export async function runVisualVerification(
  cwd: string,
  config: VisualVerificationConfig
): Promise<VisualVerificationFeedback> {
  if (!config.enabled || !config.url) {
    return {
      success: true,
      message: 'Visual verification skipped (not configured)',
    };
  }

  const playwright = new PlaywrightIntegration();

  // Check if Playwright is available
  const available = await playwright.isAvailable();
  if (!available) {
    return {
      success: true,
      message: 'Visual verification skipped (Playwright not installed)',
      details: 'Install Playwright with: npm install playwright && npx playwright install',
    };
  }

  // Build options
  const options: PlaywrightOptions = {
    browser: config.browser,
    device: config.device,
    waitTime: config.waitTime,
  };

  if (config.viewport) {
    options.width = config.viewport.width;
    options.height = config.viewport.height;
  }

  // If no specific checks, just take a screenshot
  if (!config.checks || config.checks.length === 0) {
    try {
      const screenshot = await playwright.screenshot(config.url, options);
      return {
        success: true,
        message: `Screenshot captured: ${screenshot.path}`,
        details: `Dimensions: ${screenshot.width}x${screenshot.height}`,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Screenshot capture failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Run visual checks
  try {
    const result = await playwright.verify(config.url, config.checks, options);

    if (result.passed) {
      return {
        success: true,
        message: `All ${result.results.length} visual checks passed`,
        results: result,
      };
    }

    // Format failed checks
    const failed = result.results.filter((r) => !r.passed);
    const messages = failed.map((r) => `- ${r.message}`).join('\n');

    return {
      success: false,
      message: `${failed.length}/${result.results.length} visual checks failed`,
      details: messages,
      results: result,
    };
  } catch (error) {
    return {
      success: false,
      message: 'Visual verification failed',
      details: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Format visual verification feedback for agent consumption
 */
export function formatVisualFeedback(feedback: VisualVerificationFeedback): string {
  const lines: string[] = [];

  lines.push('## Visual Verification');
  lines.push('');

  if (feedback.success) {
    lines.push(`✅ ${feedback.message}`);
  } else {
    lines.push(`❌ ${feedback.message}`);
  }

  if (feedback.details) {
    lines.push('');
    lines.push('```');
    lines.push(feedback.details);
    lines.push('```');
  }

  if (feedback.results) {
    lines.push('');
    lines.push('### Check Results');
    lines.push('');

    for (const result of feedback.results.results) {
      const icon = result.passed ? '✅' : '❌';
      lines.push(`${icon} ${result.message}`);
    }
  }

  if (!feedback.success) {
    lines.push('');
    lines.push('Please fix the visual issues and try again.');
  }

  return lines.join('\n');
}

/**
 * Save visual verification state for resuming
 */
export function saveVisualState(
  cwd: string,
  state: { baselines: string[]; lastCheck?: VisualVerificationResult }
): void {
  const statePath = join(cwd, '.ralph', 'visual-state.json');
  writeFileSync(statePath, JSON.stringify(state, null, 2), 'utf-8');
}

/**
 * Load visual verification state
 */
export function loadVisualState(cwd: string): {
  baselines: string[];
  lastCheck?: VisualVerificationResult;
} | null {
  const statePath = join(cwd, '.ralph', 'visual-state.json');
  if (!existsSync(statePath)) {
    return null;
  }

  try {
    return JSON.parse(readFileSync(statePath, 'utf-8'));
  } catch {
    return null;
  }
}

/**
 * Quick visual check for use during iterations
 */
export async function quickVisualCheck(
  url: string,
  options?: { selector?: string; text?: string; device?: 'mobile' | 'tablet' | 'desktop' }
): Promise<{ passed: boolean; message: string }> {
  const playwright = new PlaywrightIntegration();

  const available = await playwright.isAvailable();
  if (!available) {
    return { passed: true, message: 'Playwright not available, skipping visual check' };
  }

  const checks: VisualCheck[] = [];

  if (options?.selector) {
    if (options.text) {
      checks.push({
        type: 'element-text',
        selector: options.selector,
        expected: options.text,
      });
    } else {
      checks.push({ type: 'element-visible', selector: options.selector });
    }
  }

  // Add no-console-errors check by default
  checks.push({ type: 'no-console-errors' });

  if (checks.length === 0) {
    return { passed: true, message: 'No visual checks configured' };
  }

  try {
    const result = await playwright.verify(url, checks, { device: options?.device });
    return {
      passed: result.passed,
      message: result.passed
        ? 'Visual checks passed'
        : `Visual checks failed: ${result.results
            .filter((r) => !r.passed)
            .map((r) => r.message)
            .join(', ')}`,
    };
  } catch (error) {
    return {
      passed: false,
      message: `Visual check error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Print visual verification status to console
 */
export function printVisualStatus(feedback: VisualVerificationFeedback): void {
  console.log();
  if (feedback.success) {
    console.log(chalk.green('  ✓'), chalk.dim('Visual:'), feedback.message);
  } else {
    console.log(chalk.red('  ✗'), chalk.dim('Visual:'), feedback.message);
    if (feedback.details) {
      console.log(chalk.dim(`    ${feedback.details.split('\n').join('\n    ')}`));
    }
  }
}
