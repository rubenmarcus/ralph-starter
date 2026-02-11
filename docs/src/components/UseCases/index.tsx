import React, { useEffect, useRef, useState } from 'react';
import Link from '@docusaurus/Link';
import useBaseUrl from '@docusaurus/useBaseUrl';
import styles from './styles.module.css';

interface UseCase {
  icon: string;
  title: string;
  description: string;
  source: string;
  link: string;
}

const useCases: UseCase[] = [
  {
    icon: '/img/figma-logo.svg',
    title: 'Build React from Figma',
    description: 'Transform Figma designs into production-ready React components with proper styling and responsive layouts.',
    source: 'Figma',
    link: '/docs/sources/figma',
  },
  {
    icon: '/img/github logo.webp',
    title: 'Implement GitHub Issues',
    description: 'Turn GitHub issues into working code. ralph-starter reads the issue, understands context, and builds the solution.',
    source: 'GitHub',
    link: '/docs/sources/github',
  },
  {
    icon: '/img/linear.jpeg',
    title: 'Ship Linear Tickets',
    description: 'Connect your Linear workspace and let AI handle the implementation of your engineering tickets.',
    source: 'Linear',
    link: '/docs/sources/linear',
  },
  {
    icon: '/img/notion logo.png',
    title: 'Generate from Notion Specs',
    description: 'Write detailed specs in Notion, then let ralph-starter turn them into fully functional features.',
    source: 'Notion',
    link: '/docs/sources/notion',
  },
];

export default function UseCases(): React.ReactElement {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.2 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className={styles.useCases}>
      <div className={styles.container}>
        <div className={`${styles.content} ${isVisible ? styles.visible : ''}`}>
          <div className={styles.header}>
            <span className={`${styles.sectionLabel} ${styles.animateIn}`}>
              Use Cases
            </span>
            <h2 className={`${styles.title} ${styles.animateIn}`}>
              From spec to shipped
            </h2>
            <p className={`${styles.subtitle} ${styles.animateIn}`}>
              Connect your favorite tools and let AI handle the implementation
            </p>
          </div>

          <div className={styles.casesGrid}>
            {useCases.map((useCase, index) => (
              <Link
                key={useCase.title}
                to={useCase.link}
                className={`${styles.caseCard} ${styles.animateIn}`}
                style={{ transitionDelay: `${0.1 + index * 0.08}s` }}
              >
                <div className={styles.caseHeader}>
                  <img
                    src={useBaseUrl(useCase.icon)}
                    alt={useCase.source}
                    className={styles.caseIcon}
                  />
                  <span className={styles.sourceTag}>{useCase.source}</span>
                </div>
                <h3 className={styles.caseTitle}>{useCase.title}</h3>
                <p className={styles.caseDescription}>{useCase.description}</p>
                <span className={styles.caseLink}>
                  View docs
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={styles.arrowIcon}>
                    <path d="M7 17L17 7M17 7H7M17 7V17" />
                  </svg>
                </span>
              </Link>
            ))}
          </div>

          <div className={`${styles.templatesPromo} ${styles.animateIn}`} style={{ transitionDelay: '0.5s' }}>
            <div className={styles.promoContent}>
              <h3 className={styles.promoTitle}>Need a starting point?</h3>
              <p className={styles.promoText}>
                Browse our collection of ready-to-use project templates
              </p>
            </div>
            <a
              href="https://github.com/multivmlabs/ralph-templates"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.templatesButton}
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className={styles.githubIcon}>
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
              Browse Templates
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={styles.externalIcon}>
                <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
