import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchStats } from '@/api';
import type { StatsData } from '@/types';
import StatCard from '@/components/StatCard';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    const response = await fetchStats();
    if (response.success && response.data) {
      setStats(response.data);
    }
    setLoading(false);
  };

  const lineChartPath = useMemo(() => {
    if (!stats || stats.salesTrend.length === 0) return '';
    const data = stats.salesTrend;
    const width = 600;
    const height = 280;
    const padding = 40;
    const maxSales = Math.max(...data.map(d => d.sales), 100);
    const stepX = (width - padding * 2) / (data.length - 1 || 1);

    const points = data.map((d, i) => {
      const x = padding + i * stepX;
      const y = height - padding - (d.sales / maxSales) * (height - padding * 2);
      return `${x},${y}`;
    });

    const areaPoints = [
      `${padding},${height - padding}`,
      ...points,
      `${padding + (data.length - 1) * stepX},${height - padding}`
    ].join(' ');

    return {
      line: points.join(' '),
      area: areaPoints,
      data,
      width,
      height,
      padding,
      maxSales,
      stepX,
    };
  }, [stats]);

  const pieChartData = useMemo(() => {
    if (!stats || stats.categoryDistribution.length === 0) return [];
    const colors = ['#C67B3D', '#5A7D3C', '#4A90D9', '#9C27B0', '#FF9800', '#F44336', '#00BCD4'];
    let cumulativePercent = 0;

    return stats.categoryDistribution.map((item, index) => {
      const percent = parseFloat(item.percentage);
      const startPercent = cumulativePercent;
      cumulativePercent += percent;
      const endPercent = cumulativePercent;

      const startAngle = (startPercent / 100) * 2 * Math.PI - Math.PI / 2;
      const endAngle = (endPercent / 100) * 2 * Math.PI - Math.PI / 2;

      const x1 = 150 + 100 * Math.cos(startAngle);
      const y1 = 150 + 100 * Math.sin(startAngle);
      const x2 = 150 + 100 * Math.cos(endAngle);
      const y2 = 150 + 100 * Math.sin(endAngle);

      const largeArcFlag = percent > 50 ? 1 : 0;

      const pathData = [
        `M 150 150`,
        `L ${x1} ${y1}`,
        `A 100 100 0 ${largeArcFlag} 1 ${x2} ${y2}`,
        `Z`
      ].join(' ');

      return {
        ...item,
        color: colors[index % colors.length],
        pathData,
      };
    });
  }, [stats]);

  if (loading) {
    return (
      <div className="container">
        <div className="page-header">
          <h1 className="page-title">数据看板</h1>
          <p className="page-subtitle">加载中...</p>
        </div>
        <div className="dashboard-grid">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="card" style={{ padding: '24px', height: '120px' }}>
              <div className="skeleton" style={{ width: '100%', height: '100%' }}></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="page-header">
        <h1 className="page-title">数据看板</h1>
        <p className="page-subtitle">查看书店运营核心数据</p>
      </div>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '32px' }}>
        <button className="btn btn-outline" onClick={() => navigate('/admin/books')}>
          <i className="fas fa-book"></i> 图书管理
        </button>
        <button className="btn btn-outline" onClick={() => navigate('/admin/borrows')}>
          <i className="fas fa-clipboard-list"></i> 借阅管理
        </button>
      </div>

      {stats && (
        <>
          <div className="dashboard-grid">
            <StatCard
              label="总图书数"
              value={stats.totalBooks}
              maxValue={1000}
              gradient="linear-gradient(135deg, #C67B3D, #D49560)"
            />
            <StatCard
              label="总会员数"
              value={stats.totalUsers}
              maxValue={1000}
              gradient="linear-gradient(135deg, #5A7D3C, #7BA056)"
            />
            <StatCard
              label="本月销售额"
              value={stats.monthlySales}
              prefix="¥"
              maxValue={50000}
              gradient="linear-gradient(135deg, #4A90D9, #6FA8E3)"
            />
          </div>

          <div className="charts-container">
            <div className="chart-card">
              <h3 className="chart-title">
                <i className="fas fa-chart-line" style={{ marginRight: '8px', color: 'var(--color-primary)' }}></i>
                近7天销售趋势
              </h3>
              {lineChartPath && (
                <div className="line-chart">
                  <svg width="100%" height="100%" viewBox={`0 0 ${lineChartPath.width} ${lineChartPath.height}`} preserveAspectRatio="xMidYMid meet">
                    <defs>
                      <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#C67B3D" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#C67B3D" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    {[0, 0.25, 0.5, 0.75, 1].map((tick, i) => {
                      const y = lineChartPath.padding + tick * (lineChartPath.height - lineChartPath.padding * 2);
                      return (
                        <g key={i}>
                          <line
                            x1={lineChartPath.padding}
                            y1={y}
                            x2={lineChartPath.width - lineChartPath.padding}
                            y2={y}
                            stroke="#E8E0D5"
                            strokeDasharray="4,4"
                          />
                          <text
                            x={lineChartPath.padding - 8}
                            y={y + 4}
                            textAnchor="end"
                            fill="#666"
                            fontSize="12"
                          >
                            ¥{Math.round(lineChartPath.maxSales * (1 - tick))}
                          </text>
                        </g>
                      );
                    })}
                    <polygon points={lineChartPath.area} fill="url(#areaGradient)" />
                    <polyline
                      points={lineChartPath.line}
                      fill="none"
                      stroke="#C67B3D"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    {lineChartPath.data.map((d, i) => {
                      const x = lineChartPath.padding + i * lineChartPath.stepX;
                      const y = lineChartPath.height - lineChartPath.padding - (d.sales / lineChartPath.maxSales) * (lineChartPath.height - lineChartPath.padding * 2);
                      return (
                        <g key={i}>
                          <circle cx={x} cy={y} r="6" fill="white" stroke="#C67B3D" strokeWidth="3" />
                          <text
                            x={x}
                            y={lineChartPath.height - lineChartPath.padding + 24}
                            textAnchor="middle"
                            fill="#666"
                            fontSize="12"
                          >
                            {d.date.slice(5)}
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                </div>
              )}
            </div>

            <div className="chart-card">
              <h3 className="chart-title">
                <i className="fas fa-chart-pie" style={{ marginRight: '8px', color: 'var(--color-accent)' }}></i>
                分类分布
              </h3>
              <div className="pie-chart">
                <svg width="300" height="300" viewBox="0 0 300 300">
                  {pieChartData.map((item, i) => (
                    <path
                      key={i}
                      d={item.pathData}
                      fill={item.color}
                      stroke="white"
                      strokeWidth="2"
                      style={{ transition: 'all 0.3s ease' }}
                    />
                  ))}
                  <circle cx="150" cy="150" r="50" fill="white" />
                  <text x="150" y="145" textAnchor="middle" fill="#666" fontSize="12">总图书</text>
                  <text x="150" y="168" textAnchor="middle" fill="#333" fontSize="20" fontWeight="700">{stats?.totalBooks || 0}</text>
                </svg>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '16px' }}>
                {pieChartData.map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: item.color }}></div>
                    <span style={{ fontSize: '13px', color: 'var(--color-text)' }}>
                      {item.name} ({item.percentage}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
