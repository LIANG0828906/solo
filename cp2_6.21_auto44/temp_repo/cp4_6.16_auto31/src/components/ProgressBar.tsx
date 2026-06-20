import React, { useMemo } from 'react';
import { useHabitStore } from '../store';

const ProgressBar: React.FC = () => {
  const getGlobalProgress = useHabitStore((state) => state.getGlobalProgress);
  const habits = useHabitStore((state) => state.habits);

  const progress = useMemo(() => {
    return getGlobalProgress();
  }, [getGlobalProgress, habits]);

  return (
    <div className="progress-bar-container">
      <div className="progress-bar-info">
        <span className="progress-bar-label">今日进度</span>
        <span className="progress-bar-percentage">{Math.round(progress.percentage)}%</span>
      </div>
      <div className="progress-bar-track">
        <div
          className="progress-bar-fill"
          style={{ width: `${progress.percentage}%` }}
        />
      </div>
      <div className="progress-bar-count">
        {progress.completed} / {progress.total} 已完成
      </div>

      <style>{`
        .progress-bar-container {
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .progress-bar-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .progress-bar-label {
          font-size: 12px;
          color: var(--color-text-secondary);
          font-weight: 500;
        }

        .progress-bar-percentage {
          font-size: 14px;
          font-weight: 700;
          color: var(--color-text);
        }

        .progress-bar-track {
          width: 100%;
          height: 8px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: var(--radius-full);
          overflow: hidden;
        }

        .progress-bar-fill {
          height: 100%;
          background: linear-gradient(90deg, var(--color-accent), var(--color-highlight));
          border-radius: var(--radius-full);
          transition: width var(--transition-normal);
          position: relative;
        }

        .progress-bar-fill::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(255, 255, 255, 0.3) 50%,
            transparent 100%
          );
          animation: shimmer 2s infinite;
        }

        .progress-bar-count {
          font-size: 11px;
          color: var(--color-text-secondary);
          text-align: right;
        }
      `}</style>
    </div>
  );
};

export default ProgressBar;
