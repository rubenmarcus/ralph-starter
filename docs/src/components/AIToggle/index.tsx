import React, { useState, useCallback, useEffect } from 'react';
import { useLocation } from '@docusaurus/router';
import styles from './styles.module.css';

/**
 * Resolves the .md URL for the current page.
 * - Homepage: / -> /index.md
 * - Docs pages: /docs/intro -> /docs/intro.md
 * - Other pages: /<page> -> /<page>.md
 */
function getMarkdownUrl(pathname: string): string {
  // Homepage → index.md
  if (pathname === '/' || pathname === '') {
    return '/index.md';
  }

  // Sanitize: reject path traversal and non-path characters
  const clean = pathname
    .replace(/\/$/, '')
    .replace(/\.{2,}/g, '')       // strip ".." sequences
    .replace(/[^a-zA-Z0-9/_-]/g, ''); // allow only safe path chars
  if (!clean) return '/index.md';
  return `${clean}.md`;
}

/**
 * Extract page content from the DOM as plain text / markdown-like format.
 * Used as fallback when the .md file is not available (e.g. in dev mode).
 */
function extractPageMarkdown(): string {
  // Try the article element first (docs pages)
  const article = document.querySelector('article') || document.querySelector('.markdown') || document.querySelector('main');
  if (!article) return '';

  const lines: string[] = [];

  const walk = (node: Node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent?.trim();
      if (text) lines.push(text);
      return;
    }

    if (node.nodeType !== Node.ELEMENT_NODE) return;
    const el = node as HTMLElement;
    const tag = el.tagName.toLowerCase();

    // Skip nav, buttons, etc.
    if (['nav', 'button', 'footer', 'script', 'style'].includes(tag)) return;

    if (tag === 'h1') { lines.push(`\n# ${el.textContent?.trim()}`); return; }
    if (tag === 'h2') { lines.push(`\n## ${el.textContent?.trim()}`); return; }
    if (tag === 'h3') { lines.push(`\n### ${el.textContent?.trim()}`); return; }
    if (tag === 'h4') { lines.push(`\n#### ${el.textContent?.trim()}`); return; }
    if (tag === 'li') { lines.push(`- ${el.textContent?.trim()}`); return; }
    if (tag === 'pre') { lines.push(`\n\`\`\`\n${el.textContent?.trim()}\n\`\`\`\n`); return; }
    if (tag === 'code' && el.parentElement?.tagName.toLowerCase() !== 'pre') {
      lines.push(`\`${el.textContent?.trim()}\``);
      return;
    }
    if (tag === 'p') { lines.push(`\n${el.textContent?.trim()}\n`); return; }
    if (tag === 'blockquote') { lines.push(`\n> ${el.textContent?.trim()}\n`); return; }

    for (const child of el.childNodes) {
      walk(child);
    }
  };

  walk(article);
  return lines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

export default function AIToggle(): React.ReactElement {
  const [mode, setMode] = useState<'human' | 'ai'>('human');
  const [markdown, setMarkdown] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const location = useLocation();

  const mdUrl = getMarkdownUrl(location.pathname);

  const fetchMarkdown = useCallback(async () => {
    setLoading(true);
    setError(null);
    setMarkdown(null);

    const isHtml = (text: string) => {
      const trimmed = text.trim();
      return trimmed.startsWith('<!') || trimmed.startsWith('<html') || trimmed.startsWith('<head');
    };

    try {
      const res = await fetch(mdUrl);
      const contentType = res.headers.get('content-type') || '';

      if (!res.ok || contentType.includes('text/html')) {
        // .md file not found — extract from current page DOM
        setMarkdown(extractPageMarkdown() || 'No markdown available for this page.');
      } else {
        const text = await res.text();
        if (isHtml(text)) {
          // Got HTML instead of markdown — extract from DOM
          setMarkdown(extractPageMarkdown() || 'No markdown available for this page.');
        } else {
          setMarkdown(text);
        }
      }
    } catch {
      // Network error — still try DOM extraction
      const extracted = extractPageMarkdown();
      if (extracted) {
        setMarkdown(extracted);
      } else {
        setError('Could not load markdown for this page.');
      }
    } finally {
      setLoading(false);
    }
  }, [mdUrl]);

  const handleToggle = useCallback((newMode: 'human' | 'ai') => {
    setMode(newMode);
    if (newMode === 'ai') {
      fetchMarkdown();
    }
  }, [fetchMarkdown]);

  const handleCopy = useCallback(async () => {
    if (markdown) {
      await navigator.clipboard.writeText(markdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [markdown]);

  const handleDownload = useCallback(() => {
    if (markdown) {
      const blob = new Blob([markdown], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${location.pathname.replace(/\//g, '-').replace(/^-|-$/g, '') || 'docs'}.md`;
      a.click();
      URL.revokeObjectURL(url);
    }
  }, [markdown, location.pathname]);

  // Close on Escape
  useEffect(() => {
    if (mode !== 'ai') return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMode('human');
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [mode]);

  // Reset when navigating
  useEffect(() => {
    if (mode === 'ai') {
      fetchMarkdown();
    }
  }, [location.pathname, fetchMarkdown]);

  return (
    <>
      {/* Markdown overlay */}
      {mode === 'ai' && (
        <div className={styles.overlay}>
          <div className={styles.overlayHeader}>
            <div className={styles.overlayMeta}>
              <span className={styles.overlayBadge}>LLM-ready</span>
              <code className={styles.overlayUrl}>{mdUrl}</code>
            </div>
            <div className={styles.overlayActions}>
              {markdown && (
                <>
                  <button
                    type="button"
                    className={styles.overlayBtn}
                    onClick={handleCopy}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      {copied ? (
                        <polyline points="20 6 9 17 4 12" />
                      ) : (
                        <>
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                        </>
                      )}
                    </svg>
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                  <button
                    type="button"
                    className={styles.overlayBtn}
                    onClick={handleDownload}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    Download .md
                  </button>
                </>
              )}
              <button
                type="button"
                className={styles.overlayBtn}
                onClick={() => setMode('human')}
              >
                ✕ Close
              </button>
            </div>
          </div>
          <div className={styles.overlayContent}>
            {loading && (
              <div className={styles.loading}>
                <div className={styles.spinner} />
                <span className={styles.loadingText}>Loading markdown...</span>
              </div>
            )}
            {error && (
              <p className={styles.errorText}>
                {error}<br />
                Try <a href="/llms.txt">/llms.txt</a> or <a href="/llms-full.txt">/llms-full.txt</a> for full docs.
              </p>
            )}
            {markdown && (
              <pre className={styles.markdownRaw}>{markdown}</pre>
            )}
          </div>
        </div>
      )}

      {/* Fixed bottom toggle pill */}
      <div className={styles.toggleWrapper}>
        <button
          type="button"
          className={`${styles.toggleBtn} ${mode === 'human' ? styles.toggleBtnActive : ''}`}
          onClick={() => handleToggle('human')}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          Human
        </button>
        <button
          type="button"
          className={`${styles.toggleBtn} ${mode === 'ai' ? styles.toggleBtnActive : ''}`}
          onClick={() => handleToggle('ai')}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="10" rx="2" />
            <circle cx="9" cy="16" r="1" />
            <circle cx="15" cy="16" r="1" />
            <path d="M8 11V7a4 4 0 0 1 8 0v4" />
          </svg>
          AI
        </button>
      </div>
    </>
  );
}
