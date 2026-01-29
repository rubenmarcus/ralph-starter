import React, { useState, useEffect } from 'react';
import styles from './styles.module.css';

export default function MachineToggle(): React.ReactElement {
  const [isMachine, setIsMachine] = useState(false);

  useEffect(() => {
    if (isMachine) {
      document.documentElement.classList.add('machine-mode');
    } else {
      document.documentElement.classList.remove('machine-mode');
    }
  }, [isMachine]);

  return (
    <div className={styles.toggle}>
      <button
        className={`${styles.option} ${!isMachine ? styles.active : ''}`}
        onClick={() => setIsMachine(false)}
        aria-pressed={!isMachine}
      >
        <span className={styles.icon}>&#9711;</span>
        HUMAN
      </button>
      <button
        className={`${styles.option} ${isMachine ? styles.active : ''}`}
        onClick={() => setIsMachine(true)}
        aria-pressed={isMachine}
      >
        <span className={styles.icon}>&#9673;</span>
        MACHINE
      </button>
    </div>
  );
}
