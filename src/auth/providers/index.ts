export type { OAuthProvider, OAuthTokens } from './base.js';
export { BaseOAuthProvider } from './base.js';

export { NotionOAuthProvider, notionProvider } from './notion.js';
export { LinearOAuthProvider, linearProvider } from './linear.js';
export { TodoistOAuthProvider, todoistProvider } from './todoist.js';

import { notionProvider } from './notion.js';
import { linearProvider } from './linear.js';
import { todoistProvider } from './todoist.js';
import type { OAuthProvider } from './base.js';

/**
 * All available OAuth providers
 */
export const providers: Record<string, OAuthProvider> = {
  notion: notionProvider,
  linear: linearProvider,
  todoist: todoistProvider,
};

/**
 * Get a provider by name
 */
export function getProvider(name: string): OAuthProvider | undefined {
  return providers[name.toLowerCase()];
}

/**
 * Get all provider names
 */
export function getProviderNames(): string[] {
  return Object.keys(providers);
}

/**
 * Check which providers are configured (have OAuth credentials)
 */
export function getConfiguredProviders(): string[] {
  return Object.entries(providers)
    .filter(([, provider]) => {
      const p = provider as OAuthProvider & { isConfigured?: () => boolean };
      return p.isConfigured?.() ?? (provider.clientId && provider.clientSecret);
    })
    .map(([name]) => name);
}
