import React, { useCallback, useRef } from 'react';
import type { Task, TaskStatus } from '../types';
import { COLUMN_CONFIG } from '../types';
import { TaskColumn } from './TaskColumn';
import { useApp } from '../state/store';

export const TaskBoard: React.FC = () => {
  const { state, dispatch } = useApp();
  const draggingTaskRef = useRef<Task | null>(null);

  const handleDragStart = useCallback((e: React.DragEvent, task: Task) => {
    draggingTaskRef.current = task;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', task.id);
    const target = e.currentTarget as HTMLElement;
    target.style.opacity = '0.5';
    const rect = target.getBoundingClientRect();
    const img = target.cloneNode(true) as HTMLElement;
    img.style.position = 'absolute';
    img.style.top = '-9999px';
    img.style.opacity = '0.85';
    img.style.transform = 'rotate(2deg)';
    img.style.boxShadow = 'var(--shadow-hover)';
    document.body.appendChild(img);
    try {
      e.dataTransfer.setDragImage(img, e.clientX - rect.left, e.clientY - rect.top);
    } catch {}
    setTimeout(() => document.body.removeChild(img), 0);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent, status: TaskStatus) => {
      e.preventDefault();
      const task = draggingTaskRef.current;
      if (task && task.status !== status) {
        dispatch({ type: 'MOVE_TASK', payload: { id: task.id, status } });
      }
      draggingTaskRef.current = null;
      document.querySelectorAll('[draggable="true"]').forEach((el) => {
        (el as HTMLElement).style.opacity = '1';
      });
    },
    [dispatch]
  );

  const getTasksByStatus = (status: TaskStatus) =>
    state.tasks.filter((t) => t.status === status);

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        gap: 16,
        minHeight: 0,
        overflow: 'hidden',
      }}
    >
      {COLUMN_CONFIG.map((col) => (
        <TaskColumn
          key={col.status}
          status={col.status}
          label={col.label}
          color={col.color}
          tasks={getTasksByStatus(col.status)}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        />
      ))}
    </div>
  );
};
