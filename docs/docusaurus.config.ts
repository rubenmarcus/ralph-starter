import { themes as prismThemes } from 'prism-react-renderer';
import type { Config } from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'ralph-starter',
  tagline: 'Ralph Wiggum made easy. One command to run autonomous AI coding loops.',
  favicon: 'img/favicon.ico',

  future: {
    v4: true,
  },

  // GitHub Pages URL
  url: 'https://rubenmarcus.github.io',
  baseUrl: '/',

  // GitHub pages deployment config
  organizationName: 'rubenmarcus',
  projectName: 'ralph-starter',
  trailingSlash: false,

  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  // SEO metadata
  headTags: [
    {
      tagName: 'meta',
      attributes: {
        name: 'keywords',
        content: 'ralph wiggum, autonomous AI coding, claude code, AI code generation, coding loops, MCP server, developer tools',
      },
    },
    {
      tagName: 'meta',
      attributes: {
        name: 'author',
        content: 'ralph-starter contributors',
      },
    },
  ],

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          editUrl: 'https://github.com/rubenmarcus/ralph-starter/tree/main/docs/',
          routeBasePath: 'docs',
        },
        blog: {
          showReadingTime: true,
          feedOptions: {
            type: ['rss', 'atom'],
            xslt: true,
          },
          editUrl: 'https://github.com/rubenmarcus/ralph-starter/tree/main/docs/',
          blogTitle: 'ralph-starter Blog',
          blogDescription: 'Updates and tutorials for ralph-starter',
        },
        theme: {
          customCss: './src/css/custom.css',
        },
        sitemap: {
          changefreq: 'weekly',
          priority: 0.5,
        },
        gtag: {
          trackingID: 'G-XXXXXXXXXX', // TODO: Add your Google Analytics ID
          anonymizeIP: true,
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    image: 'img/ralph-starter-social-card.png',
    colorMode: {
      defaultMode: 'light',
      respectPrefersColorScheme: true,
    },
    metadata: [
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'og:type', content: 'website' },
    ],
    navbar: {
      title: 'ralph-starter',
      logo: {
        alt: 'ralph-starter Logo',
        src: 'img/small-logo.png',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'docsSidebar',
          position: 'left',
          label: 'Docs',
        },
        { to: '/blog', label: 'Blog', position: 'left' },
        {
          href: 'https://github.com/rubenmarcus/ralph-starter',
          label: 'GitHub',
          position: 'right',
        },
        {
          href: 'https://www.npmjs.com/package/ralph-starter',
          label: 'npm',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Docs',
          items: [
            { label: 'Getting Started', to: '/docs/intro' },
            { label: 'CLI Reference', to: '/docs/cli/run' },
            { label: 'Integrations', to: '/docs/sources/overview' },
          ],
        },
        {
          title: 'Community',
          items: [
            { label: 'GitHub', href: 'https://github.com/rubenmarcus/ralph-starter' },
            { label: 'GitHub Discussions', href: 'https://github.com/rubenmarcus/ralph-starter/discussions' },
            { label: 'Issues', href: 'https://github.com/rubenmarcus/ralph-starter/issues' },
          ],
        },
        {
          title: 'More',
          items: [
            { label: 'Blog', to: '/blog' },
            { label: 'npm', href: 'https://www.npmjs.com/package/ralph-starter' },
          ],
        },
      ],
      logo: {
        alt: 'ralph-starter',
        src: 'img/small-logo.png',
        href: '/',
        width: 60,
        height: 60,
      },
      copyright: `Copyright © ${new Date().getFullYear()} ralph-starter`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['bash', 'json', 'typescript'],
    },
    algolia: {
      // TODO: Set up Algolia search
      appId: 'YOUR_APP_ID',
      apiKey: 'YOUR_SEARCH_API_KEY',
      indexName: 'ralph-starter',
      contextualSearch: true,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
