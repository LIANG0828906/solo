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
  selectedIndex,
  onCardSelect,
  onCardDragStart,
  onCardDragEnd,
  disabled = false,
}) => {
  return (
    <div className="p-3 rounded-xl" style={{
      background: 'rgba(26, 26, 46, 0.8)',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(255, 215, 0, 0.2)',
    }}>
      <div className="text-gray-400 text-xs mb-2">手牌 ({cards.length}/10)</div>
      <div className="flex gap-2 overflow-x-auto pb-2" style={{ minHeight: '120px' }}>
        {cards.length === 0 ? (
          <div className="flex items-center justify-center w-full text-gray-500 text-sm">
            没有手牌
          </div>
        ) : (
          cards.map((card, index) => {
            const isPlayable = !disabled && card.cost <= mana;
            return (
              <div key={index} className="flex-shrink-0">
                <CardItem
                  card={card}
                  size="small"
                  isSelected={selectedIndex === index}
                  isPlayable={isPlayable}
                  onClick={() => isPlayable && onCardSelect(index)}
                  onDragStart={(e) => isPlayable && onCardDragStart(index, e)}
                  onDragEnd={onCardDragEnd}
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
