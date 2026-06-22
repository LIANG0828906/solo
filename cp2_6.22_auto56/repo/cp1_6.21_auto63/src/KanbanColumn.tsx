import React from 'react';
import { Task, TaskStatus } from './types';
import TaskCard from './TaskCard';

interface KanbanColumnProps {
  status: TaskStatus;
  title: string;
  color: string;
  tasks: Task[];
  onDragStart: (e: React.MouseEvent, task: Task) => void;
  onTaskClick: (task: Task) => void;
}

const KanbanColumn: React.FC<KanbanColumnProps> = ({
  status,
  title,
  color,
  tasks,
  onDragStart,
  onTaskClick
}) => {
  return (
    <div
      data-column={status}
      style={{
        width: '280px',
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        minHeight: '200px'
      }}
    >
      <div
        style={{
          backgroundColor: color,
          borderRadius: '8px',
          padding: '12px 16px',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <h3 style={{
          fontSize: '14px',
          fontWeight: 600,
          color: 'var(--text-primary)'
        }}>
          {title}
        </h3>
        <span style={{
          fontSize: '12px',
          fontWeight: 500,
          color: 'var(--text-secondary)',
          backgroundColor: 'rgba(255,255,255,0.8)',
          padding: '2px 8px',
          borderRadius: '10px'
        }}>
          {tasks.length}
        </span>
      </div>

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        minHeight: '100px',
        transition: 'background-color 0.3s ease',
        borderRadius: '8px',
        padding: '4px'
      }}>
        {tasks.map(task => (
          <TaskCard
            key={task.id}
            task={task}
            onDragStart={onDragStart}
            onClick={() => onTaskClick(task)}
          />
        ))}
        {tasks.length === 0 && (
          <div style={{
            padding: '40px 16px',
            textAlign: 'center',
            color: 'var(--text-muted)',
            fontSize: '13px',
            border: '2px dashed var(--border-gray)',
            borderRadius: '8px'
          }}>
            暂无任务
          </div>
        )}
      </div>
    </div>
  );
};

export default React.memo(KanbanColumn);
