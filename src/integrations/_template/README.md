# Template Integration

> Copy this folder to create a new integration.

## Quick Start

1. Copy this folder:
   ```bash
   cp -r src/integrations/_template src/integrations/your-service
   ```

2. Rename files and update all occurrences of "template":
   - `index.ts` - Update exports
   - `source.ts` - Main implementation
   - `auth.ts` - OAuth (delete if not needed)

3. Register in `src/integrations/index.ts`:
   ```typescript
   import { YourServiceIntegration } from './your-service/index.js';

   export const integrations: Integration[] = [
     // ...existing
     new YourServiceIntegration(),
   ];
   ```

4. Run build to verify:
   ```bash
   npm run build
   ```

## Files

| File | Purpose | Required |
|------|---------|----------|
| `index.ts` | Main export | Yes |
| `source.ts` | Data fetching logic | Yes |
| `auth.ts` | OAuth provider | Only for OAuth |
| `README.md` | Documentation | Recommended |

## Authentication Methods

Choose the appropriate method for your service:

### 1. CLI Authentication
Best for services with CLI tools (gh, linear, gt).

```typescript
authMethods: AuthMethod[] = ['cli'];

protected async isCliAvailable(): Promise<boolean> {
  try {
    const { execa } = await import('execa');
    await execa('your-cli', ['auth', 'status']);
    return true;
  } catch {
    return false;
  }
}
```

### 2. API Key
Simplest option - user provides a key.

```typescript
authMethods: AuthMethod[] = ['api-key'];

// In fetch method:
const apiKey = await this.getApiKey();
```

### 3. OAuth
For services that require OAuth flow.

```typescript
authMethods: AuthMethod[] = ['oauth'];
```

Create `auth.ts` with OAuth provider configuration.

### 4. No Auth
For public APIs (like Notion public pages).

```typescript
authMethods: AuthMethod[] = ['none'];
```

## Testing Your Integration

```bash
# Build
npm run build

# Test availability
ralph-starter sources list

# Test fetch
ralph-starter run --from your-service --project "test"
```

## Checklist

- [ ] Update name, displayName, description, website
- [ ] Implement authentication method
- [ ] Implement fetch logic
- [ ] Format results to markdown
- [ ] Write helpful error messages
- [ ] Add getHelp() documentation
- [ ] Test with real data
- [ ] Update ROADMAP.md to mark as available
