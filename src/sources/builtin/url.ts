import { BuiltinSource } from '../base.js';
import type { SourceResult, SourceOptions } from '../types.js';
import {
  detectGitHubUrl,
  parseGitHubIssue,
  parseGitHubIssueList,
  parseGitHubBlob,
  issueToMarkdown,
  issueListToMarkdown,
  fileToMarkdown,
} from './github-scraper.js';

/**
 * URL source - fetches specs from remote URLs
 *
 * Supports:
 * - Raw markdown files (GitHub raw, etc.)
 * - HTML pages (basic conversion)
 * - JSON responses
 * - GitHub issues and files (specialized parsing)
 * - Notion public pages (specialized parsing)
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

    // Check for GitHub URL - use specialized parsing
    const githubInfo = detectGitHubUrl(url);
    if (githubInfo.type && githubInfo.type !== 'raw') {
      return this.fetchGitHub(url, githubInfo, options);
    }

    // Check for Notion public page
    if (this.isNotionUrl(url)) {
      return this.fetchNotion(url, options);
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

  /**
   * Fetch and parse GitHub URLs (issues, blobs, etc.)
   */
  private async fetchGitHub(
    url: URL,
    githubInfo: { type: string | null; match: RegExpMatchArray | null },
    options?: SourceOptions
  ): Promise<SourceResult> {
    const headers: Record<string, string> = {
      'User-Agent': 'ralph-starter/0.1.0',
      Accept: 'text/html',
      ...options?.headers,
    };

    const response = await fetch(url.toString(), { headers });

    if (!response.ok) {
      this.error(`GitHub HTTP error ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();

    if (githubInfo.type === 'issue' && githubInfo.match) {
      const [, owner, repo, issueNum] = githubInfo.match;
      const issue = parseGitHubIssue(html, parseInt(issueNum, 10));
      return {
        content: issueToMarkdown(issue),
        source: url.toString(),
        title: `${issue.title} (#${issue.number})`,
        metadata: {
          type: 'github',
          format: 'issue',
          owner,
          repo,
          issueNumber: issue.number,
          state: issue.state,
        },
      };
    }

    if (githubInfo.type === 'issues' && githubInfo.match) {
      const [, owner, repo] = githubInfo.match;
      const { issues } = parseGitHubIssueList(html, owner, repo);
      return {
        content: issueListToMarkdown(issues, owner, repo),
        source: url.toString(),
        title: `Issues: ${owner}/${repo}`,
        metadata: {
          type: 'github',
          format: 'issue-list',
          owner,
          repo,
          count: issues.length,
        },
      };
    }

    if (githubInfo.type === 'blob' && githubInfo.match) {
      const [, owner, repo, branch, filepath] = githubInfo.match;
      const file = parseGitHubBlob(html, filepath);

      // For markdown files, just return the content directly
      if (file.language === 'markdown') {
        return {
          content: file.content,
          source: url.toString(),
          title: filepath,
          metadata: {
            type: 'github',
            format: 'file',
            owner,
            repo,
            branch,
            filepath,
          },
        };
      }

      return {
        content: fileToMarkdown(file),
        source: url.toString(),
        title: filepath,
        metadata: {
          type: 'github',
          format: 'file',
          owner,
          repo,
          branch,
          filepath,
          language: file.language,
        },
      };
    }

    // Fallback to basic HTML parsing
    return {
      content: this.htmlToMarkdown(html),
      source: url.toString(),
      title: this.getTitleFromUrl(url),
      metadata: {
        type: 'github',
        format: 'html',
      },
    };
  }

  /**
   * Check if URL is a Notion public page
   */
  private isNotionUrl(url: URL): boolean {
    return (
      url.hostname === 'notion.so' ||
      url.hostname === 'www.notion.so' ||
      url.hostname.endsWith('.notion.site')
    );
  }

  /**
   * Fetch and parse Notion public pages
   */
  private async fetchNotion(url: URL, options?: SourceOptions): Promise<SourceResult> {
    const headers: Record<string, string> = {
      'User-Agent': 'ralph-starter/0.1.0',
      Accept: 'text/html',
      ...options?.headers,
    };

    const response = await fetch(url.toString(), { headers });

    if (!response.ok) {
      this.error(`Notion HTTP error ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();

    // Extract title from Notion page
    const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i);
    let title = titleMatch ? titleMatch[1].trim() : 'Notion Page';
    // Clean up Notion title (remove " | Notion" suffix)
    title = title.replace(/\s*\|\s*Notion\s*$/i, '').trim();

    // Notion renders content client-side, so we get limited content from HTML
    // Look for the page content in the HTML
    const content = this.parseNotionHtml(html);

    return {
      content,
      source: url.toString(),
      title,
      metadata: {
        type: 'notion',
        format: 'public-page',
      },
    };
  }

  /**
   * Parse Notion public page HTML
   * Note: Notion uses client-side rendering, so public pages have limited HTML content
   */
  private parseNotionHtml(html: string): string {
    // Extract title
    const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i);
    let title = titleMatch ? titleMatch[1].trim() : 'Notion Page';
    title = title.replace(/\s*\|\s*Notion\s*$/i, '').trim();

    const lines: string[] = [`# ${title}`, ''];

    // Try to extract content from notion-page-content or similar
    // Notion SSR includes some content in data attributes

    // Look for preloaded content in __NEXT_DATA__ or similar
    const nextDataMatch = html.match(
      /<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/
    );
    if (nextDataMatch) {
      try {
        const data = JSON.parse(nextDataMatch[1]);
        // Navigate to page content if available
        const pageContent = this.extractNotionContent(data);
        if (pageContent) {
          lines.push(pageContent);
        }
      } catch {
        // Failed to parse JSON
      }
    }

    // Fallback: extract any visible text content
    if (lines.length <= 2) {
      // Remove scripts and styles
      let content = html;
      content = content.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
      content = content.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');

      // Try to find main content area
      const mainMatch = content.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
      if (mainMatch) {
        lines.push(this.toMarkdown(mainMatch[1], 'html'));
      }
    }

    // Add note about limitations
    if (lines.length <= 2) {
      lines.push('*Note: Notion pages are rendered client-side. For full content, use the Notion API integration.*');
      lines.push('');
      lines.push('Run `ralph-starter config set notion.token <your-token>` to enable full Notion support.');
    }

    return lines.join('\n');
  }

  /**
   * Extract content from Notion's preloaded data
   */
  private extractNotionContent(data: unknown): string | null {
    // This is a simplified extraction - Notion's data structure is complex
    // In practice, most useful content requires the API
    try {
      const props = (data as Record<string, unknown>)?.props as Record<string, unknown>;
      const pageProps = props?.pageProps as Record<string, unknown>;

      if (pageProps?.recordMap) {
        // There's page content, but it's in Notion's block format
        // Would need full Notion block parsing to extract
        return '*This page has content that requires Notion API access to fully render.*';
      }
    } catch {
      // Failed to navigate data structure
    }
    return null;
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
  # Raw markdown files
  ralph-starter run --from https://raw.githubusercontent.com/user/repo/main/SPEC.md

  # GitHub issues (no auth required for public repos!)
  ralph-starter run --from https://github.com/owner/repo/issues/123
  ralph-starter run --from https://github.com/owner/repo/issues

  # GitHub files
  ralph-starter run --from https://github.com/owner/repo/blob/main/README.md

  # Notion public pages
  ralph-starter run --from https://notion.so/My-Public-Page-abc123

  # Any web page or API
  ralph-starter run --from https://api.example.com/project/spec

Supported formats:
  - Markdown files
  - GitHub issues and files (specialized parsing)
  - Notion public pages (limited - use API for full support)
  - JSON responses (converted to markdown)
  - HTML pages (content extraction)
`.trim();
  }
}
