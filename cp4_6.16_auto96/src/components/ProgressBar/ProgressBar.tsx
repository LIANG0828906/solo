import './ProgressBar.css';

interface ProgressBarProps {
  value: number;
  max?: number;
  label?: string;
  showPercentage?: boolean;
  color?: 'primary' | 'success' | 'warning' | 'error';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const ProgressBar = ({
  value,
  max = 100,
  label,
  showPercentage = false,
  color = 'primary',
  size = 'md',
  className = '',
}: ProgressBarProps) => {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  const displayPercentage = Math.round(percentage);

  return (
    <div className={`progress-bar-container ${className}`}>
      {(label || showPercentage) && (
        <div className="progress-bar-header">
          {label && <span className="progress-bar-label">{label}</span>}
          {showPercentage && (
            <span className="progress-bar-percentage">{displayPercentage}%</span>
          )}
        </div>
      )}
      <div className={`progress-bar-track progress-bar-${size}`}>
        <div
          className={`progress-bar-fill progress-bar-${color}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

export default ProgressBar;
