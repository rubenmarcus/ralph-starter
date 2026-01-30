import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import chalk from 'chalk';
import inquirer from 'inquirer';
import ora from 'ora';
import { type RunCommandOptions, runCommand } from './run.js';

const TEMPLATES_REPO_URL = 'https://raw.githubusercontent.com/rubenmarcus/ralph-templates/main';
const TEMPLATES_JSON_URL = `${TEMPLATES_REPO_URL}/templates.json`;
const CACHE_DIR = join(homedir(), '.ralph-starter', 'templates-cache');
const CACHE_DURATION_MS = 1000 * 60 * 60; // 1 hour

interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  path: string;
}

interface TemplateCategory {
  id: string;
  name: string;
  description: string;
}

interface TemplatesRegistry {
  version: string;
  templates: Template[];
  categories: TemplateCategory[];
}

interface CacheMetadata {
  fetchedAt: number;
  version: string;
}

function ensureCacheDir(): void {
  if (!existsSync(CACHE_DIR)) {
    mkdirSync(CACHE_DIR, { recursive: true });
  }
}

function getCacheMetadataPath(): string {
  return join(CACHE_DIR, 'metadata.json');
}

function getTemplateCachePath(templateId: string): string {
  return join(CACHE_DIR, `${templateId}.md`);
}

function getRegistryCachePath(): string {
  return join(CACHE_DIR, 'templates.json');
}

function isCacheValid(): boolean {
  const metadataPath = getCacheMetadataPath();
  if (!existsSync(metadataPath)) {
    return false;
  }

  try {
    const metadata: CacheMetadata = JSON.parse(readFileSync(metadataPath, 'utf-8'));
    const age = Date.now() - metadata.fetchedAt;
    return age < CACHE_DURATION_MS;
  } catch {
    return false;
  }
}

function saveCacheMetadata(version: string): void {
  ensureCacheDir();
  const metadata: CacheMetadata = {
    fetchedAt: Date.now(),
    version,
  };
  writeFileSync(getCacheMetadataPath(), JSON.stringify(metadata, null, 2));
}

async function fetchRegistry(useCache = true): Promise<TemplatesRegistry> {
  const cachePath = getRegistryCachePath();

  // Check cache first
  if (useCache && isCacheValid() && existsSync(cachePath)) {
    try {
      return JSON.parse(readFileSync(cachePath, 'utf-8'));
    } catch {
      // Cache corrupted, fetch fresh
    }
  }

  // Fetch from remote
  const response = await fetch(TEMPLATES_JSON_URL);
  if (!response.ok) {
    throw new Error(`Failed to fetch templates registry: ${response.statusText}`);
  }

  const registry: TemplatesRegistry = await response.json();

  // Save to cache
  ensureCacheDir();
  writeFileSync(cachePath, JSON.stringify(registry, null, 2));
  saveCacheMetadata(registry.version);

  return registry;
}

