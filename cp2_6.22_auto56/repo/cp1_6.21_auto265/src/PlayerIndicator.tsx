import React, { memo } from 'react';
import type { Player, GameStats } from './types';
import { PLAYER1_CONFIG, PLAYER2_CONFIG } from './types';

interface PlayerIndicatorProps {
  currentPlayer: Player;
  stats: GameStats;
}

const PlayerIndicator: React.FC<PlayerIndicatorProps> = memo(function PlayerIndicator({
  currentPlayer,
  stats,
}) {
  const isP1Active = currentPlayer === 'player1';
  const isP2Active = currentPlayer === 'player2';

  const getSlideClass = (isActive: boolean, isPlayer1: boolean): string => {
    if (isActive) {
      return 'active';
    }
    return isPlayer1 ? 'exit-to-left' : 'exit-to-right';
  };

  const renderPlayer = (config: typeof PLAYER1_CONFIG, isActive: boolean, isPlayer1: boolean) => {
    if (!isActive) return null;
    return (
      <div
        key={config.id}
        className={`indicator-slide ${getSlideClass(isActive, isPlayer1)}`}
      >
        <div className={`avatar ${config.id}`} aria-hidden="true">
          {isPlayer1 ? 'P1' : 'P2'}
        </div>
        <div className="indicator-name">
          <span>{config.name}</span>
          <span className={`color-dot ${config.id}`} aria-hidden="true" />
        </div>
      </div>
    );
  };

  return (
    <div className="top-bar" aria-label="游戏信息栏">
      <div className="scoreboard" role="group" aria-label="比分牌">
        <div className="score-cell">
          <div className="score-label" style={{ color: PLAYER1_CONFIG.color }}>
            {PLAYER1_CONFIG.name}
          </div>
          <div className="score-value" aria-label={`玩家1胜场: ${stats.player1Wins}`}>
            {stats.player1Wins}
          </div>
        </div>
        <div className="score-divider" aria-hidden="true" />
        <div className="score-cell">
          <div className="score-label" style={{ color: PLAYER2_CONFIG.color }}>
            {PLAYER2_CONFIG.name}
          </div>
          <div className="score-value" aria-label={`玩家2胜场: ${stats.player2Wins}`}>
            {stats.player2Wins}
          </div>
        </div>
      </div>

      <div className="indicator-wrap" aria-live="polite" aria-label={`当前回合: ${isP1Active ? PLAYER1_CONFIG.name : PLAYER2_CONFIG.name}`}>
        {renderPlayer(PLAYER1_CONFIG, isP1Active, true)}
        {renderPlayer(PLAYER2_CONFIG, isP2Active, false)}
      </div>
    </div>
  );
});

export default PlayerIndicator;
