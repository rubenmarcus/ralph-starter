// ralph-starter - Ralph Wiggum made easy
export const version = '0.1.0';
export const name = 'ralph-starter';

// Automation
export { createPullRequest, gitCommit, gitPush, isGitRepo } from './automation/git.js';
export { configCommand } from './commands/config.js';
export { initCommand } from './commands/init.js';
export { planCommand } from './commands/plan.js';
// Commands
export { runCommand } from './commands/run.js';
export { skillCommand } from './commands/skill.js';
export { sourceCommand } from './commands/source.js';
// Config
export { getApiKey, readConfig, writeConfig } from './config/manager.js';
export type { Agent, AgentType } from './loop/agents.js';
export { detectAvailableAgents, detectBestAgent } from './loop/agents.js';
// Loop
export { runLoop } from './loop/executor.js';
export { detectValidationCommands, runAllValidations, runValidation } from './loop/validation.js';
export type { InitCoreOptions, InitCoreResult } from './mcp/core/init.js';
export { initCore } from './mcp/core/init.js';
export type { PlanCoreOptions, PlanCoreResult } from './mcp/core/plan.js';
export { planCore } from './mcp/core/plan.js';
export type { RunCoreOptions, RunCoreResult } from './mcp/core/run.js';
export { runCore } from './mcp/core/run.js';
// MCP
export { createMcpServer, startMcpServer } from './mcp/server.js';
// Sources
export {
  detectSource,
  fetchFromSource,
  getAllSources,
  getSource,
  getSourceHelp,
  getSourcesInfo,
  testSource,
} from './sources/index.js';
export type { InputSource, SourceInfo, SourceOptions, SourceResult } from './sources/types.js';
// Wizard
export { runIdeaMode, runWizard } from './wizard/index.js';
export type { IdeaContext, IdeaDiscoveryMethod, IdeaSuggestion } from './wizard/types.js';
