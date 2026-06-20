import React from 'react';

interface ProgressBarProps {
  current: number;
  goal: number;
  label: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ current, goal, label }) => {
  const percentage = goal > 0 ? Math.min((current / goal) * 100, 200) : 0;
  const displayPercentage = goal > 0 ? Math.round((current / goal) * 100) : 0;
  const isOver = displayPercentage > 100;

  return (
    <div className="progress-bar-container">
      <div className="progress-bar-header">
        <span className="progress-bar-label">{label}</span>
        <span className="progress-bar-values">
          {current}/{goal} ({displayPercentage}%)
        </span>
      </div>
      <div className="progress-bar-track">
        <div
          className={`progress-bar-fill${isOver ? ' progress-bar-over' : ''}`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
    </div>
  );
};

export default ProgressBar;
