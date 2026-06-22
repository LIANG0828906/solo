import React from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useRouteStore } from '../store/useRouteStore';

interface ElevationChartProps {
  variant?: 'thumbnail' | 'detailed';
}

const ElevationChart: React.FC<ElevationChartProps> = ({ variant = 'detailed' }) => {
  const elevationData = useRouteStore((state) => state.elevationData);
  const height = variant === 'thumbnail' ? 120 : 200;

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={elevationData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="elevationGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#2E7D32" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#2E7D32" stopOpacity={0.1} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="distance"
            tick={{ fontSize: 11, fill: '#666' }}
            axisLine={{ stroke: '#e0e0e0' }}
            tickLine={false}
            unit="km"
          />
          <YAxis
            tick={{ fontSize: 11, fill: '#666' }}
            axisLine={false}
            tickLine={false}
            unit="m"
            width={45}
          />
          <Tooltip
            formatter={(value: number, name: string) => [
              name === 'elevation' ? `${value}m` : `${value}%`,
              name === 'elevation' ? '海拔' : '坡度',
            ]}
            labelFormatter={(label) => `距离: ${label}km`}
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e0e0e0',
              borderRadius: 6,
              fontSize: 12,
            }}
          />
          <Area
            type="monotone"
            dataKey="elevation"
            stroke="#2E7D32"
            strokeWidth={2}
            fill="url(#elevationGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ElevationChart;
