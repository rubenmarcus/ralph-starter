/**
 * Integrations Registry
 *
 * Central registry for all available integrations.
 * Add new integrations here after creating them.
 */

import type { Integration, IntegrationInfo } from './base.js';

// Import all integrations
import { GitHubIntegration } from './github/index.js';
import { LinearIntegration } from './linear/index.js';
import { NotionIntegration } from './notion/index.js';

// Re-export types
export type {
  AuthMethod,
  Integration,
  IntegrationInfo,
  IntegrationOptions,
  IntegrationResult,
} from './base.js';
export { BaseIntegration } from './base.js';

/**
 * All registered integrations
 */
const integrations: Integration[] = [
  new GitHubIntegration(),
  new LinearIntegration(),
  new NotionIntegration(),
];

/**
 * Get all registered integrations
 */
export function getAllIntegrations(): Integration[] {
  return integrations;
}

/**
 * Get an integration by name
 */
export function getIntegration(name: string): Integration | undefined {
  return integrations.find((i) => i.name === name);
}

/**
 * Get info for all integrations
 */
export async function getIntegrationsInfo(): Promise<IntegrationInfo[]> {
  return Promise.all(integrations.map((i) => i.getInfo()));
}

/**
 * Get available integrations (those with auth configured)
 */
export async function getAvailableIntegrations(): Promise<Integration[]> {
  const results = await Promise.all(
    integrations.map(async (i) => ({
      integration: i,
      available: await i.isAvailable(),
    }))
  );

  return results.filter((r) => r.available).map((r) => r.integration);
}

/**
 * Check if an integration is available
 */
export async function isIntegrationAvailable(name: string): Promise<boolean> {
  const integration = getIntegration(name);
  if (!integration) return false;
  return integration.isAvailable();
}

/**
 * Fetch from an integration by name
 */
export async function fetchFromIntegration(
  name: string,
  identifier: string,
  options?: Record<string, unknown>
): Promise<ReturnType<Integration['fetch']>> {
  const integration = getIntegration(name);
  if (!integration) {
    throw new Error(`Unknown integration: ${name}`);
  }

  return integration.fetch(identifier, options);
}

// Individual exports for direct imports
export { GitHubIntegration } from './github/index.js';
export { LinearIntegration } from './linear/index.js';
export { NotionIntegration } from './notion/index.js';
