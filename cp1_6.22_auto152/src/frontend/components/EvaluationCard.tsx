import React from 'react';
import { EvaluationTask } from '../../shared/types';

interface Props {
  task: EvaluationTask;
  onClick: (task: EvaluationTask) => void;
}

const EvaluationCard: React.FC<Props> = ({ task, onClick }) => {
  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const isOverdue = new Date(task.deadline) < new Date() && task.status === 'pending';

  return (
    <div
      className={`evaluation-card ${task.status === 'completed' ? 'completed' : ''} ${isOverdue ? 'overdue' : ''}`}
      onClick={() => onClick(task)}
    >
      <div className="card-header">
        <div className="avatar">{task.evaluateeName.charAt(0)}</div>
        <span className={`status-badge status-${task.status}`}>
          {task.status === 'pending' ? '待评估' : '已完成'}
        </span>
      </div>
      <div className="card-body">
        <h3 className="evaluatee-name">{task.evaluateeName}</h3>
        <p className="cycle-name">{task.cycleName}</p>
        <div className="card-meta">
          <div className="meta-item">
            <span className="meta-label">被评人邮箱</span>
            <span className="meta-value">{task.evaluateeEmail}</span>
          </div>
          <div className="meta-item">
            <span className="meta-label">截止日期</span>
            <span className={`meta-value ${isOverdue ? 'overdue-text' : ''}`}>{formatDate(task.deadline)}</span>
          </div>
        </div>
      </div>
      <div className="card-footer">
        {task.status === 'pending' ? (
          <button className="btn-primary" onClick={(e) => { e.stopPropagation(); onClick(task); }}>
            开始评估
          </button>
        ) : (
          <span className="completed-text">已完成于 {task.submittedAt ? formatDate(task.submittedAt) : ''}</span>
        )}
      </div>
    </div>
  );
};

export default EvaluationCard;
