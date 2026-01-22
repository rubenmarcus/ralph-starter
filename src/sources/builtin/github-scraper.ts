/**
 * GitHub HTML Scraper
 *
 * Parses GitHub pages to extract content without requiring authentication.
 * Handles:
 * - Single issues: /owner/repo/issues/123
 * - Issue lists: /owner/repo/issues
 * - File blobs: /owner/repo/blob/branch/path
 * - README pages: /owner/repo (extracts readme)
 */

export interface GitHubIssue {
  number: number;
  title: string;
  body: string;
  state: 'open' | 'closed';
  labels: string[];
  author: string;
  createdAt: string;
  comments: GitHubComment[];
}

export interface GitHubComment {
  author: string;
  body: string;
  createdAt: string;
}

export interface GitHubFile {
  path: string;
  content: string;
  language?: string;
}

/**
 * Detect if a URL is a GitHub URL and what type
 */
export function detectGitHubUrl(
  url: URL
): { type: 'issue' | 'issues' | 'blob' | 'repo' | 'raw' | null; match: RegExpMatchArray | null } {
  if (url.hostname !== 'github.com' && url.hostname !== 'raw.githubusercontent.com') {
    return { type: null, match: null };
  }

  // Raw file - already handled well by URL source
  if (url.hostname === 'raw.githubusercontent.com') {
    return { type: 'raw', match: null };
  }

  const pathname = url.pathname;

  // Single issue: /owner/repo/issues/123
  const issueMatch = pathname.match(/^\/([^/]+)\/([^/]+)\/issues\/(\d+)\/?$/);
  if (issueMatch) {
    return { type: 'issue', match: issueMatch };
  }

  // Issue list: /owner/repo/issues
  const issuesMatch = pathname.match(/^\/([^/]+)\/([^/]+)\/issues\/?$/);
  if (issuesMatch) {
    return { type: 'issues', match: issuesMatch };
  }

  // File blob: /owner/repo/blob/branch/path
  const blobMatch = pathname.match(/^\/([^/]+)\/([^/]+)\/blob\/([^/]+)\/(.+)$/);
  if (blobMatch) {
    return { type: 'blob', match: blobMatch };
  }

  // Repository root: /owner/repo
  const repoMatch = pathname.match(/^\/([^/]+)\/([^/]+)\/?$/);
  if (repoMatch) {
    return { type: 'repo', match: repoMatch };
  }

  return { type: null, match: null };
}

/**
 * Parse a single GitHub issue page
 */
export function parseGitHubIssue(html: string, issueNumber: number): GitHubIssue {
  // Extract title
  const titleMatch = html.match(
    /<bdi class="js-issue-title[^"]*"[^>]*>([^<]+)<\/bdi>/
  );
  const title = titleMatch ? decodeHtmlEntities(titleMatch[1].trim()) : `Issue #${issueNumber}`;

  // Extract state (open/closed)
  const stateOpen = html.includes('State State--open') || html.includes('status-open');
  const state = stateOpen ? 'open' : 'closed';

  // Extract author
  const authorMatch = html.match(
    /class="author[^"]*"[^>]*>([^<]+)<\/a>/
  );
  const author = authorMatch ? authorMatch[1].trim() : 'unknown';

  // Extract labels
  const labels: string[] = [];
  const labelRegex = /IssueLabel[^>]*>([^<]+)<\/span>/g;
  let labelMatch;
  while ((labelMatch = labelRegex.exec(html)) !== null) {
    labels.push(decodeHtmlEntities(labelMatch[1].trim()));
  }

  // Extract issue body
  const bodyMatch = html.match(
    /class="edit-comment-hide"[^>]*>[\s\S]*?<td[^>]*class="[^"]*comment-body[^"]*"[^>]*>([\s\S]*?)<\/td>/
  );
  let body = '';
  if (bodyMatch) {
    body = htmlToMarkdown(bodyMatch[1]);
  }

  // Extract created date
  const dateMatch = html.match(
    /<relative-time[^>]*datetime="([^"]+)"[^>]*>/
  );
  const createdAt = dateMatch ? dateMatch[1] : '';

  // Extract comments
  const comments = parseGitHubComments(html);

  return {
    number: issueNumber,
    title,
    body,
    state,
    labels,
    author,
    createdAt,
    comments,
  };
}

/**
 * Parse comments from a GitHub issue page
 */
function parseGitHubComments(html: string): GitHubComment[] {
  const comments: GitHubComment[] = [];

  // Find all comment bodies (skip the first one which is the issue body)
  const commentRegex =
    /class="timeline-comment[^"]*"[\s\S]*?<a[^>]*class="author[^"]*"[^>]*>([^<]+)<\/a>[\s\S]*?<relative-time[^>]*datetime="([^"]+)"[\s\S]*?<td[^>]*class="[^"]*comment-body[^"]*"[^>]*>([\s\S]*?)<\/td>/g;

  let match;
  let isFirst = true;
  while ((match = commentRegex.exec(html)) !== null) {
    // Skip the first match (issue body)
    if (isFirst) {
      isFirst = false;
      continue;
    }

    comments.push({
      author: match[1].trim(),
      createdAt: match[2],
      body: htmlToMarkdown(match[3]),
    });
  }

  return comments;
}

/**
 * Parse GitHub issue list page
 */
export function parseGitHubIssueList(
  html: string,
  owner: string,
  repo: string
): { issues: Partial<GitHubIssue>[]; hasMore: boolean } {
  const issues: Partial<GitHubIssue>[] = [];

  // Find issue rows
  const issueRegex =
    /<a[^>]*id="issue_(\d+)_link"[^>]*href="[^"]*"[^>]*>([^<]+)<\/a>/g;

  let match;
  while ((match = issueRegex.exec(html)) !== null) {
    issues.push({
      number: parseInt(match[1], 10),
      title: decodeHtmlEntities(match[2].trim()),
    });
  }

  // Check for pagination
  const hasMore = html.includes('next_page') || html.includes('pagination');

  return { issues, hasMore };
}

