import React, { useEffect, useState } from 'react';
import Link from '@docusaurus/Link';
import useBaseUrl from '@docusaurus/useBaseUrl';
import styles from './styles.module.css';

export default function HeroSection(): React.ReactElement {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <section className={styles.hero}>
      {/* Grid background */}
      <div className={styles.gridBackground} />

      {/* Floating Ralph astronaut */}
      <div className={`${styles.floatingRalph} ${isVisible ? styles.visible : ''}`}>
        <img
          src={useBaseUrl('/img/astronaut-fly.png')}
          alt="Ralph Astronaut"
          className={styles.ralphImage}
        />
      </div>

      {/* Content */}
      <div className={`${styles.heroContent} ${isVisible ? styles.visible : ''}`}>
        <div className={`${styles.logoContainer} ${styles.animateIn}`}>
          <img
            src={useBaseUrl('/img/logo.png')}
            alt="Ralph Starter"
            className={styles.logo}
          />
        </div>

        <p className={`${styles.sectionLabel} ${styles.animateIn} ${styles.delay1}`}>
          AI-Powered Development
        </p>

        <h1 className={`${styles.tagline} ${styles.animateIn} ${styles.delay1}`}>
          Get specs from anywhere.<br />
          Run AI loops from zero to prod.
        </h1>

        <p className={`${styles.subtitle} ${styles.animateIn} ${styles.delay2}`}>
          Connect your tools, fetch requirements, and let AI agents build production-ready code automatically.
        </p>

        {/* Integration logos */}
        <div className={`${styles.integrations} ${styles.animateIn} ${styles.delay2}`}>
          <span className={styles.integrationLabel}>Integrations</span>
          <div className={styles.integrationLogos}>
            <img
              src={useBaseUrl('/img/github logo.webp')}
              alt="GitHub"
              className={styles.integrationLogo}
            />
            <img
              src={useBaseUrl('/img/linear.jpeg')}
              alt="Linear"
              className={styles.integrationLogo}
            />
            <img
              src={useBaseUrl('/img/notion logo.png')}
              alt="Notion"
              className={styles.integrationLogo}
            />
          </div>
        </div>

        {/* Terminal preview */}
        <div className={`${styles.terminal} ${styles.animateIn} ${styles.delay3}`}>
          <div className={styles.terminalHeader}>
            <span className={`${styles.terminalDot} ${styles.red}`}></span>
            <span className={`${styles.terminalDot} ${styles.yellow}`}></span>
            <span className={`${styles.terminalDot} ${styles.green}`}></span>
          </div>
          <div className={styles.terminalBody}>
            <div className={styles.terminalLine}>
              <span className={styles.terminalPrompt}>$</span>
              <span className={styles.terminalCommand}> ralph-starter run "build a todo app" --commit</span>
            </div>
            <div className={styles.terminalOutput}>
              <div>✓ Loop 1: Analyzing requirements...</div>
              <div>✓ Loop 2: Creating components...</div>
              <div>✓ Loop 3: Adding tests...</div>
              <div className={styles.terminalSuccess}>✓ Done! Cost: $0.42 | 3 commits created</div>
            </div>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className={`${styles.buttons} ${styles.animateIn} ${styles.delay4}`}>
          <Link
            className={`${styles.button} ${styles.buttonPrimary}`}
            to="/docs/intro">
            Get Started →
          </Link>
          <Link
            className={`${styles.button} ${styles.buttonSecondary}`}
            href="https://github.com/rubenmarcus/ralph-starter">
            View on GitHub
          </Link>
        </div>

        {/* Install command */}
        <div className={`${styles.installCommand} ${styles.animateIn} ${styles.delay5}`}>
          <code>npm install -g ralph-starter</code>
        </div>
      </div>
    </section>
  );
}
