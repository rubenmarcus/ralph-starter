/**
 * Component Code Generator
 *
 * Converts Figma components into framework-specific code
 * (React, Vue, Svelte, HTML).
 */

import type { FigmaNode, Paint, RGBA, TypeStyle } from '../types.js';

export interface ComponentSpec {
  name: string;
  originalName: string;
  props: PropSpec[];
  variants: VariantSpec[];
  styles: StyleSpec;
  children: ComponentSpec[];
  isVariantSet: boolean;
}

export interface PropSpec {
  name: string;
  type: 'boolean' | 'string' | 'enum';
  defaultValue: string | boolean;
  options?: string[];
}

export interface VariantSpec {
  name: string;
  properties: Record<string, string>;
}

export interface StyleSpec {
  width?: string;
  height?: string;
  display?: string;
  flexDirection?: string;
  gap?: string;
  padding?: string;
  alignItems?: string;
  justifyContent?: string;
  backgroundColor?: string;
  borderRadius?: string;
  boxShadow?: string;
  color?: string;
  fontFamily?: string;
  fontSize?: string;
  fontWeight?: string;
  lineHeight?: string;
  letterSpacing?: string;
  textAlign?: string;
}

type Framework = 'react' | 'vue' | 'svelte' | 'astro' | 'nextjs' | 'nuxt' | 'html';

/**
 * Convert Figma node to component code
 */
export function figmaNodeToComponent(node: FigmaNode, framework: Framework): string {
  const spec = analyzeComponent(node);

  switch (framework) {
    case 'react':
      return generateReactComponent(spec);
    case 'vue':
      return generateVueComponent(spec);
    case 'svelte':
      return generateSvelteComponent(spec);
    case 'astro':
      return generateAstroComponent(spec);
    case 'nextjs':
      return generateNextjsComponent(spec);
    case 'nuxt':
      return generateNuxtComponent(spec);
    case 'html':
      return generateHtmlComponent(spec);
    default:
      return generateReactComponent(spec);
  }
}

/**
 * Analyze a Figma node and extract component spec
 */
function analyzeComponent(node: FigmaNode): ComponentSpec {
  const spec: ComponentSpec = {
    name: pascalCase(node.name),
    originalName: node.name,
    props: [],
    variants: [],
    styles: extractStyles(node),
    children: [],
    isVariantSet: node.type === 'COMPONENT_SET',
  };

  // Extract props from component properties
  if (node.componentPropertyDefinitions) {
    for (const [key, def] of Object.entries(node.componentPropertyDefinitions)) {
      const prop: PropSpec = {
        name: camelCase(key),
        type: def.type === 'BOOLEAN' ? 'boolean' : def.type === 'VARIANT' ? 'enum' : 'string',
        defaultValue: def.defaultValue,
      };

      if (def.variantOptions) {
        prop.options = def.variantOptions;
      }

      spec.props.push(prop);
    }
  }

  // Process children for component sets (variants)
  if (node.type === 'COMPONENT_SET' && node.children) {
    for (const child of node.children) {
      if (child.type === 'COMPONENT') {
        spec.variants.push({
          name: child.name,
          properties: parseVariantName(child.name),
        });
      }
    }
  }

  // Process children for regular components
  if (node.children && node.type !== 'COMPONENT_SET') {
    for (const child of node.children) {
      if (['FRAME', 'COMPONENT', 'INSTANCE', 'TEXT'].includes(child.type)) {
        spec.children.push(analyzeComponent(child));
      }
    }
  }

  return spec;
}

/**
 * Parse variant name like "Size=Large, State=Hover" into properties
 */
function parseVariantName(name: string): Record<string, string> {
  const props: Record<string, string> = {};
  const pairs = name.split(',').map((s) => s.trim());

  for (const pair of pairs) {
    const [key, value] = pair.split('=').map((s) => s.trim());
    if (key && value) {
      props[camelCase(key)] = value;
    }
  }

  return props;
}

/**
 * Extract CSS styles from a Figma node
 */
