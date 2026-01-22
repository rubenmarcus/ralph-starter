import chalk from 'chalk';
import ora from 'ora';
import {
  getAllIntegrations,
  getIntegration,
  getIntegrationsInfo,
  fetchFromIntegration,
} from '../integrations/index.js';

export interface IntegrationsCommandOptions {
  project?: string;
  label?: string;
  status?: string;
  limit?: number;
}

/**
 * Integrations command - list, help, and test integrations
 *
 * Usage:
 *   ralph-starter integrations list           - List all integrations with status
 *   ralph-starter integrations help <name>    - Show help for a specific integration
 *   ralph-starter integrations test <name>    - Test integration connectivity
 *   ralph-starter integrations fetch <name>   - Fetch and preview data
 */
export async function integrationsCommand(
  action: string,
  args: string[],
  options?: IntegrationsCommandOptions
): Promise<void> {
  switch (action) {
    case 'list':
    case 'ls':
      await listIntegrations();
      break;

    case 'help':
      if (args.length < 1) {
        console.error(chalk.red('Usage: ralph-starter integrations help <name>'));
        process.exit(1);
      }
      showIntegrationHelp(args[0]);
      break;

    case 'test':
      if (args.length < 1) {
        console.error(chalk.red('Usage: ralph-starter integrations test <name>'));
        process.exit(1);
      }
      await testIntegration(args[0]);
      break;

    case 'fetch':
    case 'preview':
      if (args.length < 2) {
        console.error(chalk.red('Usage: ralph-starter integrations fetch <name> <identifier>'));
        process.exit(1);
      }
      await fetchAndPreview(args[0], args[1], options);
      break;

    default:
      showCommandHelp();
      break;
  }
}

async function listIntegrations(): Promise<void> {
  const spinner = ora('Loading integrations...').start();

  try {
    const integrations = await getIntegrationsInfo();
    spinner.stop();

    console.log();
    console.log(chalk.bold.cyan('Available Integrations'));
    console.log(chalk.dim('─'.repeat(60)));
    console.log();

    for (const integration of integrations) {
      // Status indicator
      const statusIcon = integration.available
        ? chalk.green('✓')
        : chalk.yellow('○');

      // Auth methods
      const authBadges = integration.authMethods.map((m) => {
        switch (m) {
          case 'cli':
            return chalk.blue('CLI');
          case 'api-key':
            return chalk.magenta('API Key');
          case 'oauth':
            return chalk.cyan('OAuth');
          case 'none':
            return chalk.gray('No Auth');
          default:
            return m;
        }
      });

      // Display
      console.log(
        `  ${statusIcon} ${chalk.bold(integration.displayName)} ${chalk.dim(`(${integration.name})`)}`
      );
      console.log(`    ${chalk.dim(integration.description)}`);
      console.log(`    ${chalk.dim('Auth:')} ${authBadges.join(', ')}`);

      if (!integration.available) {
        console.log(
          `    ${chalk.yellow('→')} Run: ${chalk.cyan(`ralph-starter integrations help ${integration.name}`)}`
        );
      }

      console.log();
    }

    console.log(chalk.dim('─'.repeat(60)));
    console.log(chalk.dim('Use "ralph-starter integrations help <name>" for setup instructions'));
    console.log();
  } catch (error) {
    spinner.fail('Failed to load integrations');
    throw error;
  }
}

function showIntegrationHelp(name: string): void {
  const integration = getIntegration(name);

  if (!integration) {
    console.error(chalk.red(`Unknown integration: ${name}`));
    console.error(
      chalk.dim('\nUse "ralph-starter integrations list" to see available integrations')
    );
    process.exit(1);
  }

  console.log();
  console.log(integration.getHelp());
  console.log();
}

async function testIntegration(name: string): Promise<void> {
  const spinner = ora(`Testing ${name}...`).start();

  const integration = getIntegration(name);

  if (!integration) {
    spinner.fail(`Unknown integration: ${name}`);
    process.exit(1);
  }

  try {
    const available = await integration.isAvailable();
    const authMethod = await integration.getConfiguredAuthMethod();

    if (available && authMethod) {
      spinner.succeed(
        chalk.green(`${integration.displayName}: Connected via ${authMethod}`)
      );
    } else {
      spinner.fail(
        chalk.yellow(`${integration.displayName}: Not configured`)
      );
      console.log();
      console.log(chalk.dim('Run the following for setup instructions:'));
      console.log(chalk.cyan(`  ralph-starter integrations help ${name}`));
      process.exit(1);
    }
  } catch (error) {
    spinner.fail(`${integration.displayName}: ${(error as Error).message}`);
    process.exit(1);
  }
}

async function fetchAndPreview(
  name: string,
  identifier: string,
  options?: IntegrationsCommandOptions
): Promise<void> {
  const spinner = ora(`Fetching from ${name}...`).start();

  try {
    const result = await fetchFromIntegration(name, identifier, {
      project: options?.project,
      label: options?.label,
      status: options?.status,
      limit: options?.limit || 5,
    });

    spinner.succeed('Content fetched');

    console.log();
    console.log(chalk.bold.cyan('Source:'), result.source);
    if (result.title) {
      console.log(chalk.bold.cyan('Title:'), result.title);
    }
    if (result.metadata) {
      console.log(
        chalk.bold.cyan('Metadata:'),
        JSON.stringify(result.metadata, null, 2)
      );
    }

    console.log();
    console.log(chalk.bold('Preview:'));
    console.log(chalk.dim('─'.repeat(60)));

    // Show first 50 lines
    const lines = result.content.split('\n');
    const preview = lines.slice(0, 50).join('\n');
    console.log(preview);

    if (lines.length > 50) {
      console.log(chalk.dim(`\n... and ${lines.length - 50} more lines`));
    }

    console.log(chalk.dim('─'.repeat(60)));
  } catch (error) {
    spinner.fail('Failed to fetch content');
    console.error(chalk.red((error as Error).message));
    process.exit(1);
  }
}

function showCommandHelp(): void {
  console.log(`
${chalk.bold('ralph-starter integrations')} - Manage integrations

${chalk.bold('Commands:')}
  list                          List all integrations with status
  help <name>                   Show help for a specific integration
  test <name>                   Test integration connectivity
  fetch <name> <identifier>     Fetch and preview data

${chalk.bold('Fetch Options:')}
  --project <name>              Project/repo name
  --label <name>                Filter by label
  --status <status>             Filter by status (e.g., open, closed)
  --limit <n>                   Maximum items to fetch

${chalk.bold('Available Integrations:')}
  github                        GitHub issues and PRs
  linear                        Linear issues
  notion                        Notion pages (public and private)

${chalk.bold('Examples:')}
  ralph-starter integrations list
  ralph-starter integrations help github
  ralph-starter integrations test linear
  ralph-starter integrations fetch github owner/repo
  ralph-starter integrations fetch notion "https://notion.so/Page-abc123"
`);
}
