/**
 * Step detector for Claude Code JSONL output
 *
 * Parses the stream-json output from Claude Code CLI and detects
 * what step the agent is currently performing.
 */

/**
 * Check if a file path looks like a test file
 */
function isTestFile(filePath: string): boolean {
  const lower = filePath.toLowerCase();
  return (
    lower.includes('.test.') ||
    lower.includes('.spec.') ||
    lower.includes('__tests__') ||
    lower.includes('_test.go')
  );
}

/**
 * Extract filename from path
 */
function getFilename(filePath: string): string {
  return filePath.split('/').pop() || filePath.split('\\').pop() || 'file';
}

/**
 * Detect the current step from a JSON output line
 * Returns human-readable step description or null if not detectable
 */
export function detectStepFromOutput(line: string): string | null {
  const trimmed = line.trim();

  // Fast path: skip non-JSON lines
  if (!trimmed.startsWith('{')) {
    return null;
  }

  try {
    const parsed = JSON.parse(trimmed);

    // Extract fields for pattern matching
    const toolName =
      parsed.tool?.toLowerCase() ||
      parsed.name?.toLowerCase() ||
      parsed.tool_name?.toLowerCase() ||
      '';
    const command = parsed.command?.toLowerCase() || '';
    const filePath = (parsed.file_path || parsed.filePath || parsed.path || '').toLowerCase();
    const description = (parsed.description || '').toLowerCase();

    // Check tool name to determine operation type
    const isReadOperation = ['read', 'glob', 'grep'].includes(toolName);
    const isWriteOperation = ['write', 'edit'].includes(toolName);

    // Reading code - check this early
    if (isReadOperation) {
      return 'Reading code...';
    }

    // Git commit
    if (command.includes('git commit') || description.includes('git commit')) {
      return 'Committing changes...';
    }

    // Git add/staging
    if (command.includes('git add') || description.includes('git add')) {
      return 'Staging files...';
    }

    // Package management
    if (
      command.includes('npm install') ||
      command.includes('bun install') ||
      command.includes('pnpm install')
    ) {
      return 'Installing dependencies...';
    }

    if (
      command.includes('npm init') ||
      command.includes('bun init') ||
      command.includes('pnpm init')
    ) {
      return 'Initializing project...';
    }

    // Build commands
    if (
      command.includes('npm run build') ||
      command.includes('bun run build') ||
      command.includes('build')
    ) {
      return 'Building project...';
    }

    // Linting
    if (
      command.includes('lint') ||
      command.includes('eslint') ||
      command.includes('biome') ||
      command.includes('prettier')
    ) {
      return 'Linting code...';
    }

    // Testing
    if (
      command.includes('vitest') ||
      command.includes('jest') ||
      command.includes('bun test') ||
      command.includes('npm test') ||
      command.includes('pytest') ||
      command.includes('go test')
    ) {
      return 'Running tests...';
    }

    // Writing tests - only for write operations to test files
    if (isWriteOperation && isTestFile(filePath)) {
      return 'Writing tests...';
    }

    // Writing/Editing code
    if (isWriteOperation) {
      const filename = getFilename(filePath);
      return `Writing ${filename}...`;
    }

    // Bash commands (generic)
    if (toolName === 'bash' && command) {
      // Try to extract meaningful description from command
      if (command.includes('mkdir')) return 'Creating directories...';
      if (command.includes('rm ')) return 'Removing files...';
      if (command.includes('cp ')) return 'Copying files...';
      if (command.includes('mv ')) return 'Moving files...';
      return 'Running command...';
    }

    // Assistant message with tool_use - this is the main format from Claude Code
    if (parsed.type === 'assistant' && parsed.message?.content) {
      const content = parsed.message.content;
      if (Array.isArray(content)) {
        for (const block of content) {
          if (block.type === 'tool_use') {
            const blockToolName = block.name?.toLowerCase() || '';
            const input = block.input || {};

            // Extract file path from tool input
            const blockFilePath = (
              input.file_path ||
              input.filePath ||
              input.path ||
              ''
            ).toLowerCase();
            const blockCommand = (input.command || '').toLowerCase();

            // Read operations
            if (blockToolName === 'read') {
              const filename = getFilename(blockFilePath || 'file');
              return `Reading ${filename}...`;
            }
            if (blockToolName === 'glob') {
              return 'Searching files...';
            }
            if (blockToolName === 'grep') {
              return 'Searching code...';
            }

            // Write/Edit operations - show specific filename
            if (blockToolName === 'write' || blockToolName === 'edit') {
              if (blockFilePath) {
                const filename = getFilename(blockFilePath);
                if (isTestFile(blockFilePath)) {
                  return `Writing tests (${filename})...`;
                }
                return `Writing ${filename}...`;
              }
              return 'Writing code...';
            }

            // Bash commands - parse the command for specifics
            if (blockToolName === 'bash') {
              if (
                blockCommand.includes('npm install') ||
                blockCommand.includes('bun install') ||
                blockCommand.includes('pnpm install')
              ) {
                return 'Installing dependencies...';
              }
              if (
                blockCommand.includes('npm init') ||
                blockCommand.includes('bun init') ||
                blockCommand.includes('npm create')
              ) {
                return 'Initializing project...';
              }
              if (
                blockCommand.includes('npm run build') ||
                blockCommand.includes('bun run build') ||
                blockCommand.includes('tsc')
              ) {
                return 'Building project...';
              }
              if (
                blockCommand.includes('npm test') ||
                blockCommand.includes('vitest') ||
                blockCommand.includes('jest')
              ) {
                return 'Running tests...';
              }
              if (blockCommand.includes('git commit')) {
                return 'Committing changes...';
              }
              if (blockCommand.includes('git add')) {
                return 'Staging files...';
              }
              if (blockCommand.includes('mkdir')) {
                return 'Creating directories...';
              }
              if (blockCommand.includes('npm run dev') || blockCommand.includes('bun run dev')) {
                return 'Starting dev server...';
              }
              // Show description if available
              const desc = (input.description || '').toLowerCase();
              if (desc) {
                return desc.slice(0, 30) + (desc.length > 30 ? '...' : '');
              }
              return 'Running command...';
            }

            // Task tool (subagent)
            if (blockToolName === 'task') {
              return 'Running subagent...';
            }

            // WebFetch
            if (blockToolName === 'webfetch' || blockToolName === 'websearch') {
              return 'Fetching from web...';
            }

            // Generic tool
            return `Using ${block.name}...`;
          }

          // Text content = thinking
          if (block.type === 'text') {
            return 'Thinking...';
          }
        }
      }
      return 'Thinking...';
    }

    // System messages
    if (parsed.type === 'system') {
      if (parsed.subtype === 'init') {
        return 'Starting up...';
      }
    }

    // User message (usually tool result) - Claude is processing a result
    if (parsed.type === 'user') {
      return 'Processing...';
    }

    // Result message - task complete
    if (parsed.type === 'result') {
      return 'Finishing up...';
    }

    // Content block start - indicates tool is starting
    if (parsed.type === 'content_block_start' && parsed.content_block) {
      const block = parsed.content_block;
      if (block.type === 'tool_use') {
        const blockToolName = block.name?.toLowerCase() || '';
        if (blockToolName === 'read') return 'Reading...';
        if (blockToolName === 'write' || blockToolName === 'edit') return 'Writing...';
        if (blockToolName === 'bash') return 'Running command...';
        if (blockToolName === 'glob') return 'Searching files...';
        if (blockToolName === 'grep') return 'Searching code...';
        return `Using ${block.name}...`;
      }
    }

    return null;
  } catch {
    // Not valid JSON, ignore
    return null;
  }
}

/**
 * Extract text content from JSONL output
 * Returns the human-readable text that should be shown to user
 */
export function extractTextFromOutput(line: string): string | null {
  const trimmed = line.trim();

  if (!trimmed.startsWith('{')) {
    return null;
  }

  try {
    const parsed = JSON.parse(trimmed);

    // Result message contains final summary
    if (parsed.type === 'result' && parsed.result) {
      return parsed.result;
    }

    // Assistant text content
    if (parsed.type === 'assistant' && parsed.message?.content) {
      const content = parsed.message.content;
      if (Array.isArray(content)) {
        for (const block of content) {
          if (block.type === 'text' && block.text) {
            return block.text;
          }
        }
      }
    }

    return null;
  } catch {
    return null;
  }
}
