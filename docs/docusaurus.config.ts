import { themes as prismThemes } from 'prism-react-renderer';
import type { Config } from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'ralph-starter - AI-Powered Autonomous Coding from Specs to Production',
  tagline: 'Connect your tools like GitHub, Linear, and Notion. Fetch specs from anywhere and let AI coding agents build production-ready code automatically with autonomous loops.',
  favicon: 'img/favicon.ico',

  future: {
    v4: true,
  },

  // Cloudflare Pages URL
  url: 'https://ralphstarter.ai',
  baseUrl: '/',

  // Project config
  organizationName: 'rubenmarcus',
  projectName: 'ralph-starter',
  trailingSlash: false,

  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  // SEO metadata and structured data for AEO
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
    // AI crawler hints
    {
      tagName: 'meta',
      attributes: {
        name: 'robots',
        content: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
      },
    },
    // JSON-LD: SoftwareApplication schema
    {
      tagName: 'script',
      attributes: {
        type: 'application/ld+json',
      },
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name: 'ralph-starter',
        description: 'AI-powered autonomous coding tool. Connect GitHub, Linear, Notion and run AI coding loops from specs to production.',
        url: 'https://ralphstarter.ai',
        applicationCategory: 'DeveloperApplication',
        operatingSystem: 'macOS, Linux, Windows',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD',
        },
        author: {
          '@type': 'Person',
          name: 'rubenmarcus',
          url: 'https://github.com/rubenmarcus',
        },
        softwareRequirements: 'Node.js 18+',
        downloadUrl: 'https://www.npmjs.com/package/ralph-starter',
        codeRepository: 'https://github.com/rubenmarcus/ralph-starter',
        programmingLanguage: 'TypeScript',
        keywords: ['AI coding', 'autonomous coding', 'claude code', 'MCP server', 'developer tools'],
      }),
    },
    // JSON-LD: WebSite schema for docs
    {
      tagName: 'script',
      attributes: {
        type: 'application/ld+json',
      },
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'ralph-starter Documentation',
        url: 'https://ralphstarter.ai',
        description: 'Documentation for ralph-starter - AI-powered autonomous coding from specs to production',
        potentialAction: {
          '@type': 'SearchAction',
          target: 'https://ralphstarter.ai/search?q={search_term_string}',
          'query-input': 'required name=search_term_string',
        },
      }),
    },
    // JSON-LD: TechArticle schema for documentation
    {
      tagName: 'script',
      attributes: {
        type: 'application/ld+json',
      },
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'TechArticle',
        headline: 'ralph-starter Documentation',
        description: 'Complete documentation for ralph-starter - AI-powered autonomous coding tool. Learn how to connect Figma, GitHub, Linear, and Notion to run AI coding loops from specs to production.',
        url: 'https://ralphstarter.ai/docs/intro',
        author: {
          '@type': 'Person',
          name: 'rubenmarcus',
          url: 'https://github.com/rubenmarcus',
        },
        publisher: {
          '@type': 'Organization',
          name: 'ralph-starter',
          url: 'https://ralphstarter.ai',
        },
        mainEntityOfPage: 'https://ralphstarter.ai/docs/intro',
        articleSection: 'Documentation',
        proficiencyLevel: 'Beginner',
        dependencies: 'Node.js 18+',
        keywords: ['AI coding', 'autonomous coding', 'claude code', 'MCP server', 'Figma integration', 'GitHub integration', 'Linear integration', 'Notion integration'],
        about: [
          {
            '@type': 'Thing',
            name: 'AI Code Generation',
            description: 'Using AI to automatically generate production-ready code',
          },
          {
            '@type': 'Thing',
            name: 'Developer Tools',
            description: 'CLI tools for software development automation',
          },
        ],
      }),
    },
  ],

  plugins: [
    [
      'docusaurus-plugin-llms',
      {
        generateLLMsTxt: true,
        generateLLMsFullTxt: true,
        docsDir: 'docs',
        title: 'ralph-starter Documentation',
        description: 'AI-powered autonomous coding tool. Connect GitHub, Linear, Notion and run AI coding loops from specs to production.',
      },
    ],
    [
      './plugins/raw-markdown.js',
      {
        docsDir: 'docs',
      },
    ],
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
        blog: false, // Disabled for now
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
    image: 'img/thumbnail.png',
    colorMode: {
      defaultMode: 'dark',
      disableSwitch: true,
      respectPrefersColorScheme: false,
    },
    metadata: [
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'og:type', content: 'website' },
      { property: 'og:title', content: 'ralph-starter - AI-Powered Autonomous Coding' },
      { property: 'og:description', content: 'Connect your tools like GitHub, Linear, and Notion. Fetch specs from anywhere and let AI coding agents build production-ready code automatically.' },
      { property: 'og:image', content: 'https://ralphstarter.ai/img/thumbnail.png' },
      { name: 'twitter:title', content: 'ralph-starter - AI-Powered Autonomous Coding' },
      { name: 'twitter:description', content: 'Connect your tools like GitHub, Linear, and Notion. Fetch specs from anywhere and let AI coding agents build production-ready code automatically.' },
      { name: 'twitter:image', content: 'https://ralphstarter.ai/img/thumbnail.png' },
    ],
    navbar: {
      title: '',
      logo: {
        alt: 'ralph-starter',
        src: 'img/small-logo.png',
      },
      items: [
        {
          type: 'html',
          position: 'left',
          value: '<span class="navbar__slash">/</span><a href="/" class="navbar__brand-stack"><span class="navbar__brand-title">ralph starter</span></a>',
        },
        {
          type: 'docSidebar',
          sidebarId: 'docsSidebar',
          position: 'left',
          label: 'Docs',
        },
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
            { label: 'Ideas & Roadmap', href: 'https://github.com/rubenmarcus/ralph-ideas/issues' },
            { label: 'Templates', href: 'https://github.com/rubenmarcus/ralph-templates' },
          ],
        },
        {
          title: 'More',
          items: [
            { label: 'npm', href: 'https://www.npmjs.com/package/ralph-starter' },
          ],
        },
      ],
      logo: {
        alt: 'MultiVM Labs',
        src: 'img/multivm-logo.png',
        href: 'https://multivmlabs.com',
        width: 130,
        height: 29,
      },
      copyright: `vibecoded with love ❤️ by <a href="https://github.com/rubenmarcus" target="_blank" rel="noopener noreferrer">rubenmarcus</a>`,
    },
    prism: {
      theme: prismThemes.dracula,
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
