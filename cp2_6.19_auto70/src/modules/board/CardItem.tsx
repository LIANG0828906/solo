import React, { useState, useRef } from 'react';
import { Clock, Tag as TagIcon } from 'lucide-react';
import type { Card, Tag } from '@/types';
import { formatRelativeTime } from '@/utils/dateUtils';
import { adjustColorBrightness } from '@/utils/colorUtils';

interface CardItemProps {
  card: Card;
  tags: Tag[];
  index: number;
  isDragging: boolean;
  isDragOver: boolean;
  onDragStart: (e: React.DragEvent, id: string) => void;
  onDragEnd: () => void;
  onDragOver: (e: React.DragEvent, id: string) => void;
  onDrop: (e: React.DragEvent) => void;
  onClick: () => void;
  onSelect: (e: React.MouseEvent) => void;
  animationDelay: number;
}

export function CardItem({
  card,
  tags,
  index,
  isDragging,
  isDragOver,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
  onClick,
  onSelect,
  animationDelay,
}: CardItemProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  const cardTags = tags.filter(t => card.tags.includes(t.name));

  const aspectRatioClass = card.aspectRatio === '1:1' ? 'aspect-square' : 'aspect-video';

  return (
    <div
      className={`card-item ${card.selected ? 'selected' : ''} ${isDragging ? 'dragging' : ''} ${isDragOver ? 'drag-over' : ''}`}
      draggable
      onDragStart={(e) => onDragStart(e, card.id)}
      onDragEnd={onDragEnd}
      onDragOver={(e) => onDragOver(e, card.id)}
      onDrop={onDrop}
      onClick={onSelect}
      onDoubleClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      style={{
        animationDelay: `${animationDelay}ms`,
      }}
    >
      <div className={`card-image-wrapper ${aspectRatioClass}`}>
        <img
          ref={imgRef}
          src={card.thumbnailUrl}
          alt={card.caption || '素材卡片'}
          className={`card-image ${isLoaded ? 'loaded' : ''}`}
          onLoad={() => setIsLoaded(true)}
          loading="lazy"
        />
        {!isLoaded && (
          <div className="card-skeleton">
            <div className="skeleton-content animate-pulse" />
          </div>
        )}
        
        <div className="card-overlay">
          <div className="card-time">
            <Clock size={12} />
            <span>{formatRelativeTime(card.createdAt)}</span>
          </div>
        </div>
        
        {card.selected && (
          <div className="card-selection-indicator">
            <div className="selection-check">✓</div>
          </div>
        )}
      </div>
      
      {cardTags.length > 0 && (
        <div className="card-tags">
          {cardTags.map((tag) => (
            <span
              key={tag.id}
              className="card-tag"
              style={{
                backgroundColor: adjustColorBrightness(tag.color, 30),
                color: adjustColorBrightness(tag.color, -40),
              }}
            >
              <TagIcon size={10} />
              {tag.name}
            </span>
          ))}
        </div>
      )}
      
      {card.caption && (
        <div className="card-caption">{card.caption}</div>
      )}
    </div>
  );
}
