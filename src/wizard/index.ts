import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import chalk from 'chalk';
import inquirer from 'inquirer';
import ora, { type Ora } from 'ora';
import { detectProject, detectRalphPlaybook, initCommand } from '../commands/init.js';
import { planCommand } from '../commands/plan.js';
import { runCommand } from '../commands/run.js';
import { getConfiguredLLM, promptForLLMSetup } from '../config/manager.js';
import { detectBestAgent } from '../loop/agents.js';
import { isClaudeCodeAvailable } from '../setup/agent-detector.js';
import { runSetupWizard } from '../setup/wizard.js';
import { runIdeaMode } from './ideas.js';
import { isLlmAvailable, refineIdea } from './llm.js';
import {
  askBrainstormConfirm,
  askContinueAction,
  askExecutionOptions,
  askExistingProjectAction,
  askForComplexity,
  askForFeatures,
  askForIdea,
  askForProjectType,
  askForTechStack,
  askHasIdea,
  askImproveAction,
  askImprovementPrompt,
  askRalphPlaybookAction,
  askSpecChangePrompt,
  askWhatToModify,
  askWorkingDirectory,
  confirmPlan,
} from './prompts.js';
import { generateAgentsMd, generateSpec, sanitizeFilename } from './spec-generator.js';
import type { RefinedIdea, WizardAnswers } from './types.js';
import { DEFAULT_WIZARD_ANSWERS } from './types.js';
import {
  formatComplexity,
  formatProjectType,
  showDetectedProject,
  showDetectedRalphPlaybook,
  showError,
  showExecutionPlan,
  showRefinedSummary,
  showSuccess,
  showWelcome,
} from './ui.js';

// Global spinner reference for cleanup on exit
let activeSpinner: Ora | null = null;

function normalizeTechStackValue(value?: string | null): string | undefined {
  if (!value) return undefined;
  const trimmed = String(value).trim();
  if (!trimmed) return undefined;
  const lower = trimmed.toLowerCase();
  if (lower === 'null' || lower === 'none' || lower === 'undefined') return undefined;
  return trimmed;
}

function normalizeTechStack(stack: WizardAnswers['techStack']): WizardAnswers['techStack'] {
  return {
    frontend: normalizeTechStackValue(stack.frontend),
    backend: normalizeTechStackValue(stack.backend),
    database: normalizeTechStackValue(stack.database),
    styling: normalizeTechStackValue(stack.styling),
    uiLibrary: normalizeTechStackValue(stack.uiLibrary),
    language: normalizeTechStackValue(stack.language),
  };
}

/**
 * Handle graceful exit on Ctrl+C
 */
function setupGracefulExit(): void {
  const cleanup = () => {
    if (activeSpinner) {
      activeSpinner.stop();
    }
    console.log(chalk.dim('\n\nExiting...'));
    process.exit(0);
  };

  // Handle SIGINT (Ctrl+C)
  process.on('SIGINT', cleanup);

  // Handle SIGTERM
  process.on('SIGTERM', cleanup);
}

/**
 * Check if error is an exit/interrupt error from inquirer
 */
function isExitError(error: unknown): boolean {
  if (error instanceof Error) {
    return (
      error.name === 'ExitPromptError' ||
      error.message.includes('User force closed') ||
      error.message.includes('SIGINT')
    );
  }
  return false;
}

/**
 * Run the interactive wizard
 */
export async function runWizard(): Promise<void> {
  // Setup graceful exit handling
  setupGracefulExit();

  const spinner = ora();
  activeSpinner = spinner;

  try {
    await runWizardFlow(spinner);
  } catch (error) {
    // Handle graceful exit (Ctrl+C)
    if (isExitError(error)) {
      spinner.stop();
      console.log(chalk.dim('\n\nExiting...'));
      process.exit(0);
    }
    // Re-throw other errors
    throw error;
  } finally {
    activeSpinner = null;
  }
}

/**
 * Check if LLM is available (either Claude Code CLI or API key)
 */
async function checkLLMAvailability(): Promise<{
  available: boolean;
  usesClaudeCode: boolean;
  needsSetup: boolean;
}> {
  // Priority 1: Check for Claude Code CLI
  const claudeCheck = await isClaudeCodeAvailable();
  if (claudeCheck.available) {
    return { available: true, usesClaudeCode: true, needsSetup: false };
  }

  // Priority 2: Check for API key
  const llmConfig = getConfiguredLLM();
  if (llmConfig) {
    return { available: true, usesClaudeCode: false, needsSetup: false };
  }

  // Nothing configured
  return { available: false, usesClaudeCode: false, needsSetup: true };
}

/**
 * Main wizard flow (extracted for cleaner error handling)
 */
