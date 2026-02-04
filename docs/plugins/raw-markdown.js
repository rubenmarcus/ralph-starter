/**
 * Docusaurus plugin to serve raw markdown files
 *
 * Enables Solana-style LLM-ready docs where adding .md to any URL
 * returns the raw markdown content.
 *
 * Also generates a JSON manifest for LLM crawlers (Firecrawl-style).
 *
 * Example: /docs/sources/figma.md -> raw markdown for figma page
 */

const fs = require('fs');
const path = require('path');

module.exports = function rawMarkdownPlugin(context, options) {
  const { siteDir, siteConfig } = context;
  const docsDir = options.docsDir || 'docs';
  const baseUrl = siteConfig.url || '';

  return {
    name: 'docusaurus-plugin-raw-markdown',

    async postBuild({ outDir }) {
      const sourceDocsPath = path.join(siteDir, docsDir);
      // Output to /docs/ folder since docs are served at /docs/*
      const targetBasePath = path.join(outDir, 'docs');

      // Collect all docs for manifest
      const docs = [];

      // Recursively copy markdown files and collect metadata
      await copyMarkdownFiles(sourceDocsPath, targetBasePath, sourceDocsPath, docs, baseUrl);

      // Generate JSON manifest
      const manifest = {
        name: siteConfig.title || 'Documentation',
        description: siteConfig.tagline || '',
        baseUrl: baseUrl,
        generatedAt: new Date().toISOString(),
        totalDocs: docs.length,
        access: {
          llmsTxt: `${baseUrl}/llms.txt`,
          llmsFullTxt: `${baseUrl}/llms-full.txt`,
          rawMarkdown: 'Add .md to any docs URL',
        },
        docs: docs.sort((a, b) => a.path.localeCompare(b.path)),
      };

      // Write manifest
      fs.writeFileSync(
        path.join(outDir, 'docs.json'),
        JSON.stringify(manifest, null, 2)
      );

      // Also create a simple URL list for easy crawling
      const urlList = docs.map(d => d.markdownUrl).join('\n');
      fs.writeFileSync(path.join(outDir, 'docs-urls.txt'), urlList);

      console.log(`[raw-markdown] Copied ${docs.length} markdown files for LLM access`);
      console.log('[raw-markdown] Generated docs.json manifest');
      console.log('[raw-markdown] Generated docs-urls.txt URL list');
    },
  };
};

/**
 * Recursively copy markdown files preserving directory structure
 */
async function copyMarkdownFiles(sourceDir, targetBaseDir, rootSourceDir, docs, baseUrl) {
  const entries = fs.readdirSync(sourceDir, { withFileTypes: true });

  for (const entry of entries) {
    const sourcePath = path.join(sourceDir, entry.name);

    if (entry.isDirectory()) {
      // Recurse into subdirectories
      await copyMarkdownFiles(sourcePath, targetBaseDir, rootSourceDir, docs, baseUrl);
    } else if (entry.name.endsWith('.md') || entry.name.endsWith('.mdx')) {
      // Calculate relative path from docs root
      const relativePath = path.relative(rootSourceDir, sourcePath);

      // Convert .mdx to .md for output
      const targetRelativePath = relativePath.replace(/\.mdx$/, '.md');
      const targetPath = path.join(targetBaseDir, targetRelativePath);

      // Ensure target directory exists
      const targetDir = path.dirname(targetPath);
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }

      // Read source file
      const content = fs.readFileSync(sourcePath, 'utf8');

      // Extract frontmatter metadata
      const metadata = extractFrontmatter(content);

      // Calculate URLs (docs served at /docs/*)
      const docPath = '/docs/' + targetRelativePath.replace(/\.md$/, '').replace(/\/index$/, '');
      const markdownPath = '/docs/' + targetRelativePath;

      // Add to docs list
      docs.push({
        title: metadata.title || formatTitle(entry.name),
        description: metadata.description || '',
        path: docPath,
        markdownUrl: baseUrl + markdownPath,
        htmlUrl: baseUrl + docPath,
        category: getCategory(relativePath),
        keywords: metadata.keywords || [],
      });

      // Write to target
      fs.writeFileSync(targetPath, content);
    }
  }
}

/**
 * Extract frontmatter from markdown content
 */
function extractFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};

  const frontmatter = {};
  const lines = match[1].split('\n');

  for (const line of lines) {
    const colonIndex = line.indexOf(':');
    if (colonIndex > 0) {
      const key = line.slice(0, colonIndex).trim();
      let value = line.slice(colonIndex + 1).trim();

      // Handle arrays like [item1, item2]
      if (value.startsWith('[') && value.endsWith(']')) {
        value = value.slice(1, -1).split(',').map(s => s.trim());
      }

      frontmatter[key] = value;
    }
  }

  return frontmatter;
}

/**
 * Format filename to title
 */
function formatTitle(filename) {
  return filename
    .replace(/\.(md|mdx)$/, '')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

/**
 * Get category from path
 */
function getCategory(relativePath) {
  const parts = relativePath.split(path.sep);
  if (parts.length > 1) {
    return parts[0].replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }
  return 'General';
}
