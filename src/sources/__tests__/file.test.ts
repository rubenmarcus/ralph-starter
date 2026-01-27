import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FileSource } from '../builtin/file.js';

// Mock fs
vi.mock('fs', () => ({
  existsSync: vi.fn(),
  readFileSync: vi.fn(),
  readdirSync: vi.fn(),
  statSync: vi.fn(),
}));

const mockExistsSync = vi.mocked(existsSync);
const mockReadFileSync = vi.mocked(readFileSync);
const mockReaddirSync = vi.mocked(readdirSync);
const mockStatSync = vi.mocked(statSync);

describe('FileSource', () => {
  let source: FileSource;

  beforeEach(() => {
    vi.clearAllMocks();
    source = new FileSource();
  });

  describe('isAvailable', () => {
    it('should always return true', async () => {
      const available = await source.isAvailable();
      expect(available).toBe(true);
    });
  });

  describe('fetch - single file', () => {
    beforeEach(() => {
      mockExistsSync.mockReturnValue(true);
      mockStatSync.mockReturnValue({ isFile: () => true, isDirectory: () => false } as any);
    });

    it('should read markdown file as-is', async () => {
      mockReadFileSync.mockReturnValue('# My Spec\n\nDescription here');

      const result = await source.fetch('spec.md');

      expect(result.content).toBe('# My Spec\n\nDescription here');
      expect(result.metadata?.extension).toBe('.md');
    });

    it('should wrap non-markdown files in code blocks', async () => {
      mockReadFileSync.mockReturnValue('const x = 1;');

      const result = await source.fetch('code.ts');

      expect(result.content).toContain('```typescript');
      expect(result.content).toContain('const x = 1;');
      expect(result.content).toContain('```');
    });

    it('should detect language from extension', async () => {
      const testCases = [
        { ext: 'code.ts', lang: 'typescript' },
        { ext: 'code.js', lang: 'javascript' },
        { ext: 'code.py', lang: 'python' },
        { ext: 'code.go', lang: 'go' },
        { ext: 'code.json', lang: 'json' },
      ];

      for (const { ext, lang } of testCases) {
        mockReadFileSync.mockReturnValue('content');

        const result = await source.fetch(ext);

        expect(result.content).toContain(`\`\`\`${lang}`);
      }
    });

    it('should include file metadata', async () => {
      mockReadFileSync.mockReturnValue('content');

      const result = await source.fetch('test.md');

      expect(result.metadata?.type).toBe('file');
      expect(result.metadata?.size).toBe(7); // 'content'.length
    });

    it('should throw when file does not exist', async () => {
      mockExistsSync.mockReturnValue(false);

      await expect(source.fetch('nonexistent.md')).rejects.toThrow('File or directory not found');
    });
  });

  describe('fetch - directory', () => {
    beforeEach(() => {
      mockExistsSync.mockReturnValue(true);
      mockStatSync.mockReturnValue({ isFile: () => false, isDirectory: () => true } as any);
    });

    it('should read all markdown files in directory', async () => {
      mockReaddirSync.mockReturnValue(['spec1.md', 'spec2.md', 'other.js'] as any);
      mockReadFileSync
        .mockReturnValueOnce('# Spec 1\nContent 1')
        .mockReturnValueOnce('# Spec 2\nContent 2');

      const result = await source.fetch('specs/');

      expect(result.content).toContain('Spec 1');
      expect(result.content).toContain('Spec 2');
      expect(result.content).not.toContain('other.js');
    });

    it('should include text files', async () => {
      mockReaddirSync.mockReturnValue(['readme.txt', 'notes.md'] as any);
      mockReadFileSync.mockReturnValueOnce('Text content').mockReturnValueOnce('Markdown content');

      const result = await source.fetch('docs/');

      expect(result.content).toContain('Text content');
      expect(result.content).toContain('Markdown content');
    });

    it('should respect limit option', async () => {
      mockReaddirSync.mockReturnValue(['a.md', 'b.md', 'c.md', 'd.md', 'e.md'] as any);
      mockReadFileSync.mockReturnValue('content');

      const result = await source.fetch('specs/', { limit: 2 });

      // Should only include 2 files
      expect((result.metadata?.files as string[]).length).toBe(2);
    });

    it('should throw when directory has no markdown files', async () => {
      mockReaddirSync.mockReturnValue(['file.js', 'file.ts'] as any);

      await expect(source.fetch('src/')).rejects.toThrow('No markdown files found');
    });

    it('should combine files with separators', async () => {
      mockReaddirSync.mockReturnValue(['a.md', 'b.md'] as any);
      mockReadFileSync.mockReturnValueOnce('Content A').mockReturnValueOnce('Content B');

      const result = await source.fetch('specs/');

      expect(result.content).toContain('---');
    });

    it('should include directory metadata', async () => {
      mockReaddirSync.mockReturnValue(['a.md'] as any);
      mockReadFileSync.mockReturnValue('content');

      const result = await source.fetch('specs/');

      expect(result.metadata?.type).toBe('directory');
      expect(result.metadata?.files).toContain('a.md');
    });
  });

  describe('getHelp', () => {
    it('should return help text', () => {
      const help = source.getHelp();

      expect(help).toContain('file');
      expect(help).toContain('.md');
      expect(help).toContain('Markdown');
    });
  });
});
