import React, { useEffect } from 'react';
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
} from 'recharts';
import { useOrders } from '../../context/OrderContext';

const StatsPanel: React.FC = () => {
  const { state, fetchStats } = useOrders();
  const stats = state.stats;

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  const cardRowStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: '20px',
    marginBottom: '28px',
  };

  const statCardStyle = (gradient: string): React.CSSProperties => ({
    background: gradient,
    borderRadius: '20px',
    padding: '24px',
    border: '0.5px solid #E5E7EB',
    position: 'relative',
    overflow: 'hidden',
  });

  const statIconStyle: React.CSSProperties = {
    position: 'absolute',
    right: '20px',
    top: '20px',
    fontSize: '48px',
    opacity: 0.15,
  };

  const statLabelStyle: React.CSSProperties = {
    fontSize: '13px',
    fontWeight: 600,
    color: '#6B7280',
    marginBottom: '8px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  };

  const statValueStyle: React.CSSProperties = {
    fontSize: '36px',
    fontWeight: 800,
    color: '#1F2937',
    lineHeight: 1.1,
    marginBottom: '6px',
  };

  const statSubStyle: React.CSSProperties = {
    fontSize: '12px',
    color: '#9CA3AF',
  };

  const chartCardStyle: React.CSSProperties = {
    background: '#1E293B',
    borderRadius: '24px',
    padding: '28px',
    marginBottom: '28px',
    color: '#FFFFFF',
  };

  const chartHeaderStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '24px',
    flexWrap: 'wrap',
    gap: '16px',
  };

  const chartTitleStyle: React.CSSProperties = {
    fontSize: '20px',
    fontWeight: 700,
    color: '#FFFFFF',
    marginBottom: '4px',
  };

  const chartSubtitleStyle: React.CSSProperties = {
    fontSize: '13px',
    color: '#94A3B8',
  };

  const refreshBadgeStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 14px',
    background: 'rgba(245, 158, 11, 0.15)',
    color: '#F59E0B',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: 600,
    border: '1px solid rgba(245, 158, 11, 0.3)',
  };

  const barChartCardStyle: React.CSSProperties = {
    background: '#FFFFFF',
    borderRadius: '24px',
    padding: '28px',
    border: '0.5px solid #E5E7EB',
  };

  const emptyDataStyle: React.CSSProperties = {
    textAlign: 'center',
    padding: '60px 24px',
    color: '#94A3B8',
    fontSize: '14px',
  };

  const legendStyle: React.CSSProperties = {
    display: 'flex',
    gap: '16px',
    flexWrap: 'wrap',
    marginTop: '16px',
    paddingTop: '16px',
    borderTop: '1px solid rgba(255,255,255,0.1)',
  };

  const legendItemStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '12px',
    color: '#94A3B8',
  };

  const legendDotStyle = (color: string): React.CSSProperties => ({
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    background: color,
  });

  const barRowStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    padding: '12px 0',
    borderBottom: '1px solid #F3F4F6',
  };

  const barRankStyle = (rank: number): React.CSSProperties => ({
    width: '32px',
    height: '32px',
    borderRadius: '10px',
    background:
      rank === 0
        ? 'rgba(245, 158, 11, 0.15)'
        : rank === 1
        ? 'rgba(16, 185, 129, 0.15)'
        : rank === 2
        ? 'rgba(99, 102, 241, 0.15)'
        : '#F3F4F6',
    color:
      rank === 0 ? '#F59E0B' : rank === 1 ? '#10B981' : rank === 2 ? '#6366F1' : '#6B7280',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 800,
    fontSize: '14px',
    marginRight: '12px',
    flexShrink: 0,
  });

  const barLabelStyle: React.CSSProperties = {
    flex: 1,
    minWidth: 0,
    marginRight: '16px',
  };

  const barNameStyle: React.CSSProperties = {
    fontSize: '14px',
    fontWeight: 600,
    color: '#1F2937',
    marginBottom: '4px',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  };

  const barSubStyle: React.CSSProperties = {
    fontSize: '12px',
    color: '#9CA3AF',
  };

  const barContainerStyle: React.CSSProperties = {
    width: '200px',
    flexShrink: 0,
  };

  const barBgStyle: React.CSSProperties = {
    height: '12px',
    background: '#F3F4F6',
    borderRadius: '6px',
    overflow: 'hidden',
  };

  const barFillStyle = (color: string, percent: number): React.CSSProperties => ({
    height: '100%',
    background: color,
    borderRadius: '6px',
    width: `${Math.min(percent, 100)}%`,
    transition: 'width 0.6s ease',
  });

  const barCountStyle: React.CSSProperties = {
    fontSize: '12px',
    fontWeight: 700,
    color: '#6B7280',
    marginTop: '4px',
    textAlign: 'right',
  };

  const chartTooltipStyle = {
    background: 'rgba(30, 41, 59, 0.95)',
    border: '1px solid rgba(245, 158, 11, 0.3)',
    borderRadius: '12px',
    padding: '12px 16px',
    color: '#FFFFFF',
    fontSize: '13px',
    boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
  };

  if (!stats) {
    return (
      <div
        style={{
          textAlign: 'center',
          padding: '80px 24px',
          color: '#6B7280',
          background: '#FFFFFF',
          borderRadius: '24px',
          border: '0.5px solid #E5E7EB',
        }}
      >
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>📊</div>
        <div style={{ fontSize: '16px', fontWeight: 600 }}>正在加载统计数据...</div>
      </div>
    );
  }

  const maxBarCount = Math.max(...stats.barChartData.map((d) => d.count), 1);

  return (
    <div>
      <div style={cardRowStyle}>
        <div style={statCardStyle('linear-gradient(135deg, #FEF3C7 0%, #FFFFFF 100%)')}>
          <div style={statIconStyle}>📋</div>
          <div style={statLabelStyle}>今日订单</div>
          <div style={statValueStyle}>{stats.totalOrders}</div>
          <div style={statSubStyle}>累计有效订单数量</div>
        </div>

        <div style={statCardStyle('linear-gradient(135deg, #DCFCE7 0%, #FFFFFF 100%)')}>
          <div style={statIconStyle}>💰</div>
          <div style={statLabelStyle}>今日收入</div>
          <div style={{ ...statValueStyle, color: '#10B981' }}>
            ¥{stats.totalRevenue.toFixed(2)}
          </div>
          <div style={statSubStyle}>营业额自动汇总</div>
        </div>

        <div style={statCardStyle('linear-gradient(135deg, #E0E7FF 0%, #FFFFFF 100%)')}>
          <div style={statIconStyle}>🏆</div>
          <div style={statLabelStyle}>热销菜品</div>
          <div style={{ ...statValueStyle, color: '#6366F1', fontSize: '24px' }}>
            {stats.barChartData[0]?.name || '暂无'}
          </div>
          <div style={statSubStyle}>
            {stats.barChartData[0] ? `售出 ${stats.barChartData[0].count} 份` : '等待数据'}
          </div>
        </div>

        <div style={statCardStyle('linear-gradient(135deg, #FCE7F3 0%, #FFFFFF 100%)')}>
          <div style={statIconStyle}>🍽️</div>
          <div style={statLabelStyle}>菜品种类</div>
          <div style={{ ...statValueStyle, color: '#EC4899' }}>
            {stats.barChartData.length}
          </div>
          <div style={statSubStyle}>今日销售菜品种类数</div>
        </div>
      </div>

      <div style={chartCardStyle}>
        <div style={chartHeaderStyle}>
          <div>
            <div style={chartTitleStyle}>📈 每15分钟订单量趋势</div>
            <div style={chartSubtitleStyle}>实时展示今日各时段的订单数量变化</div>
          </div>
          <span style={refreshBadgeStyle}>
            <span style={{ animation: 'spin 2s linear infinite' }}>⟳</span>
            每30秒自动刷新
          </span>
        </div>

        {stats.lineChartData.length === 0 ||
        stats.lineChartData.every((d) => d.orders === 0) ? (
          <div style={emptyDataStyle}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>🕊️</div>
            今日暂无订单数据，等待顾客下单...
          </div>
        ) : (
          <div style={{ height: '320px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={stats.lineChartData}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                <XAxis
                  dataKey="time"
                  stroke="#64748B"
                  tick={{ fill: '#94A3B8', fontSize: 12 }}
                  tickLine={false}
                  axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                  interval={1}
                />
                <YAxis
                  stroke="#64748B"
                  tick={{ fill: '#94A3B8', fontSize: 12 }}
                  tickLine={false}
                  axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={chartTooltipStyle}
                  labelStyle={{ color: '#F59E0B', fontWeight: 700, marginBottom: '6px' }}
                  itemStyle={{ color: '#FFFFFF' }}
                  formatter={(value: number) => [`${value} 单`, '订单量']}
                />
                <Line
                  type="monotone"
                  dataKey="orders"
                  stroke="#F59E0B"
                  strokeWidth={3}
                  dot={{
                    fill: '#F59E0B',
                    stroke: '#1E293B',
                    strokeWidth: 2,
                    r: 4,
                  }}
                  activeDot={{
                    r: 7,
                    fill: '#EF4444',
                    stroke: '#FFFFFF',
                    strokeWidth: 2,
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        <div style={legendStyle}>
          <div style={legendItemStyle}>
            <div style={legendDotStyle('#F59E0B')} />
            <span>订单数量</span>
          </div>
          <div style={legendItemStyle}>
            <div style={legendDotStyle('#EF4444')} />
            <span>峰值点</span>
          </div>
          <div style={legendItemStyle}>
            <span style={{ color: '#94A3B8' }}>📏 X轴：时段</span>
          </div>
          <div style={legendItemStyle}>
            <span style={{ color: '#94A3B8' }}>📏 Y轴：订单数</span>
          </div>
        </div>
      </div>

      <div style={barChartCardStyle}>
        <div style={{ ...chartHeaderStyle, marginBottom: '24px' }}>
          <div>
            <div style={{ ...chartTitleStyle, color: '#1F2937' }}>🏆 热门菜品排行</div>
            <div style={{ ...chartSubtitleStyle, color: '#6B7280' }}>
              按销量排序 · 前三名将获得专属色彩标识
            </div>
          </div>
          <div
            style={{
              display: 'flex',
              gap: '8px',
              fontSize: '12px',
              color: '#6B7280',
              alignItems: 'center',
            }}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <span
                style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '3px',
                  background: '#F59E0B',
                }}
              />
              冠军
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <span
                style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '3px',
                  background: '#10B981',
                }}
              />
              亚军
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <span
                style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '3px',
                  background: '#6366F1',
                }}
              />
              季军
            </span>
          </div>
        </div>

        {stats.barChartData.length === 0 ? (
          <div style={{ ...emptyDataStyle, color: '#6B7280' }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>🍳</div>
            今日暂无菜品销售数据
          </div>
        ) : (
          <div>
            {stats.barChartData.map((dish, index) => (
              <div
                key={dish.name}
                style={{
                  ...barRowStyle,
                  borderBottom:
                    index === stats.barChartData.length - 1 ? 'none' : '1px solid #F3F4F6',
                }}
                className="animate-fade-in-up"
              >
                <div style={barRankStyle(index)}>
                  {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
                </div>
                <div style={barLabelStyle}>
                  <div style={barNameStyle}>{dish.name}</div>
                  <div style={barSubStyle}>营收 ¥{dish.revenue.toFixed(2)}</div>
                </div>
                <div style={barContainerStyle}>
                  <div style={barBgStyle}>
                    <div
                      style={barFillStyle(dish.fill, (dish.count / maxBarCount) * 100)}
                    />
                  </div>
                  <div style={barCountStyle}>{dish.count} 份</div>
                </div>
              </div>
            ))}

            <div style={{ height: '280px', marginTop: '32px', paddingTop: '24px', borderTop: '1px solid #F3F4F6' }}>
              <div
                style={{
                  fontSize: '14px',
                  fontWeight: 700,
                  color: '#6B7280',
                  marginBottom: '16px',
                  textAlign: 'center',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                }}
              >
                📊 销量可视化图表
              </div>
              <ResponsiveContainer width="100%" height="90%">
                <BarChart
                  data={stats.barChartData}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" horizontal={false} />
                  <XAxis type="number" allowDecimals={false} stroke="#9CA3AF" tick={{ fontSize: 11 }} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    stroke="#6B7280"
                    tick={{ fontSize: 12 }}
                    width={80}
                  />
                  <Tooltip
                    contentStyle={{
                      background: '#FFFFFF',
                      border: '1px solid #E5E7EB',
                      borderRadius: '12px',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
                      padding: '12px',
                    }}
                    formatter={(value: number) => [`${value} 份`, '销量']}
                  />
                  <Bar dataKey="count" radius={[0, 8, 8, 0]} barSize={24}>
                    {stats.barChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StatsPanel;
