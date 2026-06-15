import React from 'react';
import type { GameState } from '../types';
import { getRemainingCards, getTotalFoundationCards } from '../gameLogic';

interface StatusBarProps {
  gameState: GameState;
}

const formatTime = (ms: number): string => {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const milliseconds = Math.floor((ms % 1000) / 10);
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(2, '0')}`;
};

export const StatusBar: React.FC<StatusBarProps> = ({ gameState }) => {
  const { mode, currentPlayer, scores, elapsedTime, moveCount } = gameState;
  const remaining = getRemainingCards(gameState);
  const p1Foundation = getTotalFoundationCards(gameState, 0);
  const p2Foundation = mode === 'dual' ? getTotalFoundationCards(gameState, 1) : 0;

  return (
    <div className="status-bar">
      <div className="status-bar__section">
        {mode === 'dual' && (
          <div className="status-bar__player-indicator">
            <span className="status-bar__player-dot" />
            <span style={{ color: currentPlayer === 0 ? '#60a5fa' : '#f87171', fontWeight: 600 }}>
              玩家 {currentPlayer + 1} 回合
            </span>
          </div>
        )}
        
        <div className="status-bar__item">
          <span className="status-bar__label">玩家1得分</span>
          <span className="status-bar__value status-bar__value--p1">{scores[0]}</span>
        </div>
        
        {mode === 'dual' && (
          <div className="status-bar__item">
            <span className="status-bar__label">玩家2得分</span>
            <span className="status-bar__value status-bar__value--p2">{scores[1]}</span>
          </div>
        )}
      </div>

      <div className="status-bar__section">
        <div className="status-bar__item">
          <span className="status-bar__label">剩余牌</span>
          <span className="status-bar__value">{remaining}</span>
        </div>
        
        <div className="status-bar__item">
          <span className="status-bar__label">已回收</span>
          <span className="status-bar__value">
            {p1Foundation}{mode === 'dual' ? ` / ${p2Foundation}` : ''}
          </span>
        </div>
        
        <div className="status-bar__item">
          <span className="status-bar__label">步数</span>
          <span className="status-bar__value">{moveCount}</span>
        </div>
        
        <div className="status-bar__item">
          <span className="status-bar__label">用时</span>
          <span className="status-bar__value">{formatTime(elapsedTime)}</span>
        </div>
      </div>
    </div>
  );
};
