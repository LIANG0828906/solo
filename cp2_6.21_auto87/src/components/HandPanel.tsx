import React from 'react';
import { Card } from './Card';
import type { Card as CardType } from '../types/game';
import './HandPanel.css';

interface HandPanelProps {
  cards: CardType[];
  selectedCard: CardType | null;
  currentEnergy: number;
  isMyTurn: boolean;
  onCardClick: (card: CardType) => void;
}

export const HandPanel: React.FC<HandPanelProps> = ({
  cards,
  selectedCard,
  currentEnergy,
  isMyTurn,
  onCardClick,
}) => {
  return (
    <div className="hand-panel">
      <div className="hand-cards">
        {cards.map((card, index) => (
          <Card
            key={card.id}
            card={card}
            isSelected={selectedCard?.id === card.id}
            isPlayable={isMyTurn && card.cost <= currentEnergy}
            onClick={() => onCardClick(card)}
            index={index}
            total={cards.length}
          />
        ))}
      </div>
      <div className="hand-info">
        <span className="hand-count">手牌: {cards.length}/7</span>
      </div>
    </div>
  );
};
