import React, { memo } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import type { WeeklyStat, PodcastNoteStat, TotalStats } from './NoteManager';

interface StatisticsChartProps {
  weeklyData: WeeklyStat[];
  podcastNoteData: PodcastNoteStat[];
  totalStats: TotalStats;
}

const WeeklyBarChart: React.FC<{ data: WeeklyStat[] }> = memo(({ data }) => {
  const formattedData = data.map(item => ({
    ...item,
    weekLabel: item.week.substring(5)
  }));

  return (
    <div className="chart-container">
      <h3 className="chart-title">每周收听时长</h3>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={formattedData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis 
            dataKey="weekLabel" 
            stroke="#6B7280" 
            fontSize={12}
            tickLine={false}
          />
          <YAxis 
            stroke="#6B7280" 
            fontSize={12}
            tickLine={false}
            unit="h"
          />
          <Tooltip 
            formatter={(value: number) => [`${value} 小时`, '收听时长']}
            labelFormatter={(label) => `周 ${label}`}
            contentStyle={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #E5E7EB',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
            }}
          />
          <Bar 
            dataKey="hours" 
            fill="#6366F1" 
            radius={[6, 6, 0, 0]}
            animationDuration={600}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
});

WeeklyBarChart.displayName = 'WeeklyBarChart';

const PodcastNoteLineChart: React.FC<{ data: PodcastNoteStat[] }> = memo(({ data }) => {
  return (
    <div className="chart-container">
      <h3 className="chart-title">各节目笔记数量</h3>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis 
            dataKey="podcast" 
            stroke="#6B7280" 
            fontSize={12}
            tickLine={false}
          />
          <YAxis 
            stroke="#6B7280" 
            fontSize={12}
            tickLine={false}
            allowDecimals={false}
          />
          <Tooltip 
            formatter={(value: number) => [`${value} 条`, '笔记数']}
            contentStyle={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #E5E7EB',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
            }}
          />
          <Line 
            type="monotone" 
            dataKey="count" 
            stroke="#8B5CF6" 
            strokeWidth={3}
            dot={{ fill: '#8B5CF6', strokeWidth: 2, r: 5 }}
            activeDot={{ r: 8, fill: '#8B5CF6' }}
            animationDuration={600}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
});

PodcastNoteLineChart.displayName = 'PodcastNoteLineChart';

const StatsSummary: React.FC<{ stats: TotalStats }> = memo(({ stats }) => {
  return (
    <div className="stats-summary">
      <div className="stat-card">
        <div className="stat-icon">⏱️</div>
        <div className="stat-content">
          <div className="stat-value">{stats.totalListeningHours}</div>
          <div className="stat-label">总收听时长 (小时)</div>
        </div>
      </div>
      <div className="stat-card">
        <div className="stat-icon">📝</div>
        <div className="stat-content">
          <div className="stat-value">{stats.totalNotes}</div>
          <div className="stat-label">总笔记数</div>
        </div>
      </div>
    </div>
  );
});

StatsSummary.displayName = 'StatsSummary';

const StatisticsChart: React.FC<StatisticsChartProps> = memo(({ 
  weeklyData, 
  podcastNoteData, 
  totalStats 
}) => {
  return (
    <div className="statistics-page">
      <StatsSummary stats={totalStats} />
      <div className="charts-grid">
        <WeeklyBarChart data={weeklyData} />
        <PodcastNoteLineChart data={podcastNoteData} />
      </div>
    </div>
  );
});

StatisticsChart.displayName = 'StatisticsChart';

export default StatisticsChart;
