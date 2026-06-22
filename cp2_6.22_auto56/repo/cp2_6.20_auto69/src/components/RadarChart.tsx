import React from 'react';
import {
  RadarChart as RechartsRadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import type { RadarData } from '@/types';

interface RadarChartProps {
  data: RadarData[];
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="chart-tooltip">
        <p className="font-medium mb-1">{payload[0]?.payload?.dimension}</p>
        {payload.map((entry: any, idx: number) => (
          <p key={idx} style={{ color: entry.color }}>
            {entry.name}：{entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export const RadarChart: React.FC<RadarChartProps> = ({ data }) => {
  return (
    <div className="w-full h-full">
      <h4 className="text-sm font-semibold text-text-primary mb-3">
        学生得分 vs 班级平均
      </h4>
      <ResponsiveContainer width="100%" height={240}>
        <RechartsRadarChart data={data} cx="50%" cy="50%" outerRadius="70%">
          <PolarGrid stroke="#e5e7eb" />
          <PolarAngleAxis
            dataKey="dimension"
            tick={{ fill: 'var(--color-text-secondary)', fontSize: 12 }}
          />
          <PolarRadiusAxis
            domain={[0, 10]}
            tick={{ fill: 'var(--color-text-secondary)', fontSize: 10 }}
            axisLine={false}
            tickCount={5}
          />
          <Radar
            name="学生得分"
            dataKey="student"
            stroke="#1976d2"
            fill="#1976d2"
            fillOpacity={0.25}
            strokeWidth={2}
          />
          <Radar
            name="班级平均"
            dataKey="classAverage"
            stroke="#9e9e9e"
            fill="#9e9e9e"
            fillOpacity={0.1}
            strokeWidth={2}
            strokeDasharray="5 5"
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            verticalAlign="top"
            align="right"
            iconType="line"
            wrapperStyle={{ fontSize: 12, color: 'var(--color-text-secondary)', paddingBottom: 8 }}
          />
        </RechartsRadarChart>
      </ResponsiveContainer>
    </div>
  );
};
