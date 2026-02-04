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

      // Generate AI-optimized index for RAG systems
      const aiIndex = generateAIIndex(docs, siteConfig, baseUrl);
      fs.writeFileSync(
        path.join(outDir, 'ai-index.json'),
        JSON.stringify(aiIndex, null, 2)
      );

      // Generate sidebar hierarchy as JSON
      const sidebarJson = generateSidebarJson(docs, baseUrl);
      fs.writeFileSync(
        path.join(outDir, 'sidebar.json'),
        JSON.stringify(sidebarJson, null, 2)
      );

      console.log(`[raw-markdown] Copied ${docs.length} markdown files for LLM access`);
      console.log('[raw-markdown] Generated docs.json manifest');
      console.log('[raw-markdown] Generated docs-urls.txt URL list');
      console.log('[raw-markdown] Generated ai-index.json for RAG systems');
      console.log('[raw-markdown] Generated sidebar.json hierarchy');
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

/**
 * Generate AI-optimized index for RAG systems
 * Structured for easy chunking and retrieval
 */
function generateAIIndex(docs, siteConfig, baseUrl) {
  // Group docs by category
  const categories = {};
  for (const doc of docs) {
    if (!categories[doc.category]) {
      categories[doc.category] = [];
    }
    categories[doc.category].push({
      title: doc.title,
      description: doc.description,
      url: doc.htmlUrl,
      markdownUrl: doc.markdownUrl,
      keywords: doc.keywords,
    });
  }

  // Define key topics and concepts for AI understanding
  const topics = [
    {
      name: 'Getting Started',
      description: 'Installation and initial setup of ralph-starter',
      entryPoints: ['/docs/intro', '/docs/installation'],
    },
    {
      name: 'Interactive Wizard',
      description: 'AI-powered wizard for generating specs from natural language',
      entryPoints: ['/docs/wizard/overview', '/docs/wizard/idea-mode'],
    },
    {
      name: 'Integrations',
      description: 'Connect external tools like Figma, GitHub, Linear, and Notion',
      entryPoints: ['/docs/sources/overview'],
    },
    {
      name: 'MCP Server',
      description: 'Model Context Protocol integration for Claude Desktop',
      entryPoints: ['/docs/mcp/setup', '/docs/mcp/claude-desktop'],
    },
    {
      name: 'CLI Commands',
      description: 'Command-line interface reference for all ralph-starter commands',
      entryPoints: ['/docs/cli/run', '/docs/cli/init', '/docs/cli/plan'],
    },
    {
      name: 'Advanced Usage',
      description: 'Ralph playbooks, validation, and git automation',
      entryPoints: ['/docs/advanced/ralph-playbook', '/docs/advanced/validation'],
    },
  ];

  return {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    name: siteConfig.title || 'ralph-starter Documentation',
    description: siteConfig.tagline || 'AI-powered autonomous coding tool',
    url: baseUrl,
    version: '1.0.0',
    generatedAt: new Date().toISOString(),

    // Quick summary for AI understanding
    summary: {
      purpose: 'ralph-starter is an AI-powered CLI tool that fetches specs from tools like Figma, GitHub, Linear, and Notion, then runs autonomous AI coding loops to build production-ready code.',
      primaryUseCase: 'Developers use ralph-starter to automate coding tasks by providing natural language specs or importing requirements from external tools.',
      keyFeatures: [
        'Fetch design specs from Figma',
        'Import issues from GitHub and Linear',
        'Pull requirements from Notion',
        'Run AI coding loops with Claude',
        'Automatic git commits and PR creation',
        'MCP server for Claude Desktop integration',
      ],
    },

    // Structured topics for RAG retrieval
    topics,

    // Categories with their documents
    categories: Object.entries(categories).map(([name, items]) => ({
      name,
      documentCount: items.length,
      documents: items,
    })),

    // Access methods for AI crawlers
    access: {
      llmsTxt: `${baseUrl}/llms.txt`,
      llmsFullTxt: `${baseUrl}/llms-full.txt`,
      docsManifest: `${baseUrl}/docs.json`,
      sidebarHierarchy: `${baseUrl}/sidebar.json`,
      rawMarkdown: 'Append .md to any /docs/* URL',
      sitemap: `${baseUrl}/sitemap.xml`,
    },

    // Total statistics
    stats: {
      totalDocuments: docs.length,
      totalCategories: Object.keys(categories).length,
      lastUpdated: new Date().toISOString(),
    },
  };
}

/**
 * Generate sidebar hierarchy as JSON
 * Preserves the navigation structure for AI understanding
 */
function generateSidebarJson(docs, baseUrl) {
  // Build hierarchy from docs
  const hierarchy = [];
  const categoryMap = {};

  // Group docs into categories
  for (const doc of docs) {
    const category = doc.category;

    if (!categoryMap[category]) {
      categoryMap[category] = {
        type: 'category',
        label: category,
        items: [],
      };
    }

    categoryMap[category].items.push({
      type: 'doc',
      label: doc.title,
      path: doc.path,
      url: doc.htmlUrl,
      markdownUrl: doc.markdownUrl,
      description: doc.description,
    });
  }

  // Sort items within categories by path
  for (const category of Object.values(categoryMap)) {
    category.items.sort((a, b) => a.path.localeCompare(b.path));
  }

  // Define category order
  const categoryOrder = [
    'General',
    'Wizard',
    'Sources',
    'Mcp',
    'Cli',
    'Guides',
    'Advanced',
    'Community',
  ];

  // Build ordered hierarchy
  for (const categoryName of categoryOrder) {
    if (categoryMap[categoryName]) {
      hierarchy.push(categoryMap[categoryName]);
    }
  }

  // Add any remaining categories not in the order list
  for (const [name, category] of Object.entries(categoryMap)) {
    if (!categoryOrder.includes(name)) {
      hierarchy.push(category);
    }
  }

  return {
    name: 'ralph-starter Documentation',
    baseUrl,
    generatedAt: new Date().toISOString(),
    navigation: hierarchy,
    flatList: docs.map(d => ({
      title: d.title,
      path: d.path,
      url: d.htmlUrl,
      category: d.category,
    })),
  };
}
