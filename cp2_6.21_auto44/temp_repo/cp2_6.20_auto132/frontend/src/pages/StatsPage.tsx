import { Suspense, lazy, useEffect, useState, type ComponentType } from 'react';
import { useStore } from '../store/useStore';
import type { TrainingType } from '../types';

const BarChart = lazy(() =>
  import('recharts').then((mod) => ({ default: mod.BarChart as unknown as ComponentType<any> }))
);
const Bar = lazy(() =>
  import('recharts').then((mod) => ({ default: mod.Bar as unknown as ComponentType<any> }))
);
const XAxis = lazy(() =>
  import('recharts').then((mod) => ({ default: mod.XAxis as unknown as ComponentType<any> }))
);
const YAxis = lazy(() =>
  import('recharts').then((mod) => ({ default: mod.YAxis as unknown as ComponentType<any> }))
);
const CartesianGrid = lazy(() =>
  import('recharts').then((mod) => ({ default: mod.CartesianGrid as unknown as ComponentType<any> }))
);
const Tooltip = lazy(() =>
  import('recharts').then((mod) => ({ default: mod.Tooltip as unknown as ComponentType<any> }))
);
const ResponsiveContainer = lazy(() =>
  import('recharts').then((mod) => ({ default: mod.ResponsiveContainer as unknown as ComponentType<any> }))
);
const PieChart = lazy(() =>
  import('recharts').then((mod) => ({ default: mod.PieChart as unknown as ComponentType<any> }))
);
const Pie = lazy(() =>
  import('recharts').then((mod) => ({ default: mod.Pie as unknown as ComponentType<any> }))
);
const Cell = lazy(() =>
  import('recharts').then((mod) => ({ default: mod.Cell as unknown as ComponentType<any> }))
);
const Legend = lazy(() =>
  import('recharts').then((mod) => ({ default: mod.Legend as unknown as ComponentType<any> }))
);

const typeColors: Record<TrainingType, string> = {
  strength: '#e74c3c',
  cardio: '#3498db',
  yoga: '#2ecc71',
  other: '#9b59b6',
};

const typeLabels: Record<TrainingType, string> = {
  strength: '力量训练',
  cardio: '有氧运动',
  yoga: '瑜伽',
  other: '其他',
};

