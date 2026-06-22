import React, { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { useNoteStore } from '../store/useNoteStore';
import {
  getTotalCount,
  getTagDistribution,
  getDailyNewNotes,
  PIE_COLORS
} from '../AnalyticsModule/statistics';

export const StatisticsCharts: React.FC = () => {
  const { notes } = useNoteStore();

  const stats = useMemo(() => {
    return {
      totalCount: getTotalCount(notes),
      tagDistribution: getTagDistribution(notes),
      dailyNewNotes: getDailyNewNotes(notes, 7)
    };
  }, [notes]);

  const totalTags = stats.tagDistribution.reduce((sum, item) => sum + item.count, 0);

  return (
    <div className="statistics-container">
      <div className="stats-header">
        <h2 className="stats-title">📊 数据统计</h2>
      </div>

      <div className="stats-summary">
        <div className="stat-card">
          <div className="stat-number">{stats.totalCount}</div>
          <div className="stat-label">笔记总数</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{stats.tagDistribution.length}</div>
          <div className="stat-label">标签数量</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{totalTags}</div>
          <div className="stat-label">标签使用次数</div>
        </div>
      </div>

      <div className="charts-container">
        <div className="chart-card">
          <h3 className="chart-title">最近 7 天新增笔记</h3>
          <div className="chart-wrapper" style={{ width: 400, height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.dailyNewNotes}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E0E0E0" />
                <XAxis
                  dataKey="date"
                  tick={{ fill: '#666666', fontSize: 12 }}
                  axisLine={{ stroke: '#E0E0E0' }}
                />
                <YAxis
                  tick={{ fill: '#666666', fontSize: 12 }}
                  axisLine={{ stroke: '#E0E0E0' }}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E0E0E0',
                    borderRadius: 8,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                  }}
                />
                <Bar
                  dataKey="count"
                  fill="#4A90D9"
                  radius={[4, 4, 0, 0]}
                  name="新增笔记数"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="chart-card">
          <h3 className="chart-title">标签分布</h3>
          <div className="chart-wrapper" style={{ width: 400, height: 300 }}>
            {stats.tagDistribution.length === 0 ? (
              <div className="empty-chart">暂无标签数据</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.tagDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ tag, percent }) => `${tag} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    dataKey="count"
                    nameKey="tag"
                  >
                    {stats.tagDistribution.map((_entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={PIE_COLORS[index % PIE_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #E0E0E0',
                      borderRadius: 8,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                    }}
                    formatter={(value: number, name: string) => [`${value} 篇`, name]}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
