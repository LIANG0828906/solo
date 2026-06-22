import React from 'react';
import type { Unit } from '../types/game';
import './UnitCard.css';

interface UnitCardProps {
  unit: Unit;
  isSelected?: boolean;
  isTargetable?: boolean;
  onClick?: () => void;
}

export const UnitCard: React.FC<UnitCardProps> = ({
  unit,
  isSelected = false,
  isTargetable = false,
  onClick,
}) => {
  const hpPercentage = (unit.hp / unit.maxHp) * 100;
  const isPlayer = unit.owner === 'player';
  const isHero = unit.type === 'hero';

  return (
    <div
      className={`unit-card ${isPlayer ? 'player' : 'opponent'} ${isHero ? 'hero' : 'minion'} ${isSelected ? 'selected' : ''} ${isTargetable ? 'targetable' : ''}`}
      onClick={onClick}
    >
      {unit.shield > 0 && (
        <div className="shield-ring">
          <span className="shield-value">{unit.shield}</span>
        </div>
      )}

      <div className="unit-icon">{isHero ? '👑' : '⚔️'}</div>

      <div className="unit-name">{unit.name}</div>

      <div className="hp-bar-container">
        <div
          className="hp-bar-fill"
          style={{ width: `${hpPercentage}%` }}
        />
        <span className="hp-text">{unit.hp}/{unit.maxHp}</span>
      </div>

      <div className="unit-stats">
        <div className="stat attack">
          <span className="stat-icon">⚔️</span>
          <span className="stat-value">{unit.attack}</span>
        </div>
      </div>

      {unit.effects.length > 0 && (
        <div className="status-effects">
          {unit.effects.map((effect) => (
            <div key={effect.id} className={`status-effect ${effect.type}`} title={`${effect.value} (${effect.remainingTurns}回合)`}>
              {effect.type === 'weakness' ? '💀' : '🛡️'}
              <span className="effect-turns">{effect.remainingTurns}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