const StatsPage = () => {
  const { stats, loading, fetchStats } = useStore();
  const [selectedMonth, setSelectedMonth] = useState<string>('');

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    if (stats?.monthly && stats.monthly.length > 0 && !selectedMonth) {
      setSelectedMonth(stats.monthly[stats.monthly.length - 1].month);
    }
  }, [stats, selectedMonth]);

  const barData =
    stats?.monthly.map((item) => ({
      month: item.month,
      duration: item.total_duration,
      count: item.count,
    })) || [];

  const pieData =
    stats?.by_type.map((item) => ({
      name: typeLabels[item.type],
      value: item.total_duration,
      color: typeColors[item.type],
    })) || [];

  const selectedMonthData = stats?.monthly.find(
    (m) => m.month === selectedMonth
  );

  return (
    <div className="page-container">
      <h2
        style={{
          fontSize: '1.5rem',
          fontWeight: '700',
          marginBottom: '2rem',
          color: 'var(--text-primary)',
        }}
      >
        训练统计
      </h2>

      {loading && !stats ? (
        <div className="loading">加载中...</div>
      ) : (
        <>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem',
              marginBottom: '2rem',
            }}
          >
            <div className="card">
              <div
                style={{
                  color: 'var(--text-secondary)',
                  fontSize: '0.9rem',
                  marginBottom: '0.5rem',
                }}
              >
                总训练时长
              </div>
              <div
                style={{
                  fontSize: '2rem',
                  fontWeight: '700',
                  color: 'var(--accent)',
                }}
              >
                {stats?.monthly.reduce((sum, m) => sum + m.total_duration, 0) || 0}{' '}
                分钟
              </div>
            </div>
            <div className="card">
              <div
                style={{
                  color: 'var(--text-secondary)',
                  fontSize: '0.9rem',
                  marginBottom: '0.5rem',
                }}
              >
                总训练次数
              </div>
              <div
                style={{
                  fontSize: '2rem',
                  fontWeight: '700',
                  color: 'var(--accent)',
                }}
              >
                {stats?.monthly.reduce((sum, m) => sum + m.count, 0) || 0} 次
              </div>
            </div>
            <div className="card">
              <div
                style={{
                  color: 'var(--text-secondary)',
                  fontSize: '0.9rem',
                  marginBottom: '0.5rem',
                }}
              >
                月均时长
              </div>
              <div
                style={{
                  fontSize: '2rem',
                  fontWeight: '700',
                  color: 'var(--accent)',
                }}
              >
                {stats?.monthly.length
                  ? Math.round(
                      stats.monthly.reduce((sum, m) => sum + m.total_duration, 0) /
                        stats.monthly.length
                    )
                  : 0}{' '}
                分钟
              </div>
            </div>
          </div>

          {stats?.monthly && stats.monthly.length > 0 && (
            <div
              style={{
                marginBottom: '1rem',
              }}
            >
              <label
                style={{
                  marginBottom: '0.5rem',
                }}
              >
                选择月份查看详情
              </label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                style={{
                  maxWidth: '200px',
                }}
              >
                {stats.monthly.map((item) => (
                  <option key={item.month} value={item.month}>
                    {item.month}
                  </option>
                ))}
              </select>
              {selectedMonthData && (
                <div
                  style={{
                    marginTop: '1rem',
                    padding: '1rem',
                    backgroundColor: 'var(--bg-secondary)',
                    borderRadius: '8px',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      gap: '2rem',
                      flexWrap: 'wrap',
                    }}
                  >
                    <div>
                      <span style={{ color: 'var(--text-secondary)' }}>
                        本月训练时长:{' '}
                      </span>
                      <span style={{ fontWeight: '600', color: 'var(--accent)' }}>
                        {selectedMonthData.total_duration} 分钟
                      </span>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-secondary)' }}>
                        本月训练次数:{' '}
                      </span>
                      <span style={{ fontWeight: '600', color: 'var(--accent)' }}>
                        {selectedMonthData.count} 次
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
              gap: '2rem',
            }}
          >
            <div className="card">
              <h3
                style={{
                  fontSize: '1.25rem',
                  fontWeight: '700',
                  marginBottom: '1.5rem',
                  color: 'var(--text-primary)',
                }}
              >
                月度训练时长
              </h3>
              <div style={{ height: '300px' }}>
                <Suspense
                  fallback={
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        height: '100%',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      加载图表中...
                    </div>
                  }
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barData}>
                      <defs>
                        <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#ff6b35" stopOpacity={1} />
                          <stop offset="100%" stopColor="#ff8c5a" stopOpacity={0.6} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#3a3d45" />
                      <XAxis
                        dataKey="month"
                        stroke="#a0a4ad"
                        tick={{ fill: '#a0a4ad' }}
                      />
                      <YAxis stroke="#a0a4ad" tick={{ fill: '#a0a4ad' }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#2a2d35',
                          border: '1px solid #3a3d45',
                          borderRadius: '8px',
                          color: '#ffffff',
                        }}
                      />
                      <Bar
                        dataKey="duration"
                        fill="url(#barGradient)"
                        radius={[6, 6, 0, 0]}
                        name="训练时长(分钟)"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </Suspense>
              </div>
            </div>

            <div className="card">
              <h3
                style={{
                  fontSize: '1.25rem',
                  fontWeight: '700',
                  marginBottom: '1.5rem',
                  color: 'var(--text-primary)',
                }}
              >
                训练类型分布
              </h3>
              <div style={{ height: '300px' }}>
                <Suspense
                  fallback={
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        height: '100%',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      加载图表中...
                    </div>
                  }
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) =>
                          `${name} ${(percent * 100).toFixed(0)}%`
                        }
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                        nameKey="name"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#2a2d35',
                          border: '1px solid #3a3d45',
                          borderRadius: '8px',
                          color: '#ffffff',
                        }}
                        formatter={(value: number) => [`${value} 分钟`, '时长']}
                      />
                      <Legend
                        wrapperStyle={{
                          color: '#a0a4ad',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </Suspense>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default StatsPage;
