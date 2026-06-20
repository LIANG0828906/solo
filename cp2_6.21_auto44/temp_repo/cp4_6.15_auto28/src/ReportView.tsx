import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  LineChart, Line, Area
} from 'recharts';
import { BookStorage } from './BookStorage';
import { formatMonth, formatShortDate } from './utils';

const ChartWrapper: React.FC<{ children: React.ReactNode; chartKey: string }> = ({ children, chartKey }) => {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setVisible(false);
    const timer = setTimeout(() => setVisible(true), 30);
    return () => clearTimeout(timer);
  }, [chartKey]);

  return (
    <div ref={ref} className={`report-chart ${visible ? 'visible' : ''}`}>
      {children}
    </div>
  );
};

const CATEGORY_COLORS = [
  '#8B7355', '#A08060', '#C9A86C', '#B8956E',
  '#9B8B7A', '#D4B896', '#C4A77D', '#A68B5B',
  '#BFA07A', '#8B6914'
];

const ReportView: React.FC = () => {
  const [activeChart, setActiveChart] = useState<'all' | 'category' | 'monthly' | 'daily'>('all');
  const [chartKey, setChartKey] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setChartKey(prev => prev + 1), 50);
    return () => clearTimeout(timer);
  }, [activeChart]);

  const categoryData = useMemo(() => BookStorage.getCategoryStats(), []);
  const monthlyData = useMemo(() => BookStorage.getMonthlyReadingStats(), []);
  const dailyData = useMemo(() => BookStorage.getDailyPageStats(), []);

  const totalBooks = useMemo(() => BookStorage.getBooks().length, []);
  const totalRecords = useMemo(() => BookStorage.getAllReadingRecords().length, []);
  const totalHours = useMemo(() => 
    monthlyData.reduce((sum, item) => sum + item.hours, 0),
    [monthlyData]
  );
  const totalPages = useMemo(() =>
    dailyData.reduce((sum, item) => sum + item.pages, 0),
    [dailyData]
  );

  const renderCategoryTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div style={{
          background: 'var(--color-white)',
          padding: '12px 16px',
          borderRadius: 8,
          boxShadow: 'var(--shadow-lg)',
          border: '1px solid var(--color-border)'
        }}>
          <p style={{ fontWeight: 600, color: 'var(--color-text)', marginBottom: 4 }}>
            {data.name}
          </p>
          <p style={{ color: 'var(--color-text-light)', fontSize: 13 }}>
            数量: <span style={{ fontWeight: 600, color: 'var(--color-primary)' }}>{data.value} 本</span>
          </p>
          <p style={{ color: 'var(--color-text-light)', fontSize: 13 }}>
            占比: <span style={{ fontWeight: 600, color: 'var(--color-primary)' }}>{data.percentage}%</span>
          </p>
        </div>
      );
    }
    return null;
  };

  const renderMonthlyTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          background: 'var(--color-white)',
          padding: '12px 16px',
          borderRadius: 8,
          boxShadow: 'var(--shadow-lg)',
          border: '1px solid var(--color-border)'
        }}>
          <p style={{ fontWeight: 600, color: 'var(--color-text)', marginBottom: 4 }}>
            {formatMonth(label)}
          </p>
          <p style={{ color: 'var(--color-text-light)', fontSize: 13 }}>
            阅读时长: <span style={{ fontWeight: 600, color: 'var(--color-primary)' }}>{payload[0].value} 小时</span>
          </p>
        </div>
      );
    }
    return null;
  };

  const renderDailyTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          background: 'var(--color-white)',
          padding: '12px 16px',
          borderRadius: 8,
          boxShadow: 'var(--shadow-lg)',
          border: '1px solid var(--color-border)'
        }}>
          <p style={{ fontWeight: 600, color: 'var(--color-text)', marginBottom: 4 }}>
            {label}
          </p>
          <p style={{ color: 'var(--color-text-light)', fontSize: 13 }}>
            阅读页数: <span style={{ fontWeight: 600, color: 'var(--color-primary)' }}>{payload[0].value} 页</span>
          </p>
        </div>
      );
    }
    return null;
  };

  const hasData = totalBooks > 0;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">阅读报告</h1>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {[
            { key: 'all', label: '全部' },
            { key: 'category', label: '分类分布' },
            { key: 'monthly', label: '月度时长' },
            { key: 'daily', label: '每日页数' }
          ].map(item => (
            <button
              key={item.key}
              className={`btn ${activeChart === item.key ? 'btn-primary' : 'btn-secondary'} btn-sm`}
              onClick={() => setActiveChart(item.key as typeof activeChart)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: 16,
        marginBottom: 24
      }}>
        <div className="report-card" style={{ padding: 20 }}>
          <div style={{ fontSize: 13, color: 'var(--color-text-light)', marginBottom: 8 }}>
            藏书总数
          </div>
          <div style={{ 
            fontFamily: 'var(--font-display)',
            fontSize: 32,
            fontWeight: 700,
            color: 'var(--color-primary)'
          }}>
            {totalBooks}
          </div>
          <div style={{ fontSize: 12, color: 'var(--color-text-light)', marginTop: 4 }}>
            本
          </div>
        </div>
        <div className="report-card" style={{ padding: 20 }}>
          <div style={{ fontSize: 13, color: 'var(--color-text-light)', marginBottom: 8 }}>
            阅读记录
          </div>
          <div style={{ 
            fontFamily: 'var(--font-display)',
            fontSize: 32,
            fontWeight: 700,
            color: 'var(--color-warning)'
          }}>
            {totalRecords}
          </div>
          <div style={{ fontSize: 12, color: 'var(--color-text-light)', marginTop: 4 }}>
            条
          </div>
        </div>
        <div className="report-card" style={{ padding: 20 }}>
          <div style={{ fontSize: 13, color: 'var(--color-text-light)', marginBottom: 8 }}>
            累计阅读时长
          </div>
          <div style={{ 
            fontFamily: 'var(--font-display)',
            fontSize: 32,
            fontWeight: 700,
            color: 'var(--color-success)'
          }}>
            {totalHours.toFixed(1)}
          </div>
          <div style={{ fontSize: 12, color: 'var(--color-text-light)', marginTop: 4 }}>
            小时
          </div>
        </div>
        <div className="report-card" style={{ padding: 20 }}>
          <div style={{ fontSize: 13, color: 'var(--color-text-light)', marginBottom: 8 }}>
            近30天阅读
          </div>
          <div style={{ 
            fontFamily: 'var(--font-display)',
            fontSize: 32,
            fontWeight: 700,
            color: 'var(--color-accent)'
          }}>
            {totalPages}
          </div>
          <div style={{ fontSize: 12, color: 'var(--color-text-light)', marginTop: 4 }}>
            页
          </div>
        </div>
      </div>

      {hasData ? (
        <div className="report-grid">
          {(activeChart === 'all' || activeChart === 'category') && (
            <div key={`category-${chartKey}`} className="report-card">
              <h3 className="report-title">图书分类分布</h3>
              {categoryData.length > 0 ? (
                <ChartWrapper chartKey={`category-${chartKey}`}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {categoryData.map((_, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip content={renderCategoryTooltip} />
                      <Legend 
                        formatter={(value) => (
                          <span style={{ color: 'var(--color-text)', fontSize: 12 }}>{value}</span>
                        )}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartWrapper>
              ) : (
                <div style={{ textAlign: 'center', padding: 40, color: 'var(--color-text-light)' }}>
                  暂无分类数据
                </div>
              )}
            </div>
          )}

          {(activeChart === 'all' || activeChart === 'monthly') && (
            <div key={`monthly-${chartKey}`} className="report-card">
              <h3 className="report-title">近12个月阅读时长</h3>
              <ChartWrapper chartKey={`monthly-${chartKey}`}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
                    <defs>
                      <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#C9A86C" />
                        <stop offset="100%" stopColor="#8B7355" />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                    <XAxis 
                      dataKey="month" 
                      tick={{ fill: 'var(--color-text-light)', fontSize: 11 }}
                      tickFormatter={formatMonth}
                      interval={2}
                    />
                    <YAxis 
                      tick={{ fill: 'var(--color-text-light)', fontSize: 11 }}
                      label={{ 
                        value: '小时', 
                        angle: -90, 
                        position: 'insideLeft',
                        fill: 'var(--color-text-light)',
                        fontSize: 12
                      }}
                    />
                    <Tooltip content={renderMonthlyTooltip} />
                    <Bar dataKey="hours" fill="url(#barGradient)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartWrapper>
            </div>
          )}

          {(activeChart === 'all' || activeChart === 'daily') && (
            <div key={`daily-${chartKey}`} className="report-card" style={{ gridColumn: '1 / -1' }}>
              <h3 className="report-title">近30天每日阅读页数</h3>
              <ChartWrapper chartKey={`daily-${chartKey}`}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={dailyData} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
                    <defs>
                      <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#C9A86C" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#C9A86C" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fill: 'var(--color-text-light)', fontSize: 11 }}
                      tickFormatter={formatShortDate}
                      interval={4}
                    />
                    <YAxis 
                      tick={{ fill: 'var(--color-text-light)', fontSize: 11 }}
                      label={{ 
                        value: '页数', 
                        angle: -90, 
                        position: 'insideLeft',
                        fill: 'var(--color-text-light)',
                        fontSize: 12
                      }}
                    />
                    <Tooltip content={renderDailyTooltip} />
                    <Area 
                      type="monotone" 
                      dataKey="pages" 
                      stroke="transparent"
                      fill="url(#lineGradient)"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="pages" 
                      stroke="#8B7355" 
                      strokeWidth={2}
                      dot={{ fill: '#8B7355', r: 3 }}
                      activeDot={{ r: 6, fill: '#A08060' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartWrapper>
            </div>
          )}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-state-icon">📊</div>
          <p className="empty-state-text">
            还没有足够的数据生成报告
          </p>
          <p style={{ color: 'var(--color-text-light)', fontSize: 14, marginBottom: 20 }}>
            添加一些图书并记录阅读进度后，这里会显示您的阅读统计
          </p>
        </div>
      )}
    </div>
  );
};

export default ReportView;
