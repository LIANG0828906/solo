import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuthStore } from '../stores/authStore';
import './StatsPage.css';

interface StatsData {
  total_words: number;
  mastered_words: number;
  streak_days: number;
  weekly_data: number[];
}

function StatsPage() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuthStore();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get('/api/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getWeekDays = () => {
    const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    const result = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      result.push({
        day: days[date.getDay()],
        date: `${date.getMonth() + 1}/${date.getDate()}`,
      });
    }
    return result;
  };

  const getHeatColor = (count: number, maxCount: number) => {
    if (count === 0) return '#f0ebe6';
    const ratio = Math.min(count / Math.max(maxCount, 1), 1);
    const lightness = 85 - ratio * 35;
    return `hsl(110, 25%, ${lightness}%)`;
  };

  const weekDays = getWeekDays();
  const maxWeekly = stats ? Math.max(...stats.weekly_data, 1) : 1;

  if (isLoading) {
    return (
      <div className="stats-page">
        <div className="learn-loading">
          <div className="loading-spinner"></div>
          <span>加载统计数据中...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="stats-page">
      <div className="page-header">
        <h1 className="page-title">学习统计</h1>
      </div>

      <div className="profile-section card">
        {user && (
          <div className="profile-info">
            <img
              src={user.avatar_url}
              alt={user.username}
              className="profile-avatar"
            />
            <div className="profile-details">
              <h2 className="profile-name">{user.username}</h2>
              <p className="profile-email">{user.email}</p>
            </div>
          </div>
        )}

        <div className="streak-badge">
          <span className="streak-icon">🔥</span>
          <span className="streak-count">{stats?.streak_days || 0}</span>
          <span className="streak-label">连续学习天数</span>
        </div>
      </div>

      <div className="stats-cards">
        <div className="stat-card card">
          <div className="stat-icon">📚</div>
          <div className="stat-content">
            <div className="stat-number">{stats?.total_words || 0}</div>
            <div className="stat-label">总词汇量</div>
          </div>
        </div>

        <div className="stat-card card">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <div className="stat-number">{stats?.mastered_words || 0}</div>
            <div className="stat-label">已掌握</div>
          </div>
        </div>

        <div className="stat-card card">
          <div className="stat-icon">📈</div>
          <div className="stat-content">
            <div className="stat-number">
              {stats && stats.total_words > 0
                ? Math.round((stats.mastered_words / stats.total_words) * 100)
                : 0}%
            </div>
            <div className="stat-label">掌握率</div>
          </div>
        </div>

        <div className="stat-card card">
          <div className="stat-icon">📅</div>
          <div className="stat-content">
            <div className="stat-number">{stats?.streak_days || 0}</div>
            <div className="stat-label">连续天数</div>
          </div>
        </div>
      </div>

      <div className="heatmap-section card">
        <div className="section-header">
          <h3 className="section-title">📊 本周学习热力图</h3>
          <span className="section-subtitle">每天学习的卡片数量</span>
        </div>

        <div className="heatmap-grid">
          {stats?.weekly_data.map((count, index) => (
            <div key={index} className="heatmap-item">
              <div
                className="heatmap-cell"
                style={{
                  backgroundColor: getHeatColor(count, maxWeekly),
                }}
                title={`${weekDays[index].date}: ${count} 个卡片`}
              >
                <span className="heatmap-count">{count}</span>
              </div>
              <div className="heatmap-day">{weekDays[index].day}</div>
              <div className="heatmap-date">{weekDays[index].date}</div>
            </div>
          ))}
        </div>

        <div className="heatmap-legend">
          <span className="legend-label">少</span>
          <div className="legend-colors">
            {['#f0ebe6', '#d9e5d6', '#b8cfb3', '#96b990', '#75a36d'].map(
              (color, i) => (
                <div
                  key={i}
                  className="legend-color"
                  style={{ backgroundColor: color }}
                />
              )
            )}
          </div>
          <span className="legend-label">多</span>
        </div>
      </div>

      <div className="tips-section card">
        <h3 className="tips-title">💡 学习建议</h3>
        <ul className="tips-content">
          <li>每天坚持学习5-10个新词汇，效果最佳</li>
          <li>及时复习标记为"需复习"的词汇</li>
          <li>结合例句记忆，加深语境理解</li>
          <li>保持连续学习，养成良好习惯</li>
        </ul>
      </div>
    </div>
  );
}

export default StatsPage;
