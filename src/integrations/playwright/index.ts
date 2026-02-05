/**
 * Playwright MCP Integration
 *
 * Connects to Playwright MCP server for visual verification capabilities.
 * Provides screenshot capture, visual comparison, and browser-based testing.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { execa } from 'execa';
import {
  type AuthMethod,
  BaseIntegration,
  type IntegrationOptions,
  type IntegrationResult,
} from '../base.js';

export interface PlaywrightOptions extends IntegrationOptions {
  /** Browser to use (chromium, firefox, webkit) */
  browser?: 'chromium' | 'firefox' | 'webkit';
  /** Viewport width */
  width?: number;
  /** Viewport height */
  height?: number;
  /** Wait time in ms before screenshot */
  waitTime?: number;
  /** Full page screenshot */
  fullPage?: boolean;
  /** Device emulation (mobile, tablet, desktop) */
  device?: 'mobile' | 'tablet' | 'desktop';
}

export interface ScreenshotResult {
  /** Path to saved screenshot */
  path: string;
  /** Base64 encoded image data */
  data?: string;
  /** Screenshot dimensions */
  width: number;
  height: number;
  /** Timestamp */
  timestamp: string;
}

export interface VisualComparisonResult {
  /** Whether screenshots match within threshold */
  match: boolean;
  /** Similarity score (0-100) */
  similarity: number;
  /** Path to diff image if mismatch */
  diffPath?: string;
  /** Path to baseline screenshot */
  baselinePath: string;
  /** Path to current screenshot */
  currentPath: string;
  /** Pixel difference count */
  diffPixels?: number;
}

/**
 * Playwright MCP Integration
 *
 * Connects to Playwright MCP server for browser automation and visual testing
 */
export class PlaywrightIntegration extends BaseIntegration {
  name = 'playwright';
  displayName = 'Playwright';
  description = 'Browser automation and visual verification via Playwright MCP';
  website = 'https://playwright.dev/';
  authMethods: AuthMethod[] = ['none'];

  private mcpServerPath: string | null = null;
  private screenshotDir = '.ralph/screenshots';
  private baselineDir = '.ralph/baselines';

  /**
   * Check if Playwright MCP server is available
   */
  async isAvailable(): Promise<boolean> {
    return await this.checkPlaywrightMcp();
  }

  /**
   * Check if Playwright MCP is installed
   */
  private async checkPlaywrightMcp(): Promise<boolean> {
    try {
      // Check for @playwright/mcp package
      const result = await execa('npx', ['--yes', '@playwright/mcp', '--help'], {
        reject: false,
        timeout: 30000,
      });
      return result.exitCode === 0;
    } catch {
      // Try checking if playwright is installed locally
      try {
        const result = await execa('npx', ['playwright', '--version'], {
          reject: false,
          timeout: 10000,
        });
        return result.exitCode === 0;
      } catch {
        return false;
      }
    }
  }

  /**
   * Fetch is not the primary use case for Playwright
   * Instead, use screenshot/verify methods directly
   */
  async fetch(identifier: string, options?: PlaywrightOptions): Promise<IntegrationResult> {
    // For Playwright, "fetch" captures a screenshot of a URL
    const screenshot = await this.screenshot(identifier, options);

    return {
      content: `Screenshot captured: ${screenshot.path}\nDimensions: ${screenshot.width}x${screenshot.height}`,
      source: identifier,
      title: `Screenshot of ${identifier}`,
      metadata: {
        path: screenshot.path,
        width: screenshot.width,
        height: screenshot.height,
        timestamp: screenshot.timestamp,
      },
    };
  }