async function fetchTemplateContent(template: Template, useCache = true): Promise<string> {
  const cachePath = getTemplateCachePath(template.id);

  // Check cache first
  if (useCache && isCacheValid() && existsSync(cachePath)) {
    try {
      return readFileSync(cachePath, 'utf-8');
    } catch {
      // Cache corrupted, fetch fresh
    }
  }

  // Fetch from remote
  const templateUrl = `${TEMPLATES_REPO_URL}/${template.path}`;
  const response = await fetch(templateUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch template: ${response.statusText}`);
  }

  const content = await response.text();

  // Save to cache
  ensureCacheDir();
  writeFileSync(cachePath, content);

  return content;
}

function getDifficultyBadge(difficulty: string): string {
  switch (difficulty) {
    case 'beginner':
      return chalk.green(`[${difficulty}]`);
    case 'intermediate':
      return chalk.yellow(`[${difficulty}]`);
    case 'advanced':
      return chalk.red(`[${difficulty}]`);
    default:
      return chalk.white(`[${difficulty}]`);
  }
}

async function listTemplates(options: { category?: string; refresh?: boolean }): Promise<void> {
  const spinner = ora('Fetching templates...').start();

  try {
    const registry = await fetchRegistry(!options.refresh);
    spinner.stop();

    console.log();
    console.log(chalk.cyan.bold('Available Templates'));
    console.log(chalk.dim(`v${registry.version}`));
    console.log();

    // Group templates by category
    const templatesByCategory = new Map<string, Template[]>();
    for (const template of registry.templates) {
      if (options.category && template.category !== options.category) {
        continue;
      }
      const existing = templatesByCategory.get(template.category) || [];
      existing.push(template);
      templatesByCategory.set(template.category, existing);
    }

    if (templatesByCategory.size === 0) {
      if (options.category) {
        console.log(chalk.yellow(`No templates found in category: ${options.category}`));
        console.log(chalk.dim('\nAvailable categories:'));
        for (const cat of registry.categories) {
          console.log(chalk.dim(`  - ${cat.id}: ${cat.name}`));
        }
      } else {
        console.log(chalk.yellow('No templates available.'));
      }
      return;
    }

    // Display by category
    for (const category of registry.categories) {
      const templates = templatesByCategory.get(category.id);
      if (!templates || templates.length === 0) continue;

      console.log(chalk.white.bold(`${category.name}`));
      console.log(chalk.dim(`  ${category.description}`));
      console.log();

      for (const template of templates) {
        const difficultyBadge = getDifficultyBadge(template.difficulty);
        console.log(`  ${chalk.cyan.bold(template.id)} ${difficultyBadge}`);
        console.log(`    ${template.description}`);
        console.log(chalk.dim(`    Tags: ${template.tags.join(', ')}`));
        console.log();
      }
    }

    console.log(chalk.dim('─'.repeat(60)));
    console.log(chalk.dim('Commands:'));
    console.log(chalk.dim('  ralph-starter template preview <name>  Preview a template'));
    console.log(chalk.dim('  ralph-starter template use <name>      Use a template'));
    console.log(chalk.dim('  ralph-starter template list --refresh  Refresh cache'));
  } catch (error) {
    spinner.fail('Failed to fetch templates');
    console.error(chalk.red((error as Error).message));
    process.exit(1);
  }
}

async function previewTemplate(templateId: string): Promise<void> {
  const spinner = ora('Fetching template...').start();

  try {
    const registry = await fetchRegistry();
    const template = registry.templates.find((t) => t.id === templateId);

    if (!template) {
      spinner.fail(`Template not found: ${templateId}`);
      console.log();
      console.log(chalk.dim('Use "ralph-starter template list" to see available templates'));
      process.exit(1);
    }

    const content = await fetchTemplateContent(template);
    spinner.stop();

    console.log();
    console.log(chalk.cyan.bold(template.name));
    console.log(chalk.dim(template.description));
    console.log();

    // Show metadata
    console.log(chalk.white('Category:'), template.category);
    console.log(chalk.white('Difficulty:'), getDifficultyBadge(template.difficulty));
    console.log(chalk.white('Tags:'), template.tags.join(', '));
    console.log();

    // Show content
    console.log(chalk.dim('─'.repeat(60)));
    console.log(content);
    console.log(chalk.dim('─'.repeat(60)));
    console.log();
    console.log(chalk.dim(`To use this template: ralph-starter template use ${templateId}`));
  } catch (error) {
    spinner.fail('Failed to fetch template');
    console.error(chalk.red((error as Error).message));
    process.exit(1);
  }
}

async function useTemplate(templateId: string, options: RunCommandOptions): Promise<void> {
  const spinner = ora('Fetching template...').start();

  try {
    const registry = await fetchRegistry();
    const template = registry.templates.find((t) => t.id === templateId);

    if (!template) {
      spinner.fail(`Template not found: ${templateId}`);
      console.log();
      console.log(chalk.dim('Use "ralph-starter template list" to see available templates'));
      process.exit(1);
    }

    const content = await fetchTemplateContent(template);
    spinner.succeed(`Fetched template: ${template.name}`);

    console.log();
    console.log(chalk.cyan.bold(template.name));
    console.log(chalk.dim(template.description));
    console.log();

    // Ask for confirmation before proceeding
    if (!options.auto) {
      const { confirm } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirm',
          message: `Use this template to build a new project?`,
          default: true,
        },
      ]);

      if (!confirm) {
        console.log(chalk.dim('Cancelled.'));
        return;
      }
    }

    // Write spec to temp location and pass to run command
    ensureCacheDir();
    const tempSpecPath = join(CACHE_DIR, `_active_${templateId}.md`);
    writeFileSync(tempSpecPath, content);

    // Run with the template spec
    // We pass the spec content directly as the task
    await runCommand(undefined, {
      ...options,
      from: 'file',
      project: tempSpecPath,
    });
  } catch (error) {
    spinner.fail('Failed to use template');
    console.error(chalk.red((error as Error).message));
    process.exit(1);
  }
}

async function browseTemplates(options: RunCommandOptions): Promise<void> {
  const spinner = ora('Fetching templates...').start();

  try {
    const registry = await fetchRegistry();
    spinner.stop();

    // Build choices grouped by category
    // biome-ignore lint: Using any for inquirer choices array
    const choices: any[] = [];

    for (const category of registry.categories) {
      const templates = registry.templates.filter((t) => t.category === category.id);
      if (templates.length === 0) continue;

      choices.push(new inquirer.Separator(chalk.cyan.bold(`\n${category.name}`)));

      for (const template of templates) {
        const badge = getDifficultyBadge(template.difficulty);
        choices.push({
          name: `${template.id} ${badge} - ${template.description}`,
          value: template.id,
        });
      }
    }

    choices.push(new inquirer.Separator());
    choices.push({ name: chalk.dim('Cancel'), value: '' });

    const { templateId } = await inquirer.prompt([
      {
        type: 'select',
        name: 'templateId',
        message: 'Select a template:',
        choices,
        pageSize: 20,
      },
    ]);

    if (templateId) {
      await useTemplate(templateId, options);
    }
  } catch (error) {
    spinner.fail('Failed to fetch templates');
    console.error(chalk.red((error as Error).message));
    process.exit(1);
  }
}

function showHelp(): void {
  console.log(`
${chalk.cyan.bold('ralph-starter template')} - Browse and use project templates

${chalk.bold('Commands:')}
  list                          List all available templates
  preview <name>                Preview a template's content
  use <name>                    Use a template to start a new project
  browse                        Interactive template browser

${chalk.bold('Options:')}
  --category <name>             Filter by category (web-dev, blockchain, devops, mobile, tools)
  --refresh                     Force refresh the cache
  --auto                        Skip confirmation prompts
  --output-dir <path>           Directory to create the project in

${chalk.bold('Examples:')}
  ralph-starter template list
  ralph-starter template list --category web-dev
  ralph-starter template preview nextjs-saas
  ralph-starter template use landing-page
  ralph-starter template use cli-tool --output-dir ~/projects/my-cli
  ralph-starter template browse

${chalk.bold('Template Source:')}
  Templates are fetched from: ${chalk.dim('github.com/rubenmarcus/ralph-templates')}
  Cached locally at: ${chalk.dim(CACHE_DIR)}
`);
}

export interface TemplateCommandOptions extends RunCommandOptions {
  category?: string;
  refresh?: boolean;
}

export async function templateCommand(
  action: string | undefined,
  args: string[],
  options: TemplateCommandOptions = {}
): Promise<void> {
  switch (action) {
    case 'list':
    case 'ls':
      await listTemplates({ category: options.category, refresh: options.refresh });
      break;

    case 'preview':
      if (args.length < 1) {
        console.error(chalk.red('Usage: ralph-starter template preview <name>'));
        process.exit(1);
      }
      await previewTemplate(args[0]);
      break;

    case 'use':
      if (args.length < 1) {
        console.error(chalk.red('Usage: ralph-starter template use <name>'));
        process.exit(1);
      }
      await useTemplate(args[0], options);
      break;

    case 'browse':
      await browseTemplates(options);
      break;

    case 'help':
    case undefined:
      showHelp();
      break;

    default:
      // Treat as template name for quick use
      await useTemplate(action, options);
      break;
  }
}
