import { useMemo, useState } from 'react';
import type { Movie, Category } from './types';
import {
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface MovieStatsProps {
  movies: Movie[];
}

const RATING_COLORS = [
  '#7f5af0',
  '#8b6cf4',
  '#977df7',
  '#a38ff9',
  '#afa0fb',
  '#bb11fc',
  '#c7c3fe',
  '#d3d5ff',
  '#a78bfa',
  '#7c3aed',
];

const CATEGORY_COLORS = [
  '#7f5af0',
  '#06b6d4',
  '#10b981',
  '#f59e0b',
  '#ef4444',
];

export default function MovieStats({ movies }: MovieStatsProps) {
  const [activePieIndex, setActivePieIndex] = useState<number | null>(null);

  const totalWatchCount = useMemo(
    () => movies.reduce((sum, m) => sum + m.watchHistory.length + 1, 0),
    [movies]
  );

  const avgRating = useMemo(() => {
    const rated = movies.filter((m) => m.rating > 0);
    if (rated.length === 0) return 0;
    const sum = rated.reduce((s, m) => s + m.rating, 0);
    return (sum / rated.length).toFixed(1);
  }, [movies]);

  const favoriteCategory = useMemo(() => {
    const map = new Map<Category, number>();
    movies.forEach((m) => {
      m.categories.forEach((c) => {
        map.set(c, (map.get(c) || 0) + 1);
      });
    });
    if (map.size === 0) return '-';
    let best: Category = Array.from(map.keys())[0];
    let max = 0;
    map.forEach((v, k) => {
      if (v > max) {
        max = v;
        best = k;
      }
    });
    return best;
  }, [movies]);

  const ratingDistribution = useMemo(() => {
    const dist = Array.from({ length: 10 }, (_, i) => ({
      rating: i + 1,
      count: 0,
      name: `${i + 1}分`,
    }));
    movies.forEach((m) => {
      if (m.rating >= 1 && m.rating <= 10) {
        dist[m.rating - 1].count++;
      }
    });
    return dist;
  }, [movies]);

  const totalRated = ratingDistribution.reduce((s, d) => s + d.count, 0);

  const monthlyData = useMemo(() => {
    const months: { label: string; count: number; key: string }[] = [];
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = `${d.getMonth() + 1}月`;
      months.push({ label, count: 0, key });
    }
    movies.forEach((m) => {
      const records = [m.watchDate, ...m.watchHistory.map((h) => h.date)];
      records.forEach((dateStr) => {
        const d = new Date(dateStr);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const mIdx = months.findIndex((x) => x.key === key);
        if (mIdx >= 0) months[mIdx].count++;
      });
    });
    return months.map(({ label, count }) => ({ month: label, 观影数: count }));
  }, [movies]);

  const categoryData = useMemo(() => {
    const map = new Map<Category, number>();
    movies.forEach((m) => {
      m.categories.forEach((c) => {
        map.set(c, (map.get(c) || 0) + 1);
      });
    });
    const arr = Array.from(map.entries())
      .map(([name, count]) => ({ name, 数量: count }))
      .sort((a, b) => b.数量 - a.数量)
      .slice(0, 5);
    return arr;
  }, [movies]);

  const summary = [
    { label: '收藏电影', value: movies.length },
    { label: '总观影次数', value: totalWatchCount },
    { label: '平均评分', value: avgRating },
    { label: '最爱分类', value: favoriteCategory },
  ];

  const renderCustomPieLabel = (entry: {
    cx: number;
    cy: number;
    midAngle: number;
    innerRadius: number;
    outerRadius: number;
    percent: number;
    index: number;
    count?: number;
  }) => {
    if (entry.percent === 0) return null;
    const RADIAN = Math.PI / 180;
    const radius = entry.outerRadius * 0.7;
    const x = entry.cx + radius * Math.cos(-entry.midAngle * RADIAN);
    const y = entry.cy + radius * Math.sin(-entry.midAngle * RADIAN);
    return (
      <text
        x={x}
        y={y}
        fill="#fff"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={12}
        fontWeight={600}
      >
        {(entry.percent * 100).toFixed(0)}%
      </text>
    );
  };

  if (movies.length === 0) {
    return (
      <div className="stats-container">
        <div className="page-header">
          <div className="page-title">统计面板</div>
        </div>
        <div className="glass empty-state">
          <div className="empty-icon">📊</div>
          <div className="empty-title">暂无统计数据</div>
          <div className="empty-desc">添加一些电影后，这里将展示你的观影数据洞察</div>
        </div>
      </div>
    );
  }

  return (
    <div className="stats-container">
      <div className="page-header">
        <div className="page-title">统计面板</div>
        <div style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
          数据更新于 {new Date().toLocaleDateString('zh-CN')}
        </div>
      </div>

      <div className="stats-summary">
        {summary.map((s) => (
          <div key={s.label} className="glass summary-card">
            <div className="summary-number">{s.value}</div>
            <div className="summary-label">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="stats-grid">
        <div className="glass stats-card" style={{ animationDelay: '0.05s' }}>
          <h3>⭐ 评分分布</h3>
          <div style={{ width: '100%', height: 320 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={ratingDistribution}
                  dataKey="count"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={110}
                  paddingAngle={2}
                  animationDuration={800}
                  animationBegin={100}
                  label={renderCustomPieLabel as any}
                  onMouseEnter={(_, index) => setActivePieIndex(index)}
                  onMouseLeave={() => setActivePieIndex(null)}
                >
                  {ratingDistribution.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={RATING_COLORS[index % RATING_COLORS.length]}
                      opacity={
                        activePieIndex === null || activePieIndex === index ? 1 : 0.35
                      }
                      stroke="none"
                      style={{
                        transition: 'opacity 0.3s ease, transform 0.3s ease',
                        transformOrigin: 'center',
                        transform:
                          activePieIndex === index && entry.count > 0
                            ? 'scale(1.06)'
                            : 'scale(1)',
                      }}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: 'rgba(26, 26, 46, 0.95)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    borderRadius: 12,
                    color: '#fff',
                    fontFamily: 'inherit',
                    backdropFilter: 'blur(10px)',
                  }}
                  formatter={(value: number, name: string) => [
                    `${value} 部${totalRated > 0 ? `（${((value / totalRated) * 100).toFixed(1)}%）` : ''}`,
                    name,
                  ]}
                />
                <Legend
                  formatter={(value) => (
                    <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>
                      {value}
                    </span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass stats-card" style={{ animationDelay: '0.15s' }}>
          <h3>📈 近12个月观影数量</h3>
          <div style={{ width: '100%', height: 320 }}>
            <ResponsiveContainer>
              <LineChart
                data={monthlyData}
                margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#7f5af0" />
                    <stop offset="100%" stopColor="#a78bfa" />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(255,255,255,0.08)"
                />
                <XAxis
                  dataKey="month"
                  stroke="var(--text-secondary)"
                  tick={{ fontSize: 12 }}
                  axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  stroke="var(--text-secondary)"
                  tick={{ fontSize: 12 }}
                  axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    background: 'rgba(26, 26, 46, 0.95)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    borderRadius: 12,
                    color: '#fff',
                    fontFamily: 'inherit',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="观影数"
                  stroke="url(#lineGrad)"
                  strokeWidth={3}
                  dot={{
                    fill: '#7f5af0',
                    stroke: '#fff',
                    strokeWidth: 2,
                    r: 5,
                  }}
                  activeDot={{ r: 8, fill: '#a78bfa' }}
                  animationDuration={1000}
                  animationBegin={200}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div
          className="glass stats-card"
          style={{ gridColumn: '1 / -1', animationDelay: '0.25s' }}
        >
          <h3>🏆 最常看的分类（前5）</h3>
          {categoryData.length === 0 ? (
            <div
              style={{
                height: 300,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-secondary)',
              }}
            >
              暂无分类数据，给电影加上标签吧～
            </div>
          ) : (
            <div style={{ width: '100%', height: 320 }}>
              <ResponsiveContainer>
                <BarChart
                  data={categoryData}
                  margin={{ top: 10, right: 30, left: 10, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#a78bfa" />
                      <stop offset="100%" stopColor="#7f5af0" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(255,255,255,0.08)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="name"
                    stroke="var(--text-secondary)"
                    tick={{ fontSize: 14 }}
                    axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                    tickLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    stroke="var(--text-secondary)"
                    tick={{ fontSize: 12 }}
                    axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: 'rgba(26, 26, 46, 0.95)',
                      border: '1px solid rgba(255,255,255,0.15)',
                      borderRadius: 12,
                      color: '#fff',
                      fontFamily: 'inherit',
                    }}
                    formatter={(value: number) => [`${value} 部`, '电影数']}
                  />
                  <Bar
                    dataKey="数量"
                    fill="url(#barGrad)"
                    radius={[10, 10, 0, 0]}
                    animationDuration={900}
                    animationBegin={300}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
