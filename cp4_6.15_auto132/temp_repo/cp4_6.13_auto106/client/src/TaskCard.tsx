import React, { useState, useRef, useCallback } from 'react';
import { Task, TaskPriority } from './types';

interface TaskCardProps {
  task: Task;
  onDelete: (taskId: string) => void;
  onDragStart: (e: React.DragEvent<HTMLDivElement>, taskId: string) => void;
  onDragEnd: (e: React.DragEvent<HTMLDivElement>) => void;
  isTouchDragging?: boolean;
}

const priorityConfig: Record<TaskPriority, { label: string; bg: string; color: string }> = {
  high: { label: '高', bg: '#ef4444', color: '#ffffff' },
  medium: { label: '中', bg: '#f59e0b', color: '#1f2937' },
  low: { label: '低', bg: '#22c55e', color: '#ffffff' },
};

const cardBaseStyle: React.CSSProperties = {
  background: '#2a2a3e',
  borderRadius: '8px',
  padding: '14px',
  marginBottom: '12px',
  cursor: 'grab',
  position: 'relative',
  userSelect: 'none',
  touchAction: 'none',
};

const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onDelete,
  onDragStart,
  onDragEnd,
  isTouchDragging = false,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletePhase, setDeletePhase] = useState<0 | 1 | 2>(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const priority = priorityConfig[task.priority];

  const handleDelete = useCallback(() => {
    if (isDeleting) return;
    setIsDeleting(true);
    setDeletePhase(1);
    setTimeout(() => {
      setDeletePhase(2);
    }, 150);
    setTimeout(() => {
      onDelete(task.id);
    }, 320);
  }, [isDeleting, onDelete, task.id]);

  const handleDragStart = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      setIsDragging(true);
      if (cardRef.current) {
        try {
          const rect = cardRef.current.getBoundingClientRect();
          const ghost = cardRef.current.cloneNode(true) as HTMLElement;
          ghost.classList.add('dragging-ghost');
          ghost.style.width = `${rect.width}px`;
          ghost.style.height = `${rect.height}px`;
          ghost.style.background = '#2a2a3e';
          ghost.style.top = '-10000px';
          ghost.style.left = '-10000px';
          document.body.appendChild(ghost);
          e.dataTransfer.setDragImage(ghost, rect.width / 2, rect.height / 2);
          setTimeout(() => {
            document.body.removeChild(ghost);
          }, 0);
        } catch {
          // Fallback: default drag image
        }
      }
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', task.id);
      onDragStart(e, task.id);
    },
    [onDragStart, task.id]
  );

  const handleDragEnd = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      setIsDragging(false);
      onDragEnd(e);
    },
    [onDragEnd]
  );

  let cardScale = 1;
  let cardOpacity = 1;
  if (isDeleting) {
    if (deletePhase === 1) {
      cardScale = 0.6;
      cardOpacity = 0.7;
    } else if (deletePhase === 2) {
      cardScale = 0;
      cardOpacity = 0;
    }
  } else if (isDragging || isTouchDragging) {
    cardScale = 0.96;
    cardOpacity = 0.35;
  } else if (isHovered) {
    cardScale = 1;
  }

  return (
    <div
      ref={cardRef}
      className={isTouchDragging ? 'touch-dragging-source' : ''}
      draggable={!isDeleting}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        ...cardBaseStyle,
        transform: `translateY(${isHovered && !isDragging && !isDeleting && !isTouchDragging ? -2 : 0}px) scale(${cardScale}) rotate(${
          isDragging ? 3 : 0
        }deg)`,
        opacity: cardOpacity,
        boxShadow: isDragging || isTouchDragging
          ? '0 8px 24px rgba(0, 0, 0, 0.4)'
          : '0 2px 8px rgba(0, 0, 0, 0.2)',
        transition: isDeleting
          ? 'transform 0.16s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.16s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.2s ease'
          : 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.2s ease, box-shadow 0.2s ease',
      }}
      data-task-id={task.id}
    >
      <button
        onClick={handleDelete}
        onMouseDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
        style={{
          position: 'absolute',
          top: '8px',
          right: '8px',
          background: 'transparent',
          border: 'none',
          color: '#9ca3af',
          fontSize: '18px',
          lineHeight: 1,
          cursor: 'pointer',
          width: '24px',
          height: '24px',
          borderRadius: '4px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.15s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
          e.currentTarget.style.color = '#ef4444';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'transparent';
          e.currentTarget.style.color = '#9ca3af';
        }}
      >
        ×
      </button>

      <h4
        style={{
          fontSize: '14px',
          fontWeight: 600,
          color: '#ffffff',
          marginBottom: '10px',
          paddingRight: '24px',
          lineHeight: 1.4,
        }}
      >
        {task.title}
      </h4>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: '12px',
        }}
      >
        <span
          style={{
            fontSize: '12px',
            color: '#9ca3af',
          }}
        >
          👤 {task.assignee}
        </span>
        <span
          style={{
            background: priority.bg,
            color: priority.color,
            fontSize: '11px',
            fontWeight: 600,
            padding: '3px 10px',
            borderRadius: '10px',
          }}
        >
          {priority.label}
        </span>
      </div>
    </div>
  );
};

export default TaskCard;
