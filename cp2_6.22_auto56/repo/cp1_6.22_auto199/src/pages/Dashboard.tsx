import { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { PlatformAnalytics, PlatformType } from '../types';
import { PLATFORM_COLORS, PLATFORM_NAMES } from '../types';

const formatNumber = (num: number): string => {
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + '万';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'k';
  }
  return num.toString();
};

const getGradientStyle = (color: string): React.CSSProperties => ({
  background: `linear-gradient(to top, ${color}40, transparent)`,
});

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div style={styles.tooltip}>
        <p style={styles.tooltipLabel}>{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} style={{ ...styles.tooltipValue, color: entry.color }}>
            {entry.name}: {formatNumber(entry.value)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const Dashboard = () => {
  const [analyticsData, setAnalyticsData] = useState<PlatformAnalytics[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchAnalytics = async () => {
    try {
      const response = await fetch('/api/analytics');
      const data = await response.json();
      setAnalyticsData(data);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
    const interval = setInterval(fetchAnalytics, 3600000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <p style={styles.loadingText}>加载数据中...</p>
      </div>
    );
  }

  const getPlatformData = (platform: PlatformType) =>
    analyticsData.find((d) => d.platform === platform);

  return (
    <div style={styles.dashboard}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>数据仪表盘</h1>
          <p style={styles.subtitle}>
            实时监控各平台内容表现，数据每小时自动更新
          </p>
        </div>
        <div style={styles.refreshInfo}>
          <span style={styles.refreshDot} />
          <span style={styles.refreshText}>
            最后更新: {lastUpdate?.toLocaleTimeString('zh-CN')}
          </span>
        </div>
      </div>

      <div style={styles.statsSection}>
        {(['blog', 'newsletter', 'social'] as PlatformType[]).map((platform) => {
          const data = getPlatformData(platform);
          if (!data) return null;

          return (
            <div key={platform} style={styles.statCardContainer}>
              <div className="stat-card" style={styles.statCard}>
                <div
                  style={{
                    ...styles.platformIndicator,
                    backgroundColor: PLATFORM_COLORS[platform],
                  }}
                />
                <div style={styles.statContent}>
                  <span style={styles.platformLabel}>
                    {PLATFORM_NAMES[platform]}
                  </span>
                  <div style={styles.statNumbers}>
                    <div style={styles.statItem}>
                      <span style={styles.statValue}>
                        {formatNumber(data.totalReads)}
                      </span>
                      <span style={styles.statLabel}>阅读量</span>
                    </div>
                    <div style={styles.statItem}>
                      <span style={styles.statValue}>
                        {formatNumber(data.totalLikes)}
                      </span>
                      <span style={styles.statLabel}>点赞数</span>
                    </div>
                    <div style={styles.statItem}>
                      <span style={styles.statValue}>
                        {formatNumber(data.totalComments)}
                      </span>
                      <span style={styles.statLabel}>评论数</span>
                    </div>
                  </div>
                </div>
                <div
                  style={{
                    ...styles.cardGradient,
                    ...getGradientStyle(PLATFORM_COLORS[platform]),
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div style={styles.chartsSection}>
        {(['blog', 'newsletter', 'social'] as PlatformType[]).map((platform) => {
          const data = getPlatformData(platform);
          if (!data) return null;

          return (
            <div key={platform} className="chart-card" style={styles.chartCard}>
              <div style={styles.chartHeader}>
                <div
                  style={{
                    ...styles.chartColorDot,
                    backgroundColor: PLATFORM_COLORS[platform],
                  }}
                />
                <h3 style={styles.chartTitle}>
                  {PLATFORM_NAMES[platform]} 24小时趋势
                </h3>
              </div>
              <div style={styles.chartContainer}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={data.hourlyData}
                    margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#E5E7EB"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="hour"
                      stroke="#9CA3AF"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      interval={3}
                    />
                    <YAxis
                      stroke="#9CA3AF"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      width={45}
                    />
                    <Tooltip
                      content={<CustomTooltip />}
                      cursor={{ stroke: '#E5E7EB', strokeWidth: 1 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="reads"
                      name="阅读量"
                      stroke={PLATFORM_COLORS[platform]}
                      strokeWidth={2.5}
                      dot={{
                        fill: PLATFORM_COLORS[platform],
                        strokeWidth: 2,
                        r: 4,
                        stroke: '#ffffff',
                      }}
                      activeDot={{
                        fill: PLATFORM_COLORS[platform],
                        strokeWidth: 3,
                        r: 6,
                        stroke: '#ffffff',
                      }}
                      isAnimationActive={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="likes"
                      name="点赞数"
                      stroke={PLATFORM_COLORS[platform]}
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={false}
                      isAnimationActive={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div style={styles.chartLegend}>
                <div style={styles.legendItem}>
                  <div
                    style={{
                      ...styles.legendLine,
                      backgroundColor: PLATFORM_COLORS[platform],
                    }}
                  />
                  <span style={styles.legendText}>阅读量</span>
                </div>
                <div style={styles.legendItem}>
                  <div
                    style={{
                      ...styles.legendLine,
                      ...styles.legendLineDashed,
                      borderColor: PLATFORM_COLORS[platform],
                    }}
                  />
                  <span style={styles.legendText}>点赞数</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  dashboard: {
    padding: '32px',
    height: 'calc(100vh - 65px)',
    overflowY: 'auto',
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: 'calc(100vh - 65px)',
    gap: '16px',
    backgroundColor: '#F9FAFB',
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '4px solid #E5E7EB',
    borderTopColor: '#3B82F6',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  loadingText: {
    color: '#6B7280',
    fontSize: '14px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '24px',
  },
  title: {
    fontSize: '28px',
    fontWeight: 700,
    color: '#1F2937',
    marginBottom: '4px',
  },
  subtitle: {
    fontSize: '14px',
    color: '#6B7280',
  },
  refreshInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 16px',
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    border: '1px solid #E5E7EB',
  },
  refreshDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: '#10B981',
    animation: 'pulse 2s ease-in-out infinite',
  },
  refreshText: {
    fontSize: '12px',
    color: '#6B7280',
  },
  statsSection: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '20px',
    marginBottom: '32px',
  },
  statCardContainer: {
    animation: 'fadeIn 0.5s ease',
  },
  statCard: {
    position: 'relative',
    width: '100%',
    height: '120px',
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
    padding: '16px',
    display: 'flex',
    gap: '12px',
    overflow: 'hidden',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    cursor: 'default',
  },
  platformIndicator: {
    width: '4px',
    height: '100%',
    borderRadius: '2px',
    flexShrink: 0,
  },
  statContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  platformLabel: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#374151',
  },
  statNumbers: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '8px',
  },
  statItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  statValue: {
    fontSize: '24px',
    fontWeight: 700,
    color: '#1F2937',
    lineHeight: 1.2,
  },
  statLabel: {
    fontSize: '11px',
    color: '#9CA3AF',
  },
  cardGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '60px',
    pointerEvents: 'none',
  },
  chartsSection: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '20px',
  },
  chartCard: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    animation: 'fadeIn 0.5s ease',
  },
  chartHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  chartColorDot: {
    width: '12px',
    height: '12px',
    borderRadius: '50%',
  },
  chartTitle: {
    fontSize: '15px',
    fontWeight: 600,
    color: '#1F2937',
  },
  chartContainer: {
    width: '100%',
    height: '240px',
  },
  chartLegend: {
    display: 'flex',
    justifyContent: 'center',
    gap: '24px',
    paddingTop: '8px',
    borderTop: '1px solid #F3F4F6',
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  legendLine: {
    width: '20px',
    height: '3px',
    borderRadius: '2px',
  },
  legendLineDashed: {
    backgroundColor: 'transparent',
    borderTop: '3px dashed',
    borderColor: 'inherit',
  },
  legendText: {
    fontSize: '12px',
    color: '#6B7280',
  },
  tooltip: {
    backgroundColor: '#ffffff',
    padding: '12px 16px',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    border: '1px solid #E5E7EB',
  },
  tooltipLabel: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#1F2937',
    marginBottom: '8px',
  },
  tooltipValue: {
    fontSize: '12px',
    marginBottom: '4px',
  },
};

export default Dashboard;
