import chalk from 'chalk';
import crypto from 'node:crypto';
import ora from 'ora';
import {
  setSourceCredential,
  deleteSourceCredential,
  getSourceCredentials,
  getSourcesConfigPath,
} from '../sources/config.js';
import { openBrowser, getRandomPort } from '../auth/browser.js';
import { startOAuthServer, getCallbackUrl } from '../auth/oauth-server.js';
import {
  getProvider,
  getProviderNames,
  getConfiguredProviders,
  type OAuthProvider,
} from '../auth/providers/index.js';

export interface AuthCommandOptions {
  // No options yet
}

/**
 * Auth command - Browser-based OAuth authentication for integrations
 *
 * Usage:
 *   ralph-starter auth <service>    Start OAuth flow for a service
 *   ralph-starter auth --list       Show auth status for all services
 *   ralph-starter auth --logout <service>  Remove credentials for a service
 */
export async function authCommand(
  service: string | undefined,
  options: { list?: boolean; logout?: string }
): Promise<void> {
  // Handle --list
  if (options.list) {
    await showAuthStatus();
    return;
  }

  // Handle --logout
  if (options.logout) {
    await logoutService(options.logout);
    return;
  }

  // No service specified - show help
  if (!service) {
    showAuthHelp();
    return;
  }

  // Start OAuth flow for the service
  await startOAuthFlow(service);
}

/**
 * Show authentication status for all services
 */
async function showAuthStatus(): Promise<void> {
  console.log(chalk.bold('\nAuthentication Status'));
  console.log(chalk.dim(`Credentials stored in: ${getSourcesConfigPath()}\n`));

  const providers = getProviderNames();

  for (const name of providers) {
    const provider = getProvider(name);
    if (!provider) continue;

    const credentials = getSourceCredentials(name);
    const hasToken = credentials?.token || credentials?.apiKey;
    const isConfigured = checkProviderConfigured(provider);

    if (hasToken) {
      console.log(`  ${chalk.green('✓')} ${chalk.bold(provider.displayName)} - Authenticated`);
    } else if (isConfigured) {
      console.log(`  ${chalk.yellow('○')} ${chalk.bold(provider.displayName)} - OAuth app configured, not authenticated`);
      console.log(chalk.dim(`      Run: ralph-starter auth ${name}`));
    } else {
      console.log(`  ${chalk.dim('○')} ${chalk.bold(provider.displayName)} - Not configured`);
      console.log(chalk.dim(`      Set RALPH_${name.toUpperCase()}_CLIENT_ID and RALPH_${name.toUpperCase()}_CLIENT_SECRET`));
    }
  }

  // Show manual config option
  console.log(chalk.dim('\n  Or configure API keys manually:'));
  console.log(chalk.dim('    ralph-starter config set <service>.apiKey <value>'));
  console.log();
}

/**
 * Logout from a service (remove credentials)
 */
async function logoutService(service: string): Promise<void> {
  const provider = getProvider(service);
  if (!provider) {
    console.error(chalk.red(`Unknown service: ${service}`));
    console.error(chalk.dim(`\nAvailable services: ${getProviderNames().join(', ')}`));
    process.exit(1);
  }

  // Delete token and apiKey
  const deletedToken = deleteSourceCredential(service, 'token');
  const deletedApiKey = deleteSourceCredential(service, 'apiKey');

  if (deletedToken || deletedApiKey) {
    console.log(chalk.green(`✓ Logged out from ${provider.displayName}`));
  } else {
    console.log(chalk.yellow(`No credentials found for ${provider.displayName}`));
  }
}

/**
 * Start the OAuth flow for a service
 */
