import React from 'react';
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
} from 'recharts';
import type { DimensionStats } from '@/types';

interface BarChartProps {
  data: DimensionStats[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="chart-tooltip">
        <p className="font-medium">{label}</p>
        <p>平均分：{payload[0].value.toFixed(1)}</p>
      </div>
    );
  }
  return null;
};

export const BarChart: React.FC<BarChartProps> = ({ data }) => {
  return (
    <div className="w-full h-full">
      <h4 className="text-sm font-semibold text-text-primary mb-3">各维度平均分</h4>
      <ResponsiveContainer width="100%" height={240}>
        <RechartsBarChart data={data} barCategoryGap="30%">
          <XAxis
            dataKey="dimension"
            tick={{ fill: 'var(--color-text-secondary)', fontSize: 12 }}
            axisLine={{ stroke: '#e5e7eb' }}
            tickLine={false}
          />
          <YAxis
            domain={[0, 10]}
            tick={{ fill: 'var(--color-text-secondary)', fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.04)' }} />
          <Bar dataKey="average" radius={[6, 6, 0, 0]} maxBarSize={50}>
            <LabelList
              dataKey="average"
              position="top"
              formatter={(value: number) => value.toFixed(1)}
              style={{ fill: 'var(--color-text-primary)', fontSize: 12, fontWeight: 600 }}
            />
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
};
