import { useEffect, useState } from 'react';
import styles from '../styles/performanceBar.module.css';

interface PerformanceBarProps {
  fps: number;
  particleCount: number;
}

function PerformanceBar({ fps, particleCount }: PerformanceBarProps): JSX.Element {
  const [, setLowFpsDuration] = useState(0);
  const [showTip, setShowTip] = useState(false);

  useEffect(() => {
    const interval = setInterval((): void => {
      if (fps < 30) {
        setLowFpsDuration((prev): number => {
          const next = prev + 0.25;
          if (next >= 3) {
            setShowTip(true);
          }
          return next;
        });
      } else {
        setLowFpsDuration(0);
        setShowTip(false);
      }
    }, 250);
    return (): void => clearInterval(interval);
  }, [fps]);

  let statusClass = styles.fpsGood;
  if (fps < 30) statusClass = styles.fpsBad;
  else if (fps <= 55) statusClass = styles.fpsMedium;

  return (
    <div className={`${styles.bar} ${statusClass}`}>
      <div className={styles.item}>
        <span className={styles.label}>FPS</span>
        <span className={styles.value}>{fps.toFixed(0)}</span>
      </div>
      <div className={styles.separator} />
      <div className={styles.item}>
        <span className={styles.label}>粒子数</span>
        <span className={styles.value}>{particleCount}</span>
      </div>
      {showTip && (
        <div className={styles.tipBubble}>
          ⚠ FPS较低，建议减少粒子数量至500以下
        </div>
      )}
    </div>
  );
}

export default PerformanceBar;
