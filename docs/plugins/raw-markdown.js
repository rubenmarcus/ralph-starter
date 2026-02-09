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
          rawMarkdown: 'Add .md to any URL for raw markdown',
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

      // Generate .md files for non-docs pages so any URL + .md works for agents
      const pageCount = generatePageMarkdown(outDir, siteConfig, baseUrl);

      console.log(`[raw-markdown] Copied ${docs.length} markdown files for LLM access`);
      console.log(`[raw-markdown] Generated ${pageCount} page-level .md files`);
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
      rawMarkdown: 'Append .md to any URL for raw markdown',
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

/**
 * Generate markdown files for non-docs pages (homepage, use-cases, etc.)
 * so that appending .md to any URL returns useful content for AI agents.
 */
function generatePageMarkdown(outDir, siteConfig, baseUrl) {
  const pages = [
    {
      path: 'index.md',
      content: `# ${siteConfig.title || 'ralph-starter'}

${siteConfig.tagline || ''}

## Overview

ralph-starter is an AI-powered CLI tool that runs autonomous coding loops.
It fetches specs from GitHub, Linear, Notion, and Figma, then orchestrates
AI coding agents to build production-ready code automatically.

## Quick Start

\`\`\`bash
npm install -g ralph-starter
ralph-starter init
ralph-starter run "build a login page"
\`\`\`

## Key Features

- **Integrations**: Connect GitHub, Linear, Notion, and Figma
- **AI Agents**: Orchestrate Claude Code, Cursor, Codex, and more
- **Autonomous Loops**: Run coding loops until task completion
- **Auto Mode**: Batch process multiple issues automatically
- **MCP Server**: Integrate with Claude Desktop

## Links

- [Documentation](${baseUrl}/docs/intro)
- [GitHub](https://github.com/rubenmarcus/ralph-starter)
- [npm](https://www.npmjs.com/package/ralph-starter)
- [Full docs as markdown](${baseUrl}/llms-full.txt)

## For AI Agents

- Append \`.md\` to any docs URL for raw markdown
- Access \`/llms.txt\` for a documentation summary
- Access \`/llms-full.txt\` for complete documentation
- Access \`/docs.json\` for structured manifest
- Access \`/ai-index.json\` for RAG-optimized index
`,
    },
    {
      path: 'use-cases.md',
      content: `# Use Cases - ralph-starter

## What can you build with ralph-starter?

ralph-starter automates software development by fetching specs from your tools
and running AI coding loops. Here are common use cases:

### From Design to Code
Import Figma designs and let AI agents generate production-ready components.

### Issue-Driven Development
Connect GitHub or Linear, pick issues, and let ralph-starter build the solution.

### Spec-to-Production
Write requirements in Notion, fetch them with ralph-starter, and generate code.

### Batch Processing (Auto Mode)
Process multiple issues automatically with \`ralph-starter auto\`.

## Learn More

- [Getting Started](${baseUrl}/docs/intro)
- [Figma Integration](${baseUrl}/docs/sources/figma)
- [GitHub Integration](${baseUrl}/docs/sources/github)
- [Linear Integration](${baseUrl}/docs/sources/linear)
- [Notion Integration](${baseUrl}/docs/sources/notion)
`,
    },
    {
      path: 'integrations.md',
      content: `# Integrations - ralph-starter

## Supported Integrations

ralph-starter connects to your existing tools to fetch specs and requirements.

### GitHub
Fetch issues, PRs, and files from any GitHub repository.
- [GitHub Integration Docs](${baseUrl}/docs/sources/github)

### Figma
Import design specs, components, and design tokens from Figma.
- [Figma Integration Docs](${baseUrl}/docs/sources/figma)

### Linear
Pull tickets by team or project from Linear.
- [Linear Integration Docs](${baseUrl}/docs/sources/linear)

### Notion
Fetch pages and database entries from Notion.
- [Notion Integration Docs](${baseUrl}/docs/sources/notion)

## AI Agents Supported

- Claude Code
- Cursor
- OpenCode
- Codex
- GitHub Copilot
- Gemini CLI
- Amp
- Openclaw
`,
    },
    {
      path: 'templates.md',
      content: `# Templates - ralph-starter

## Project Templates

ralph-starter provides templates to accelerate project setup.
Browse available templates at: https://github.com/rubenmarcus/ralph-templates

## Using Templates

\`\`\`bash
ralph-starter init --template <template-name>
\`\`\`

## Learn More

- [Getting Started](${baseUrl}/docs/intro)
- [CLI Reference](${baseUrl}/docs/cli/init)
- [Templates Repository](https://github.com/rubenmarcus/ralph-templates)
`,
    },
  ];

  let count = 0;
  for (const page of pages) {
    const targetPath = path.join(outDir, page.path);
    fs.writeFileSync(targetPath, page.content);
    count++;
  }

  return count;
}
