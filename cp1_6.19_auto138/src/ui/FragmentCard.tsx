import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { StoryFragment } from '../eventBus';
import { TYPE_LABELS } from '../storyData/storyFragment';

interface FragmentCardProps {
  fragment: StoryFragment;
  onDragStart?: (e: React.DragEvent<HTMLDivElement>, fragment: StoryFragment) => void;
  onClick?: () => void;
  isSelected?: boolean;
  compact?: boolean;
}

export const FragmentCard: React.FC<FragmentCardProps> = ({
  fragment,
  onDragStart,
  onClick,
  isSelected = false,
  compact = false,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;

    const handleDragStart = (e: DragEvent) => {
      if (e.dataTransfer) {
        e.dataTransfer.setData('fragmentId', fragment.id);
        e.dataTransfer.effectAllowed = 'move';
      }
    };

    el.addEventListener('dragstart', handleDragStart as EventListener);
    return () => {
      el.removeEventListener('dragstart', handleDragStart as EventListener);
    };
  }, [fragment.id]);

  const handleClick = () => {
    onClick?.();
  };

  return (
    <motion.div
      ref={cardRef}
      draggable
      onClick={handleClick}
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      style={{
        width: compact ? '100%' : 200,
        height: compact ? 'auto' : 100,
        minHeight: compact ? 60 : 100,
        borderRadius: 10,
        backgroundColor: '#FFFFFF',
        border: isSelected ? '2px solid #FF6F61' : '1px solid #E0E0E0',
        position: 'relative',
        overflow: 'hidden',
        cursor: 'grab',
        display: 'flex',
        flexDirection: 'column',
        userSelect: 'none',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
      }}
      onMouseDown={(e) => {
        e.currentTarget.style.transform = 'scale(1.05)';
        e.currentTarget.style.boxShadow = '4px 4px 10px rgba(208, 208, 208, 0.6)';
        e.currentTarget.style.transition = 'all 0.2s ease';
      }}
      onMouseUp={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
        e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.05)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
        e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.05)';
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: 4,
          backgroundColor: fragment.color,
        }}
      />

      <div
        style={{
          display: 'inline-block',
          fontSize: 10,
          color: '#FFFFFF',
          backgroundColor: fragment.color,
          padding: '2px 8px',
          borderRadius: 4,
          margin: '8px 8px 4px 12px',
          alignSelf: 'flex-start',
          fontWeight: 500,
        }}
      >
        {TYPE_LABELS[fragment.type]}
      </div>

      <div
        style={{
          padding: '0 12px 8px 12px',
          fontSize: 13,
          color: '#333333',
          lineHeight: 1.4,
          flex: 1,
          overflow: 'hidden',
          display: '-webkit-box',
          WebkitLineClamp: compact ? 2 : 3,
          WebkitBoxOrient: 'vertical',
          wordBreak: 'break-word',
        }}
      >
        {fragment.content}
      </div>
    </motion.div>
  );
};
