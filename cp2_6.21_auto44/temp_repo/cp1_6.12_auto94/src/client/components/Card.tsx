import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Card as CardType } from '../../shared/types';

interface CardProps {
  card: CardType;
  onDragStart: (e: React.MouseEvent, cardId: string) => void;
  onVote: (cardId: string) => void;
  onClick: (card: CardType) => void;
  votedByCurrentUser: boolean;
  votesRemaining: number;
  votingActive: boolean;
  isDragging: boolean;
}

const Card: React.FC<CardProps> = ({
  card,
  onDragStart,
  onVote,
  onClick,
  votedByCurrentUser,
  votesRemaining,
  votingActive,
  isDragging,
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.like-btn')) return;
    e.preventDefault();
    onDragStart(e, card.id);
  };

  const handleVoteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (votingActive && votesRemaining > 0 && !votedByCurrentUser) {
      onVote(card.id);
    }
  };

  const handleCardClick = () => {
    onClick(card);
  };

  const handleVoteHover = (show: boolean) => {
    if (votingActive && votesRemaining <= 0 && !votedByCurrentUser) {
      setShowTooltip(show);
    }
  };

  return (
    <div
      ref={cardRef}
      className={`card fade-in ${isDragging ? 'dragging' : ''} ${card.groupId ? 'grouped' : ''}`}
      style={{
        left: card.x,
        top: card.y,
        opacity: 0,
      }}
      onMouseDown={handleMouseDown}
      onClick={handleCardClick}
    >
      <div className="card-header">
        <span className="card-author" style={{ color: card.authorColor }}>
          {card.author}
        </span>
        <span className="card-votes">
          👍 {card.votes}
        </span>
      </div>
      <div className="card-content">{card.content}</div>
      <div className="card-footer">
        <button
          className={`like-btn ${votedByCurrentUser ? 'voted' : ''}`}
          onClick={handleVoteClick}
          onMouseEnter={() => handleVoteHover(true)}
          onMouseLeave={() => handleVoteHover(false)}
          disabled={!votingActive || votedByCurrentUser || votesRemaining <= 0}
        >
          {votedByCurrentUser ? '已点赞' : '点赞'}
        </button>
        {showTooltip && (
          <div className="tooltip show" style={{ bottom: '100%', right: 0, marginBottom: '8px' }}>
            积分不足
          </div>
        )}
      </div>
    </div>
  );
};

export default Card;
