import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

export interface ClaudeSkill {
  name: string;
  path: string;
  description?: string;
  source: 'global' | 'project' | 'agents' | 'skills.sh';
}

/**
 * Parse YAML frontmatter from markdown content
 * Returns name and description if found
 */
function parseFrontmatter(content: string): { name?: string; description?: string } {
  const match = content.match(/^---\s*\n([\s\S]*?)\n---/);
  if (!match) return {};

  const yaml = match[1];
  const result: { name?: string; description?: string } = {};

  const nameMatch = yaml.match(/^name:\s*(.+)$/m);
  if (nameMatch) result.name = nameMatch[1].trim().replace(/^['"]|['"]$/g, '');

  const descMatch = yaml.match(/^description:\s*(.+)$/m);
  if (descMatch) result.description = descMatch[1].trim().replace(/^['"]|['"]$/g, '');

  return result;
}

/**
 * Extract skill description from markdown content
 * First tries YAML frontmatter, then falls back to first paragraph after title
 */
function extractDescription(content: string): string | undefined {
  // Try frontmatter first
  const fm = parseFrontmatter(content);
  if (fm.description) return fm.description;

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
 * Extract skill name from content (frontmatter or filename)
 */
function extractName(content: string, fallbackName: string): string {
  const fm = parseFrontmatter(content);
  return fm.name || fallbackName;
}

/**
 * Scan a directory for skill files (.md files and subdirectories with SKILL.md)
 */
function scanSkillsDir(dir: string, source: ClaudeSkill['source']): ClaudeSkill[] {
  const skills: ClaudeSkill[] = [];

  if (!existsSync(dir)) return skills;

  try {
    const entries = readdirSync(dir);
    for (const entry of entries) {
      const fullPath = join(dir, entry);

      try {
        const stats = statSync(fullPath);

        if (stats.isFile() && entry.endsWith('.md')) {
          // Flat .md skill file
          const content = readFileSync(fullPath, 'utf-8');
          skills.push({
            name: extractName(content, entry.replace('.md', '')),
            path: fullPath,
            description: extractDescription(content),
            source,
          });
        } else if (stats.isDirectory()) {
          // Try reading SKILL.md inside subdirectory
          const skillMdPath = join(fullPath, 'SKILL.md');
          try {
            const content = readFileSync(skillMdPath, 'utf-8');
            skills.push({
              name: extractName(content, entry),
              path: skillMdPath,
              description: extractDescription(content),
              source,
            });
          } catch {
            // SKILL.md not found or unreadable, skip
          }
        }
      } catch {
        // Skip unreadable entries
      }
    }
  } catch {
    // Directory not readable
  }

  return skills;
}

/**
 * Detect Claude Code skills from various sources
 */
export function detectClaudeSkills(cwd: string): ClaudeSkill[] {
  const skills: ClaudeSkill[] = [];

  // 1. Check global skills directory (~/.claude/skills/)
  skills.push(...scanSkillsDir(join(homedir(), '.claude', 'skills'), 'global'));

  // 2. Check project skills directory (.claude/skills/)
  skills.push(...scanSkillsDir(join(cwd, '.claude', 'skills'), 'project'));

  // 3. Check .agents/skills/ directory (multi-agent skill sharing pattern)
  skills.push(...scanSkillsDir(join(cwd, '.agents', 'skills'), 'agents'));

  // 4. Check for skills.sh scripts
  const skillsShPaths = [
    join(cwd, 'skills.sh'),
    join(cwd, '.claude', 'skills.sh'),
    join(homedir(), '.claude', 'skills.sh'),
  ];

  for (const skillsShPath of skillsShPaths) {
    if (existsSync(skillsShPath)) {
      try {
        const content = readFileSync(skillsShPath, 'utf-8');

        // Parse "# Skill: <name>" comments
        const commentMatches = content.match(/# Skill: (.+)/gi);
        if (commentMatches) {
          for (const match of commentMatches) {
            const name = match.replace(/# Skill: /i, '').trim();
            skills.push({
              name,
              path: skillsShPath,
              description: 'From skills.sh',
              source: 'skills.sh',
            });
          }
        }

        // Parse "npx add-skill <name>" install commands
        const installMatches = content.match(/npx\s+add-skill\s+(\S+)/gi);
        if (installMatches) {
          for (const match of installMatches) {
            const name = match.replace(/npx\s+add-skill\s+/i, '').trim();
            // Avoid duplicates from the comment patterns above
            if (!skills.some((s) => s.name === name)) {
              skills.push({
                name,
                path: skillsShPath,
                description: 'From skills.sh',
                source: 'skills.sh',
              });
            }
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

/**
 * Find a specific skill by name across all locations
 */
export function findSkill(cwd: string, name: string): ClaudeSkill | undefined {
  const skills = detectClaudeSkills(cwd);
  return skills.find((s) => s.name.toLowerCase() === name.toLowerCase());
}
