import React, { memo } from 'react';
import type { CardType } from './types';
import { isRed, getSuitSymbol, getRankDisplay } from './gameLogic';

interface CardProps {
  card: CardType;
  isDragging?: boolean;
  isInvalid?: boolean;
  isHint?: boolean;
  dragPosition?: { x: number; y: number };
  stackIndex?: number;
  onDragStart?: (e: React.MouseEvent | React.TouchEvent, cards: CardType[]) => void;
  style?: React.CSSProperties;
  className?: string;
}

export const Card = memo<CardProps>(({
  card,
  isDragging = false,
  isInvalid = false,
  isHint = false,
  dragPosition,
  stackIndex = 0,
  onDragStart,
  style,
  className = '',
}) => {
  const colorClass = isRed(card.suit) ? 'card--red' : 'card--black';
  const faceDownClass = !card.faceUp ? 'card--face-down' : '';
  const draggingClass = isDragging ? 'card--dragging' : '';
  const invalidClass = isInvalid ? 'card--invalid' : '';
  const hintClass = isHint ? 'card--hint' : '';

  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    if (card.faceUp && onDragStart) {
      onDragStart(e, [card]);
    }
  };

  const cardStyle: React.CSSProperties = {
    ...style,
    zIndex: isDragging ? 1000 : stackIndex + 10,
    transform: dragPosition
      ? `translate(${dragPosition.x}px, ${dragPosition.y}px)`
      : style?.transform,
  };

  return (
    <div
      className={`card ${colorClass} ${faceDownClass} ${draggingClass} ${invalidClass} ${hintClass} ${className}`}
      style={cardStyle}
      onMouseDown={handleMouseDown}
      onTouchStart={handleMouseDown}
    >
      {card.faceUp && (
        <div className="card__content">
          <div className="card__corner">
            <span className="card__rank">{getRankDisplay(card.rank)}</span>
            <span className="card__suit">{getSuitSymbol(card.suit)}</span>
          </div>
          <div className={`card__center ${colorClass}`}>
            {getSuitSymbol(card.suit)}
          </div>
          <div className="card__corner card__corner--bottom">
            <span className="card__rank">{getRankDisplay(card.rank)}</span>
            <span className="card__suit">{getSuitSymbol(card.suit)}</span>
          </div>
        </div>
      )}
    </div>
  );
});

Card.displayName = 'Card';

export interface CardStackProps {
  cards: CardType[];
  startIndex: number;
  isDragging?: boolean;
  isInvalid?: boolean;
  isHint?: boolean;
  dragPosition?: { x: number; y: number };
  onDragStart?: (e: React.MouseEvent | React.TouchEvent, cards: CardType[]) => void;
  className?: string;
}

export const CardStack = memo<CardStackProps>(({
  cards,
  startIndex,
  isDragging = false,
  isInvalid = false,
  isHint = false,
  dragPosition,
  onDragStart,
  className = '',
}) => {
  if (cards.length === 0) return null;

  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    if (cards[0].faceUp && onDragStart) {
      onDragStart(e, cards);
    }
  };

  const offsetY = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--card-offset-y')) || 32;

  return (
    <div className={className} style={{ position: 'relative', width: '100%', height: '100%' }}>
      {cards.map((card, idx) => {
        const isDraggingThis = isDragging && idx === 0;
        const style: React.CSSProperties = {
          top: idx * offsetY,
          left: 0,
        };

        if (isDragging && dragPosition) {
          style.transform = `translate(${dragPosition.x}px, ${dragPosition.y + idx * offsetY}px)`;
          style.zIndex = 1000 + idx;
        }

        return (
          <Card
            key={card.id}
            card={card}
            isDragging={isDraggingThis}
            isInvalid={isInvalid && idx === 0}
            isHint={isHint}
            stackIndex={startIndex + idx}
            style={style}
            onDragStart={idx === 0 ? handleMouseDown : undefined}
          />
        );
      })}
    </div>
  );
});

CardStack.displayName = 'CardStack';
