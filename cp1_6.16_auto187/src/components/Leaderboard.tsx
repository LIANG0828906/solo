import { useEffect, useState, useMemo } from 'react';
import { ReloadOutlined, TrophyOutlined, CrownOutlined, TeamOutlined } from '@ant-design/icons';
import { Button, Empty, Spin, Tooltip } from 'antd';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ReTooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { useAppStore } from '@/store';
import type { User } from '@/types';

const getRankColor = (index: number): string => {
  if (index === 0) return '#ffd700';
  if (index === 1) return '#c0c0c0';
  if (index === 2) return '#cd7f32';
  return '#1677ff';
};

const getRankClass = (index: number): string => {
  if (index === 0) return 'rank-gold';
  if (index === 1) return 'rank-silver';
  if (index === 2) return 'rank-bronze';
  return '';
};

const getRankIcon = (index: number) => {
  if (index === 0) return <CrownOutlined style={{ color: '#ffd700', fontSize: 20 }} />;
  if (index === 1) return <TrophyOutlined style={{ color: '#c0c0c0', fontSize: 18 }} />;
  if (index === 2) return <TrophyOutlined style={{ color: '#cd7f32', fontSize: 16 }} />;
  return <span style={{ color: '#8c8c8c', fontWeight: 600 }}>#{index + 1}</span>;
};

interface CoinParticleProps {
  left: number;
  delay: number;
}

const CoinParticle = ({ left, delay }: CoinParticleProps) => (
  <div
    className="coin-particle"
    style={{
      left: `${left}%`,
      animationDelay: `${delay}ms`,
    }}
  />
);

