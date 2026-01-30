/**
 * Input source types for ralph-starter
 *
 * Sources allow fetching specs from various locations:
 * - Built-in: files, URLs, PDFs
 * - Integrations: Todoist, Linear, Notion, GitHub
 */

/**
 * Result from fetching a source
 */
export interface SourceResult {
  /** The spec content in markdown format */
  content: string;
  /** Original source identifier */
  source: string;
  /** Optional title/name extracted from source */
  title?: string;
  /** Metadata about the fetch */
  metadata?: Record<string, unknown>;
}

/**
 * Options passed to source fetch
 */
export interface SourceOptions {
  /** Project name/ID for task app integrations */
  project?: string;
  /** Label/tag filter for task app integrations */
  label?: string;
  /** Status filter (e.g., 'open', 'in_progress') */
  status?: string;
  /** Maximum items to fetch */
  limit?: number;
  /** Custom headers for URL fetches */
  headers?: Record<string, string>;
  /** Specific issue/item number to fetch */
  issue?: number;
  /** Default repository for issues (GitHub) */
  defaultIssuesRepo?: string;
}

/**
 * Credentials for authenticated sources
 */
export interface SourceCredentials {
  apiKey?: string;
  token?: string;
  secret?: string;
  [key: string]: string | undefined;
}

/**
 * Source configuration stored in config file
 */
export interface SourceConfig {
  credentials?: SourceCredentials;
  defaults?: SourceOptions;
  enabled?: boolean;
}

/**
 * All sources configuration
 */
export interface SourcesConfig {
  sources: Record<string, SourceConfig>;
}

/**
 * Input source interface
 * All sources (builtin and integrations) implement this
 */
export interface InputSource {
  /** Unique identifier for the source */
  name: string;

  /** Human-readable description */
  description: string;

  /** Source type category */
  type: 'builtin' | 'integration';

  /**
   * Check if this source is available
   * For integrations, checks if credentials are configured
   * For builtins, checks if dependencies are available
   */
  isAvailable(): Promise<boolean>;

  /**
   * Whether this source requires authentication
   */
  requiresAuth(): boolean;

  /**
   * Fetch content from this source
   * @param identifier - Source-specific identifier (path, URL, project name, etc.)
   * @param options - Additional options for the fetch
   */
  fetch(identifier: string, options?: SourceOptions): Promise<SourceResult>;

  /**
   * Validate that credentials are configured correctly
   * Only relevant for sources that require auth
   */
  validateCredentials?(): Promise<boolean>;

  /**
   * Get help text for using this source
   */
  getHelp(): string;
}

/**
 * Source metadata for registry
 */
export interface SourceInfo {
  name: string;
  description: string;
  type: 'builtin' | 'integration';
  requiresAuth: boolean;
  available: boolean;
}
