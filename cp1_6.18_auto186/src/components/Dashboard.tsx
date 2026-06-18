import { useEffect } from 'react';
import { useStore } from '../stores/useStore';
import { Image, Calendar, MessageSquare } from 'lucide-react';

export default function Dashboard() {
  const { stats, fetchStats } = useStore();

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const cards = [
    {
      label: '总作品数',
      value: stats.totalPhotos,
      icon: Image,
      color: '#D4AF37',
      animClass: 'slide-in-1'
    },
    {
      label: '总预约数',
      value: stats.totalBookings,
      icon: Calendar,
      color: '#2C3E50',
      animClass: 'slide-in-2'
    },
    {
      label: '总评论数',
      value: stats.totalComments,
      icon: MessageSquare,
      color: '#3498DB',
      animClass: 'slide-in-3'
    }
  ];

  return (
    <div className="dashboard-page page">
      <div className="container">
        <h1 className="page-title">数据统计</h1>
        <p className="page-subtitle">工作室运营数据概览</p>

        <div className="stats-grid">
          {cards.map(card => (
            <div key={card.label} className={`stat-card glass-card ${card.animClass}`}>
              <div className="stat-icon" style={{ backgroundColor: `${card.color}15`, color: card.color }}>
                <card.icon size={32} />
              </div>
              <div className="stat-info">
                <span className="stat-value">{card.value}</span>
                <span className="stat-label">{card.label}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="dashboard-tips glass-card">
          <h3>运营小贴士</h3>
          <ul>
            <li>定期更新作品集，保持客户新鲜感</li>
            <li>及时回复客户预约，提升服务体验</li>
            <li>鼓励满意的客户留下评论，建立口碑</li>
            <li>根据热门分类调整拍摄重点方向</li>
          </ul>
        </div>
      </div>

      <style>{`
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
          margin-bottom: 32px;
        }
        .stat-card {
          padding: 28px;
          display: flex;
          align-items: center;
          gap: 20px;
        }
        .stat-icon {
          width: 72px;
          height: 72px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .stat-info {
          display: flex;
          flex-direction: column;
        }
        .stat-value {
          font-family: var(--font-display);
          font-size: 42px;
          font-weight: 700;
          color: var(--color-primary);
          line-height: 1.1;
        }
        .stat-label {
          font-size: 14px;
          color: #888;
          margin-top: 4px;
          font-weight: 500;
        }
        .dashboard-tips {
          padding: 28px;
        }
        .dashboard-tips h3 {
          font-size: 20px;
          margin-bottom: 16px;
          color: var(--color-primary);
        }
        .dashboard-tips ul {
          list-style: none;
          padding: 0;
        }
        .dashboard-tips li {
          position: relative;
          padding: 8px 0 8px 24px;
          color: #555;
          font-size: 14px;
        }
        .dashboard-tips li::before {
          content: '';
          position: absolute;
          left: 0;
          top: 16px;
          width: 10px;
          height: 2px;
          background: var(--color-accent);
        }
        @media (max-width: 900px) {
          .stats-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}
