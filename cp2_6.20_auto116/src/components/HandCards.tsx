import React from 'react';
import { Card } from '../modules/card/CardTypes';
import { CardItem } from './CardItem';

interface HandCardsProps {
  cards: Card[];
  mana: number;
  maxMana: number;
  selectedIndex: number | null;
  onCardSelect: (index: number) => void;
  onCardDragStart: (index: number, e: React.DragEvent) => void;
  onCardDragEnd: () => void;
  disabled?: boolean;
}

export const HandCards: React.FC<HandCardsProps> = ({
  cards,
  mana,
  maxMana,
  selectedIndex,
  onCardSelect,
  onCardDragStart,
  onCardDragEnd,
  disabled = false,
}) => {
  const handleDragStart = (index: number, e: React.DragEvent) => {
    const card = cards[index];
    if (!card || disabled || card.cost > mana) {
      e.preventDefault();
      return;
    }

    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', JSON.stringify({
      index,
      cost: card.cost,
      cardId: card.id,
    }));

    const ghost = e.currentTarget.cloneNode(true) as HTMLElement;
    ghost.style.opacity = '0.8';
    ghost.style.transform = 'scale(0.8)';
    ghost.style.position = 'absolute';
    ghost.style.top = '-1000px';
    document.body.appendChild(ghost);
    e.dataTransfer.setDragImage(ghost, 40, 50);
    setTimeout(() => document.body.removeChild(ghost), 0);

    onCardDragStart(index, e);
  };

  const handleDragEnd = (e: React.DragEvent) => {
    e.preventDefault();
    onCardDragEnd();
  };

  return (
    <div className="p-3 rounded-xl" style={{
      background: 'rgba(26, 26, 46, 0.8)',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(255, 215, 0, 0.2)',
    }}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-gray-400 text-xs">手牌 ({cards.length}/10)</span>
        <span className="text-gray-500 text-xs">
          费用: <span className="text-blue-400 font-bold">{mana}</span>/{maxMana}
        </span>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-2" style={{ minHeight: '120px' }}>
        {cards.length === 0 ? (
          <div className="flex items-center justify-center w-full text-gray-500 text-sm">
            没有手牌
          </div>
        ) : (
          cards.map((card, index) => {
            const isPlayable = !disabled && card.cost <= mana;
            return (
              <div
                key={index}
                className={`
                  flex-shrink-0 transition-transform duration-200
                  ${isPlayable ? 'cursor-grab hover:-translate-y-2' : 'cursor-not-allowed'}
                `}
              >
                <CardItem
                  card={card}
                  size="small"
                  isSelected={selectedIndex === index}
                  isPlayable={isPlayable}
                  onClick={() => isPlayable && onCardSelect(index)}
                  onDragStart={(e) => handleDragStart(index, e)}
                  onDragEnd={handleDragEnd}
                  draggable={isPlayable}
                />
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
