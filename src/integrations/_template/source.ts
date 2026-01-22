/**
 * Template Integration Source
 *
 * This file contains the main data fetching logic.
 * Rename this class and update all the properties.
 */

import { BaseIntegration, type IntegrationResult, type IntegrationOptions, type AuthMethod } from '../base.js';

export class TemplateIntegration extends BaseIntegration {
  // ============================================
  // Required properties - update these
  // ============================================

  name = 'template';
  displayName = 'Template Service';
  description = 'Fetch data from Template Service';
  website = 'https://example.com';

  // Supported auth methods: 'cli' | 'api-key' | 'oauth' | 'none'
  authMethods: AuthMethod[] = ['api-key'];

  // ============================================
  // Optional: CLI authentication
  // ============================================

  /**
   * Check if CLI tool is available and authenticated
   * Only implement if authMethods includes 'cli'
   */
  protected async isCliAvailable(): Promise<boolean> {
    // Example: Check if a CLI is installed and authenticated
    // try {
    //   const { execa } = await import('execa');
    //   await execa('your-cli', ['auth', 'status']);
    //   return true;
    // } catch {
    //   return false;
    // }
    return false;
  }

  // ============================================
  // Main fetch method
  // ============================================

  async fetch(identifier: string, options?: IntegrationOptions): Promise<IntegrationResult> {
    // Get authentication
    const authMethod = await this.getConfiguredAuthMethod();

    if (!authMethod) {
      this.error('No authentication configured. Run: ralph-starter config set template.apiKey <key>');
    }

    // Fetch data based on auth method
    if (authMethod === 'cli') {
      return this.fetchViaCli(identifier, options);
    }

    return this.fetchViaApi(identifier, options);
  }

  /**
   * Fetch via CLI tool
   */
  private async fetchViaCli(
    identifier: string,
    options?: IntegrationOptions
  ): Promise<IntegrationResult> {
    // Example implementation:
    // const { execa } = await import('execa');
    // const result = await execa('your-cli', ['list', identifier, '--json']);
    // const data = JSON.parse(result.stdout);
    // return this.formatResults(data);

    throw new Error('CLI fetch not implemented');
  }

  /**
   * Fetch via API
   */
  private async fetchViaApi(
    identifier: string,
    options?: IntegrationOptions
  ): Promise<IntegrationResult> {
    const apiKey = await this.getApiKey();

    // Example: Make API request
    const response = await fetch(`https://api.example.com/data/${identifier}`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        this.error('Invalid API key. Run: ralph-starter config set template.apiKey <key>');
      }
      this.error(`API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return this.formatResults(data as Record<string, unknown>[], identifier);
  }

  /**
   * Format API results to markdown
   */
  private formatResults(data: Record<string, unknown>[], identifier: string): IntegrationResult {
    const sections: string[] = [`# ${identifier}\n`];

    // Format your data here
    sections.push('*Add your formatting logic*');

    return {
      content: sections.join('\n'),
      source: `template:${identifier}`,
      title: identifier,
      metadata: {
        type: 'template',
        count: data.length,
      },
    };
  }

  // ============================================
  // Help text
  // ============================================

  getHelp(): string {
    return `
template: Fetch data from Template Service

Usage:
  ralph-starter run --from template --project "project-name"

Options:
  --project  Project name or identifier
  --label    Filter by label (optional)
  --limit    Maximum items to fetch (default: 20)

Setup:
  1. Get API key from: https://example.com/settings/api
  2. Run: ralph-starter config set template.apiKey <key>

Examples:
  ralph-starter run --from template --project "my-project"
`.trim();
  }
}
