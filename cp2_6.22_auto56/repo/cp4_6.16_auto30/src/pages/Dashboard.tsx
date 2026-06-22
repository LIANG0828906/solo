import { useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Cell, Legend
} from 'recharts';
import { useSalesStore } from '../sales';
import { useWorkersStore } from '../workers';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isWithinInterval, parseISO } from 'date-fns';

export default function Dashboard() {
  const { getTodayTotal, getMonthOrderCount, getLast7DaysTrend, getMonthlyWorkerSales, records } = useSalesStore();
  const { workers } = useWorkersStore();

  const todayTotal = useMemo(() => getTodayTotal(), [records]);
  const monthOrderCount = useMemo(() => getMonthOrderCount(), [records]);
  const trendData = useMemo(() => getLast7DaysTrend(), [records]);
  const workerSales = useMemo(() => getMonthlyWorkerSales(), [records, workers]);

  const activeWorkers = useMemo(() => {
    const now = new Date();
    const start = startOfMonth(now);
    const end = endOfMonth(now);
    const activeIds = new Set<string>();
    records.forEach(r => {
      if (isWithinInterval(parseISO(r.date), { start, end })) {
        r.workerIds.forEach(id => activeIds.add(id));
      }
    });
    return activeIds.size;
  }, [records]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          background: 'rgba(92, 58, 33, 0.95)',
          border: '1px solid #C9A84C',
          borderRadius: '8px',
          padding: '12px 16px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
        }}>
          <p style={{ color: '#E8C56D', fontWeight: 700, marginBottom: '6px' }}>{label}</p>
          <p style={{ color: '#e8d5b7' }}>
            销售额: <span style={{ color: '#C9A84C', fontWeight: 600 }}>¥{payload[0].value.toFixed(2)}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  const BarTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          background: 'rgba(92, 58, 33, 0.95)',
          border: '1px solid #C9A84C',
          borderRadius: '8px',
          padding: '12px 16px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
        }}>
          <p style={{ color: '#E8C56D', fontWeight: 700, marginBottom: '6px' }}>{payload[0].payload.workerName}</p>
          <p style={{ color: '#e8d5b7' }}>
            总销售额: <span style={{ color: '#C9A84C', fontWeight: 600 }}>¥{payload[0].value.toFixed(2)}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  const barColors = ['#C9A84C', '#E8C56D', '#7B4F2C', '#2E4A2E', '#8B3A3A', '#5C3A21', '#3D6B3D'];

  return (
    <div className="page-enter">
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ color: '#E8C56D', fontFamily: 'Cinzel, serif', fontSize: '32px', textShadow: '0 0 20px rgba(201,168,76,0.4)' }}>
          🏰 酒馆仪表盘
        </h1>
        <p style={{ color: '#e8d5b7', opacity: 0.8, marginTop: '6px' }}>查看酒馆的经营数据与业绩概览</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px', marginBottom: '28px' }}>
        <div className="glass-card stat-card bounce-animation">
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>💰</div>
          <div className="stat-value">¥{todayTotal.toFixed(2)}</div>
          <div className="stat-label">今日总销售额</div>
        </div>
        <div className="glass-card stat-card bounce-animation" style={{ animationDelay: '0.1s' }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>📋</div>
          <div className="stat-value">{monthOrderCount}</div>
          <div className="stat-label">本月总订单数</div>
        </div>
        <div className="glass-card stat-card bounce-animation" style={{ animationDelay: '0.2s' }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>👥</div>
          <div className="stat-value">{activeWorkers}</div>
          <div className="stat-label">本月活跃员工数</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '24px' }}>
        <div className="glass-card chart-container">
          <h3 style={{
            color: '#C9A84C',
            fontSize: '18px',
            marginBottom: '20px',
            paddingBottom: '12px',
            borderBottom: '1px solid rgba(201,168,76,0.3)',
            fontFamily: 'Cinzel, serif'
          }}>
            📈 最近7天销售趋势
          </h3>
          <div style={{ width: '100%', height: '320px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
                <defs>
                  <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#C9A84C" />
                    <stop offset="100%" stopColor="#E8C56D" />
                  </linearGradient>
                  <filter id="glow">
                    <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                    <feMerge>
                      <feMergeNode in="coloredBlur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(201,168,76,0.15)" />
                <XAxis dataKey="date" stroke="rgba(232,213,183,0.6)" fontSize={12} />
                <YAxis stroke="rgba(232,213,183,0.6)" fontSize={12} tickFormatter={(v) => `¥${v}`} />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="amount"
                  stroke="url(#lineGradient)"
                  strokeWidth={3}
                  dot={{
                    fill: '#C9A84C',
                    stroke: '#E8C56D',
                    strokeWidth: 2,
                    r: 5,
                    filter: 'url(#glow)',
                  }}
                  activeDot={{
                    r: 8,
                    fill: '#E8C56D',
                    stroke: '#C9A84C',
                    strokeWidth: 2,
                    filter: 'url(#glow)',
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card chart-container">
          <h3 style={{
            color: '#C9A84C',
            fontSize: '18px',
            marginBottom: '20px',
            paddingBottom: '12px',
            borderBottom: '1px solid rgba(201,168,76,0.3)',
            fontFamily: 'Cinzel, serif'
          }}>
            🏆 本月员工销售排名
          </h3>
          {workerSales.length === 0 ? (
            <div style={{ height: '320px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(232,213,183,0.5)' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>🏆</div>
                <p>本月暂无销售数据</p>
              </div>
            </div>
          ) : (
            <div style={{ width: '100%', height: '320px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={workerSales} layout="vertical" margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
                  <defs>
                    {barColors.map((color, i) => (
                      <linearGradient key={i} id={`barGradient${i}`} x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor={color} stopOpacity={0.8} />
                        <stop offset="100%" stopColor={color} stopOpacity={1} />
                      </linearGradient>
                    ))}
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(201,168,76,0.15)" horizontal={true} vertical={false} />
                  <XAxis type="number" stroke="rgba(232,213,183,0.6)" fontSize={12} tickFormatter={(v) => `¥${v}`} />
                  <YAxis type="category" dataKey="workerName" stroke="rgba(232,213,183,0.6)" fontSize={12} width={80} />
                  <Tooltip content={<BarTooltip />} />
                  <Bar dataKey="total" radius={[0, 8, 8, 0]}>
                    {workerSales.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={`url(#barGradient${index % barColors.length})`} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
