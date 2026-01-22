import crypto from 'node:crypto';

/**
 * PKCE (Proof Key for Code Exchange) utilities for OAuth 2.0
 *
 * PKCE is an extension to OAuth that protects authorization codes
 * from interception attacks. It's required for public clients (like CLI apps)
 * that cannot securely store a client secret.
 *
 * Flow:
 * 1. Generate a random code_verifier
 * 2. Create code_challenge = base64url(sha256(code_verifier))
 * 3. Send code_challenge with authorization request
 * 4. Send code_verifier with token exchange request
 * 5. Server verifies sha256(code_verifier) === code_challenge
 */

export interface PKCEChallenge {
  /** Random string used to verify the token exchange */
  verifier: string;
  /** SHA256 hash of verifier, sent with auth request */
  challenge: string;
  /** Always 'S256' for SHA256 */
  method: 'S256';
}

/**
 * Generate a cryptographically random code verifier
 * Per RFC 7636: 43-128 characters, using [A-Z], [a-z], [0-9], "-", ".", "_", "~"
 */
function generateCodeVerifier(): string {
  // Generate 32 random bytes = 43 base64url characters
  const buffer = crypto.randomBytes(32);
  return base64urlEncode(buffer);
}

/**
 * Create code challenge from verifier using SHA256
 * Per RFC 7636: code_challenge = BASE64URL(SHA256(code_verifier))
 */
function createCodeChallenge(verifier: string): string {
  const hash = crypto.createHash('sha256').update(verifier).digest();
  return base64urlEncode(hash);
}

/**
 * Base64url encode (RFC 4648 Section 5)
 * Standard base64 with + → -, / → _, and no padding
 */
function base64urlEncode(buffer: Buffer): string {
  return buffer
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Generate a complete PKCE challenge
 *
 * @example
 * ```typescript
 * const pkce = generatePKCE();
 *
 * // Include in authorization URL
 * const authUrl = `https://api.example.com/oauth/authorize?` +
 *   `code_challenge=${pkce.challenge}&` +
 *   `code_challenge_method=${pkce.method}`;
 *
 * // Include in token exchange
 * const tokenResponse = await fetch('https://api.example.com/oauth/token', {
 *   method: 'POST',
 *   body: new URLSearchParams({
 *     code: authorizationCode,
 *     code_verifier: pkce.verifier,
 *   }),
 * });
 * ```
 */
export function generatePKCE(): PKCEChallenge {
  const verifier = generateCodeVerifier();
  const challenge = createCodeChallenge(verifier);

  return {
    verifier,
    challenge,
    method: 'S256',
  };
}
