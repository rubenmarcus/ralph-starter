/**
 * Source registry and factory
 *
 * Manages all available input sources and provides methods to:
 * - List available sources
 * - Get source by name
 * - Auto-detect source from identifier
 * - Fetch content from any source
 */

// Built-in sources
import { FileSource } from './builtin/file.js';
import { PdfSource } from './builtin/pdf.js';
import { UrlSource } from './builtin/url.js';
// Integration sources
import { GitHubSource } from './integrations/github.js';
import { LinearSource } from './integrations/linear.js';
import { NotionSource } from './integrations/notion.js';
import { TodoistSource } from './integrations/todoist.js';
import type { InputSource, SourceInfo, SourceOptions, SourceResult } from './types.js';

/**
 * All registered sources
 */
const sources: Map<string, InputSource> = new Map();

/**
 * Initialize all sources
 */
function initializeSources(): void {
  if (sources.size > 0) return;

  // Register builtin sources
  const builtins = [new FileSource(), new UrlSource(), new PdfSource()];

  for (const source of builtins) {
    sources.set(source.name, source);
  }

  // Register integration sources
  const integrations = [
    new GitHubSource(),
    new TodoistSource(),
    new LinearSource(),
    new NotionSource(),
  ];

  for (const source of integrations) {
    sources.set(source.name, source);
  }
}

/**
 * Get a source by name
 */
export function getSource(name: string): InputSource | null {
  initializeSources();
  return sources.get(name) || null;
}

/**
 * Get all registered sources
 */
export function getAllSources(): InputSource[] {
  initializeSources();
  return Array.from(sources.values());
}

/**
 * Get source info for all sources
 */
export async function getSourcesInfo(): Promise<SourceInfo[]> {
  initializeSources();

  const info: SourceInfo[] = [];

  for (const source of sources.values()) {
    info.push({
      name: source.name,
      description: source.description,
      type: source.type,
      requiresAuth: source.requiresAuth(),
      available: await source.isAvailable(),
    });
  }

  return info;
}

/**
 * Auto-detect the appropriate source from an identifier
 */
export function detectSource(identifier: string): InputSource | null {
  initializeSources();

  // Check for explicit source prefix (e.g., "github:owner/repo")
  // But NOT URL schemes like http:// or https://
  const prefixMatch = identifier.match(/^([a-z]+):/i);
  if (prefixMatch && !identifier.startsWith('http://') && !identifier.startsWith('https://')) {
    const sourceName = prefixMatch[1].toLowerCase();
    return sources.get(sourceName) || null;
  }

  // Auto-detect from identifier format
  const lowerIdentifier = identifier.toLowerCase();

  // URL detection
  if (identifier.startsWith('http://') || identifier.startsWith('https://')) {
    // Check for specific service URLs
    if (lowerIdentifier.includes('github.com')) {
      return sources.get('github') || null;
    }
    if (lowerIdentifier.includes('notion.so') || lowerIdentifier.includes('notion.site')) {
      return sources.get('notion') || null;
    }
    if (lowerIdentifier.includes('linear.app')) {
      return sources.get('linear') || null;
    }
    if (lowerIdentifier.includes('todoist.com')) {
      return sources.get('todoist') || null;
    }

    // Check for PDF URLs
    if (lowerIdentifier.endsWith('.pdf')) {
      return sources.get('pdf') || null;
    }

    // Default to URL source
    return sources.get('url') || null;
  }

  // Local file detection
  if (
    identifier.startsWith('./') ||
    identifier.startsWith('/') ||
    identifier.startsWith('../') ||
    identifier.includes('/') ||
    lowerIdentifier.endsWith('.md') ||
    lowerIdentifier.endsWith('.txt') ||
    lowerIdentifier.endsWith('.pdf')
  ) {
    // PDF files
    if (lowerIdentifier.endsWith('.pdf')) {
      return sources.get('pdf') || null;
    }

    // Other files
    return sources.get('file') || null;
  }

  // No match - could be a project name for integrations
  return null;
}

/**
 * Fetch content from any source
 *
 * @param sourceOrIdentifier - Source name or auto-detectable identifier
 * @param identifierOrOptions - Identifier (if source given) or options
 * @param options - Additional options
 */
export async function fetchFromSource(
  sourceOrIdentifier: string,
  identifierOrOptions?: string | SourceOptions,
  options?: SourceOptions
): Promise<SourceResult> {
  initializeSources();

  let source: InputSource | null;
  let identifier: string;
  let fetchOptions: SourceOptions | undefined;

  // Determine if first arg is source name or identifier
  const explicitSource = sources.get(sourceOrIdentifier.toLowerCase());

  if (explicitSource && typeof identifierOrOptions === 'string') {
    // First arg is source name
    source = explicitSource;
    identifier = identifierOrOptions;
    fetchOptions = options;
  } else {
    // First arg is identifier, auto-detect source
    identifier = sourceOrIdentifier;
    source = detectSource(identifier);
    fetchOptions = typeof identifierOrOptions === 'object' ? identifierOrOptions : options;

    // Strip source prefix if present
    const prefixMatch = identifier.match(/^([a-z]+):/i);
    if (prefixMatch) {
      identifier = identifier.slice(prefixMatch[0].length);
    }
  }

  if (!source) {
    throw new Error(
      `Could not determine source for: ${sourceOrIdentifier}. ` +
        `Use --from <source> to specify explicitly.`
    );
  }

  // Check if source is available
  const available = await source.isAvailable();
  if (!available) {
    if (source.requiresAuth()) {
      throw new Error(
        `Source "${source.name}" requires authentication. ` +
          `Run: ralph-starter config set ${source.name}.apiKey <value>`
      );
    }
    throw new Error(`Source "${source.name}" is not available.`);
  }

  return source.fetch(identifier, fetchOptions);
}

/**
 * Get help text for a specific source
 */
export function getSourceHelp(name: string): string | null {
  initializeSources();
  const source = sources.get(name);
  return source?.getHelp() || null;
}

/**
 * Test if a source's credentials are valid
 */
export async function testSource(name: string): Promise<{
  success: boolean;
  message: string;
}> {
  initializeSources();

  const source = sources.get(name);
  if (!source) {
    return { success: false, message: `Unknown source: ${name}` };
  }

  const available = await source.isAvailable();
  if (!available) {
    if (source.requiresAuth()) {
      return {
        success: false,
        message: `Not configured. Run: ralph-starter config set ${name}.apiKey <value>`,
      };
    }
    return { success: false, message: 'Source dependencies not available' };
  }

  if (source.validateCredentials) {
    const valid = await source.validateCredentials();
    if (!valid) {
      return { success: false, message: 'Credentials validation failed' };
    }
  }

  return { success: true, message: 'Source is available and configured' };
}

// Re-export types
export type { InputSource, SourceInfo, SourceOptions, SourceResult } from './types.js';
