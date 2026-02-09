import React, { useEffect, useRef, useState } from 'react';
import Link from '@docusaurus/Link';
import styles from './styles.module.css';

export default function AutoMode(): React.ReactElement {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.2 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className={styles.autoMode}>
      <div className={styles.gridBg} />

      <div className={`${styles.container} ${isVisible ? styles.visible : ''}`}>
        <div className={styles.content}>
          <span className={`${styles.badge} ${styles.animateIn}`}>New</span>
          <h2 className={`${styles.title} ${styles.animateIn} ${styles.delay1}`}>
            Auto Mode
          </h2>
          <p className={`${styles.description} ${styles.animateIn} ${styles.delay1}`}>
            Process entire backlogs autonomously. Ralph fetches issues from GitHub or Linear,
            creates branches, implements each task, runs validation, and opens PRs — all without
            human intervention.
          </p>

          <ul className={`${styles.features} ${styles.animateIn} ${styles.delay2}`}>
            <li>
              <span className={styles.check}>✓</span>
              Batch process GitHub issues or Linear tickets
            </li>
            <li>
              <span className={styles.check}>✓</span>
              Automatic branch creation per task
            </li>
            <li>
              <span className={styles.check}>✓</span>
              Built-in validation (tests, lint, build)
            </li>
            <li>
              <span className={styles.check}>✓</span>
              Auto-commit and PR creation
            </li>
            <li>
              <span className={styles.check}>✓</span>
              Dry-run mode to preview before executing
            </li>
            <li>
              <span className={styles.check}>✓</span>
              Cost tracking across all tasks
            </li>
          </ul>

          <Link
            className={`${styles.link} ${styles.animateIn} ${styles.delay3}`}
            to="/docs/cli/auto">
            Learn about auto mode →
          </Link>
        </div>

        <div className={`${styles.visual} ${styles.animateIn} ${styles.delay2}`}>
          <div className={styles.terminal}>
            <div className={styles.terminalHeader}>
              <span className={`${styles.dot} ${styles.red}`}></span>
              <span className={`${styles.dot} ${styles.yellow}`}></span>
              <span className={`${styles.dot} ${styles.green}`}></span>
            </div>
            <div className={styles.terminalBody}>
              <div className={styles.line}>
                <span className={styles.prompt}>$</span>
                <span className={styles.cmd}> ralph-starter auto --source github --label "ready"</span>
              </div>
              <div className={styles.output}>
                <div>→ Fetching issues labeled "ready"...</div>
                <div>→ Found 4 tasks to process</div>
                <div className={styles.divider}></div>
                <div className={styles.taskLine}>
                  <span className={styles.taskStatus}>✓</span> #23 Add user avatar upload
                </div>
                <div className={styles.taskLine}>
                  <span className={styles.taskStatus}>✓</span> #24 Fix pagination on dashboard
                </div>
                <div className={styles.taskLine}>
                  <span className={styles.taskStatusActive}>●</span> #25 Add email notifications...
                </div>
                <div className={styles.taskLine}>
                  <span className={styles.taskStatusPending}>○</span> #26 Update API docs
                </div>
                <div className={styles.divider}></div>
                <div className={styles.success}>✓ 2/4 complete | 2 PRs created | $1.24 total</div>
              </div>
            </div>
          </div>

   
        </div>
      </div>
    </section>
  );
}
