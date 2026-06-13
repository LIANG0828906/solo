import { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Post } from '../types';
import { analyzeSentiment } from '../utils/sentimentAnalyzer';
import AnimatedNumber from './AnimatedNumber';
import './Dashboard.css';

interface DashboardProps {
  posts: Post[];
  keyword: string;
}

function Dashboard({ posts, keyword }: DashboardProps) {
  const stats = useMemo(() => {
    const total = posts.length;
    
    let positiveCount = 0;
    let neutralCount = 0;
    let negativeCount = 0;
    let totalScore = 0;
    let hottestPost: Post | null = null;
    let maxLikes = -1;

    posts.forEach(post => {
      const allText = post.content + ' ' + post.comments.map(c => c.content).join(' ');
      const result = analyzeSentiment(allText);
      
      totalScore += result.score;
      
      if (result.label === 'positive') positiveCount++;
      else if (result.label === 'negative') negativeCount++;
      else neutralCount++;

      if (post.likes > maxLikes) {
        maxLikes = post.likes;
        hottestPost = post;
      }
    });

    const avgScore = total > 0 ? (totalScore / total + 1) / 2 : 0;

    return {
      total,
      avgScore,
      positiveCount,
      neutralCount,
      negativeCount,
      hottestPost,
      positivePercent: total > 0 ? (positiveCount / total) * 100 : 0,
      neutralPercent: total > 0 ? (neutralCount / total) * 100 : 0,
      negativePercent: total > 0 ? (negativeCount / total) * 100 : 0
    };
  }, [posts]);

  const pieData = [
    { name: '积极', value: stats.positiveCount, color: '#10b981' },
    { name: '中性', value: stats.neutralCount, color: '#6b7280' },
    { name: '消极', value: stats.negativeCount, color: '#ef4444' }
  ];

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1 className="dashboard-title">
          <span className="keyword-badge">{keyword}</span>
          情感分析报告
        </h1>
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-card glass">
          <div className="card-icon posts-icon">📊</div>
          <div className="card-content">
            <p className="card-label">总帖子数</p>
            <p className="card-value">
              <AnimatedNumber value={stats.total} duration={500} />
            </p>
          </div>
        </div>

        <div className="dashboard-card glass">
          <div className="card-icon score-icon">📈</div>
          <div className="card-content">
            <p className="card-label">平均情感得分</p>
            <div className="score-display">
              <div className="progress-bar-container">
                <div
                  className="progress-bar"
                  style={{
                    width: `${stats.avgScore * 100}%`,
                    background: stats.avgScore > 0.6
                      ? 'linear-gradient(90deg, #10b981, #34d399)'
                      : stats.avgScore > 0.4
                      ? 'linear-gradient(90deg, #f59e0b, #fbbf24)'
                      : 'linear-gradient(90deg, #ef4444, #f87171)'
                  }}
                />
              </div>
              <span className="score-value">
                {(stats.avgScore * 100).toFixed(1)}分
              </span>
            </div>
          </div>
        </div>

        <div className="dashboard-card glass pie-card">
          <div className="card-content pie-content">
            <p className="card-label">情感分布</p>
            <div className="pie-chart-container">
              <ResponsiveContainer width="100%" height={120}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={35}
                    outerRadius={55}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: '#16213e',
                      border: '1px solid rgba(224, 231, 255, 0.1)',
                      borderRadius: '8px',
                      color: '#e0e7ff'
                    }}
                    formatter={(value: number, name: string) => [`${value}条`, name]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="pie-legend">
              <span className="legend-item positive">
                <span className="legend-dot"></span>
                积极 {stats.positivePercent.toFixed(1)}%
              </span>
              <span className="legend-item neutral">
                <span className="legend-dot"></span>
                中性 {stats.neutralPercent.toFixed(1)}%
              </span>
              <span className="legend-item negative">
                <span className="legend-dot"></span>
                消极 {stats.negativePercent.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        <div className="dashboard-card glass">
          <div className="card-icon hot-icon">🔥</div>
          <div className="card-content">
            <p className="card-label">最热帖子</p>
            <p className="hottest-title" title={stats.hottestPost?.content}>
              {stats.hottestPost?.content?.slice(0, 30) || '-'}
              {stats.hottestPost?.content && stats.hottestPost.content.length > 30 ? '...' : ''}
            </p>
            <p className="hottest-likes">
              ❤️ <AnimatedNumber value={stats.hottestPost?.likes || 0} duration={500} /> 点赞
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
