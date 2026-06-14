import { useState, useEffect, useRef } from 'react';
import axios from 'axios';

interface Visitor {
  id: string;
  nickname: string;
  startTime: number;
  duration: number;
  completionRate: number;
  artworkStayTimes: Record<string, number>;
}

interface StatsData {
  recentVisitors: Visitor[];
  artworkStats: Record<string, number>;
  totalVisitors: number;
}

interface StatsProps {
  exhibition: any;
}

function Stats({ exhibition }: StatsProps) {
  const [statsData, setStatsData] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const listRef = useRef<HTMLDivElement>(null);

  const artworks = exhibition?.artworks || [];

  const fetchStats = async () => {
    try {
      const res = await axios.get('/api/visitors');
      setStatsData(res.data);
    } catch (err) {
      console.error('获取统计数据失败:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, []);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getMaxStayTime = () => {
    if (!statsData?.artworkStats) return 1;
    const values = Object.values(statsData.artworkStats);
    return Math.max(...values, 1);
  };

  const getArtworkName = (artworkId: string) => {
    const artwork = artworks.find((a: any) => a.id === artworkId);
    return artwork?.name || '未知作品';
  };

  const sortedArtworkStats = statsData?.artworkStats
    ? Object.entries(statsData.artworkStats).sort((a, b) => b[1] - a[1])
    : [];

  return (
    <div style={{ display: 'flex', height: '100%' }}>
      <div style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>
        <h1 style={{ fontSize: '24px', marginBottom: '24px' }}>数据统计</h1>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '32px' }}>
          <div className="card">
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px' }}>总访客数</div>
            <div style={{ fontSize: '32px', fontWeight: '700', color: 'var(--accent)' }}>
              {statsData?.totalVisitors || 0}
            </div>
          </div>
          <div className="card">
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px' }}>作品数量</div>
            <div style={{ fontSize: '32px', fontWeight: '700', color: 'var(--success)' }}>
              {artworks.length}
            </div>
          </div>
          <div className="card">
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px' }}>平均参观时长</div>
            <div style={{ fontSize: '32px', fontWeight: '700', color: 'var(--warning)' }}>
              {statsData?.recentVisitors.length 
                ? formatDuration(Math.floor(
                    statsData.recentVisitors.reduce((sum, v) => sum + v.duration, 0) / 
                    statsData.recentVisitors.length
                  ))
                : '0:00'
              }
            </div>
          </div>
        </div>

        <div className="card" style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '18px', marginBottom: '20px' }}>作品停留时长排行</h2>
          
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>加载中...</div>
          ) : sortedArtworkStats.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>暂无数据</div>
          ) : (
            <div className="bar-chart" style={{ height: '250px' }}>
              {sortedArtworkStats.map(([artworkId, time]) => {
                const maxTime = getMaxStayTime();
                const heightPercent = (time / maxTime) * 100;
                return (
                  <div key={artworkId} className="bar-item">
                    <div 
                      className="bar" 
                      style={{ 
                        height: `${heightPercent}%`,
                        width: '36px',
                      }} 
                    />
                    <div className="bar-label" title={getArtworkName(artworkId)}>
                      {getArtworkName(artworkId)}
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                      {formatDuration(Math.floor(time))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="card">
          <h2 style={{ fontSize: '18px', marginBottom: '16px' }}>最近访客</h2>
          
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>加载中...</div>
          ) : (
            <div className="visitor-list">
              {statsData?.recentVisitors.map((visitor, index) => (
                <div key={visitor.id} className="visitor-item">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ 
                      width: '28px', 
                      height: '28px', 
                      borderRadius: '50%', 
                      background: `hsl(${index * 36}, 70%, 60%)`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                      color: 'white',
                      fontWeight: 'bold',
                    }}>
                      {visitor.nickname.charAt(0)}
                    </span>
                    <span className="visitor-name">{visitor.nickname}</span>
                  </div>
                  <div className="visitor-info">
                    <span>⏱ {formatDuration(visitor.duration)}</span>
                    <span>✓ {visitor.completionRate}%</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="stats-panel">
        <div className="stats-title">实时数据</div>
        
        <div className="stats-section">
          <div className="stats-section-title">概览</div>
          <div style={{ 
            background: 'var(--bg-tertiary)', 
            borderRadius: 'var(--border-radius-sm)', 
            padding: '16px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>在线访客</span>
              <span style={{ color: 'var(--success)', fontWeight: '600' }}>● 实时更新</span>
            </div>
            <div style={{ fontSize: '28px', fontWeight: '700' }}>
              {statsData?.recentVisitors.length || 0}
            </div>
          </div>
        </div>

        <div className="stats-section">
          <div className="stats-section-title">热门作品 TOP 5</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {sortedArtworkStats.slice(0, 5).map(([artworkId, time], index) => (
              <div 
                key={artworkId}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px',
                  background: 'var(--bg-tertiary)',
                  borderRadius: 'var(--border-radius-sm)',
                }}
              >
                <span style={{ 
                  width: '22px', 
                  height: '22px', 
                  borderRadius: '50%', 
                  background: index === 0 ? '#fbbf24' : index === 1 ? '#94a3b8' : index === 2 ? '#d97706' : 'var(--bg-secondary)',
                  color: index < 3 ? 'white' : 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '11px',
                  fontWeight: 'bold',
                }}>
                  {index + 1}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ 
                    fontSize: '13px', 
                    color: 'var(--text-primary)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}>
                    {getArtworkName(artworkId)}
                  </div>
                </div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  {formatDuration(Math.floor(time))}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="stats-section">
          <div className="stats-section-title">最近访客</div>
          <div 
            ref={listRef}
            style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '6px',
              maxHeight: '400px',
              overflowY: 'auto',
            }}
          >
            {statsData?.recentVisitors.map((visitor) => (
              <div 
                key={visitor.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 10px',
                  background: 'var(--bg-tertiary)',
                  borderRadius: 'var(--border-radius-sm)',
                  fontSize: '12px',
                  transition: 'all 0.2s ease',
                }}
              >
                <span style={{ color: 'var(--text-primary)', fontWeight: '500' }}>
                  {visitor.nickname}
                </span>
                <div style={{ display: 'flex', gap: '8px', color: 'var(--text-muted)' }}>
                  <span>{formatDuration(visitor.duration)}</span>
                  <span>{visitor.completionRate}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ 
          marginTop: 'auto', 
          paddingTop: '16px', 
          borderTop: '1px solid var(--bg-tertiary)',
          fontSize: '11px',
          color: 'var(--text-muted)',
          textAlign: 'center',
        }}>
          每 5 秒自动刷新
        </div>
      </div>
    </div>
  );
}

export default Stats;
