import { useState, useEffect } from 'react';
import type { Card } from '../types';

interface FlashCardProps {
  card: Card;
  fading?: boolean;
  onDelete: (card: Card) => void;
}

const FlashCard = ({ card, fading, onDelete }: FlashCardProps) => {
  const [flipped, setFlipped] = useState(false);
  const [scaleRestored, setScaleRestored] = useState(false);

  useEffect(() => {
    if (flipped) {
      const timer = setTimeout(() => {
        setScaleRestored(true);
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setScaleRestored(false);
    }
  }, [flipped]);

  const handleFlip = () => {
    setFlipped(!flipped);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(card);
  };

  return (
    <div className={`flash-card-wrapper ${fading ? 'fading' : ''}`}>
      <div
        className={`flash-card ${flipped ? 'flipped' : ''} ${scaleRestored ? 'scale-restored' : ''}`}
        onClick={handleFlip}
      >
        <div className="flash-card-face flash-card-front">
          <div className="card-question">{card.question}</div>
          <span className="category-tag">{card.category}</span>
        </div>
        <div className="flash-card-face flash-card-back">
          <div className="card-answer">{card.answer}</div>
        </div>
      </div>
      <button className="card-delete-btn" onClick={handleDelete} title="删除卡片">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="3 6 5 6 21 6"></polyline>
          <path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6"></path>
          <path d="M10 11v6"></path>
          <path d="M14 11v6"></path>
        </svg>
      </button>
    </div>
  );
};

export default FlashCard;
