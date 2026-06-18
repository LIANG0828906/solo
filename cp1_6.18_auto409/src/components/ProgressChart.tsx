import React from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';

interface ProgressChartProps {
  chartType: 'line' | 'bar' | 'area';
  data: any[];
  xKey: string;
  yKeys: { key: string; color: string; name?: string }[];
  gradientFill?: boolean;
  height?: number;
  lineWidth?: number;
  barRadius?: number;
  dotRadius?: number;
}

export default function ProgressChart({
  chartType,
  data,
  xKey,
  yKeys,
  gradientFill = false,
  height = 300,
  lineWidth = 2,
  barRadius = 4,
  dotRadius = 4,
}: ProgressChartProps) {
  const gradientId = `gradient-${yKeys[0]?.key || 'default'}`;

  const renderChartContent = () => {
    if (chartType === 'bar') {
      return (
        <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="#2A2A3E" strokeDasharray="3 3" />
          <XAxis
            dataKey={xKey}
            tick={{ fill: '#A0A0B8', fontSize: 12 }}
            axisLine={{ stroke: '#2A2A3E' }}
            tickLine={{ stroke: '#2A2A3E' }}
          />
          <YAxis
            tick={{ fill: '#A0A0B8', fontSize: 12 }}
            axisLine={{ stroke: '#2A2A3E' }}
            tickLine={{ stroke: '#2A2A3E' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1E1E2E',
              border: '1px solid #2A2A3E',
              borderRadius: '8px',
              color: '#FFFFFF',
            }}
            labelStyle={{ color: '#FFFFFF' }}
            animationDuration={800}
          />
          {yKeys.map((y) => (
            <Bar
              key={y.key}
              dataKey={y.key}
              name={y.name || y.key}
              fill={y.color}
              radius={barRadius}
              animationDuration={800}
            />
          ))}
        </BarChart>
      );
    }

    return (
      <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          {gradientFill && yKeys[0] && (
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={yKeys[0].color} stopOpacity={0.4} />
              <stop offset="95%" stopColor={yKeys[0].color} stopOpacity={0} />
            </linearGradient>
          )}
        </defs>
        <CartesianGrid stroke="#2A2A3E" strokeDasharray="3 3" />
        <XAxis
          dataKey={xKey}
          tick={{ fill: '#A0A0B8', fontSize: 12 }}
          axisLine={{ stroke: '#2A2A3E' }}
          tickLine={{ stroke: '#2A2A3E' }}
        />
        <YAxis
          tick={{ fill: '#A0A0B8', fontSize: 12 }}
          axisLine={{ stroke: '#2A2A3E' }}
          tickLine={{ stroke: '#2A2A3E' }}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#1E1E2E',
            border: '1px solid #2A2A3E',
            borderRadius: '8px',
            color: '#FFFFFF',
          }}
          labelStyle={{ color: '#FFFFFF' }}
          animationDuration={800}
        />
        {chartType === 'area' && yKeys[0] && (
          <Area
            type="monotone"
            dataKey={yKeys[0].key}
            name={yKeys[0].name || yKeys[0].key}
            stroke={yKeys[0].color}
            strokeWidth={lineWidth}
            fill={gradientFill ? `url(#${gradientId})` : yKeys[0].color}
            animationDuration={800}
          />
        )}
        {chartType === 'line' &&
          yKeys.map((y) => (
            <Line
              key={y.key}
              type="monotone"
              dataKey={y.key}
              name={y.name || y.key}
              stroke={y.color}
              strokeWidth={lineWidth}
              dot={{ r: dotRadius, fill: y.color, strokeWidth: 0 }}
              activeDot={{ r: dotRadius + 2, fill: y.color, strokeWidth: 0 }}
              animationDuration={800}
            />
          ))}
      </AreaChart>
    );
  };

  return (
    <div
      className="bg-[#1E1E2E] rounded-2xl p-5"
      style={{ height: height + 40 }}
    >
      <ResponsiveContainer width="100%" height="100%">
        {renderChartContent()}
      </ResponsiveContainer>
    </div>
  );
}
