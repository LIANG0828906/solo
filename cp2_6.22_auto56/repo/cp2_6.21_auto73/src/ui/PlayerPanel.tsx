import { useEffect, useState } from 'react';
import type { Player } from '../game/types';
import './PlayerPanel.css';

interface PlayerPanelProps {
  player: Player;
  isCurrentTurn: boolean;
  isYou: boolean;
  turnTimeLeft?: number;
  isLeft?: boolean;
}

export function PlayerPanel({
  player,
  isCurrentTurn,
  isYou,
  turnTimeLeft = 15,
  isLeft = true,
}: PlayerPanelProps) {
  const [scoreAnimKey, setScoreAnimKey] = useState(0);

  useEffect(() => {
    if (player.score !== 0) {
      setScoreAnimKey((prev) => prev + 1);
    }
  }, [player.score]);

  const getTimerColor = (): string => {
    if (turnTimeLeft > 10) return '#81c784';
    if (turnTimeLeft > 5) return '#ffb74d';
    return '#e57373';
  };

  const timerProgress = (turnTimeLeft / 15) * 100;

  return (
    <div
      className={`player-panel ${isCurrentTurn ? 'panel-active' : ''} ${isLeft ? 'panel-left' : 'panel-right'}`}
      style={{ '--player-color': player.color } as React.CSSProperties}
    >
      <div className="panel-header">
        <div className="player-avatar" style={{ background: player.color }}>
          <span className="avatar-initials">{player.name.slice(-1)}</span>
        </div>
        <div className="player-info">
          <div className="player-name">
            {player.name}
            {isYou && <span className="you-tag">你</span>}
          </div>
          <div className="player-status">
            {isCurrentTurn ? (
              <span className="status-turn">回合中</span>
            ) : (
              <span className="status-waiting">等待中</span>
            )}
          </div>
        </div>
      </div>

      <div className="panel-stats">
        <div className="stat-item">
          <span className="stat-label">得分</span>
          <span key={scoreAnimKey} className="stat-value score-value score-animate">
            {player.score}
          </span>
        </div>
        <div className="stat-item">
          <span className="stat-label">占领</span>
          <span className="stat-value">{player.capturedCells} 格</span>
        </div>
      </div>

      {player.hasSpeedBonus && (
        <div className="speed-bonus">
          <span className="speed-icon">⚡</span>
          <span>加速效果 (可移动2步)</span>
        </div>
      )}

      {isCurrentTurn && (
        <div className="turn-timer">
          <div className="timer-bar-container">
            <div
              className="timer-bar"
              style={{
                width: `${timerProgress}%`,
                background: getTimerColor(),
                transition: 'width 1s linear, background 0.3s ease',
              }}
            />
          </div>
          <div
            className="timer-number"
            style={{ color: getTimerColor(), transition: 'color 0.3s ease' }}
          >
            {turnTimeLeft}s
          </div>
        </div>
      )}

      <div className="pieces-count">
        <span className="pieces-label">剩余棋子</span>
        <div className="pieces-dots">
          {player.pieces.map((piece) => (
            <div
              key={piece.id}
              className="piece-dot"
              style={{ background: player.color }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
