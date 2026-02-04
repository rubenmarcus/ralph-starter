---
sidebar_position: 5
title: Figma
description: Fetch design specs, tokens, components, and assets from Figma
keywords: [figma, design, tokens, components, assets, integration]
---

# Figma Source

Fetch design specifications, design tokens, component code, and assets from Figma to power your AI coding loops.

## Features

| Mode | Description |
|------|-------------|
| **spec** | Convert Figma frames to markdown design specifications |
| **tokens** | Extract colors, typography, shadows to CSS/SCSS/JSON/Tailwind |
| **components** | Generate React, Vue, Svelte, or HTML component code |
| **assets** | Export icons and images with download scripts |

## Authentication

### Personal Access Token

1. Go to **Figma** → **Settings** → **Account** → **Personal Access Tokens**
2. Click **Create a new personal access token**
3. Copy the token

```bash
# Configure via CLI
ralph-starter config set figma.token <your-token>

# Or use environment variable
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

### Mode: Design Spec (default)

Converts Figma frames into markdown specifications for AI coding loops:

```bash
# Fetch entire file
ralph-starter integrations fetch figma "ABC123"

# Fetch specific frames by node ID
ralph-starter integrations fetch figma "ABC123" --figma-nodes "1:23,1:45"
```

Output includes:
- Frame hierarchy with headings
- Dimensions and layout information
- Auto-layout properties (flex, gap, padding)
- Typography details
- Component properties and variants
- Visual effects (shadows, blur)

### Mode: Design Tokens

Extract design tokens for your codebase:

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
- **Colors** – From fill styles
- **Typography** – Font family, size, weight, line height
- **Shadows** – Drop shadows and inner shadows
- **Border Radii** – From frames and shapes
- **Spacing** – From auto-layout gaps

### Mode: Component Code

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

### Mode: Asset Export

Export icons and images:

```bash
# SVG (default)
ralph-starter integrations fetch figma "ABC123" --figma-mode assets

# PNG at 2x scale
ralph-starter integrations fetch figma "ABC123" --figma-mode assets --figma-format png --figma-scale 2
```

Assets are detected by name patterns: `icon`, `asset`, `logo`, `illustration`.

:::note
Export URLs expire after 30 days. Re-run the fetch to get fresh URLs.
:::

## Options

| Option | Description | Values |
|--------|-------------|--------|
| `--figma-mode` | Operation mode | `spec`, `tokens`, `components`, `assets` |
| `--figma-format` | Token output format | `css`, `scss`, `json`, `tailwind` |
| `--figma-framework` | Component framework | `react`, `vue`, `svelte`, `astro`, `nextjs`, `nuxt`, `html` |
| `--figma-nodes` | Specific node IDs | Comma-separated (e.g., `1:23,1:45`) |
| `--figma-scale` | Image export scale | Number (default: `1`) |

## Figma URL Formats

The integration accepts various URL formats:

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

## Example Workflows

### Design-to-Code with AI Loop

```bash
# Use Figma design as task specification
ralph-starter run --from figma \
  --project "https://figma.com/file/ABC123/LoginPage" \
  --preset feature
```

### Generate Theme File

```bash
# Extract tokens and redirect to file
ralph-starter integrations fetch figma "ABC123" \
  --figma-mode tokens \
  --figma-format css > theme.css
```

### Export All Icons

```bash
# Get icon manifest with download script
ralph-starter integrations fetch figma "ABC123" --figma-mode assets

# Run the generated curl commands to download
```

## Test Connection

Verify your authentication:

```bash
ralph-starter integrations test figma
```

## Troubleshooting

### "Invalid Figma token"

Your token may have expired or been revoked. Create a new token in Figma settings.

### "Access denied"

Ensure your token has access to the file. For team files, you need to be a member of the team.

### "File not found"

Check the file key or URL is correct. The file key is the 22-character string after `/file/` in the URL.

### No assets found

Assets are detected by name patterns. Rename your icon frames to include "icon", "logo", or "asset" in the name, or specify node IDs directly with `--figma-nodes`.

## Limitations

- **Variables API** requires Figma Enterprise plan (falls back to styles)
- **Image export URLs** expire after 30 days
- **Large files** may be slow; use `--figma-nodes` to target specific frames
