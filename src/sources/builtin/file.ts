import { existsSync, readFileSync, readdirSync, statSync } from 'fs';
import { resolve, extname, basename, join } from 'path';
import { BuiltinSource } from '../base.js';
import type { SourceResult, SourceOptions } from '../types.js';

/**
 * File source - reads specs from local files and directories
 *
 * Supports:
 * - Single markdown files
 * - Directories (reads all .md files)
 * - Glob patterns (basic support)
 */
export class FileSource extends BuiltinSource {
  name = 'file';
  description = 'Read specs from local files or directories';

  async isAvailable(): Promise<boolean> {
    return true; // Always available
  }

  async fetch(identifier: string, options?: SourceOptions): Promise<SourceResult> {
    const path = resolve(process.cwd(), identifier);

    if (!existsSync(path)) {
      this.error(`File or directory not found: ${identifier}`);
    }

    const stat = statSync(path);

    if (stat.isFile()) {
      return this.fetchFile(path);
    }

    if (stat.isDirectory()) {
      return this.fetchDirectory(path, options);
    }

    this.error(`Unsupported file type: ${identifier}`);
  }

  private fetchFile(filePath: string): SourceResult {
    const ext = extname(filePath).toLowerCase();
    const name = basename(filePath, ext);

    // Read file content
    const content = readFileSync(filePath, 'utf-8');

    // For non-markdown files, wrap in code block
    let markdown = content;
    if (ext !== '.md' && ext !== '.markdown') {
      const lang = this.getLangFromExt(ext);
      markdown = `# ${name}\n\n\`\`\`${lang}\n${content}\n\`\`\``;
    }

    return {
      content: markdown,
      source: filePath,
      title: name,
      metadata: {
        type: 'file',
        extension: ext,
        size: content.length,
      },
    };
  }

  private fetchDirectory(dirPath: string, options?: SourceOptions): SourceResult {
    const limit = options?.limit || 50;
    const files = readdirSync(dirPath)
      .filter((f) => {
        const ext = extname(f).toLowerCase();
        return ext === '.md' || ext === '.markdown' || ext === '.txt';
      })
      .slice(0, limit);

    if (files.length === 0) {
      this.error(`No markdown files found in directory: ${dirPath}`);
    }

    // Combine all files into one document
    const sections: string[] = [];
    const metadata: Record<string, unknown> = {
      type: 'directory',
      files: [],
    };

    for (const file of files) {
      const filePath = join(dirPath, file);
      const content = readFileSync(filePath, 'utf-8');
      const name = basename(file, extname(file));

      sections.push(`# ${name}\n\n${content}`);
      (metadata.files as string[]).push(file);
    }

    return {
      content: sections.join('\n\n---\n\n'),
      source: dirPath,
      title: basename(dirPath),
      metadata,
    };
  }

  private getLangFromExt(ext: string): string {
    const langMap: Record<string, string> = {
      '.ts': 'typescript',
      '.tsx': 'typescript',
      '.js': 'javascript',
      '.jsx': 'javascript',
      '.py': 'python',
      '.rb': 'ruby',
      '.go': 'go',
      '.rs': 'rust',
      '.java': 'java',
      '.json': 'json',
      '.yaml': 'yaml',
      '.yml': 'yaml',
      '.xml': 'xml',
      '.html': 'html',
      '.css': 'css',
      '.sql': 'sql',
      '.sh': 'bash',
      '.bash': 'bash',
      '.txt': 'text',
    };
    return langMap[ext] || 'text';
  }

  getHelp(): string {
    return `
file: Read specs from local files or directories

Usage:
  ralph-starter run --from ./path/to/spec.md
  ralph-starter run --from ./specs/

Examples:
  ralph-starter run --from requirements.md
  ralph-starter run --from ./docs/spec.md
  ralph-starter run --from specs/          # Reads all .md files

Supported formats:
  - Markdown files (.md, .markdown)
  - Text files (.txt)
  - Any text file (wrapped in code block)
`.trim();
  }
}
