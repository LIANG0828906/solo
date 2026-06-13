import React, { useRef, useState, useEffect } from 'react';
import type { KanbanCard, Priority } from './types';
import { formatTimeAgo } from './websocket';

interface CardProps {
  card: KanbanCard;
  laneId: string;
  onDoubleClick: (card: KanbanCard) => void;
  onDragStart: (e: React.DragEvent, cardId: string, laneId: string) => void;
  onDragEnd: (e: React.DragEvent) => void;
  isDragging: boolean;
  justMoved: boolean;
}

const priorityColor = (p: Priority): string => {
  switch (p) {
    case 'high': return '#ef4444';
    case 'medium': return '#f59e0b';
    case 'low': return '#10b981';
  }
};

const priorityLabel = (p: Priority): string => {
  switch (p) {
    case 'high': return '高';
    case 'medium': return '中';
    case 'low': return '低';
  }
};

const priorityBgClass = (p: Priority): string => {
  switch (p) {
    case 'high': return 'bg-red-50 text-red-600';
    case 'medium': return 'bg-amber-50 text-amber-600';
    case 'low': return 'bg-emerald-50 text-emerald-600';
  }
};

export const Card: React.FC<CardProps> = ({
  card,
  laneId,
  onDoubleClick,
  onDragStart,
  onDragEnd,
  isDragging,
  justMoved
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const rafRef = useRef<number | null>(null);
  const animStateRef = useRef({
    velocity: { x: 0, y: 0 },
    position: { x: 0, y: 0 },
    target: { x: 0, y: 0 },
    damping: 0.8,
    stiffness: 0.15
  });

  useEffect(() => {
    if (justMoved && !isAnimating) {
      triggerElasticAnimation();
    }
  }, [justMoved]);

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  const triggerElasticAnimation = () => {
    const state = animStateRef.current;
    state.position = { x: 0, y: -8 };
    state.velocity = { x: 0, y: 0 };
    state.target = { x: 0, y: 0 };
    setIsAnimating(true);

    const animate = () => {
      const { position, velocity, target, damping, stiffness } = animStateRef.current;
      
      const dx = target.x - position.x;
      const dy = target.y - position.y;
      
      const ax = dx * stiffness;
      const ay = dy * stiffness;
      
      velocity.x = (velocity.x + ax) * damping;
      velocity.y = (velocity.y + ay) * damping;
      
      position.x += velocity.x;
      position.y += velocity.y;

      if (cardRef.current) {
        cardRef.current.style.transform = `translate(${position.x}px, ${position.y}px) scale(${1 + Math.abs(position.y) * 0.002})`;
      }

      const distance = Math.sqrt(dx * dx + dy * dy);
      const speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);

      if (distance < 0.5 && speed < 0.1) {
        if (cardRef.current) {
          cardRef.current.style.transform = '';
        }
        setIsAnimating(false);
        return;
      }

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);
  };

  const handleDragStart = (e: React.DragEvent) => {
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', JSON.stringify({ cardId: card.id, laneId }));
    }
    onDragStart(e, card.id, laneId);
  };

  const isOverdue = card.dueDate && new Date(card.dueDate) < new Date(new Date().toDateString());

  return (
    <div
      ref={cardRef}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={onDragEnd}
      onDoubleClick={() => onDoubleClick(card)}
      className={`
        relative group bg-white rounded-card shadow-card overflow-hidden cursor-grab active:cursor-grabbing
        transition-transform duration-200 ease-out hover:scale-[1.02] hover:shadow-card-hover
        ${isDragging ? 'card-dragging opacity-50' : ''}
        ${justMoved ? 'animate-elastic-bounce' : ''}
      `}
      style={{
        willChange: 'transform'
      }}
    >
      <div
        className="absolute left-0 top-0 bottom-0 w-1"
        style={{ backgroundColor: priorityColor(card.priority) }}
      />

      <div className="p-3.5 pl-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h4 className="text-sm font-medium text-gray-800 leading-snug flex-1 min-w-0">
            {card.title}
          </h4>
          
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <div className="relative group/avatar">
              <img
                src={card.lastEditorAvatar}
                alt={card.lastEditor}
                className="w-5 h-5 rounded-full border border-white shadow-sm object-cover"
                style={{
                  clipPath: 'circle(50% at 50% 50%)',
                  boxShadow: '0 0 0 1px #ffffff'
                }}
              />
              <div className="absolute right-0 bottom-full mb-1 hidden group-hover/avatar:block z-10">
                <div className="bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                  {card.lastEditor}
                </div>
              </div>
            </div>
            <span className="text-[10px] text-gray-400 font-medium">
              {formatTimeAgo(card.lastEditTime)}
            </span>
          </div>
        </div>

        {card.description && (
          <p className="text-xs text-gray-500 mb-2.5 line-clamp-2 leading-relaxed">
            {card.description}
          </p>
        )}

        <div className="flex items-center gap-2 flex-wrap">
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium ${priorityBgClass(card.priority)}`}>
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: priorityColor(card.priority) }}
            />
            {priorityLabel(card.priority)}
          </span>

          {card.assignee && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-[10px] font-medium">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="7" r="4" />
                <path d="M5 21v-2a4 4 0 0 1 4-4h6a4 4 0 0 1 4 4v2" />
              </svg>
              {card.assignee}
            </span>
          )}

          {card.dueDate && (
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium ${
              isOverdue ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-600'
            }`}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              {card.dueDate}
            </span>
          )}
        </div>

        <div className="absolute top-0 right-0 w-8 h-8 bg-gradient-to-bl from-white/0 via-white/0 to-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
      </div>
    </div>
  );
};

export default Card;
