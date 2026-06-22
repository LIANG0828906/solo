import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GameEvent } from '../types';

interface MapPanelProps {
  position: { x: number; y: number };
  currentEvent: GameEvent | null;
  isEventActive: boolean;
  eventStartTime: number | null;
  onMove: (x: number, y: number) => void;
  onChooseOption: (optionId: string) => void;
  onEventTimeout: () => void;
  disabled: boolean;
}

const MAP_SIZE = 5;
const CELL_SIZE = 80;

const MapPanel: React.FC<MapPanelProps> = ({
  position,
  currentEvent,
  isEventActive,
  eventStartTime,
  onMove,
  onChooseOption,
  onEventTimeout,
  disabled,
}) => {
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const timerRef = useRef<number | null>(null);
  const eventIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (isEventActive && eventStartTime && currentEvent) {
      eventIdRef.current = currentEvent.id;
      setTimeLeft(currentEvent.timeLimit);
      setSelectedOption(null);

      const startTime = eventStartTime;
      const duration = currentEvent.timeLimit;

      const updateTimer = () => {
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, duration - elapsed);
        setTimeLeft(remaining);

        if (remaining <= 0) {
          if (timerRef.current) {
            cancelAnimationFrame(timerRef.current);
            timerRef.current = null;
          }
          if (eventIdRef.current === currentEvent.id) {
            onEventTimeout();
          }
          return;
        }

        timerRef.current = requestAnimationFrame(updateTimer);
      };

      timerRef.current = requestAnimationFrame(updateTimer);

      return () => {
        if (timerRef.current) {
          cancelAnimationFrame(timerRef.current);
          timerRef.current = null;
        }
      };
    } else {
      eventIdRef.current = null;
      setTimeLeft(0);
      setSelectedOption(null);
    }
  }, [isEventActive, eventStartTime, currentEvent, onEventTimeout]);

  const canMoveTo = useCallback(
    (x: number, y: number) => {
      if (disabled || isEventActive) return false;
      if (x < 0 || x >= MAP_SIZE || y < 0 || y >= MAP_SIZE) return false;
      const dx = Math.abs(x - position.x);
      const dy = Math.abs(y - position.y);
      return (dx === 1 && dy === 0) || (dx === 0 && dy === 1);
    },
    [position, disabled, isEventActive]
  );

  const handleCellClick = (x: number, y: number) => {
    if (canMoveTo(x, y)) {
      onMove(x, y);
    }
  };

  const handleOptionClick = (optionId: string) => {
    if (selectedOption) return;
    setSelectedOption(optionId);
    onChooseOption(optionId);
  };

  const formatTime = (ms: number) => {
    const seconds = Math.ceil(ms / 1000);
    return seconds.toString();
  };

  const timerProgress = currentEvent ? (timeLeft / currentEvent.timeLimit) * 100 : 0;

  return (
    <div className="map-panel">
      <div className="map-header">
        <h2 className="panel-title">探索地图</h2>
        <div className="position-info">
          当前位置: ({position.x + 1}, {position.y + 1})
        </div>
      </div>

      <div className="map-container">
        <div
          className="map-grid"
          style={{
            width: MAP_SIZE * CELL_SIZE,
            height: MAP_SIZE * CELL_SIZE,
          }}
        >
          {Array.from({ length: MAP_SIZE }).map((_, y) =>
            Array.from({ length: MAP_SIZE }).map((_, x) => {
              const isCurrent = x === position.x && y === position.y;
              const canMove = canMoveTo(x, y);
              return (
                <div
                  key={`${x}-${y}`}
                  className={`map-cell ${isCurrent ? 'current' : ''} ${canMove ? 'movable' : ''}`}
                  style={{
                    left: x * CELL_SIZE,
                    top: y * CELL_SIZE,
                    width: CELL_SIZE,
                    height: CELL_SIZE,
                  }}
                  onClick={() => handleCellClick(x, y)}
                >
                  {isCurrent && <div className="player-marker">🏕️</div>}
                  {canMove && <div className="move-hint">→</div>}
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="map-legend">
        <span>🏕️ 当前位置</span>
        <span>点击相邻格子移动</span>
      </div>

      {currentEvent && (
        <div className="event-modal-overlay">
          <div className="event-modal">
            <div className="event-border-gradient">
              <div className="event-content">
                <div className="event-header">
                  <h3 className="event-title">{currentEvent.title}</h3>
                  <div className="event-timer">
                    <div className="timer-bar">
                      <div
                        className="timer-progress"
                        style={{ width: `${timerProgress}%` }}
                      />
                    </div>
                    <span className="timer-text">{formatTime(timeLeft)}秒</span>
                  </div>
                </div>
                <p className="event-description">{currentEvent.description}</p>
                <div className="event-options">
                  {currentEvent.options.map(option => (
                    <button
                      key={option.id}
                      className={`event-option-btn ${selectedOption === option.id ? 'selected' : ''}`}
                      onClick={() => handleOptionClick(option.id)}
                      disabled={selectedOption !== null}
                    >
                      {option.text}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .map-panel {
          flex: 1;
          display: flex;
          flex-direction: column;
          background-color: #2c1e16;
          border: 2px solid #5d4037;
          border-radius: 6px;
          padding: 16px;
          position: relative;
        }

        .map-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
          border-bottom: 1px solid #5d4037;
          padding-bottom: 8px;
        }

        .panel-title {
          font-size: 20px;
          color: #ffb300;
          margin: 0;
        }

        .position-info {
          color: #f5deb3;
          font-size: 14px;
          background-color: rgba(93, 64, 55, 0.5);
          padding: 4px 12px;
          border-radius: 4px;
        }

        .map-container {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .map-grid {
          position: relative;
          background-color: #1e5631;
          border: 2px solid #3a7d3a;
          border-radius: 4px;
        }

        .map-cell {
          position: absolute;
          border: 1px solid #3a7d3a;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: default;
          transition: all 0.2s ease;
          box-sizing: border-box;
        }

        .map-cell.movable {
          cursor: pointer;
          background-color: rgba(58, 125, 58, 0.3);
        }

        .map-cell.movable:hover {
          background-color: rgba(58, 125, 58, 0.6);
          box-shadow: inset 0 0 10px rgba(255, 179, 0, 0.3);
        }

        .map-cell.current {
          background-color: rgba(255, 179, 0, 0.2);
          box-shadow: inset 0 0 15px rgba(255, 179, 0, 0.4);
        }

        .player-marker {
          font-size: 36px;
          animation: pulse 2s infinite ease-in-out;
        }

        .move-hint {
          position: absolute;
          font-size: 20px;
          color: rgba(255, 179, 0, 0.6);
          animation: pulse 1.5s infinite ease-in-out;
        }

        .map-legend {
          display: flex;
          justify-content: center;
          gap: 24px;
          margin-top: 12px;
          font-size: 12px;
          color: #a89078;
        }

        .event-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          animation: fadeIn 0.2s ease;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .event-modal {
          animation: bounce-in 0.3s ease;
        }

        .event-border-gradient {
          padding: 3px;
          border-radius: 12px;
          background: linear-gradient(135deg, #6a11cb 0%, #2575fc 100%);
        }

        .event-content {
          background-color: #1a2a3a;
          border-radius: 10px;
          padding: 24px;
          width: 450px;
          max-width: 90vw;
        }

        .event-header {
          margin-bottom: 16px;
        }

        .event-title {
          color: #ffb300;
          font-size: 22px;
          margin: 0 0 12px 0;
          text-align: center;
        }

        .event-timer {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .timer-bar {
          flex: 1;
          height: 8px;
          background-color: rgba(255, 255, 255, 0.1);
          border-radius: 4px;
          overflow: hidden;
        }

        .timer-progress {
          height: 100%;
          background: linear-gradient(90deg, #27ae60 0%, #ffb300 50%, #e74c3c 100%);
          border-radius: 4px;
          transition: width 0.1s linear;
        }

        .timer-text {
          color: #f5deb3;
          font-size: 14px;
          font-weight: bold;
          min-width: 50px;
          text-align: right;
        }

        .event-description {
          color: #f5deb3;
          font-size: 15px;
          line-height: 1.6;
          margin-bottom: 20px;
          padding: 12px;
          background-color: rgba(255, 255, 255, 0.05);
          border-radius: 6px;
        }

        .event-options {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .event-option-btn {
          height: 44px;
          padding: 0 16px;
          background-color: #5d4037;
          color: #f5deb3;
          border: 2px solid #7b5b4e;
          border-radius: 6px;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s ease;
          text-align: left;
        }

        .event-option-btn:hover:not(:disabled) {
          background-color: #7b5b4e;
          box-shadow: 0 0 20px rgba(255, 179, 0, 0.5);
          border-color: #ffb300;
        }

        .event-option-btn:active:not(:disabled) {
          background-color: #4e342e;
          transform: scale(0.98);
        }

        .event-option-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .event-option-btn.selected {
          background-color: #ffb300;
          color: #3e2723;
          border-color: #ffb300;
          font-weight: bold;
        }

        @keyframes bounce-in {
          0% {
            transform: scale(0.5);
            opacity: 0;
          }
          50% {
            transform: scale(1.05);
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }

        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.1);
            opacity: 0.8;
          }
        }
      `}</style>
    </div>
  );
};

export default MapPanel;
