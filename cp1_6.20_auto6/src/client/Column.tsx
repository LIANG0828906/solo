import React, { useState } from 'react';
import type { Task, Priority, ColumnData } from './types';
import TaskCard from './TaskCard';

interface ColumnProps {
  column: ColumnData;
  tasks: Task[];
  draggingTaskId: string | null;
  draggingFromColumnId: string | null;
  onUpdateTitle: (taskId: string, title: string) => void;
  onDelete: (taskId: string) => void;
  onUpdatePriority: (taskId: string, priority: Priority) => void;
  onCardDragStart: (e: React.DragEvent, taskId: string, columnId: string) => void;
  onCardDragEnd: (e: React.DragEvent) => void;
  onDropTask: (taskId: string, toColumnId: string, newIndex: number) => void;
}

const Column: React.FC<ColumnProps> = ({
  column,
  tasks,
  draggingTaskId,
  draggingFromColumnId,
  onUpdateTitle,
  onDelete,
  onUpdatePriority,
  onCardDragStart,
  onCardDragEnd,
  onDropTask,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (!isDragOver) setIsDragOver(true);

    const container = e.currentTarget.querySelector('[data-cards-container]') as HTMLElement | null;
    if (!container) return;

    const cards = Array.from(container.children) as HTMLElement[];

    if (cards.length === 0) {
      setHoverIndex(0);
      return;
    }

    let idx = cards.length;
    for (let i = 0; i < cards.length; i++) {
      const card = cards[i];
      const r = card.getBoundingClientRect();
      const mid = r.top + r.height / 2;
      if (e.clientY < mid) {
        idx = i;
        break;
      }
    }
    setHoverIndex(idx);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    if (
      e.clientX <= rect.left ||
      e.clientX >= rect.right ||
      e.clientY <= rect.top ||
      e.clientY >= rect.bottom
    ) {
      setIsDragOver(false);
      setHoverIndex(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('application/task-id');
    if (!taskId) return;

    const targetIdx = hoverIndex ?? tasks.length;

    let newIndex = targetIdx;
    if (
      draggingFromColumnId === column.id &&
      draggingTaskId !== null
    ) {
      const currentIdx = tasks.findIndex((t) => t.id === draggingTaskId);
      if (currentIdx !== -1 && currentIdx < targetIdx) {
        newIndex = targetIdx - 1;
      }
    }

    onDropTask(taskId, column.id, newIndex);
    setIsDragOver(false);
    setHoverIndex(null);
  };

  const cardsContainer = (() => {
    const rendered = tasks.map((task, idx) => {
      const showPlaceholder =
        isDragOver && hoverIndex !== null && hoverIndex === idx;
      return (
        <React.Fragment key={task.id}>
          {showPlaceholder && (
            <div
              style={{
                height: 60,
                borderRadius: 8,
                border: '2px dashed #3498db',
                background: 'rgba(52,152,219,0.08)',
                marginBottom: 8,
                transition: 'all 0.15s ease',
              }}
            />
          )}
          <div style={{ marginBottom: 8 }}>
            <TaskCard
              task={task}
              columnId={column.id}
              onUpdateTitle={onUpdateTitle}
              onDelete={onDelete}
              onUpdatePriority={onUpdatePriority}
              onDragStart={onCardDragStart}
              onDragEnd={onCardDragEnd}
              isDragging={draggingTaskId === task.id}
            />
          </div>
        </React.Fragment>
      );
    });

    if (isDragOver && hoverIndex !== null && hoverIndex >= tasks.length) {
      rendered.push(
        <div
          key="__placeholder_end__"
          style={{
            height: 60,
            borderRadius: 8,
            border: '2px dashed #3498db',
            background: 'rgba(52,152,219,0.08)',
            transition: 'all 0.15s ease',
          }}
        />
      );
    }

    return rendered;
  })();

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      style={{
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        minWidth: 300,
        maxWidth: 420,
        height: '100%',
        background: isDragOver ? 'rgba(52,152,219,0.04)' : 'transparent',
        borderRadius: 12,
        border: isDragOver ? '2px dashed #3498db' : '2px solid transparent',
        padding: isDragOver ? 6 : 8,
        transition: 'border-color 0.15s ease, background-color 0.15s ease',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 10px 12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <h3
            style={{
              fontSize: 15,
              fontWeight: 600,
              color: '#2c3e50',
              letterSpacing: 0.2,
            }}
          >
            {column.title}
          </h3>
          <span
            style={{
              background: '#e8ebee',
              color: '#5c6b7a',
              fontSize: 12,
              fontWeight: 600,
              padding: '2px 8px',
              borderRadius: 10,
              minWidth: 22,
              textAlign: 'center',
            }}
          >
            {tasks.length}
          </span>
        </div>
      </div>

      <div
        data-cards-container
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '2px 6px',
          minHeight: 80,
        }}
      >
        {cardsContainer}
        {tasks.length === 0 && !isDragOver && (
          <div
            style={{
              padding: 20,
              textAlign: 'center',
              color: '#b0b8bf',
              fontSize: 13,
              border: '1px dashed #d8dde2',
              borderRadius: 8,
              background: 'rgba(255,255,255,0.3)',
            }}
          >
            拖拽任务到这里
          </div>
        )}
      </div>
    </div>
  );
};

export default Column;
