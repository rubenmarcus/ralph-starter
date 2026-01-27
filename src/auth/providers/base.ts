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

  /** Whether this provider supports PKCE (no client secret needed) */
  supportsPKCE: boolean;

  /** Build the full authorization URL */
  buildAuthUrl(redirectUri: string, state: string, codeChallenge?: string): string;

  /** Exchange authorization code for access token */
  exchangeCode(code: string, redirectUri: string, codeVerifier?: string): Promise<OAuthTokens>;
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

  /** Override in subclass to enable PKCE flow */
  supportsPKCE = false;

  buildAuthUrl(redirectUri: string, state: string, codeChallenge?: string): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      state,
      ...this.authParams,
    });

    // Add PKCE challenge if provided
    if (codeChallenge) {
      params.set('code_challenge', codeChallenge);
      params.set('code_challenge_method', 'S256');
    }

    // Add scopes (format varies by provider)
    if (this.scopes.length > 0) {
      params.set('scope', this.scopes.join(' '));
    }

    return `${this.authorizationUrl}?${params.toString()}`;
  }

  async exchangeCode(
    code: string,
    redirectUri: string,
    codeVerifier?: string
  ): Promise<OAuthTokens> {
    // For PKCE flow, we don't need client_secret
    if (!this.supportsPKCE && !this.clientSecret) {
      throw new Error(
        `No client secret configured for ${this.displayName}. ` +
          `Set RALPH_${this.name.toUpperCase()}_CLIENT_SECRET environment variable.`
      );
    }

    const body: Record<string, string> = {
      grant_type: 'authorization_code',
      client_id: this.clientId,
      code,
      redirect_uri: redirectUri,
    };

    // Add client_secret for non-PKCE flow
    if (this.clientSecret) {
      body.client_secret = this.clientSecret;
    }

    // Add code_verifier for PKCE flow
    if (codeVerifier) {
      body.code_verifier = codeVerifier;
    }

    const response = await fetch(this.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
      },
      body: new URLSearchParams(body).toString(),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to exchange code: ${error}`);
    }

    const data = (await response.json()) as Record<string, unknown>;

    return {
      accessToken: data.access_token as string,
      refreshToken: data.refresh_token as string | undefined,
      expiresIn: data.expires_in as number | undefined,
      tokenType: (data.token_type as string) || 'Bearer',
      scope: data.scope as string | undefined,
    };
  }
}
