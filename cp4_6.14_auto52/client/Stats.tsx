import { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { ExhibitionData, Artwork } from './App';

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
  exhibition: ExhibitionData | null;
}

const GRADIENT_START = '#6366f1';
const GRADIENT_END = '#a855f7';

function BarChartCanvas({ 
  data, 
  artworks, 
  width = 600, 
  height = 200 
}: { 
  data: [string, number][]; 
  artworks: Artwork[]; 
  width?: number; 
  height?: number; 
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hoveredIndex = useRef<number | null>(null);
  const animatedHeights = useRef<number[]>([]);
  const rafRef = useRef<number>();

  const getArtworkName = (id: string) => {
    const art = artworks.find(a => a.id === id);
    return art?.name || '未知作品';
  };

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, width, height);

    if (data.length === 0) {
      ctx.fillStyle = '#94a3b8';
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('暂无数据', width / 2, height / 2);
      return;
    }

    const paddingTop = 20;
    const paddingBottom = 50;
    const chartHeight = height - paddingTop - paddingBottom;
    const barWidth = 36;
    const gap = 8;
    const totalBarsWidth = data.length * barWidth + (data.length - 1) * gap;
    const startX = Math.max(0, (width - totalBarsWidth) / 2);

    const maxValue = Math.max(...data.map(([, v]) => v), 1);

    if (animatedHeights.current.length !== data.length) {
      animatedHeights.current = data.map(() => 0);
    }

    data.forEach(([, value], i) => {
      const targetHeight = (value / maxValue) * chartHeight;
      animatedHeights.current[i] += (targetHeight - animatedHeights.current[i]) * 0.1;
    });

    data.forEach(([artworkId, value], i) => {
      const x = startX + i * (barWidth + gap);
      const barHeight = animatedHeights.current[i];
      const y = paddingTop + chartHeight - barHeight;

      const gradient = ctx.createLinearGradient(x, y, x, y + barHeight);
      gradient.addColorStop(0, GRADIENT_END);
      gradient.addColorStop(1, GRADIENT_START);

      ctx.fillStyle = gradient;
      ctx.beginPath();
      const radius = Math.min(4, barHeight / 2);
      ctx.moveTo(x + radius, y);
      ctx.lineTo(x + barWidth - radius, y);
      ctx.quadraticCurveTo(x + barWidth, y, x + barWidth, y + radius);
      ctx.lineTo(x + barWidth, y + barHeight);
      ctx.lineTo(x, y + barHeight);
      ctx.lineTo(x, y + radius);
      ctx.quadraticCurveTo(x, y, x + radius, y);
      ctx.closePath();
      ctx.fill();

      if (hoveredIndex.current === i) {
        ctx.shadowColor = 'rgba(99, 102, 241, 0.5)';
        ctx.shadowBlur = 12;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      ctx.fillStyle = '#475569';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      const mins = Math.floor(value / 60);
      const secs = Math.floor(value % 60);
      const timeStr = mins > 0 ? `${mins}分${secs}秒` : `${secs}秒`;
      ctx.fillText(timeStr, x + barWidth / 2, y - 6);

      ctx.fillStyle = '#64748b';
      ctx.font = '11px sans-serif';
      const label = getArtworkName(artworkId);
      const displayLabel = label.length > 5 ? label.slice(0, 5) + '...' : label;
      
      ctx.save();
      ctx.translate(x + barWidth / 2, paddingTop + chartHeight + 16);
      ctx.rotate(-Math.PI / 6);
      ctx.textAlign = 'right';
      ctx.fillText(displayLabel, 0, 0);
      ctx.restore();
    });

    rafRef.current = requestAnimationFrame(draw);
  }, [data, artworks, width, height]);

  useEffect(() => {
    draw();
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [draw]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    const paddingTop = 20;
    const paddingBottom = 50;
    const chartHeight = height - paddingTop - paddingBottom;
    const barWidth = 36;
    const gap = 8;
    const totalBarsWidth = data.length * barWidth + (data.length - 1) * gap;
    const startX = Math.max(0, (width - totalBarsWidth) / 2);

    let found: number | null = null;
    data.forEach((_, i) => {
      const x = startX + i * (barWidth + gap);
      if (mx >= x && mx <= x + barWidth && my >= paddingTop && my <= paddingTop + chartHeight) {
        found = i;
      }
    });
    hoveredIndex.current = found;
  };

  return (
    <canvas
      ref={canvasRef}
      className="chart-canvas"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => { hoveredIndex.current = null; }}
      style={{ maxWidth: '100%' }}
    />
  );
}

