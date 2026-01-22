# Notion Integration

Fetch pages and databases from Notion workspaces.

## Public Pages (No Auth Needed)

For public Notion pages, no authentication is required. Ralph-starter fetches the HTML directly.

```bash
# Just provide the URL
ralph-starter run --from notion --project "https://notion.so/Public-Page-abc123"
```

## Private Pages (Requires Token)

For private pages, you need to configure a Notion integration token.

### Setup

1. Go to [Notion Integrations](https://www.notion.so/my-integrations)
2. Create a new integration
3. Copy the Internal Integration Token
4. Configure ralph-starter:

```bash
ralph-starter config set notion.token secret_xxxxx
```

5. **Important**: Share each page/database with your integration:
   - Open the page in Notion
   - Click "..." menu → "Add connections"
   - Select your integration

## Usage

```bash
# Public page (no auth)
ralph-starter run --from notion --project "https://notion.so/My-Page-abc123"

# Private page (with token)
ralph-starter run --from notion --project "https://notion.so/Private-Page-abc123"

# Search (requires token)
ralph-starter run --from notion --project "Product Requirements"

# Direct page ID
ralph-starter run --from notion --project "abc123def456..."
```

## Options

| Option | Description | Default |
|--------|-------------|---------|
| `--project` | Page URL, page ID, or search query | Required |
| `--limit` | Max results for search | 10 |

## How It Works

1. **Public pages**: Fetched via HTML, converted to markdown
2. **Private pages**: Fetched via Notion API
3. **Search**: Uses Notion API (requires token)

## Supported Content

When fetching via API:
- Headings (H1, H2, H3)
- Paragraphs
- Bullet lists
- Numbered lists
- Todo items
- Code blocks
- Quotes
- Callouts
- Dividers
- Images

When fetching HTML (public pages):
- Basic formatting is preserved
- Complex blocks may be simplified

## Examples

```bash
# Fetch a public product spec
ralph-starter run --from notion --project "https://notion.site/Product-Spec-abc123"

# Fetch private engineering docs
ralph-starter run --from notion --project "https://notion.so/workspace/Eng-Docs-abc123"

# Search for design documents
ralph-starter run --from notion --project "Design System" --limit 5
```

## Troubleshooting

### "Could not fetch Notion page"

1. For private pages, ensure you've configured the token
2. Ensure the page is shared with your integration
3. Check that the URL is correct

### "Not found" error

The page ID may be wrong, or the page isn't shared with your integration.

### Content looks incomplete

Some Notion blocks aren't fully supported in the HTML parser. For complete content, use the API (requires token).
