import React from 'react';
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { CategoryTotal, DailySpending } from '@/types';

interface ExpenseTrackerProps {
  tripId: string;
  categoryTotals: CategoryTotal[];
  dailySpending: DailySpending[];
}

const ExpenseTracker: React.FC<ExpenseTrackerProps> = ({ categoryTotals, dailySpending }) => {
  const formatCurrency = (value: number) => {
    return `¥${value.toLocaleString()}`;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  const totalSpent = categoryTotals.reduce((sum, item) => sum + item.value, 0);

  const pieData = categoryTotals.map(item => ({
    ...item,
    percentage: totalSpent > 0 ? ((item.value / totalSpent) * 100).toFixed(1) : '0'
  }));

  const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div style={{
          background: 'white',
          padding: '12px 16px',
          borderRadius: '4px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          border: '1px solid #e2e8f0'
        }}>
          <p style={{ fontWeight: 700, color: '#1a365d', marginBottom: '4px' }}>
            {data.name}
          </p>
          <p style={{ color: '#4a5568', fontSize: '14px' }}>
            {formatCurrency(data.value)} ({data.percentage}%)
          </p>
        </div>
      );
    }
    return null;
  };

  const CustomLineTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          background: 'white',
          padding: '12px 16px',
          borderRadius: '4px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          border: '1px solid #e2e8f0'
        }}>
          <p style={{ fontWeight: 700, color: '#1a365d', marginBottom: '4px' }}>
            {label}
          </p>
          <p style={{ color: '#ff6b6b', fontSize: '14px', fontWeight: 600 }}>
            {formatCurrency(payload[0].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }: any) => {
    if (percent < 0.05) return null;
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={12}
        fontWeight={600}
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div className="charts-container">
      <div className="chart-card" style={{ animationDelay: '0ms' }}>
        <h3 className="chart-title">消费类别占比</h3>
        {pieData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart key={`pie-${pieData.length}-${totalSpent}`}>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderCustomizedLabel}
                outerRadius={100}
                innerRadius={50}
                dataKey="value"
                isAnimationActive={true}
                animationBegin={0}
                animationDuration={800}
                animationEasing="ease-out"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}-${entry.category}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomPieTooltip />} />
              <Legend
                formatter={(value) => <span style={{ color: '#4a5568', fontSize: '13px' }}>{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#718096' }}>
            暂无消费数据
          </div>
        )}
      </div>

      <div className="chart-card" style={{ animationDelay: '100ms' }}>
        <h3 className="chart-title">每日花费趋势</h3>
        {dailySpending.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart 
              key={`line-${dailySpending.length}`}
              data={dailySpending} 
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                dataKey="date"
                tickFormatter={formatDate}
                stroke="#718096"
                fontSize={12}
              />
              <YAxis
                stroke="#718096"
                fontSize={12}
                tickFormatter={(value) => `¥${value}`}
              />
              <Tooltip content={<CustomLineTooltip />} />
              <Line
                type="monotone"
                dataKey="amount"
                name="花费"
                stroke="#ff6b6b"
                strokeWidth={3}
                dot={{ fill: '#ff6b6b', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, fill: '#1a365d' }}
                isAnimationActive={true}
                animationBegin={0}
                animationDuration={800}
                animationEasing="ease-out"
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#718096' }}>
            暂无每日消费数据
          </div>
        )}
      </div>
    </div>
  );
};

export default ExpenseTracker;
