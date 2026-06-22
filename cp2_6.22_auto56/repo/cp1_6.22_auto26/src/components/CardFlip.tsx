import React, { useState } from 'react';
import type { RecipeCard } from '../types';
import './CardFlip.css';

interface CardFlipProps {
  card: RecipeCard;
  onDelete?: () => void;
  onEdit?: () => void;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
  onDragEnd?: (e: React.DragEvent) => void;
  isDragging?: boolean;
  isNew?: boolean;
}

export function CardFlip({
  card,
  onDelete,
  onEdit,
  draggable,
  onDragStart,
  onDragEnd,
  isDragging,
  isNew,
}: CardFlipProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.card-action')) return;
    setIsFlipped(!isFlipped);
  };

  const renderStars = (count: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i} className={`star ${i < count ? 'filled' : ''}`}>
        ★
      </span>
    ));
  };

  return (
    <div
      className={`card-flip-container ${isFlipped ? 'flipped' : ''} ${isDragging ? 'dragging' : ''} ${isNew ? 'card-enter' : ''}`}
      onClick={handleClick}
      draggable={draggable}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
    >
      <div className="card-inner">
        <div className="card-front">
          <div className="card-image">
            <img src={card.coverImage} alt={card.name} loading="lazy" />
          </div>
          <div className="card-info">
            <h3 className="card-name">{card.name}</h3>
            <div className="card-rating">{renderStars(card.difficulty)}</div>
          </div>
          <div className="card-actions">
            {onEdit && (
              <button className="card-action edit-btn" onClick={(e) => { e.stopPropagation(); onEdit(); }} title="编辑">
                ✎
              </button>
            )}
            {onDelete && (
              <button className="card-action delete-btn" onClick={(e) => { e.stopPropagation(); onDelete(); }} title="删除">
                ✕
              </button>
            )}
          </div>
        </div>
        <div className="card-back">
          <div className="card-back-content">
            <h3 className="card-back-title">{card.name}</h3>
            <div className="card-back-section">
              <span className="card-back-label">来源</span>
              <a href={card.sourceUrl} target="_blank" rel="noopener noreferrer" className="card-back-link" onClick={(e) => e.stopPropagation()}>
                {card.sourceUrl}
              </a>
            </div>
            <div className="card-back-section">
              <span className="card-back-label">标签</span>
              <div className="card-tags">
                {card.tags.map((tag, i) => (
                  <span key={i} className="card-tag">{tag}</span>
                ))}
              </div>
            </div>
            <div className="card-back-section">
              <span className="card-back-label">难度</span>
              <div className="card-rating">{renderStars(card.difficulty)}</div>
            </div>
            <div className="card-back-section">
              <span className="card-back-label">笔记</span>
              <p className="card-notes">{card.notes || '暂无笔记'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
