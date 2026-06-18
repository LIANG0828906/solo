import React, { memo } from 'react';
import type { Excerpt } from '../types';

interface ExcerptCardProps {
  excerpt: Excerpt;
  onClick: () => void;
  isDeleting: boolean;
}

export const ExcerptCard = memo(function ExcerptCard({
  excerpt,
  onClick,
  isDeleting,
}: ExcerptCardProps) {
  const truncatedContent =
    excerpt.content.length > 120
      ? excerpt.content.slice(0, 120) + '…'
      : excerpt.content;

  return (
    <div
      onClick={onClick}
      className={`excerpt-card ${isDeleting ? 'excerpt-card--deleting' : ''}`}
      style={{ borderTopColor: excerpt.color }}
    >
      <div className="excerpt-card__content">{truncatedContent}</div>
      <div className="excerpt-card__meta">
        <span className="excerpt-card__book">{excerpt.bookTitle}</span>
        <span className="excerpt-card__author">— {excerpt.author}</span>
      </div>
      <div className="excerpt-card__tags">
        {excerpt.tags.map((tag) => (
          <span key={tag} className="excerpt-card__tag">
            #{tag}
          </span>
        ))}
      </div>
      <div className="excerpt-card__category" style={{ backgroundColor: excerpt.color }}>
        {excerpt.category}
      </div>
    </div>
  );
});
