import React, { useEffect, useRef, useState } from 'react';
import Link from '@docusaurus/Link';
import styles from './styles.module.css';

const SKILLS = [
  { name: 'nextjs', desc: 'Next.js App Router patterns', tag: 'frontend' },
  { name: 'testing', desc: 'Jest & Vitest best practices', tag: 'testing' },
  { name: 'prisma', desc: 'Database schema & queries', tag: 'backend' },
  { name: 'tailwind', desc: 'Utility-first CSS patterns', tag: 'styling' },
  { name: 'docker', desc: 'Container configuration', tag: 'devops' },
  { name: 'security', desc: 'OWASP security patterns', tag: 'security' },
];

export default function SkillsShowcase(): React.ReactElement {
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
        <div className={styles.content}>
          <span className={`${styles.badge} ${styles.animateIn}`}>Extensible</span>
          <h2 className={`${styles.title} ${styles.animateIn} ${styles.delay1}`}>
            Agent Skills
          </h2>
          <p className={`${styles.description} ${styles.animateIn} ${styles.delay1}`}>
            Teach your AI agents new tricks. Install community skills or create your own.
            Skills are auto-matched to your project's tech stack.
          </p>

          <ul className={`${styles.features} ${styles.animateIn} ${styles.delay2}`}>
            <li>
              <span className={styles.check}>✓</span>
              Global and per-project skills
            </li>
            <li>
              <span className={styles.check}>✓</span>
              Auto-detect tech stack
            </li>
            <li>
              <span className={styles.check}>✓</span>
              Browse community skills
            </li>
            <li>
              <span className={styles.check}>✓</span>
              Create custom skills
            </li>
          </ul>

          <Link
            className={`${styles.link} ${styles.animateIn} ${styles.delay3}`}
            to="/docs/cli/skill">
            Learn about skills →
          </Link>
        </div>

        <div className={`${styles.visual} ${styles.animateIn} ${styles.delay2}`}>
          <div className={styles.skillGrid}>
            {SKILLS.map((skill) => (
              <div key={skill.name} className={styles.skillCard}>
                <div className={styles.skillHeader}>
                  <span className={styles.skillName}>{skill.name}</span>
                  <span className={styles.skillTag}>{skill.tag}</span>
                </div>
                <p className={styles.skillDesc}>{skill.desc}</p>
              </div>
            ))}
          </div>

          <div className={styles.terminal}>
            <div className={styles.terminalHeader}>
              <span className={`${styles.dot} ${styles.red}`}></span>
              <span className={`${styles.dot} ${styles.yellow}`}></span>
              <span className={`${styles.dot} ${styles.green}`}></span>
            </div>
            <div className={styles.terminalBody}>
              <div className={styles.line}>
                <span className={styles.prompt}>$</span>
                <span className={styles.cmd}> ralph-starter skill add vercel-labs/agent-skills</span>
              </div>
              <div className={styles.output}>
                <div>→ Installing skills from vercel-labs/agent-skills</div>
                <div><span className={styles.success}>✓</span> Added 12 skills to ~/.claude/skills/</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
