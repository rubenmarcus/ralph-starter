import { getSourceCredentials } from './config.js';
import type { InputSource, SourceCredentials, SourceOptions, SourceResult } from './types.js';

/**
 * Abstract base class for input sources
 * Provides common functionality for all source implementations
 */
export abstract class BaseSource implements InputSource {
  abstract name: string;
  abstract description: string;
  abstract type: 'builtin' | 'integration';

  /**
   * Check if this source is available
   * Override in subclasses for custom availability checks
   */
  async isAvailable(): Promise<boolean> {
    if (this.requiresAuth()) {
      const creds = await this.getCredentials();
      return creds !== null && Object.keys(creds).length > 0;
    }
    return true;
  }

  /**
   * Whether this source requires authentication
   * Override in subclasses that need auth
   */
  requiresAuth(): boolean {
    return false;
  }

  /**
   * Fetch content from this source
   * Must be implemented by subclasses
   */
  abstract fetch(identifier: string, options?: SourceOptions): Promise<SourceResult>;

  /**
   * Get help text for using this source
   * Override in subclasses for custom help
   */
  getHelp(): string {
    return `${this.name}: ${this.description}`;
  }

  /**
   * Get credentials for this source from config
   */
  protected async getCredentials(): Promise<SourceCredentials | null> {
    return getSourceCredentials(this.name);
  }

  /**
   * Validate that credentials work
   * Override in subclasses that need auth
   */
  async validateCredentials(): Promise<boolean> {
    if (!this.requiresAuth()) {
      return true;
    }
    const creds = await this.getCredentials();
    return creds !== null && (creds.apiKey !== undefined || creds.token !== undefined);
  }

  /**
   * Convert content to markdown if needed
   * Helper for sources that fetch non-markdown content
   */
  protected toMarkdown(content: string, format?: 'text' | 'html' | 'json'): string {
    if (!format || format === 'text') {
      return content;
    }

    if (format === 'html') {
      // Basic HTML to markdown conversion
      return content
        .replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n')
        .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n')
        .replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n')
        .replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n')
        .replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n')
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<[^>]+>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .trim();
    }

    if (format === 'json') {
      try {
        const obj = JSON.parse(content);
        return `\`\`\`json\n${JSON.stringify(obj, null, 2)}\n\`\`\``;
      } catch {
        return content;
      }
    }

    return content;
  }

  /**
   * Create a standardized error message
   */
  protected error(message: string): never {
    throw new Error(`[${this.name}] ${message}`);
  }
}

/**
 * Base class for builtin sources (file, url, pdf)
 */
export abstract class BuiltinSource extends BaseSource {
  type: 'builtin' = 'builtin';

  requiresAuth(): boolean {
    return false;
  }
}

/**
 * Base class for integration sources (todoist, linear, notion, github)
 */
export abstract class IntegrationSource extends BaseSource {
  type: 'integration' = 'integration';

  requiresAuth(): boolean {
    return true;
  }

  /**
   * Get the required credential key name
   * Override in subclasses
   */
  protected getRequiredCredentialKey(): string {
    return 'apiKey';
  }

  /**
   * Get the API key for this integration
   */
  protected async getApiKey(): Promise<string> {
    const creds = await this.getCredentials();
    const key = this.getRequiredCredentialKey();

    if (!creds || !creds[key]) {
      this.error(`No ${key} configured. Run: ralph-starter config set ${this.name}.${key} <value>`);
    }

    return creds[key] as string;
  }
}
