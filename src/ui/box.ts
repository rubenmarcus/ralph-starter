import chalk, { type ChalkInstance } from 'chalk';

/**
 * Get terminal width with a sensible fallback
 */
export function getTerminalWidth(): number {
  return process.stdout.columns || 80;
}

/**
 * Draw a box with box-drawing characters around content lines
 */
export function drawBox(
  lines: string[],
  options: { color?: ChalkInstance; width?: number } = {}
): string {
  const color = options.color || chalk.cyan;
  const width = options.width || Math.min(60, getTerminalWidth() - 4);
  const innerWidth = width - 2;

  const output: string[] = [];
  output.push(color(`┌${'─'.repeat(innerWidth)}┐`));

  for (const line of lines) {
    // Strip ANSI codes to measure real length
    // biome-ignore lint/suspicious/noControlCharactersInRegex: ANSI escape sequence detection requires control characters
    const stripped = line.replace(/\u001b\[[0-9;]*m/g, '');
    const padding = Math.max(0, innerWidth - stripped.length);
    output.push(color('│') + line + ' '.repeat(padding) + color('│'));
  }

  output.push(color(`└${'─'.repeat(innerWidth)}┘`));
  return output.join('\n');
}

/**
 * Draw a horizontal separator with an optional centered label
 */
export function drawSeparator(label?: string, width?: number): string {
  const w = width || Math.min(60, getTerminalWidth() - 4);

  if (!label) {
    return chalk.dim('─'.repeat(w));
  }

  const labelLen = label.length + 2; // space on each side
  const sideLen = Math.max(1, Math.floor((w - labelLen) / 2));
  const left = '─'.repeat(sideLen);
  const right = '─'.repeat(w - sideLen - labelLen);
  return chalk.dim(`${left} ${label} ${right}`);
}

/**
 * Render a progress bar
 */
export function renderProgressBar(
  current: number,
  total: number,
  options: { width?: number; label?: string } = {}
): string {
  const barWidth = options.width || 20;
  const ratio = Math.min(1, Math.max(0, current / total));
  const filled = Math.round(ratio * barWidth);
  const empty = barWidth - filled;
  const bar = `${'█'.repeat(filled)}${'░'.repeat(empty)}`;
  const info = options.label ? ` │ ${options.label}` : '';
  return `${chalk.cyan(bar)} ${current}/${total}${chalk.dim(info)}`;
}