async function runWizardFlow(spinner: Ora): Promise<void> {
  // First-run detection: Check if LLM is configured
  spinner.start('Checking configuration...');
  const llmStatus = await checkLLMAvailability();
  spinner.stop();

  if (llmStatus.needsSetup) {
    console.log();
    console.log(chalk.yellow('  No LLM configured yet.'));
    console.log(chalk.dim('  The wizard uses AI to help refine your project idea.'));
    console.log();

    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: 'What would you like to do?',
        choices: [
          { name: 'Run setup wizard (recommended)', value: 'setup' },
          { name: 'Enter API key now', value: 'quick' },
          { name: 'Continue anyway (will use template fallbacks)', value: 'continue' },
        ],
      },
    ]);

    if (action === 'setup') {
      const result = await runSetupWizard();
      if (!result.success) {
        console.log(chalk.dim('  Setup cancelled. You can run it later with: ralph-starter setup'));
        console.log();
        return;
      }
    } else if (action === 'quick') {
      const result = await promptForLLMSetup();
      if (!result) {
        console.log(chalk.dim('  No API key provided. Continuing with template fallbacks...'));
      }
    }
    // 'continue' - proceed with fallbacks
    console.log();
  }

  // Check for agent
  spinner.start('Checking for coding agents...');
  const agent = await detectBestAgent();
  spinner.stop();

  if (!agent) {
    showError(
      'No coding agent found!',
      'ralph-starter needs a coding agent to build your project.',
      'Install Claude Code: npm install -g @anthropic-ai/claude-code'
    );
    return;
  }

  // Detect if we're in an existing project before showing welcome
  const cwd = process.cwd();
  const cwdPlaybook = detectRalphPlaybook(cwd);
  const cwdProject = detectProject(cwd);
  const cwdIsRalphProject = cwdPlaybook.hasPlaybook;
  const cwdIsExistingProject = cwdIsRalphProject || cwdProject.type !== 'unknown';

  // Show welcome
  showWelcome();

  // If existing project detected, show info
  if (cwdIsRalphProject) {
    showDetectedRalphPlaybook(cwdPlaybook, cwd);
  } else if (cwdIsExistingProject) {
    showDetectedProject(cwdProject, cwd);
  }

  // Initialize answers
  const answers: WizardAnswers = {
    ...DEFAULT_WIZARD_ANSWERS,
    rawIdea: '',
    projectName: '',
    projectDescription: '',
    suggestedFeatures: [],
    selectedFeatures: [],
    techStack: {},
    complexity: 'mvp',
    autoRun: true,
    autoCommit: false,
    workingDirectory: process.cwd(),
  } as WizardAnswers;

  // Step 1: Get the idea (with optional brainstorming or improve existing)
  let continueWizard = true;

  while (continueWizard) {
    let idea: string;

    if (cwdIsExistingProject) {
      // Existing project: show list with improve_existing option
      const hasIdea = await askHasIdea({
        isExistingProject: true,
        isRalphProject: cwdIsRalphProject,
      });

      // Handle "improve existing project" flow
      if (hasIdea === 'improve_existing') {
        const improveAction = await askImproveAction();

        if (improveAction === 'prompt') {
          const improvementPrompt = await askImprovementPrompt();

          console.log();
          console.log(chalk.cyan.bold('  Starting improvement loop...'));
          console.log();

          await runCommand(improvementPrompt, {
            auto: true,
            commit: false,
            validate: true,
          });

          showSuccess('Improvement complete!');
          return;
        } else {
          console.log();
          console.log(chalk.cyan.bold('  Analyzing project...'));
          console.log();

          const analysisPrompt = `Analyze this codebase and suggest improvements. Look at:
1. Code quality and best practices
2. Missing features or incomplete implementations
3. Performance opportunities
4. Security concerns
5. Developer experience improvements

Provide a prioritized list of suggestions with explanations.`;

          await runCommand(analysisPrompt, {
            auto: true,
            commit: false,
            validate: false,
            maxIterations: 5,
          });

          showSuccess('Analysis complete!');
          return;
        }
      }

      if (hasIdea === 'need_help') {
        const shouldBrainstorm = await askBrainstormConfirm();
        if (shouldBrainstorm) {
          const selectedIdea = await runIdeaMode();
          if (selectedIdea === null) {
            idea = await askForIdea();
          } else {
            idea = selectedIdea;
          }
        } else {
          idea = await askForIdea();
        }
      } else {
        idea = await askForIdea();
      }
    } else {
      // New project: ask if they have an idea or want help
      const hasIdea = await askHasIdea();

      if (hasIdea === 'need_help') {
        const shouldBrainstorm = await askBrainstormConfirm();
        if (shouldBrainstorm) {
          const selectedIdea = await runIdeaMode();
          if (selectedIdea === null) {
            idea = await askForIdea();
          } else {
            idea = selectedIdea;
          }
        } else {
          idea = await askForIdea();
        }
      } else {
        idea = await askForIdea();
      }
    }

    answers.rawIdea = idea;

    // Refine with LLM - pass spinner and agent to avoid conflicts and double detection
    spinner.start('Thinking about your idea...');
    let refinedIdea: RefinedIdea;

    try {
      // Pass spinner (so it stops before animator starts) and agent (to avoid re-detecting)
      refinedIdea = await refineIdea(idea, spinner, agent);
      // Success message is shown by refineIdea, but catch needs spinner handling
    } catch (_error) {
      // Make sure spinner is stopped on error
      spinner.fail('Could not analyze idea');
      // Use fallback
      refinedIdea = {
        projectName: 'my-project',
        projectDescription: idea,
        projectType: 'web',
        suggestedStack: { frontend: 'react', backend: 'nodejs' },
        coreFeatures: ['Core functionality'],
        suggestedFeatures: [],
        estimatedComplexity: 'mvp',
      };
    }

    // Apply refinement to answers
    answers.projectName = refinedIdea.projectName;
    answers.projectDescription = refinedIdea.projectDescription;
    answers.projectType = refinedIdea.projectType;
    answers.techStack = normalizeTechStack(refinedIdea.suggestedStack);
    answers.suggestedFeatures = refinedIdea.suggestedFeatures;
    answers.complexity = refinedIdea.estimatedComplexity;

    // Let user refine
    let refining = true;
    while (refining) {
      // Show summary
      showRefinedSummary(
        answers.projectName,
        formatProjectType(answers.projectType || 'web'),
        answers.techStack,
        [
          ...refinedIdea.coreFeatures,
          ...answers.selectedFeatures.filter((f) => !refinedIdea.coreFeatures.includes(f)),
        ],
        formatComplexity(answers.complexity)
      );

      // Confirm
      const action = await confirmPlan();

      if (action === 'proceed') {
        refining = false;
        continueWizard = false;
      } else if (action === 'restart') {
        refining = false;
        // Will loop back to get new idea
      } else if (action === 'prompt') {
        const changeRequest = await askSpecChangePrompt();
        const updatedIdea = `${answers.rawIdea}\n\nChange request: ${changeRequest}`;

        spinner.start('Updating specs...');
        try {
          refinedIdea = await refineIdea(updatedIdea, spinner, agent);
        } catch (_error) {
          spinner.fail('Could not update specs');
          refinedIdea = {
            projectName: answers.projectName || 'my-project',
            projectDescription: answers.projectDescription || updatedIdea,
            projectType: answers.projectType || 'web',
            suggestedStack: answers.techStack,
            coreFeatures: refinedIdea.coreFeatures,
            suggestedFeatures: refinedIdea.suggestedFeatures,
            estimatedComplexity: answers.complexity,
          };
        }

        answers.rawIdea = updatedIdea;
        answers.projectName = refinedIdea.projectName;
        answers.projectDescription = refinedIdea.projectDescription;
        answers.projectType = refinedIdea.projectType;
        answers.techStack = normalizeTechStack(refinedIdea.suggestedStack);
        answers.suggestedFeatures = refinedIdea.suggestedFeatures;
        answers.selectedFeatures = [];
        answers.complexity = refinedIdea.estimatedComplexity;
      } else if (action === 'modify') {
        const modifyWhat = await askWhatToModify();

        switch (modifyWhat) {
          case 'type':
            answers.projectType = await askForProjectType(answers.projectType);
            break;
          case 'stack':
            answers.techStack = await askForTechStack(
              answers.projectType || 'web',
              answers.techStack
            );
            break;
          case 'features':
            answers.selectedFeatures = await askForFeatures(
              refinedIdea.coreFeatures,
              refinedIdea.suggestedFeatures
            );
            break;
          case 'complexity':
            answers.complexity = await askForComplexity(answers.complexity);
            break;
        }
      } else {
        console.log(chalk.dim('  Continuing with the current specs...'));
        refining = false;
        continueWizard = false;
      }
    }
  }

  // Get execution options
  const execOptions = await askExecutionOptions();
  answers.autoRun = execOptions.autoRun;
  answers.autoCommit = execOptions.autoCommit;

  // Get working directory with existing project detection
  let workDir = '';
  let isExistingProject = false;
  const _isRalphPlaybook = false;

  // Loop until we have a valid directory decision
  let selectingDirectory = true;
  while (selectingDirectory) {
    answers.workingDirectory = await askWorkingDirectory(answers.projectName);
    workDir = resolve(process.cwd(), answers.workingDirectory);

    // Check for existing project
    if (existsSync(workDir)) {
      // First check for Ralph Playbook (takes priority)
      const playbook = detectRalphPlaybook(workDir);

      if (playbook.hasPlaybook) {
        // Show Ralph Playbook info
        showDetectedRalphPlaybook(playbook, workDir);

        const action = await askRalphPlaybookAction();

        if (action === 'continue') {
          // User wants to continue working on this project
          process.chdir(workDir);

          // Show menu for what to do
          const continueAction = await askContinueAction();

          if (continueAction === 'run') {
            console.log();
            console.log(chalk.cyan.bold('  Starting build loop...'));
            console.log();
            await runCommand(undefined, {
              auto: true,
              commit: answers.autoCommit,
              validate: true,
            });
          } else if (continueAction === 'plan') {
            console.log();
            console.log(chalk.cyan.bold('  Regenerating implementation plan...'));
            console.log();
            await planCommand({ auto: true });
          } else if (continueAction === 'add_spec') {
            // TODO: Implement add spec flow
            console.log();
            console.log(chalk.yellow('  Add spec flow coming soon!'));
            console.log(chalk.dim('  For now, manually add a .md file to the specs/ folder.'));
            console.log();
          }

          showSuccess('Done!');
          return; // Exit wizard early
        } else if (action === 'fresh') {
          // Will overwrite - continue normal flow
          selectingDirectory = false;
        } else {
          // 'different' - loop back to ask for directory again
          console.log(chalk.dim('  Choose a different directory...'));
        }
      } else {
        // No Ralph Playbook, check for language project
        const detectedProject = detectProject(workDir);

        if (detectedProject.type !== 'unknown') {
          // Show detected project info
          showDetectedProject(detectedProject, workDir);

          const action = await askExistingProjectAction(detectedProject);

          if (action === 'enhance') {
            // Use existing project - skip creating new directory
            isExistingProject = true;
            selectingDirectory = false;
          } else if (action === 'subfolder') {
            // Create subfolder inside existing project
            const subfolderName = sanitizeFilename(answers.projectName);
            answers.workingDirectory = join(answers.workingDirectory, subfolderName);
            workDir = resolve(process.cwd(), answers.workingDirectory);
            selectingDirectory = false;
          } else {
            // 'different' - loop back to ask for directory again
            console.log(chalk.dim('  Choose a different directory...'));
          }
        } else {
          // Directory exists but no recognized project - proceed normally
          selectingDirectory = false;
        }
      }
    } else {
      // Directory doesn't exist - proceed normally
      selectingDirectory = false;
    }
  }

  // Show execution plan
  showExecutionPlan(answers.autoCommit);

  // Create directory if needed (skip for existing projects)
  if (!existsSync(workDir)) {
    mkdirSync(workDir, { recursive: true });
    console.log(chalk.dim(`  Created: ${workDir}`));
  } else if (isExistingProject) {
    console.log(chalk.dim(`  Using existing project: ${workDir}`));
  }

  // Change to working directory
  process.chdir(workDir);

  // Step 1: Initialize Ralph Playbook
  spinner.start('Setting up project...');
  try {
    await initCommand({ name: answers.projectName, nonInteractive: true });
    spinner.succeed('Project initialized');
  } catch (error) {
    spinner.fail('Failed to initialize project');
    console.error(error);
    return;
  }

  // Step 2: Write the spec file
  spinner.start('Writing specification...');
  const specsDir = join(workDir, 'specs');
  if (!existsSync(specsDir)) {
    mkdirSync(specsDir, { recursive: true });
  }
  const specContent = generateSpec(answers);
  const specFilename = `${sanitizeFilename(answers.projectName)}.md`;
  writeFileSync(join(specsDir, specFilename), specContent);
  spinner.succeed('Specification written');

  // Step 3: Generate custom AGENTS.md
  const agentsContent = generateAgentsMd(answers);
  writeFileSync(join(workDir, 'AGENTS.md'), agentsContent);

  // Step 4: Run planning
  spinner.start('Creating implementation plan...');
  try {
    await planCommand({ auto: true });
    spinner.succeed('Implementation plan created');
  } catch (error) {
    spinner.fail('Failed to create plan');
    console.error(error);
    return;
  }

  // Step 5: Optionally run execution
  if (answers.autoRun) {
    console.log();
    console.log(chalk.cyan.bold('  Starting build...'));
    console.log();

    try {
      await runCommand(undefined, {
        auto: true,
        commit: answers.autoCommit,
        validate: true,
      });
    } catch (error) {
      console.error(chalk.red('Build failed:'), error);
      return;
    }
  }

  // Done!
  showSuccess('All done!');

  if (!answers.autoRun) {
    console.log(chalk.dim('  To start building, run:'));
    console.log(chalk.gray(`    cd ${answers.workingDirectory}`));
    console.log(chalk.gray('    ralph-starter run'));
  }

  console.log();
}

// Export for use in CLI
export { isLlmAvailable };
export { runIdeaMode };
export * from './ascii-art.js';
export { showError, showSuccess, showWorking } from './ui.js';
