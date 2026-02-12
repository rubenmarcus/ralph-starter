import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

export type PackageManager = 'npm' | 'pnpm' | 'yarn' | 'bun';

/**
 * Detect the package manager used in a project directory.
 *
 * Detection priority:
 * 1. Lock file presence (most reliable — reflects actual usage)
 * 2. packageManager field in package.json (explicit declaration)
 * 3. Default: npm
 */
export function detectPackageManager(cwd: string): PackageManager {
  // Check lock files first (most reliable indicator of actual usage)
  if (existsSync(join(cwd, 'pnpm-lock.yaml'))) return 'pnpm';
  if (existsSync(join(cwd, 'yarn.lock'))) return 'yarn';
  if (existsSync(join(cwd, 'bun.lockb')) || existsSync(join(cwd, 'bun.lock'))) return 'bun';

  // Check package.json packageManager field
  const packageJsonPath = join(cwd, 'package.json');
  if (existsSync(packageJsonPath)) {
    try {
      const pkg = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
      if (pkg.packageManager) {
        const name = pkg.packageManager.split('@')[0];
        if (['pnpm', 'yarn', 'bun'].includes(name)) {
          return name as PackageManager;
        }
      }
    } catch {
      // Invalid package.json — fall through to default
    }
  }

  return 'npm';
}

/**
 * Get the run command for a package manager script.
 * For 'test', uses the shorthand (e.g., `pnpm test`).
 * For other scripts, uses `run` (e.g., `pnpm run build`).
 */
export function getRunCommand(
  pm: PackageManager,
  script: string
): { command: string; args: string[] } {
  if (script === 'test') {
    return { command: pm, args: ['test'] };
  }
  return { command: pm, args: ['run', script] };
}

/**
 * Format a run command as a display string.
 * e.g., "pnpm run build" or "bun test"
 */
export function formatRunCommand(pm: PackageManager, script: string): string {
  const { command, args } = getRunCommand(pm, script);
  return `${command} ${args.join(' ')}`;
}
