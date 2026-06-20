import React from 'react';
import type { GameState } from '../types';
import { getTotalFoundationCards } from '../gameLogic';

interface ResultModalProps {
  gameState: GameState;
  onRestart: () => void;
  onBackToMenu: () => void;
}

const formatTime = (ms: number): string => {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}分${seconds}秒`;
};

export const ResultModal: React.FC<ResultModalProps> = ({
  gameState,
  onRestart,
  onBackToMenu,
}) => {
  const { mode, scores, comboCounts, elapsedTime, winner } = gameState;
  const p1Foundation = getTotalFoundationCards(gameState, 0);
  const p2Foundation = mode === 'dual' ? getTotalFoundationCards(gameState, 1) : 0;

  const p1Total = scores[0] + p1Foundation * 10;
  const p2Total = mode === 'dual' ? scores[1] + p2Foundation * 10 : 0;

  const getTitle = () => {
    if (mode === 'single') {
      return p1Foundation === 52 ? '🎉 恭喜通关！' : '⏰ 时间到！';
    }
    if (winner === 0) return '🏆 玩家1 获胜！';
    if (winner === 1) return '🏆 玩家2 获胜！';
    return '🤝 平局！';
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2 className="modal__title">{getTitle()}</h2>
        
        <div className="modal__scores">
          <div className={`modal__score-row ${winner === 0 ? 'modal__score-row--winner' : ''}`}>
            <div>
              <div className="modal__player-name">玩家 1</div>
              <div className="modal__score-breakdown">
                基础分: {scores[0]} | 回收: {p1Foundation}×10 | 连击: {comboCounts[0]}
              </div>
            </div>
            <div className="modal__score-value">{p1Total}</div>
          </div>
          
          {mode === 'dual' && (
            <div className={`modal__score-row ${winner === 1 ? 'modal__score-row--winner' : ''}`}>
              <div>
                <div className="modal__player-name">玩家 2</div>
                <div className="modal__score-breakdown">
                  基础分: {scores[1]} | 回收: {p2Foundation}×10 | 连击: {comboCounts[1]}
                </div>
              </div>
              <div className="modal__score-value">{p2Total}</div>
            </div>
          )}
        </div>
        
        <div className="modal__time">
          总用时: {formatTime(elapsedTime)}
        </div>
        
        <div className="modal__actions">
          <button className="control-btn" onClick={onBackToMenu}>
            返回菜单
          </button>
          <button className="control-btn" onClick={onRestart}>
            再来一局
          </button>
        </div>
      </div>
    </div>
  );
};
