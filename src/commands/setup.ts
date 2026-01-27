/**
 * Setup command for ralph-starter
 * Interactive setup wizard to configure LLM and agents
 */

import { runSetupWizard } from '../setup/wizard.js';

export interface SetupCommandOptions {
  force?: boolean;
}

/**
 * Run the setup command
 */
export async function setupCommand(options: SetupCommandOptions): Promise<void> {
  try {
    const result = await runSetupWizard({
      force: options.force,
    });

    if (!result.success && result.error !== 'Cancelled') {
      process.exit(1);
    }
  } catch (error) {
    // Handle Ctrl+C gracefully
    if ((error as Error).message?.includes('User force closed')) {
      console.log('\nSetup cancelled.');
      process.exit(0);
    }
    throw error;
  }
}
