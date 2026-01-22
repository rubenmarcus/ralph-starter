/**
 * Template OAuth Provider (Optional)
 *
 * Only needed if your integration uses OAuth authentication.
 * Delete this file if using API key or CLI authentication.
 *
 * To set up OAuth:
 * 1. Register an OAuth app with the service
 * 2. Get Client ID (and Client Secret if not using PKCE)
 * 3. Configure redirect URI: http://127.0.0.1:52847/callback
 */

import { BaseOAuthProvider } from '../../auth/providers/base.js';

export class TemplateOAuthProvider extends BaseOAuthProvider {
  name = 'template';
  displayName = 'Template Service';

  // OAuth endpoints - update for your service
  authorizationUrl = 'https://example.com/oauth/authorize';
  tokenUrl = 'https://api.example.com/oauth/token';

  // Required scopes
  scopes = ['read'];

  // Client ID from environment variable
  clientId = process.env.RALPH_TEMPLATE_CLIENT_ID || '';

  // Client secret (optional if using PKCE)
  clientSecret = process.env.RALPH_TEMPLATE_CLIENT_SECRET;

  // Set to true if the service supports PKCE (no client secret needed)
  supportsPKCE = false;

  // Additional auth URL parameters (optional)
  authParams = {
    // prompt: 'consent',
  };

  /**
   * Check if OAuth is configured
   */
  isConfigured(): boolean {
    if (this.supportsPKCE) {
      return !!this.clientId;
    }
    return !!this.clientId && !!this.clientSecret;
  }
}

export const templateProvider = new TemplateOAuthProvider();