function VisitorList({ visitors, highlightNew = false }: { visitors: Visitor[]; highlightNew?: boolean }) {
  const listRef = useRef<HTMLDivElement>(null);
  const prevIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (highlightNew && listRef.current) {
      const newItems = visitors.filter(v => !prevIdsRef.current.has(v.id));
      if (newItems.length > 0) {
        listRef.current.scrollTop = 0;
      }
    }
    prevIdsRef.current = new Set(visitors.map(v => v.id));
  }, [visitors, highlightNew]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div ref={listRef} className="visitor-list">
      {visitors.map((visitor, index) => (
        <div key={visitor.id} className="visitor-item">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ 
              width: '28px', 
              height: '28px', 
              borderRadius: '50%', 
              background: `hsl(${(index * 36) % 360}, 65%, 58%)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px',
              color: 'white',
              fontWeight: 'bold',
              flexShrink: 0,
            }}>
              {visitor.nickname.charAt(0)}
            </span>
            <div style={{ minWidth: 0 }}>
              <div className="visitor-name" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '140px' }}>
                {visitor.nickname}
              </div>
            </div>
          </div>
          <div className="visitor-info">
            <span>⏱{formatDuration(visitor.duration)}</span>
            <span>✓{visitor.completionRate}%</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function Stats({ exhibition }: StatsProps) {
  const [statsData, setStatsData] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const mountedRef = useRef(true);

  const artworks = exhibition?.artworks || [];

  const fetchStats = useCallback(async () => {
    try {
      const res = await axios.get('/api/visitors');
      if (mountedRef.current) {
        setStatsData(res.data);
        setLastUpdate(new Date());
      }
    } catch (err) {
      console.error('获取统计数据失败:', err);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    fetchStats();
    const interval = setInterval(fetchStats, 5000);
    return () => {
      mountedRef.current = false;
      clearInterval(interval);
    };
  }, [fetchStats]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getArtworkName = (artworkId: string) => {
    const artwork = artworks.find((a: Artwork) => a.id === artworkId);
    return artwork?.name || '未知作品';
  };

  const sortedArtworkStats = statsData?.artworkStats
    ? Object.entries(statsData.artworkStats).sort((a, b) => b[1] - a[1])
    : [];

  const avgDuration = statsData?.recentVisitors.length 
    ? Math.floor(
        statsData.recentVisitors.reduce((sum, v) => sum + v.duration, 0) / 
        statsData.recentVisitors.length
      )
    : 0;

  return (
    <div style={{ display: 'flex', height: '100%' }}>
      <div style={{ flex: 1, padding: '24px 32px 24px 24px', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: '700' }}>数据统计</h1>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            {lastUpdate && `最后更新: ${lastUpdate.toLocaleTimeString()}`}
            <span style={{ 
              display: 'inline-block', 
              width: '8px', 
              height: '8px', 
              borderRadius: '50%',
              background: '#10b981',
              marginLeft: '8px',
              animation: 'pulse 1.5s infinite',
            }} />
          </div>
          <style>{`
            @keyframes pulse {
              0%, 100% { opacity: 1; transform: scale(1); }
              50% { opacity: 0.6; transform: scale(0.9); }
            }
          `}</style>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '32px' }}>
          <div className="card">
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px' }}>总访客数</div>
            <div style={{ fontSize: '32px', fontWeight: '700', color: '#6366f1' }}>
              {statsData?.totalVisitors || 0}
            </div>
          </div>
          <div className="card">
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px' }}>作品数量</div>
            <div style={{ fontSize: '32px', fontWeight: '700', color: '#10b981' }}>
              {artworks.length}
            </div>
          </div>
          <div className="card">
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px' }}>平均参观时长</div>
            <div style={{ fontSize: '32px', fontWeight: '700', color: '#f59e0b' }}>
              {formatDuration(avgDuration)}
            </div>
          </div>
        </div>

        <div className="card" style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '600' }}>各作品停留时长</h2>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              单位：秒（柱宽36px，蓝紫渐变）
            </div>
          </div>
          
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>加载中...</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <BarChartCanvas 
                data={sortedArtworkStats} 
                artworks={artworks}
                width={Math.max(600, sortedArtworkStats.length * 60)}
                height={220}
              />
            </div>
          )}
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '600' }}>最近访客列表</h2>
            <div style={{ fontSize: '12px', color: 'var(--success)' }}>每5秒自动刷新</div>
          </div>
          
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>加载中...</div>
          ) : (
            <VisitorList visitors={statsData?.recentVisitors || []} highlightNew />
          )}
        </div>
      </div>

      <div className="stats-panel">
        <div className="stats-title">实时数据面板</div>
        
        <div className="stats-section">
          <div className="stats-section-title">概览信息</div>
          <div style={{ 
            background: 'var(--bg-tertiary)', 
            borderRadius: 'var(--border-radius-sm)', 
            padding: '16px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>当前访客</span>
              <span style={{ color: 'var(--success)', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }} />
                在线
              </span>
            </div>
            <div style={{ fontSize: '28px', fontWeight: '700', marginBottom: '4px' }}>
              {statsData?.recentVisitors.length || 0}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              最近10位访客数据
            </div>
          </div>
        </div>

        <div className="stats-section">
          <div className="stats-section-title">🔥 热门作品 TOP 5</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {sortedArtworkStats.slice(0, 5).map(([artworkId, time], index) => {
              const maxTime = sortedArtworkStats[0]?.[1] || 1;
              const percent = Math.floor((time / maxTime) * 100);
              const medalColors = ['#fbbf24', '#94a3b8', '#d97706'];
              return (
                <div 
                  key={artworkId}
                  className="top-artwork-item"
                  style={{
                    padding: '10px 12px',
                    background: 'var(--bg-tertiary)',
                    borderRadius: 'var(--border-radius-sm)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                    <span style={{ 
                      width: '22px', 
                      height: '22px', 
                      borderRadius: '50%', 
                      background: index < 3 ? medalColors[index] : 'var(--bg-secondary)',
                      color: index < 3 ? 'white' : 'var(--text-muted)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '11px',
                      fontWeight: 'bold',
                      flexShrink: 0,
                    }}>
                      {index + 1}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ 
                        fontSize: '13px', 
                        color: 'var(--text-primary)',
                        fontWeight: '500',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}>
                        {getArtworkName(artworkId)}
                      </div>
                    </div>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', flexShrink: 0 }}>
                      {formatDuration(Math.floor(time))}
                    </span>
                  </div>
                  <div style={{ 
                    height: '4px', 
                    background: 'var(--bg-secondary)', 
                    borderRadius: '2px',
                    overflow: 'hidden',
                  }}>
                    <div style={{ 
                      height: '100%', 
                      width: `${percent}%`,
                      background: `linear-gradient(90deg, ${GRADIENT_START}, ${GRADIENT_END})`,
                      borderRadius: '2px',
                      transition: 'width 0.5s ease',
                    }} />
                  </div>
                </div>
              );
            })}
            {sortedArtworkStats.length === 0 && (
              <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)', fontSize: '12px' }}>
                暂无数据
              </div>
            )}
          </div>
        </div>

        <div className="stats-section">
          <div className="stats-section-title">👥 访客滚动列表</div>
          <div 
            style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '6px',
              maxHeight: '380px',
              overflowY: 'auto',
              paddingRight: '4px',
            }}
          >
            {statsData?.recentVisitors.map((visitor, index) => (
              <div 
                key={visitor.id}
                className="visitor-item"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 10px',
                  background: 'var(--bg-tertiary)',
                  borderRadius: 'var(--border-radius-sm)',
                  fontSize: '12px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                  <span style={{ 
                    width: '20px', 
                    height: '20px', 
                    borderRadius: '50%', 
                    background: `hsl(${(index * 36) % 360}, 65%, 58%)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '10px',
                    color: 'white',
                    fontWeight: 'bold',
                    flexShrink: 0,
                  }}>
                    {visitor.nickname.charAt(0)}
                  </span>
                  <span style={{ 
                    color: 'var(--text-primary)', 
                    fontWeight: '500',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    maxWidth: '110px',
                  }}>
                    {visitor.nickname}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '8px', color: 'var(--text-muted)', flexShrink: 0 }}>
                  <span>{formatDuration(visitor.duration)}</span>
                  <span style={{ 
                    color: visitor.completionRate >= 70 ? 'var(--success)' 
                           : visitor.completionRate >= 40 ? 'var(--warning)' 
                           : '#ef4444',
                    fontWeight: '500',
                  }}>
                    {visitor.completionRate}%
                  </span>
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
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
        }}>
          <span style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: '#10b981',
            animation: 'pulse2 1.5s infinite',
          }} />
          每 5 秒自动刷新数据
          <style>{`
            @keyframes pulse2 {
              0%, 100% { opacity: 1; transform: scale(1); }
              50% { opacity: 0.5; transform: scale(0.85); }
            }
          `}</style>
        </div>
      </div>
    </div>
  );
}

export default Stats;
