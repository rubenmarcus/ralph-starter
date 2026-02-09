import React, { useEffect, useRef, useState } from 'react';
import Link from '@docusaurus/Link';
import styles from './styles.module.css';

const CATEGORIES = [
  {
    name: 'Development',
    icon: '⚡',
    presets: ['feature', 'tdd-red-green', 'spec-driven', 'refactor'],
  },
  {
    name: 'Debugging',
    icon: '🔍',
    presets: ['debug', 'incident-response', 'code-archaeology'],
  },
  {
    name: 'Review',
    icon: '👁',
    presets: ['review', 'pr-review', 'adversarial-review'],
  },
  {
    name: 'Documentation',
    icon: '📄',
    presets: ['docs', 'documentation-first'],
  },
  {
    name: 'Specialized',
    icon: '🧪',
    presets: ['api-design', 'migration-safety', 'performance-optimization', 'scientific-method'],
  },
];

export default function PresetsShowcase(): React.ReactElement {
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
      <div className={styles.gridBg} />

      <div className={`${styles.container} ${isVisible ? styles.visible : ''}`}>
        <div className={`${styles.header} ${styles.animateIn}`}>
          <span className={styles.label}>Workflow Presets</span>
          <h2 className={`${styles.title} ${styles.animateIn} ${styles.delay1}`}>
            19 Built-in Presets
          </h2>
          <p className={`${styles.subtitle} ${styles.animateIn} ${styles.delay1}`}>
            Pre-configured workflows for every development scenario.
            Skip the setup — just pick a preset and go.
          </p>
        </div>

        <div className={`${styles.grid} ${styles.animateIn} ${styles.delay2}`}>
          {CATEGORIES.map((cat) => (
            <div key={cat.name} className={styles.card}>
              <div className={styles.cardHeader}>
                <span className={styles.cardIcon}>{cat.icon}</span>
                <span className={styles.cardName}>{cat.name}</span>
              </div>
              <div className={styles.presetList}>
                {cat.presets.map((p) => (
                  <span key={p} className={styles.presetTag}>{p}</span>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className={`${styles.demo} ${styles.animateIn} ${styles.delay3}`}>
          <div className={styles.terminal}>
            <div className={styles.terminalHeader}>
              <span className={`${styles.dot} ${styles.red}`}></span>
              <span className={`${styles.dot} ${styles.yellow}`}></span>
              <span className={`${styles.dot} ${styles.green}`}></span>
            </div>
            <div className={styles.terminalBody}>
              <div className={styles.line}>
                <span className={styles.prompt}>$</span>
                <span className={styles.cmd}> ralph-starter run --preset tdd-red-green "add user auth"</span>
              </div>
              <div className={styles.output}>
                <div>→ Using preset: tdd-red-green</div>
                <div>  Max iterations: 50 | Validation: on | Auto-commit: on</div>
                <div>  Strategy: Write failing test → Implement → Refactor</div>
                <div className={styles.divider}></div>
                <div><span className={styles.success}>✓</span> Test: "should register new user" — <span className={styles.red2}>FAIL</span></div>
                <div><span className={styles.success}>✓</span> Implementing auth module...</div>
                <div><span className={styles.success}>✓</span> Test: "should register new user" — <span className={styles.green2}>PASS</span></div>
                <div><span className={styles.success}>✓</span> Committed: "feat: add user registration"</div>
              </div>
            </div>
          </div>
        </div>

        <Link
          className={`${styles.link} ${styles.animateIn} ${styles.delay3}`}
          to="/docs/cli/presets">
          View all 19 presets →
        </Link>
      </div>
    </section>
  );
}
