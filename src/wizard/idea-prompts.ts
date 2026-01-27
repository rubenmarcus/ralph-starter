// LLM prompts for idea brainstorming

/**
 * Get brainstorm prompt with randomness seed
 */
export function getBrainstormPrompt(): string {
  const seed = Math.floor(Math.random() * 10000);
  const themes = [
    'productivity and time management',
    'creative tools for artists and writers',
    'health and wellness tracking',
    'learning and education',
    'finance and budgeting',
    'home automation and IoT',
    'social good and community',
    'gaming and entertainment',
    'data visualization',
    'developer tools and workflows',
  ];
  const randomTheme = themes[Math.floor(Math.random() * themes.length)];

  return `You are a creative product consultant helping someone discover what to build.

IMPORTANT: Be creative and generate UNIQUE ideas. Random seed: ${seed}
Focus especially on: ${randomTheme}

Generate 5 diverse project ideas that a developer could build with AI assistance.
Mix different project types (web apps, CLI tools, APIs, automations).

CRITICAL: Include a MIX of difficulties:
- 1-2 easy projects (simple scripts, basic CRUD)
- 2-3 moderate projects (full-stack apps, integrations)
- 1-2 challenging projects (real-time systems, complex algorithms, distributed systems)

Return ONLY valid JSON (no markdown, no explanation) in this exact format:
{
  "ideas": [
    {
      "title": "Project Title",
      "description": "One compelling sentence about what it does and why it's useful",
      "projectType": "web|api|cli|mobile|library|automation",
      "difficulty": "easy|moderate|challenging",
      "reasons": ["Why this is a good project", "What makes it interesting"]
    }
  ]
}

Guidelines:
- Be CREATIVE - don't repeat common ideas like "todo app" or "weather app"
- AVOID trivial projects - no simple converters, basic calculators, or hello world variations
- Include at least ONE challenging project that would impress in a portfolio:
  * Real-time collaboration features
  * Complex state machines or workflows
  * Data processing pipelines
  * Browser extensions with advanced features
  * Dev tools that solve real pain points
  * Systems with multiple integrations
- For "challenging" difficulty: think projects that require architectural decisions, handle edge cases, have performance considerations
- Focus on real problems developers and users face daily
- Each idea should be completable as an MVP with focused effort`;
}

// Keep for backwards compatibility
export const BRAINSTORM_PROMPT = getBrainstormPrompt();

/**
 * Prompt for trend-based ideas (2025-2026 tech trends)
 */
export const TREND_PROMPT = `You are a tech trends analyst helping developers find relevant project ideas.

Generate 5 project ideas based on current 2025-2026 technology trends:
- AI/LLM integrations and tooling (agents, RAG, fine-tuning pipelines)
- Local-first and privacy-focused apps (CRDTs, offline-first, E2E encryption)
- Developer productivity tools (code analysis, automation, workflows)
- Sustainable/green tech applications (carbon tracking, optimization)
- Accessibility and inclusive design (screen readers, voice interfaces)

CRITICAL: Include a MIX of difficulties - at least 2 should be "challenging"

Return ONLY valid JSON (no markdown, no explanation) in this exact format:
{
  "ideas": [
    {
      "title": "Project Title",
      "description": "One compelling sentence about what it does and why it's relevant now",
      "projectType": "web|api|cli|mobile|library|automation",
      "difficulty": "easy|moderate|challenging",
      "reasons": ["Why this trend matters", "What makes it timely"]
    }
  ]
}

Guidelines:
- Connect ideas to specific current trends with DEPTH (not surface-level)
- For "challenging" projects: think multi-agent systems, real-time sync, complex pipelines
- Include ideas that would make impressive portfolio pieces or open-source contributions
- Focus on practical applications that solve HARD problems
- Explain why NOW is the right time to build this
- AVOID trivial wrappers or simple CRUD apps - those aren't trendy, they're boring`;

/**
 * Prompt for skill-based personalized ideas
 */
export const SKILL_PROMPT = `You are a career advisor helping a developer leverage their skills.

The developer has these skills/interests: {SKILLS}

Generate 5 project ideas that:
- Build on their existing skills
- Help them learn adjacent technologies
- Could potentially become portfolio pieces or side projects

Return ONLY valid JSON (no markdown, no explanation) in this exact format:
{
  "ideas": [
    {
      "title": "Project Title",
      "description": "One sentence about what it does and how it uses their skills",
      "projectType": "web|api|cli|mobile|library|automation",
      "difficulty": "easy|moderate|challenging",
      "reasons": ["How it leverages their skills", "What new skills they'll learn"]
    }
  ]
}

Guidelines:
- Match at least some of their existing skills
- Introduce one new concept per idea
- Consider portfolio value
- Balance challenge with achievability`;

/**
 * Prompt for problem-solving ideas
 */
export const PROBLEM_PROMPT = `You are a problem-solving consultant helping a developer address a pain point.

The developer described this problem or frustration: "{PROBLEM}"

Generate 5 project ideas that could solve or alleviate this problem.
Think creatively about different approaches - tools, automations, apps.

Return ONLY valid JSON (no markdown, no explanation) in this exact format:
{
  "ideas": [
    {
      "title": "Project Title",
      "description": "One sentence about how it solves the problem",
      "projectType": "web|api|cli|mobile|library|automation",
      "difficulty": "easy|moderate|challenging",
      "reasons": ["How it addresses the pain point", "Why this approach works"]
    }
  ]
}

Guidelines:
- Focus on the root cause, not just symptoms
- Offer different levels of solutions (quick fix vs comprehensive)
- Consider automation and tooling first
- Make solutions practical and buildable`;
