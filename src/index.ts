// ralph-starter - Ralph Wiggum made easy
export const version = '0.1.0';
export const name = 'ralph-starter';

// Commands
export { runCommand } from './commands/run.js';
export { initCommand } from './commands/init.js';
export { skillCommand } from './commands/skill.js';
export { planCommand } from './commands/plan.js';
export { configCommand } from './commands/config.js';
export { sourceCommand } from './commands/source.js';

// Wizard
export { runWizard, runIdeaMode } from './wizard/index.js';
export type { IdeaSuggestion, IdeaContext, IdeaDiscoveryMethod } from './wizard/types.js';

// Loop
export { runLoop } from './loop/executor.js';
export { detectAvailableAgents, detectBestAgent } from './loop/agents.js';
export type { Agent, AgentType } from './loop/agents.js';
export { detectValidationCommands, runValidation, runAllValidations } from './loop/validation.js';

// Automation
export { gitCommit, gitPush, createPullRequest, isGitRepo } from './automation/git.js';

// Config
export { readConfig, writeConfig, getApiKey } from './config/manager.js';

// Sources
export {
  getSource,
  getAllSources,
  getSourcesInfo,
  detectSource,
  fetchFromSource,
  getSourceHelp,
  testSource,
} from './sources/index.js';
export type { InputSource, SourceInfo, SourceResult, SourceOptions } from './sources/types.js';

// MCP
export { createMcpServer, startMcpServer } from './mcp/server.js';
export { initCore } from './mcp/core/init.js';
export type { InitCoreOptions, InitCoreResult } from './mcp/core/init.js';
export { planCore } from './mcp/core/plan.js';
export type { PlanCoreOptions, PlanCoreResult } from './mcp/core/plan.js';
export { runCore } from './mcp/core/run.js';
export type { RunCoreOptions, RunCoreResult } from './mcp/core/run.js';
