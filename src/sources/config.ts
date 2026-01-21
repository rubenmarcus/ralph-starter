import { homedir } from 'os';
import { join } from 'path';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import type { SourcesConfig, SourceConfig, SourceCredentials, SourceOptions } from './types.js';

const CONFIG_DIR = join(homedir(), '.ralph-starter');
const SOURCES_CONFIG_FILE = join(CONFIG_DIR, 'sources.json');

/**
 * Ensure config directory exists
 */
function ensureConfigDir(): void {
  if (!existsSync(CONFIG_DIR)) {
    mkdirSync(CONFIG_DIR, { recursive: true });
  }
}

/**
 * Read sources configuration
 */
export function readSourcesConfig(): SourcesConfig {
  ensureConfigDir();

  if (!existsSync(SOURCES_CONFIG_FILE)) {
    return { sources: {} };
  }

  try {
    const content = readFileSync(SOURCES_CONFIG_FILE, 'utf-8');
    return JSON.parse(content);
  } catch {
    return { sources: {} };
  }
}

/**
 * Write sources configuration
 */
export function writeSourcesConfig(config: SourcesConfig): void {
  ensureConfigDir();
  writeFileSync(SOURCES_CONFIG_FILE, JSON.stringify(config, null, 2));
}

/**
 * Get configuration for a specific source
 */
export function getSourceConfig(sourceName: string): SourceConfig | null {
  const config = readSourcesConfig();
  return config.sources[sourceName] || null;
}

/**
 * Set configuration for a specific source
 */
export function setSourceConfig(sourceName: string, sourceConfig: SourceConfig): void {
  const config = readSourcesConfig();
  config.sources[sourceName] = {
    ...config.sources[sourceName],
    ...sourceConfig,
  };
  writeSourcesConfig(config);
}

/**
 * Get credentials for a specific source
 */
export function getSourceCredentials(sourceName: string): SourceCredentials | null {
  const sourceConfig = getSourceConfig(sourceName);
  return sourceConfig?.credentials || null;
}

/**
 * Set a credential for a specific source
 */
export function setSourceCredential(
  sourceName: string,
  key: string,
  value: string
): void {
  const config = readSourcesConfig();

  if (!config.sources[sourceName]) {
    config.sources[sourceName] = {};
  }

  if (!config.sources[sourceName].credentials) {
    config.sources[sourceName].credentials = {};
  }

  config.sources[sourceName].credentials![key] = value;
  writeSourcesConfig(config);
}

/**
 * Delete a credential for a specific source
 */
export function deleteSourceCredential(sourceName: string, key: string): boolean {
  const config = readSourcesConfig();

  if (!config.sources[sourceName]?.credentials?.[key]) {
    return false;
  }

  delete config.sources[sourceName].credentials![key];

  // Clean up empty credentials object
  if (Object.keys(config.sources[sourceName].credentials!).length === 0) {
    delete config.sources[sourceName].credentials;
  }

  // Clean up empty source config
  if (Object.keys(config.sources[sourceName]).length === 0) {
    delete config.sources[sourceName];
  }

  writeSourcesConfig(config);
  return true;
}

/**
 * Get default options for a specific source
 */
export function getSourceDefaults(sourceName: string): SourceOptions | null {
  const sourceConfig = getSourceConfig(sourceName);
  return sourceConfig?.defaults || null;
}

/**
 * Set default options for a specific source
 */
export function setSourceDefaults(sourceName: string, defaults: SourceOptions): void {
  const config = readSourcesConfig();

  if (!config.sources[sourceName]) {
    config.sources[sourceName] = {};
  }

  config.sources[sourceName].defaults = {
    ...config.sources[sourceName].defaults,
    ...defaults,
  };

  writeSourcesConfig(config);
}

/**
 * Check if a source is enabled
 * Sources are enabled by default unless explicitly disabled
 */
export function isSourceEnabled(sourceName: string): boolean {
  const sourceConfig = getSourceConfig(sourceName);
  return sourceConfig?.enabled !== false;
}

/**
 * Enable or disable a source
 */
export function setSourceEnabled(sourceName: string, enabled: boolean): void {
  const config = readSourcesConfig();

  if (!config.sources[sourceName]) {
    config.sources[sourceName] = {};
  }

  config.sources[sourceName].enabled = enabled;
  writeSourcesConfig(config);
}

/**
 * List all configured sources
 */
export function listConfiguredSources(): string[] {
  const config = readSourcesConfig();
  return Object.keys(config.sources);
}

/**
 * Delete all configuration for a source
 */
export function deleteSourceConfig(sourceName: string): boolean {
  const config = readSourcesConfig();

  if (!config.sources[sourceName]) {
    return false;
  }

  delete config.sources[sourceName];
  writeSourcesConfig(config);
  return true;
}

/**
 * Get the config file path (for display purposes)
 */
export function getSourcesConfigPath(): string {
  return SOURCES_CONFIG_FILE;
}