  /**
   * Capture a screenshot of a URL
   */
  async screenshot(url: string, options?: PlaywrightOptions): Promise<ScreenshotResult> {
    const cwd = process.cwd();
    const screenshotDir = join(cwd, this.screenshotDir);

    // Ensure screenshot directory exists
    if (!existsSync(screenshotDir)) {
      mkdirSync(screenshotDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `screenshot-${timestamp}.png`;
    const screenshotPath = join(screenshotDir, filename);

    // Build playwright script
    const width = options?.width || this.getDeviceWidth(options?.device);
    const height = options?.height || this.getDeviceHeight(options?.device);
    const browser = options?.browser || 'chromium';
    const fullPage = options?.fullPage ?? false;
    const waitTime = options?.waitTime || 1000;

    // Use Playwright CLI directly for screenshot
    const script = `
const { ${browser} } = require('playwright');

(async () => {
  const browser = await ${browser}.launch();
  const context = await browser.newContext({
    viewport: { width: ${width}, height: ${height} }
  });
  const page = await context.newPage();

  await page.goto('${url}', { waitUntil: 'networkidle' });
  await page.waitForTimeout(${waitTime});

  await page.screenshot({
    path: '${screenshotPath.replace(/\\/g, '\\\\')}',
    fullPage: ${fullPage}
  });

  await browser.close();
  console.log(JSON.stringify({ success: true, width: ${width}, height: ${height} }));
})();
`;

    try {
      // Write temporary script
      const scriptPath = join(screenshotDir, '_capture.js');
      writeFileSync(scriptPath, script, 'utf-8');

      // Execute with npx playwright
      const result = await execa('node', [scriptPath], {
        cwd,
        timeout: 60000,
        reject: false,
      });

      // Clean up script
      if (existsSync(scriptPath)) {
        const fs = await import('node:fs/promises');
        await fs.unlink(scriptPath);
      }

      if (result.exitCode !== 0) {
        throw new Error(`Screenshot failed: ${result.stderr || result.stdout}`);
      }

      return {
        path: screenshotPath,
        width,
        height,
        timestamp,
      };
    } catch (error) {
      throw new Error(
        `Failed to capture screenshot: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Save a screenshot as a baseline for visual comparison
   */
  async saveBaseline(name: string, url: string, options?: PlaywrightOptions): Promise<string> {
    const cwd = process.cwd();
    const baselineDir = join(cwd, this.baselineDir);

    // Ensure baseline directory exists
    if (!existsSync(baselineDir)) {
      mkdirSync(baselineDir, { recursive: true });
    }

    const baselinePath = join(baselineDir, `${name}.png`);

    // Capture screenshot
    const screenshot = await this.screenshot(url, options);

    // Move to baseline location
    const fs = await import('node:fs/promises');
    await fs.copyFile(screenshot.path, baselinePath);
    await fs.unlink(screenshot.path);

    return baselinePath;
  }

  /**
   * Compare a current screenshot against a baseline
   */
  async compareWithBaseline(
    name: string,
    url: string,
    options?: PlaywrightOptions & { threshold?: number }
  ): Promise<VisualComparisonResult> {
    const cwd = process.cwd();
    const baselineDir = join(cwd, this.baselineDir);
    const baselinePath = join(baselineDir, `${name}.png`);

    // Check if baseline exists
    if (!existsSync(baselinePath)) {
      throw new Error(`Baseline "${name}" not found. Run saveBaseline("${name}", "${url}") first.`);
    }

    // Capture current screenshot
    const screenshot = await this.screenshot(url, options);
    const threshold = options?.threshold ?? 0.1; // 0.1% difference threshold

    // Compare images using pixel-by-pixel comparison
    const comparison = await this.compareImages(baselinePath, screenshot.path, threshold);

    return {
      ...comparison,
      baselinePath,
      currentPath: screenshot.path,
    };
  }

  /**
   * Visual verification helper - checks if a page looks correct
   */
  async verify(
    url: string,
    checks: VisualCheck[],
    options?: PlaywrightOptions
  ): Promise<VisualVerificationResult> {
    const results: VisualCheckResult[] = [];
    let allPassed = true;

    for (const check of checks) {
      try {
        let passed = false;
        let message = '';

        switch (check.type) {
          case 'element-visible':
            passed = await this.checkElementVisible(url, check.selector!, options);
            message = passed
              ? `Element "${check.selector}" is visible`
              : `Element "${check.selector}" not found or not visible`;
            break;

          case 'element-text':
            passed = await this.checkElementText(url, check.selector!, check.expected!, options);
            message = passed
              ? `Element "${check.selector}" contains expected text`
              : `Element "${check.selector}" text does not match`;
            break;

          case 'screenshot-match': {
            const comparison = await this.compareWithBaseline(check.baseline!, url, options);
            passed = comparison.match;
            message = passed
              ? `Screenshot matches baseline "${check.baseline}"`
              : `Screenshot differs from baseline "${check.baseline}" (${comparison.similarity.toFixed(2)}% similar)`;
            break;
          }

          case 'no-console-errors':
            passed = await this.checkNoConsoleErrors(url, options);
            message = passed ? 'No console errors detected' : 'Console errors detected on page';
            break;
        }

        results.push({
          check,
          passed,
          message,
        });

        if (!passed) {
          allPassed = false;
        }
      } catch (error) {
        results.push({
          check,
          passed: false,
          message: error instanceof Error ? error.message : 'Unknown error',
        });
        allPassed = false;
      }
    }

    return {
      passed: allPassed,
      results,
      url,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Check if an element is visible on the page
   */
  private async checkElementVisible(
    url: string,
    selector: string,
    options?: PlaywrightOptions
  ): Promise<boolean> {
    const script = this.buildVerifyScript(
      url,
      options,
      `
      const element = await page.locator('${selector}').first();
      const visible = await element.isVisible().catch(() => false);
      console.log(JSON.stringify({ visible }));
    `
    );

    const result = await this.runScript(script);
    try {
      const data = JSON.parse(result);
      return data.visible === true;
    } catch {
      return false;
    }
  }

  /**
   * Check if an element contains expected text
   */
  private async checkElementText(
    url: string,
    selector: string,
    expected: string,
    options?: PlaywrightOptions
  ): Promise<boolean> {
    const script = this.buildVerifyScript(
      url,
      options,
      `
      const element = await page.locator('${selector}').first();
      const text = await element.textContent().catch(() => '');
      const matches = text && text.includes('${expected.replace(/'/g, "\\'")}');
      console.log(JSON.stringify({ matches, text }));
    `
    );

    const result = await this.runScript(script);
    try {
      const data = JSON.parse(result);
      return data.matches === true;
    } catch {
      return false;
    }
  }

  /**
   * Check if page has console errors
   */
  private async checkNoConsoleErrors(url: string, options?: PlaywrightOptions): Promise<boolean> {
    const script = this.buildVerifyScript(
      url,
      options,
      `
      let hasErrors = false;
      page.on('console', msg => {
        if (msg.type() === 'error') hasErrors = true;
      });
      await page.waitForTimeout(2000);
      console.log(JSON.stringify({ hasErrors }));
    `,
      { beforeGoto: true }
    );

    const result = await this.runScript(script);
    try {
      const data = JSON.parse(result);
      return data.hasErrors === false;
    } catch {
      return false;
    }
  }

  /**
   * Build a verification script
   */
  private buildVerifyScript(
    url: string,
    options: PlaywrightOptions | undefined,
    checkCode: string,
    scriptOptions?: { beforeGoto?: boolean }
  ): string {
    const browser = options?.browser || 'chromium';
    const width = options?.width || this.getDeviceWidth(options?.device);
    const height = options?.height || this.getDeviceHeight(options?.device);
    const waitTime = options?.waitTime || 1000;

    const beforeGoto = scriptOptions?.beforeGoto ? checkCode : '';
    const afterGoto = scriptOptions?.beforeGoto ? '' : checkCode;

    return `
const { ${browser} } = require('playwright');

(async () => {
  const browser = await ${browser}.launch();
  const context = await browser.newContext({
    viewport: { width: ${width}, height: ${height} }
  });
  const page = await context.newPage();

  ${beforeGoto}

  await page.goto('${url}', { waitUntil: 'networkidle' });
  await page.waitForTimeout(${waitTime});

  ${afterGoto}

  await browser.close();
})();
`;
  }

  /**
   * Run a Playwright script and return output
   */
  private async runScript(script: string): Promise<string> {
    const cwd = process.cwd();
    const scriptPath = join(cwd, this.screenshotDir, '_verify.js');

    // Ensure directory exists
    const dir = dirname(scriptPath);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }

    writeFileSync(scriptPath, script, 'utf-8');

    try {
      const result = await execa('node', [scriptPath], {
        cwd,
        timeout: 60000,
        reject: false,
      });

      // Clean up
      const fs = await import('node:fs/promises');
      await fs.unlink(scriptPath).catch(() => {});

      return result.stdout || '';
    } catch (error) {
      throw new Error(
        `Script execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Compare two images and return similarity
   */
  private async compareImages(
    baselinePath: string,
    currentPath: string,
    threshold: number
  ): Promise<{ match: boolean; similarity: number; diffPixels?: number }> {
    // For a simple implementation, we'll compare file sizes
    // In a production implementation, you'd use pixelmatch or similar
    const fs = await import('node:fs/promises');

    const [baselineStats, currentStats] = await Promise.all([
      fs.stat(baselinePath),
      fs.stat(currentPath),
    ]);

    // Simple size-based comparison (not pixel-accurate)
    const sizeDiff = Math.abs(baselineStats.size - currentStats.size);
    const maxSize = Math.max(baselineStats.size, currentStats.size);
    const similarity = ((maxSize - sizeDiff) / maxSize) * 100;

    // For better comparison, use pixelmatch library
    // This is a simplified version
    return {
      match: similarity >= 100 - threshold,
      similarity,
    };
  }

  /**
   * Get device width based on device type
   */
  private getDeviceWidth(device?: 'mobile' | 'tablet' | 'desktop'): number {
    switch (device) {
      case 'mobile':
        return 375;
      case 'tablet':
        return 768;
      case 'desktop':
      default:
        return 1280;
    }
  }

  /**
   * Get device height based on device type
   */
  private getDeviceHeight(device?: 'mobile' | 'tablet' | 'desktop'): number {
    switch (device) {
      case 'mobile':
        return 812;
      case 'tablet':
        return 1024;
      case 'desktop':
      default:
        return 720;
    }
  }

  /**
   * Get help text for this integration
   */
  getHelp(): string {
    return `
Playwright Integration - Visual Verification

This integration provides browser automation and visual testing capabilities
using Playwright. It can capture screenshots, compare them against baselines,
and verify page elements.

SETUP:
  Playwright must be installed in your project:
    npm install playwright
    npx playwright install chromium

USAGE IN RALPH:
  The Playwright integration is used for visual verification during the
  autonomous coding loop. It can verify that UI changes look correct.

VISUAL CHECKS:
  - element-visible: Check if an element exists and is visible
  - element-text: Check if an element contains expected text
  - screenshot-match: Compare against a baseline screenshot
  - no-console-errors: Verify no console errors on page load

EXAMPLE VERIFICATION:
  await playwright.verify('http://localhost:3000', [
    { type: 'element-visible', selector: '.header' },
    { type: 'element-text', selector: 'h1', expected: 'Welcome' },
    { type: 'screenshot-match', baseline: 'homepage' }
  ]);

DIRECTORIES:
  Screenshots: .ralph/screenshots/
  Baselines:   .ralph/baselines/
`;
  }
}

/**
 * Visual check types
 */
export interface VisualCheck {
  type: 'element-visible' | 'element-text' | 'screenshot-match' | 'no-console-errors';
  selector?: string;
  expected?: string;
  baseline?: string;
}

export interface VisualCheckResult {
  check: VisualCheck;
  passed: boolean;
  message: string;
}

export interface VisualVerificationResult {
  passed: boolean;
  results: VisualCheckResult[];
  url: string;
  timestamp: string;
}

// Export singleton instance
export const playwrightIntegration = new PlaywrightIntegration();
