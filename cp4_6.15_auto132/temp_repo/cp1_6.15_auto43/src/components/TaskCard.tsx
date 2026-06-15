import React, { memo, useRef, useState } from 'react';
import { Play, Trash2, Clock } from 'lucide-react';
import type { Task } from '../types';
import { useApp } from '../state/store';

interface TaskCardProps {
  task: Task;
  isNew?: boolean;
  onDragStart: (e: React.DragEvent, task: Task) => void;
}

export const TaskCard = memo<TaskCardProps>(({ task, isNew, onDragStart }) => {
  const { state, dispatch } = useApp();
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description);
  const [estimatedPomodoros, setEstimatedPomodoros] = useState(task.estimatedPomodoros);
  const saveTimeoutRef = useRef<number | null>(null);

  const isActive = state.activeTaskId === task.id;

  const startPomodoro = (e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch({ type: 'SET_ACTIVE_TASK', payload: task.id });
  };

  const deleteTask = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('确定要删除这个任务吗？')) {
      dispatch({ type: 'DELETE_TASK', payload: task.id });
      if (state.activeTaskId === task.id) {
        dispatch({ type: 'SET_ACTIVE_TASK', payload: null });
      }
    }
  };

  const scheduleSave = () => {
    if (saveTimeoutRef.current) {
      window.clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = window.setTimeout(() => {
      dispatch({
        type: 'UPDATE_TASK',
        payload: {
          id: task.id,
          title: title.trim() || '未命名任务',
          description: description.trim(),
          estimatedPomodoros: Math.max(0, estimatedPomodoros),
        },
      });
    }, 150);
  };

  const handleBlur = () => {
    setEditing(false);
    dispatch({
      type: 'UPDATE_TASK',
      payload: {
        id: task.id,
        title: title.trim() || '未命名任务',
        description: description.trim(),
        estimatedPomodoros: Math.max(0, estimatedPomodoros),
      },
    });
  };

  const cardStyle: React.CSSProperties = {
    background: 'var(--card-bg)',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    boxShadow: 'var(--shadow-sm)',
    border: `2px solid ${editing ? 'var(--accent-color)' : isActive ? 'var(--success-color)' : 'transparent'}`,
    cursor: 'grab',
    transition: 'all 0.3s var(--ease-bounce)',
    position: 'relative',
  };

  return (
    <div
      draggable={!editing}
      onDragStart={(e) => onDragStart(e, task)}
      className={isNew ? 'task-enter' : ''}
      style={cardStyle}
      onMouseEnter={(e) => {
        if (!editing) {
          (e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--shadow-lg)';
          (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)';
        }
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--shadow-sm)';
        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        {editing ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <input
              autoFocus
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                scheduleSave();
              }}
              onBlur={handleBlur}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) handleBlur();
              }}
              style={{
                width: '100%',
                padding: '6px 10px',
                fontSize: 14,
                fontWeight: 600,
                border: '1px solid var(--border-color)',
                borderRadius: 6,
                background: 'var(--bg-tertiary)',
                color: 'var(--text-primary)',
              }}
            />
            <textarea
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                scheduleSave();
              }}
              onBlur={handleBlur}
              rows={2}
              placeholder="任务描述..."
              style={{
                width: '100%',
                padding: '6px 10px',
                fontSize: 12,
                border: '1px solid var(--border-color)',
                borderRadius: 6,
                background: 'var(--bg-tertiary)',
                color: 'var(--text-primary)',
                resize: 'vertical',
                minHeight: 48,
              }}
            />
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Clock size={14} style={{ color: 'var(--text-muted)' }} />
              <label style={{ fontSize: 12, color: 'var(--text-secondary)' }}>预估番茄数:</label>
              <input
                type="number"
                min={0}
                value={estimatedPomodoros}
                onChange={(e) => {
                  setEstimatedPomodoros(parseInt(e.target.value) || 0);
                  scheduleSave();
                }}
                onBlur={handleBlur}
                style={{
                  width: 60,
                  padding: '4px 8px',
                  fontSize: 12,
                  border: '1px solid var(--border-color)',
                  borderRadius: 4,
                  background: 'var(--bg-tertiary)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>
          </div>
        ) : (
          <div
            style={{ flex: 1, cursor: 'pointer' }}
            onClick={() => setEditing(true)}
          >
            <div
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: 'var(--text-primary)',
                marginBottom: 6,
                lineHeight: 1.4,
              }}
            >
              {task.title}
            </div>
            {task.description && (
              <div
                style={{
                  fontSize: 12,
                  color: 'var(--text-secondary)',
                  marginBottom: 8,
                  lineHeight: 1.5,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}
              >
                {task.description}
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '3px 8px',
                  borderRadius: 10,
                  fontSize: 11,
                  fontWeight: 500,
                  background: 'rgba(39, 174, 96, 0.1)',
                  color: 'var(--success-color)',
                }}
              >
                🍅 {task.completedPomodoros}/{task.estimatedPomodoros || '∞'}
              </span>
              {isActive && (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '3px 8px',
                    borderRadius: 10,
                    fontSize: 11,
                    fontWeight: 500,
                    background: 'rgba(39, 174, 96, 0.2)',
                    color: 'var(--success-color)',
                  }}
                >
                  计时中
                </span>
              )}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <button
            onClick={startPomodoro}
            aria-label="开始计时"
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: isActive ? 'var(--success-color)' : 'rgba(39, 174, 96, 0.1)',
              color: isActive ? '#fff' : 'var(--success-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: 32,
            }}
          >
            <Play size={14} />
          </button>
          <button
            onClick={deleteTask}
            aria-label="删除任务"
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: 'rgba(231, 76, 60, 0.1)',
              color: 'var(--danger-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: 32,
            }}
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
});

TaskCard.displayName = 'TaskCard';
