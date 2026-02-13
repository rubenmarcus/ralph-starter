/**
 * Generates a single markdown file containing all ralph-starter documentation.
 * Output: docs/static/docs.md
 *
 * Usage: node scripts/generate-full-docs.cjs
 */

const fs = require('fs');
const path = require('path');

const DOCS_DIR = path.join(__dirname, '..', 'docs');
const OUTPUT_FILE = path.join(__dirname, '..', 'static', 'docs.md');

// Ordered sections matching the sidebar structure
const SECTIONS = [
  { heading: 'Getting Started', files: ['intro.md', 'installation.md'] },
  {
    heading: 'CLI Commands',
    dir: 'cli',
    files: [
      'run.md',
      'auto.md',
      'init.md',
      'plan.md',
      'setup.md',
      'check.md',
      'config.md',
      'auth.md',
      'integrations.md',
      'source.md',
      'presets.md',
      'skill.md',
      'template.md',
    ],
  },
  {
    heading: 'Sources & Integrations',
    dir: 'sources',
    files: ['overview.md', 'github.md', 'linear.md', 'notion.md', 'figma.md'],
  },
  {
    heading: 'Guides',
    dir: 'guides',
    files: [
      'workflow-presets.md',
      'prd-workflow.md',
      'cost-tracking.md',
      'skills-system.md',
      'testing-integrations.md',
      'extending-ralph-starter.md',
    ],
  },
  {
    heading: 'Wizard',
    dir: 'wizard',
    files: ['overview.md', 'idea-mode.md'],
  },
  {
    heading: 'Advanced',
    dir: 'advanced',
    files: [
      'validation.md',
      'git-automation.md',
      'circuit-breaker.md',
      'rate-limiting.md',
      'ralph-playbook.md',
    ],
  },
  {
    heading: 'MCP Server',
    dir: 'mcp',
    files: ['setup.md', 'claude-desktop.md'],
  },
  {
    heading: 'Community',
    dir: 'community',
    files: ['contributing.md', 'changelog.md', 'ideas.md'],
  },
  { heading: 'FAQ', files: ['faq.md'] },
];

function stripFrontmatter(content) {
  if (content.startsWith('---')) {
    const end = content.indexOf('---', 3);
    if (end !== -1) {
      return content.slice(end + 3).trimStart();
    }
  }
  return content;
}

function bumpHeadings(content) {
  // Bump all headings down by one level (# -> ##, ## -> ###, etc.)
  // so section headings stay as the top-level within each section.
  // Skip lines inside fenced code blocks to avoid mutating snippets
  // (e.g. shell comments like "# Install" should not become "## Install").
  const lines = content.split('\n');
  let inFence = false;

  for (let i = 0; i < lines.length; i++) {
    if (/^```/.test(lines[i])) {
      inFence = !inFence;
      continue;
    }
    if (!inFence) {
      lines[i] = lines[i].replace(/^(#{1,5}) /, (_, hashes) => hashes + '# ');
    }
  }

  return lines.join('\n');
}

function generate() {
  const parts = [];

  parts.push('# ralph-starter Documentation\n');
  parts.push(
    '> AI-powered autonomous coding tool. Connect GitHub, Linear, Notion, Figma and run AI coding loops from specs to production.\n'
  );
  parts.push(
    `> Generated on ${new Date().toISOString().split('T')[0]} | [ralphstarter.ai](https://ralphstarter.ai)\n`
  );

  // Table of contents
  parts.push('## Table of Contents\n');
  for (const section of SECTIONS) {
    parts.push(`- [${section.heading}](#${section.heading.toLowerCase().replace(/[^a-z0-9]+/g, '-')})`);
  }
  parts.push('');

  parts.push('---\n');

  for (const section of SECTIONS) {
    parts.push(`## ${section.heading}\n`);

    for (const file of section.files) {
      const filePath = section.dir
        ? path.join(DOCS_DIR, section.dir, file)
        : path.join(DOCS_DIR, file);

      if (!fs.existsSync(filePath)) {
        console.warn(`Warning: ${filePath} not found, skipping`);
        continue;
      }

      const raw = fs.readFileSync(filePath, 'utf-8');
      const content = bumpHeadings(stripFrontmatter(raw));
      parts.push(content);
      parts.push('\n---\n');
    }
  }

  const output = parts.join('\n');
  fs.writeFileSync(OUTPUT_FILE, output, 'utf-8');

  const lines = output.split('\n').length;
  const sizeKb = (Buffer.byteLength(output, 'utf-8') / 1024).toFixed(1);
  console.log(`Generated ${OUTPUT_FILE}`);
  console.log(`  ${lines} lines, ${sizeKb} KB`);
}

generate();
