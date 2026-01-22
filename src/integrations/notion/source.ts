/**
 * Notion Integration Source
 *
 * Fetches pages from Notion:
 * - Public pages: HTML fetch (no auth needed)
 * - Private pages: Notion API (requires token)
 */

import { BaseIntegration, type IntegrationResult, type IntegrationOptions, type AuthMethod } from '../base.js';

interface NotionPage {
  id: string;
  object: 'page';
  properties: Record<string, unknown>;
}

interface NotionDatabase {
  id: string;
  object: 'database';
  title: Array<{ plain_text: string }>;
}

interface NotionBlock {
  id: string;
  type: string;
  [key: string]: unknown;
}

export class NotionIntegration extends BaseIntegration {
  name = 'notion';
  displayName = 'Notion';
  description = 'Fetch pages from Notion (public or private)';
  website = 'https://notion.so';

  // Public pages don't need auth, private pages need API token
  authMethods: AuthMethod[] = ['none', 'api-key'];

  private readonly API_BASE = 'https://api.notion.com/v1';
  private readonly API_VERSION = '2022-06-28';

  async fetch(identifier: string, options?: IntegrationOptions): Promise<IntegrationResult> {
    // Check if it's a Notion URL
    if (this.isNotionUrl(identifier)) {
      // Try public HTML fetch first
      const publicResult = await this.fetchPublicPage(identifier);
      if (publicResult) {
        return publicResult;
      }

      // Fall back to API if we have a token
      if (await this.hasApiKey()) {
        return this.fetchViaApi(identifier, options);
      }

      this.error(
        'Could not fetch Notion page. If this is a private page, configure API token:\n' +
        'ralph-starter config set notion.token <token>'
      );
    }

    // Not a URL - try API search or direct ID
    if (await this.hasApiKey()) {
      return this.fetchViaApi(identifier, options);
    }

    this.error(
      'Please provide a Notion URL or configure API token:\n' +
      'ralph-starter config set notion.token <token>'
    );
  }

  private isNotionUrl(str: string): boolean {
    return str.includes('notion.so') || str.includes('notion.site');
  }

