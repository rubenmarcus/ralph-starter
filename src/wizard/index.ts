import ora from 'ora';
import chalk from 'chalk';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join, resolve } from 'path';

import type { WizardAnswers, RefinedIdea, WizardStep } from './types.js';
import { DEFAULT_WIZARD_ANSWERS } from './types.js';
import {
  showWelcome,
  showRefinedSummary,
  showExecutionPlan,
  showError,
  showSuccess,
  showWorking,
  renderSteps,
  formatProjectType,
  formatComplexity,
  showDetectedProject,
  showDetectedRalphPlaybook,
} from './ui.js';
import {
  askHasIdea,
  askForIdea,
  askForProjectType,
  askForTechStack,
  askForFeatures,
  askForComplexity,
  confirmPlan,
  askWhatToModify,
  askExecutionOptions,
  askWorkingDirectory,
  askExistingProjectAction,
  askRalphPlaybookAction,
  askContinueAction,
} from './prompts.js';
import { refineIdea, isLlmAvailable } from './llm.js';
import { runIdeaMode } from './ideas.js';
import { generateSpec, generateAgentsMd, sanitizeFilename } from './spec-generator.js';
import { initCommand, detectProject, detectRalphPlaybook } from '../commands/init.js';
import { planCommand } from '../commands/plan.js';
import { runCommand } from '../commands/run.js';
import { detectBestAgent } from '../loop/agents.js';

/**
 * Run the interactive wizard
 */
export async function runWizard(): Promise<void> {
  const spinner = ora();

  // Check for agent first
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

  // Show welcome
  showWelcome();

  // Initialize answers
  let answers: WizardAnswers = {
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

  // Step 1: Get the idea (with optional brainstorming)
  let continueWizard = true;

  while (continueWizard) {
    // Ask if user has an idea or needs help
    const hasIdea = await askHasIdea();

    let idea: string;
    if (hasIdea === 'need_help') {
      // Launch idea mode
      const selectedIdea = await runIdeaMode();
      if (selectedIdea === null) {
        // User wants to describe their own after browsing ideas
        idea = await askForIdea();
      } else {
        idea = selectedIdea;
      }
    } else {
      idea = await askForIdea();
    }
    answers.rawIdea = idea;

    // Refine with LLM
    spinner.start('Thinking about your idea...');
    let refinedIdea: RefinedIdea;

    try {
      refinedIdea = await refineIdea(idea);
      spinner.succeed('Got it!');
    } catch (error) {
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
    answers.techStack = refinedIdea.suggestedStack;
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
        [...refinedIdea.coreFeatures, ...answers.selectedFeatures.filter(f => !refinedIdea.coreFeatures.includes(f))],
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
  let isRalphPlaybook = false;

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
    await initCommand({ name: answers.projectName });
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
export { showWorking, showSuccess, showError } from './ui.js';
export * from './ascii-art.js';
