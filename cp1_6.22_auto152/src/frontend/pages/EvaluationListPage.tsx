import React from 'react';
import EvaluationCard from '../components/EvaluationCard';
import { EvaluationTask } from '../../shared/types';

interface Props {
  tasks: EvaluationTask[];
  loading: boolean;
  onSelectTask: (task: EvaluationTask) => void;
  currentUser: string;
  currentUserName: string;
}

const EvaluationListPage: React.FC<Props> = ({ tasks, loading, onSelectTask, currentUserName }) => {
  const pendingTasks = tasks.filter((t) => t.status === 'pending');
  const completedTasks = tasks.filter((t) => t.status === 'completed');

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading">加载中...</div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>绩效评估任务</h1>
        <p className="page-subtitle">欢迎，{currentUserName}。以下是您的评估任务列表。</p>
      </div>

      {pendingTasks.length > 0 && (
        <section className="task-section">
          <h2 className="section-title">待评估 ({pendingTasks.length})</h2>
          <div className="card-grid">
            {pendingTasks.map((task) => (
              <EvaluationCard key={task.id} task={task} onClick={onSelectTask} />
            ))}
          </div>
        </section>
      )}

      {completedTasks.length > 0 && (
        <section className="task-section">
          <h2 className="section-title">已完成 ({completedTasks.length})</h2>
          <div className="card-grid">
            {completedTasks.map((task) => (
              <EvaluationCard key={task.id} task={task} onClick={onSelectTask} />
            ))}
          </div>
        </section>
      )}

      {tasks.length === 0 && (
        <div className="empty-state">
          <p>暂无评估任务</p>
        </div>
      )}
    </div>
  );
};

export default EvaluationListPage;
