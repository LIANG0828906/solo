import './ProgressBar.css';

interface ProgressBarProps {
  current: number;
  total: number;
  height?: number;
}

export function ProgressBar({ current, total, height = 8 }: ProgressBarProps) {
  const percentage = total > 0 ? Math.min(100, (current / total) * 100) : 0;

  return (
    <div className="progress-bar" style={{ height: `${height}px` }}>
      <div
        className="progress-bar__fill"
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}
