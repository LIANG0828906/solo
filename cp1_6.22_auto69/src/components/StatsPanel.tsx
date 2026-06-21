import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Area,
  ComposedChart,
} from 'recharts';
import { api, type WeeklyStats } from '../api';

const WEEK_LABELS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

function dayLabel(dateStr: string): string {
  const d = new Date(dateStr);
  const w = d.getDay();
  return WEEK_LABELS[w];
}

export default function StatsPanel() {
  const [stats, setStats] = useState<WeeklyStats | null>(null);
  const navigate = useNavigate();

  const loadStats = () => {
    api.getWeeklyStats().then(setStats).catch(() => {});
  };

  useEffect(() => {
    loadStats();
    const t = setInterval(loadStats, 30000);
    return () => clearInterval(t);
  }, []);

  const chartData = (stats?.dailyMinutes || []).map((d) => ({
    ...d,
    label: dayLabel(d.date),
    hours: Number((d.minutes / 60).toFixed(2)),
  }));

  return (
    <aside className="stats-aside">
      <div className="stats-panel">
        <div className="stats-title">📊 阅读统计</div>

        <div className="stats-cards">
          <div className="stat-card">
            <div>
              <div className="label">本周阅读</div>
              <div style={{ fontSize: '11px', color: '#8B5E3C' }}>累计时长</div>
            </div>
            <div className="value">{stats?.weekTotalHours ?? 0}<span style={{ fontSize: '14px' }}> h</span></div>
          </div>

          <div className="stat-card">
            <div>
              <div className="label">本月读完</div>
              <div style={{ fontSize: '11px', color: '#8B5E3C' }}>新增书籍</div>
            </div>
            <div className="value">{stats?.monthFinishedCount ?? 0}<span style={{ fontSize: '14px' }}> 本</span></div>
          </div>

          <div className="stat-card">
            <div>
              <div className="label">连续阅读</div>
              <div style={{ fontSize: '11px', color: '#8B5E3C' }}>坚持加油</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span className={`streak-fire ${stats?.streakActive ? 'active' : ''}`}>🔥</span>
              <div className="value">{stats?.streakDays ?? 0}<span style={{ fontSize: '14px' }}> 天</span></div>
            </div>
          </div>
        </div>

        <div className="chart-title">最近 7 天阅读时长</div>
        <div className="chart-wrap">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={170}>
              <ComposedChart data={chartData} margin={{ top: 10, right: 8, bottom: 0, left: -16 }}>
                <defs>
                  <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2E4A2A" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#2E4A2A" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(139, 94, 60, 0.12)" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: '#6B4423' }}
                  axisLine={{ stroke: 'rgba(139, 94, 60, 0.3)' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: '#8B5E3C' }}
                  axisLine={false}
                  tickLine={false}
                  unit="m"
                  width={36}
                />
                <Tooltip
                  contentStyle={{
                    background: '#FAF6EB',
                    border: '1px solid #C9A86C',
                    borderRadius: '6px',
                    fontSize: '12px',
                    color: '#4A2C17',
                    fontFamily: "'Noto Serif SC', serif",
                  }}
                  formatter={(v: number) => [`${v} 分钟`, '阅读时长']}
                  labelFormatter={(l) => `星期：${l}`}
                />
                <Area type="monotone" dataKey="minutes" stroke="none" fill="url(#areaGrad)" />
                <Line
                  type="monotone"
                  dataKey="minutes"
                  stroke="#2E4A2A"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: '#fff', stroke: '#2E4A2A', strokeWidth: 2 }}
                  activeDot={{ r: 5, fill: '#2E4A2A', stroke: '#fff', strokeWidth: 2 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ padding: '30px', textAlign: 'center', color: '#8B5E3C', fontStyle: 'italic' }}>
              暂无数据
            </div>
          )}
        </div>

        <button
          className="weekly-btn"
          onClick={() => navigate('/weekly-report')}
        >
          📄 生成阅读周报
        </button>
      </div>
    </aside>
  );
}
