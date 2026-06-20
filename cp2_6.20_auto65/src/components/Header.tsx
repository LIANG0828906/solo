import React from 'react';
import { useSimulationStore } from '../store/useSimulationStore';
import dayjs from 'dayjs';
import './Header.css';

interface HeaderProps {
  className?: string;
}

export const Header: React.FC<HeaderProps> = ({ className }) => {
  const { simulationTime, speed, isRunning, setSpeed, toggleRunning } = useSimulationStore();

  const formatSimulationTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    const startTime = dayjs().startOf('day').add(hours, 'hour').add(minutes, 'minute').add(seconds, 'second');
    return startTime.format('HH:mm:ss');
  };

  const speeds = [0.5, 1, 2, 4];

  return (
    <header className={`app-header ${className || ''}`}>
      <div className="header-content">
        <div className="logo-section">
          <div className="logo-icon">
            <svg width="36" height="36" viewBox="0 0 36 36">
              <rect x="4" y="8" width="28" height="20" rx="2" fill="none" stroke="#3498db" strokeWidth="2" />
              <line x1="18" y1="8" x2="18" y2="28" stroke="#3498db" strokeWidth="1.5" />
              <line x1="4" y1="18" x2="32" y2="18" stroke="#3498db" strokeWidth="1.5" />
              <path d="M24,4 L28,4 L28,8 L32,8 L32,12 L28,12 L28,16 L24,16 L24,12 L20,12 L20,8 L24,8 Z" fill="#f39c12" />
            </svg>
          </div>
          <div className="logo-text">
            <h1 className="app-title">智能码头调度模拟器</h1>
            <p className="app-subtitle">Container Terminal Simulator</p>
          </div>
        </div>

        <div className="controls-section">
          <div className="simulation-clock">
            <span className="clock-icon">🕐</span>
            <span className="clock-time">{formatSimulationTime(simulationTime)}</span>
            <span className="clock-label">模拟时间</span>
          </div>

          <div className="speed-control">
            <span className="speed-label">速度</span>
            <div className="speed-buttons">
              {speeds.map((s) => (
                <button
                  key={s}
                  className={`speed-btn ${speed === s ? 'active' : ''}`}
                  onClick={() => setSpeed(s)}
                >
                  {s}x
                </button>
              ))}
            </div>
            <input
              type="range"
              min="0.5"
              max="4"
              step="0.5"
              value={speed}
              onChange={(e) => setSpeed(parseFloat(e.target.value))}
              className="speed-slider"
            />
          </div>

          <button
            className={`play-btn ${isRunning ? 'running' : ''}`}
            onClick={toggleRunning}
          >
            {isRunning ? (
              <>
                <span className="btn-icon">⏸</span>
                <span className="btn-text">暂停</span>
              </>
            ) : (
              <>
                <span className="btn-icon">▶</span>
                <span className="btn-text">开始</span>
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
