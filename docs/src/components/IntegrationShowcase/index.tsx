import React, { useEffect, useRef, useState } from 'react';
import Link from '@docusaurus/Link';
import useBaseUrl from '@docusaurus/useBaseUrl';
import styles from './styles.module.css';

interface Integration {
  name: string;
  icon: string;
  description: string;
}

const integrations: Integration[] = [
  {
    name: 'GitHub',
    icon: '⬡',
    description: 'Issues, PRs & repository files',
  },
  {
    name: 'Linear',
    icon: '◇',
    description: 'Project & issue tracking',
  },
  {
    name: 'Notion',
    icon: '▣',
    description: 'Pages & databases',
  },
];

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
                <div
                  key={integration.name}
                  className={`${styles.card} ${styles.animateIn}`}
                  style={{ transitionDelay: `${0.2 + index * 0.1}s` }}
                >
                  <div className={styles.cardIcon}>{integration.icon}</div>
                  <div className={styles.cardInfo}>
                    <h3 className={styles.cardName}>{integration.name}</h3>
                    <p className={styles.cardDescription}>{integration.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className={`${styles.cta} ${styles.animateIn} ${styles.delay3}`}>
              <Link
                to="https://github.com/rubenmarcus/ralph-starter"
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
