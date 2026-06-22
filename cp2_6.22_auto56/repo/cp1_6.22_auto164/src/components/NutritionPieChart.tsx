import { useState } from 'react';
import { useSelector } from 'react-redux';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { RootState } from '../store';
import './NutritionChart.css';

export default function NutritionPieChart() {
  const chartData = useSelector((state: RootState) => state.app.chartData);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  if (!chartData) {
    return <div className="nutrition-loading">加载中...</div>;
  }

  const onPieEnter = (_: unknown, index: number) => {
    setActiveIndex(index);
  };

  const onPieLeave = () => {
    setActiveIndex(null);
  };

  const renderActiveShape = (props: { cx: number; cy: number; midAngle: number; innerRadius: number; outerRadius: number; startAngle: number; endAngle: number; fill: string; payload: { name: string; value: number } }) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload } = props;
    return (
      <g>
        <text x={cx} y={cy} dy={8} textAnchor="middle" fill={fill} className="pie-center-text">
          {payload.name}
        </text>
        <text x={cx} y={cy + 24} textAnchor="middle" fill="#374151" fontSize={14} fontWeight={600}>
          {payload.value}
        </text>
        <Cell
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius + 10}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
        />
        <Cell
          cx={cx}
          cy={cy}
          startAngle={startAngle}
          endAngle={endAngle}
          innerRadius={outerRadius + 12}
          outerRadius={outerRadius + 16}
          fill={fill}
        />
      </g>
    );
  };

  return (
    <div className="chart-section">
      <h4 className="chart-title">本周营养占比</h4>
      <div className="pie-chart-container">
        <ResponsiveContainer width="100%" height={240}>
          <PieChart>
            <Pie
              activeIndex={activeIndex ?? undefined}
              activeShape={renderActiveShape}
              data={chartData.pieData}
              cx="50%"
              cy="50%"
              innerRadius={45}
              outerRadius={75}
              paddingAngle={2}
              dataKey="value"
              onMouseEnter={onPieEnter}
              onMouseLeave={onPieLeave}
            >
              {chartData.pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} stroke={entry.color} strokeWidth={1} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number, name: string) => [`${value} ${name === '热量' ? 'kcal' : 'g'}`, name]}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
