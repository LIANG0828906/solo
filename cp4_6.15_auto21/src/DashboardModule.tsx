import { useEffect, useState, useMemo } from 'react';
import type { Book, Order, DashboardStats } from './types';
import { formatCurrency, calculateDashboardStats } from './utils';

interface DashboardModuleProps {
  books: Book[];
  orders: Order[];
}

const AnimatedNumber = ({ value, prefix = '' }: { value: number; prefix?: string }) => {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const duration = 1500;
    const startTime = performance.now();
    const startValue = 0;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(startValue + (value - startValue) * easeOut);
      setDisplay(current);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [value]);

  return <span>{prefix}{display.toLocaleString()}</span>;
};

const AnimatedCurrency = ({ value }: { value: number }) => {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const duration = 1500;
    const startTime = performance.now();
    const startValue = 0;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const current = startValue + (value - startValue) * easeOut;
      setDisplay(current);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [value]);

  return <span>{formatCurrency(display)}</span>;
};

const SalesChart = ({ data }: { data: { date: string; amount: number }[] }) => {
  const width = 800;
  const height = 280;
  const padding = { top: 20, right: 20, bottom: 40, left: 60 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const maxAmount = useMemo(() => {
    const max = Math.max(...data.map(d => d.amount), 100);
    return Math.ceil(max / 100) * 100;
  }, [data]);

  const barWidth = chartWidth / data.length * 0.6;
  const barGap = chartWidth / data.length * 0.4;

  const yAxisTicks = 5;

  return (
    <svg className="chart-svg" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id="barGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#6B8CC4" />
          <stop offset="100%" stopColor="#4A6FA5" />
        </linearGradient>
      </defs>
      {Array.from({ length: yAxisTicks + 1 }).map((_, i) => {
        const y = padding.top + (chartHeight / yAxisTicks) * i;
        const value = maxAmount - (maxAmount / yAxisTicks) * i;
        return (
          <g key={i}>
            <line
              x1={padding.left}
              y1={y}
              x2={width - padding.right}
              y2={y}
              className="chart-axis-line"
              strokeDasharray={i === yAxisTicks ? '0' : '4 4'}
            />
            <text
              x={padding.left - 10}
              y={y + 4}
              textAnchor="end"
              className="chart-axis-text"
            >
              ¥{Math.round(value)}
            </text>
          </g>
        );
      })}
      {data.map((item, index) => {
        const barHeight = (item.amount / maxAmount) * chartHeight;
        const x = padding.left + (chartWidth / data.length) * index + barGap / 2;
        const y = padding.top + chartHeight - barHeight;
        return (
          <g key={item.date}>
            <rect
              className="chart-bar"
              x={x}
              y={y}
              width={barWidth}
              height={barHeight}
              rx="4"
              fill="url(#barGradient)"
            >
              <title>{item.date}: {formatCurrency(item.amount)}</title>
            </rect>
            <text
              x={x + barWidth / 2}
              y={height - padding.bottom + 20}
              textAnchor="middle"
              className="chart-axis-text"
            >
              {item.date}
            </text>
            {item.amount > 0 && (
              <text
                x={x + barWidth / 2}
                y={y - 8}
                textAnchor="middle"
                fill="#4A6FA5"
                fontSize="11"
                fontWeight="600"
              >
                ¥{item.amount.toFixed(0)}
              </text>
            )}
          </g>
        );
      })}
      <line
        x1={padding.left}
        y1={padding.top + chartHeight}
        x2={width - padding.right}
        y2={padding.top + chartHeight}
        className="chart-axis-line"
      />
    </svg>
  );
};

const DashboardModule = ({ books, orders }: DashboardModuleProps) => {
  const stats: DashboardStats = useMemo(
    () => calculateDashboardStats(books, orders),
    [books, orders]
  );

  return (
    <div className="module">
      <div className="section-header">
        <h2 className="section-title">数据看板</h2>
      </div>

      <div className="dashboard-stats">
        <div className="stat-card">
          <div className="stat-label">总销售额</div>
          <div className="stat-value">
            <AnimatedCurrency value={stats.totalSales} />
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">总订单数</div>
          <div className="stat-value">
            <AnimatedNumber value={stats.totalOrders} />
            <span style={{ fontSize: '16px', fontWeight: '500', marginLeft: '4px' }}>单</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">库存总价值</div>
          <div className="stat-value">
            <AnimatedCurrency value={stats.totalInventoryValue} />
          </div>
        </div>
      </div>

      <div className="chart-container">
        <h3 className="chart-title">近7天销售额趋势</h3>
        <SalesChart data={stats.salesLast7Days} />
      </div>
    </div>
  );
};

export default DashboardModule;
