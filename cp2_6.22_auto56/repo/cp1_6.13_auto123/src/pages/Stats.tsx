import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Dot } from 'recharts';
import HeatMap from '../components/HeatMap';
import habitApi from '../services/api';
import type { StatsData } from '../types';

function Stats() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [heatmapAnimKey, setHeatmapAnimKey] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const data = await habitApi.getStats();
        setStats(data);
      } catch (err) {
        console.error('Failed to fetch stats:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleYearChange = (year: number) => {
    setSelectedYear(year);
    setHeatmapAnimKey(prev => prev + 1);
  };

  const years = Array.from({ length: 3 }, (_, i) => new Date().getFullYear() - i);

  if (loading || !stats) {
    return (
      <div className="loading-container">
        <div className="water-wave" />
        <p>加载统计数据...</p>
      </div>
    );
  }

  return (
    <div className="stats-page">
      <div className="stats-overview">
        <div className="overview-card">
          <div className="overview-icon">📊</div>
          <div className="overview-info">
            <span className="overview-value">{stats.totalHabits}</span>
            <span className="overview-label">习惯总数</span>
          </div>
        </div>
        <div className="overview-card">
          <div className="overview-icon">✅</div>
          <div className="overview-info">
            <span className="overview-value">{stats.todayCompleted}</span>
            <span className="overview-label">今日完成</span>
          </div>
        </div>
        <div className="overview-card">
          <div className="overview-icon">🔥</div>
          <div className="overview-info">
            <span className="overview-value">{stats.bestStreak}</span>
            <span className="overview-label">最长连续</span>
          </div>
        </div>
      </div>

      <section className="stats-section chart-section">
        <div className="section-header">
          <h2 className="section-heading">年度热力图</h2>
          <div className="year-selector">
            {years.map(year => (
              <button
                key={year}
                className={`year-btn ${selectedYear === year ? 'active' : ''}`}
                onClick={() => handleYearChange(year)}
              >
                {year}
              </button>
            ))}
          </div>
        </div>
        <div className="heatmap-wrapper-card fade-in-chart" key={heatmapAnimKey}>
          <HeatMap data={stats.heatmap} year={selectedYear} />
        </div>
      </section>

      <section className="stats-section chart-section">
        <div className="section-header">
          <h2 className="section-heading">月度完成率趋势</h2>
        </div>
        <div className="chart-wrapper fade-in-chart" style={{ height: 280 }}>
          <div className="chart-loading-overlay" style={{ display: 'none' }}>
            <div className="water-wave small" />
          </div>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={stats.monthlyTrend} margin={{ top: 20, right: 20, left: 0, bottom: 20 }}>
              <defs>
                <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#4ecdc4" />
                  <stop offset="50%" stopColor="#aa96da" />
                  <stop offset="100%" stopColor="#ff6b6b" />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#3a3a4e" vertical={false} />
              <XAxis
                dataKey="month"
                stroke="#888"
                tick={{ fill: '#aaa', fontSize: 12 }}
                axisLine={{ stroke: '#3a3a4e' }}
                tickLine={false}
              />
              <YAxis
                stroke="#888"
                tick={{ fill: '#aaa', fontSize: 12 }}
                axisLine={{ stroke: '#3a3a4e' }}
                tickLine={false}
                domain={[0, 100]}
                tickFormatter={(v) => `${v}%`}
              />
              <RechartsTooltip
                contentStyle={{
                  backgroundColor: '#2a2a3e',
                  border: '1px solid #3a3a4e',
                  borderRadius: 8,
                  boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
                }}
                labelStyle={{ color: '#fff', marginBottom: 4 }}
                itemStyle={{ color: '#4ecdc4' }}
                formatter={(value: number) => [`${value}%`, '完成率']}
              />
              <Line
                type="monotone"
                dataKey="completionRate"
                stroke="url(#lineGradient)"
                strokeWidth={3}
                dot={(props: any) => (
                  <Dot
                    {...props}
                    fill="#2a2a3e"
                    stroke="#4ecdc4"
                    strokeWidth={2}
                    r={4}
                  />
                )}
                activeDot={{ r: 6, stroke: '#4ecdc4', strokeWidth: 2, fill: '#4ecdc4' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}

export default Stats;
