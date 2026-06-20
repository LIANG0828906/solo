import React, { useState, useRef, useEffect } from 'react';
import type { Task, Priority } from './types';
import { PRIORITY_COLORS, PRIORITY_LABELS } from './types';

interface TaskCardProps {
  task: Task;
  columnId: string;
  onUpdateTitle: (taskId: string, title: string) => void;
  onDelete: (taskId: string) => void;
  onUpdatePriority: (taskId: string, priority: Priority) => void;
  onDragStart: (e: React.DragEvent, taskId: string, columnId: string) => void;
  onDragEnd: (e: React.DragEvent) => void;
  isDragging: boolean;
}

const formatDate = (ts: number) => {
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const TaskCard: React.FC<TaskCardProps> = ({
  task,
  columnId,
  onUpdateTitle,
  onDelete,
  onUpdatePriority,
  onDragStart,
  onDragEnd,
  isDragging,
}) => {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(task.title);
  const [showMenu, setShowMenu] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  useEffect(() => {
    setEditValue(task.title);
  }, [task.title]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const startEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditing(true);
  };

  const saveEdit = () => {
    const val = editValue.trim();
    if (val && val !== task.title) {
      onUpdateTitle(task.id, val);
    } else {
      setEditValue(task.title);
    }
    setEditing(false);
  };

  const cancelEdit = () => {
    setEditValue(task.title);
    setEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveEdit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancelEdit();
    }
  };

  return (
    <div
      draggable={!editing}
      onDragStart={(e) => onDragStart(e, task.id, columnId)}
      onDragEnd={onDragEnd}
      onDoubleClick={startEdit}
      style={{
        background: '#ffffff',
        borderRadius: 8,
        padding: '12px 14px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
        transition: 'box-shadow 0.2s ease, transform 0.2s ease',
        cursor: editing ? 'text' : 'grab',
        opacity: isDragging ? 0.5 : 1,
        position: 'relative',
        userSelect: editing ? 'text' : 'none',
        marginBottom: 0,
      }}
      onMouseEnter={(e) => {
        if (!editing) {
          const el = e.currentTarget;
          el.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
          el.style.transform = 'translateY(-2px)';
        }
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget;
        el.style.boxShadow = '0 1px 3px rgba(0,0,0,0.12)';
        el.style.transform = 'translateY(0)';
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
        <div
          onClick={(e) => {
            e.stopPropagation();
            setShowMenu(!showMenu);
          }}
          style={{
            width: 10,
            height: 10,
            borderRadius: '50%',
            backgroundColor: PRIORITY_COLORS[task.priority],
            flexShrink: 0,
            marginTop: editing ? 8 : 6,
            cursor: 'pointer',
            border: '1px solid rgba(0,0,0,0.08)',
          }}
          title="点击切换优先级"
        />
        {editing ? (
          <input
            ref={inputRef}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={saveEdit}
            style={{
              flex: 1,
              border: '2px solid #3498db',
              borderRadius: 4,
              padding: '4px 6px',
              fontSize: 14,
              outline: 'none',
              backgroundColor: '#f0f8ff',
              color: '#2c3e50',
            }}
          />
        ) : (
          <div
            style={{
              flex: 1,
              fontSize: 14,
              fontWeight: 500,
              color: '#2c3e50',
              lineHeight: 1.4,
              wordBreak: 'break-word',
              minWidth: 0,
            }}
          >
            {task.title}
          </div>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(task.id);
          }}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#95a5a6',
            fontSize: 16,
            lineHeight: 1,
            padding: 2,
            cursor: 'pointer',
            borderRadius: 4,
            flexShrink: 0,
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color = '#e74c3c';
            (e.currentTarget as HTMLButtonElement).style.background = '#fdecea';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color = '#95a5a6';
            (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
          }}
          title="删除任务"
        >
          ×
        </button>
      </div>

      <div
        style={{
          marginTop: 8,
          fontSize: 11,
          color: '#95a5a6',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span>{formatDate(task.createdAt)}</span>
        <span
          style={{
            color: PRIORITY_COLORS[task.priority],
            fontWeight: 600,
            fontSize: 11,
          }}
        >
          {PRIORITY_LABELS[task.priority]}优先级
        </span>
      </div>

      {showMenu && (
        <div
          ref={menuRef}
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            marginTop: 4,
            background: '#fff',
            borderRadius: 8,
            boxShadow: '0 6px 16px rgba(0,0,0,0.15)',
            zIndex: 10,
            padding: 4,
            minWidth: 120,
            border: '1px solid #eee',
          }}
        >
          {(['high', 'medium', 'low'] as Priority[]).map((p) => (
            <div
              key={p}
              onClick={(e) => {
                e.stopPropagation();
                onUpdatePriority(task.id, p);
                setShowMenu(false);
              }}
              style={{
                padding: '6px 10px',
                fontSize: 13,
                cursor: 'pointer',
                borderRadius: 4,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                background: task.priority === p ? '#f5f7fa' : 'transparent',
              }}
              onMouseEnter={(e) => {
                if (task.priority !== p) {
                  (e.currentTarget as HTMLDivElement).style.background = '#f0f2f5';
                }
              }}
              onMouseLeave={(e) => {
                if (task.priority !== p) {
                  (e.currentTarget as HTMLDivElement).style.background = 'transparent';
                }
              }}
            >
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  backgroundColor: PRIORITY_COLORS[p],
                }}
              />
              <span>{PRIORITY_LABELS[p]}优先级</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TaskCard;
