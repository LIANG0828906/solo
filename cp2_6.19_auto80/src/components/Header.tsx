import { useEffect, useRef, useState } from 'react';
import { useRiskStore } from '@/store/useRiskStore';
import { exportToCSV, exportToPNG } from '@/utils/export';
import type { RiskLevel } from '@/types';
import styles from './Header.module.css';

const AnimatedNumber = ({ value, color }: { value: number; color: string }) => {
  const [displayValue, setDisplayValue] = useState(value);
  const prevValue = useRef(value);

  useEffect(() => {
    const startValue = prevValue.current;
    const endValue = value;
    const duration = 500;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(startValue + (endValue - startValue) * easeProgress);
      setDisplayValue(current);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
    prevValue.current = value;
  }, [value]);

  return (
    <span className={styles.statNumber} style={{ color }}>
      {displayValue}
    </span>
  );
};

const ExportButton = ({ type, label }: { type: 'csv' | 'png'; label: string }) => {
  const [showCheck, setShowCheck] = useState(false);
  const risks = useRiskStore((state) => state.risks);

  const handleExport = async () => {
    if (showCheck) return;

    if (type === 'csv') {
      exportToCSV(risks);
    } else {
      await exportToPNG('risk-board-container');
    }

    setShowCheck(true);
    setTimeout(() => setShowCheck(false), 1000);
  };

  return (
    <button
      type="button"
      className={`${styles.exportButton} ${showCheck ? styles.exportSuccess : ''}`}
      onClick={handleExport}
    >
      {showCheck ? (
        <svg
          className={styles.checkmark}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
        >
          <path d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        label
      )}
    </button>
  );
};

const Header = () => {
  const risks = useRiskStore((state) => state.risks);

  const counts = {
    high: risks.filter((r) => r.level === 'high').length,
    medium: risks.filter((r) => r.level === 'medium').length,
    low: risks.filter((r) => r.level === 'low').length,
  };

  const levelColors: Record<RiskLevel, string> = {
    high: 'var(--risk-high)',
    medium: 'var(--risk-medium)',
    low: 'var(--risk-low)',
  };

  const levelLabels: Record<RiskLevel, string> = {
    high: '高风险',
    medium: '中风险',
    low: '低风险',
  };

  return (
    <header className={styles.header}>
      <div className={styles.headerContent}>
        <div className={styles.titleSection}>
          <h1 className={styles.title}>项目风险管理看板</h1>
          <span className={styles.totalCount}>共 {risks.length} 条风险</span>
        </div>

        <div className={styles.statsSection}>
          {(['high', 'medium', 'low'] as RiskLevel[]).map((level) => (
            <div key={level} className={styles.statItem}>
              <span className={styles.statLabel}>{levelLabels[level]}</span>
              <AnimatedNumber value={counts[level]} color={levelColors[level]} />
            </div>
          ))}
        </div>

        <div className={styles.exportSection}>
          <ExportButton type="csv" label="导出CSV" />
          <ExportButton type="png" label="导出PNG" />
        </div>
      </div>
    </header>
  );
};

export default Header;
