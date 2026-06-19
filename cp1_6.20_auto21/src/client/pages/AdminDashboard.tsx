import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../utils/api';
import StatsCharts from '../components/StatsCharts';
import './AdminDashboard.css';

export default function AdminDashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const { stats, setStats, addNotification } = useApp();

  const loadStats = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await api.getStats();
      setStats(data);
    } catch (error) {
      addNotification('error', '加载统计数据失败');
    } finally {
      setIsLoading(false);
    }
  }, [setStats, addNotification]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const statusLabels: Record<string, string> = {
    pending: '待处理',
    processing: '处理中',
    completed: '已完成',
    failed: '无法修复'
  };

  const priorityLabels: Record<string, string> = {
    high: '高优先级',
    medium: '中优先级',
    low: '低优先级'
  };

  return (
    <div className="admin-dashboard">
      <div className="page-header">
        <h1 className="page-title">统计看板</h1>
        <div className="header-actions">
          <button className="refresh-btn" onClick={loadStats}>
            🔄 刷新数据
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="loading-state">
          <div className="loading-spinner" />
          <p>加载中...</p>
        </div>
      ) : stats ? (
        <>
          <div className="stats-overview">
            <div className="stat-card total">
              <div className="stat-icon">📊</div>
              <div className="stat-content">
                <div className="stat-value">{stats.totalCount}</div>
                <div className="stat-label">总工单数</div>
              </div>
            </div>

            {Object.entries(stats.statusCounts).map(([status, count]) => (
              <div key={status} className={`stat-card ${status}`}>
                <div className="stat-content">
                  <div className="stat-value">{count}</div>
                  <div className="stat-label">{statusLabels[status]}</div>
                </div>
                <div className="stat-percentage">
                  {stats.totalCount > 0 ? ((count / stats.totalCount) * 100).toFixed(1) : 0}%
                </div>
              </div>
            ))}
          </div>

          <div className="stats-overview">
            {Object.entries(stats.priorityCounts).map(([priority, count]) => (
              <div key={priority} className={`stat-card priority-${priority}`}>
                <div className="stat-content">
                  <div className="stat-value">{count}</div>
                  <div className="stat-label">{priorityLabels[priority]}</div>
                </div>
                <div className="stat-percentage">
                  {stats.totalCount > 0 ? ((count / stats.totalCount) * 100).toFixed(1) : 0}%
                </div>
              </div>
            ))}
          </div>

          <StatsCharts stats={stats} />
        </>
      ) : null}
    </div>
  );
}
