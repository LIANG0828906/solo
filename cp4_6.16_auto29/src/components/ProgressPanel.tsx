import { formatDuration, estimateRemainingTime } from '@/utils/time';
import './ProgressPanel.css';

interface ProgressPanelProps {
  currentRow: number;
  totalRows: number;
  activeSeconds: number;
  elapsedSeconds: number;
}

export function ProgressPanel({ currentRow, totalRows, activeSeconds, elapsedSeconds }: ProgressPanelProps) {
  const remainingRows = totalRows - currentRow;
  const estimatedRemaining = estimateRemainingTime(currentRow, totalRows, activeSeconds, elapsedSeconds);
  const isNearCompletion = remainingRows > 0 && remainingRows < 10;
  const isCompleted = currentRow >= totalRows;

  const percentage = totalRows > 0 ? Math.min(100, (currentRow / totalRows) * 100) : 0;

  return (
    <div
      className={`progress-panel ${isNearCompletion ? 'progress-panel--near-complete' : ''} ${
        isCompleted ? 'progress-panel--completed' : ''
      }`}
    >
      <div className="progress-panel__stats">
        <div className="progress-panel__stat">
          <span className="progress-panel__stat-label">当前行</span>
          <span className="progress-panel__stat-value">
            {currentRow} / {totalRows}
          </span>
        </div>
        <div className="progress-panel__stat">
          <span className="progress-panel__stat-label">已用时长</span>
          <span className="progress-panel__stat-value">{formatDuration(elapsedSeconds)}</span>
        </div>
        <div className="progress-panel__stat">
          <span className="progress-panel__stat-label">预计剩余</span>
          <span className="progress-panel__stat-value">
            {isCompleted ? '已完成 🎉' : formatDuration(estimatedRemaining)}
          </span>
        </div>
      </div>
      <div className="progress-panel__bar">
        <div
          className="progress-panel__bar-fill"
          style={{ width: `${percentage}%` }}
        />
      </div>
      {isNearCompletion && (
        <div className="progress-panel__encouragement">
          加油！还差 {remainingRows} 行就完成啦 ✨
        </div>
      )}
    </div>
  );
}
