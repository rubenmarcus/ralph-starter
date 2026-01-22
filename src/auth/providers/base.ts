/**
 * OAuth Provider Configuration
 */
export interface OAuthProvider {
  /** Provider name (e.g., 'notion', 'linear', 'todoist') */
  name: string;

  /** Human-readable display name */
  displayName: string;

  /** OAuth authorization endpoint */
  authorizationUrl: string;

  /** OAuth token exchange endpoint */
  tokenUrl: string;

  /** Required OAuth scopes */
  scopes: string[];

  /** Client ID for the OAuth app (ralph-starter's registered app) */
  clientId: string;

  /** Client secret for the OAuth app (set via env var for security) */
  clientSecret?: string;

  /** Additional authorization URL parameters */
  authParams?: Record<string, string>;

  /** Build the full authorization URL */
  buildAuthUrl(redirectUri: string, state: string): string;

  /** Exchange authorization code for access token */
  exchangeCode(code: string, redirectUri: string): Promise<OAuthTokens>;
}

export interface OAuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
  tokenType: string;
  scope?: string;
}

/**
 * Base class for OAuth providers
 */
export abstract class BaseOAuthProvider implements OAuthProvider {
  abstract name: string;
  abstract displayName: string;
  abstract authorizationUrl: string;
  abstract tokenUrl: string;
  abstract scopes: string[];
  abstract clientId: string;
  clientSecret?: string;
  authParams?: Record<string, string>;

  buildAuthUrl(redirectUri: string, state: string): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      state,
      ...this.authParams,
    });

    // Add scopes (format varies by provider)
    if (this.scopes.length > 0) {
      params.set('scope', this.scopes.join(' '));
    }

    return `${this.authorizationUrl}?${params.toString()}`;
  }

  async exchangeCode(code: string, redirectUri: string): Promise<OAuthTokens> {
    if (!this.clientSecret) {
      throw new Error(
        `No client secret configured for ${this.displayName}. ` +
        `Set RALPH_${this.name.toUpperCase()}_CLIENT_SECRET environment variable.`
      );
    }

    const response = await fetch(this.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: this.clientId,
        client_secret: this.clientSecret,
        code,
        redirect_uri: redirectUri,
      }).toString(),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to exchange code: ${error}`);
    }

    const data = await response.json() as Record<string, unknown>;

    return {
      accessToken: data.access_token as string,
      refreshToken: data.refresh_token as string | undefined,
      expiresIn: data.expires_in as number | undefined,
      tokenType: (data.token_type as string) || 'Bearer',
      scope: data.scope as string | undefined,
    };
  }
}
