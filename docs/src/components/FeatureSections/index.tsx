import React, { useEffect, useRef, useState } from 'react';
import Link from '@docusaurus/Link';
import useBaseUrl from '@docusaurus/useBaseUrl';
import styles from './styles.module.css';

interface Feature {
  title: string;
  description: string;
  image: string;
  imageAlt: string;
  highlights: string[];
  link?: string;
  linkText?: string;
  terminal: {
    command: string;
    output: string[];
  };
}

const features: Feature[] = [
  {
    title: 'Connect Your Tools',
    description: 'Fetch specs from where your work already lives. GitHub issues, Linear tickets, Notion pages - ralph-starter pulls them in and turns them into working code.',
    image: '/img/integration.png',
    imageAlt: 'Ralph Integration',
    highlights: [
      'GitHub Issues & PRs',
      'Linear tickets',
      'Notion pages',
      'Local files & URLs',
    ],
    link: '/docs/sources/overview',
    linkText: 'See all integrations',
    terminal: {
      command: 'ralph-starter run --github "owner/repo#123"',
      output: [
        '📥 Fetching GitHub issue #123...',
        '✓ Found: "Add user authentication"',
        '✓ Loaded 3 linked files',
        '🚀 Starting AI coding loop...',
      ],
    },
  },
  {
    title: 'AI-Powered Coding Loops',
    description: 'Let AI agents do the heavy lifting. Ralph runs autonomous coding loops - analyzing, implementing, testing, and committing until the job is done.',
    image: '/img/coder.png',
    imageAlt: 'Ralph Coder',
    highlights: [
      'Multiple AI agents supported',
      'Automatic iteration',
      'Progress tracking',
      'Cost monitoring',
    ],
    link: '/docs/cli/run',
    linkText: 'Learn about agents',
    terminal: {
      command: 'ralph-starter run "build a REST API" --loops 5',
      output: [
        '🔄 Loop 1/5: Analyzing requirements...',
        '🔄 Loop 2/5: Creating endpoints...',
        '🔄 Loop 3/5: Adding validation...',
        '✨ Completed in 3 loops | Cost: $0.28',
      ],
    },
  },
  {
    title: 'Built-in Validation',
    description: 'Every iteration runs through your test suite, linter, and build process. Catch issues early and ensure production-ready code.',
    image: '/img/engineer.png',
    imageAlt: 'Ralph Engineer',
    highlights: [
      'Auto-run tests',
      'Lint checking',
      'Build validation',
      'Error recovery',
    ],
    link: '/docs/advanced/validation',
    linkText: 'Configure validation',
    terminal: {
      command: 'ralph-starter run "fix the login bug" --test --lint',
      output: [
        '🧪 Running tests... 23 passed',
        '🔍 Running linter... no issues',
        '🏗️  Building project... success',
        '✅ All validations passed!',
      ],
    },
  },
  {
    title: 'Git Automation',
    description: 'From commit to PR - ralph-starter handles the git workflow. Each successful iteration becomes a clean commit, ready for review.',
    image: '/img/scientist.png',
    imageAlt: 'Ralph Scientist',
    highlights: [
      'Auto-commit changes',
      'Push to remote',
      'Create pull requests',
      'Meaningful commit messages',
    ],
    link: '/docs/advanced/git-automation',
    linkText: 'Git workflow docs',
    terminal: {
      command: 'ralph-starter run "add dark mode" --commit --pr',
      output: [
        '📝 Committing: "feat: add dark mode toggle"',
        '📤 Pushing to origin/feature/dark-mode...',
        '🔗 Creating pull request...',
        '✨ PR #42 created successfully!',
      ],
    },
  },
];

function Terminal({ command, output }: { command: string; output: string[] }) {
  return (
    <div className={styles.terminal}>
      <div className={styles.terminalHeader}>
        <span className={`${styles.terminalDot} ${styles.red}`}></span>
        <span className={`${styles.terminalDot} ${styles.yellow}`}></span>
        <span className={`${styles.terminalDot} ${styles.green}`}></span>
      </div>
      <div className={styles.terminalBody}>
        <div className={styles.terminalLine}>
          <span className={styles.terminalPrompt}>$</span>
          <span className={styles.terminalCommand}> {command}</span>
        </div>
        <div className={styles.terminalOutput}>
          {output.map((line, i) => (
            <div key={i}>{line}</div>
          ))}
        </div>
      </div>
    </div>
  );
}

function FeatureRow({ feature, index }: { feature: Feature; index: number }) {
  const [isVisible, setIsVisible] = useState(false);
  const rowRef = useRef<HTMLDivElement>(null);
  const imageSrc = useBaseUrl(feature.image);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.2 }
    );

    if (rowRef.current) {
      observer.observe(rowRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={rowRef} className={styles.featureSection}>
      <div className={`${styles.container} ${styles.featureRow} ${index % 2 === 1 ? styles.reversed : ''} ${isVisible ? styles.visible : ''}`}>
        <div className={`${styles.featureImage} ${styles.animateIn}`}>
          <div className={styles.imageWrapper}>
            <img
              src={imageSrc}
              alt={feature.imageAlt}
              className={styles.ralphImage}
            />
            <div className={styles.imageGlow}></div>
          </div>
        </div>

        <div className={styles.featureContent}>
          <h2 className={`${styles.featureTitle} ${styles.animateIn} ${styles.delay1}`}>{feature.title}</h2>
          <p className={`${styles.featureDescription} ${styles.animateIn} ${styles.delay2}`}>{feature.description}</p>

          <ul className={`${styles.highlights} ${styles.animateIn} ${styles.delay2}`}>
            {feature.highlights.map((highlight) => (
              <li key={highlight}>
                <span className={styles.checkmark}>✓</span>
                {highlight}
              </li>
            ))}
          </ul>

          <div className={`${styles.animateIn} ${styles.delay3}`}>
            <Terminal command={feature.terminal.command} output={feature.terminal.output} />
          </div>

          {feature.link && (
            <Link to={feature.link} className={`${styles.featureLink} ${styles.animateIn} ${styles.delay4}`}>
              {feature.linkText} →
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

export default function FeatureSections(): React.ReactElement {
  return (
    <section className={styles.features}>
      {features.map((feature, index) => (
        <FeatureRow key={feature.title} feature={feature} index={index} />
      ))}
    </section>
  );
}
