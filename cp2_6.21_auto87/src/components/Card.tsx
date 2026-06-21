import React from 'react';
import type { Card as CardType } from '../types/game';
import './Card.css';

interface CardProps {
  card: CardType;
  isSelected?: boolean;
  isPlayable?: boolean;
  onClick?: () => void;
  index?: number;
  total?: number;
}

export const Card: React.FC<CardProps> = ({
  card,
  isSelected = false,
  isPlayable = true,
  onClick,
  index = 0,
  total = 1,
}) => {
  const getCardTypeColor = () => {
    switch (card.type) {
      case 'attack':
        return '#e74c3c';
      case 'heal':
        return '#2ecc71';
      case 'shield':
        return '#3498db';
      case 'debuff':
        return '#9b59b6';
      case 'utility':
        return '#f1c40f';
      default:
        return '#95a5a6';
    }
  };

  const typeColor = getCardTypeColor();

  const offset = index - (total - 1) / 2;
  const totalAngle = total > 1 ? total * 10 : 0;
  const stepAngle = total > 1 ? totalAngle / (total - 1) : 0;
  const rotate = offset * stepAngle;
  const yOffset = Math.abs(offset) * 6;
  const translateY = -10 + yOffset;
  const zIndex = total - Math.abs(Math.round(offset));

  const fanVars = {
    '--fan-rotate': `${rotate}deg`,
    '--fan-translate-y': `${translateY}px`,
    '--fan-z-index': `${zIndex}`,
    '--card-type-color': typeColor,
  } as React.CSSProperties & { [key: string]: string };

  return (
    <div
      className={`game-card ${isSelected ? 'selected' : ''} ${!isPlayable ? 'unplayable' : ''}`}
      style={{
        ...fanVars,
        borderColor: isSelected ? '#5b8def' : typeColor,
      } as React.CSSProperties & { [key: string]: string }}
      onClick={isPlayable ? onClick : undefined}
    >
      <div className="card-cost">
        <span className="cost-value">{card.cost}</span>
      </div>

      <div className="card-icon">{card.icon}</div>

      <div className="card-name">{card.name}</div>

      <div className="card-type-badge" style={{ backgroundColor: typeColor }}>
        {card.type === 'attack' && '攻击'}
        {card.type === 'heal' && '治疗'}
        {card.type === 'shield' && '护盾'}
        {card.type === 'debuff' && '削弱'}
        {card.type === 'utility' && '辅助'}
      </div>

      <div className="card-description">{card.description}</div>

      {card.effect.duration && (
        <div className="card-duration">
          ⏱️ {card.effect.duration}回合
        </div>
      )}
    </div>
  );
};
