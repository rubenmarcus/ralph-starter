import { IntegrationSource } from '../base.js';
import type { SourceResult, SourceOptions } from '../types.js';

/**
 * Notion source - fetches pages and databases from Notion
 *
 * Requires integration token from: https://www.notion.so/my-integrations
 * The integration must be added to the pages/databases you want to access
 */
export class NotionSource extends IntegrationSource {
  name = 'notion';
  description = 'Fetch pages and databases from Notion';

  private readonly API_BASE = 'https://api.notion.com/v1';
  private readonly API_VERSION = '2022-06-28';

  protected getRequiredCredentialKey(): string {
    return 'token';
  }

  async fetch(identifier: string, options?: SourceOptions): Promise<SourceResult> {
    const token = await this.getApiKey();

    // identifier can be a page URL, page ID, database ID, or search query
    if (this.isNotionUrl(identifier)) {
      return this.fetchByUrl(token, identifier);
    }

    if (this.isNotionId(identifier)) {
      return this.fetchById(token, identifier);
    }

    // Treat as search query
    return this.searchNotion(token, identifier, options);
  }

  private isNotionUrl(str: string): boolean {
    return str.includes('notion.so') || str.includes('notion.site');
  }

  private isNotionId(str: string): boolean {
    // Notion IDs are 32 hex chars (with or without hyphens)
    const cleaned = str.replace(/-/g, '');
    return /^[a-f0-9]{32}$/i.test(cleaned);
  }

  private extractIdFromUrl(url: string): string {
    // Handle various Notion URL formats
    // https://notion.so/Page-Title-abc123def456...
    // https://www.notion.so/workspace/Page-Title-abc123def456...
    const match = url.match(/([a-f0-9]{32})/i);
    if (match) {
      return match[1];
    }

    // Try the last segment with potential ID
    const segments = url.split(/[-/]/);
    for (let i = segments.length - 1; i >= 0; i--) {
      const segment = segments[i].replace(/\?.*$/, '');
      if (/^[a-f0-9]{32}$/i.test(segment)) {
        return segment;
      }
    }

    throw new Error(`Could not extract Notion ID from URL: ${url}`);
  }

  private formatNotionId(id: string): string {
    // Add hyphens to Notion ID: 8-4-4-4-12
    const clean = id.replace(/-/g, '');
    return `${clean.slice(0, 8)}-${clean.slice(8, 12)}-${clean.slice(12, 16)}-${clean.slice(16, 20)}-${clean.slice(20)}`;
  }

  private async fetchByUrl(token: string, url: string): Promise<SourceResult> {
    const id = this.extractIdFromUrl(url);
    return this.fetchById(token, id);
  }

  private async fetchById(token: string, id: string): Promise<SourceResult> {
    const formattedId = this.formatNotionId(id);

    // Try as page first
    try {
      const page = await this.fetchPage(token, formattedId);
      const blocks = await this.fetchBlocks(token, formattedId);
      return this.formatPage(page, blocks);
    } catch (error) {
      // Try as database
      try {
        const database = await this.fetchDatabase(token, formattedId);
        const items = await this.queryDatabase(token, formattedId);
        return this.formatDatabase(database, items);
      } catch {
        this.error(`Could not fetch Notion page or database: ${id}`);
      }
    }
  }

  private async searchNotion(
    token: string,
    query: string,
    options?: SourceOptions
  ): Promise<SourceResult> {
    const response = await this.apiRequest(token, 'POST', '/search', {
      query,
      filter: { property: 'object', value: 'page' },
      page_size: options?.limit || 10,
    });

    const results = response.results as NotionPage[];

    if (results.length === 0) {
      return {
        content: `# Search: "${query}"\n\nNo results found.`,
        source: `notion:search:${query}`,
        title: `Search: ${query}`,
        metadata: { type: 'notion', query, results: 0 },
      };
    }

    const sections: string[] = [`# Search: "${query}"\n`];

    for (const page of results) {
      const title = this.getPageTitle(page);
      sections.push(`## ${title}\n`);

      // Fetch page content
      try {
        const blocks = await this.fetchBlocks(token, page.id);
        sections.push(this.blocksToMarkdown(blocks));
      } catch {
        sections.push('*Could not fetch page content*');
      }

      sections.push('\n---\n');
    }

    return {
      content: sections.join('\n'),
      source: `notion:search:${query}`,
      title: `Search: ${query}`,
      metadata: {
        type: 'notion',
        query,
        results: results.length,
      },
    };
  }

  private async fetchPage(token: string, id: string): Promise<NotionPage> {
    return this.apiRequest(token, 'GET', `/pages/${id}`);
  }

  private async fetchBlocks(token: string, id: string): Promise<NotionBlock[]> {
    const response = await this.apiRequest(
      token,
      'GET',
      `/blocks/${id}/children?page_size=100`
    );
    return response.results;
  }

  private async fetchDatabase(token: string, id: string): Promise<NotionDatabase> {
    return this.apiRequest(token, 'GET', `/databases/${id}`);
  }

  private async queryDatabase(token: string, id: string): Promise<NotionPage[]> {
    const response = await this.apiRequest(token, 'POST', `/databases/${id}/query`, {
      page_size: 50,
    });
    return response.results;
  }

