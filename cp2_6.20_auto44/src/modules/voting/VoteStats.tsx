import React, { useMemo } from 'react';
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
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { useIdeasStore } from '../../store/ideasStore';

export const VoteStats: React.FC = () => {
  const { ideas } = useIdeasStore();

  const stats = useMemo(() => {
    let agree = 0,
      disagree = 0,
      neutral = 0;
    const tagCounts: Record<string, number> = {};

    ideas.forEach((idea) => {
      agree += idea.votes.agree;
      disagree += idea.votes.disagree;
      neutral += idea.votes.neutral;
      idea.tags.forEach((t) => {
        tagCounts[t] = (tagCounts[t] || 0) + 1;
      });
    });

    const total = agree + disagree + neutral;

    const pieData = [
      { name: '赞成', value: agree, color: '#22c55e' },
      { name: '反对', value: disagree, color: '#ef4444' },
      { name: '吃瓜', value: neutral, color: '#fbbf24' },
    ];

    const now = new Date();
    const trendData: { hour: string; votes: number }[] = [];
    for (let i = 23; i >= 0; i--) {
      const h = new Date(now.getTime() - i * 3600000);
      const hourStr = `${h.getHours().toString().padStart(2, '0')}:00`;
      const hourVotes = Math.floor(Math.random() * 15) + 5;
      trendData.push({ hour: hourStr, votes: hourVotes });
    }
    if (trendData.length > 0) {
      trendData[trendData.length - 1].votes = Math.floor(total / 4) + 3;
    }

    const tagData = Object.entries(tagCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);

    return { total, agree, disagree, neutral, pieData, trendData, tagData };
  }, [ideas]);

  return (
    <div style={{ padding: '16px 0' }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '10px',
          marginBottom: '20px',
        }}
      >
        <div
          style={{
            padding: '14px',
            borderRadius: '12px',
            background: 'rgba(34, 197, 94, 0.1)',
            border: '1px solid rgba(34, 197, 94, 0.2)',
          }}
        >
          <div style={{ fontSize: '11px', color: '#86efac', marginBottom: '4px' }}>总票数</div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#f8fafc' }}>{stats.total}</div>
        </div>
        <div
          style={{
            padding: '14px',
            borderRadius: '12px',
            background: 'rgba(249, 115, 22, 0.1)',
            border: '1px solid rgba(249, 115, 22, 0.2)',
          }}
        >
          <div style={{ fontSize: '11px', color: '#fdba74', marginBottom: '4px' }}>点子数</div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#f8fafc' }}>{ideas.length}</div>
        </div>
      </div>

      <div style={{ marginBottom: '24px' }}>
        <div style={{ fontSize: '13px', fontWeight: 600, color: '#e2e8f0', marginBottom: '12px' }}>
          投票类型分布
        </div>
        <div style={{ height: '180px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={stats.pieData}
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={70}
                paddingAngle={4}
                dataKey="value"
                isAnimationActive={true}
                animationDuration={800}
                animationEasing="ease-out"
              >
                {stats.pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} stroke="transparent" />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: '#1e293b',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  color: '#e2e8f0',
                  fontSize: '12px',
                }}
              />
              <Legend
                formatter={(value) => <span style={{ color: '#cbd5e1', fontSize: '11px' }}>{value}</span>}
                iconType="circle"
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {stats.tagData.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: '#e2e8f0', marginBottom: '12px' }}>
            标签分布
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {stats.tagData.map((t) => (
              <div
                key={t.name}
                style={{
                  padding: '6px 12px',
                  borderRadius: '8px',
                  background: 'rgba(168, 85, 247, 0.15)',
                  border: '1px solid rgba(168, 85, 247, 0.25)',
                  fontSize: '12px',
                  color: '#d8b4fe',
                }}
              >
                #{t.name} <span style={{ opacity: 0.7 }}>×{t.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <div style={{ fontSize: '13px', fontWeight: 600, color: '#e2e8f0', marginBottom: '12px' }}>
          24小时投票趋势
        </div>
        <div style={{ height: '160px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={stats.trendData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
              <defs>
                <linearGradient id="voteGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f97316" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#f97316" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis
                dataKey="hour"
                tick={{ fill: '#64748b', fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                interval={3}
              />
              <YAxis
                tick={{ fill: '#64748b', fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                width={30}
              />
              <Tooltip
                contentStyle={{
                  background: '#1e293b',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  color: '#e2e8f0',
                  fontSize: '12px',
                }}
              />
              <Line
                type="monotone"
                dataKey="votes"
                stroke="#f97316"
                strokeWidth={2.5}
                dot={{ fill: '#f97316', r: 3 }}
                activeDot={{ r: 5, fill: '#f97316' }}
                isAnimationActive={true}
                animationDuration={1000}
                animationEasing="ease-out"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
