import React, { memo } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRipple } from '@/shared/hooks/useRipple';
import { Card, TAG_COLORS, TAG_LABELS } from '../types';

interface CardItemProps {
  card: Card;
  onSelectCard: (card: Card) => void;
}

const CardItem: React.FC<CardItemProps> = ({ card, onSelectCard }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: card.id,
    data: { card },
  });

  const rippleRef = useRipple<HTMLDivElement>({
    color: 'rgba(155, 89, 182, 0.3)',
  });

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition: 'transform 200ms ease, opacity 200ms ease',
    opacity: isDragging ? 0.8 : 1,
    ...(isDragging && {
      transform: `${CSS.Translate.toString(transform)} scale(1.05)`,
    }),
  };

  const borderColor = card.status === 'adopted' ? TAG_COLORS[card.tag] : 'transparent';

  const handleClick = () => {
    onSelectCard(card);
  };

  const renderStars = (score: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[...Array(5)].map((_, index) => (
          <Star
            key={index}
            size={14}
            className={cn(
              index < score
                ? 'text-yellow-400 fill-yellow-400'
                : 'text-gray-600'
            )}
          />
        ))}
      </div>
    );
  };

  return (
    <div
      ref={(node) => {
        setNodeRef(node);
        if (node) {
          (rippleRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
        }
      }}
      style={{
        ...style,
        borderLeft: `3px solid ${borderColor}`,
      }}
      className={cn(
        'bg-[#2D2D44] rounded-lg p-4 cursor-pointer',
        'transition-all duration-200 hover:shadow-lg hover:shadow-purple-900/20',
        'mb-3 last:mb-0'
      )}
      onClick={handleClick}
      {...listeners}
      {...attributes}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h4 className="font-medium text-white text-sm leading-snug flex-1">
          {card.title}
        </h4>
        <span
          className="text-xs px-2 py-0.5 rounded-full shrink-0"
          style={{
            backgroundColor: `${TAG_COLORS[card.tag]}20`,
            color: TAG_COLORS[card.tag],
          }}
        >
          {TAG_LABELS[card.tag]}
        </span>
      </div>

      <p className="text-gray-400 text-xs line-clamp-2 mb-3 leading-relaxed">
        {card.description}
      </p>

      <div className="flex items-center justify-between">
        {renderStars(card.valueScore)}
        {card.status === 'adopted' && (
          <span
            className="text-xs font-medium"
            style={{ color: TAG_COLORS[card.tag] }}
          >
            已采纳
