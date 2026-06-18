import React, { useEffect, useRef } from 'react';
import { useTaskStore } from '../stores/taskStore';
import type { Task, TaskPriority } from '../../../shared/types';
import { PRIORITY_COLORS } from '../../../shared/types';

interface TaskCardProps {
  task: Task;
}

const priorityLabels: Record<TaskPriority, string> = {
  high: '高',
  medium: '中',
  low: '低'
};

const formatTime = (timestamp: number) => {
  const date = new Date(timestamp);
  const hh = date.getHours().toString().padStart(2, '0');
  const mm = date.getMinutes().toString().padStart(2, '0');
  const MM = (date.getMonth() + 1).toString().padStart(2, '0');
  const dd = date.getDate().toString().padStart(2, '0');
  return `${MM}-${dd} ${hh}:${mm}`;
};

const TaskCard: React.FC<TaskCardProps> = ({ task }) => {
  const {
    draggingTaskId,
    deletingIds,
    newlyCreatedIds,
    justDroppedIds,
    expandedIds,
    remoteUpdateIds,
    setDraggingTask,
    toggleExpand,
    changeTaskPriority,
    removeTask,
    clearNewlyCreated,
    clearJustDropped,
    clearRemoteUpdate
  } = useTaskStore();

  const isDragging = draggingTaskId === task.id;
  const isDeleting = deletingIds.has(task.id);
  const isNew = newlyCreatedIds.has(task.id);
  const isJustDropped = justDroppedIds.has(task.id);
  const isExpanded = expandedIds.has(task.id);
  const isRemoteUpdate = remoteUpdateIds.has(task.id);
  const detailRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isNew) {
      const timer = setTimeout(() => clearNewlyCreated(task.id), 500);
      return () => clearTimeout(timer);
    }
  }, [isNew, task.id, clearNewlyCreated]);

  useEffect(() => {
    if (isJustDropped) {
      const timer = setTimeout(() => clearJustDropped(task.id), 400);
      return () => clearTimeout(timer);
    }
  }, [isJustDropped, task.id, clearJustDropped]);

  useEffect(() => {
    if (isRemoteUpdate) {
      const timer = setTimeout(() => clearRemoteUpdate(task.id), 600);
      return () => clearTimeout(timer);
    }
  }, [isRemoteUpdate, task.id, clearRemoteUpdate]);

  const handleDragStart = (e: React.DragEvent) => {
    setDraggingTask(task.id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', task.id);
  };

  const handleDragEnd = () => {
    setDraggingTask(null);
  };

  const handleCardClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.priority-dot') ||
        (e.target as HTMLElement).closest('.delete-btn')) {
      return;
    }
    toggleExpand(task.id);
  };

  const animationClass = isDeleting
    ? 'task-shrink-out'
    : isNew
    ? 'task-fly-in'
    : isJustDropped
    ? 'task-bounce'
    : '';

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={handleCardClick}
      className={`task-card ${animationClass}`}
      style={{
        position: 'relative',
        padding: '12px 14px 12px 17px',
        borderRadius: '12px',
        backgroundColor: '#FFFFFF',
        border: '1px solid #E0E0E0',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        cursor: isDragging ? 'grabbing' : 'grab',
        opacity: isDragging ? 0.8 : 1,
        transition: isRemoteUpdate
          ? 'transform 0.5s ease-in-out, opacity 0.3s, border-color 0.3s, box-shadow 0.3s'
          : 'border-color 0.3s, box-shadow 0.3s',
        marginBottom: '10px',
        userSelect: 'none',
        overflow: 'hidden',
        transform: isDragging ? 'rotate(2deg)' : undefined,
        zIndex: isDragging ? 100 : undefined
      }}
      onMouseEnter={(e) => {
        if (!isDragging) {
          e.currentTarget.style.borderColor = '#6C63FF';
          e.currentTarget.style.boxShadow = '0 4px 16px rgba(108,99,255,0.25)';
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = '#E0E0E0';
        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: '3px',
          backgroundColor: PRIORITY_COLORS[task.priority],
          borderRadius: '3px 0 0 3px'
        }}
      />

      <div
        style={{
          fontSize: '14px',
          fontWeight: 500,
          color: '#333',
          lineHeight: 1.4,
          wordBreak: 'break-word'
        }}
      >
        {task.title}
      </div>

      <div
        style={{
          marginTop: '8px',
          fontSize: '11px',
          color: '#999',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <span>{formatTime(task.createdAt)}</span>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          <span
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: PRIORITY_COLORS[task.priority]
            }}
          />
          {priorityLabels[task.priority]}
        </span>
      </div>

      <div
        ref={detailRef}
        style={{
          maxHeight: isExpanded ? '200px' : '0',
          overflow: 'hidden',
          transition: 'max-height 0.3s ease, margin-top 0.3s ease',
          marginTop: isExpanded ? '12px' : '0',
          borderTop: isExpanded ? '1px solid #F0F0F0' : 'none',
          paddingTop: isExpanded ? '12px' : '0'
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '10px'
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span style={{ fontSize: '12px', color: '#666' }}>优先级：</span>
            {(['high', 'medium', 'low'] as TaskPriority[]).map((p) => (
              <button
                key={p}
                className="priority-dot"
                onClick={(e) => {
                  e.stopPropagation();
                  changeTaskPriority(task.id, p);
                }}
                style={{
                  width: task.priority === p ? '18px' : '15px',
                  height: task.priority === p ? '18px' : '15px',
                  borderRadius: '50%',
                  backgroundColor: PRIORITY_COLORS[p],
                  border: task.priority === p ? '2px solid rgba(255,255,255,0.8)' : 'none',
                  boxShadow: task.priority === p ? `0 0 0 2px ${PRIORITY_COLORS[p]}40` : 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  transform: task.priority === p ? 'scale(1.2)' : 'scale(1)',
                  padding: 0
                }}
                title={priorityLabels[p]}
              />
            ))}
          </div>
          <button
            className="delete-btn"
            onClick={(e) => {
              e.stopPropagation();
              removeTask(task.id);
            }}
            style={{
              fontSize: '12px',
              color: '#FF4757',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px 8px',
              borderRadius: '6px',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255,71,87,0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            删除任务
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaskCard;
