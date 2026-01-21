import chalk from 'chalk';
import {
  readSourcesConfig,
  setSourceCredential,
  deleteSourceCredential,
  getSourcesConfigPath,
  listConfiguredSources,
  getSourceConfig,
  deleteSourceConfig,
} from '../sources/config.js';
import { getSource, getAllSources } from '../sources/index.js';

export interface ConfigCommandOptions {
  // No options for now
}

/**
 * Config command - manage source credentials and settings
 *
 * Usage:
 *   ralph-starter config list                    - List all configured sources
 *   ralph-starter config get <source>            - Show config for a source
 *   ralph-starter config set <source>.<key> <value> - Set a config value
 *   ralph-starter config delete <source>.<key>  - Delete a config value
 *   ralph-starter config delete <source>        - Delete all config for a source
 */
export async function configCommand(
  action: string,
  args: string[],
  _options?: ConfigCommandOptions
): Promise<void> {
  switch (action) {
    case 'list':
      await listConfig();
      break;

    case 'get':
      if (args.length < 1) {
        console.error(chalk.red('Usage: ralph-starter config get <source>'));
        process.exit(1);
      }
      await getConfig(args[0]);
      break;

    case 'set':
      if (args.length < 2) {
        console.error(chalk.red('Usage: ralph-starter config set <source>.<key> <value>'));
        process.exit(1);
      }
      await setConfig(args[0], args[1]);
      break;

    case 'delete':
    case 'rm':
      if (args.length < 1) {
        console.error(chalk.red('Usage: ralph-starter config delete <source>[.<key>]'));
        process.exit(1);
      }
      await deleteConfig(args[0]);
      break;

    case 'path':
      console.log(getSourcesConfigPath());
      break;

    default:
      showConfigHelp();
      break;
  }
}

async function listConfig(): Promise<void> {
  const configuredSources = listConfiguredSources();
  const allSources = getAllSources();

  console.log(chalk.bold('\nSource Configuration'));
  console.log(chalk.dim(`Config file: ${getSourcesConfigPath()}\n`));

  if (configuredSources.length === 0) {
    console.log(chalk.yellow('No sources configured yet.'));
    console.log(chalk.dim('\nAvailable sources:'));

    for (const source of allSources) {
      if (source.requiresAuth()) {
        console.log(chalk.dim(`  ${source.name} - ${source.description}`));
      }
    }

    console.log(chalk.dim('\nTo configure a source:'));
    console.log(chalk.cyan('  ralph-starter config set <source>.apiKey <value>'));
    return;
  }

  // Show configured sources
  console.log(chalk.green('Configured sources:'));

  for (const sourceName of configuredSources) {
    const source = getSource(sourceName);
    const config = getSourceConfig(sourceName);

    const icon = source ? '✓' : '?';
    const description = source?.description || 'Unknown source';

    console.log(`  ${chalk.green(icon)} ${chalk.bold(sourceName)} - ${chalk.dim(description)}`);

    if (config?.credentials) {
      for (const [key, value] of Object.entries(config.credentials)) {
        const masked = maskValue(value || '');
        console.log(chalk.dim(`      ${key}: ${masked}`));
      }
    }
  }

  // Show unconfigured sources that need auth
  const unconfigured = allSources.filter(
    (s) => s.requiresAuth() && !configuredSources.includes(s.name)
  );

  if (unconfigured.length > 0) {
    console.log(chalk.dim('\nNot configured:'));
    for (const source of unconfigured) {
      console.log(chalk.dim(`  ○ ${source.name} - ${source.description}`));
    }
  }
}

async function getConfig(sourceName: string): Promise<void> {
  const config = getSourceConfig(sourceName);
  const source = getSource(sourceName);

  console.log(chalk.bold(`\n${sourceName}`));

  if (source) {
    console.log(chalk.dim(source.description));
  }

  console.log();

  if (!config) {
    console.log(chalk.yellow('No configuration found.'));

    if (source?.requiresAuth()) {
      console.log(chalk.dim('\nTo configure:'));
      console.log(chalk.cyan(`  ralph-starter config set ${sourceName}.apiKey <value>`));
    }
    return;
  }

  if (config.credentials) {
    console.log('Credentials:');
    for (const [key, value] of Object.entries(config.credentials)) {
      const masked = maskValue(value || '');
      console.log(`  ${key}: ${masked}`);
    }
  }

  if (config.defaults) {
    console.log('\nDefaults:');
    for (const [key, value] of Object.entries(config.defaults)) {
      console.log(`  ${key}: ${value}`);
    }
  }

  if (config.enabled === false) {
    console.log(chalk.yellow('\nSource is disabled'));
  }
}

async function setConfig(keyPath: string, value: string): Promise<void> {
  const [sourceName, ...keyParts] = keyPath.split('.');
  const key = keyParts.join('.');

  if (!key) {
    console.error(chalk.red('Invalid key path. Use: <source>.<key>'));
    console.error(chalk.dim('Example: ralph-starter config set todoist.apiKey abc123'));
    process.exit(1);
  }

  // Validate source exists
  const source = getSource(sourceName);
  if (!source) {
    const allSources = getAllSources();
    console.error(chalk.red(`Unknown source: ${sourceName}`));
    console.error(chalk.dim('\nAvailable sources:'));
    for (const s of allSources) {
      console.error(chalk.dim(`  - ${s.name}`));
    }
    process.exit(1);
  }

  // Set the credential
  setSourceCredential(sourceName, key, value);

  console.log(chalk.green(`✓ Set ${sourceName}.${key}`));
}

async function deleteConfig(keyPath: string): Promise<void> {
  const [sourceName, ...keyParts] = keyPath.split('.');
  const key = keyParts.join('.');

  if (!key) {
    // Delete entire source config
    const deleted = deleteSourceConfig(sourceName);
    if (deleted) {
      console.log(chalk.green(`✓ Deleted all configuration for ${sourceName}`));
    } else {
      console.log(chalk.yellow(`No configuration found for ${sourceName}`));
    }
    return;
  }

  // Delete specific key
  const deleted = deleteSourceCredential(sourceName, key);
  if (deleted) {
    console.log(chalk.green(`✓ Deleted ${sourceName}.${key}`));
  } else {
    console.log(chalk.yellow(`Key not found: ${sourceName}.${key}`));
  }
}

function showConfigHelp(): void {
  console.log(`
${chalk.bold('ralph-starter config')} - Manage source configuration

${chalk.bold('Commands:')}
  list                          List all configured sources
  get <source>                  Show configuration for a source
  set <source>.<key> <value>    Set a configuration value
  delete <source>[.<key>]       Delete configuration
  path                          Show config file path

${chalk.bold('Examples:')}
  ralph-starter config list
  ralph-starter config set todoist.apiKey abc123
  ralph-starter config set github.token ghp_xxx
  ralph-starter config set linear.apiKey lin_xxx
  ralph-starter config set notion.token secret_xxx
  ralph-starter config get todoist
  ralph-starter config delete todoist.apiKey
  ralph-starter config delete todoist

${chalk.bold('Getting API Keys:')}
  todoist   https://todoist.com/prefs/integrations
  github    https://github.com/settings/tokens (or use 'gh auth login')
  linear    https://linear.app/settings/api
  notion    https://www.notion.so/my-integrations
`);
}

function maskValue(value: string): string {
  if (value.length <= 8) {
    return '*'.repeat(value.length);
  }
  return value.slice(0, 4) + '*'.repeat(value.length - 8) + value.slice(-4);
}
