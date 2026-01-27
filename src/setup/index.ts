/**
 * Setup module for ralph-starter
 */

export {
  type AgentInfo,
  type AgentDetectionResult,
  SUPPORTED_AGENTS,
  detectAgent,
  detectAllAgents,
  getFirstAvailableAgent,
  isClaudeCodeAvailable,
  testClaudeCodeConnection,
} from './agent-detector.js';

export {
  type LLMTestResult,
  testApiConnection,
  testClaudeCode,
  testBestAvailable,
  formatTestResult,
} from './llm-tester.js';

export {
  type SetupResult,
  runSetupWizard,
} from './wizard.js';
