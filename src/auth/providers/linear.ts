import { BaseOAuthProvider } from './base.js';

/**
 * Linear OAuth Provider
 *
 * Linear's OAuth flow:
 * https://developers.linear.app/docs/oauth/authentication
 *
 * To use this, you need a Linear OAuth application:
 * 1. Go to https://linear.app/settings/api
 * 2. Create a new OAuth application
 * 3. Set redirect URI to http://127.0.0.1:{port}/callback
 */
export class LinearOAuthProvider extends BaseOAuthProvider {
  name = 'linear';
  displayName = 'Linear';
  authorizationUrl = 'https://linear.app/oauth/authorize';
  tokenUrl = 'https://api.linear.app/oauth/token';

  // Linear scopes
  scopes = [
    'read', // Read access to all resources
    'issues:create', // Create issues (needed for creating from specs)
  ];

  // Placeholder - users need to configure their own Linear OAuth app
  // or use ralph-starter's registered app
  clientId = process.env.RALPH_LINEAR_CLIENT_ID || '';
  clientSecret = process.env.RALPH_LINEAR_CLIENT_SECRET;

  authParams = {
    prompt: 'consent', // Always show consent screen
  };

  constructor() {
    super();
    this.clientSecret = process.env.RALPH_LINEAR_CLIENT_SECRET;
  }

  isConfigured(): boolean {
    return !!this.clientId && !!this.clientSecret;
  }
}

export const linearProvider = new LinearOAuthProvider();
