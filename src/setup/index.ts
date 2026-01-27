/**
 * Setup module for ralph-starter
 */

export {
  type AgentDetectionResult,
  type AgentInfo,
  detectAgent,
  detectAllAgents,
  getFirstAvailableAgent,
  isClaudeCodeAvailable,
  SUPPORTED_AGENTS,
  testClaudeCodeConnection,
} from './agent-detector.js';

export {
  formatTestResult,
  type LLMTestResult,
  testApiConnection,
  testBestAvailable,
  testClaudeCode,
} from './llm-tester.js';

export {
  runSetupWizard,
  type SetupResult,
} from './wizard.js';
