import React, { useEffect, useRef, useState } from 'react';
import Link from '@docusaurus/Link';
import useBaseUrl from '@docusaurus/useBaseUrl';
import styles from './styles.module.css';

interface Provider {
  name: string;
  description: string;
  logo: string;
  highlight?: boolean;
}

const providers: Provider[] = [
  {
    name: 'Anthropic',
    description: 'Claude models',
    logo: '/img/claude-icon.svg',
  },
  {
    name: 'OpenAI',
    description: 'GPT-4 & GPT-4o',
    logo: '/img/openai-icon.svg',
  },
  {
    name: 'OpenRouter',
    description: '100+ models, one API',
    logo: '/img/openrouter-color.svg',
    highlight: true,
  },
];

export default function LLMProviders(): React.ReactElement {
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
    <section ref={sectionRef} className={styles.section}>
      <div className={styles.container}>
        <div className={`${styles.content} ${isVisible ? styles.visible : ''}`}>
          <div className={styles.header}>
            <span className={`${styles.sectionLabel} ${styles.animateIn}`}>
              Use any LLM
            </span>
            <p className={`${styles.subtitle} ${styles.animateIn} ${styles.delay1}`}>
              Power ralph-starter with your preferred AI provider
            </p>
          </div>

          <div className={styles.providersRow}>
            {providers.map((provider, index) => (
              <div
                key={provider.name}
                className={`${styles.provider} ${provider.highlight ? styles.highlighted : ''} ${styles.animateIn}`}
                style={{ transitionDelay: `${0.15 + index * 0.1}s` }}
              >
                <img
                  src={useBaseUrl(provider.logo)}
                  alt={provider.name}
                  className={styles.providerIcon}
                />
                <div className={styles.providerInfo}>
                  <span className={styles.providerName}>{provider.name}</span>
                  <span className={styles.providerDesc}>{provider.description}</span>
                </div>
              </div>
            ))}
          </div>

          <Link
            to="/docs/installation#llm-provider-configuration"
            className={`${styles.configLink} ${styles.animateIn} ${styles.delay2}`}
          >
            Configure providers
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={styles.arrowIcon}>
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}
