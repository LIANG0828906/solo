import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import apiClient from '../services/apiClient';
import { useAppStore } from '../store/appStore';
import type { Interview } from '../types';

const EvaluationDashboard: React.FC = () => {
  const navigate = useNavigate();
  const interviews = useAppStore((state) => state.interviews);
  const setInterviews = useAppStore((state) => state.setInterviews);
  const setCurrentInterview = useAppStore((state) => state.setCurrentInterview);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadInterviews();
  }, []);

  const loadInterviews = async () => {
    setIsLoading(true);
    try {
      const data = await apiClient.getInterviewList();
      setInterviews(data);
    } catch (error) {
      console.error('加载面试列表失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEvaluate = (interview: Interview) => {
    setCurrentInterview(interview);
    navigate(`/evaluation/${interview.id}`);
  };

  const handleViewResults = (interview: Interview) => {
    setCurrentInterview(interview);
    navigate(`/results/${interview.id}`);
  };

  const getStatusBadge = (status: Interview['status']) => {
    const statusMap = {
      pending: { label: '待作答', color: '#f59e0b' },
      in_progress: { label: '进行中', color: '#3b82f6' },
      completed: { label: '待评估', color: '#8b5cf6' },
      evaluated: { label: '已评估', color: '#10b981' },
    };
    const info = statusMap[status];
    return (
      <span className="status-badge" style={{ background: `${info.color}20`, color: info.color }}>
        {info.label}
      </span>
    );
  };

  const pendingInterviews = interviews.filter((i) => i.status === 'completed');
  const evaluatedInterviews = interviews.filter((i) => i.status === 'evaluated');

  return (
    <div className="dashboard-container animate-fade-in">
      <header className="dashboard-header">
        <div className="header-content">
          <h1>评估中心</h1>
          <p>查看待评估面试，对候选人进行评分和反馈</p>
        </div>
        <div className="stats-row">
          <div className="stat-card">
            <span className="stat-number">{pendingInterviews.length}</span>
            <span className="stat-label">待评估</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">{evaluatedInterviews.length}</span>
            <span className="stat-label">已评估</span>
          </div>
        </div>
      </header>

      <main className="dashboard-content">
        <section className="section">
          <div className="section-header">
            <h2>待评估面试</h2>
            <span className="section-count">{pendingInterviews.length} 个</span>
          </div>

          {isLoading ? (
            <div className="loading-state">
              <div className="spinner" />
              <p>加载中...</p>
            </div>
          ) : pendingInterviews.length === 0 ? (
            <div className="empty-state card">
              <div className="empty-icon">📋</div>
              <h3>暂无待评估面试</h3>
              <p>所有面试都已完成评估</p>
            </div>
          ) : (
            <div className="interview-grid">
              {pendingInterviews.map((interview) => (
                <div
                  key={interview.id}
                  className="interview-card card"
                >
                  <div className="card-header">
                    <h3 className="card-title">{interview.title}</h3>
                    {getStatusBadge(interview.status)}
                  </div>

                  <div className="card-body">
                    <div className="info-row">
                      <span className="info-label">候选人</span>
                      <span className="info-value">
                        {interview.candidateName || interview.candidateEmail}
                      </span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">问题数量</span>
                      <span className="info-value">{interview.questions.length} 题</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">创建时间</span>
                      <span className="info-value">
                        {dayjs(interview.createdAt).format('YYYY-MM-DD HH:mm')}
                      </span>
                    </div>
                  </div>

                  <div className="card-footer">
                    <button
                      className="btn btn-primary evaluate-btn"
                      onClick={() => handleEvaluate(interview)}
                    >
                      开始评估
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {evaluatedInterviews.length > 0 && (
          <section className="section">
            <div className="section-header">
              <h2>已评估面试</h2>
              <span className="section-count">{evaluatedInterviews.length} 个</span>
            </div>

            <div className="interview-grid">
              {evaluatedInterviews.map((interview) => (
                <div
                  key={interview.id}
                  className="interview-card card"
                >
                  <div className="card-header">
                    <h3 className="card-title">{interview.title}</h3>
                    {getStatusBadge(interview.status)}
                  </div>

                  <div className="card-body">
                    <div className="info-row">
                      <span className="info-label">候选人</span>
                      <span className="info-value">
                        {interview.candidateName || interview.candidateEmail}
                      </span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">问题数量</span>
                      <span className="info-value">{interview.questions.length} 题</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">创建时间</span>
                      <span className="info-value">
                        {dayjs(interview.createdAt).format('YYYY-MM-DD HH:mm')}
                      </span>
                    </div>
                  </div>

                  <div className="card-footer">
                    <button
                      className="btn btn-secondary view-btn"
                      onClick={() => handleViewResults(interview)}
                    >
                      查看结果
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      <style>{`
        .dashboard-container {
          min-height: 100vh;
          padding-bottom: 40px;
        }
        .dashboard-header {
          background: linear-gradient(135deg, var(--color-primary-dark) 0%, var(--color-primary) 100%);
          padding: 40px 20px 32px;
          border-bottom: 1px solid var(--color-border);
        }
        .header-content {
          max-width: 1200px;
          margin: 0 auto 24px;
        }
        .header-content h1 {
          font-size: 32px;
          margin-bottom: 8px;
          color: var(--color-text-primary);
        }
        .header-content p {
          color: var(--color-text-secondary);
        }
        .stats-row {
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          gap: 16px;
        }
        .stat-card {
          flex: 1;
          max-width: 200px;
          background: var(--color-bg-card);
          border-radius: 12px;
          padding: 20px;
          border: 1px solid var(--color-border);
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .stat-number {
          font-size: 32px;
          font-weight: bold;
          color: var(--color-accent-blue);
        }
        .stat-label {
          font-size: 14px;
          color: var(--color-text-secondary);
        }
        .dashboard-content {
          max-width: 1200px;
          margin: 0 auto;
          padding: 32px 20px;
        }
        .section {
          margin-bottom: 40px;
        }
        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }
        .section-header h2 {
          font-size: 20px;
          color: var(--color-text-primary);
        }
        .section-count {
          font-size: 14px;
          color: var(--color-text-secondary);
          background: var(--color-bg-card);
          padding: 4px 12px;
          border-radius: 12px;
        }
        .loading-state {
          text-align: center;
          padding: 60px;
          color: var(--color-text-secondary);
        }
        .spinner {
          width: 32px;
          height: 32px;
          border: 3px solid rgba(59, 130, 246, 0.3);
          border-top-color: var(--color-accent-blue);
          border-radius: 50%;
          margin: 0 auto 16px;
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .empty-state {
          text-align: center;
          padding: 48px;
        }
        .empty-icon {
          font-size: 48px;
          margin-bottom: 16px;
        }
        .empty-state h3 {
          font-size: 18px;
          margin-bottom: 8px;
          color: var(--color-text-primary);
        }
        .empty-state p {
          color: var(--color-text-muted);
        }
        .interview-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 20px;
        }
        .interview-card {
          padding: 20px;
          display: flex;
          flex-direction: column;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .interview-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px -5px rgba(0, 0, 0, 0.2);
        }
        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 16px;
        }
        .card-title {
          font-size: 18px;
          color: var(--color-text-primary);
          font-weight: 600;
        }
        .status-badge {
          padding: 4px 10px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 500;
        }
        .card-body {
          flex: 1;
          margin-bottom: 16px;
        }
        .info-row {
          display: flex;
          justify-content: space-between;
          padding: 6px 0;
        }
        .info-label {
          color: var(--color-text-muted);
          font-size: 14px;
        }
        .info-value {
          color: var(--color-text-primary);
          font-size: 14px;
          font-weight: 500;
          text-align: right;
          max-width: 60%;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .card-footer {
          padding-top: 16px;
          border-top: 1px solid var(--color-border);
        }
        .evaluate-btn,
        .view-btn {
          width: 100%;
          padding: 10px;
        }
        @media (max-width: 640px) {
          .header-content h1 {
            font-size: 24px;
          }
          .stats-row {
            flex-direction: column;
          }
          .stat-card {
            max-width: none;
          }
          .interview-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default EvaluationDashboard;
