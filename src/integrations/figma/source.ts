/**
 * Figma Integration
 *
 * Fetches design specifications, tokens, components, and assets from Figma.
 *
 * Capabilities:
 * - spec: Fetch design specs as markdown for AI coding loops
 * - tokens: Extract design tokens (colors, typography, spacing)
 * - components: Generate component code (React, Vue, Svelte, HTML)
 * - assets: Export icons and images (SVG, PNG, PDF)
 */

import {
  type AuthMethod,
  BaseIntegration,
  type IntegrationOptions,
  type IntegrationResult,
} from '../base.js';
import { figmaNodeToComponent, getFileExtension } from './parsers/component-code.js';
import { nodesToSpec } from './parsers/design-spec.js';
import { extractTokensFromFile, formatTokens } from './parsers/design-tokens.js';
import type {
  FigmaFile,
  FigmaImagesResponse,
  FigmaIntegrationOptions,
  FigmaNode,
  FigmaNodesResponse,
} from './types.js';
import { formatNodeIds, nodeIdToFilename, parseFigmaUrl } from './utils/url-parser.js';

export class FigmaIntegration extends BaseIntegration {
  name = 'figma';
  displayName = 'Figma';
  description = 'Fetch design specs, tokens, components, and assets from Figma';
  website = 'https://figma.com';

  authMethods: AuthMethod[] = ['api-key'];

  private readonly API_BASE = 'https://api.figma.com/v1';

  async fetch(
    identifier: string,
    options?: IntegrationOptions & FigmaIntegrationOptions
  ): Promise<IntegrationResult> {
    const { fileKey, nodeIds: urlNodeIds } = parseFigmaUrl(identifier);

    // Merge node IDs from URL and options
    let nodeIds = urlNodeIds || [];
    if (options?.nodeIds) {
      const optionNodeIds = options.nodeIds.split(',').map((id) => id.trim());
      nodeIds = [...new Set([...nodeIds, ...optionNodeIds])];
    }

    const mode = options?.mode || 'spec';

    switch (mode) {
      case 'spec':
        return this.fetchDesignSpec(fileKey, nodeIds);
      case 'tokens':
        return this.fetchDesignTokens(fileKey, options);
      case 'components':
        return this.fetchAndGenerateComponents(fileKey, nodeIds, options);
      case 'assets':
        return this.fetchAssets(fileKey, nodeIds, options);
      default:
        return this.fetchDesignSpec(fileKey, nodeIds);
    }
  }

  /**
   * Fetch design specifications as markdown
   */
  private async fetchDesignSpec(fileKey: string, nodeIds: string[]): Promise<IntegrationResult> {
    const token = await this.getApiKey('token');

    let nodes: FigmaNode[];
    let fileName: string;

    if (nodeIds.length > 0) {
      // Fetch specific nodes
      const response = await this.apiRequest<FigmaNodesResponse>(
        token,
        `/files/${fileKey}/nodes?ids=${formatNodeIds(nodeIds)}`
      );
      fileName = response.name;
      nodes = Object.values(response.nodes).map((n) => n.document);
    } else {
      // Fetch entire file
      const file = await this.apiRequest<FigmaFile>(token, `/files/${fileKey}`);
      fileName = file.name;
      nodes = file.document.children || [];
    }

    const content = nodesToSpec(nodes, fileName);

    return {
      content,
      source: `figma:${fileKey}`,
      title: fileName,
      metadata: {
        type: 'figma',
        mode: 'spec',
        fileKey,
        nodeCount: nodes.length,
      },
    };
  }

  /**
   * Extract design tokens from a Figma file
   */
  private async fetchDesignTokens(
    fileKey: string,
    options?: FigmaIntegrationOptions
  ): Promise<IntegrationResult> {
    const token = await this.getApiKey('token');
    const format = options?.tokenFormat || 'css';

    const file = await this.apiRequest<FigmaFile>(token, `/files/${fileKey}`);
    const tokens = extractTokensFromFile(file);
    const formatted = formatTokens(tokens, format);

    const tokenCounts = {
      colors: Object.keys(tokens.colors).length,
      typography: Object.keys(tokens.typography).length,
      shadows: Object.keys(tokens.shadows).length,
      radii: Object.keys(tokens.radii).length,
      spacing: Object.keys(tokens.spacing).length,
    };

    const ext = format === 'tailwind' ? 'js' : format;
    const content = `# Design Tokens: ${file.name}

Extracted ${Object.values(tokenCounts).reduce((a, b) => a + b, 0)} tokens from Figma.

- Colors: ${tokenCounts.colors}
- Typography: ${tokenCounts.typography}
- Shadows: ${tokenCounts.shadows}
- Border Radii: ${tokenCounts.radii}
- Spacing: ${tokenCounts.spacing}

\`\`\`${ext}
${formatted}
\`\`\`
`;

    return {
      content,
      source: `figma:${fileKey}:tokens`,
      title: `${file.name} - Design Tokens`,
      metadata: {
        type: 'figma',
        mode: 'tokens',
        format,
        fileKey,
        tokenCounts,
      },
    };
  }

