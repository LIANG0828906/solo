import React, { useEffect, useRef } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  Area,
} from 'recharts';
import { useAppStore } from '../store/useAppStore';

export const ReportPage: React.FC = () => {
  const { reportData, loadReportData, loading } = useAppStore();
  const hasLoaded = useRef(false);

  useEffect(() => {
    if (!hasLoaded.current) {
      hasLoaded.current = true;
      loadReportData();
    }
  }, [loadReportData]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  const gradientColors = ['#E76F51', '#E97A59', '#EB8561', '#ED9069', '#EF9B71', '#F1A679', '#F3B181', '#F5BC89', '#F7C791', '#F9D299'];

  const getGradientColor = (index: number, total: number) => {
    const ratio = index / Math.max(total - 1, 1);
    const colorIndex = Math.floor(ratio * (gradientColors.length - 1));
    return gradientColors[colorIndex] || gradientColors[gradientColors.length - 1];
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div
          className="p-3 rounded-lg shadow-lg"
          style={{ backgroundColor: 'white', border: '1px solid var(--color-border)' }}
        >
          <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
            {label}
          </p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: ¥{entry.value.toFixed(2)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const BarTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div
          className="p-3 rounded-lg shadow-lg"
          style={{ backgroundColor: 'white', border: '1px solid var(--color-border)' }}
        >
          <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
            {label}
          </p>
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            使用量: {payload[0].value.toFixed(0)} {payload[0].payload.unit}
          </p>
        </div>
      );
    }
    return null;
  };

  const salesTrendData = reportData?.salesTrend.map((d) => ({
    ...d,
    date: formatDate(d.date),
  })) || [];

  const ingredientRankingData = reportData?.ingredientRanking.slice(0, 10) || [];

  return (
    <div className="h-full flex flex-col">
      <div className="p-6 border-b" style={{ borderColor: 'var(--color-border)' }}>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
          数据分析
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
          过去30天销售趋势与原料消耗分析
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {loading && !reportData ? (
          <div className="flex items-center justify-center h-64">
            <p style={{ color: 'var(--color-text-secondary)' }}>加载中...</p>
          </div>
        ) : (
          <div
            className="rounded-2xl animate-fade-in"
            style={{
              backgroundColor: 'var(--color-report-card)',
              padding: '24px',
              marginBottom: '24px',
            }}
          >
            <h2 className="text-lg font-semibold mb-6" style={{ color: 'var(--color-text-primary)' }}>
              销售趋势
            </h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={salesTrendData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F4A261" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#F4A261" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E0C9B6" opacity={0.5} />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12, fill: '#6B5D4F' }}
                    axisLine={{ stroke: '#E0C9B6' }}
                    tickLine={{ stroke: '#E0C9B6' }}
                    minTickGap={20}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: '#6B5D4F' }}
                    axisLine={{ stroke: '#E0C9B6' }}
                    tickLine={{ stroke: '#E0C9B6' }}
                    tickFormatter={(value) => `¥${value}`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="totalSales"
                    stroke="transparent"
                    fill="url(#salesGradient)"
                    name="销售额"
                  />
                  <Line
                    type="monotone"
                    dataKey="totalSales"
                    stroke="#B5835A"
                    strokeWidth={2.5}
                    dot={{ fill: '#B5835A', r: 3 }}
                    activeDot={{ r: 5, fill: '#B5835A' }}
                    name="销售额"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {reportData && (
          <div
            className="rounded-2xl animate-fade-in"
            style={{
              backgroundColor: 'var(--color-report-card)',
              padding: '24px',
              animationDelay: '0.1s',
            }}
          >
            <h2 className="text-lg font-semibold mb-6" style={{ color: 'var(--color-text-primary)' }}>
              原料消耗排名 (Top 10)
            </h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={ingredientRankingData}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#E0C9B6" opacity={0.5} />
                  <XAxis
                    dataKey="ingredientName"
                    tick={{ fontSize: 12, fill: '#6B5D4F' }}
                    axisLine={{ stroke: '#E0C9B6' }}
                    tickLine={{ stroke: '#E0C9B6' }}
                    interval={0}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: '#6B5D4F' }}
                    axisLine={{ stroke: '#E0C9B6' }}
                    tickLine={{ stroke: '#E0C9B6' }}
                  />
                  <Tooltip content={<BarTooltip />} />
                  <Bar dataKey="totalUsed" radius={[6, 6, 0, 0]} name="使用量">
                    {ingredientRankingData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={getGradientColor(index, ingredientRankingData.length)}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {reportData && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div
              className="p-5 rounded-xl animate-fade-in"
              style={{ backgroundColor: 'white', border: '1px solid var(--color-border)' }}
            >
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                30天总销售额
              </p>
              <p className="text-2xl font-bold mt-1" style={{ color: 'var(--color-text-primary)' }}>
                ¥
                {reportData.salesTrend
                  .reduce((sum, d) => sum + d.totalSales, 0)
                  .toFixed(2)}
              </p>
            </div>
            <div
              className="p-5 rounded-xl animate-fade-in"
              style={{
                backgroundColor: 'white',
                border: '1px solid var(--color-border)',
                animationDelay: '0.05s',
              }}
            >
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                30天总利润
              </p>
              <p className="text-2xl font-bold mt-1" style={{ color: 'var(--color-classic-tag)' }}>
                ¥
                {reportData.salesTrend
                  .reduce((sum, d) => sum + d.totalProfit, 0)
                  .toFixed(2)}
              </p>
            </div>
            <div
              className="p-5 rounded-xl animate-fade-in"
              style={{
                backgroundColor: 'white',
                border: '1px solid var(--color-border)',
                animationDelay: '0.1s',
              }}
            >
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                30天总订单
              </p>
              <p className="text-2xl font-bold mt-1" style={{ color: 'var(--color-sidebar)' }}>
                {reportData.salesTrend.reduce((sum, d) => sum + d.orderCount, 0)}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
