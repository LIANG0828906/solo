import React, { useState, useCallback } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
} from 'recharts';

export interface EstimateData {
  taskId: string;
  taskName: string;
  pert: number;
  poker: number;
}

interface EstimateChartProps {
  data: EstimateData[];
}

const PERT_COLOR = '#3B82F6';
const POKER_COLOR = '#F59E0B';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div
        style={{
          backgroundColor: '#111827',
          color: 'white',
          padding: '8px 12px',
          borderRadius: '6px',
          fontSize: '12px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        }}
      >
        <p style={{ marginBottom: '6px', fontWeight: 600 }}>{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span
              style={{
                display: 'inline-block',
                width: '8px',
                height: '8px',
                borderRadius: '2px',
                backgroundColor: entry.fill,
              }}
            />
            {entry.name}: {entry.value.toFixed(1)} 小时
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const EstimateChart: React.FC<EstimateChartProps> = ({ data }) => {
  const [activeBar, setActiveBar] = useState<{ index: number; type: string } | null>(null);

  const handleBarClick = useCallback((data: any, index: number, type: string) => {
    setActiveBar({ index, type });
  }, []);

  const chartData = data.map((item) => ({
    name: item.taskName,
    PERT: Number(item.pert.toFixed(1)),
    扑克: Number(item.poker.toFixed(1)),
  }));

  if (data.length === 0) {
    return (
      <div className="empty-state">
        <p>暂无任务数据</p>
        <p style={{ fontSize: '12px', marginTop: '4px' }}>添加任务后将显示估算对比</p>
      </div>
    );
  }

  return (
    <div className="chart-wrapper">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{ top: 20, right: 20, left: 0, bottom: 40 }}
          barGap={12}
          barCategoryGap="24%"
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fill: '#6B7280', fontSize: 12 }}
            axisLine={{ stroke: '#E5E7EB' }}
            tickLine={false}
            interval={0}
            angle={-30}
            textAnchor="end"
            height={60}
          />
          <YAxis
            tick={{ fill: '#6B7280', fontSize: 12 }}
            axisLine={{ stroke: '#E5E7EB' }}
            tickLine={false}
            label={{
              value: '工时 (小时)',
              angle: -90,
              position: 'insideLeft',
              style: { fill: '#6B7280', fontSize: '12px' },
            }}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(59, 130, 246, 0.05)' }} />
          <Bar
            dataKey="PERT"
            fill={PERT_COLOR}
            radius={[4, 4, 0, 0]}
            onClick={(data, index) => handleBarClick(data, index, 'PERT')}
          >
            <LabelList
              dataKey="PERT"
              position="top"
              fill="#3B82F6"
              fontSize={11}
              formatter={(value: number) => value.toFixed(1)}
            />
          </Bar>
          <Bar
            dataKey="扑克"
            fill={POKER_COLOR}
            radius={[4, 4, 0, 0]}
            onClick={(data, index) => handleBarClick(data, index, '扑克')}
          >
            <LabelList
              dataKey="扑克"
              position="top"
              fill="#F59E0B"
              fontSize={11}
              formatter={(value: number) => value.toFixed(1)}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default EstimateChart;
