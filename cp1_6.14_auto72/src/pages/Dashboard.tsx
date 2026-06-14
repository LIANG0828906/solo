import React from 'react';
import type { Cat, ShelterStats } from '../types';

interface DashboardProps {
  stats: ShelterStats | null;
  cats: Cat[];
}

const Dashboard: React.FC<DashboardProps> = ({ stats, cats }) => {
  const pendingCats = cats.filter(c => c.area === 'reception');
  const examiningCats = cats.filter(c => c.area === 'checkup');

  const statItems = stats ? [
    { label: '总猫咪数', value: stats.totalCats, icon: '🐱', color: '#FF8C5A' },
    { label: '健康猫咪', value: stats.healthyCats, icon: '💚', color: '#7CB342' },
    { label: '轻度伤病', value: stats.mildCats, icon: '💛', color: '#FFB74D' },
    { label: '重症监护', value: stats.severeCats, icon: '❤️', color: '#EF5350' },
    { label: '待领养', value: stats.adoptedCats, icon: '🏠', color: '#BA68C8' },
    { label: '待体检', value: stats.pendingExams, icon: '🔍', color: '#42A5F5' },
  ] : [];

  return (
    <aside className="dashboard">
      <div className="dashboard-header">
        <h2>📊 今日概览</h2>
      </div>

      <div className="stats-grid">
        {statItems.map((item, index) => (
          <div
            key={index}
            className="stat-card"
            style={{ borderLeftColor: item.color }}
          >
            <div className="stat-icon">{item.icon}</div>
            <div className="stat-info">
              <div className="stat-value" style={{ color: item.color }}>
                {item.value}
              </div>
              <div className="stat-label">{item.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="dashboard-section">
        <h3>📋 待处理任务</h3>
        <div className="task-list">
          {pendingCats.length > 0 && (
            <div className="task-item task-warning">
              <span className="task-icon">⚠️</span>
              <div className="task-content">
                <div className="task-title">
                  {pendingCats.length} 只猫咪等待接收
                </div>
                <div className="task-desc">
                  {pendingCats.map(c => c.name).join('、')}
                </div>
              </div>
            </div>
          )}

          {examiningCats.length > 0 && (
            <div className="task-item task-info">
              <span className="task-icon">🏥</span>
              <div className="task-content">
                <div className="task-title">
                  {examiningCats.length} 只猫咪体检中
                </div>
                <div className="task-desc">
                  {examiningCats.map(c => c.name).join('、')}
                </div>
              </div>
            </div>
          )}

          {pendingCats.length === 0 && examiningCats.length === 0 && (
            <div className="task-item task-success">
              <span className="task-icon">✅</span>
              <div className="task-content">
                <div className="task-title">暂无待处理任务</div>
                <div className="task-desc">救助站运行良好！</div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="dashboard-section">
        <h3>💡 操作提示</h3>
        <ul className="tips-list">
          <li>将接待区的猫咪<b>拖拽</b>到体检室进行检查</li>
          <li>体检完成后猫咪会自动分配到对应猫舍</li>
          <li>点击猫舍格子查看猫咪详情</li>
          <li>在详情页可以将猫咪安排到领养区</li>
        </ul>
      </div>
    </aside>
  );
};

export default Dashboard;
