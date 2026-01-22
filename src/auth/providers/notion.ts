import { BaseOAuthProvider, type OAuthTokens } from './base.js';

/**
 * Notion OAuth Provider
 *
 * Notion's OAuth flow:
 * https://developers.notion.com/docs/authorization
 *
 * To use this, you need a Notion integration:
 * 1. Go to https://www.notion.so/my-integrations
 * 2. Create a new integration with OAuth enabled
 * 3. Set redirect URI to http://127.0.0.1:{port}/callback
 */
export class NotionOAuthProvider extends BaseOAuthProvider {
  name = 'notion';
  displayName = 'Notion';
  authorizationUrl = 'https://api.notion.com/v1/oauth/authorize';
  tokenUrl = 'https://api.notion.com/v1/oauth/token';

  // Notion doesn't use traditional scopes, but the owner field determines access
  scopes: string[] = [];

  // Placeholder - users need to configure their own Notion integration
  // or use ralph-starter's registered app
  clientId = process.env.RALPH_NOTION_CLIENT_ID || '';
  clientSecret = process.env.RALPH_NOTION_CLIENT_SECRET;

  authParams = {
    owner: 'user', // Request access to user's workspaces
  };

  constructor() {
    super();
    // Override clientSecret from env
    this.clientSecret = process.env.RALPH_NOTION_CLIENT_SECRET;
  }

  /**
   * Notion uses Basic auth for token exchange
   */
  async exchangeCode(code: string, redirectUri: string): Promise<OAuthTokens> {
    if (!this.clientId || !this.clientSecret) {
      throw new Error(
        'Notion OAuth not configured. Set RALPH_NOTION_CLIENT_ID and RALPH_NOTION_CLIENT_SECRET environment variables.'
      );
    }

    // Notion requires Basic auth with client_id:client_secret
    const basicAuth = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');

    const response = await fetch(this.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${basicAuth}`,
        'Notion-Version': '2022-06-28',
      },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to exchange Notion code: ${error}`);
    }

    const data = await response.json() as Record<string, unknown>;

    return {
      accessToken: data.access_token as string,
      tokenType: 'Bearer',
      // Notion tokens don't expire
    };
  }

  isConfigured(): boolean {
    return !!this.clientId && !!this.clientSecret;
  }
}

export const notionProvider = new NotionOAuthProvider();
