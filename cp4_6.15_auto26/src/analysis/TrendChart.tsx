import React, { useMemo } from 'react';
import {
  LineChart, Line, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { EmotionRecord, AnalysisMode, ViewMode } from '@/shared/types';
import { computeDailyStats } from './statsEngine';

interface Props {
  records: EmotionRecord[];
  viewMode: ViewMode;
  analysisMode: AnalysisMode;
}

export const TrendChart: React.FC<Props> = ({ records, viewMode, analysisMode }) => {
  const dateRange = useMemo(() => {
    const today = new Date();
    const dates: string[] = [];
    const days = viewMode === 'week' ? 7 : 30;
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      dates.push(d.toISOString().slice(0, 10));
    }
    return dates;
  }, [viewMode]);

  const chartData = useMemo(() => {
    const stats = computeDailyStats(records, dateRange);
    return stats.map(s => ({
      date: s.date.slice(5),
      intensity: s.intensity,
      diversity: s.diversity,
      emotions: s.emotions.join(', '),
    }));
  }, [records, dateRange]);

  const gradientId = analysisMode === 'intensity' ? 'intensityGradient' : 'diversityGradient';
  const lineColor = analysisMode === 'intensity' ? '#a78bfa' : '#34d399';
  const areaColor = analysisMode === 'intensity' ? '#8b5cf6' : '#10b981';

  return (
    <div className="trend-chart-container glass">
      <div className="chart-header">
        <h3>{analysisMode === 'intensity' ? '情绪强度趋势' : '情绪多样性趋势'}</h3>
        <span className="chart-period">{viewMode === 'week' ? '近7天' : '近30天'}</span>
      </div>

      {analysisMode === 'intensity' ? (
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={areaColor} stopOpacity={0.4} />
                <stop offset="95%" stopColor={areaColor} stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
            <XAxis dataKey="date" tick={{ fill: '#a0a0b0', fontSize: 11 }} />
            <YAxis tick={{ fill: '#a0a0b0', fontSize: 11 }} domain={[0, 100]} />
            <Tooltip
              contentStyle={{
                background: 'rgba(30, 20, 50, 0.9)',
                border: '1px solid rgba(139, 92, 246, 0.3)',
                borderRadius: '12px',
                color: '#e0e0f0',
                backdropFilter: 'blur(10px)',
              }}
              labelStyle={{ color: '#c4b5fd' }}
            />
            <Area
              type="monotone"
              dataKey="intensity"
              stroke={lineColor}
              strokeWidth={2.5}
              fill={`url(#${gradientId})`}
              dot={{ fill: lineColor, strokeWidth: 0, r: 3 }}
              activeDot={{ r: 6, fill: lineColor, strokeWidth: 2, stroke: '#fff' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
            <XAxis dataKey="date" tick={{ fill: '#a0a0b0', fontSize: 11 }} />
            <YAxis tick={{ fill: '#a0a0b0', fontSize: 11 }} allowDecimals={false} />
            <Tooltip
              contentStyle={{
                background: 'rgba(30, 20, 50, 0.9)',
                border: '1px solid rgba(52, 211, 153, 0.3)',
                borderRadius: '12px',
                color: '#e0e0f0',
                backdropFilter: 'blur(10px)',
              }}
              labelStyle={{ color: '#6ee7b7' }}
            />
            <Line
              type="monotone"
              dataKey="diversity"
              stroke={lineColor}
              strokeWidth={2.5}
              dot={{ fill: lineColor, strokeWidth: 0, r: 3 }}
              activeDot={{ r: 6, fill: lineColor, strokeWidth: 2, stroke: '#fff' }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};