  /**
   * Fetch a public Notion page via HTML
   * Returns null if the page is not public
   */
  private async fetchPublicPage(url: string): Promise<IntegrationResult | null> {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'ralph-starter/0.1.0',
          Accept: 'text/html',
        },
      });

      if (!response.ok) {
        return null;
      }

      const html = await response.text();

      // Check if page requires login
      if (html.includes('notion.so/login') || html.includes('Sign in')) {
        return null;
      }

      // Extract content from HTML
      const content = this.htmlToMarkdown(html);
      const title = this.extractTitle(html);

      return {
        content: `# ${title}\n\n${content}`,
        source: `notion:${url}`,
        title,
        metadata: {
          type: 'notion',
          method: 'html',
          url,
        },
      };
    } catch {
      return null;
    }
  }

  /**
   * Convert Notion HTML to markdown
   */
  private htmlToMarkdown(html: string): string {
    // Extract main content area
    let content = html;

    // Try to find the main content div
    const contentMatch = html.match(/<div[^>]*class="[^"]*notion-page-content[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
    if (contentMatch) {
      content = contentMatch[1];
    }

    // Basic HTML to Markdown conversion
    content = content
      // Headings
      .replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, '\n# $1\n')
      .replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, '\n## $1\n')
      .replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, '\n### $1\n')
      // Paragraphs
      .replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, '\n$1\n')
      // Lists
      .replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, '- $1\n')
      .replace(/<ul[^>]*>|<\/ul>/gi, '\n')
      .replace(/<ol[^>]*>|<\/ol>/gi, '\n')
      // Links
      .replace(/<a[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, '[$2]($1)')
      // Bold and italic
      .replace(/<strong[^>]*>([\s\S]*?)<\/strong>/gi, '**$1**')
      .replace(/<b[^>]*>([\s\S]*?)<\/b>/gi, '**$1**')
      .replace(/<em[^>]*>([\s\S]*?)<\/em>/gi, '*$1*')
      .replace(/<i[^>]*>([\s\S]*?)<\/i>/gi, '*$1*')
      // Code
      .replace(/<code[^>]*>([\s\S]*?)<\/code>/gi, '`$1`')
      .replace(/<pre[^>]*>([\s\S]*?)<\/pre>/gi, '\n```\n$1\n```\n')
      // Blockquotes
      .replace(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi, '\n> $1\n')
      // Line breaks
      .replace(/<br\s*\/?>/gi, '\n')
      // Dividers
      .replace(/<hr[^>]*\/?>/gi, '\n---\n')
      // Remove remaining HTML tags
      .replace(/<[^>]+>/g, '')
      // Decode HTML entities
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      // Clean up whitespace
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    return content;
  }

  /**
   * Extract title from Notion HTML
   */
  private extractTitle(html: string): string {
    // Try og:title
    const ogMatch = html.match(/<meta[^>]*property="og:title"[^>]*content="([^"]+)"/i);
    if (ogMatch) {
      return ogMatch[1];
    }

    // Try title tag
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    if (titleMatch) {
      return titleMatch[1].replace(' | Notion', '').trim();
    }

    return 'Notion Page';
  }

  /**
   * Fetch via Notion API (for private pages or search)
   */
  private async fetchViaApi(
    identifier: string,
    options?: IntegrationOptions
  ): Promise<IntegrationResult> {
    const token = await this.getApiKey('token');

    // Check if it's a URL and extract ID
    if (this.isNotionUrl(identifier)) {
      const id = this.extractIdFromUrl(identifier);
      return this.fetchPageById(token, id);
    }

    // Check if it's a Notion ID
    if (this.isNotionId(identifier)) {
      return this.fetchPageById(token, identifier);
    }

    // Treat as search query
    return this.searchNotion(token, identifier, options);
  }

  private isNotionId(str: string): boolean {
    const cleaned = str.replace(/-/g, '');
    return /^[a-f0-9]{32}$/i.test(cleaned);
  }

  private extractIdFromUrl(url: string): string {
    const match = url.match(/([a-f0-9]{32})/i);
    if (match) {
      return match[1];
    }

    const segments = url.split(/[-/]/);
    for (let i = segments.length - 1; i >= 0; i--) {
      const segment = segments[i].replace(/\?.*$/, '');
      if (/^[a-f0-9]{32}$/i.test(segment)) {
        return segment;
      }
    }

    this.error(`Could not extract Notion ID from URL: ${url}`);
  }

  private formatNotionId(id: string): string {
    const clean = id.replace(/-/g, '');
    return `${clean.slice(0, 8)}-${clean.slice(8, 12)}-${clean.slice(12, 16)}-${clean.slice(16, 20)}-${clean.slice(20)}`;
  }

  private async fetchPageById(token: string, id: string): Promise<IntegrationResult> {
    const formattedId = this.formatNotionId(id);

    try {
      const page = await this.apiRequest(token, 'GET', `/pages/${formattedId}`) as NotionPage;
      const blocks = await this.apiRequest(token, 'GET', `/blocks/${formattedId}/children?page_size=100`);

      return this.formatPage(page, (blocks as { results: NotionBlock[] }).results);
    } catch {
      // Try as database
      try {
        const database = await this.apiRequest(token, 'GET', `/databases/${formattedId}`) as NotionDatabase;
        const items = await this.apiRequest(token, 'POST', `/databases/${formattedId}/query`, {
          page_size: 50,
        });

        return this.formatDatabase(database, (items as { results: NotionPage[] }).results);
      } catch {
        this.error(`Could not fetch Notion page or database: ${id}`);
      }
    }
  }

  private async searchNotion(
    token: string,
    query: string,
    options?: IntegrationOptions
  ): Promise<IntegrationResult> {
    const response = await this.apiRequest(token, 'POST', '/search', {
      query,
      filter: { property: 'object', value: 'page' },
      page_size: options?.limit || 10,
    }) as { results: NotionPage[] };

    const results = response.results;

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

      try {
        const blocks = await this.apiRequest(token, 'GET', `/blocks/${page.id}/children?page_size=100`);
        sections.push(this.blocksToMarkdown((blocks as { results: NotionBlock[] }).results));
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

  private async apiRequest(
    token: string,
    method: string,
    path: string,
    body?: unknown
  ): Promise<unknown> {
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
      const error = await response.json().catch(() => ({})) as { message?: string };
      this.error(
        `Notion API error: ${response.status} - ${error.message || response.statusText}`
      );
    }

    return response.json();
  }

  private formatPage(page: NotionPage, blocks: NotionBlock[]): IntegrationResult {
    const title = this.getPageTitle(page);
    const content = this.blocksToMarkdown(blocks);

    return {
      content: `# ${title}\n\n${content}`,
      source: `notion:${page.id}`,
      title,
      metadata: {
        type: 'notion',
        method: 'api',
        objectType: 'page',
        id: page.id,
      },
    };
  }

  private formatDatabase(database: NotionDatabase, items: NotionPage[]): IntegrationResult {
    const title = this.getDatabaseTitle(database);
    const sections: string[] = [`# ${title}\n`];

    if (items.length === 0) {
      sections.push('*No items in database*');
    } else {
      for (const item of items) {
        const itemTitle = this.getPageTitle(item);
        sections.push(`## ${itemTitle}\n`);

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
        method: 'api',
        objectType: 'database',
        id: database.id,
        items: items.length,
      },
    };
  }

  private getPageTitle(page: NotionPage): string {
    const titleProp = Object.values(page.properties || {}).find(
      (p: unknown) => (p as { type?: string }).type === 'title'
    ) as { title?: Array<{ plain_text: string }> } | undefined;

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

  private formatProperties(properties: Record<string, unknown>): string {
    const lines: string[] = [];

    for (const [key, prop] of Object.entries(properties)) {
      const typedProp = prop as { type?: string };
      if (typedProp.type === 'title') continue;

      const value = this.getPropertyValue(prop);
      if (value) {
        lines.push(`- **${key}**: ${value}`);
      }
    }

    return lines.join('\n');
  }

  private getPropertyValue(prop: unknown): string | null {
    const p = prop as Record<string, unknown>;
    switch (p.type) {
      case 'rich_text':
        return ((p.rich_text as Array<{ plain_text: string }>)?.[0]?.plain_text) || null;
      case 'number':
        return (p.number as number)?.toString() || null;
      case 'select':
        return (p.select as { name?: string })?.name || null;
      case 'multi_select':
        return (p.multi_select as Array<{ name: string }>)?.map((s) => s.name).join(', ') || null;
      case 'date':
        return (p.date as { start?: string })?.start || null;
      case 'checkbox':
        return p.checkbox ? '✓' : '✗';
      case 'url':
        return (p.url as string) || null;
      case 'status':
        return (p.status as { name?: string })?.name || null;
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
    const content = block[block.type] as { rich_text?: unknown[]; checked?: boolean; icon?: { emoji?: string }; language?: string; file?: { url: string }; external?: { url: string } } | undefined;
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

  private richTextToPlain(richText: unknown[] | undefined): string {
    if (!richText) return '';
    return (richText as Array<{ plain_text?: string }>).map((t) => t.plain_text || '').join('');
  }

  getHelp(): string {
    return `
notion: Fetch pages from Notion

Usage:
  ralph-starter run --from notion --project "https://notion.so/Page-Name-abc123"
  ralph-starter run --from notion --project "search query"

Options:
  --project  Page URL, page ID, or search query
  --limit    Maximum results for search (default: 10)

Authentication:

For public pages (no auth needed):
  Just provide the Notion URL - ralph-starter will fetch the HTML directly.

For private pages:
  1. Create integration at: https://www.notion.so/my-integrations
  2. Run: ralph-starter config set notion.token <token>
  3. Share pages/databases with your integration in Notion

Examples:
  # Public page (no auth)
  ralph-starter run --from notion --project "https://notion.so/Public-Docs-abc123"

  # Private page (with token)
  ralph-starter run --from notion --project "https://notion.so/Private-Spec-abc123"

  # Search (requires token)
  ralph-starter run --from notion --project "Product Requirements"

Notes:
  - Public pages are fetched via HTML (faster, no token needed)
  - Private pages require API token and sharing with integration
  - Search only finds pages, not databases
`.trim();
  }
}
