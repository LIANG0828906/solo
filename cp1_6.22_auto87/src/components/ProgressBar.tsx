import './ProgressBar.css';

interface ProgressBarProps {
  percent: number;
  color?: string;
  height?: number;
}

export default function ProgressBar({ percent, color, height = 12 }: ProgressBarProps) {
  const safePercent = Math.max(0, Math.min(100, percent));

  return (
    <div className="progress-bar-container" style={{ height }}>
      <div
        className="progress-bar-fill"
        style={{
          width: `${safePercent}%`,
          background: color
            ? `linear-gradient(90deg, ${color}, ${color}dd)`
            : 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
        }}
      />
    </div>
  );
}
