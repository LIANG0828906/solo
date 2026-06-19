import { useEffect, useRef, useState } from 'react';
import { useRiskStore } from '@/store/useRiskStore';
import { exportToCSV, exportToPNG } from '@/utils/export';
import type { RiskLevel } from '@/types';
import { RISK_LEVEL_COLORS } from '@/types';

const AnimatedNumber = ({ value, color }: { value: number; color: string }) => {
  const [displayValue, setDisplayValue] = useState(value);
  const prevValue = useRef(value);
  const rafId = useRef<number | null>(null);

  useEffect(() => {
    if (prevValue.current === value) return;

    const startValue = prevValue.current;
    const endValue = value;
    const duration = 500;
    const startTime = performance.now();

    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutCubic(progress);
      const current = Math.round(startValue + (endValue - startValue) * easedProgress);
      setDisplayValue(current);

      if (progress < 1) {
        rafId.current = requestAnimationFrame(animate);
      }
    };

    rafId.current = requestAnimationFrame(animate);
    prevValue.current = value;

    return () => {
      if (rafId.current !== null) {
        cancelAnimationFrame(rafId.current);
      }
    };
  }, [value]);

  return (
    <span className="app-stat-number" style={{ color }}>
      {displayValue}
    </span>
  );
};

const ExportButton = ({ type, label }: { type: 'csv' | 'png'; label: string }) => {
  const [isExporting, setIsExporting] = useState(false);
  const risks = useRiskStore((state) => state.risks);

  const handleExport = async () => {
    if (isExporting) return;

    setIsExporting(true);

    try {
      if (type === 'csv') {
        exportToCSV(risks);
      } else {
        await exportToPNG('risk-board-container');
      }
    } catch (error) {
      console.error(`Export ${type} failed:`, error);
    }

    setTimeout(() => setIsExporting(false), 1000);
  };

  return (
    <button
      type="button"
      className={`app-export-button ${isExporting ? 'app-export-success' : ''}`}
      onClick={handleExport}
      aria-label={`导出${type.toUpperCase()}`}
      aria-busy={isExporting}
    >
      {isExporting ? (
        <svg
          className="app-checkmark"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
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
    high: RISK_LEVEL_COLORS.high,
    medium: RISK_LEVEL_COLORS.medium,
    low: RISK_LEVEL_COLORS.low,
  };

  const levelLabels: Record<RiskLevel, string> = {
    high: '高风险',
    medium: '中风险',
    low: '低风险',
  };

  return (
    <header className="app-header">
      <div className="app-header-content">
        <div className="app-title-section">
          <h1 className="app-title">项目风险管理看板</h1>
          <span className="app-total-count">共 {risks.length} 条风险</span>
        </div>

        <div className="app-stats-section">
          {(['high', 'medium', 'low'] as RiskLevel[]).map((level) => (
            <div key={level} className="app-stat-item">
              <span className="app-stat-label">{levelLabels[level]}</span>
              <AnimatedNumber value={counts[level]} color={levelColors[level]} />
            </div>
          ))}
        </div>

        <div className="app-export-section">
          <ExportButton type="csv" label="导出CSV" />
          <ExportButton type="png" label="导出PNG" />
        </div>
      </div>
    </header>
  );
};

export default Header;