/**
 * Parse GitHub file blob page
 */
export function parseGitHubBlob(html: string, filepath: string): GitHubFile {
  // Try to find raw content in the page
  // GitHub includes the raw content in a data attribute or script
  let content = '';

  // Method 1: Look for raw-blob-content
  const blobMatch = html.match(
    /<div[^>]*class="[^"]*blob-code-content[^"]*"[^>]*>([\s\S]*?)<\/div>/
  );
  if (blobMatch) {
    content = extractCodeFromBlob(blobMatch[1]);
  }

  // Method 2: Look for data-plain attribute
  if (!content) {
    const plainMatch = html.match(/data-plain="([^"]*)"/);
    if (plainMatch) {
      content = decodeHtmlEntities(plainMatch[1]);
    }
  }

  // Method 3: Extract line by line from blob-code elements
  if (!content) {
    const lines: string[] = [];
    const lineRegex = /<td[^>]*class="[^"]*blob-code[^"]*"[^>]*>([\s\S]*?)<\/td>/g;
    let lineMatch;
    while ((lineMatch = lineRegex.exec(html)) !== null) {
      lines.push(extractTextFromHtml(lineMatch[1]));
    }
    if (lines.length > 0) {
      content = lines.join('\n');
    }
  }

  // Detect language from file extension
  const ext = filepath.split('.').pop()?.toLowerCase() || '';
  const languageMap: Record<string, string> = {
    js: 'javascript',
    ts: 'typescript',
    py: 'python',
    rb: 'ruby',
    go: 'go',
    rs: 'rust',
    java: 'java',
    md: 'markdown',
    json: 'json',
    yaml: 'yaml',
    yml: 'yaml',
  };

  return {
    path: filepath,
    content,
    language: languageMap[ext] || ext,
  };
}

/**
 * Convert a GitHub issue to markdown
 */
export function issueToMarkdown(issue: GitHubIssue): string {
  const lines: string[] = [];

  // Title with state badge
  const stateBadge = issue.state === 'open' ? '🟢 Open' : '🔴 Closed';
  lines.push(`# ${issue.title}`);
  lines.push('');
  lines.push(`**Issue #${issue.number}** | ${stateBadge} | by @${issue.author}`);

  if (issue.labels.length > 0) {
    lines.push(`**Labels:** ${issue.labels.join(', ')}`);
  }

  if (issue.createdAt) {
    lines.push(`**Created:** ${new Date(issue.createdAt).toLocaleDateString()}`);
  }

  lines.push('');
  lines.push('---');
  lines.push('');

  // Body
  if (issue.body) {
    lines.push(issue.body);
    lines.push('');
  }

  // Comments
  if (issue.comments.length > 0) {
    lines.push('---');
    lines.push('');
    lines.push('## Comments');
    lines.push('');

    for (const comment of issue.comments) {
      lines.push(`### @${comment.author}`);
      if (comment.createdAt) {
        lines.push(`*${new Date(comment.createdAt).toLocaleDateString()}*`);
      }
      lines.push('');
      lines.push(comment.body);
      lines.push('');
    }
  }

  return lines.join('\n');
}

/**
 * Convert a GitHub file to markdown
 */
export function fileToMarkdown(file: GitHubFile): string {
  const lines: string[] = [];

  lines.push(`# ${file.path}`);
  lines.push('');

  // If it's already markdown, just include it
  if (file.language === 'markdown') {
    lines.push(file.content);
  } else {
    // Wrap in code block
    lines.push(`\`\`\`${file.language || ''}`);
    lines.push(file.content);
    lines.push('```');
  }

  return lines.join('\n');
}

/**
 * Convert issue list to markdown
 */
export function issueListToMarkdown(
  issues: Partial<GitHubIssue>[],
  owner: string,
  repo: string
): string {
  const lines: string[] = [];

  lines.push(`# Issues: ${owner}/${repo}`);
  lines.push('');

  for (const issue of issues) {
    const link = `https://github.com/${owner}/${repo}/issues/${issue.number}`;
    lines.push(`- [#${issue.number}](${link}) ${issue.title}`);
  }

  return lines.join('\n');
}

// Helper functions

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#(\d+);/g, (_, num) => String.fromCharCode(parseInt(num, 10)));
}

function htmlToMarkdown(html: string): string {
  return html
    // Code blocks
    .replace(/<pre[^>]*><code[^>]*>([\s\S]*?)<\/code><\/pre>/gi, '\n```\n$1\n```\n')
    // Inline code
    .replace(/<code[^>]*>(.*?)<\/code>/gi, '`$1`')
    // Headers
    .replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n')
    .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n')
    .replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n')
    .replace(/<h4[^>]*>(.*?)<\/h4>/gi, '#### $1\n')
    // Paragraphs
    .replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, '$1\n\n')
    // Lists
    .replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, '- $1\n')
    .replace(/<ul[^>]*>|<\/ul>|<ol[^>]*>|<\/ol>/gi, '\n')
    // Links
    .replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)')
    // Bold
    .replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**')
    .replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**')
    // Italic
    .replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*')
    .replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*')
    // Line breaks
    .replace(/<br\s*\/?>/gi, '\n')
    // Remove remaining tags
    .replace(/<[^>]+>/g, '')
    // Decode entities
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    // Clean up whitespace
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function extractCodeFromBlob(html: string): string {
  // Remove span tags but keep content
  return html
    .replace(/<span[^>]*>/g, '')
    .replace(/<\/span>/g, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim();
}

function extractTextFromHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim();
}
