import { BaseOAuthProvider } from './base.js';

/**
 * Todoist OAuth Provider
 *
 * Todoist's OAuth flow:
 * https://developer.todoist.com/guides/#oauth
 *
 * To use this, you need a Todoist OAuth application:
 * 1. Go to https://developer.todoist.com/appconsole.html
 * 2. Create a new application
 * 3. Set redirect URI to http://127.0.0.1:{port}/callback
 */
export class TodoistOAuthProvider extends BaseOAuthProvider {
  name = 'todoist';
  displayName = 'Todoist';
  authorizationUrl = 'https://todoist.com/oauth/authorize';
  tokenUrl = 'https://todoist.com/oauth/access_token';

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
