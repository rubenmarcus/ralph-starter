import { existsSync, readFileSync } from 'node:fs';
import { basename, resolve } from 'node:path';
import { BuiltinSource } from '../base.js';
import type { SourceOptions, SourceResult } from '../types.js';

/**
 * PDF source - extracts text from PDF documents
 *
 * Supports:
 * - Local PDF files
 * - Remote PDF URLs
 *
 * Requires: pdf-parse package
 */
export class PdfSource extends BuiltinSource {
  name = 'pdf';
  description = 'Extract specs from PDF documents';

  private pdfParse: ((buffer: Buffer) => Promise<PdfParseResult>) | null = null;

  async isAvailable(): Promise<boolean> {
    try {
      const pdfParseModule = await import('pdf-parse');
      this.pdfParse = pdfParseModule.default;
      return true;
    } catch {
      return false;
    }
  }

  async fetch(identifier: string, options?: SourceOptions): Promise<SourceResult> {
    // Ensure pdf-parse is loaded
    if (!this.pdfParse) {
      const available = await this.isAvailable();
      if (!available) {
        this.error('pdf-parse package not installed. Run: npm install pdf-parse');
      }
    }

    let buffer: Buffer;
    let source: string;
    let title: string;

    // Check if it's a URL or local file
    if (identifier.startsWith('http://') || identifier.startsWith('https://')) {
      const result = await this.fetchFromUrl(identifier, options);
      buffer = result.buffer;
      source = identifier;
      title = result.title;
    } else {
      const result = await this.fetchFromFile(identifier);
      buffer = result.buffer;
      source = result.path;
      title = result.title;
    }

    // Parse PDF
    const data = await this.pdfParse?.(buffer);

    if (!data) {
      throw new Error('PDF parsing failed - pdf-parse not available');
    }

    // Clean and format the text
    const content = this.formatPdfContent(data.text, title);

    return {
      content,
      source,
      title,
      metadata: {
        type: 'pdf',
        pages: data.numpages,
        info: data.info,
        version: data.version,
      },
    };
  }

  private async fetchFromFile(identifier: string): Promise<{
    buffer: Buffer;
    path: string;
    title: string;
  }> {
    const path = resolve(process.cwd(), identifier);

    if (!existsSync(path)) {
      this.error(`PDF file not found: ${identifier}`);
    }

    if (!path.toLowerCase().endsWith('.pdf')) {
      this.error(`Not a PDF file: ${identifier}`);
    }

    const buffer = readFileSync(path);
    const title = basename(path, '.pdf');

    return { buffer, path, title };
  }

  private async fetchFromUrl(
    url: string,
    options?: SourceOptions
  ): Promise<{ buffer: Buffer; title: string }> {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'ralph-starter/0.1.0',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      this.error(`HTTP error ${response.status}: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Try to get title from URL
    const urlObj = new URL(url);
    const pathSegments = urlObj.pathname.split('/');
    const filename = pathSegments[pathSegments.length - 1] || 'document';
    const title = filename.replace(/\.pdf$/i, '');

    return { buffer, title };
  }

  private formatPdfContent(text: string, title: string): string {
    // Clean up the text
    let cleaned = text
      // Normalize whitespace
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      // Remove excessive blank lines
      .replace(/\n{4,}/g, '\n\n\n')
      // Clean up spacing
      .replace(/[ \t]+/g, ' ')
      .trim();

    // Try to detect sections and add markdown headers
    cleaned = this.addMarkdownStructure(cleaned);

    return `# ${title}\n\n${cleaned}`;
  }

  private addMarkdownStructure(text: string): string {
    const lines = text.split('\n');
    const result: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Skip empty lines
      if (!line) {
        result.push('');
        continue;
      }

      // Detect potential headers (all caps, short, followed by content)
      if (
        line.length < 60 &&
        line === line.toUpperCase() &&
        /^[A-Z][A-Z\s\d]+$/.test(line) &&
        lines[i + 1]?.trim()
      ) {
        // Convert to title case
        const titleCase = line.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
        result.push(`\n## ${titleCase}\n`);
        continue;
      }

      // Detect numbered sections
      const numberedMatch = line.match(/^(\d+\.?\d*\.?)\s+(.+)$/);
      if (numberedMatch && line.length < 80) {
        const [, number, text] = numberedMatch;
        const depth = (number.match(/\./g) || []).length;
        const prefix = '#'.repeat(Math.min(depth + 2, 4));
        result.push(`\n${prefix} ${text}\n`);
        continue;
      }

      // Detect bullet points
      if (line.startsWith('•') || line.startsWith('-') || line.startsWith('*')) {
        result.push(`- ${line.slice(1).trim()}`);
        continue;
      }

      result.push(line);
    }

    return result.join('\n');
  }

  getHelp(): string {
    return `
pdf: Extract specs from PDF documents

Usage:
  ralph-starter run --from ./document.pdf
  ralph-starter run --from https://example.com/spec.pdf

Examples:
  ralph-starter run --from requirements.pdf
  ralph-starter run --from ./docs/PRD.pdf
  ralph-starter run --from https://company.com/api-spec.pdf

Notes:
  - Requires pdf-parse package (npm install pdf-parse)
  - Text extraction quality depends on PDF structure
  - Scanned PDFs (images) are not supported
`.trim();
  }
}

interface PdfParseResult {
  text: string;
  numpages: number;
  info: Record<string, unknown>;
  version: string;
}
