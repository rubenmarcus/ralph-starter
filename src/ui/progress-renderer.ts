import chalk from 'chalk';
import { applyShimmer, getSpinner } from './shimmer.js';

/**
 * Format elapsed time in human-readable format
 */
export function formatElapsed(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  if (seconds >= 60) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  }
  return `${seconds}s`;
}

/**
 * ProgressRenderer - Single-line progress display with progress bar
 *
 * Features:
 * - Animated spinner
 * - Readable text (subtle pulse)
 * - Progress bar with iteration tracking
 * - Elapsed time counter
 * - Live cost display
 * - Dynamic step updates
 * - Sub-step indicator
 */
export class ProgressRenderer {
  private frame = 0;
  private startTime = Date.now();
  private currentStep = '';
  private subStep = '';
  private interval: NodeJS.Timeout | null = null;
  private lastRender = '';
  private lastStepUpdate = 0;
  private minStepInterval = 500; // ms - debounce step updates
  private currentIteration = 0;
  private maxIterations = 0;
  private currentCost = 0;

  /**
   * Start the progress renderer
   * @param initialStep Initial step text to display
   */
  start(initialStep: string): void {
    this.currentStep = initialStep;
    this.startTime = Date.now();
    this.frame = 0;
    this.subStep = '';

    // Render immediately, then every 100ms
    this.render();
    this.interval = setInterval(() => this.render(), 100);
  }

  /**
   * Update iteration progress for the progress bar
   */
  updateProgress(iteration: number, maxIterations: number, cost?: number): void {
    this.currentIteration = iteration;
    this.maxIterations = maxIterations;
    if (cost !== undefined) {
      this.currentCost = cost;
    }
  }

  /**
   * Update the main step text (debounced to prevent rapid switching)
   */
  updateStep(step: string): void {
    const now = Date.now();
    // Only update if different from current and enough time has passed
    if (step && step !== this.currentStep && now - this.lastStepUpdate >= this.minStepInterval) {
      this.currentStep = step;
      this.subStep = '';
      this.lastStepUpdate = now;
    }
  }

  /**
   * Update the sub-step text (shown below main step)
   */
  updateSubStep(subStep: string): void {
    if (subStep && subStep !== this.subStep) {
      this.subStep = subStep;
    }
  }

  /**
   * Render the progress line(s)
   */
  private render(): void {
    this.frame++;

    const spinner = getSpinner(this.frame);
    const elapsed = Date.now() - this.startTime;
    const timeStr = formatElapsed(elapsed);
    const shimmerText = applyShimmer(this.currentStep, this.frame);

    // Main line: spinner + step + time
    let line = `  ${chalk.cyan(spinner)} ${shimmerText} ${chalk.dim(timeStr)}`;

    // Sub-step on same line if present
    if (this.subStep) {
      line += chalk.dim(` - ${this.subStep}`);
    }

    // Progress bar line (if iteration info is available)
    if (this.maxIterations > 0) {
      const barWidth = 16;
      const ratio = Math.min(1, this.currentIteration / this.maxIterations);
      const filled = Math.round(ratio * barWidth);
      const empty = barWidth - filled;
      const bar = `${'█'.repeat(filled)}${'░'.repeat(empty)}`;
      const costStr = this.currentCost > 0 ? ` │ $${this.currentCost.toFixed(2)}` : '';
      line += `\n    ${chalk.cyan(bar)} ${chalk.dim(`${this.currentIteration}/${this.maxIterations}${costStr}`)}`;
    }

    // Only update if changed (reduces flicker)
    if (line !== this.lastRender) {
      // Clear current line(s) and write
      const lineCount = this.maxIterations > 0 ? 2 : 1;
      const clearUp = lineCount > 1 ? `\x1B[${lineCount - 1}A\r\x1B[J` : '\r\x1B[K';
      // On first render, don't try to go up
      const clear = this.lastRender ? clearUp : '\r\x1B[K';
      process.stdout.write(`${clear}${line}`);
      this.lastRender = line;
    }
  }

  /**
   * Stop the renderer and show completion message
   */
  stop(finalMessage?: string, success = true): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }

    const elapsed = Date.now() - this.startTime;
    const timeStr = formatElapsed(elapsed);
    const icon = success ? chalk.green('✓') : chalk.red('✗');
    const message = finalMessage || this.currentStep;
    const costStr = this.currentCost > 0 ? chalk.dim(` ~$${this.currentCost.toFixed(2)}`) : '';

    // Clear progress bar line if present
    if (this.maxIterations > 0 && this.lastRender) {
      process.stdout.write('\x1B[1A\r\x1B[J');
    } else {
      process.stdout.write('\r\x1B[K');
    }

    process.stdout.write(`  ${icon} ${message} ${chalk.dim(`(${timeStr})`)}${costStr}\n`);
    this.lastRender = '';
  }

  /**
   * Stop with error
   */
  fail(errorMessage?: string): void {
    this.stop(errorMessage || this.currentStep, false);
  }
}

/**
 * Create a simple progress renderer for one-off operations
 */
export function createProgress(initialStep: string): ProgressRenderer {
  const renderer = new ProgressRenderer();
  renderer.start(initialStep);
  return renderer;
}
