import React, { useEffect, useRef, useState } from 'react';
import Link from '@docusaurus/Link';
import useBaseUrl from '@docusaurus/useBaseUrl';
import styles from './styles.module.css';

interface Integration {
  name: string;
  logo: string;
  description: string;
}

const integrations: Integration[] = [
  {
    name: 'Figma',
    logo: '/img/figma-logo.svg',
    description: 'Design specs, tokens & assets',
  },
  {
    name: 'GitHub',
    logo: '/img/github logo.webp',
    description: 'Issues, PRs & repository files',
  },
  {
    name: 'Linear',
    logo: '/img/linear.jpeg',
    description: 'Project & issue tracking',
  },
  {
    name: 'Notion',
    logo: '/img/notion logo.png',
    description: 'Pages & databases',
  },
];

function IntegrationCard({ integration, index }: { integration: Integration; index: number }): React.ReactElement {
  const logoSrc = useBaseUrl(integration.logo);
  return (
    <div
      className={`${styles.card} ${styles.animateIn}`}
      style={{ transitionDelay: `${0.2 + index * 0.1}s` }}
    >
      <img
        src={logoSrc}
        alt={integration.name}
        className={styles.cardLogo}
      />
      <div className={styles.cardInfo}>
        <h3 className={styles.cardName}>{integration.name}</h3>
        <p className={styles.cardDescription}>{integration.description}</p>
      </div>
    </div>
  );
}

export default function IntegrationShowcase(): React.ReactElement {
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
    <section ref={sectionRef} className={styles.showcase}>
      <div className={styles.container}>
        <div className={styles.content}>
          <div className={`${styles.textSide} ${isVisible ? styles.visible : ''}`}>
            <p className={`${styles.sectionLabel} ${styles.animateIn}`}>
              Integrations
            </p>
            <h2 className={`${styles.title} ${styles.animateIn}`}>Works With Your Stack</h2>
            <p className={`${styles.subtitle} ${styles.animateIn} ${styles.delay1}`}>
              Pull specs from where your work lives. Connect your favorite tools and let Ralph build from them.
            </p>

            <div className={styles.grid}>
              {integrations.map((integration, index) => (
                <IntegrationCard key={integration.name} integration={integration} index={index} />
              ))}
            </div>

            <div className={`${styles.cta} ${styles.animateIn} ${styles.delay3}`}>
              <Link
                to="https://github.com/multivmlabs/ralph-starter"
                className={styles.ctaLink}
              >
                Contribute on GitHub →
              </Link>
            </div>
          </div>

          <div className={`${styles.imageSide} ${isVisible ? styles.visible : ''}`}>
            <img
              src={useBaseUrl('/img/stack.png')}
              alt="Ralph with integrations"
              className={styles.ralphImage}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
