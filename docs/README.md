# Website

This website is built using [Docusaurus](https://docusaurus.io/), a modern static website generator.

## Installation

```bash
pnpm install
```

## Local Development

```bash
pnpm start
```

This command starts a local development server and opens up a browser window. Most changes are reflected live without having to restart the server.

## Build

```bash
pnpm build
```

This command generates static content into the `build` directory and can be served using any static contents hosting service.

## SEO and AEO

Validate crawler-facing outputs:

```bash
pnpm seo:check
```

Sync generated SEO/AEO files into `docs/static/`:

```bash
pnpm seo:sync
```

Synced files:
- `sitemap.xml`
- `llms.txt`
- `llms-full.txt`
- `docs.json`
- `docs-urls.txt`
- `ai-index.json`
- `sidebar.json`

## CI/CD

`Docs SEO and AEO Sync` workflow automatically:
1. Builds docs on `main` when docs content/config changes
2. Validates SEO/AEO artifacts
3. Syncs generated crawler assets into `docs/static/`
4. Commits updated assets
5. Pings search engines with the latest sitemap (best effort)
