import React from 'react';
import {
  PieChart as RechartsPieChart,
  Pie,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend,
} from 'recharts';
import type { GradeDistribution } from '@/types';

interface PieChartProps {
  data: GradeDistribution[];
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="chart-tooltip">
        <p className="font-medium">{payload[0].name}</p>
        <p>数量：{payload[0].value}</p>
      </div>
    );
  }
  return null;
};

export const PieChart: React.FC<PieChartProps> = ({ data }) => {
  return (
    <div className="w-full h-full">
      <h4 className="text-sm font-semibold text-text-primary mb-3">评分等级分布</h4>
      <ResponsiveContainer width="100%" height={240}>
        <RechartsPieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={85}
            paddingAngle={3}
            dataKey="count"
            nameKey="grade"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            verticalAlign="bottom"
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: 12, color: 'var(--color-text-secondary)' }}
          />
        </RechartsPieChart>
      </ResponsiveContainer>
    </div>
  );
};
