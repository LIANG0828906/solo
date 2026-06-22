import React, { useState, useRef } from 'react';
import { GripVertical } from 'lucide-react';
import { Task } from './types';

interface TaskCardProps {
  task: Task;
  onDragStart: (e: React.MouseEvent, task: Task) => void;
  onClick: () => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, onDragStart, onClick }) => {
  const [showHandle, setShowHandle] = useState(false);
  const [handleTimer, setHandleTimer] = useState<number | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseEnter = () => {
    setIsHovered(true);
    const timer = window.setTimeout(() => {
      setShowHandle(true);
    }, 200);
    setHandleTimer(timer);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    if (handleTimer) {
      clearTimeout(handleTimer);
      setHandleTimer(null);
    }
    setShowHandle(false);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDragStart(e, task);
  };

  const handleCardClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick();
  };

  return (
    <div
      ref={cardRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleCardClick}
      style={{
        width: '260px',
        minHeight: '120px',
        backgroundColor: 'var(--bg-white)',
        border: '2px solid var(--border-gray)',
        borderRadius: '8px',
        padding: '16px',
        cursor: 'pointer',
        position: 'relative',
        transition: 'box-shadow 0.2s ease, transform 0.2s ease',
        boxShadow: isHovered ? '0 4px 12px rgba(0,0,0,0.1)' : 'none',
        userSelect: 'none',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: '4px',
          backgroundColor: task.color,
          borderRadius: '8px 0 0 8px'
        }}
      />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <h4 style={{
          fontSize: '14px',
          fontWeight: 600,
          color: 'var(--text-primary)',
          marginBottom: '12px',
          lineHeight: 1.4,
          paddingLeft: '4px'
        }}>
          {task.title}
        </h4>

        {task.description && (
          <p style={{
            fontSize: '12px',
            color: 'var(--text-secondary)',
            marginBottom: '12px',
            lineHeight: 1.5,
            paddingLeft: '4px',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden'
          }}>
            {task.description}
          </p>
        )}

        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: 'auto',
          paddingTop: '8px',
          paddingLeft: '4px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <div style={{
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              backgroundColor: task.assignee.avatarColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '11px',
              fontWeight: 600,
              border: '2px solid white',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
              {task.assignee.name.charAt(0)}
            </div>
            <span style={{
              fontSize: '12px',
              color: 'var(--text-secondary)'
            }}>
              {task.assignee.name}
            </span>
          </div>

          {task.comments.length > 0 && (
            <span style={{
              fontSize: '11px',
              color: 'var(--text-muted)',
              backgroundColor: '#f0f0f0',
              padding: '2px 8px',
              borderRadius: '10px'
            }}>
              💬 {task.comments.length}
            </span>
          )}
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          bottom: '8px',
          right: '12px',
          opacity: showHandle ? 1 : 0,
          transition: 'opacity 0.2s ease',
          cursor: 'grab',
          padding: '4px',
          borderRadius: '4px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
        onMouseDown={handleMouseDown}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#f0f0f0';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
        }}
      >
        <GripVertical size={16} color="#999" />
      </div>
    </div>
  );
};

export default React.memo(TaskCard);
