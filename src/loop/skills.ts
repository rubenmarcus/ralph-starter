import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

export interface ClaudeSkill {
  name: string;
  path: string;
  description?: string;
  source: 'global' | 'project' | 'skills.sh';
}

/**
 * Extract skill description from markdown content
 * Looks for first paragraph after title
 */
function extractDescription(content: string): string | undefined {
  const lines = content.split('\n');
  let foundTitle = false;

  for (const line of lines) {
    const trimmed = line.trim();

    // Skip empty lines before title
    if (!foundTitle && !trimmed) continue;

    // Found title (heading)
    if (trimmed.startsWith('#')) {
      foundTitle = true;
      continue;
    }

    // After title, get first non-empty line as description
    if (foundTitle && trimmed && !trimmed.startsWith('#')) {
      // Clean up the description
      return trimmed.slice(0, 100) + (trimmed.length > 100 ? '...' : '');
    }
  }

  return undefined;
}

/**
 * Detect Claude Code skills from various sources
 */
export function detectClaudeSkills(cwd: string): ClaudeSkill[] {
  const skills: ClaudeSkill[] = [];

  // 1. Check global skills directory (~/.claude/skills/)
  const globalSkillsDir = join(homedir(), '.claude', 'skills');
  if (existsSync(globalSkillsDir)) {
    try {
      const files = readdirSync(globalSkillsDir);
      for (const file of files) {
        if (file.endsWith('.md')) {
          const skillPath = join(globalSkillsDir, file);
          const content = readFileSync(skillPath, 'utf-8');
          skills.push({
            name: file.replace('.md', ''),
            path: skillPath,
            description: extractDescription(content),
            source: 'global',
          });
        }
      }
    } catch {
      // Directory not readable
    }
  }

  // 2. Check project skills directory (.claude/skills/)
  const projectSkillsDir = join(cwd, '.claude', 'skills');
  if (existsSync(projectSkillsDir)) {
    try {
      const files = readdirSync(projectSkillsDir);
      for (const file of files) {
        if (file.endsWith('.md')) {
          const skillPath = join(projectSkillsDir, file);
          const content = readFileSync(skillPath, 'utf-8');
          skills.push({
            name: file.replace('.md', ''),
            path: skillPath,
            description: extractDescription(content),
            source: 'project',
          });
        }
      }
    } catch {
      // Directory not readable
    }
  }

  // 3. Check for skills.sh script (common pattern for skill installation)
  const skillsShPaths = [
    join(cwd, 'skills.sh'),
    join(cwd, '.claude', 'skills.sh'),
    join(homedir(), '.claude', 'skills.sh'),
  ];

  for (const skillsShPath of skillsShPaths) {
    if (existsSync(skillsShPath)) {
      try {
        const content = readFileSync(skillsShPath, 'utf-8');
        // Parse skills from skills.sh
        // Common patterns: skill names in comments or install commands
        const skillMatches = content.match(/# Skill: (.+)/gi);
        if (skillMatches) {
          for (const match of skillMatches) {
            const name = match.replace(/# Skill: /i, '').trim();
            skills.push({
              name,
              path: skillsShPath,
              description: 'From skills.sh',
              source: 'skills.sh',
            });
          }
        }
      } catch {
        // File not readable
      }
    }
  }

  return skills;
}

/**
 * Get skills relevant to a specific tech stack
 */
export function getRelevantSkills(
  skills: ClaudeSkill[],
  techStack: {
    frontend?: string;
    backend?: string;
    database?: string;
    styling?: string;
    language?: string;
  }
): ClaudeSkill[] {
  const relevantKeywords: string[] = [];

  // Build list of relevant keywords from tech stack
  if (techStack.frontend) relevantKeywords.push(techStack.frontend.toLowerCase());
  if (techStack.backend) relevantKeywords.push(techStack.backend.toLowerCase());
  if (techStack.database) relevantKeywords.push(techStack.database.toLowerCase());
  if (techStack.styling) relevantKeywords.push(techStack.styling.toLowerCase());
  if (techStack.language) relevantKeywords.push(techStack.language.toLowerCase());

  // Add related keywords
  const expansions: Record<string, string[]> = {
    react: ['jsx', 'component', 'hook'],
    nextjs: ['react', 'ssr', 'app-router'],
    astro: ['static', 'island'],
    vue: ['composition', 'template'],
    svelte: ['component', 'reactive'],
    nodejs: ['node', 'npm', 'javascript'],
    express: ['api', 'rest', 'middleware'],
    fastify: ['api', 'rest'],
    postgres: ['sql', 'database', 'pg'],
    mongodb: ['nosql', 'document', 'mongo'],
    tailwind: ['css', 'utility', 'style'],
    typescript: ['ts', 'type', 'typed'],
  };

  for (const keyword of [...relevantKeywords]) {
    const expanded = expansions[keyword];
    if (expanded) {
      relevantKeywords.push(...expanded);
    }
  }

  // Filter skills by relevance
  return skills.filter((skill) => {
    const nameLower = skill.name.toLowerCase();
    const descLower = (skill.description || '').toLowerCase();

    return relevantKeywords.some(
      (keyword) => nameLower.includes(keyword) || descLower.includes(keyword)
    );
  });
}

/**
 * Format skills for inclusion in agent prompt
 */
export function formatSkillsForPrompt(skills: ClaudeSkill[]): string {
  if (skills.length === 0) return '';

  const lines = ['## Available Claude Code Skills', ''];

  for (const skill of skills) {
    lines.push(`- **${skill.name}**: ${skill.description || 'No description'}`);
  }

  lines.push('');
  lines.push('Use these skills when appropriate by invoking them with /skill-name.');

  return lines.join('\n');
}

/**
 * Check if any skills are available
 */
export function hasSkills(cwd: string): boolean {
  return detectClaudeSkills(cwd).length > 0;
}
