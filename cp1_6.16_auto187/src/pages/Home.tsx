import { useEffect } from 'react';
import { Spin, Empty } from 'antd';
import { TrophyOutlined } from '@ant-design/icons';
import { useAppStore } from '@/store';
import EventCard from '@/components/EventCard';

export default function Home() {
  const events = useAppStore(s => s.events);
  const loading = useAppStore(s => s.loading);
  const error = useAppStore(s => s.error);
  const loadAll = useAppStore(s => s.loadAll);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  if (loading && events.length === 0) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (error && events.length === 0) {
    return (
      <div className="empty-state">
        <Empty description={`加载失败: ${error}`} />
      </div>
    );
  }

  const upcoming = events.filter(e => e.status === 'upcoming');
  const live = events.filter(e => e.status === 'live');
  const finished = events.filter(e => e.status === 'finished');

  const renderSection = (title: string, icon: string, list: typeof events, color: string) => {
    if (list.length === 0) return null;
    return (
      <div style={{ marginBottom: 32 }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          marginBottom: 16,
        }}>
          <span style={{ fontSize: 20 }}>{icon}</span>
          <h3 style={{
            color,
            fontSize: 18,
            fontWeight: 700,
            margin: 0,
          }}>
            {title}
          </h3>
          <span style={{
            padding: '2px 10px',
            background: 'rgba(255,255,255,0.05)',
            borderRadius: 10,
            color: '#8c8c8c',
            fontSize: 12,
          }}>
            {list.length}
          </span>
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: 16,
        }}>
          {list.map(event => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      </div>
    );
  };

  if (events.length === 0) {
    return (
      <div className="empty-state">
        <Empty description="暂无赛事" />
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          marginBottom: 8,
        }}>
          <TrophyOutlined style={{ fontSize: 28, color: '#faad14' }} />
          <h2 style={{ color: '#fff', fontSize: 28, margin: 0, fontWeight: 700 }}>
            赛事大厅
          </h2>
        </div>
        <p style={{ color: '#8c8c8c', margin: 0 }}>
          选择您感兴趣的赛事进行投注，赢取积分登顶排行榜！
        </p>
      </div>

      {renderSection('🔥 进行中', '🎮', live, '#52c41a')}
      {renderSection('⏰ 即将开始', '🏟️', upcoming, '#1677ff')}
      {renderSection('✅ 已结束', '📊', finished, '#8c8c8c')}
    </div>
  );
}
