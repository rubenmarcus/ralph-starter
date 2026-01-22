import { BaseOAuthProvider } from './base.js';

/**
 * Todoist OAuth Provider
 *
 * Todoist's OAuth flow requires a client secret (no PKCE support).
 * For CLI apps, we recommend using manual API key configuration instead.
 *
 * https://developer.todoist.com/guides/#oauth
 *
 * Manual setup:
 * 1. Go to https://todoist.com/prefs/integrations
 * 2. Scroll to "API token" section
 * 3. Copy your API token
 * 4. Run: ralph-starter config set todoist.apiKey <token>
 */
export class TodoistOAuthProvider extends BaseOAuthProvider {
  name = 'todoist';
  displayName = 'Todoist';
  authorizationUrl = 'https://todoist.com/oauth/authorize';
  tokenUrl = 'https://todoist.com/oauth/access_token';

  // Todoist doesn't support PKCE - requires client secret
  supportsPKCE = false;

  // Todoist scopes
  scopes = [
    'data:read', // Read tasks, projects, labels, etc.
  ];

  // Placeholder - users need to configure their own Todoist app
  // or use ralph-starter's registered app
  clientId = process.env.RALPH_TODOIST_CLIENT_ID || '';
  clientSecret = process.env.RALPH_TODOIST_CLIENT_SECRET;

  constructor() {
    super();
    this.clientSecret = process.env.RALPH_TODOIST_CLIENT_SECRET;
  }

  isConfigured(): boolean {
    return !!this.clientId && !!this.clientSecret;
  }
}

export const todoistProvider = new TodoistOAuthProvider();
