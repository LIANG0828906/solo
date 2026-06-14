import React, { useState } from 'react';
import CelebrationParticles from './CelebrationParticles';

interface GoalStatusBadgeProps {
  completed: boolean;
  type: 'minutes' | 'pages';
  current: number;
  target: number;
}

const GoalStatusBadge: React.FC<GoalStatusBadgeProps> = ({
  completed,
  type,
  current,
  target,
}) => {
  const [showParticles, setShowParticles] = useState(false);
  const prevCompletedRef = React.useRef(false);

  React.useEffect(() => {
    if (completed && !prevCompletedRef.current) {
      setShowParticles(true);
      setTimeout(() => setShowParticles(false), 1500);
    }
    prevCompletedRef.current = completed;
  }, [completed]);

  const progress = Math.min((current / target) * 100, 100);
  const unit = type === 'minutes' ? '分钟' : '页';
  const tooltip = `${current}/${target} ${unit} · ${progress.toFixed(0)}%`;

  return (
    <div
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      title={tooltip}
    >
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '24px',
          height: '24px',
          borderRadius: '50%',
          backgroundColor: completed
            ? 'rgba(90, 138, 90, 0.15)'
            : 'rgba(184, 84, 80, 0.15)',
          color: completed ? 'var(--color-success)' : 'var(--color-error)',
          fontSize: '14px',
          transition: 'all 0.3s ease',
        }}
      >
        {completed ? '✓' : '⏱'}
      </div>
      {completed && <CelebrationParticles trigger={showParticles} />}
    </div>
  );
};

export default GoalStatusBadge;
