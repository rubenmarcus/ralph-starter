import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const DEFAULT_VERSION = '0.1.0';

let cachedVersion: string | null = null;

/**
 * Resolves the package version by walking up parent directories
 * from the compiled dist/ location to find package.json.
 */
export function getPackageVersion(): string {
  if (cachedVersion) return cachedVersion;

  const __dirname = dirname(fileURLToPath(import.meta.url));

  // Walk up from current file to find package.json
  // Handles both src/ (dev) and dist/ (built) depths
  const candidates = [
    join(__dirname, '..', 'package.json'), // src/utils/ → package.json
    join(__dirname, '..', '..', 'package.json'), // dist/utils/ → package.json
    join(__dirname, '..', '..', '..', 'package.json'), // dist/src/utils/ → package.json
  ];

  for (const candidate of candidates) {
    try {
      const pkg = JSON.parse(readFileSync(candidate, 'utf-8'));
      if (pkg.version) {
        cachedVersion = pkg.version as string;
        return cachedVersion;
      }
    } catch {
      // Try next candidate
    }
  }

  cachedVersion = DEFAULT_VERSION;
  return cachedVersion;
}
