import React, { memo, useRef, useCallback, useEffect, useState } from 'react';
import type { KanbanCard, Priority } from './types';
import { formatTimeAgo } from './websocket';

interface CardProps {
  card: KanbanCard;
  laneId: string;
  onDoubleClick: (card: KanbanCard) => void;
  onDragStart: (e: React.DragEvent, cardId: string, laneId: string) => void;
  onDragEnd: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent, cardId: string, laneId: string) => void;
  onDrop: (e: React.DragEvent, targetCardId: string, targetLaneId: string) => void;
  isDragging?: boolean;
  isDropTarget?: boolean;
  justMoved?: boolean;
}

const PRIORITY_CONFIG: Record<Priority, { bar: string; label: string; text: string; bg: string; dot: string }> = {
  high: {
    bar: 'bg-high-priority',
    label: '高',
    text: 'text-red-700',
    bg: 'bg-red-50',
    dot: 'bg-red-500'
  },
  medium: {
    bar: 'bg-medium-priority',
    label: '中',
    text: 'text-amber-700',
    bg: 'bg-amber-50',
    dot: 'bg-amber-500'
  },
  low: {
    bar: 'bg-low-priority',
    label: '低',
    text: 'text-emerald-700',
    bg: 'bg-emerald-50',
    dot: 'bg-emerald-500'
  }
};

const DAMPING = 0.8;

export const Card: React.FC<CardProps> = memo(function Card({
  card,
  laneId,
  onDoubleClick,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
  isDragging,
  isDropTarget,
  justMoved
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [tick, setTick] = useState(0);
  const [showElastic, setShowElastic] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (justMoved) {
      setShowElastic(true);
      const t = setTimeout(() => setShowElastic(false), 400);
      return () => clearTimeout(t);
    }
  }, [justMoved]);

  const cfg = PRIORITY_CONFIG[card.priority];

  const handleDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onDoubleClick(card);
    },
    [card, onDoubleClick]
  );

  const handleDragStart = useCallback(
    (e: React.DragEvent) => {
      e.stopPropagation();
      onDragStart(e, card.id, laneId);
      requestAnimationFrame(() => {
        if (cardRef.current) {
          cardRef.current.classList.add('card-dragging');
        }
      });
    },
    [card.id, laneId, onDragStart]
  );

  const handleDragEnd = useCallback(
    (e: React.DragEvent) => {
      e.stopPropagation();
      if (cardRef.current) {
        cardRef.current.classList.remove('card-dragging');
      }
      onDragEnd(e);
    },
    [onDragEnd]
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      onDragOver(e, card.id, laneId);
    },
    [card.id, laneId, onDragOver]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      onDrop(e, card.id, laneId);
    },
    [card.id, laneId, onDrop]
  );

  const isOverdue = card.dueDate && new Date(card.dueDate) < new Date(new Date().toDateString());
  const dueDateText = card.dueDate ? new Date(card.dueDate).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }) : '';

  return (
    <div
      ref={cardRef}
      draggable
      onDoubleClick={handleDoubleClick}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className={`
        relative w-full bg-white rounded-card shadow-card overflow-hidden
        cursor-grab active:cursor-grabbing select-none
        transition-all duration-200 ease-out
        hover:scale-[1.02] hover:shadow-card-hover
        ${isDropTarget ? 'card-drop-target' : ''}
        ${showElastic ? 'animate-elastic-bounce' : ''}
      `}
      style={{
        willChange: 'transform',
        contain: 'content',
        transformStyle: 'preserve-3d',
        animationTimingFunction: showElastic
          ? `cubic-bezier(0.68, -${(1 - DAMPING).toFixed(2)}, 0.265, ${DAMPING})`
          : undefined
      }}
    >
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${cfg.bar}`} style={{ width: '4px' }} />

      <div className="pl-3 pr-3 pt-3 pb-2.5">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h4 className="text-sm font-semibold text-gray-800 leading-snug break-words flex-1 line-clamp-2">
            {card.title}
          </h4>

          {card.lastEditorAvatar && card.lastEditTime > 0 && (
            <div className="flex-shrink-0 relative group">
              <img
                src={card.lastEditorAvatar}
                alt={card.lastEditor}
                title={`${card.lastEditor} · ${formatTimeAgo(card.lastEditTime)}`}
                className="w-6 h-6 rounded-full object-cover shadow-sm"
                style={{
                  border: '1px solid #ffffff',
                  clipPath: 'circle(50% at 50% 50%)'
                }}
              />
              <div className="absolute right-7 top-1/2 -translate-y-1/2 bg-gray-800 text-white text-xs py-1 px-2 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 shadow-lg">
                {card.lastEditor} · {formatTimeAgo(card.lastEditTime)}
              </div>
            </div>
          )}
        </div>

        {card.description && (
          <p className="text-xs text-gray-500 mb-2.5 leading-relaxed line-clamp-2 break-words">
            {card.description}
          </p>
        )}

        <div className="flex items-center flex-wrap gap-1.5">
          <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.text}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
            {cfg.label}
          </span>

          {card.assignee && (
            <span className="inline-flex items-center gap-1 text-[11px] text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              {card.assignee}
            </span>
          )}

          {card.dueDate && (
            <span className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full ${
              isOverdue ? 'text-red-600 bg-red-50' : 'text-gray-600 bg-gray-100'
            }`}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              {dueDateText}
              {isOverdue && <span className="ml-0.5">超期</span>}
            </span>
          )}
        </div>
      </div>

      <span style={{ display: 'none' }}>{tick}</span>
    </div>
  );
});

export default Card;
