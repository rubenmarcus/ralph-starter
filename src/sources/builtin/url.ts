import { BuiltinSource } from '../base.js';
import type { SourceResult, SourceOptions } from '../types.js';

/**
 * URL source - fetches specs from remote URLs
 *
 * Supports:
 * - Raw markdown files (GitHub raw, etc.)
 * - HTML pages (basic conversion)
 * - JSON responses
 */
export class UrlSource extends BuiltinSource {
  name = 'url';
  description = 'Fetch specs from remote URLs';

  async isAvailable(): Promise<boolean> {
    return true; // Always available
  }

  async fetch(identifier: string, options?: SourceOptions): Promise<SourceResult> {
    // Validate URL
    let url: URL;
    try {
      url = new URL(identifier);
    } catch {
      this.error(`Invalid URL: ${identifier}`);
    }

    // Fetch content
    const headers: Record<string, string> = {
      'User-Agent': 'ralph-starter/0.1.0',
      Accept: 'text/plain, text/markdown, text/html, application/json',
      ...options?.headers,
    };

    const response = await fetch(identifier, { headers });

    if (!response.ok) {
      this.error(`HTTP error ${response.status}: ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type') || '';
    const content = await response.text();

    // Determine format and convert if needed
    let markdown: string;
    let format: string;

    if (this.isMarkdown(identifier, contentType)) {
      markdown = content;
      format = 'markdown';
    } else if (contentType.includes('application/json')) {
      markdown = this.jsonToMarkdown(content, url.pathname);
      format = 'json';
    } else if (contentType.includes('text/html')) {
      markdown = this.htmlToMarkdown(content);
      format = 'html';
    } else {
      // Assume plain text/markdown
      markdown = content;
      format = 'text';
    }

    return {
      content: markdown,
      source: identifier,
      title: this.getTitleFromUrl(url),
      metadata: {
        type: 'url',
        contentType,
        format,
        statusCode: response.status,
      },
    };
  }

  private isMarkdown(url: string, contentType: string): boolean {
    const mdExtensions = ['.md', '.markdown', '.mdown', '.mkd'];
    const lowerUrl = url.toLowerCase();

    // Check URL extension
    if (mdExtensions.some((ext) => lowerUrl.endsWith(ext))) {
      return true;
    }

    // Check content type
    if (
      contentType.includes('text/markdown') ||
      contentType.includes('text/x-markdown')
    ) {
      return true;
    }

    // Check for raw GitHub URLs
    if (lowerUrl.includes('raw.githubusercontent.com')) {
      return true;
    }

    return false;
  }

  private jsonToMarkdown(content: string, pathname: string): string {
    try {
      const obj = JSON.parse(content);
      const name = pathname.split('/').pop() || 'data';

      // Try to extract meaningful content
      if (Array.isArray(obj)) {
        return this.arrayToMarkdown(obj, name);
      }

      if (typeof obj === 'object') {
        return this.objectToMarkdown(obj, name);
      }

      return `# ${name}\n\n\`\`\`json\n${JSON.stringify(obj, null, 2)}\n\`\`\``;
    } catch {
      return `\`\`\`json\n${content}\n\`\`\``;
    }
  }

  private arrayToMarkdown(arr: unknown[], name: string): string {
    const lines: string[] = [`# ${name}`, ''];

    for (const item of arr.slice(0, 50)) {
      if (typeof item === 'object' && item !== null) {
        const obj = item as Record<string, unknown>;
        const title = obj.title || obj.name || obj.summary || 'Item';
        const desc = obj.description || obj.body || obj.content || '';

        lines.push(`## ${title}`);
        if (desc) {
          lines.push('', String(desc));
        }
        lines.push('');
      } else {
        lines.push(`- ${item}`);
      }
    }

    return lines.join('\n');
  }

  private objectToMarkdown(obj: Record<string, unknown>, name: string): string {
    const lines: string[] = [`# ${name}`, ''];

    // Try to find main content fields
    const contentFields = ['description', 'body', 'content', 'text', 'readme'];
    const titleFields = ['title', 'name', 'summary'];

    let title = name;
    for (const field of titleFields) {
      if (obj[field] && typeof obj[field] === 'string') {
        title = String(obj[field]);
        break;
      }
    }

    lines[0] = `# ${title}`;

    for (const field of contentFields) {
      if (obj[field] && typeof obj[field] === 'string') {
        lines.push(String(obj[field]), '');
      }
    }

    // Add other fields as details
    const otherFields = Object.entries(obj).filter(
      ([k]) => !contentFields.includes(k) && !titleFields.includes(k)
    );

    if (otherFields.length > 0) {
      lines.push('## Details', '');
      for (const [key, value] of otherFields) {
        if (typeof value === 'string' || typeof value === 'number') {
          lines.push(`- **${key}**: ${value}`);
        }
      }
    }

    return lines.join('\n');
  }

  private htmlToMarkdown(html: string): string {
    // Extract title
    const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : 'Document';

    // Try to find main content
    let content = html;

    // Remove script and style tags
    content = content.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
    content = content.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');

    // Try to find article or main content
    const articleMatch = content.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
    const mainMatch = content.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
    const bodyMatch = content.match(/<body[^>]*>([\s\S]*?)<\/body>/i);

    content = articleMatch?.[1] || mainMatch?.[1] || bodyMatch?.[1] || content;

    // Convert common HTML to markdown
    const markdown = this.toMarkdown(content, 'html');

    return `# ${title}\n\n${markdown}`;
  }

  private getTitleFromUrl(url: URL): string {
    // Try to get a meaningful title from the URL
    const pathname = url.pathname;
    const segments = pathname.split('/').filter(Boolean);

    if (segments.length === 0) {
      return url.hostname;
    }

    // Get the last segment and clean it up
    const lastSegment = segments[segments.length - 1];
    return lastSegment
      .replace(/\.(md|markdown|html|json)$/i, '')
      .replace(/[-_]/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }

  getHelp(): string {
    return `
url: Fetch specs from remote URLs

Usage:
  ralph-starter run --from https://example.com/spec.md
  ralph-starter run --from <url>

Examples:
  ralph-starter run --from https://raw.githubusercontent.com/user/repo/main/SPEC.md
  ralph-starter run --from https://api.example.com/project/spec
  ralph-starter run --from https://notion.so/page (limited support)

Supported formats:
  - Markdown files
  - JSON responses (converted to markdown)
  - HTML pages (basic extraction)
`.trim();
  }
}
