import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Task, Member } from '../types';

interface KanbanCardProps {
  task: Task;
  member?: Member;
  onClick: () => void;
  draggable?: boolean;
}

const KanbanCard: React.FC<KanbanCardProps> = ({
  task,
  member,
  onClick,
  draggable = true,
}) => {
  const [isDragging, setIsDragging] = useState(false);

  const initials = member?.name
    ? member.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '?';

  const bgColor = member?.avatarColor || '#7C3AED';

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    e.dataTransfer.setData('taskId', task.id);
    e.dataTransfer.effectAllowed = 'move';
    setIsDragging(true);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  return (
    <div
      draggable={draggable}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={onClick}
      style={{ marginBottom: '12px' }}
    >
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{
          opacity: 1,
          y: 0,
          scale: isDragging ? 1.05 : 1,
          boxShadow: isDragging
            ? '0 4px 12px rgba(124, 58, 237, 0.3)'
            : '0 2px 4px rgba(0, 0, 0, 0.1)',
        }}
        exit={{ opacity: 0, y: -20 }}
        whileHover={{ scale: isDragging ? 1.05 : 1.02 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        style={{
          background: '#2D2D44',
          borderRadius: '12px',
          padding: '16px',
          cursor: draggable ? 'grab' : 'pointer',
          transition: 'transform 0.2s, box-shadow 0.2s',
          userSelect: 'none',
        }}
      >
        <div
          style={{
            fontSize: '14px',
            fontWeight: 500,
            color: '#E0E0E0',
            marginBottom: '12px',
            lineHeight: 1.5,
          }}
        >
          {task.title}
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: bgColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px',
              fontWeight: 600,
              color: '#fff',
            }}
          >
            {initials}
          </div>
          <div
            style={{
              fontSize: '12px',
              color: '#9B9BC7',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            {task.remainingHours}h
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default KanbanCard;
