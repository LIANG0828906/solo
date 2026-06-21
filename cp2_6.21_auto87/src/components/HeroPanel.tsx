import React from 'react';
import type { Unit } from '../types/game';
import './HeroPanel.css';

interface HeroPanelProps {
  hero: Unit | undefined;
  energy: number;
  maxEnergy: number;
  isPlayer: boolean;
  isCurrentTurn: boolean;
}

export const HeroPanel: React.FC<HeroPanelProps> = ({
  hero,
  energy,
  maxEnergy,
  isPlayer,
  isCurrentTurn,
}) => {
  if (!hero) return null;

  const hpPercentage = (hero.hp / hero.maxHp) * 100;

  return (
    <div className={`hero-panel ${isPlayer ? 'player' : 'opponent'} ${isCurrentTurn ? 'active' : ''}`}>
      <div className="hero-avatar">
        <span className="hero-icon">👑</span>
      </div>

      <div className="hero-info">
        <div className="hero-name-row">
          <span className="hero-name">{hero.name}</span>
          {isCurrentTurn && <span className="turn-indicator">行动中</span>}
        </div>

        <div className="hero-hp-bar">
          <div
            className="hero-hp-fill"
            style={{ width: `${hpPercentage}%` }}
          />
          <span className="hero-hp-text">❤️ {hero.hp}/{hero.maxHp}</span>
        </div>

        <div className="hero-stats-row">
          <div className="hero-stat">
            <span className="stat-icon">⚔️</span>
            <span className="stat-value">{hero.attack}</span>
          </div>
          {hero.shield > 0 && (
            <div className="hero-stat">
              <span className="stat-icon">🛡️</span>
              <span className="stat-value">{hero.shield}</span>
            </div>
          )}
          <div className="hero-stat">
            <span className="stat-icon">💎</span>
            <span className="stat-value">{energy}/{maxEnergy}</span>
          </div>
        </div>

        {hero.effects.length > 0 && (
          <div className="hero-effects">
            {hero.effects.map((effect) => (
              <div key={effect.id} className={`hero-effect ${effect.type}`} title={`${effect.value} - 剩余${effect.remainingTurns}回合`}>
                {effect.type === 'weakness' ? '💀' : '🛡️'}
                <span className="effect-duration">{effect.remainingTurns}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
