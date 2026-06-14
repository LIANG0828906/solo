import React, { useState, useEffect, useRef } from 'react';
import { KeyResult, User } from '../types';
import { okrApi } from '../api';
import { useAppContext } from '../context/AppContext';

interface KeyResultDetailProps {
  kr: KeyResult;
  objectiveId: string;
  users: User[];
  onClose: () => void;
  onUpdate: (updatedKR: KeyResult) => void;
}

const getProgressGradient = (score?: number): string => {
  if (score === undefined) return 'linear-gradient(90deg, #60a5fa, #3b82f6)';
  if (score <= 2) return 'linear-gradient(90deg, #fca5a5, #ef4444)';
  if (score <= 3) return 'linear-gradient(90deg, #fde047, #eab308)';
  return 'linear-gradient(90deg, #86efac, #22c55e)';
};

const formatFullDate = (dateStr: string): string => {
  try {
    const d = new Date(dateStr);
    return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
  } catch {
    return dateStr;
  }
};

const AnimatedProgressBar: React.FC<{
  progress: number;
  score?: number;
}> = ({ progress, score }) => {
  const [displayProgress, setDisplayProgress] = useState(0);
  const prevProgress = useRef(0);

  useEffect(() => {
    const start = prevProgress.current;
    const end = progress;
    const duration = 600;
    const startTime = performance.now();

    const animate = (time: number) => {
      const elapsed = time - startTime;
      const progressRatio = Math.min(elapsed / duration, 1);
      const easeOut = 1 - Math.pow(1 - progressRatio, 3);
      setDisplayProgress(Math.round(start + (end - start) * easeOut));

      if (progressRatio < 1) {
        requestAnimationFrame(animate);
      } else {
        prevProgress.current = end;
      }
    };

    requestAnimationFrame(animate);
  }, [progress]);

  return (
    <div style={{ width: '100%' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: '8px',
          fontSize: '14px',
          fontWeight: 600,
          color: '#374151',
        }}
      >
        <span>完成进度</span>
        <span>{displayProgress}%</span>
      </div>
      <div
        style={{
          width: '100%',
          height: '16px',
          background: '#f3f4f6',
          borderRadius: '8px',
          overflow: 'hidden',
          boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.1)',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${displayProgress}%`,
            background: getProgressGradient(score),
            borderRadius: '8px',
            transition: 'background 0.5s ease',
            boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
          }}
        />
      </div>
    </div>
  );
};

const StarRatingInput: React.FC<{
  value: number;
  onChange: (value: number) => void;
}> = ({ value, onChange }) => {
  const [hoverValue, setHoverValue] = useState<number | null>(null);

  const handleClick = (star: number, half: boolean) => {
    const newValue = half ? star - 0.5 : star;
    onChange(newValue);
  };

  const handleMove = (star: number, e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const half = x < rect.width / 2;
    setHoverValue(half ? star - 0.5 : star);
  };

  const displayValue = hoverValue !== null ? hoverValue : value;

  return (
    <div
      style={{
        display: 'flex',
        gap: '6px',
        alignItems: 'center',
      }}
      onMouseLeave={() => setHoverValue(null)}
    >
      {[1, 2, 3, 4, 5].map((star) => {
        const fillPercent =
          displayValue >= star
            ? 100
            : displayValue >= star - 0.5
              ? 50
              : 0;
        const color =
          displayValue <= 2
            ? '#ef4444'
            : displayValue <= 3
              ? '#eab308'
              : '#22c55e';
        const isAnimating = hoverValue !== null;

        return (
          <div
            key={star}
            style={{
              position: 'relative',
              width: '40px',
              height: '40px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const x = e.clientX - rect.left;
              const half = x < rect.width / 2;
              handleClick(star, half);
            }}
            onMouseMove={(e) => handleMove(star, e)}
          >
            <span
              style={{
                fontSize: '32px',
                color: '#d1d5db',
                lineHeight: 1,
                animation: isAnimating ? `star-twinkle 0.3s ease ${star * 0.05}s` : 'none',
              }}
            >
              ★
            </span>
            <span
              style={{
                position: 'absolute',
                left: 0,
                top: '50%',
                transform: 'translateY(-50%)',
                width: `${fillPercent}%`,
                height: '32px',
                overflow: 'hidden',
                fontSize: '32px',
                color,
                lineHeight: 1,
                transition: 'color 0.3s ease, width 0.2s ease',
              }}
            >
              ★
            </span>
          </div>
        );
      })}
      <span
        style={{
          marginLeft: '8px',
          fontSize: '18px',
          fontWeight: 'bold',
          color:
            displayValue <= 2
              ? '#ef4444'
              : displayValue <= 3
                ? '#eab308'
                : '#22c55e',
        }}
      >
        {displayValue.toFixed(1)}
      </span>
    </div>
  );
};

const KeyResultDetail: React.FC<KeyResultDetailProps> = ({
  kr,
  objectiveId,
  users,
  onClose,
  onUpdate,
}) => {
  const { user } = useAppContext();
  const isManager = user?.role === 'manager';

  const [score, setScore] = useState<number>(kr.score ?? 0);
  const [feedback, setFeedback] = useState<string>(kr.feedback ?? '');
  const [saving, setSaving] = useState(false);

  const owner = users.find((u) => u.id === kr.ownerId);

  const handleSave