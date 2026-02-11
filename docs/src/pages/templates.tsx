import React from 'react';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import styles from './templates.module.css';

interface Template {
  name: string;
  description: string;
  tags: string[];
  path: string;
  category: string;
}

const templates: Template[] = [
  // Web Development
  {
    name: 'nextjs-saas',
    description: 'Next.js SaaS starter with authentication, billing, and dashboard',
    tags: ['Next.js', 'SaaS', 'Auth'],
    path: 'nextjs-saas',
    category: 'Web',
  },
  {
    name: 'landing-page',
    description: 'Modern landing page with smooth animations and responsive design',
    tags: ['Landing', 'Animations', 'Marketing'],
    path: 'landing-page',
    category: 'Web',
  },
  {
    name: 'express-api',
    description: 'RESTful API with Express.js, TypeScript, and OpenAPI docs',
    tags: ['Express', 'REST', 'TypeScript'],
    path: 'express-api',
    category: 'Web',
  },
  {
    name: 'graphql-api',
    description: 'GraphQL API with Apollo Server and type-safe resolvers',
    tags: ['GraphQL', 'Apollo', 'TypeScript'],
    path: 'graphql-api',
    category: 'Web',
  },
  {
    name: 'ecommerce',
    description: 'Full e-commerce platform with cart, checkout, and payments',
    tags: ['E-commerce', 'Payments', 'Full-stack'],
    path: 'ecommerce',
    category: 'Web',
  },
  {
    name: 'blog-cms',
    description: 'Blog with CMS capabilities and markdown support',
    tags: ['Blog', 'CMS', 'Markdown'],
    path: 'blog-cms',
    category: 'Web',
  },
  // Blockchain
  {
    name: 'erc20-token',
    description: 'ERC-20 token contract with comprehensive test suite',
    tags: ['Solidity', 'ERC-20', 'Web3'],
    path: 'erc20-token',
    category: 'Blockchain',
  },
  {
    name: 'nft-collection',
    description: 'NFT collection with minting, metadata, and marketplace integration',
    tags: ['NFT', 'ERC-721', 'IPFS'],
    path: 'nft-collection',
    category: 'Blockchain',
  },
  {
    name: 'defi-staking',
    description: 'DeFi staking platform with rewards and governance',
    tags: ['DeFi', 'Staking', 'Solidity'],
    path: 'defi-staking',
    category: 'Blockchain',
  },
  {
    name: 'web3-dapp',
    description: 'Web3 dApp with wallet connect and smart contract integration',
    tags: ['dApp', 'Web3', 'ethers.js'],
    path: 'web3-dapp',
    category: 'Blockchain',
  },
  // DevOps
  {
    name: 'docker-compose',
    description: 'Multi-container Docker setup with networking and volumes',
    tags: ['Docker', 'Containers', 'DevOps'],
    path: 'docker-compose',
    category: 'DevOps',
  },
  {
    name: 'kubernetes',
    description: 'Kubernetes deployment configs with Helm charts',
    tags: ['K8s', 'Helm', 'DevOps'],
    path: 'kubernetes',
    category: 'DevOps',
  },
  {
    name: 'github-actions',
    description: 'CI/CD pipelines with GitHub Actions workflows',
    tags: ['CI/CD', 'GitHub', 'Automation'],
    path: 'github-actions',
    category: 'DevOps',
  },
  {
    name: 'terraform',
    description: 'Infrastructure as Code with Terraform modules',
    tags: ['Terraform', 'IaC', 'Cloud'],
    path: 'terraform',
    category: 'DevOps',
  },
  // Mobile
  {
    name: 'react-native-app',
    description: 'Cross-platform mobile app with React Native and Expo',
    tags: ['React Native', 'Mobile', 'Expo'],
    path: 'react-native-app',
    category: 'Mobile',
  },
  // Tools
  {
    name: 'cli-tool',
    description: 'Node.js CLI application with Commander.js and interactive prompts',
    tags: ['CLI', 'Node.js', 'Commander'],
    path: 'cli-tool',
    category: 'Tools',
  },
  {
    name: 'chrome-extension',
    description: 'Chrome browser extension with popup and background scripts',
    tags: ['Chrome', 'Extension', 'JavaScript'],
    path: 'chrome-extension',
    category: 'Tools',
  },
  {
    name: 'vscode-extension',
    description: 'VS Code extension with commands and language features',
    tags: ['VS Code', 'Extension', 'TypeScript'],
    path: 'vscode-extension',
    category: 'Tools',
  },
];

function TemplateCard({ template }: { template: Template }) {
  return (
    <div className={styles.templateCard}>
      <div className={styles.cardHeader}>
        <h3 className={styles.templateName}>{template.name}</h3>
        <div className={styles.tags}>
          {template.tags.map((tag) => (
            <span key={tag} className={styles.tag}>{tag}</span>
          ))}
        </div>
      </div>
      <p className={styles.templateDescription}>{template.description}</p>
      <div className={styles.cardActions}>
        <code className={styles.useCommand}>ralph-starter template use {template.path}</code>
        <a
          href={`https://github.com/multivmlabs/ralph-templates/tree/main/templates/${template.path}`}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.viewLink}
        >
          View on GitHub
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={styles.externalIcon}>
            <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" />
          </svg>
        </a>
      </div>
    </div>
  );
}

export default function TemplatesPage(): React.ReactElement {
  return (
    <Layout
      title="Templates"
      description="Ready-to-use project templates for ralph-starter. Start your next project with best practices baked in."
    >
      <main className={styles.main}>
        <section className={styles.hero}>
          <div className={styles.container}>
            <span className={styles.label}>Templates</span>
            <h1 className={styles.title}>Start with a solid foundation</h1>
            <p className={styles.subtitle}>
              Production-ready project templates with best practices, tooling, and configurations already set up
            </p>
            <div className={styles.heroActions}>
              <a
                href="https://github.com/multivmlabs/ralph-templates"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.primaryButton}
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className={styles.githubIcon}>
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
                View All Templates
              </a>
              <Link to="/docs/cli/template" className={styles.secondaryButton}>
                Read the Docs
              </Link>
            </div>
          </div>
        </section>

        <section className={styles.templatesSection}>
          <div className={styles.container}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>All Templates</h2>
              <p className={styles.sectionSubtitle}>
                Use any template with <code>ralph-starter template use &lt;name&gt;</code>
              </p>
            </div>

            {['Web', 'Blockchain', 'DevOps', 'Mobile', 'Tools'].map((category) => (
              <div key={category} className={styles.categorySection}>
                <h3 className={styles.categoryTitle}>{category}</h3>
                <div className={styles.templatesGrid}>
                  {templates
                    .filter((t) => t.category === category)
                    .map((template) => (
                      <TemplateCard key={template.name} template={template} />
                    ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className={styles.contributeSection}>
          <div className={styles.container}>
            <div className={styles.contributeCard}>
              <div className={styles.contributeContent}>
                <h2 className={styles.contributeTitle}>Create Your Own Template</h2>
                <p className={styles.contributeText}>
                  Have a project setup you love? Share it with the community by contributing a template.
                </p>
              </div>
              <a
                href="https://github.com/multivmlabs/ralph-templates/blob/main/CONTRIBUTING.md"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.contributeButton}
              >
                Contribution Guide
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </a>
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
}
