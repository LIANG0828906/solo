import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import type { Task, TaskStatus } from '../types';
import { TaskCard } from './TaskCard';
import { useApp } from '../state/store';

interface TaskColumnProps {
  status: TaskStatus;
  label: string;
  color: string;
  tasks: Task[];
  onDragStart: (e: React.DragEvent, task: Task) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, status: TaskStatus) => void;
}

export const TaskColumn: React.FC<TaskColumnProps> = ({
  status,
  label,
  color,
  tasks,
  onDragStart,
  onDragOver,
  onDrop,
}) => {
  const { dispatch } = useApp();
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [newlyAddedId, setNewlyAddedId] = useState<string | null>(null);

  const addTask = () => {
    const title = newTitle.trim();
    if (!title) {
      setIsAdding(false);
      return;
    }
    const id = `task_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const now = new Date().toISOString();
    const newTask: Task = {
      id,
      title,
      description: '',
      status,
      estimatedPomodoros: 0,
      completedPomodoros: 0,
      createdAt: now,
      updatedAt: now,
    };
    dispatch({ type: 'ADD_TASK', payload: newTask });
    setNewlyAddedId(id);
    setNewTitle('');
    setIsAdding(false);
    setTimeout(() => setNewlyAddedId(null), 500);
  };

  return (
    <div
      style={{
        flex: 1,
        minWidth: 0,
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--kanban-bg)',
        borderRadius: 14,
        boxShadow: 'var(--shadow-sm)',
        border: isDragOver ? '2px dashed var(--accent-color)' : '1px solid var(--border-color)',
        overflow: 'hidden',
        transition: 'all 0.3s var(--ease-bounce)',
      }}
      onDragOver={(e) => {
        e.preventDefault();
        onDragOver(e);
        setIsDragOver(true);
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={(e) => {
        setIsDragOver(false);
        onDrop(e, status);
      }}
    >
      <div
        style={{
          padding: '14px 16px',
          background: color,
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>{label}</h3>
          <span
            style={{
              minWidth: 24,
              height: 24,
              borderRadius: 12,
              padding: '0 8px',
              background: 'rgba(255,255,255,0.25)',
              fontSize: 12,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {tasks.length}
          </span>
        </div>
        <button
          onClick={() => setIsAdding(true)}
          aria-label="添加任务"
          style={{
            width: 30,
            height: 30,
            borderRadius: 8,
            background: 'rgba(255,255,255,0.2)',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: 30,
          }}
        >
          <Plus size={18} />
        </button>
      </div>

      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: 12,
          minHeight: 120,
          background: isDragOver ? 'rgba(52, 152, 219, 0.05)' : 'transparent',
          transition: 'background-color 0.2s ease',
        }}
      >
        {isAdding && (
          <div
            style={{
              marginBottom: 10,
              padding: 12,
              background: 'var(--bg-tertiary)',
              borderRadius: 10,
              border: '1px solid var(--border-color)',
            }}
          >
            <input
              autoFocus
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') addTask();
                if (e.key === 'Escape') {
                  setIsAdding(false);
                  setNewTitle('');
                }
              }}
              placeholder="输入任务标题... (Enter保存，Esc取消)"
              style={{
                width: '100%',
                padding: '8px 12px',
                fontSize: 13,
                border: '1px solid var(--border-color)',
                borderRadius: 6,
                background: 'var(--card-bg)',
                color: 'var(--text-primary)',
              }}
            />
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <button
                onClick={addTask}
                style={{
                  padding: '6px 14px',
                  fontSize: 12,
                  borderRadius: 6,
                  background: color,
                  color: '#fff',
                  fontWeight: 500,
                }}
              >
                添加
              </button>
              <button
                onClick={() => {
                  setIsAdding(false);
                  setNewTitle('');
                }}
                style={{
                  padding: '6px 14px',
                  fontSize: 12,
                  borderRadius: 6,
                  background: 'transparent',
                  color: 'var(--text-secondary)',
                  border: '1px solid var(--border-color)',
                }}
              >
                取消
              </button>
            </div>
          </div>
        )}

        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            isNew={task.id === newlyAddedId}
            onDragStart={onDragStart}
          />
        ))}

        {tasks.length === 0 && !isAdding && (
          <div
            style={{
              padding: '40px 20px',
              textAlign: 'center',
              color: 'var(--text-muted)',
              fontSize: 12,
            }}
          >
            <div style={{ fontSize: 36, marginBottom: 8, opacity: 0.4 }}>📋</div>
            <div>暂无任务，点击右上角 + 添加</div>
          </div>
        )}
      </div>
    </div>
  );
};
