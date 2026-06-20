import React, { useEffect, useState } from 'react';
import { X, Play, Pause } from 'lucide-react';
import { formatCountdown } from '../utils';

interface Props {
  startTime: Date;
  onStop: (endTime: Date, durationMin: number) => void;
  onCancel: () => void;
}

const FloatingTimer: React.FC<Props> = ({ startTime, onStop, onCancel }) => {
  const [elapsed, setElapsed] = useState(0);
  const [paused, setPaused] = useState(false);
  const [pausedTotal, setPausedTotal] = useState(0);
  const [pauseStart, setPauseStart] = useState<number | null>(null);

  useEffect(() => {
    if (paused) return;
    const interval = setInterval(() => {
      const now = Date.now();
      const pausedFor = pausedTotal;
      setElapsed(Math.floor((now - startTime.getTime() - pausedFor) / 1000));
    }, 250);
    return () => clearInterval(interval);
  }, [startTime, paused, pausedTotal]);

  const togglePause = () => {
    if (paused) {
      if (pauseStart) {
        setPausedTotal((p) => p + (Date.now() - pauseStart));
        setPauseStart(null);
      }
      setPaused(false);
    } else {
      setPauseStart(Date.now());
      setPaused(true);
    }
  };

  const handleStop = () => {
    const actualElapsed = paused
      ? elapsed
      : Math.floor((Date.now() - startTime.getTime() - pausedTotal) / 1000);
    const minutes = Math.max(1, Math.round(actualElapsed / 60));
    onStop(new Date(), minutes);
  };

  return (
    <div className="floating-timer glass">
      <div className="timer-display">
        <div className="timer-label">学习中</div>
        <div className="timer-time">{formatCountdown(elapsed)}</div>
      </div>
      <div className="timer-controls">
        <button className="ctrl-btn pause" onClick={togglePause}>
          {paused ? <Play size={18} /> : <Pause size={18} />}
        </button>
        <button className="ctrl-btn stop" onClick={handleStop}>
          结束
        </button>
        <button className="ctrl-btn cancel" onClick={onCancel}>
          <X size={16} />
        </button>
      </div>

      <style>{`
        .floating-timer {
          position: fixed;
          top: 20px;
          right: 20px;
          z-index: 1000;
          border-radius: 16px;
          padding: 14px 18px;
          display: flex;
          align-items: center;
          gap: 16px;
          animation: slideIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(40px) scale(0.9);
          }
          to {
            opacity: 1;
            transform: translateX(0) scale(1);
          }
        }
        .timer-label {
          font-size: 11px;
          color: #667eea;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 2px;
        }
        .timer-time {
          font-family: 'JetBrains Mono', monospace;
          font-size: 28px;
          font-weight: 700;
          background: linear-gradient(135deg, #667eea, #764ba2);
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          line-height: 1;
        }
        .timer-controls {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .ctrl-btn {
          border: none;
          border-radius: 10px;
          padding: 8px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
          font-weight: 600;
          font-size: 13px;
        }
        .ctrl-btn.pause {
          background: rgba(245, 158, 11, 0.15);
          color: #f59e0b;
        }
        .ctrl-btn.pause:hover {
          background: rgba(245, 158, 11, 0.25);
        }
        .ctrl-btn.stop {
          background: linear-gradient(135deg, #667eea, #764ba2);
          color: white;
          padding: 8px 14px;
        }
        .ctrl-btn.stop:hover {
          transform: scale(1.05);
        }
        .ctrl-btn.cancel {
          background: rgba(239, 68, 68, 0.1);
          color: #ef4444;
        }
        .ctrl-btn.cancel:hover {
          background: rgba(239, 68, 68, 0.2);
        }
        @media (max-width: 640px) {
          .floating-timer {
            top: auto;
            bottom: 20px;
            right: 16px;
            left: 16px;
            justify-content: space-between;
          }
          .timer-time {
            font-size: 22px;
          }
        }
      `}</style>
    </div>
  );
};

export default FloatingTimer;
