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
        'sources/github',
        'sources/todoist',
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
      ],
    },
    {
      type: 'category',
      label: 'Guides',
      collapsed: false,
      items: [
        'guides/testing-integrations',
        'guides/extending-ralph-starter',
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
      ],
    },
  ],
};

export default sidebars;
