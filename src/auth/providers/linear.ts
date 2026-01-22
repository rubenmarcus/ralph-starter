import { BaseOAuthProvider } from './base.js';

/**
 * Linear OAuth Provider with PKCE Support
 *
 * Linear supports PKCE (Proof Key for Code Exchange) which allows
 * public clients (like CLI apps) to authenticate without a client secret.
 *
 * Linear's OAuth flow:
 * https://developers.linear.app/docs/oauth/authentication
 *
 * To configure ralph-starter's Linear OAuth app:
 * 1. Go to https://linear.app/settings/api/applications
 * 2. Create a new OAuth application
 * 3. Set redirect URI to http://127.0.0.1:52847/callback
 * 4. Copy the Client ID and set RALPH_LINEAR_CLIENT_ID env var
 */
export class LinearOAuthProvider extends BaseOAuthProvider {
  name = 'linear';
  displayName = 'Linear';
  authorizationUrl = 'https://linear.app/oauth/authorize';
  tokenUrl = 'https://api.linear.app/oauth/token';

  // Linear supports PKCE - no client secret needed!
  supportsPKCE = true;

  // Linear scopes
  scopes = [
    'read', // Read access to all resources
  ];

  // Client ID - can be set via env var or use placeholder
  // TODO: Replace with ralph-starter's registered app client ID after registration
  clientId = process.env.RALPH_LINEAR_CLIENT_ID || '';

  // Client secret is optional with PKCE
  clientSecret = process.env.RALPH_LINEAR_CLIENT_SECRET;

  authParams = {
    prompt: 'consent', // Always show consent screen
    actor: 'user', // Act as the authorizing user
  };

  /**
   * Check if Linear OAuth is configured
   * With PKCE, we only need the client_id (no secret required)
   */
  isConfigured(): boolean {
    return !!this.clientId;
  }
}

export const linearProvider = new LinearOAuthProvider();
