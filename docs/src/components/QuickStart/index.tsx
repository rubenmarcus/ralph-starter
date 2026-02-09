import React, { useEffect, useRef, useState, useCallback } from 'react';
import Link from '@docusaurus/Link';
import styles from './styles.module.css';

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [text]);

  return (
    <button
      className={styles.copyBtn}
      onClick={handleCopy}
      aria-label="Copy to clipboard"
      type="button"
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
  );
}

export default function QuickStart(): React.ReactElement {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsVisible(true);
      },
      { threshold: 0.15 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className={styles.section}>
      <div className={`${styles.container} ${isVisible ? styles.visible : ''}`}>
        <div className={styles.left}>
          <span className={`${styles.label} ${styles.animateIn}`}>Get Started</span>
          <h2 className={`${styles.title} ${styles.animateIn} ${styles.delay1}`}>
            Three steps to<br />autonomous coding
          </h2>
          <p className={`${styles.subtitle} ${styles.animateIn} ${styles.delay1}`}>
            From installation to your first AI-generated code in under a minute.
          </p>
          <Link to="/docs/installation" className={`${styles.ctaLink} ${styles.animateIn} ${styles.delay2}`}>
            Read the full guide →
          </Link>
        </div>

        <div className={`${styles.right} ${styles.animateIn} ${styles.delay2}`}>
          <div className={styles.terminal}>
            <div className={styles.terminalHeader}>
              <span className={`${styles.dot} ${styles.red}`} />
              <span className={`${styles.dot} ${styles.yellow}`} />
              <span className={`${styles.dot} ${styles.green}`} />
            </div>
            <div className={styles.terminalBody}>
              {/* Step 1 */}
              <div className={styles.step}>
                <span className={styles.comment}># 1. Install</span>
                <div className={styles.cmdRow}>
                  <span className={styles.prompt}>$</span>
                  <code className={styles.cmd}>npm install -g ralph-starter</code>
                  <CopyButton text="npm install -g ralph-starter" />
                </div>
              </div>

              {/* Step 2 */}
              <div className={styles.step}>
                <span className={styles.comment}># 2. Configure your project</span>
                <div className={styles.cmdRow}>
                  <span className={styles.prompt}>$</span>
                  <code className={styles.cmd}>ralph-starter init</code>
                  <CopyButton text="ralph-starter init" />
                </div>
                <span className={styles.output}>✓ Created .ralph-starter.yml</span>
              </div>

              {/* Step 3 */}
              <div className={styles.step}>
                <span className={styles.comment}># 3. Run your first loop</span>
                <div className={styles.cmdRow}>
                  <span className={styles.prompt}>$</span>
                  <code className={styles.cmd}>ralph-starter run "build a login page"</code>
                  <CopyButton text='ralph-starter run "build a login page"' />
                </div>
                <span className={styles.output}>→ Loop 1: Analyzing requirements...</span>
                <span className={styles.output}>→ Loop 2: Creating components...</span>
                <span className={styles.outputSuccess}>✓ Done! 2 files created, 1 commit</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
