/**
 * Unified Integration Interface
 *
 * Each integration lives in a single folder with:
 * - index.ts - Main export
 * - source.ts - Data fetching logic
 * - auth.ts - Authentication (optional, if needed)
 * - README.md - Documentation
 */

import { getSourceCredentials } from '../sources/config.js';

/**
 * Result from fetching integration data
 */
export interface IntegrationResult {
  /** The content in markdown format */
  content: string;
  /** Original source identifier */
  source: string;
  /** Optional title extracted from source */
  title?: string;
  /** Metadata about the fetch */
  metadata?: Record<string, unknown>;
}

/**
 * Options passed to integration fetch
 */
export interface IntegrationOptions {
  /** Project name/ID for filtering */
  project?: string;
  /** Label/tag filter */
  label?: string;
  /** Status filter (e.g., 'open', 'in_progress') */
  status?: string;
  /** Maximum items to fetch */
  limit?: number;
  /** Custom headers for HTTP requests */
  headers?: Record<string, string>;
}

/**
 * Authentication methods supported by integrations
 */
export type AuthMethod = 'cli' | 'api-key' | 'oauth' | 'none';

/**
 * Integration info for registry
 */
export interface IntegrationInfo {
  /** Unique identifier */
  name: string;
  /** Human-readable display name */
  displayName: string;
  /** Short description */
  description: string;
  /** Authentication methods supported */
  authMethods: AuthMethod[];
  /** Whether integration is available (auth configured) */
  available: boolean;
  /** Website URL for the service */
  website: string;
}

/**
 * Unified Integration Interface
 * All integrations (github, linear, notion, etc.) implement this
 */
export interface Integration {
  /** Unique identifier (e.g., 'github', 'linear') */
  name: string;

  /** Human-readable display name */
  displayName: string;

  /** Short description */
  description: string;

  /** Website URL */
  website: string;

  /** Supported authentication methods */
  authMethods: AuthMethod[];

  /**
   * Check if this integration is available
   * Returns true if at least one auth method works
   */
  isAvailable(): Promise<boolean>;

  /**
   * Check which auth method is currently configured
   * Returns null if none are configured
   */
  getConfiguredAuthMethod(): Promise<AuthMethod | null>;

  /**
   * Fetch data from this integration
   * @param identifier - Integration-specific identifier (repo, project, URL, etc.)
   * @param options - Additional options for the fetch
   */
  fetch(identifier: string, options?: IntegrationOptions): Promise<IntegrationResult>;

  /**
   * Get help text for using this integration
   */
  getHelp(): string;

  /**
   * Get info for registry display
   */
  getInfo(): Promise<IntegrationInfo>;
}

/**
 * Base class for integrations
 * Provides common functionality
 */
export abstract class BaseIntegration implements Integration {
  abstract name: string;
  abstract displayName: string;
  abstract description: string;
  abstract website: string;
  abstract authMethods: AuthMethod[];

  /**
   * Check if integration is available
   * Override for custom availability checks
   */
  async isAvailable(): Promise<boolean> {
    const method = await this.getConfiguredAuthMethod();
    return method !== null;
  }

  /**
   * Get which auth method is configured
   * Override in subclasses for custom logic
   */
  async getConfiguredAuthMethod(): Promise<AuthMethod | null> {
    // Check CLI first if supported
    if (this.authMethods.includes('cli') && (await this.isCliAvailable())) {
      return 'cli';
    }

    // Check API key
    if (this.authMethods.includes('api-key') && (await this.hasApiKey())) {
      return 'api-key';
    }

    // Check OAuth token
    if (this.authMethods.includes('oauth') && (await this.hasOAuthToken())) {
      return 'oauth';
    }

    // No auth needed
    if (this.authMethods.includes('none')) {
      return 'none';
    }

    return null;
  }

  /**
   * Fetch data - must be implemented by subclass
   */
  abstract fetch(identifier: string, options?: IntegrationOptions): Promise<IntegrationResult>;

  /**
   * Get help text
   */
  abstract getHelp(): string;

  /**
   * Get info for registry
   */
  async getInfo(): Promise<IntegrationInfo> {
    return {
      name: this.name,
      displayName: this.displayName,
      description: this.description,
      authMethods: this.authMethods,
      available: await this.isAvailable(),
      website: this.website,
    };
  }

  // ============================================
  // Protected helpers for subclasses
  // ============================================

  /**
   * Check if CLI tool is available
   * Override in subclasses that support CLI auth
   */
  protected async isCliAvailable(): Promise<boolean> {
    return false;
  }

  /**
   * Check if API key is configured
   */
  protected async hasApiKey(): Promise<boolean> {
    const creds = await this.getCredentials();
    return !!(creds?.apiKey || creds?.token);
  }

  /**
   * Check if OAuth token is stored
   */
  protected async hasOAuthToken(): Promise<boolean> {
    const creds = await this.getCredentials();
    return !!(creds?.accessToken);
  }

  /**
   * Get credentials from config
   */
  protected async getCredentials(): Promise<Record<string, string | undefined> | null> {
    return getSourceCredentials(this.name);
  }

  /**
   * Get API key from credentials
   * @param key - The credential key to get (default: 'apiKey')
   */
  protected async getApiKey(key = 'apiKey'): Promise<string> {
    const creds = await this.getCredentials();
    const value = creds?.[key] || creds?.token || creds?.apiKey;

    if (!value) {
      throw new Error(
        `[${this.name}] No ${key} configured. Run: ralph-starter config set ${this.name}.${key} <value>`
      );
    }

    return value;
  }

  /**
   * Create a standardized error message
   */
  protected error(message: string): never {
    throw new Error(`[${this.name}] ${message}`);
  }
}
