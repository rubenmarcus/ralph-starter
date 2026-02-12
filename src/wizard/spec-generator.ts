import { detectPackageManager, formatRunCommand } from '../utils/package-manager.js';
import type { TechStack, WizardAnswers } from './types.js';
import { formatComplexity, formatProjectType } from './ui.js';

/**
 * Generate a spec markdown file from wizard answers
 */
export function generateSpec(answers: WizardAnswers): string {
  const sections: string[] = [];

  // Title
  sections.push(`# ${answers.projectName}`);
  sections.push('');

  // Overview
  sections.push('## Overview');
  sections.push('');
  sections.push(answers.projectDescription || answers.rawIdea);
  sections.push('');

  // Project Type
  if (answers.projectType) {
    sections.push(`**Type:** ${formatProjectType(answers.projectType)}`);
    sections.push('');
  }

  // Tech Stack
  if (hasTechStack(answers.techStack)) {
    sections.push('## Tech Stack');
    sections.push('');
    if (answers.techStack.frontend) {
      sections.push(`- **Frontend:** ${formatTech(answers.techStack.frontend)}`);
    }
    if (answers.techStack.backend) {
      sections.push(`- **Backend:** ${formatTech(answers.techStack.backend)}`);
    }
    if (answers.techStack.database) {
      sections.push(`- **Database:** ${formatTech(answers.techStack.database)}`);
    }
    if (answers.techStack.styling) {
      sections.push(`- **Styling:** ${formatTech(answers.techStack.styling)}`);
    }
    if (answers.techStack.language) {
      sections.push(`- **Language:** ${formatTech(answers.techStack.language)}`);
    }
    sections.push('');
  }

  // Features
  if (answers.selectedFeatures.length > 0) {
    sections.push('## Features');
    sections.push('');
    for (const feature of answers.selectedFeatures) {
      sections.push(`### ${feature}`);
      sections.push('');
      sections.push('- [ ] Implement core functionality');
      sections.push('- [ ] Add error handling');
      sections.push('- [ ] Write tests');
      sections.push('');
    }
  }

  // Scope
  sections.push('## Scope');
  sections.push('');
  sections.push(`**Complexity:** ${formatComplexity(answers.complexity)}`);
  sections.push('');

  const scopeDescriptions: Record<string, string> = {
    prototype:
      'Focus on core functionality. Skip polish, extensive error handling, and edge cases.',
    mvp: 'Implement all core features with basic error handling. Ready for initial use.',
    full: 'Complete implementation with comprehensive error handling, tests, and documentation.',
  };
  sections.push(scopeDescriptions[answers.complexity] || '');
  sections.push('');

  // Requirements
  sections.push('## Requirements');
  sections.push('');
  sections.push('### Functional Requirements');
  sections.push('');
  for (const feature of answers.selectedFeatures) {
    sections.push(`- [ ] ${feature} must work correctly`);
  }
  sections.push('');

  sections.push('### Non-Functional Requirements');
  sections.push('');
  if (answers.complexity !== 'prototype') {
    sections.push('- [ ] Code should be well-organized and readable');
    sections.push('- [ ] Error messages should be helpful');
  }
  if (answers.complexity === 'full') {
    sections.push('- [ ] Include unit tests for core functionality');
    sections.push('- [ ] Add inline documentation');
  }
  sections.push('');

  // Out of Scope (for prototype/mvp)
  if (answers.complexity !== 'full') {
    sections.push('## Out of Scope (for this iteration)');
    sections.push('');
    if (answers.complexity === 'prototype') {
      sections.push('- Comprehensive error handling');
      sections.push('- Tests');
      sections.push('- Documentation');
      sections.push('- Performance optimization');
    } else if (answers.complexity === 'mvp') {
      sections.push('- Extensive documentation');
      sections.push('- Performance optimization');
      sections.push('- Advanced features');
    }
    sections.push('');
  }

  return sections.join('\n');
}

/**
 * Generate AGENTS.md content based on tech stack
 */
export function generateAgentsMd(answers: WizardAnswers): string {
  const sections: string[] = [];

  sections.push('# Agent Instructions');
  sections.push('');
  sections.push('## Build Instructions');
  sections.push('');
  sections.push('When building this project:');
  sections.push('');

  // Add stack-specific instructions
  if (answers.techStack.frontend === 'react' || answers.techStack.frontend === 'nextjs') {
    sections.push('- Use functional components with hooks');
    sections.push('- Use TypeScript for type safety');
  }
  if (answers.techStack.frontend === 'nextjs') {
    sections.push('- Use App Router (not Pages Router)');
    sections.push('- Use Server Components where appropriate');
  }
  if (answers.techStack.backend === 'nodejs') {
    sections.push('- Use ES modules (import/export)');
    sections.push('- Use async/await for asynchronous code');
  }
  if (answers.techStack.database === 'sqlite') {
    sections.push('- Use better-sqlite3 or Prisma with SQLite');
  }
  if (answers.techStack.database === 'postgres') {
    sections.push('- Use Prisma for database access');
  }

  sections.push('');
  sections.push('## Validation Commands');
  sections.push('');

  // Add validation commands based on stack
  const hasNodeStack =
    answers.techStack.frontend === 'react' ||
    answers.techStack.frontend === 'nextjs' ||
    answers.techStack.backend === 'nodejs';

  if (hasNodeStack) {
    // Detect PM from working directory if available, default to npm for greenfield projects
    const pm = answers.workingDirectory ? detectPackageManager(answers.workingDirectory) : 'npm';
    sections.push(`- **lint**: \`${formatRunCommand(pm, 'lint')}\``);
    sections.push(`- **build**: \`${formatRunCommand(pm, 'build')}\``);
    sections.push(`- **test**: \`${formatRunCommand(pm, 'test')}\``);
  } else if (answers.techStack.backend === 'python') {
    sections.push('- **lint**: `ruff check .`');
    sections.push('- **test**: `pytest`');
  } else if (answers.techStack.backend === 'go') {
    sections.push('- **lint**: `go vet ./...`');
    sections.push('- **build**: `go build ./...`');
    sections.push('- **test**: `go test ./...`');
  }

  sections.push('');
  sections.push('## Code Patterns');
  sections.push('');
  sections.push('Follow these patterns:');
  sections.push('');
  sections.push('- Keep functions small and focused');
  sections.push('- Use descriptive variable and function names');
  sections.push('- Handle errors explicitly');
  sections.push('- Add comments for complex logic');
  sections.push('');

  return sections.join('\n');
}

/**
 * Check if tech stack has any values
 */
function hasTechStack(stack: TechStack): boolean {
  return !!(stack.frontend || stack.backend || stack.database || stack.styling || stack.language);
}

/**
 * Format tech name for display
 */
function formatTech(tech: string): string {
  const names: Record<string, string> = {
    astro: 'Astro',
    react: 'React',
    nextjs: 'Next.js',
    vue: 'Vue.js',
    svelte: 'Svelte',
    vanilla: 'Vanilla JavaScript',
    'react-native': 'React Native',
    expo: 'Expo (React Native)',
    nodejs: 'Node.js',
    python: 'Python',
    go: 'Go',
    sqlite: 'SQLite',
    postgres: 'PostgreSQL',
    mongodb: 'MongoDB',
    tailwind: 'Tailwind CSS',
    css: 'CSS',
    scss: 'SCSS',
    'styled-components': 'styled-components',
    typescript: 'TypeScript',
    javascript: 'JavaScript',
  };
  return names[tech] || tech;
}

/**
 * Generate a sanitized filename from project name
 */
export function sanitizeFilename(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}
