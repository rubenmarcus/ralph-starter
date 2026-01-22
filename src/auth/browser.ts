import { exec } from 'node:child_process';
import { promisify } from 'node:util';

const execAsync = promisify(exec);

/**
 * Open a URL in the user's default browser
 * Cross-platform: macOS, Linux, Windows
 */
export async function openBrowser(url: string): Promise<void> {
  const platform = process.platform;

  let command: string;

  switch (platform) {
    case 'darwin':
      // macOS
      command = `open "${url}"`;
      break;
    case 'win32':
      // Windows
      command = `start "" "${url}"`;
      break;
    default:
      // Linux and others
      command = `xdg-open "${url}"`;
      break;
  }

  try {
    await execAsync(command);
  } catch (error) {
    // Some systems don't have xdg-open, try alternatives
    if (platform === 'linux') {
      try {
        await execAsync(`sensible-browser "${url}"`);
        return;
      } catch {
        // Try one more fallback
        try {
          await execAsync(`x-www-browser "${url}"`);
          return;
        } catch {
          // Give up
        }
      }
    }
    throw new Error(
      `Failed to open browser. Please open this URL manually:\n${url}`
    );
  }
}

/**
 * Get a random available port for the OAuth callback server
 */
export function getRandomPort(): number {
  // Use ports in the ephemeral range
  return Math.floor(Math.random() * (65535 - 49152)) + 49152;
}
