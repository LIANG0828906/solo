import React, { useState, useRef } from 'react';
import type { Card as CardType } from '../types';

interface CardProps {
  card: CardType;
  isPlayable?: boolean;
  isDragging?: boolean;
  isShaking?: boolean;
  isFaded?: boolean;
  size?: 'normal' | 'small';
  onClick?: () => void;
  onDragStart?: (e: React.DragEvent) => void;
  onDragEnd?: (e: React.DragEvent) => void;
  style?: React.CSSProperties;
}

const CARD_GRADIENTS: Record<string, string> = {
  attack: 'linear-gradient(180deg, #FF6B6B 0%, #CC4444 100%)',
  defense: 'linear-gradient(180deg, #4ECDC4 0%, #3BA3A0 100%)',
  special: 'linear-gradient(180deg, #FFD93D 0%, #CCA800 100%)',
};

const TYPE_ICONS: Record<string, string> = {
  attack: '⚔️',
  defense: '🛡️',
  special: '✨',
};

const TYPE_LABELS: Record<string, string> = {
  attack: '攻击',
  defense: '防御',
  special: '特殊',
};

export const Card: React.FC<CardProps> = ({
  card,
  isPlayable = true,
  isDragging = false,
  isShaking = false,
  isFaded = false,
  size = 'normal',
  onClick,
  onDragStart,
  onDragEnd,
  style,
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const width = size === 'normal' ? 120 : 90;
  const height = size === 'normal' ? 170 : 128;

  return (
    <div
      ref={cardRef}
      className={`card ${isShaking ? 'shake' : ''} ${isFaded ? 'faded' : ''} ${
        !isPlayable ? 'unplayable' : ''
      }`}
      draggable={isPlayable && !isDragging}
      onClick={onClick}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      style={{
        width,
        height,
        background: CARD_GRADIENTS[card.type],
        ...style,
        ...(isDragging ? { opacity: 0.5, cursor: 'grabbing' } : {}),
      }}
    >
      <div className="card-cost">{card.cost}</div>
      <div className="card-type-icon">{TYPE_ICONS[card.type]}</div>
      <div className="card-name">{card.name}</div>
      <div className="card-type-label">{TYPE_LABELS[card.type]}</div>
      <div className="card-value">{card.value}</div>

      {showTooltip && (
        <div className="card-tooltip">
          <div className="tooltip-name">{card.name}</div>
          <div className="tooltip-type">{TYPE_LABELS[card.type]} · 费用 {card.cost}</div>
          <div className="tooltip-desc">{card.description}</div>
        </div>
      )}
    </div>
  );
};
