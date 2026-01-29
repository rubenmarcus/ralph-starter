import type { ReactNode } from 'react';
import clsx from 'clsx';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

type FeatureItem = {
  title: string;
  emoji: string;
  description: ReactNode;
};

const FeatureList: FeatureItem[] = [
  {
    title: 'Interactive Wizard',
    emoji: '🧙',
    description: (
      <>
        Just run <code>ralph-starter</code> and describe your idea. The wizard
        refines it with AI, lets you customize the stack, and builds it automatically.
      </>
    ),
  },
  {
    title: 'Idea Mode',
    emoji: '💡',
    description: (
      <>
        Don&apos;t know what to build? Run <code>ralph-starter ideas</code> to
        brainstorm with AI. Get suggestions based on trends, your skills, or problems you want to solve.
      </>
    ),
  },
  {
    title: 'Input Sources',
    emoji: '🔗',
    description: (
      <>
        Fetch specs from GitHub Issues, Linear, Notion, URLs, or PDFs.
        Turn your existing tasks into built projects.
      </>
    ),
  },
  {
    title: 'MCP Integration',
    emoji: '🤖',
    description: (
      <>
        Use ralph-starter from Claude Desktop or any MCP client. AI tools that
        can directly call ralph-starter to build projects.
      </>
    ),
  },
  {
    title: 'Git Automation',
    emoji: '📦',
    description: (
      <>
        Auto-commit changes, push to remote, and create pull requests with
        <code>--commit</code>, <code>--push</code>, and <code>--pr</code> flags.
      </>
    ),
  },
  {
    title: 'Validation',
    emoji: '✅',
    description: (
      <>
        Run tests, lint, and build after each iteration with <code>--validate</code>.
        Catches issues early and ensures quality code.
      </>
    ),
  },
];

function Feature({ title, emoji, description }: FeatureItem) {
  return (
    <div className={clsx('col col--4')}>
      <div className="text--center" style={{ fontSize: '3rem', marginBottom: '1rem' }}>
        {emoji}
      </div>
      <div className="text--center padding-horiz--md">
        <Heading as="h3">{title}</Heading>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures(): ReactNode {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
