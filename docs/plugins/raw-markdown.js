/**
 * Docusaurus plugin to serve raw markdown files
 *
 * Enables Solana-style LLM-ready docs where adding .md to any URL
 * returns the raw markdown content.
 *
 * Example: /docs/sources/figma.md -> raw markdown for figma page
 */

const fs = require('fs');
const path = require('path');

module.exports = function rawMarkdownPlugin(context, options) {
  const { siteDir } = context;
  const docsDir = options.docsDir || 'docs';

  return {
    name: 'docusaurus-plugin-raw-markdown',

    async postBuild({ outDir }) {
      const sourceDocsPath = path.join(siteDir, docsDir);
      const targetBasePath = path.join(outDir, 'docs');

      // Recursively copy markdown files
      await copyMarkdownFiles(sourceDocsPath, targetBasePath, sourceDocsPath);

      console.log('[raw-markdown] Copied markdown files for LLM access');
    },
  };
};

/**
 * Recursively copy markdown files preserving directory structure
 */
async function copyMarkdownFiles(sourceDir, targetBaseDir, rootSourceDir) {
  const entries = fs.readdirSync(sourceDir, { withFileTypes: true });

  for (const entry of entries) {
    const sourcePath = path.join(sourceDir, entry.name);

    if (entry.isDirectory()) {
      // Recurse into subdirectories
      await copyMarkdownFiles(sourcePath, targetBaseDir, rootSourceDir);
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
      let content = fs.readFileSync(sourcePath, 'utf8');

      // Remove frontmatter for cleaner output (optional - keep it for context)
      // content = content.replace(/^---[\s\S]*?---\n*/m, '');

      // Write to target
      fs.writeFileSync(targetPath, content);
    }
  }
}
