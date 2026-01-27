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
 * ProgressRenderer - Single-line progress display with shimmer effect
 *
 * Features:
 * - Animated spinner
 * - Shimmer text effect
 * - Elapsed time counter
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
   * Render the progress line
   */
  private render(): void {
    this.frame++;

    const spinner = getSpinner(this.frame);
    const elapsed = Date.now() - this.startTime;
    const timeStr = formatElapsed(elapsed);
    const shimmerText = applyShimmer(this.currentStep, this.frame);

    // Main line
    let line = `  ${chalk.cyan(spinner)} ${shimmerText} ${chalk.dim(timeStr)}`;

    // Sub-step on same line if present
    if (this.subStep) {
      line += chalk.dim(` - ${this.subStep}`);
    }

    // Only update if changed (reduces flicker)
    if (line !== this.lastRender) {
      process.stdout.write(`\r\x1B[K${line}`);
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

    process.stdout.write(`\r\x1B[K  ${icon} ${message} ${chalk.dim(`(${timeStr})`)}\n`);
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
