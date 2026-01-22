import React, { useEffect, useState, useRef } from 'react';
import Link from '@docusaurus/Link';
import useBaseUrl from '@docusaurus/useBaseUrl';
import styles from './styles.module.css';

export default function HeroSection(): React.ReactElement {
  const [scrollY, setScrollY] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const heroRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });

    // Trigger entrance animation
    const timer = setTimeout(() => setIsVisible(true), 100);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(timer);
    };
  }, []);

  return (
    <section ref={heroRef} className={styles.hero}>
      {/* Background images - CSS handles theme switching */}
      <div className={styles.heroBackground}>
        <img
          src={useBaseUrl('/img/bg.jpg')}
          alt=""
          className={`${styles.bgImage} ${styles.bgLight}`}
          style={{ transform: `translateY(${scrollY * 0.3}px)` }}
        />
        <img
          src={useBaseUrl('/img/bgdark.png')}
          alt=""
          className={`${styles.bgImage} ${styles.bgDark}`}
          style={{ transform: `translateY(${scrollY * 0.3}px)` }}
        />
      </div>

      {/* Floating Ralph astronaut with parallax */}
      <div
        className={`${styles.floatingRalph} ${isVisible ? styles.visible : ''}`}
        style={{ transform: `translateY(${scrollY * 0.5}px)` }}
      >
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

        <p className={`${styles.tagline} ${styles.animateIn} ${styles.delay1}`}>
          Connect your tools. Run AI coding loops. Ship faster.
        </p>

        <p className={`${styles.subtitle} ${styles.animateIn} ${styles.delay2}`}>
          Fetch specs from GitHub, Linear, Notion - then let AI agents build it for you
        </p>

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
              <div className={styles.terminalSuccess}>✨ Done! Cost: $0.42 | 3 commits created</div>
            </div>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className={`${styles.buttons} ${styles.animateIn} ${styles.delay4}`}>
          <Link
            className={`${styles.button} ${styles.buttonPrimary}`}
            to="/docs/intro">
            Get Started
          </Link>
          <Link
            className={`${styles.button} ${styles.buttonSecondary}`}
            href="https://github.com/rubenmarcus/ralph-starter">
            View on GitHub
          </Link>
        </div>

        {/* Install command */}
        <div className={`${styles.installCommand} ${styles.animateIn} ${styles.delay4}`}>
          <code>npm install -g ralph-starter</code>
        </div>
      </div>
    </section>
  );
}
