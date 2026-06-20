import { useEffect, useState } from 'react';
import { useCardStore } from '../store/useCardStore';
import { CATEGORIES } from '../types';

const StatsPage = () => {
  const { stats, fetchStats } = useCardStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await fetchStats();
      setLoading(false);
    };
    load();
  }, [fetchStats]);

  if (loading) {
    return (
      <div className="page-transition page-container">
        <div className="loading">加载中...</div>
      </div>
    );
  }

  const maxCount = stats
    ? Math.max(...Object.values(stats.categoryCounts), 1)
    : 1;

  return (
    <div className="page-transition page-container">
      <div className="stats-container">
        <h1 className="page-title" style={{ marginBottom: 32 }}>
          学习统计
        </h1>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-number">{stats?.total ?? 0}</div>
            <div className="stat-label">总卡片数</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{stats?.reviewed ?? 0}</div>
            <div className="stat-label">已复习</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{stats?.todayReviewed ?? 0}</div>
            <div className="stat-label">今日复习</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">
              {stats ? `${Math.round(stats.rememberRate * 100)}%` : '0%'}
            </div>
            <div className="stat-label">记忆率</div>
          </div>
        </div>

        <div className="chart-section">
          <h2 className="chart-title">类别分布</h2>
          <div className="bar-chart">
            {CATEGORIES.map((cat) => {
              const count = stats?.categoryCounts[cat] ?? 0;
              const height = count === 0 ? 4 : (count / maxCount) * 200;
              return (
                <div key={cat} className="bar-item">
                  <span className="bar-number">{count}</span>
                  <div className="bar-fill" style={{ height: `${height}px` }}></div>
                  <span className="bar-label">{cat}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsPage;