function extractStyles(node: FigmaNode): StyleSpec {
  const styles: StyleSpec = {};

  // Dimensions
  if (node.absoluteBoundingBox) {
    styles.width = `${Math.round(node.absoluteBoundingBox.width)}px`;
    styles.height = `${Math.round(node.absoluteBoundingBox.height)}px`;
  }

  // Layout
  if (node.layoutMode && node.layoutMode !== 'NONE') {
    styles.display = 'flex';
    styles.flexDirection = node.layoutMode === 'VERTICAL' ? 'column' : 'row';

    if (node.itemSpacing) {
      styles.gap = `${node.itemSpacing}px`;
    }

    if (node.paddingTop || node.paddingRight || node.paddingBottom || node.paddingLeft) {
      styles.padding = `${node.paddingTop || 0}px ${node.paddingRight || 0}px ${node.paddingBottom || 0}px ${node.paddingLeft || 0}px`;
    }

    if (node.primaryAxisAlignItems) {
      styles.justifyContent = alignmentToCss(node.primaryAxisAlignItems);
    }

    if (node.counterAxisAlignItems) {
      styles.alignItems = alignmentToCss(node.counterAxisAlignItems);
    }
  }

  // Background color
  if (node.fills && node.fills.length > 0) {
    const fill = node.fills.find((f) => f.type === 'SOLID' && f.visible !== false);
    if (fill?.color) {
      styles.backgroundColor = rgbaToCss(fill.color, fill.opacity);
    }
  }

  // Border radius
  if (node.cornerRadius && node.cornerRadius > 0) {
    styles.borderRadius = `${node.cornerRadius}px`;
  } else if (node.rectangleCornerRadii) {
    const [tl, tr, br, bl] = node.rectangleCornerRadii;
    styles.borderRadius = `${tl}px ${tr}px ${br}px ${bl}px`;
  }

  // Shadow
  if (node.effects && node.effects.length > 0) {
    const shadows = node.effects
      .filter((e) => (e.type === 'DROP_SHADOW' || e.type === 'INNER_SHADOW') && e.visible !== false)
      .map((e) => {
        const inset = e.type === 'INNER_SHADOW' ? 'inset ' : '';
        const x = e.offset?.x || 0;
        const y = e.offset?.y || 0;
        const color = e.color ? rgbaToCss(e.color) : 'rgba(0,0,0,0.25)';
        return `${inset}${x}px ${y}px ${e.radius}px ${e.spread || 0}px ${color}`;
      });

    if (shadows.length > 0) {
      styles.boxShadow = shadows.join(', ');
    }
  }

  // Text styles
  if (node.type === 'TEXT' && node.style) {
    const ts = node.style;
    styles.fontFamily = ts.fontFamily;
    styles.fontSize = `${ts.fontSize}px`;
    styles.fontWeight = String(ts.fontWeight);
    styles.lineHeight = ts.lineHeightPx ? `${Math.round(ts.lineHeightPx)}px` : 'normal';

    if (ts.letterSpacing && ts.letterSpacing !== 0) {
      styles.letterSpacing = `${ts.letterSpacing.toFixed(2)}px`;
    }

    if (ts.textAlignHorizontal) {
      styles.textAlign = ts.textAlignHorizontal.toLowerCase();
    }

    // Text color
    if (ts.fills && ts.fills.length > 0) {
      const fill = ts.fills.find((f) => f.type === 'SOLID' && f.visible !== false);
      if (fill?.color) {
        styles.color = rgbaToCss(fill.color, fill.opacity);
      }
    }
  }

  return styles;
}

/**
 * Convert Figma alignment to CSS
 */
function alignmentToCss(alignment: string): string {
  const map: Record<string, string> = {
    MIN: 'flex-start',
    CENTER: 'center',
    MAX: 'flex-end',
    SPACE_BETWEEN: 'space-between',
    BASELINE: 'baseline',
  };
  return map[alignment] || 'flex-start';
}

/**
 * Convert RGBA to CSS color
 */
