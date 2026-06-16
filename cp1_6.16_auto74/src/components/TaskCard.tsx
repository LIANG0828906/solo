import React from 'react';
import { formatCountdown } from '../utils/dateUtils';
import type { Task } from '../types';
import '../styles/TaskCard.css';

interface TaskCardProps {
  task: Task;
  onClick?: () => void;
}

const statusLabels: Record<string, string> = {
  pending: '待开始',
  'in-progress': '进行中',
  reviewing: '评分中',
  completed: '已结束',
};

export function TaskCard({ task, onClick }: TaskCardProps) {
  const submittedCount = task.groups.filter((g) => g.submission).length;
  const totalGroups = task.groups.length;

  return (
    <div className={`task-card task-card--${task.status}`} onClick={onClick}>
      <div className={`task-card__border task-card__border--${task.status}`} />
      <div className="task-card__content">
        <div className="task-card__header">
          <h3 className="task-card__name">{task.name}</h3>
          <span className={`task-card__status task-card__status--${task.status}`}>
            {statusLabels[task.status]}
          </span>
        </div>
        <div className="task-card__info">
          <div className="task-card__countdown">
            <span className="task-card__countdown-label">距截止</span>
            <span className="task-card__countdown-value">
              {formatCountdown(task.deadline)}
            </span>
          </div>
          {totalGroups > 0 && (
            <div className="task-card__progress">
              <span className="task-card__progress-label">提交进度</span>
              <span className="task-card__progress-value">
                {submittedCount}/{totalGroups} 组
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
