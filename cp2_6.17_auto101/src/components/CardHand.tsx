import React, { useState, useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import { Card, ELEMENT_COLORS, ELEMENT_EMOJI } from '../types';

const CARD_WIDTH = 120;
const CARD_HEIGHT = 180;
const CARD_WIDTH_SMALL = 90;
const CARD_HEIGHT_SMALL = 135;

interface CardItemProps {
  card: Card;
  index: number;
  isDragging: boolean;
  disabled: boolean;
  onDragStart: (cardId: string) => void;
  onDragEnd: () => void;
  cardWidth: number;
  cardHeight: number;
}

const CardItem: React.FC<CardItemProps> = ({
  card,
  index,
  isDragging,
  disabled,
  onDragStart,
  onDragEnd,
  cardWidth,
  cardHeight,
}) => {
  const colors = ELEMENT_COLORS[card.element];
  const emoji = ELEMENT_EMOJI[card.element];
  const [isHovered, setIsHovered] = useState(false);

  const handleDragStart = (e: React.DragEvent) => {
    if (disabled) {
      e.preventDefault();
      return;
    }
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', card.id);
    onDragStart(card.id);
  };

  const handleDragEnd = () => {
    onDragEnd();
  };

  const fontSize = cardWidth === CARD_WIDTH_SMALL ? 0.7 : 1;

  return (
    <div
      className={`card-item ${disabled ? 'card-disabled' : ''} ${
        isDragging ? 'card-dragging' : ''
      }`}
      draggable={!disabled}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        width: `${cardWidth}px`,
        height: `${cardHeight}px`,
        backgroundColor: '#2D1B4E',
        border: `2px solid ${colors.primary}`,
        borderRadius: '12px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: `${8 * fontSize}px`,
        cursor: disabled ? 'not-allowed' : 'grab',
        opacity: disabled ? 0.5 : isDragging ? 0.3 : 1,
        transform: isHovered && !disabled ? 'translateY(-10px) scale(1.05)' : 'none',
        transition: 'transform 0.2s ease, opacity 0.2s ease, box-shadow 0.2s ease',
        boxShadow: isHovered && !disabled
          ? `0 10px 30px rgba(108, 99, 255, 0.4), 0 0 15px ${colors.primary}40`
          : '0 4px 15px rgba(0, 0, 0, 0.3)',
        zIndex: isHovered && !disabled ? 10 : index,
        userSelect: 'none',
        position: 'relative',
      }}
    >
      <div
        className="card-element"
        style={{
          width: `${40 * fontSize}px`,
          height: `${40 * fontSize}px`,
          borderRadius: '50%',
          background: `radial-gradient(circle at 30% 30%, ${colors.secondary}, ${colors.primary})`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: `${24 * fontSize}px`,
          boxShadow: `0 0 10px ${colors.primary}80`,
        }}
      >
        {emoji}
      </div>

      <div
        className="card-stats"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: `${4 * fontSize}px`,
        }}
      >
        <div
          className="card-attack"
          style={{
            fontSize: `${18 * fontSize}px`,
            color: '#FFD700',
            fontWeight: 'bold',
            textShadow: '0 0 8px rgba(255, 215, 0, 0.5)',
          }}
        >
          ⚔️ {card.attack}
        </div>
        <div
          className="card-health"
          style={{
            fontSize: `${18 * fontSize}px`,
            color: '#00BFFF',
            fontWeight: 'bold',
            textShadow: '0 0 8px rgba(0, 191, 255, 0.5)',
          }}
        >
          ❤️ {card.health}
        </div>
      </div>

      <div
        className="card-name"
        style={{
          fontSize: `${12 * fontSize}px`,
          color: '#E0E0E0',
          textAlign: 'center',
          fontWeight: 500,
          padding: `${4 * fontSize}px`,
          backgroundColor: 'rgba(0, 0, 0, 0.3)',
          borderRadius: '6px',
          width: '100%',
        }}
      >
        {card.name}
      </div>

      <div
        className="card-cost"
        style={{
          position: 'absolute',
          top: '-8px',
          right: '-8px',
          width: `${24 * fontSize}px`,
          height: `${24 * fontSize}px`,
          borderRadius: '50%',
          backgroundColor: '#FFD700',
          color: '#1F2833',
          fontSize: `${14 * fontSize}px`,
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 2px 8px rgba(255, 215, 0, 0.6)',
        }}
      >
        2
      </div>
    </div>
  );
};

interface CardHandProps {
  onDragStart: (cardId: string) => void;
  onDragEnd: () => void;
  draggedCardId: string | null;
}

const CardHand: React.FC<CardHandProps> = ({
  onDragStart,
  onDragEnd,
  draggedCardId,
}) => {
  const { hand, playerGold, phase } = useGameStore();
  const [isSmallScreen, setIsSmallScreen] = useState<boolean>(
    typeof window !== 'undefined' ? window.innerWidth < 600 : false
  );

  useEffect(() => {
    const handleResize = () => {
      setIsSmallScreen(window.innerWidth < 600);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const cardWidth = isSmallScreen ? CARD_WIDTH_SMALL : CARD_WIDTH;
  const cardHeight = isSmallScreen ? CARD_HEIGHT_SMALL : CARD_HEIGHT;
  const canAfford = playerGold >= 2;
  const isDisabled = phase !== 'preparation' || !canAfford;

  return (
    <div
      className="card-hand-container"
      style={{
        height: isSmallScreen ? '160px' : '200px',
        backgroundColor: '#12151C',
        borderTop: '2px solid #3A4A5C',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        gap: isSmallScreen ? '12px' : '20px',
        position: 'relative',
      }}
    >
      {hand.length === 0 ? (
        <div
          style={{
            color: '#666',
            fontSize: isSmallScreen ? '14px' : '16px',
          }}
        >
          手牌为空，等待下回合补充...
        </div>
      ) : (
        hand.map((card, index) => (
          <CardItem
            key={card.id}
            card={card}
            index={index}
            isDragging={draggedCardId === card.id}
            disabled={isDisabled}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            cardWidth={cardWidth}
            cardHeight={cardHeight}
          />
        ))
      )}

      {!canAfford && phase === 'preparation' && (
        <div
          className="hand-warning"
          style={{
            position: 'absolute',
            top: '8px',
            left: '50%',
            transform: 'translateX(-50%)',
            color: '#FF6347',
            fontSize: isSmallScreen ? '12px' : '14px',
            fontWeight: 'bold',
          }}
        >
          金币不足！需要 2 金币放置卡牌
        </div>
      )}
    </div>
  );
};

export default CardHand;
