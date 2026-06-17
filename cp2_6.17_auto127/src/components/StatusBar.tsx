import React, { useMemo, useEffect, useState } from 'react';
import { useGameStore } from '../store';

const TIMER_RADIUS = 26;
const TIMER_CIRCUMFERENCE = 2 * Math.PI * TIMER_RADIUS;

export const StatusBar: React.FC = () => {
  const timeLeft = useGameStore((s) => s.timeLeft);
  const roundDuration = useGameStore((s) => s.roundDuration);
  const score = useGameStore((s) => s.score);
  const lives = useGameStore((s) => s.lives);
  const combo = useGameStore((s) => s.combo);
  const round = useGameStore((s) => s.round);
  const level = useGameStore((s) => s.level);

  const [comboBonusTick, setComboBonusTick] = useState(0);
  const prevComboRef = React.useRef(0);

  useEffect(() => {
    const prev = prevComboRef.current;
    if (combo > prev && combo > 0 && combo % 5 === 0) {
      setComboBonusTick((t) => t + 1);
    }
    prevComboRef.current = combo;
  }, [combo]);

  const timerColor = useMemo(() => {
    const seconds = timeLeft / 1000;
    if (seconds > 3) return '#00FF88';
    if (seconds > 1) return '#FFD700';
    return '#FF3355';
  }, [timeLeft]);

  const progress = useMemo(() => {
    if (roundDuration <= 0) return 0;
    return Math.max(0, Math.min(1, timeLeft / roundDuration));
  }, [timeLeft, roundDuration]);

  const dashOffset = TIMER_CIRCUMFERENCE * (1 - progress);
  const secondsDisplay = (timeLeft / 1000).toFixed(1);

  return (
    <div className="status-bar">
      <div className="status-group">
        <div
          className="timer-wrapper"
          style={{ ['--timer-color' as string]: timerColor }}
        >
          <svg
            className="timer-svg"
            width="60"
            height="60"
            viewBox="0 0 60 60"
          >
            <circle
              className="timer-bg"
              cx="30"
              cy="30"
              r={TIMER_RADIUS}
            />
            <circle
              className="timer-progress"
              cx="30"
              cy="30"
              r={TIMER_RADIUS}
              strokeDasharray={TIMER_CIRCUMFERENCE}
              strokeDashoffset={dashOffset}
            />
          </svg>
          <span className="timer-text">{secondsDisplay}</span>
        </div>

        <div className="status-item">
          <span className="status-label">得分</span>
          <span className="status-value">{score.toLocaleString()}</span>
        </div>
      </div>

      <div className="status-item round-info">
        <span className="status-label">关卡 / 轮次</span>
        <span className="status-value">
          Lv.{level} · R{round}
        </span>
      </div>

      <div className="status-group">
        <div className="status-item">
          <span className="status-label">连击</span>
          <span
            className={`status-value combo ${comboBonusTick > 0 && combo > 0 && combo % 5 === 0 ? 'combo-bonus' : ''}`}
            key={comboBonusTick}
          >
            x{combo}
          </span>
        </div>

        <div className="status-item">
          <span className="status-label">生命</span>
          <div className="lives-container">
            {[0, 1, 2].map((i) => (
              <svg
                key={i}
                className={`heart ${i >= lives ? 'lost' : ''}`}
                viewBox="0 0 24 24"
                fill={i < lives ? '#FF6B6B' : 'none'}
                stroke={i < lives ? '#FF6B6B' : '#666'}
                strokeWidth="2"
              >
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatusBar;
