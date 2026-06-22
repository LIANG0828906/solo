import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import FengMian from '../components/FengMian';
import { generateReport } from '../utils/api';
import type { Report as ReportType } from '../types';

const Report: React.FC = () => {
  const navigate = useNavigate();
  const [report, setReport] = useState<ReportType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadReport = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const reportData = await generateReport();
      setReport(reportData);
    } catch (err) {
      setError('生成报告失败，请稍后重试');
      console.error('Failed to load report:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  const handleBack = useCallback(() => {
    navigate('/');
  }, [navigate]);

  const getAchievementIcon = (index: number): string => {
    const icons = ['🏆', '🎖️', '⭐', '🎯', '📜'];
    return icons[index % icons.length];
  };

  if (loading) {
    return <div className="loading">正在生成《雅集录》...</div>;
  }

  if (error) {
    return (
      <div className="error">
        <p>{error}</p>
        <button className="btn" onClick={handleBack} style={{ marginTop: '20px' }}>
          返回雅集
        </button>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="error">
        <p>暂无报告数据</p>
        <button className="btn" onClick={handleBack} style={{ marginTop: '20px' }}>
          返回雅集
        </button>
      </div>
    );
  }

  return (
    <div style={{ animation: 'fadeIn 0.5s ease' }}>
      <div className="page-header">
        <h1 className="page-title">雅集录</h1>
        <p className="page-subtitle">
          {report.periodStart} — {report.periodEnd}
        </p>
      </div>

      <div className="ink-card" style={{ marginBottom: '24px' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '24px' }}>本旬雅集概览</h2>
        <div className="stats-grid">
          <div className="ink-card stat-card" style={{ animationDelay: '0.1s' }}>
            <div className="stat-value">{report.totalYaji}</div>
            <div className="stat-label">雅集总次数</div>
          </div>
          <div className="ink-card stat-card" style={{ animationDelay: '0.2s' }}>
            <div className="stat-value">{report.averageAtmosphere.toFixed(1)}</div>
            <div className="stat-label">平均氛围值</div>
          </div>
          <div className="ink-card stat-card" style={{ animationDelay: '0.3s' }}>
            <div className="stat-value">{(report.eventSuccessRate * 100).toFixed(0)}%</div>
            <div className="stat-label">事件处理成功率</div>
          </div>
        </div>

        <div style={{ marginTop: '24px' }}>
          <h3 style={{ marginBottom: '12px' }}>平均氛围水平</h3>
          <FengMian current={Math.round(report.averageAtmosphere)} max={100} />
        </div>
      </div>

      {report.achievements.length > 0 && (
        <div className="ink-card" style={{ marginBottom: '24px' }}>
          <h2 style={{ marginBottom: '20px' }}>特别成就</h2>
          <div className="achievement-list">
            {report.achievements.map((achievement, index) => (
              <div
                key={achievement.id}
                className="achievement-item"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="achievement-icon">{getAchievementIcon(index)}</div>
                <div>
                  <div style={{ fontWeight: 'bold', fontSize: '1.0625rem' }}>
                    {achievement.name}
                  </div>
                  <div style={{ color: 'var(--mo-qing)', fontSize: '0.875rem' }}>
                    {achievement.description}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="comment-section">
        <div style={{ fontSize: '3rem', marginBottom: '12px' }}>📝</div>
        <h3 style={{ marginBottom: '16px', color: 'var(--zhu-sha)' }}>史家评语</h3>
        <p className="comment-text">「{report.comment}」</p>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '32px' }}>
        <button className="btn btn-primary" onClick={handleBack}>
          开启新一旬雅集
        </button>
      </div>
    </div>
  );
};

export default Report;
