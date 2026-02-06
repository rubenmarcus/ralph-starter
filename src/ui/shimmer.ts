import chalk from 'chalk';

/**
 * Apply a subtle pulse effect to text - alternates between white and cyan
 * Much more readable than the old per-character shimmer
 * @param text The text to display
 * @param offset Frame offset for animation
 * @returns Colorized text
 */
export function applyShimmer(text: string, offset: number): string {
  // Slow pulse: switch color every ~20 frames (~2 seconds at 100ms interval)
  const phase = Math.floor(offset / 20) % 2;
  return phase === 0 ? chalk.white(text) : chalk.cyan(text);
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
