import React, { useMemo } from 'react';
import {
  BarChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
} from 'recharts';
import { getFourWeeksRange, formatDisplayDate } from '../utils/dateUtils';
import { useFitTrackyStore } from '../store';
import './MixedChart.css';

const MixedChart: React.FC = () => {
  const getDailyTotalCalories = useFitTrackyStore((state) => state.getDailyTotalCalories);
  
  const chartData = useMemo(() => {
    const { days } = getFourWeeksRange();
    return days.map((date) => {
      const daily = getDailyTotalCalories(date);
      return {
        date: formatDisplayDate(date),
        dateFull: date,
        消耗卡路里: daily.burned,
        摄入卡路里: daily.consumed,
      };
    });
  }, [getDailyTotalCalories]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          <p className="tooltip-date">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="tooltip-item" style={{ color: entry.color }}>
              {entry.name}: {entry.value} 卡
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="mixed-chart-container">
      <h3 className="chart-title">近四周卡路里趋势</h3>
      <div className="chart-wrapper">
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis
              dataKey="date"
              stroke="var(--text-secondary)"
              tick={{ fontSize: 11, fill: 'var(--text-secondary)' }}
              interval={3}
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis
              stroke="var(--text-secondary)"
              tick={{ fontSize: 12, fill: 'var(--text-secondary)' }}
              label={{ value: '卡路里', angle: -90, position: 'insideLeft', fill: 'var(--text-secondary)', fontSize: 12 }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ paddingTop: '20px' }}
              iconType="circle"
            />
            <Bar
              dataKey="消耗卡路里"
              fill="#4CAF50"
              radius={[4, 4, 0, 0]}
              barSize={12}
            />
            <Line
              type="monotone"
              dataKey="摄入卡路里"
              stroke="#FF5722"
              strokeWidth={2}
              dot={{ r: 3, fill: '#FF5722' }}
              activeDot={{ r: 6 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default MixedChart;
