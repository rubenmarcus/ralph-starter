# Figma Integration

Fetch design specifications, tokens, components, and assets from Figma for use in autonomous AI coding loops.

## Features

- **Design Specs** - Convert Figma frames into markdown specifications for AI coding loops
- **Design Tokens** - Extract colors, typography, shadows, and spacing to CSS/SCSS/JSON/Tailwind
- **Component Code** - Generate React, Vue, Svelte, or HTML components from Figma designs
- **Asset Export** - Export icons and images as SVG/PNG/PDF with download scripts

## Authentication

### Personal Access Token (Recommended)

1. Go to **Figma** > **Settings** > **Account** > **Personal Access Tokens**
2. Click **Create a new personal access token**
3. Give it a descriptive name (e.g., "ralph-starter")
4. Copy the token

Configure the token:

```bash
# Using CLI config
ralph-starter config set figma.token <your-token>

# Or environment variable
export FIGMA_TOKEN=<your-token>
```

## Usage

### Basic Usage

```bash
# Fetch design spec from a Figma file
ralph-starter run --from figma --project "https://figma.com/file/ABC123/MyDesign"

# Using file key directly
ralph-starter run --from figma --project "ABC123"
```

### Modes

#### 1. Design Spec (default)

Converts Figma frames into markdown specifications suitable for AI coding loops:

```bash
ralph-starter integrations fetch figma "ABC123"

# Fetch specific frames
ralph-starter integrations fetch figma "ABC123" --figma-nodes "1:23,1:45"
```

Output includes:
- Frame hierarchy with headings
- Dimensions and layout information
- Auto-layout properties (flex, gap, padding)
- Typography details for text nodes
- Component properties and variants
- Visual effects (shadows, blur)

#### 2. Design Tokens

Extract design tokens into various formats:

```bash
# CSS custom properties (default)
ralph-starter integrations fetch figma "ABC123" --figma-mode tokens

# SCSS variables
ralph-starter integrations fetch figma "ABC123" --figma-mode tokens --figma-format scss

# JSON
ralph-starter integrations fetch figma "ABC123" --figma-mode tokens --figma-format json

# Tailwind config
ralph-starter integrations fetch figma "ABC123" --figma-mode tokens --figma-format tailwind
```

Extracted tokens:
- **Colors** - From fill styles
- **Typography** - Font family, size, weight, line height, letter spacing
- **Shadows** - Drop shadows and inner shadows
- **Border Radii** - From frames and shapes
- **Spacing** - From auto-layout gaps

#### 3. Component Code

Generate framework-specific component code:

```bash
# React (default)
ralph-starter integrations fetch figma "ABC123" --figma-mode components

# Vue SFC
ralph-starter integrations fetch figma "ABC123" --figma-mode components --figma-framework vue

# Svelte
ralph-starter integrations fetch figma "ABC123" --figma-mode components --figma-framework svelte

# Astro
ralph-starter integrations fetch figma "ABC123" --figma-mode components --figma-framework astro

# Next.js (with 'use client')
ralph-starter integrations fetch figma "ABC123" --figma-mode components --figma-framework nextjs

# Nuxt (Vue 3 with CSS modules)
ralph-starter integrations fetch figma "ABC123" --figma-mode components --figma-framework nuxt

# HTML + CSS
ralph-starter integrations fetch figma "ABC123" --figma-mode components --figma-framework html
```

Generated code includes:
- Props interface from component properties
- Styles extracted from Figma (layout, colors, typography)
- Child component structure
- Variant handling for component sets

#### 4. Asset Export

Export icons and images:

```bash
# SVG (default)
ralph-starter integrations fetch figma "ABC123" --figma-mode assets

# PNG at 2x scale
ralph-starter integrations fetch figma "ABC123" --figma-mode assets --figma-format png --figma-scale 2

# Specific nodes only
ralph-starter integrations fetch figma "ABC123" --figma-mode assets --figma-nodes "1:23,1:45"
```

Assets are identified by name patterns: `icon`, `asset`, `logo`, `illustration`, `image`, `graphic`.

Output includes:
- Asset manifest with download URLs
- Ready-to-run curl download script

> **Note:** Export URLs expire after 30 days. Re-run the fetch to get fresh URLs.

## CLI Options

| Option | Description | Values |
|--------|-------------|--------|
| `--figma-mode` | Operation mode | `spec`, `tokens`, `components`, `assets` |
| `--figma-format` | Token output format | `css`, `scss`, `json`, `tailwind` |
| `--figma-framework` | Component framework | `react`, `vue`, `svelte`, `astro`, `nextjs`, `nuxt`, `html` |
| `--figma-nodes` | Specific node IDs | Comma-separated (e.g., `1:23,1:45`) |
| `--figma-scale` | Image export scale | Number (default: `1`) |

## Figma URL Formats

The integration accepts various Figma URL formats:

```bash
# Full file URL
https://www.figma.com/file/ABC123/MyDesign

# Design URL (new format)
https://www.figma.com/design/ABC123/MyDesign

# With node selection
https://www.figma.com/file/ABC123/MyDesign?node-id=1:23

# File key only
ABC123
```

## Examples

### AI Coding Loop with Design Spec

```bash
# Use Figma design as the task specification
ralph-starter run --from figma \
  --project "https://figma.com/file/ABC123/LoginPage" \
  --preset feature
```

### Generate Theme from Figma

```bash
# Extract tokens and save to file
ralph-starter integrations fetch figma "ABC123" \
  --figma-mode tokens \
  --figma-format css > theme.css
```

### Export All Icons

```bash
# Get icon export script
ralph-starter integrations fetch figma "ABC123" --figma-mode assets

# Then run the generated curl commands to download
```

## Limitations

- **Variables API** requires Figma Enterprise plan (falls back to styles)
- **Image export URLs** expire after 30 days
- **Large files** may be slow to fetch; use `--figma-nodes` to target specific frames
- **Component code generation** is a starting point; manual refinement may be needed

## Troubleshooting

### "Invalid Figma token"

Your token may have expired or been revoked. Create a new token in Figma settings.

### "Access denied"

Ensure your token has access to the file. For team files, you need to be a member of the team.

### "File not found"

Check the file key or URL is correct. The file key is the 22-character string after `/file/` in the URL.

### No assets found

Assets are detected by name patterns. Rename your icon frames to include "icon", "logo", or "asset" in the name, or specify node IDs directly with `--figma-nodes`.
