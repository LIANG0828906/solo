import React, { memo, useState } from 'react';
import type { Task } from '@/types';
import styles from './backlog.module.css';

interface TaskCardProps {
  task: Task;
  onDragStart?: (e: React.DragEvent<HTMLDivElement>, task: Task) => void;
  onClick?: (task: Task) => void;
}

const priorityLabels: Record<Task['priority'], string> = {
  high: '高',
  medium: '中',
  low: '低',
};

const statusLabels: Record<Task['status'], string> = {
  todo: '未开始',
  'in-progress': '进行中',
  done: '已完成',
};

const priorityClassMap: Record<Task['priority'], string> = {
  high: styles.priorityHigh,
  medium: styles.priorityMedium,
  low: styles.priorityLow,
};

export const TaskCard: React.FC<TaskCardProps> = memo(({ task, onDragStart, onClick }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    setIsDragging(true);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', task.id);
    onDragStart?.(e, task);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  const handleClick = () => {
    onClick?.(task);
  };

  return (
    <div
      className={`${styles.taskCard} ${isDragging ? styles.dragging : ''}`}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={handleClick}
    >
      <h3 className={styles.taskTitle}>{task.title}</h3>
      <div className={styles.taskMeta}>
        <span className={`${styles.priorityTag} ${priorityClassMap[task.priority]}`}>
          {priorityLabels[task.priority]}
        </span>
        <span className={styles.statusTag}>{statusLabels[task.status]}</span>
        <span className={styles.estimate}>{task.estimate}h</span>
      </div>
      {task.assignee && (
        <div className={styles.assignee}>负责人：{task.assignee}</div>
      )}
    </div>
  );
});

TaskCard.displayName = 'TaskCard';

export default TaskCard;
