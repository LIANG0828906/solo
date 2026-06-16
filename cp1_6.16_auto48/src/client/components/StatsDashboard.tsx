import { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import type { StatsData } from '@shared/types';
import { getStats } from '../services/api';

const PIE_COLORS = ['#D84315', '#FB8C00', '#FFB74D', '#FFCC80', '#FFE0B2', '#8D6E63'];

export function StatsDashboard() {
  const [period, setPeriod] = useState<'week' | 'month'>('week');
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      try {
        const data = await getStats(period);
        if (active) {
          setStats(data);
        }
      } catch (err) {
        console.error('Load stats failed:', err);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [period]);

  if (loading) {
    return <div style={styles.loading}>加载中...</div>;
  }

  if (!stats) {
    return <div style={styles.empty}>暂无统计数据</div>;
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>数据统计</h2>
        <div style={styles.periodToggle}>
          <button
            style={{
              ...styles.periodBtn,
              ...(period === 'week' ? styles.periodBtnActive : {}),
            }}
            onClick={() => setPeriod('week')}
          >
            近7天
          </button>
          <button
            style={{
              ...styles.periodBtn,
              ...(period === 'month' ? styles.periodBtnActive : {}),
            }}
            onClick={() => setPeriod('month')}
          >
            近30天
          </button>
        </div>
      </div>

      <div style={styles.chartsGrid}>
        <div style={styles.chartCard}>
          <h3 style={styles.chartTitle}>订单量趋势</h3>
          <div style={styles.chartWrap}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.orderTrend} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#FFE0B2" vertical={false} />
                <XAxis dataKey="date" tick={{ fill: '#8D6E63', fontSize: 12 }} axisLine={{ stroke: '#FFCC80' }} />
                <YAxis tick={{ fill: '#8D6E63', fontSize: 12 }} axisLine={{ stroke: '#FFCC80' }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFDF8',
                    border: '1px solid #FFE0B2',
                    borderRadius: 6,
                    color: '#3E2723',
                  }}
                  labelStyle={{ color: '#5D4037' }}
                />
                <Bar dataKey="count" name="订单数" fill="#D84315" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div style={styles.chartCard}>
          <h3 style={styles.chartTitle}>图书价格区间分布</h3>
          <div style={styles.chartWrap}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.priceDistribution}
                  dataKey="count"
                  nameKey="range"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ range, percent }) => `${range} ${(percent * 100).toFixed(0)}%`}
                  labelLine={{ stroke: '#FFCC80' }}
                >
                  {stats.priceDistribution.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFDF8',
                    border: '1px solid #FFE0B2',
                    borderRadius: 6,
                    color: '#3E2723',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 12, color: '#5D4037' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div style={{ ...styles.chartCard, gridColumn: '1 / -1' }}>
          <h3 style={styles.chartTitle}>库存 Top 10</h3>
          <div style={{ ...styles.chartWrap, minHeight: 360 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={stats.topStockBooks}
                layout="vertical"
                margin={{ top: 10, right: 30, left: 120, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#FFE0B2" horizontal={false} />
                <XAxis type="number" tick={{ fill: '#8D6E63', fontSize: 12 }} axisLine={{ stroke: '#FFCC80' }} allowDecimals={false} />
                <YAxis
                  type="category"
                  dataKey="title"
                  tick={{ fill: '#5D4037', fontSize: 12 }}
                  axisLine={{ stroke: '#FFCC80' }}
                  width={110}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFDF8',
                    border: '1px solid #FFE0B2',
                    borderRadius: 6,
                    color: '#3E2723',
                  }}
                  labelStyle={{ color: '#5D4037' }}
                />
                <Bar dataKey="stock" name="库存量" fill="#FB8C00" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    width: '100%',
  } as React.CSSProperties,
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    flexWrap: 'wrap',
    gap: 12,
  } as React.CSSProperties,
  title: {
    fontSize: 22,
    color: '#5D4037',
    fontWeight: 600,
  } as React.CSSProperties,
  periodToggle: {
    display: 'flex',
    gap: 0,
    border: '1px solid #FFCC80',
    borderRadius: 6,
    overflow: 'hidden',
  } as React.CSSProperties,
  periodBtn: {
    padding: '8px 20px',
    backgroundColor: '#FFFDF8',
    color: '#8D6E63',
    border: 'none',
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: 500,
    transition: 'all 0.2s',
  } as React.CSSProperties,
  periodBtnActive: {
    backgroundColor: '#D84315',
    color: '#FFF8E1',
  } as React.CSSProperties,
  chartsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))',
    gap: 20,
  } as React.CSSProperties,
  chartCard: {
    backgroundColor: '#FFFDF8',
    border: '1px solid #FFE0B2',
    borderRadius: 10,
    padding: 20,
  } as React.CSSProperties,
  chartTitle: {
    fontSize: 16,
    color: '#5D4037',
    fontWeight: 600,
    marginBottom: 16,
  } as React.CSSProperties,
  chartWrap: {
    width: '100%',
    height: 280,
  } as React.CSSProperties,
  loading: {
    textAlign: 'center' as const,
    padding: 60,
    color: '#A1887F',
    fontSize: 16,
  } as React.CSSProperties,
  empty: {
    textAlign: 'center' as const,
    padding: 60,
    color: '#A1887F',
    fontSize: 16,
  } as React.CSSProperties,
};
