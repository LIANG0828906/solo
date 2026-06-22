import React, { useCallback, useRef, useState, useEffect } from 'react';
import { Task, PRIORITY_CONFIG } from '../types';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface TaskCardProps {
  task: Task;
  isDragging: boolean;
  isDragOver: boolean;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string, title: string) => void;
  onDragStart: (e: React.DragEvent, id: string) => void;
  onDragOver: (e: React.DragEvent, id: string) => void;
  onDrop: (e: React.DragEvent, id: string) => void;
  onDragEnd: (e: React.DragEvent) => void;
}

const TaskCard: React.FC<TaskCardProps> = React.memo(({
  task,
  isDragging,
  isDragOver,
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
  const [willUnmount, setWillUnmount] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressActivated = useRef(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setEditTitle(task.title);
  }, [task.title]);

  const handleToggle = useCallback(() => {
    if (!task.completed) {
      setWillUnmount(true);
      setIsSlidingOut(true);
      const timer = setTimeout(() => {
        onToggle(task.id);
      }, 380);
      return () => clearTimeout(timer);
    } else {
      onToggle(task.id);
    }
  }, [task.id, task.completed, onToggle]);

  const handleDoubleClick = useCallback(() => {
    if (isDragging) return;
    setIsEditing(true);
    setEditTitle(task.title);
    setTimeout(() => inputRef.current?.focus(), 0);
  }, [task.title, isDragging]);

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

  const handleCardDragStart = useCallback((e: React.DragEvent) => {
    e.dataTransfer.effectAllowed = 'move';
    try {
      e.dataTransfer.setData('text/plain', task.id);
    } catch {}
    onDragStart(e, task.id);
  }, [task.id, onDragStart]);

  const handleCardDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    onDragOver(e, task.id);
  }, [task.id, onDragOver]);

  const handleCardDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onDrop(e, task.id);
  }, [task.id, onDrop]);

  const handleCardDragEnd = useCallback((e: React.DragEvent) => {
    onDragEnd(e);
  }, [onDragEnd]);

  const handleTouchStart = useCallback(() => {
    longPressActivated.current = false;
    longPressTimer.current = setTimeout(() => {
      longPressActivated.current = true;
      if (cardRef.current) {
        try {
          const dragEvent = new DragEvent('dragstart', {
            bubbles: true,
            cancelable: true,
          });
          cardRef.current.dispatchEvent(dragEvent);
        } catch {}
      }
    }, 500);
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  const handleTouchMove = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  let formattedDate = '';
  try {
    formattedDate = format(new Date(task.dueDate), 'M月d日', { locale: zhCN });
  } catch {
    formattedDate = task.dueDate;
  }

  const cardClass = [
    'task-card',
    task.completed ? 'completed' : '',
    isDragging ? 'dragging' : '',
    isDragOver && !isDragging ? 'drag-over' : '',
    isSlidingOut ? 'sliding-out' : '',
    willUnmount ? 'will-unmount' : '',
  ].filter(Boolean).join(' ');

  return (
    <div
      ref={cardRef}
      className={cardClass}
      draggable={!isEditing}
      onDragStart={handleCardDragStart}
      onDragOver={handleCardDragOver}
      onDrop={handleCardDrop}
      onDragEnd={handleCardDragEnd}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchMove={handleTouchMove}
    >
      <span className="task-drag-handle" title="拖拽排序">⋮⋮</span>
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
              <span className="task-due">📅 {formattedDate}</span>
              <span
                className="task-priority-badge"
                style={{ background: priorityConfig.color }}
              >
                {priorityConfig.label}优先级
              </span>
            </div>
          </>
        )}
      </div>
      <div className="task-actions">
        <button className="task-action-btn" onClick={handleDoubleClick} title="编辑任务">
          ✏️
        </button>
        <button className="task-action-btn delete" onClick={() => onDelete(task.id)} title="删除任务">
          🗑️
        </button>
      </div>
    </div>
  );
});

TaskCard.displayName = 'TaskCard';

export default TaskCard;
