import { useSelector } from 'react-redux';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { RootState } from '../store';
import './NutritionChart.css';

const COLORS = {
  热量: '#F59E0B',
  蛋白质: '#10B981',
  碳水: '#3B82F6',
  脂肪: '#EF4444',
};

export default function WeeklyBarChart() {
  const chartData = useSelector((state: RootState) => state.app.chartData);

  if (!chartData) {
    return <div className="nutrition-loading">加载中...</div>;
  }

  return (
    <div className="chart-section bar-chart-section">
      <h4 className="chart-title">周度营养趋势</h4>
      <div className="bar-chart-container">
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={chartData.barData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis dataKey="day" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="蛋白质" stackId="a" fill={COLORS.蛋白质} />
            <Bar dataKey="碳水" stackId="a" fill={COLORS.碳水} />
            <Bar dataKey="脂肪" stackId="a" fill={COLORS.脂肪} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