  /**
   * Generate component code from Figma components
   */
  private async fetchAndGenerateComponents(
    fileKey: string,
    nodeIds: string[],
    options?: FigmaIntegrationOptions
  ): Promise<IntegrationResult> {
    const token = await this.getApiKey('token');
    const framework = options?.framework || 'react';

    let components: FigmaNode[];
    let fileName: string;

    if (nodeIds.length > 0) {
      // Fetch specific nodes
      const response = await this.apiRequest<FigmaNodesResponse>(
        token,
        `/files/${fileKey}/nodes?ids=${formatNodeIds(nodeIds)}`
      );
      fileName = response.name;
      components = Object.values(response.nodes).map((n) => n.document);
    } else {
      // Fetch file and find all components
      const file = await this.apiRequest<FigmaFile>(token, `/files/${fileKey}`);
      fileName = file.name;
      components = this.findComponents(file.document);
    }

    if (components.length === 0) {
      return {
        content:
          '# No Components Found\n\nNo components were found in the specified file or nodes. ' +
          'Try specifying component node IDs directly.',
        source: `figma:${fileKey}:components`,
        title: 'Components',
        metadata: { type: 'figma', mode: 'components', count: 0 },
      };
    }

    const sections: string[] = [`# Generated Components: ${fileName}\n`];
    sections.push(`Framework: **${framework}**\n`);
    sections.push(`Found ${components.length} component(s).\n`);

    const ext = getFileExtension(framework);

    for (const component of components) {
      const code = figmaNodeToComponent(component, framework);
      sections.push(`## ${component.name}\n`);
      sections.push(`\`\`\`${ext}\n${code}\n\`\`\`\n`);
    }

    return {
      content: sections.join('\n'),
      source: `figma:${fileKey}:components`,
      title: `${fileName} - Components`,
      metadata: {
        type: 'figma',
        mode: 'components',
        framework,
        fileKey,
        componentCount: components.length,
      },
    };
  }

  /**
   * Export assets (icons, images) from Figma
   */
  private async fetchAssets(
    fileKey: string,
    nodeIds: string[],
    options?: FigmaIntegrationOptions
  ): Promise<IntegrationResult> {
    const token = await this.getApiKey('token');
    const format = options?.assetFormat || 'svg';
    const scale = options?.scale || 1;

    // If no specific nodes, find asset nodes
    if (nodeIds.length === 0) {
      const file = await this.apiRequest<FigmaFile>(token, `/files/${fileKey}`);
      nodeIds = this.findAssetNodes(file.document);
    }

    if (nodeIds.length === 0) {
      return {
        content:
          '# No Assets Found\n\n' +
          'No icon or asset nodes were found in the file. Assets are identified by names containing ' +
          '"icon", "asset", "logo", or "illustration".\n\n' +
          'Try specifying node IDs directly with `--figma-nodes`.',
        source: `figma:${fileKey}:assets`,
        title: 'Assets',
        metadata: { type: 'figma', mode: 'assets', count: 0 },
      };
    }

    // Request image exports
    const imageResponse = await this.apiRequest<FigmaImagesResponse>(
      token,
      `/images/${fileKey}?ids=${formatNodeIds(nodeIds)}&format=${format}&scale=${scale}`
    );

    if (imageResponse.err) {
      this.error(`Figma image export failed: ${imageResponse.err}`);
    }

    // Build asset list
    const assets: Array<{ id: string; url: string | null; filename: string }> = [];

    for (const [nodeId, url] of Object.entries(imageResponse.images)) {
      assets.push({
        id: nodeId,
        url,
        filename: `${nodeIdToFilename(nodeId)}.${format}`,
      });
    }

    const validAssets = assets.filter((a) => a.url !== null);

    // Generate markdown with download instructions
    const sections: string[] = ['# Figma Assets Export\n'];
    sections.push(`Found **${validAssets.length}** assets to export.\n`);
    sections.push(`Format: **${format.toUpperCase()}** | Scale: **${scale}x**\n`);

    if (validAssets.length > 0) {
      sections.push('## Asset List\n');
      sections.push('| Node ID | Filename | Download |');
      sections.push('|---------|----------|----------|');

      for (const asset of validAssets) {
        sections.push(`| ${asset.id} | ${asset.filename} | [Link](${asset.url}) |`);
      }

      sections.push('\n## Download Script\n');
      sections.push('Run this script to download all assets:\n');
      sections.push('```bash');
      sections.push('# Create assets directory');
      sections.push('mkdir -p assets\n');

      for (const asset of validAssets) {
        sections.push(`curl -o "assets/${asset.filename}" "${asset.url}"`);
      }

      sections.push('```\n');

      sections.push(
        '> **Note:** Export URLs expire after 30 days. Re-run the fetch to get fresh URLs.\n'
      );
    }

    return {
      content: sections.join('\n'),
      source: `figma:${fileKey}:assets`,
      title: 'Assets Export',
      metadata: {
        type: 'figma',
        mode: 'assets',
        format,
        scale,
        fileKey,
        count: validAssets.length,
        assets: validAssets,
      },
    };
  }

