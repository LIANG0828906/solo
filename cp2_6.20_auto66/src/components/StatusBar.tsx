import './StatusBar.css';

interface StatusBarProps {
  type: 'health' | 'mana';
  current: number;
  max: number;
  label: string;
  showNumbers?: boolean;
}

function StatusBar({ type, current, max, label, showNumbers = true }: StatusBarProps) {
  const percentage = Math.max(0, Math.min(100, (current / max) * 100));

  return (
    <div className={`status-bar-wrapper ${type}-bar`}>
      <div className="status-bar-label">
        <span>{label}</span>
        {showNumbers && (
          <span className="status-bar-numbers">
            {current}/{max}
          </span>
        )}
      </div>
      <div className="status-bar">
        <div
          className="status-bar-fill"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

export default StatusBar;
