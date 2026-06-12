import React, { useState } from 'react';
import { Task, TaskPriority } from './types';

interface TaskCardProps {
  task: Task;
  onDelete: (taskId: string) => void;
  onDragStart: (e: React.DragEvent<HTMLDivElement>, taskId: string) => void;
  onDragEnd: (e: React.DragEvent<HTMLDivElement>) => void;
}

const priorityConfig: Record<TaskPriority, { label: string; bg: string; color: string }> = {
  high: { label: '高', bg: '#ef4444', color: '#ffffff' },
  medium: { label: '中', bg: '#f59e0b', color: '#1f2937' },
  low: { label: '低', bg: '#22c55e', color: '#ffffff' },
};

const TaskCard: React.FC<TaskCardProps> = ({ task, onDelete, onDragStart, onDragEnd }) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const handleDelete = () => {
    setIsDeleting(true);
    setTimeout(() => {
      onDelete(task.id);
    }, 250);
  };

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    setIsDragging(true);
    onDragStart(e, task.id);
  };

  const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
    setIsDragging(false);
    onDragEnd(e);
  };

  const priority = priorityConfig[task.priority];

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      style={{
        background: '#2a2a3e',
        borderRadius: '8px',
        padding: '14px',
        marginBottom: '12px',
        boxShadow: isDragging
          ? '0 8px 24px rgba(0, 0, 0, 0.4)'
          : '0 2px 8px rgba(0, 0, 0, 0.2)',
        cursor: 'grab',
        position: 'relative',
        opacity: isDragging ? 0.5 : 1,
        transform: isDragging ? 'rotate(2deg)' : 'none',
        transition: isDeleting
          ? 'all 0.25s ease-in'
          : 'box-shadow 0.2s ease, transform 0.2s ease, opacity 0.2s ease',
        animation: isDeleting ? 'cardOut 0.25s ease-in forwards' : 'dropIn 0.2s ease-out',
      }}
      onMouseEnter={(e) => {
        if (!isDragging && !isDeleting) {
          e.currentTarget.style.transform = 'translateY(-2px)';
        }
      }}
      onMouseLeave={(e) => {
        if (!isDragging && !isDeleting) {
          e.currentTarget.style.transform = 'translateY(0)';
        }
      }}
    >
      <button
        onClick={handleDelete}
        style={{
          position: 'absolute',
          top: '8px',
          right: '8px',
          background: 'transparent',
          border: 'none',
          color: '#9ca3af',
          fontSize: '18px',
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
