import { useEffect, useState } from 'react';
import { useCountdown } from '../hooks/useCountdown';
import type { RoomState, TimeStatus } from '../types';

interface Props {
  room: RoomState;
}

const STATUS_COLORS: Record<TimeStatus, string> = {
  green: 'var(--time-green)',
  yellow: 'var(--time-yellow)',
  red: 'var(--time-red)',
};

export default function CountdownTimer({ room }: Props) {
  const { mm, ss, percentage, status } = useCountdown(
    room.remainingSeconds,
    room.durationSeconds
  );
  const [pulseTick, setPulseTick] = useState(0);

  useEffect(() => {
    setPulseTick((t) => t + 1);
  }, [ss]);

  const color = STATUS_COLORS[status];
  const isLocked = room.votingLocked;

  return (
    <div className="countdown-wrapper">
      <div className="countdown-label">
        {isLocked ? '投票已结束' : '剩余时间'}
      </div>
      <div
        className="countdown-time"
        key={pulseTick}
        style={{ color }}
      >
        <span className="countdown-digits">{mm}</span>
        <span className="countdown-colon">:</span>
        <span className="countdown-digits">{ss}</span>
      </div>
      <div className="countdown-bar-bg">
        <div
          className="countdown-bar-fill"
          style={{
            width: `${percentage}%`,
            background: `linear-gradient(90deg, ${color}, ${color}aa)`,
            transition: 'width 0.3s ease',
          }}
        />
      </div>
      <style>{`
        .countdown-wrapper {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
        }
        .countdown-label {
          font-size: 0.8rem;
          color: var(--text-secondary);
          letter-spacing: 1px;
          text-transform: uppercase;
        }
        .countdown-time {
          font-family: 'Courier New', 'Consolas', monospace;
          font-weight: 900;
          font-size: 3rem;
          line-height: 1;
          letter-spacing: 2px;
          text-shadow: 0 0 20px currentColor;
          animation: pulse-scale 0.5s ease-in-out;
        }
        .countdown-digits {
          display: inline-block;
          min-width: 2ch;
        }
        .countdown-colon {
          display: inline-block;
          opacity: 0.7;
          margin: 0 2px;
        }
        .countdown-bar-bg {
          width: 200px;
          height: 6px;
          border-radius: 999px;
          background: var(--bar-bg);
          overflow: hidden;
        }
        .countdown-bar-fill {
          height: 100%;
          border-radius: 999px;
        }
        @media (max-width: 767px) {
          .countdown-time {
            font-size: 2rem;
          }
          .countdown-bar-bg {
            width: 140px;
          }
        }
      `}</style>
    </div>
  );
}
