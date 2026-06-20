import React from 'react';

interface TaskCardProps {
  task: {
    id: string;
    name: string;
    description: string;
    assignee: string;
    priority: 'high' | 'medium' | 'low';
    dueDate: string;
    subtasks: { id: string; name: string; completed: boolean }[];
  };
  listId: string;
  onOpenDetail: (taskId: string, listId: string) => void;
}

const priorityConfig: Record<'high' | 'medium' | 'low', { color: string; label: string }> = {
  high: { color: '#e74c3c', label: '高' },
  medium: { color: '#f39c12', label: '中' },
  low: { color: '#27ae60', label: '低' },
};

const TaskCard: React.FC<TaskCardProps> = React.memo(({ task, listId, onOpenDetail }) => {
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && listId !== 'done';
  const { color: priorityColor, label: priorityLabel } = priorityConfig[task.priority];
  const completedCount = task.subtasks.filter((s) => s.completed).length;
  const totalCount = task.subtasks.length;
  const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <div
      className="task-card"
      onClick={() => onOpenDetail(task.id, listId)}
    >
      <div className="task-card-name">{task.name}</div>

      <div className="task-card-row">
        <span className={`priority-dot ${task.priority}`} />
        <span>{priorityLabel}</span>
      </div>

      <div className="task-card-row">
        <span style={{ fontSize: '11px', color: '#999' }}>●</span>
        <span>{task.assignee || '未分配'}</span>
      </div>

      <div className="task-card-row">
        <span style={{ fontSize: '11px', color: '#999' }}>○</span>
        <span className={isOverdue ? 'task-card-overdue' : ''}>
          {task.dueDate || '无截止日期'}
        </span>
      </div>

      {totalCount > 0 && (
        <div className="task-card-progress">
          <div className="task-card-progress-text">
            {completedCount}/{totalCount} 已完成
          </div>
          <div className="task-card-progress-bar">
            <div
              className="task-card-progress-fill"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
});

TaskCard.displayName = 'TaskCard';

export default TaskCard;
