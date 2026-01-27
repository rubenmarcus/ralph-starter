import chalk from 'chalk';

/**
 * Colors for shimmer effect - creates a flowing gradient
 */
const SHIMMER_COLORS = [chalk.white, chalk.gray, chalk.dim, chalk.gray, chalk.white];

/**
 * Apply shimmer effect to text
 * @param text The text to apply shimmer to
 * @param offset Frame offset for animation
 * @returns Colorized text with shimmer effect
 */
export function applyShimmer(text: string, offset: number): string {
  return text
    .split('')
    .map((char, i) => {
      const colorIndex = (i + offset) % SHIMMER_COLORS.length;
      return SHIMMER_COLORS[colorIndex](char);
    })
    .join('');
}

/**
 * Spinner frames for progress animation
 */
export const SPINNER_FRAMES = ['◐', '◓', '◑', '◒'];

/**
 * Get spinner frame for current animation frame
 */
export function getSpinner(frame: number): string {
  return SPINNER_FRAMES[frame % SPINNER_FRAMES.length];
}
