import chalk from 'chalk';
import ora from 'ora';
import {
  getSourcesInfo,
  getSource,
  getSourceHelp,
  testSource,
  fetchFromSource,
} from '../sources/index.js';

export interface SourceCommandOptions {
  project?: string;
  label?: string;
  status?: string;
  limit?: number;
}

/**
 * Source command - list, test, and preview sources
 *
 * Usage:
 *   ralph-starter source list           - List all available sources
 *   ralph-starter source help <source>  - Show help for a specific source
 *   ralph-starter source test <source>  - Test source connectivity
 *   ralph-starter source preview <identifier> - Preview content from a source
 */
export async function sourceCommand(
  action: string,
  args: string[],
  options?: SourceCommandOptions
): Promise<void> {
  switch (action) {
    case 'list':
    case 'ls':
      await listSources();
      break;

    case 'help':
      if (args.length < 1) {
        console.error(chalk.red('Usage: ralph-starter source help <source>'));
        process.exit(1);
      }
      showSourceHelp(args[0]);
      break;

    case 'test':
      if (args.length < 1) {
        console.error(chalk.red('Usage: ralph-starter source test <source>'));
        process.exit(1);
      }
      await testSourceConnection(args[0]);
      break;

    case 'preview':
      if (args.length < 1) {
        console.error(chalk.red('Usage: ralph-starter source preview <identifier>'));
        process.exit(1);
      }
      await previewSource(args[0], options);
      break;

    default:
      showSourceCommandHelp();
      break;
  }
}

async function listSources(): Promise<void> {
  const spinner = ora('Loading sources...').start();

  try {
    const sources = await getSourcesInfo();
    spinner.stop();

    console.log(chalk.bold('\nAvailable Sources\n'));

    // Group by type
    const builtins = sources.filter((s) => s.type === 'builtin');
    const integrations = sources.filter((s) => s.type === 'integration');

    // Built-in sources
    console.log(chalk.cyan.bold('Built-in'));
    for (const source of builtins) {
      const status = source.available
        ? chalk.green('✓')
        : chalk.red('✗');
      console.log(`  ${status} ${chalk.bold(source.name)} - ${source.description}`);
    }

    console.log();

    // Integration sources
    console.log(chalk.cyan.bold('Integrations'));
    for (const source of integrations) {
      const status = source.available
        ? chalk.green('✓ configured')
        : chalk.yellow('○ not configured');
      console.log(
        `  ${source.available ? chalk.green('✓') : chalk.yellow('○')} ${chalk.bold(source.name)} - ${source.description}`
      );
      if (!source.available && source.requiresAuth) {
        console.log(
          chalk.dim(`      Run: ralph-starter config set ${source.name}.apiKey <value>`)
        );
      }
    }

    console.log();
    console.log(chalk.dim('Use "ralph-starter source help <name>" for details'));
  } catch (error) {
    spinner.fail('Failed to load sources');
    throw error;
  }
}

function showSourceHelp(sourceName: string): void {
  const help = getSourceHelp(sourceName);

  if (!help) {
    console.error(chalk.red(`Unknown source: ${sourceName}`));
    console.error(chalk.dim('\nUse "ralph-starter source list" to see available sources'));
    process.exit(1);
  }

  console.log();
  console.log(help);
  console.log();
}

async function testSourceConnection(sourceName: string): Promise<void> {
  const spinner = ora(`Testing ${sourceName}...`).start();

  const result = await testSource(sourceName);

  if (result.success) {
    spinner.succeed(chalk.green(`${sourceName}: ${result.message}`));
  } else {
    spinner.fail(chalk.red(`${sourceName}: ${result.message}`));
    process.exit(1);
  }
}

async function previewSource(
  identifier: string,
  options?: SourceCommandOptions
): Promise<void> {
  const spinner = ora('Fetching content...').start();

  try {
    const result = await fetchFromSource(identifier, {
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
      console.log(chalk.bold.cyan('Metadata:'), JSON.stringify(result.metadata, null, 2));
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

function showSourceCommandHelp(): void {
  console.log(`
${chalk.bold('ralph-starter source')} - Manage input sources

${chalk.bold('Commands:')}
  list                          List all available sources
  help <source>                 Show help for a specific source
  test <source>                 Test source connectivity
  preview <identifier>          Preview content from a source

${chalk.bold('Preview Options:')}
  --project <name>              Project/repo name for integrations
  --label <name>                Filter by label
  --status <status>             Filter by status (e.g., open, closed)
  --limit <n>                   Maximum items to fetch

${chalk.bold('Examples:')}
  ralph-starter source list
  ralph-starter source help github
  ralph-starter source test todoist
  ralph-starter source preview ./spec.md
  ralph-starter source preview https://example.com/spec.md
  ralph-starter source preview github --project owner/repo --label bug
  ralph-starter source preview todoist --project "My Project"

${chalk.bold('Identifier Formats:')}
  ./path/to/file.md             Local file
  https://example.com/spec.md   Remote URL
  github:owner/repo             GitHub issues
  todoist:project-name          Todoist tasks
  linear:TEAM-KEY               Linear issues
  notion:page-id                Notion page
`);
}
