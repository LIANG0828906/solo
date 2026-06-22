import React, { useMemo } from 'react';
import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { Plant } from '../types';
import { generateWeeklyChartConfig } from '../chartGenerator';
import styles from './Chart.module.css';

interface ChartProps {
  plant: Plant;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  label?: string;
}

const CustomTooltip: React.FC<CustomTooltipProps> = function CustomTooltip({
  active,
  payload,
  label,
}) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className={styles.tooltip}>
      <div className={styles.tooltipLabel}>{label}</div>
      {payload.map((entry, index) => (
        <div key={index} className={styles.tooltipItem}>
          <span
            className={styles.tooltipDot}
            style={{ backgroundColor: entry.color }}
          />
          <span>
            {entry.name}: {entry.value}
            {entry.name === '高度' ? ' cm' : ' 片'}
          </span>
        </div>
      ))}
    </div>
  );
};

const Chart: React.FC<ChartProps> = function Chart({ plant }) {
  const chartConfig = useMemo(
    () =>
      generateWeeklyChartConfig(
        plant.growthRecords,
        plant.initialHeight,
        plant.initialLeaves,
        plant.createdAt
      ),
    [plant]
  );

  if (chartConfig.data.length === 0) {
    return (
      <div className={styles.chartContainer}>
        <h3 className={styles.chartTitle}>生长曲线</h3>
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>📈</div>
          <p>暂无足够数据生成生长曲线</p>
          <p style={{ fontSize: '12px', marginTop: '8px' }}>
            添加几次生长记录后即可查看
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.chartContainer}>
      <h3 className={styles.chartTitle}>生长曲线</h3>
      <div className={styles.chartWrapper}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartConfig.data}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12, fill: '#7f8c8d' }}
              axisLine={{ stroke: '#bdc3c7' }}
            />
            <YAxis
              yAxisId="left"
              tick={{ fontSize: 12, fill: '#3498db' }}
              axisLine={{ stroke: '#3498db' }}
              label={{
                value: chartConfig.heightAxis.name,
                angle: -90,
                position: 'insideLeft',
                style: { textAnchor: 'middle', fill: '#3498db', fontSize: 12 },
              }}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fontSize: 12, fill: '#2ecc71' }}
              axisLine={{ stroke: '#2ecc71' }}
              label={{
                value: chartConfig.leavesAxis.name,
                angle: 90,
                position: 'insideRight',
                style: { textAnchor: 'middle', fill: '#2ecc71', fontSize: 12 },
              }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ paddingTop: '10px' }}
              iconType="line"
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="height"
              name="高度"
              stroke="#3498db"
              strokeWidth={2}
              dot={{ r: 4, fill: '#3498db' }}
              activeDot={{ r: 6 }}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="leaves"
              name="叶片数"
              stroke="#2ecc71"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={{ r: 4, fill: '#2ecc71' }}
              activeDot={{ r: 6 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default Chart;
