import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Task, Member, TaskStatus } from '../types';
import KanbanCard from './KanbanCard';

interface KanbanColumnProps {
  status: TaskStatus;
  title: string;
  tasks: Task[];
  members: Member[];
  onTaskClick: (task: Task) => void;
  onTaskDrop: (taskId: string, newStatus: TaskStatus) => void;
}

const statusColors: Record<TaskStatus, string> = {
  todo: '#64748B',
  'in-progress': '#7C3AED',
  done: '#10B981',
};

const KanbanColumn: React.FC<KanbanColumnProps> = ({
  status,
  title,
  tasks,
  members,
  onTaskClick,
  onTaskDrop,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const taskId = e.dataTransfer.getData('taskId');
    if (taskId) {
      onTaskDrop(taskId, status);
    }
  };

  const getMember = (memberId: string) =>
    members.find((m) => m.id === memberId);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      style={{
        flex: 1,
        minWidth: '280px',
        background: isDragOver ? 'rgba(124, 58, 237, 0.1)' : 'transparent',
        borderRadius: '16px',
        padding: '16px',
        transition: 'background 0.2s ease',
        border: isDragOver ? '2px dashed #7C3AED' : '2px solid transparent',
      }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '20px',
          paddingBottom: '12px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
        }}
      >
        <div
          style={{
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            background: statusColors[status],
          }}
        />
        <h3
          style={{
            fontSize: '16px',
            fontWeight: 600,
            color: '#E0E0E0',
            margin: 0,
            flex: 1,
          }}
        >
          {title}
        </h3>
        <span
          style={{
            fontSize: '12px',
            color: '#9B9BC7',
            background: '#2D2D44',
            padding: '4px 10px',
            borderRadius: '20px',
            fontWeight: 500,
          }}
        >
          {tasks.length}
        </span>
      </div>

      <div style={{ minHeight: '100px' }}>
        {tasks.map((task) => (
          <KanbanCard
            key={task.id}
            task={task}
            member={getMember(task.assigneeId)}
            onClick={() => onTaskClick(task)}
          />
        ))}
      </div>

      {tasks.length === 0 && (
        <div
          style={{
            padding: '40px 20px',
            textAlign: 'center',
            color: '#5A5A80',
            fontSize: '13px',
            border: '2px dashed #2D2D44',
            borderRadius: '12px',
          }}
        >
          拖拽任务到此处
        </div>
      )}
    </motion.div>
  );
};

export default KanbanColumn;
