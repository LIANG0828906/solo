import { useState, useRef, useCallback } from 'react';
import { Clock, Tag as TagIcon, GripVertical, StickyNote } from 'lucide-react';
import type { Card, Tag } from '@/types';
import { formatRelativeTime } from '@/utils/dateUtils';
import { adjustColorBrightness } from '@/utils/colorUtils';

interface CardItemProps {
  card: Card;
  tags: Tag[];
  isDragging: boolean;
  isDragOver: boolean;
  isShiftTarget: boolean;
  onStartDrag: (e: React.MouseEvent, itemId: string, element: HTMLElement) => void;
  onClick: () => void;
  onSelect: (e: React.MouseEvent) => void;
  onCreateNote: (cardId: string) => void;
  animationDelay: number;
}

export function CardItem({
  card,
  tags,
  isDragging,
  isDragOver,
  isShiftTarget,
  onStartDrag,
  onClick,
  onSelect,
  onCreateNote,
  animationDelay,
}: CardItemProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const cardTags = tags.filter(t => card.tags.includes(t.name));

  const aspectRatioClass = card.aspectRatio === '1:1' ? 'aspect-square' : 'aspect-video';

  const handleDragHandleMouseDown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (cardRef.current) {
      onStartDrag(e, card.id, cardRef.current);
    }
  }, [onStartDrag, card.id]);

  return (
    <div
      ref={cardRef}
      data-card-id={card.id}
      className={`card-item ${card.selected ? 'selected' : ''} ${isDragging ? 'dragging' : ''} ${isDragOver ? 'drag-over' : ''} ${isShiftTarget ? 'shift-right' : 'shift-left'}`}
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

      <div className="card-footer">
        <button
          className="card-create-note-btn"
          onClick={(e) => {
            e.stopPropagation();
            onCreateNote(card.id);
          }}
          title="创建文字便签"
        >
          <StickyNote size={14} />
          <span>便签</span>
        </button>
        <div
          className="drag-handle"
          onMouseDown={handleDragHandleMouseDown}
          title="拖拽排序"
        >
          <GripVertical size={16} />
        </div>
      </div>
    </div>
  );
}
