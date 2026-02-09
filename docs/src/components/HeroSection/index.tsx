import React, { useEffect, useState, useCallback } from 'react';
import Link from '@docusaurus/Link';
import useBaseUrl from '@docusaurus/useBaseUrl';
import styles from './styles.module.css';

export default function HeroSection(): React.ReactElement {
  const [isVisible, setIsVisible] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText('npx ralph-starter');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API unavailable (e.g. non-HTTPS context)
    }
  }, []);

  return (
    <section className={styles.hero}>
      {/* Grid background */}
      <div className={styles.gridBackground}>
        {/* Horizontal trails on grid rows */}
        <div className={`${styles.trail} ${styles.trailH} ${styles.trailH1}`} />
        <div className={`${styles.trail} ${styles.trailH} ${styles.trailH2}`} />
        <div className={`${styles.trail} ${styles.trailH} ${styles.trailH3}`} />
        {/* Vertical trails on grid columns */}
        <div className={`${styles.trail} ${styles.trailV} ${styles.trailV1}`} />
        <div className={`${styles.trail} ${styles.trailV} ${styles.trailV2}`} />
        <div className={`${styles.trail} ${styles.trailV} ${styles.trailV3}`} />
      </div>

      {/* Ralph astronaut - large, centered behind content */}
      <div className={`${styles.ralphContainer} ${isVisible ? styles.visible : ''}`}>
        <img
          src={useBaseUrl('/img/astronaut-fly.png')}
          alt="Ralph Astronaut"
          className={styles.ralphImage}
        />
      </div>

      <div className={`${styles.heroWrapper} ${isVisible ? styles.visible : ''}`}>
        <div className={styles.heroInner}>
          {/* Left: Text content */}
          <div className={styles.heroContent}>
            <h1 className={`${styles.tagline} ${styles.animateIn} ${styles.delay1}`}>
              Get specs from anywhere.<br />
              Run AI loops<br /> from zero to prod.
            </h1>

            <p className={`${styles.subtitle} ${styles.animateIn} ${styles.delay2}`}>
              Connect your tools, fetch requirements, and let AI agents build production-ready code automatically.
            </p>

            {/* CTA row: button + install command + integrations */}
            <div className={`${styles.ctaRow} ${styles.animateIn} ${styles.delay2}`}>
              <Link
                className={`${styles.button} ${styles.buttonPrimary}`}
                to="/docs/intro">
                Get Started →
              </Link>
              <button
                type="button"
                className={styles.installCommand}
                onClick={handleCopy}
                title="Copy to clipboard">
                <code>npx ralph-starter</code>
                <svg
                  className={styles.copyIcon}
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round">
                  {copied ? (
                    <polyline points="20 6 9 17 4 12" />
                  ) : (
                    <>
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                    </>
                  )}
                </svg>
              </button>
            </div>
          </div>

          {/* Right: Terminal + Integrations */}
          <div className={`${styles.heroVisual} ${styles.animateIn} ${styles.delay3}`}>
            <div className={styles.terminal}>
              <div className={styles.terminalHeader}>
                <span className={`${styles.terminalDot} ${styles.red}`}></span>
                <span className={`${styles.terminalDot} ${styles.yellow}`}></span>
                <span className={`${styles.terminalDot} ${styles.green}`}></span>
              </div>
              <div className={styles.terminalBody}>
                <div className={styles.terminalLine}>
                  <span className={styles.terminalPrompt}>$</span>
                  <span className={styles.terminalCommand}> ralph-starter run &quot;build a todo app&quot; --commit</span>
                </div>
                <div className={styles.terminalOutput}>
                  <div>✓ Loop 1: Analyzing requirements...</div>
                  <div>✓ Loop 2: Creating components...</div>
                  <div>✓ Loop 3: Adding tests...</div>
                  <div className={styles.terminalSuccess}>✓ Done! Cost: $0.42 | 3 commits created</div>
                </div>
              </div>
            </div>

            {/* Integration logos with links */}
            <div className={styles.integrations}>
              <span className={styles.integrationLabel}>Integrations</span>
              <div className={styles.integrationLogos}>
                <Link to="/docs/sources/github" className={styles.integrationLink}>
                  <img
                    src={useBaseUrl('/img/github logo.webp')}
                    alt="GitHub"
                    className={styles.integrationLogo}
                  />
                </Link>
                <Link to="/docs/sources/figma" className={styles.integrationLink}>
                  <img
                    src={useBaseUrl('/img/figma-logo.svg')}
                    alt="Figma"
                    className={styles.integrationLogo}
                  />
                </Link>
                <Link to="/docs/sources/linear" className={styles.integrationLink}>
                  <img
                    src={useBaseUrl('/img/linear.jpeg')}
                    alt="Linear"
                    className={styles.integrationLogo}
                  />
                </Link>
                <Link to="/docs/sources/notion" className={styles.integrationLink}>
                  <img
                    src={useBaseUrl('/img/notion logo.png')}
                    alt="Notion"
                    className={styles.integrationLogo}
                  />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