async function startOAuthFlow(service: string): Promise<void> {
  const provider = getProvider(service);

  if (!provider) {
    console.error(chalk.red(`Unknown service: ${service}`));
    console.error(chalk.dim(`\nAvailable services: ${getProviderNames().join(', ')}`));
    process.exit(1);
  }

  // Check if OAuth is configured for this provider
  if (!checkProviderConfigured(provider)) {
    console.error(chalk.red(`OAuth not configured for ${provider.displayName}`));
    console.error(chalk.dim('\nTo enable OAuth authentication, set these environment variables:'));
    console.error(chalk.cyan(`  RALPH_${service.toUpperCase()}_CLIENT_ID=<your-client-id>`));
    console.error(chalk.cyan(`  RALPH_${service.toUpperCase()}_CLIENT_SECRET=<your-client-secret>`));
    console.error(chalk.dim('\nOr use manual API key configuration:'));
    console.error(chalk.cyan(`  ralph-starter config set ${service}.apiKey <your-api-key>`));
    console.error(chalk.dim(`\nGet API keys from: ${getApiKeyUrl(service)}`));
    process.exit(1);
  }

  console.log();
  console.log(chalk.bold(`Authenticating with ${provider.displayName}...`));

  // Get a random port for the callback server
  const port = getRandomPort();
  const redirectUri = getCallbackUrl(port);

  // Generate state for CSRF protection
  const state = crypto.randomBytes(16).toString('hex');

  // Build authorization URL
  const authUrl = provider.buildAuthUrl(redirectUri, state);

  console.log(chalk.dim(`Opening browser for authorization...`));
  console.log(chalk.dim(`Callback URL: ${redirectUri}`));
  console.log();

  // Start the callback server
  const serverPromise = startOAuthServer({
    port,
    timeoutMs: 5 * 60 * 1000, // 5 minutes
  });

  // Open browser to authorization URL
  try {
    await openBrowser(authUrl);
  } catch (error) {
    console.log(chalk.yellow('Could not open browser automatically.'));
    console.log(chalk.dim('Please open this URL manually:'));
    console.log();
    console.log(chalk.cyan(authUrl));
    console.log();
  }

  // Wait for callback
  const spinner = ora('Waiting for authorization...').start();

  try {
    const result = await serverPromise;

    // Verify state
    if (result.state !== state) {
      spinner.fail('State mismatch - possible CSRF attack');
      process.exit(1);
    }

    spinner.text = 'Exchanging code for token...';

    // Exchange code for token
    const tokens = await provider.exchangeCode(result.code, redirectUri);

    // Save the token
    setSourceCredential(service, 'token', tokens.accessToken);

    if (tokens.refreshToken) {
      setSourceCredential(service, 'refreshToken', tokens.refreshToken);
    }

    spinner.succeed(chalk.green(`Successfully authenticated with ${provider.displayName}!`));
    console.log();
    console.log(chalk.dim('You can now use this integration:'));
    console.log(chalk.cyan(`  ralph-starter run --from ${service} --project <id>`));
    console.log();
  } catch (error) {
    spinner.fail(chalk.red('Authentication failed'));
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(chalk.dim(errorMessage));
    process.exit(1);
  }
}

/**
 * Check if a provider has OAuth configured
 */
function checkProviderConfigured(provider: OAuthProvider): boolean {
  const p = provider as OAuthProvider & { isConfigured?: () => boolean };
  return p.isConfigured?.() ?? !!(provider.clientId && provider.clientSecret);
}

/**
 * Get the URL where users can get API keys for a service
 */
function getApiKeyUrl(service: string): string {
  const urls: Record<string, string> = {
    notion: 'https://www.notion.so/my-integrations',
    linear: 'https://linear.app/settings/api',
    todoist: 'https://todoist.com/prefs/integrations',
    github: 'https://github.com/settings/tokens',
  };
  return urls[service] || 'the service\'s developer settings';
}

/**
 * Show auth command help
 */
function showAuthHelp(): void {
  console.log(`
${chalk.bold('ralph-starter auth')} - Browser-based OAuth authentication

${chalk.bold('Usage:')}
  ralph-starter auth <service>         Start OAuth flow for a service
  ralph-starter auth --list            Show authentication status
  ralph-starter auth --logout <service> Remove credentials for a service

${chalk.bold('Services:')}
  notion   - Notion workspace access
  linear   - Linear project management
  todoist  - Todoist task management

${chalk.bold('Examples:')}
  ralph-starter auth notion
  ralph-starter auth --list
  ralph-starter auth --logout notion

${chalk.bold('Setup:')}
  OAuth authentication requires registered OAuth applications.
  Set these environment variables for each service:

  ${chalk.dim('# Notion')}
  RALPH_NOTION_CLIENT_ID=<client-id>
  RALPH_NOTION_CLIENT_SECRET=<client-secret>

  ${chalk.dim('# Linear')}
  RALPH_LINEAR_CLIENT_ID=<client-id>
  RALPH_LINEAR_CLIENT_SECRET=<client-secret>

  ${chalk.dim('# Todoist')}
  RALPH_TODOIST_CLIENT_ID=<client-id>
  RALPH_TODOIST_CLIENT_SECRET=<client-secret>

${chalk.bold('Manual Configuration:')}
  You can also configure API keys manually without OAuth:
  ralph-starter config set notion.apiKey <your-api-key>
`);
}