  private async apiRequest(
    token: string,
    method: string,
    path: string,
    body?: unknown
  ): Promise<any> {
    const response = await fetch(`${this.API_BASE}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        'Notion-Version': this.API_VERSION,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      if (response.status === 401) {
        this.error(
          'Invalid Notion token. Run: ralph-starter config set notion.token <token>'
        );
      }
      if (response.status === 404) {
        throw new Error('Not found');
      }
      const error = await response.json().catch(() => ({}));
      this.error(
        `Notion API error: ${response.status} - ${(error as any).message || response.statusText}`
      );
    }

    return response.json();
  }

  private formatPage(page: NotionPage, blocks: NotionBlock[]): SourceResult {
    const title = this.getPageTitle(page);
    const content = this.blocksToMarkdown(blocks);

    return {
      content: `# ${title}\n\n${content}`,
      source: `notion:${page.id}`,
      title,
      metadata: {
        type: 'notion',
        objectType: 'page',
        id: page.id,
      },
    };
  }

  private formatDatabase(
    database: NotionDatabase,
    items: NotionPage[]
  ): SourceResult {
    const title = this.getDatabaseTitle(database);
    const sections: string[] = [`# ${title}\n`];

    if (items.length === 0) {
      sections.push('*No items in database*');
    } else {
      for (const item of items) {
        const itemTitle = this.getPageTitle(item);
        sections.push(`## ${itemTitle}\n`);

        // Extract properties
        const props = this.formatProperties(item.properties);
        if (props) {
          sections.push(props);
        }

        sections.push('');
      }
    }

    return {
      content: sections.join('\n'),
      source: `notion:${database.id}`,
      title,
      metadata: {
        type: 'notion',
        objectType: 'database',
        id: database.id,
        items: items.length,
      },
    };
  }

  private getPageTitle(page: NotionPage): string {
    const titleProp = Object.values(page.properties || {}).find(
      (p: any) => p.type === 'title'
    ) as any;

    if (titleProp?.title?.[0]?.plain_text) {
      return titleProp.title[0].plain_text;
    }

    return 'Untitled';
  }

  private getDatabaseTitle(database: NotionDatabase): string {
    if (database.title?.[0]?.plain_text) {
      return database.title[0].plain_text;
    }
    return 'Untitled Database';
  }

  private formatProperties(properties: Record<string, any>): string {
    const lines: string[] = [];

    for (const [key, prop] of Object.entries(properties)) {
      if (prop.type === 'title') continue; // Already used as heading

      const value = this.getPropertyValue(prop);
      if (value) {
        lines.push(`- **${key}**: ${value}`);
      }
    }

    return lines.join('\n');
  }

  private getPropertyValue(prop: any): string | null {
    switch (prop.type) {
      case 'rich_text':
        return prop.rich_text?.[0]?.plain_text || null;
      case 'number':
        return prop.number?.toString() || null;
      case 'select':
        return prop.select?.name || null;
      case 'multi_select':
        return prop.multi_select?.map((s: any) => s.name).join(', ') || null;
      case 'date':
        return prop.date?.start || null;
      case 'checkbox':
        return prop.checkbox ? '✓' : '✗';
      case 'url':
        return prop.url || null;
      case 'email':
        return prop.email || null;
      case 'phone_number':
        return prop.phone_number || null;
      case 'status':
        return prop.status?.name || null;
      default:
        return null;
    }
  }

  private blocksToMarkdown(blocks: NotionBlock[]): string {
    const lines: string[] = [];

    for (const block of blocks) {
      const md = this.blockToMarkdown(block);
      if (md) {
        lines.push(md);
      }
    }

    return lines.join('\n');
  }

  private blockToMarkdown(block: NotionBlock): string {
    const content = (block as any)[block.type];
    if (!content) return '';

    const text = this.richTextToPlain(content.rich_text);

    switch (block.type) {
      case 'paragraph':
        return text + '\n';
      case 'heading_1':
        return `## ${text}\n`;
      case 'heading_2':
        return `### ${text}\n`;
      case 'heading_3':
        return `#### ${text}\n`;
      case 'bulleted_list_item':
        return `- ${text}`;
      case 'numbered_list_item':
        return `1. ${text}`;
      case 'to_do':
        const checked = content.checked ? 'x' : ' ';
        return `- [${checked}] ${text}`;
      case 'toggle':
        return `<details>\n<summary>${text}</summary>\n</details>\n`;
      case 'quote':
        return `> ${text}\n`;
      case 'callout':
        const emoji = content.icon?.emoji || '💡';
        return `> ${emoji} ${text}\n`;
      case 'code':
        const lang = content.language || '';
        return `\`\`\`${lang}\n${text}\n\`\`\`\n`;
      case 'divider':
        return '---\n';
      case 'image':
        const url = content.file?.url || content.external?.url || '';
        return url ? `![Image](${url})\n` : '';
      default:
        return text ? text + '\n' : '';
    }
  }

  private richTextToPlain(richText: any[]): string {
    if (!richText) return '';
    return richText.map((t: any) => t.plain_text || '').join('');
  }

  getHelp(): string {
    return `
notion: Fetch pages and databases from Notion

Usage:
  ralph-starter run --from notion --project "page-id-or-url"
  ralph-starter run --from notion --project "search query"

Options:
  --project  Page URL, page ID, database ID, or search query
  --limit    Maximum results for search (default: 10)

Setup:
  1. Create integration at: https://www.notion.so/my-integrations
  2. Run: ralph-starter config set notion.token <token>
  3. Share pages/databases with your integration in Notion

Examples:
  ralph-starter run --from notion --project "https://notion.so/My-Spec-abc123..."
  ralph-starter run --from notion --project "Product Requirements"
  ralph-starter run --from notion --project "abc123def456789..."

Notes:
  - Pages must be shared with your integration to be accessible
  - Search only finds pages, not databases
`.trim();
  }
}

interface NotionPage {
  id: string;
  object: 'page';
  properties: Record<string, any>;
}

interface NotionDatabase {
  id: string;
  object: 'database';
  title: Array<{ plain_text: string }>;
}

interface NotionBlock {
  id: string;
  type: string;
  [key: string]: any;
}