  /**
   * Find component nodes in a document
   */
  private findComponents(node: FigmaNode, results: FigmaNode[] = []): FigmaNode[] {
    if (node.type === 'COMPONENT' || node.type === 'COMPONENT_SET') {
      results.push(node);
    }

    if (node.children) {
      for (const child of node.children) {
        this.findComponents(child, results);
      }
    }

    return results;
  }

  /**
   * Find asset nodes (icons, logos, etc.) in a document
   */
  private findAssetNodes(node: FigmaNode, results: string[] = []): string[] {
    const assetPatterns = /icon|asset|logo|illustration|image|graphic/i;

    // Check if this node looks like an asset
    if (assetPatterns.test(node.name)) {
      // Only include frames, components, and vector nodes
      if (['FRAME', 'COMPONENT', 'VECTOR', 'GROUP', 'INSTANCE'].includes(node.type)) {
        results.push(node.id);
      }
    }

    // Recurse into children
    if (node.children) {
      for (const child of node.children) {
        this.findAssetNodes(child, results);
      }
    }

    return results;
  }

  /**
   * Make an API request to Figma
   */
  private async apiRequest<T>(token: string, path: string): Promise<T> {
    const response = await fetch(`${this.API_BASE}${path}`, {
      headers: {
        'X-Figma-Token': token,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        this.error(
          'Invalid Figma token. Get a Personal Access Token from Figma settings and run:\n' +
            'ralph-starter config set figma.token <your-token>'
        );
      }
      if (response.status === 403) {
        this.error('Access denied. Make sure your token has access to this file.');
      }
      if (response.status === 404) {
        this.error('File not found. Check the file key or URL is correct.');
      }

      const error = (await response.json().catch(() => ({}))) as { message?: string };
      this.error(`Figma API error: ${response.status} - ${error.message || response.statusText}`);
    }

    return response.json() as Promise<T>;
  }

  getHelp(): string {
    return `
figma: Fetch design specs, tokens, components, and assets from Figma

Usage:
  ralph-starter run --from figma --project "<file-url-or-key>" [options]
  ralph-starter integrations fetch figma "<file-url-or-key>" [options]

Options:
  --project       Figma file URL or key
  --figma-mode    Mode: spec (default), tokens, components, assets
  --figma-format  Token format: css, scss, json, tailwind
  --figma-framework  Component framework: react, vue, svelte, astro, nextjs, nuxt, html
  --figma-nodes   Specific node IDs (comma-separated)
  --figma-scale   Image export scale (default: 1)

Authentication:
  1. Go to Figma > Settings > Account > Personal Access Tokens
  2. Create a new token
  3. Run: ralph-starter config set figma.token <your-token>

  Or use environment variable:
    export FIGMA_TOKEN=<your-token>

Examples:
  # Fetch design spec (for AI coding loop)
  ralph-starter run --from figma --project "https://figma.com/file/ABC123/MyDesign"

  # Extract design tokens as CSS
  ralph-starter integrations fetch figma "ABC123" --figma-mode tokens

  # Generate React components
  ralph-starter integrations fetch figma "ABC123" --figma-mode components --figma-framework react

  # Export all icons as SVG
  ralph-starter integrations fetch figma "ABC123" --figma-mode assets

  # Fetch specific frames by node ID
  ralph-starter integrations fetch figma "ABC123" --figma-nodes "1:23,1:45"

Modes:
  spec        Convert Figma frames to markdown design specifications
  tokens      Extract colors, typography, shadows as CSS/SCSS/JSON/Tailwind
  components  Generate component code (React, Vue, Svelte, Astro, Next.js, Nuxt, HTML)
  assets      Export icons and images with download scripts

Notes:
  - Figma file URLs can include node selections: ?node-id=X:Y
  - Asset export URLs expire after 30 days
  - Variables API requires Figma Enterprise plan
`.trim();
  }
}
