import { useState, useRef, useEffect, useCallback } from 'react';
import { Card, GROUPS } from '../../../shared/types';
import CardItem from './CardItem';
import './CardBox.css';

interface CardBoxProps {
  cards: Card[];
  onGroupChange: (cardId: string, group: string) => void;
}

const CARD_HEIGHT = 120;
const GAP = 16;
const VISIBLE_COUNT = 10;
const BUFFER = 3;

const CardBox = ({ cards, onGroupChange }: CardBoxProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);
  const [newCardIds, setNewCardIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (cards.length > 0) {
      const latestId = cards[0].id;
      setNewCardIds(prev => new Set([...prev, latestId]));
      const timer = setTimeout(() => {
        setNewCardIds(prev => {
          const next = new Set(prev);
          next.delete(latestId);
          return next;
        });
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [cards.length > 0 ? cards[0].id : null]);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  const totalHeight = cards.length * (CARD_HEIGHT + GAP);
  
  const startIndex = Math.max(0, Math.floor(scrollTop / (CARD_HEIGHT + GAP)) - BUFFER);
  const endIndex = Math.min(
    cards.length,
    startIndex + VISIBLE_COUNT + BUFFER * 2
  );

  const visibleCards = cards.slice(startIndex, endIndex);
  const offsetY = startIndex * (CARD_HEIGHT + GAP);

  const handleCardClick = (cardId: string) => {
    setExpandedCardId(prev => prev === cardId ? null : cardId);
  };

  return (
    <div className="card-box">
      <div className="card-box-header">
        <h2 className="card-box-title">名片盒</h2>
        <span className="card-count">共 {cards.length} 张</span>
      </div>

      {cards.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">💳</div>
          <p className="empty-text">还没有名片，去交换一些吧！</p>
        </div>
      ) : (
        <div
          className="card-grid-container"
          ref={containerRef}
          onScroll={handleScroll}
        >
          <div
            className="card-grid-spacer"
            style={{ height: totalHeight }}
          >
            <div
              className="card-grid"
              style={{ transform: `translateY(${offsetY}px)` }}
            >
              {visibleCards.map((card) => (
                <CardItem
                  key={card.id}
                  card={card}
                  isExpanded={expandedCardId === card.id}
                  isNew={newCardIds.has(card.id)}
                  groups={GROUPS}
                  onClick={() => handleCardClick(card.id)}
                  onGroupChange={onGroupChange}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CardBox;
