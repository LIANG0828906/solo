import React, { useCallback, useRef, useState } from 'react';
import { Task, PRIORITY_CONFIG } from '../types';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface TaskCardProps {
  task: Task;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string, title: string) => void;
  onDragStart: (id: string) => void;
  onDragOver: (e: React.DragEvent, id: string) => void;
  onDrop: (id: string) => void;
  onDragEnd: () => void;
}

const TaskCard: React.FC<TaskCardProps> = React.memo(({
  task,
  onToggle,
  onDelete,
  onEdit,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [isSlidingOut, setIsSlidingOut] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isDragging = useRef(false);

  const handleToggle = useCallback(() => {
    if (!task.completed) {
      setIsSlidingOut(true);
      setTimeout(() => {
        onToggle(task.id);
        setIsSlidingOut(false);
      }, 400);
    } else {
      onToggle(task.id);
    }
  }, [task.id, task.completed, onToggle]);

  const handleDoubleClick = useCallback(() => {
    setIsEditing(true);
    setEditTitle(task.title);
    setTimeout(() => inputRef.current?.focus(), 0);
  }, [task.title]);

  const handleEditSubmit = useCallback(() => {
    const trimmed = editTitle.trim();
    if (trimmed) {
      onEdit(task.id, trimmed);
    }
    setIsEditing(false);
  }, [task.id, editTitle, onEdit]);

  const handleEditKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleEditSubmit();
    if (e.key === 'Escape') setIsEditing(false);
  }, [handleEditSubmit]);

  const priorityConfig = PRIORITY_CONFIG[task.priority];

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.effectAllowed = 'move';
    onDragStart(task.id);
    isDragging.current = true;
  };

  const handleTouchStart = () => {
    longPressTimer.current = setTimeout(() => {
      onDragStart(task.id);
    }, 500);
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
  };

  let formattedDate = '';
  try {
    formattedDate = format(new Date(task.dueDate), 'M月d日', { locale: zhCN });
  } catch {
    formattedDate = task.dueDate;
  }

  return (
    <div
      className={`task-card ${task.completed ? 'completed' : ''} ${isSlidingOut ? 'sliding-out' : ''}`}
      draggable
      onDragStart={handleDragStart}
      onDragOver={(e) => onDragOver(e, task.id)}
      onDrop={() => onDrop(task.id)}
      onDragEnd={onDragEnd}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <span className="task-drag-handle">⠿</span>
      <div
        className={`task-checkbox ${task.completed ? 'checked' : ''}`}
        onClick={handleToggle}
      >
        {task.completed && <span className="task-checkbox-check">✓</span>}
      </div>
      <div className="task-content" onDoubleClick={handleDoubleClick}>
        {isEditing ? (
          <input
            ref={inputRef}
            className="task-edit-input"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onBlur={handleEditSubmit}
            onKeyDown={handleEditKeyDown}
          />
        ) : (
          <>
            <div className="task-title">{task.title}</div>
            <div className="task-meta">
              <span className="task-due">{formattedDate}</span>
              <span
                className="task-priority-badge"
                style={{ background: priorityConfig.color }}
              >
                {priorityConfig.label}
              </span>
            </div>
          </>
        )}
      </div>
      <div className="task-actions">
        <button className="task-action-btn" onClick={handleDoubleClick} title="编辑">
          ✏️
        </button>
        <button className="task-action-btn delete" onClick={() => onDelete(task.id)} title="删除">
          🗑️
        </button>
      </div>
    </div>
  );
});

TaskCard.displayName = 'TaskCard';

export default TaskCard;
