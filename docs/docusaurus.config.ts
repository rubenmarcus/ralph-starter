import { themes as prismThemes } from 'prism-react-renderer';
import type { Config } from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const siteUrl = 'https://ralphstarter.ai';

const config: Config = {
  title: 'ralph-starter - AI-Powered Autonomous Coding from Specs to Production',
  tagline: 'Connect your tools like GitHub, Linear, and Notion. Fetch specs from anywhere and let AI coding agents build production-ready code automatically with autonomous loops.',
  favicon: 'img/favicon.ico',

  future: {
    v4: true,
  },

  // Cloudflare Pages URL
  url: siteUrl,
  baseUrl: '/',

  // Project config
  organizationName: 'multivmlabs',
  projectName: 'ralph-starter',
  trailingSlash: false,

  onBrokenLinks: 'throw',
  onBrokenAnchors: 'throw',
  markdown: {
    hooks: {
      onBrokenMarkdownLinks: 'warn',
    },
  },

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
    {
      tagName: 'meta',
      attributes: {
        name: 'googlebot',
        content: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
      },
    },
    {
      tagName: 'meta',
      attributes: {
        name: 'bingbot',
        content: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
      },
    },
    {
      tagName: 'link',
      attributes: {
        rel: 'alternate',
        type: 'text/plain',
        href: `${siteUrl}/llms.txt`,
        title: 'LLMs.txt',
      },
    },
    {
      tagName: 'link',
      attributes: {
        rel: 'alternate',
        type: 'application/json',
        href: `${siteUrl}/docs.json`,
        title: 'Documentation Manifest',
      },
    },
    {
      tagName: 'link',
      attributes: {
        rel: 'sitemap',
        type: 'application/xml',
        href: `${siteUrl}/sitemap.xml`,
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
        url: siteUrl,
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
        codeRepository: 'https://github.com/multivmlabs/ralph-starter',
        programmingLanguage: 'TypeScript',
        keywords: ['AI coding', 'autonomous coding', 'claude code', 'MCP server', 'developer tools'],
      }),
    },
    // JSON-LD: Organization schema for stronger search understanding
    {
      tagName: 'script',
      attributes: {
        type: 'application/ld+json',
      },
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: 'ralph-starter',
        url: siteUrl,
        logo: `${siteUrl}/img/small-logo.png`,
        sameAs: [
          'https://github.com/multivmlabs/ralph-starter',
          'https://www.npmjs.com/package/ralph-starter',
        ],
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
        url: siteUrl,
        description: 'Documentation for ralph-starter - AI-powered autonomous coding from specs to production',
        potentialAction: {
          '@type': 'SearchAction',
          target: `${siteUrl}/search?q={search_term_string}`,
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
        url: `${siteUrl}/docs/intro`,
        author: {
          '@type': 'Person',
          name: 'rubenmarcus',
          url: 'https://github.com/rubenmarcus',
        },
        publisher: {
          '@type': 'Organization',
          name: 'ralph-starter',
          url: siteUrl,
        },
        mainEntityOfPage: `${siteUrl}/docs/intro`,
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
          editUrl: 'https://github.com/multivmlabs/ralph-starter/tree/main/docs/',
          routeBasePath: 'docs',
        },
        blog: false, // Disabled for now
        theme: {
          customCss: './src/css/custom.css',
        },
        sitemap: {
          changefreq: 'daily',
          priority: 0.7,
          ignorePatterns: ['/search/**'],
        },
        gtag: {
          trackingID: 'G-4HSM6GRG3R',
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
      { property: 'og:type', content: 'website' },
      { property: 'og:site_name', content: 'ralph-starter' },
      { property: 'og:title', content: 'ralph-starter - AI-Powered Autonomous Coding' },
      { property: 'og:description', content: 'Connect your tools like GitHub, Linear, and Notion. Fetch specs from anywhere and let AI coding agents build production-ready code automatically.' },
      { property: 'og:image', content: `${siteUrl}/img/thumbnail.png` },
      { name: 'twitter:title', content: 'ralph-starter - AI-Powered Autonomous Coding' },
      { name: 'twitter:description', content: 'Connect your tools like GitHub, Linear, and Notion. Fetch specs from anywhere and let AI coding agents build production-ready code automatically.' },
      { name: 'twitter:image', content: `${siteUrl}/img/thumbnail.png` },
      { name: 'twitter:site', content: '@ralphstarter' },
    ],
    navbar: {
      title: 'ralph starter',
      logo: {
        alt: 'ralph-starter',
        src: 'img/favicon-96x96.png',
      },
      items: [
        {
          type: 'html',
          position: 'left',
          value: '<a href="/" class="navbar__brand-stack"><span class="navbar__brand-title">ralph starter</span></a>',
        },
        {
          type: 'docSidebar',
          sidebarId: 'docsSidebar',
          position: 'left',
          label: 'Docs',
        },
        {
          to: '/use-cases',
          label: 'Use Cases',
          position: 'left',
        },
        {
          to: '/integrations',
          label: 'Integrations',
          position: 'left',
        },
        {
          to: '/templates',
          label: 'Templates',
          position: 'left',
        },
        {
          type: 'html',
          position: 'right',
          value: '<a href="https://www.npmjs.com/package/ralph-starter" target="_blank" rel="noopener noreferrer" class="navbar__badge-link"><img src="https://img.shields.io/npm/dm/ralph-starter?style=for-the-badge&colorA=08080A&colorB=28282E&label=downloads&logo=npm&logoColor=CB3837" alt="npm downloads" height="28" /></a>',
        },
        {
          type: 'html',
          position: 'right',
          value: '<a href="https://github.com/multivmlabs/ralph-starter" target="_blank" rel="noopener noreferrer" class="navbar__badge-link"><img src="https://img.shields.io/github/stars/multivmlabs/ralph-starter?style=for-the-badge&colorA=08080A&colorB=28282E&label=stars&logo=github&logoColor=white" alt="GitHub stars" height="28" /></a>',
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
            { label: 'GitHub', href: 'https://github.com/multivmlabs/ralph-starter' },
            { label: 'Twitter / X', href: 'https://x.com/ralphstarter' },
            { label: 'Ideas & Roadmap', href: 'https://github.com/multivmlabs/ralph-ideas/issues' },
            { label: 'Templates', href: 'https://github.com/multivmlabs/ralph-templates' },
          ],
        },
        {
          title: 'More',
          items: [
            { label: 'npm', href: 'https://www.npmjs.com/package/ralph-starter' },
            { label: 'Changelog', to: '/docs/community/changelog' },
          ],
        },
      ],
      copyright: `<div class="footer__logos"><a href="/" class="footer__logo-link"><img src="/img/favicon-96x96.png" alt="ralph-starter" height="28" /></a><span class="footer__logo-separator">&</span><a href="https://multivmlabs.com" target="_blank" rel="noopener noreferrer" class="footer__logo-link"><img src="/img/multivm-logo.png" alt="MultiVM Labs" height="28" /></a></div><div class="footer__copyright-text">v0.1.1-beta.16 · vibecoded with love ❤️ by <a href="https://github.com/rubenmarcus" target="_blank" rel="noopener noreferrer">rubenmarcus</a></div>`,
    },
    prism: {
      theme: prismThemes.dracula,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['bash', 'json', 'typescript'],
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
