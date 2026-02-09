import type { SidebarsConfig } from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  docsSidebar: [
    'intro',
    'installation',
    {
      type: 'category',
      label: 'Interactive Wizard',
      collapsed: false,
      items: [
        'wizard/overview',
        'wizard/idea-mode',
      ],
    },
    {
      type: 'category',
      label: 'Input Sources',
      collapsed: false,
      items: [
        'sources/overview',
        'sources/figma',
        'sources/github',
        'sources/linear',
        'sources/notion',
      ],
    },
    {
      type: 'category',
      label: 'MCP Integration',
      collapsed: false,
      items: [
        'mcp/setup',
        'mcp/claude-desktop',
      ],
    },
    {
      type: 'category',
      label: 'CLI Reference',
      collapsed: true,
      items: [
        'cli/run',
        'cli/init',
        'cli/plan',
        'cli/config',
        'cli/source',
        'cli/auto',
        'cli/auth',
        'cli/setup',
        'cli/check',
        'cli/skill',
        'cli/integrations',
        'cli/presets',
      ],
    },
    {
      type: 'category',
      label: 'Guides',
      collapsed: false,
      items: [
        'guides/testing-integrations',
        'guides/extending-ralph-starter',
        'guides/workflow-presets',
        'guides/cost-tracking',
        'guides/prd-workflow',
        'guides/skills-system',
      ],
    },
    {
      type: 'category',
      label: 'Advanced',
      collapsed: true,
      items: [
        'advanced/ralph-playbook',
        'advanced/validation',
        'advanced/git-automation',
        'advanced/rate-limiting',
        'advanced/circuit-breaker',
      ],
    },
    {
      type: 'category',
      label: 'Community',
      collapsed: false,
      items: [
        'community/ideas',
        'community/changelog',
        'community/contributing',
      ],
    },
  ],
};

export default sidebars;