function rgbaToCss(rgba: RGBA, opacity?: number): string {
  const r = Math.round(rgba.r * 255);
  const g = Math.round(rgba.g * 255);
  const b = Math.round(rgba.b * 255);
  const a = opacity !== undefined ? opacity : rgba.a;

  if (a < 1) {
    return `rgba(${r}, ${g}, ${b}, ${a.toFixed(2)})`;
  }

  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

/**
 * Generate React component
 */
function generateReactComponent(spec: ComponentSpec): string {
  const lines: string[] = [];

  // Imports
  lines.push("import React from 'react';");
  lines.push('');

  // Props interface
  if (spec.props.length > 0) {
    lines.push(`interface ${spec.name}Props {`);
    for (const prop of spec.props) {
      const type =
        prop.type === 'boolean'
          ? 'boolean'
          : prop.type === 'enum' && prop.options
            ? prop.options.map((o) => `'${o}'`).join(' | ')
            : 'string';
      lines.push(`  ${prop.name}?: ${type};`);
    }
    lines.push('}');
    lines.push('');
  }

  // Styles
  lines.push(`const styles: React.CSSProperties = ${JSON.stringify(spec.styles, null, 2)};`);
  lines.push('');

  // Component
  const propsType = spec.props.length > 0 ? `${spec.name}Props` : '{}';
  const propsDestructure =
    spec.props.length > 0
      ? `{ ${spec.props.map((p) => `${p.name} = ${JSON.stringify(p.defaultValue)}`).join(', ')} }`
      : '{}';

  lines.push(`export const ${spec.name}: React.FC<${propsType}> = (${propsDestructure}) => {`);
  lines.push('  return (');
  lines.push(`    <div style={styles}>`);

  // Children
  for (const child of spec.children) {
    if (child.styles.fontFamily) {
      // It's a text node
      lines.push(
        `      <span style={${JSON.stringify(child.styles)}}>{/* ${child.originalName} */}</span>`
      );
    } else {
      lines.push(
        `      <div style={${JSON.stringify(child.styles)}}>{/* ${child.originalName} */}</div>`
      );
    }
  }

  lines.push('    </div>');
  lines.push('  );');
  lines.push('};');

  return lines.join('\n');
}

/**
 * Generate Vue SFC
 */
function generateVueComponent(spec: ComponentSpec): string {
  const lines: string[] = [];

  // Script
  lines.push('<script setup lang="ts">');

  if (spec.props.length > 0) {
    lines.push('interface Props {');
    for (const prop of spec.props) {
      const type =
        prop.type === 'boolean'
          ? 'boolean'
          : prop.type === 'enum' && prop.options
            ? prop.options.map((o) => `'${o}'`).join(' | ')
            : 'string';
      lines.push(`  ${prop.name}?: ${type};`);
    }
    lines.push('}');
    lines.push('');

    const defaults = spec.props
      .map((p) => `  ${p.name}: ${JSON.stringify(p.defaultValue)}`)
      .join(',\n');
    lines.push(`withDefaults(defineProps<Props>(), {`);
    lines.push(defaults);
    lines.push('});');
  }

  lines.push('</script>');
  lines.push('');

  // Template
  lines.push('<template>');
  lines.push('  <div class="container">');
  for (const child of spec.children) {
    lines.push(`    <!-- ${child.originalName} -->`);
    lines.push(`    <div class="${kebabCase(child.name)}"></div>`);
  }
  lines.push('  </div>');
  lines.push('</template>');
  lines.push('');

  // Style
  lines.push('<style scoped>');
  lines.push('.container {');
  for (const [key, value] of Object.entries(spec.styles)) {
    lines.push(`  ${kebabCaseCss(key)}: ${value};`);
  }
  lines.push('}');

  for (const child of spec.children) {
    lines.push('');
    lines.push(`.${kebabCase(child.name)} {`);
    for (const [key, value] of Object.entries(child.styles)) {
      lines.push(`  ${kebabCaseCss(key)}: ${value};`);
    }
    lines.push('}');
  }

  lines.push('</style>');

  return lines.join('\n');
}

/**
 * Generate Svelte component
 */
function generateSvelteComponent(spec: ComponentSpec): string {
  const lines: string[] = [];

  // Script
  lines.push('<script lang="ts">');
  for (const prop of spec.props) {
    const type =
      prop.type === 'boolean'
        ? 'boolean'
        : prop.type === 'enum' && prop.options
          ? prop.options.map((o) => `'${o}'`).join(' | ')
          : 'string';
    lines.push(`  export let ${prop.name}: ${type} = ${JSON.stringify(prop.defaultValue)};`);
  }
  lines.push('</script>');
  lines.push('');

  // HTML
  lines.push('<div class="container">');
  for (const child of spec.children) {
    lines.push(`  <!-- ${child.originalName} -->`);
    lines.push(`  <div class="${kebabCase(child.name)}"></div>`);
  }
  lines.push('</div>');
  lines.push('');

  // Style
  lines.push('<style>');
  lines.push('  .container {');
  for (const [key, value] of Object.entries(spec.styles)) {
    lines.push(`    ${kebabCaseCss(key)}: ${value};`);
  }
  lines.push('  }');

  for (const child of spec.children) {
    lines.push('');
    lines.push(`  .${kebabCase(child.name)} {`);
    for (const [key, value] of Object.entries(child.styles)) {
      lines.push(`    ${kebabCaseCss(key)}: ${value};`);
    }
    lines.push('  }');
  }

  lines.push('</style>');

  return lines.join('\n');
}

/**
 * Generate HTML + CSS
 */
function generateHtmlComponent(spec: ComponentSpec): string {
  const lines: string[] = [];

  // CSS
  lines.push('<style>');
  lines.push(`.${kebabCase(spec.name)} {`);
  for (const [key, value] of Object.entries(spec.styles)) {
    lines.push(`  ${kebabCaseCss(key)}: ${value};`);
  }
  lines.push('}');

  for (const child of spec.children) {
    lines.push('');
    lines.push(`.${kebabCase(spec.name)}__${kebabCase(child.name)} {`);
    for (const [key, value] of Object.entries(child.styles)) {
      lines.push(`  ${kebabCaseCss(key)}: ${value};`);
    }
    lines.push('}');
  }

  lines.push('</style>');
  lines.push('');

  // HTML
  lines.push(`<div class="${kebabCase(spec.name)}">`);
  for (const child of spec.children) {
    lines.push(`  <!-- ${child.originalName} -->`);
    lines.push(`  <div class="${kebabCase(spec.name)}__${kebabCase(child.name)}"></div>`);
  }
  lines.push('</div>');

  return lines.join('\n');
}

/**
 * Generate Astro component
 */
function generateAstroComponent(spec: ComponentSpec): string {
  const lines: string[] = [];

  // Frontmatter
  lines.push('---');
  if (spec.props.length > 0) {
    lines.push('interface Props {');
    for (const prop of spec.props) {
      const type =
        prop.type === 'boolean'
          ? 'boolean'
          : prop.type === 'enum' && prop.options
            ? prop.options.map((o) => `'${o}'`).join(' | ')
            : 'string';
      lines.push(`  ${prop.name}?: ${type};`);
    }
    lines.push('}');
    lines.push('');
    const defaults = spec.props
      .map((p) => `  ${p.name} = ${JSON.stringify(p.defaultValue)}`)
      .join(',\n');
    lines.push(`const {\n${defaults}\n} = Astro.props;`);
  }
  lines.push('---');
  lines.push('');

  // HTML
  lines.push(`<div class="${kebabCase(spec.name)}">`);
  for (const child of spec.children) {
    lines.push(`  <!-- ${child.originalName} -->`);
    lines.push(`  <div class="${kebabCase(spec.name)}__${kebabCase(child.name)}"></div>`);
  }
  lines.push('</div>');
  lines.push('');

  // Style
  lines.push('<style>');
  lines.push(`.${kebabCase(spec.name)} {`);
  for (const [key, value] of Object.entries(spec.styles)) {
    lines.push(`  ${kebabCaseCss(key)}: ${value};`);
  }
  lines.push('}');

  for (const child of spec.children) {
    lines.push('');
    lines.push(`.${kebabCase(spec.name)}__${kebabCase(child.name)} {`);
    for (const [key, value] of Object.entries(child.styles)) {
      lines.push(`  ${kebabCaseCss(key)}: ${value};`);
    }
    lines.push('}');
  }

  lines.push('</style>');

  return lines.join('\n');
}

/**
 * Generate Next.js component (React with 'use client' directive)
 */
function generateNextjsComponent(spec: ComponentSpec): string {
  const lines: string[] = [];

  // Next.js client directive
  lines.push("'use client';");
  lines.push('');

  // Imports
  lines.push("import React from 'react';");
  lines.push('');

  // Props interface
  if (spec.props.length > 0) {
    lines.push(`interface ${spec.name}Props {`);
    for (const prop of spec.props) {
      const type =
        prop.type === 'boolean'
          ? 'boolean'
          : prop.type === 'enum' && prop.options
            ? prop.options.map((o) => `'${o}'`).join(' | ')
            : 'string';
      lines.push(`  ${prop.name}?: ${type};`);
    }
    lines.push('}');
    lines.push('');
  }

  // Styles object
  lines.push(`const styles: React.CSSProperties = ${JSON.stringify(spec.styles, null, 2)};`);
  lines.push('');

  // Component with default export (Next.js convention)
  const propsType = spec.props.length > 0 ? `${spec.name}Props` : '{}';
  const propsDestructure =
    spec.props.length > 0
      ? `{ ${spec.props.map((p) => `${p.name} = ${JSON.stringify(p.defaultValue)}`).join(', ')} }`
      : '{}';

  lines.push(`export default function ${spec.name}(${propsDestructure}: ${propsType}) {`);
  lines.push('  return (');
  lines.push(`    <div style={styles}>`);

  // Children
  for (const child of spec.children) {
    if (child.styles.fontFamily) {
      lines.push(
        `      <span style={${JSON.stringify(child.styles)}}>{/* ${child.originalName} */}</span>`
      );
    } else {
      lines.push(
        `      <div style={${JSON.stringify(child.styles)}}>{/* ${child.originalName} */}</div>`
      );
    }
  }

  lines.push('    </div>');
  lines.push('  );');
  lines.push('}');

  return lines.join('\n');
}

/**
 * Generate Nuxt component (Vue 3 with Nuxt conventions)
 */
function generateNuxtComponent(spec: ComponentSpec): string {
  const lines: string[] = [];

  // Script setup with Nuxt auto-imports
  lines.push('<script setup lang="ts">');

  if (spec.props.length > 0) {
    lines.push('interface Props {');
    for (const prop of spec.props) {
      const type =
        prop.type === 'boolean'
          ? 'boolean'
          : prop.type === 'enum' && prop.options
            ? prop.options.map((o) => `'${o}'`).join(' | ')
            : 'string';
      lines.push(`  ${prop.name}?: ${type};`);
    }
    lines.push('}');
    lines.push('');

    const defaults = spec.props
      .map((p) => `  ${p.name}: ${JSON.stringify(p.defaultValue)}`)
      .join(',\n');
    lines.push(`const props = withDefaults(defineProps<Props>(), {`);
    lines.push(defaults);
    lines.push('});');
  }

  lines.push('</script>');
  lines.push('');

  // Template
  lines.push('<template>');
  lines.push('  <div :class="$style.container">');
  for (const child of spec.children) {
    lines.push(`    <!-- ${child.originalName} -->`);
    lines.push(`    <div :class="$style['${kebabCase(child.name)}']"></div>`);
  }
  lines.push('  </div>');
  lines.push('</template>');
  lines.push('');

  // CSS Modules (Nuxt convention)
  lines.push('<style module>');
  lines.push('.container {');
  for (const [key, value] of Object.entries(spec.styles)) {
    lines.push(`  ${kebabCaseCss(key)}: ${value};`);
  }
  lines.push('}');

  for (const child of spec.children) {
    lines.push('');
    lines.push(`.${kebabCase(child.name)} {`);
    for (const [key, value] of Object.entries(child.styles)) {
      lines.push(`  ${kebabCaseCss(key)}: ${value};`);
    }
    lines.push('}');
  }

  lines.push('</style>');

  return lines.join('\n');
}

/**
 * Get file extension for framework
 */
export function getFileExtension(framework: Framework): string {
  const extensions: Record<Framework, string> = {
    react: 'tsx',
    vue: 'vue',
    svelte: 'svelte',
    astro: 'astro',
    nextjs: 'tsx',
    nuxt: 'vue',
    html: 'html',
  };
  return extensions[framework];
}

// Utility functions

function pascalCase(str: string): string {
  return str
    .replace(/[-_\s]+(.)?/g, (_, c) => (c ? c.toUpperCase() : ''))
    .replace(/^(.)/, (c) => c.toUpperCase())
    .replace(/[^\w]/g, '');
}

function camelCase(str: string): string {
  const pascal = pascalCase(str);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}

function kebabCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .replace(/[^\w-]/g, '')
    .toLowerCase();
}

function kebabCaseCss(str: string): string {
  return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
}
