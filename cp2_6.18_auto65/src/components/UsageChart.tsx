import { useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { useKeyStore } from '../store/keyStore';
import { StatsCard } from './StatsCard';

const GRADIENT_COLORS = ['#3B82F6', '#6366F1', '#8B5CF6'];

export function UsageChart() {
  const keys = useKeyStore((state) => state.keys);
  const getStats = useKeyStore((state) => state.getStats);
  const [selectedKeyId, setSelectedKeyId] = useState<string>('all');

  const stats = useMemo(() => {
    return getStats(selectedKeyId === 'all' ? undefined : selectedKeyId);
  }, [getStats, selectedKeyId]);

  const chartData = useMemo(() => {
    return stats.dailyData.map((item) => ({
      ...item,
      dateLabel: item.date.substring(5),
    }));
  }, [stats.dailyData]);

  return (
    <div>
      <div className="stats-section">
        <div className="stats-cards">
          <StatsCard label="总调用次数" value={stats.total} />
          <StatsCard label="活跃密钥数" value={stats.activeKeys} />
        </div>
      </div>

      <div className="filter-section">
        <select
          className="filter-select"
          value={selectedKeyId}
          onChange={(e) => setSelectedKeyId(e.target.value)}
        >
          <option value="all">全部密钥</option>
          {keys.map((key) => (
            <option key={key.id} value={key.id}>
              {key.name}
            </option>
          ))}
        </select>
      </div>

      <div className="chart-container">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
            <XAxis
              dataKey="dateLabel"
              tick={{ fill: '#6B7280', fontSize: 12 }}
              axisLine={{ stroke: '#E5E7EB' }}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: '#6B7280', fontSize: 12 }}
              axisLine={{ stroke: '#E5E7EB' }}
              tickLine={false}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1E1E2E',
                border: '1px solid #3A3A5E',
                borderRadius: '8px',
                color: '#fff',
              }}
              labelStyle={{ color: '#A0A0B8' }}
              formatter={(value: number) => [`${value} 次`, '调用次数']}
              labelFormatter={(label) => `日期: ${label}`}
            />
            <Bar dataKey="count" radius={[6, 6, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={`url(#colorGradient-${index % GRADIENT_COLORS.length})`}
                />
              ))}
              <defs>
                {GRADIENT_COLORS.map((color, i) => (
                  <linearGradient
                    key={i}
                    id={`colorGradient-${i}`}
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="0%" stopColor={color} stopOpacity={1} />
                    <stop offset="100%" stopColor={color} stopOpacity={0.6} />
                  </linearGradient>
                ))}
              </defs>
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