export default function Leaderboard() {
  const leaderboard = useAppStore(s => s.leaderboard);
  const loadLeaderboard = useAppStore(s => s.loadLeaderboard);
  const animatedUsers = useAppStore(s => s.animatedUsers);
  const [refreshing, setRefreshing] = useState(false);
  const [visibleRows, setVisibleRows] = useState<Set<string>>(new Set());
  const [coins, setCoins] = useState<{ id: number; left: number; delay: number }[]>([]);

  useEffect(() => {
    setRefreshing(true);
    loadLeaderboard().finally(() => setRefreshing(false));
  }, [loadLeaderboard]);

  useEffect(() => {
    const timer = setInterval(() => {
      setRefreshing(true);
      loadLeaderboard().finally(() => setRefreshing(false));
    }, 5000);
    return () => clearInterval(timer);
  }, [loadLeaderboard]);

  useEffect(() => {
    leaderboard.forEach((user, index) => {
      setTimeout(() => {
        setVisibleRows(prev => {
          const updated = new Set(prev);
          updated.add(user.id);
          return updated;
        });
      }, index * 80);
    });
  }, [leaderboard.map(u => u.id).join(',')]);

  useEffect(() => {
    const newCoins: { id: number; left: number; delay: number }[] = [];
    let idCounter = 0;
    animatedUsers.forEach(userId => {
      const idx = leaderboard.findIndex(u => u.id === userId);
      if (idx >= 0) {
        for (let i = 0; i < 5; i++) {
          newCoins.push({
            id: idCounter++,
            left: 30 + Math.random() * 40,
            delay: i * 100,
          });
        }
      }
    });
    if (newCoins.length > 0) {
      setCoins(newCoins);
      setTimeout(() => setCoins([]), 2200);
    }
  }, [Array.from(animatedUsers).join(','), leaderboard]);

  const handleManualRefresh = () => {
    setRefreshing(true);
    loadLeaderboard().finally(() => setRefreshing(false));
  };

  const chartData = useMemo(() => {
    return leaderboard.slice(0, 8).map((user, idx) => ({
      name: user.name,
      points: user.points,
      fill: getRankColor(idx),
    }));
  }, [leaderboard]);

  const maxPoints = useMemo(() => {
    return Math.max(...leaderboard.map(u => u.points), 1);
  }, [leaderboard]);

  if (leaderboard.length === 0) {
    return (
      <div className="empty-state">
        <Empty description="暂无排行榜数据" />
      </div>
    );
  }

  return (
    <div>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
      }}>
        <div>
          <h2 style={{ color: '#fff', fontSize: 24, margin: 0, fontWeight: 700 }}>
            🏆 积分排行榜
          </h2>
          <p style={{ color: '#8c8c8c', margin: '4px 0 0' }}>每5秒自动刷新</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {refreshing && (
            <span className="blink-text" style={{ color: '#faad14', fontSize: 14 }}>
              <Spin size="small" style={{ marginRight: 6 }} />
              更新中
            </span>
          )}
          <Tooltip title="手动刷新">
            <Button
              type="primary"
              className="interactive-btn"
              icon={<ReloadOutlined />}
              onClick={handleManualRefresh}
              loading={refreshing}
              style={{
                background: 'linear-gradient(135deg, #1677ff, #69b1ff)',
                border: 'none',
              }}
            >
              刷新
            </Button>
          </Tooltip>
        </div>
      </div>

      <div style={{
        background: '#1f1f1f',
        borderRadius: 8,
        padding: 24,
        marginBottom: 24,
      }}>
        <div style={{ color: '#d9d9d9', fontSize: 14, marginBottom: 16, fontWeight: 500 }}>
          <TeamOutlined style={{ marginRight: 8 }} />
          积分分布图表
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
            <XAxis
              dataKey="name"
              tick={{ fill: '#d9d9d9', fontSize: 12 }}
              axisLine={{ stroke: '#333' }}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: '#d9d9d9', fontSize: 12 }}
              axisLine={{ stroke: '#333' }}
              tickLine={false}
            />
            <ReTooltip
              contentStyle={{
                background: '#2a2a2a',
                border: '1px solid #333',
                borderRadius: 8,
                color: '#fff',
              }}
              labelStyle={{ color: '#d9d9d9' }}
              formatter={(value: number) => [`${value.toLocaleString()} 积分`, '积分']}
            />
            <Bar
              dataKey="points"
              radius={[6, 6, 0, 0]}
              animationDuration={600}
              animationEasing="linear"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div style={{
        background: '#1f1f1f',
        borderRadius: 8,
        overflow: 'hidden',
        position: 'relative',
      }}>
        {coins.map(c => (
          <CoinParticle key={c.id} left={c.left} delay={c.delay} />
        ))}

        <div style={{
          display: 'grid',
          gridTemplateColumns: '60px 1fr 120px 100px 100px 140px',
          padding: '14px 20px',
          background: 'rgba(255,255,255,0.03)',
          borderBottom: '1px solid #333',
          color: '#8c8c8c',
          fontSize: 13,
          fontWeight: 500,
        }}>
          <div>排名</div>
          <div>用户名</div>
          <div style={{ textAlign: 'right' }}>积分</div>
          <div style={{ textAlign: 'center' }}>赢局</div>
          <div style={{ textAlign: 'center' }}>总局数</div>
          <div style={{ textAlign: 'right' }}>胜率</div>
        </div>

        {leaderboard.map((user: User, index: number) => {
          const winRate = user.totalBets > 0
            ? ((user.wins / user.totalBets) * 100).toFixed(1)
            : '0.0';
          const pointsPercent = (user.points / maxPoints) * 100;
          const isAnimated = animatedUsers.has(user.id);
          const isVisible = visibleRows.has(user.id);

          return (
            <div
              key={user.id}
              className={`${getRankClass(index)} ${isVisible ? 'fade-in-row' : ''}`}
              style={{
                display: 'grid',
                gridTemplateColumns: '60px 1fr 120px 100px 100px 140px',
                padding: '14px 20px',
                borderBottom: index < leaderboard.length - 1 ? '1px solid #2a2a2a' : 'none',
                alignItems: 'center',
                opacity: isVisible ? 1 : 0,
                transition: 'background 0.3s',
                position: 'relative',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                {getRankIcon(index)}
              </div>
              <div>
                <span style={{
                  color: index < 3 ? getRankColor(index) : '#fff',
                  fontWeight: index < 3 ? 700 : 500,
                  fontSize: 15,
                }}>
                  {user.name}
                  {user.id === 'user-current' && (
                    <span style={{
                      marginLeft: 8,
                      padding: '2px 8px',
                      background: 'rgba(22, 119, 255, 0.2)',
                      color: '#69b1ff',
                      borderRadius: 10,
                      fontSize: 11,
                      fontWeight: 500,
                    }}>
                      我
                    </span>
                  )}
                </span>
              </div>
              <div style={{ textAlign: 'right', position: 'relative' }}>
                <span style={{
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: 16,
                  display: 'block',
                }}>
                  {user.points.toLocaleString()}
                </span>
                <div style={{
                  height: 4,
                  borderRadius: 2,
                  background: '#2a2a2a',
                  marginTop: 6,
                  overflow: 'hidden',
                }}>
                  <div
                    style={{
                      height: '100%',
                      background: `linear-gradient(90deg, ${getRankColor(index)}, ${getRankColor(index)}88)`,
                      borderRadius: 2,
                      width: isAnimated ? `${pointsPercent}%` : `${pointsPercent}%`,
                      transition: isAnimated ? 'width 0.6s linear' : 'none',
                    }}
                  />
                </div>
              </div>
              <div style={{ textAlign: 'center', color: '#52c41a', fontWeight: 600 }}>
                {user.wins}
              </div>
              <div style={{ textAlign: 'center', color: '#d9d9d9' }}>
                {user.totalBets}
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{
                  color: parseFloat(winRate) >= 50 ? '#52c41a' : '#faad14',
                  fontWeight: 600,
                }}>
                  {winRate}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
