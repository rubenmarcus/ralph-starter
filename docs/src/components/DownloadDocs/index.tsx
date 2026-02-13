import type { ReactNode } from 'react';
import styles from './styles.module.css';

export default function DownloadDocs(): ReactNode {
  return (
    <div className={styles.wrapper}>
      <div className={styles.card}>
        <div className={styles.icon}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
        </div>
        <div className={styles.content}>
          <span className={styles.title}>Download full docs</span>
          <span className={styles.subtitle}>All 39 pages in a single file</span>
        </div>
        <div className={styles.buttons}>
          <a
            href="/docs.md"
            download="ralph-starter-docs.md"
            className={styles.button}
          >
            .md
          </a>
          <a
            href="/llms-full.txt"
            download="ralph-starter-docs.txt"
            className={styles.button}
          >
            .txt
          </a>
        </div>
      </div>
    </div>
  );
}
