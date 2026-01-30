import chalk from 'chalk';
import {
  getLLMApiKey,
  getLLMProvider,
  readConfig,
  setLLMApiKey,
  setLLMProvider,
  writeConfig,
} from '../config/manager.js';
import { type LLMProvider, PROVIDER_NAMES, PROVIDERS } from '../llm/index.js';
import {
  deleteSourceConfig,
  deleteSourceCredential,
  getSourceConfig,
  getSourcesConfigPath,
  listConfiguredSources,
  setSourceCredential,
} from '../sources/config.js';
import { getAllSources, getSource } from '../sources/index.js';

export type ConfigCommandOptions = {};

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

    case 'help':
      showConfigHelp();
      break;

    case 'get':
      if (args.length < 1) {
        console.error(chalk.red('Usage: ralph-starter config get <source|llm>'));
        console.log();
        console.log(chalk.dim('Available:'));
        console.log(chalk.dim('  - llm (LLM provider settings)'));
        const sources = getAllSources();
        for (const s of sources) {
          if (s.requiresAuth()) {
            console.log(chalk.dim(`  - ${s.name}`));
          }
        }
        process.exit(1);
      }
      // Handle llm config separately
      if (args[0] === 'llm') {
        await getLLMConfig();
      } else {
        await getConfig(args[0]);
      }
      break;

    case 'set':
      if (args.length < 2) {
        console.error(chalk.red('Usage: ralph-starter config set <source>.<key> <value>'));
        process.exit(1);
      }
      // Handle llm.* config separately
      if (args[0].startsWith('llm.')) {
        await setLLMConfig(args[0], args[1]);
      } else {
        await setConfig(args[0], args[1]);
      }
      break;

    case 'delete':
    case 'rm':
      if (args.length < 1) {
        console.error(chalk.red('Usage: ralph-starter config delete <source>[.<key>]'));
        process.exit(1);
      }
      // Handle llm config separately
      if (args[0] === 'llm' || args[0].startsWith('llm.')) {
        await deleteLLMConfig(args[0]);
      } else {
        await deleteConfig(args[0]);
      }
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

  // Show LLM configuration first
  console.log(chalk.bold('\nLLM Configuration'));
  const config = readConfig();
  const currentProvider = getLLMProvider();
  const currentKey = getLLMApiKey(currentProvider);

  if (currentKey) {
    console.log(
      `  ${chalk.green('✓')} ${chalk.bold('Provider:')} ${PROVIDERS[currentProvider].displayName}`
    );
    console.log(chalk.dim(`      API Key: ${maskValue(currentKey)}`));
    if (config.llm?.model) {
      console.log(chalk.dim(`      Model: ${config.llm.model}`));
    }
  } else {
    console.log(chalk.yellow('  No LLM API key configured.'));
    console.log(chalk.dim('\n  Available providers:'));
    for (const provider of PROVIDER_NAMES) {
      const p = PROVIDERS[provider];
      console.log(chalk.dim(`    - ${provider} (${p.displayName})`));
      console.log(chalk.dim(`      Env: ${p.envVar} | Console: ${p.consoleUrl}`));
    }
    console.log(chalk.dim('\n  To configure:'));
    console.log(chalk.cyan('    ralph-starter config set llm.provider anthropic'));
    console.log(chalk.cyan('    ralph-starter config set llm.apiKey <your-key>'));
  }

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
    const sourceConfig = getSourceConfig(sourceName);

    const icon = source ? '✓' : '?';
    const description = source?.description || 'Unknown source';

    console.log(`  ${chalk.green(icon)} ${chalk.bold(sourceName)} - ${chalk.dim(description)}`);

    if (sourceConfig?.credentials) {
      for (const [key, value] of Object.entries(sourceConfig.credentials)) {
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
    console.error(chalk.dim('Example: ralph-starter config set github.token ghp_xxx'));
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

async function getLLMConfig(): Promise<void> {
  const config = readConfig();
  const currentProvider = getLLMProvider();
  const currentKey = getLLMApiKey(currentProvider);

  console.log(chalk.bold('\nLLM Configuration\n'));

  console.log(`Provider: ${chalk.cyan(PROVIDERS[currentProvider].displayName)}`);

  if (currentKey) {
    console.log(`API Key:  ${maskValue(currentKey)}`);
  } else {
    console.log(chalk.yellow('API Key:  Not configured'));
  }

  if (config.llm?.model) {
    console.log(`Model:    ${config.llm.model}`);
  } else {
    console.log(`Model:    ${chalk.dim(`${PROVIDERS[currentProvider].defaultModel} (default)`)}`);
  }

  // Show key source
  const envKey = process.env[PROVIDERS[currentProvider].envVar];
  if (envKey) {
    console.log(
      chalk.dim(`\nKey source: Environment variable (${PROVIDERS[currentProvider].envVar})`)
    );
  } else if (currentKey) {
    console.log(chalk.dim('\nKey source: Config file'));
  }

  console.log(chalk.dim(`\nConsole: ${PROVIDERS[currentProvider].consoleUrl}`));
}

async function setLLMConfig(keyPath: string, value: string): Promise<void> {
  const key = keyPath.replace('llm.', '');

  switch (key) {
    case 'provider': {
      if (!PROVIDER_NAMES.includes(value as LLMProvider)) {
        console.error(chalk.red(`Invalid provider: ${value}`));
        console.log(chalk.dim(`Valid providers: ${PROVIDER_NAMES.join(', ')}`));
        process.exit(1);
      }
      setLLMProvider(value as LLMProvider);
      console.log(
        chalk.green(`✓ Set LLM provider to ${PROVIDERS[value as LLMProvider].displayName}`)
      );
      break;
    }
    case 'apiKey': {
      const provider = getLLMProvider();
      setLLMApiKey(provider, value);
      console.log(chalk.green(`✓ Set API key for ${PROVIDERS[provider].displayName}`));
      break;
    }
    case 'model': {
      const config = readConfig();
      config.llm = { ...config.llm, model: value };
      writeConfig(config);
      console.log(chalk.green(`✓ Set model to ${value}`));
      break;
    }
    default:
      console.error(chalk.red(`Unknown LLM config key: ${key}`));
      console.log(chalk.dim('Valid keys: provider, apiKey, model'));
      process.exit(1);
  }
}

async function deleteLLMConfig(keyPath: string): Promise<void> {
  const config = readConfig();
  const key = keyPath === 'llm' ? 'all' : keyPath.replace('llm.', '');

  switch (key) {
    case 'all': {
      delete config.llm;
      delete config.providers;
      delete config.apiKey; // Legacy
      writeConfig(config);
      console.log(chalk.green('✓ Deleted all LLM configuration'));
      break;
    }
    case 'provider': {
      if (config.llm) {
        delete config.llm.provider;
        writeConfig(config);
      }
      console.log(chalk.green('✓ Deleted LLM provider setting'));
      break;
    }
    case 'apiKey': {
      const provider = getLLMProvider();
      if (config.providers?.[provider]) {
        delete config.providers[provider];
        writeConfig(config);
      }
      // Also clear legacy key if it's anthropic
      if (provider === 'anthropic' && config.apiKey) {
        delete config.apiKey;
        writeConfig(config);
      }
      console.log(chalk.green(`✓ Deleted API key for ${PROVIDERS[provider].displayName}`));
      break;
    }
    case 'model': {
      if (config.llm) {
        delete config.llm.model;
        writeConfig(config);
      }
      console.log(chalk.green('✓ Deleted model setting'));
      break;
    }
    default:
      console.error(chalk.red(`Unknown LLM config key: ${key}`));
      process.exit(1);
  }
}

function showConfigHelp(): void {
  console.log(`
${chalk.bold('ralph-starter config')} - Manage configuration

${chalk.bold('Commands:')}
  list                          List all configuration (LLM + sources)
  get <llm|source>              Show configuration
  set <key> <value>             Set a configuration value
  delete <key>                  Delete configuration
  path                          Show config file path

${chalk.bold('LLM Configuration:')}
  ralph-starter config get llm
  ralph-starter config set llm.provider <anthropic|openai|openrouter>
  ralph-starter config set llm.apiKey <your-api-key>
  ralph-starter config set llm.model <model-name>
  ralph-starter config delete llm

${chalk.bold('Source Configuration:')}
  ralph-starter config set github.token ghp_xxx
  ralph-starter config set github.defaultIssuesRepo owner/repo
  ralph-starter config set linear.apiKey lin_xxx
  ralph-starter config set notion.token secret_xxx
  ralph-starter config get github
  ralph-starter config delete github

${chalk.bold('LLM Providers:')}
  anthropic   https://console.anthropic.com/ (ANTHROPIC_API_KEY)
  openai      https://platform.openai.com/api-keys (OPENAI_API_KEY)
  openrouter  https://openrouter.ai/keys (OPENROUTER_API_KEY)

${chalk.bold('Source API Keys:')}
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
