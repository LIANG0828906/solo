import React, { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  ComposedChart,
} from 'recharts';
import { useCoffeeStore } from '@/store';
import { BREW_METHOD_LABELS, FLAVOR_TAGS } from '@/types';
import type { LogEntry, BrewMethod } from '@/types';
import BrewMethodIcon from '@/components/BrewMethodIcon';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
}

function StatCard({ label, value, icon }: StatCardProps) {
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-coffee-100">
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-xs font-medium text-coffee-500 uppercase tracking-wider">{label}</span>
      </div>
      <div className="text-3xl font-display font-bold text-coffee-900 animate-pulse_stat">{value}</div>
    </div>
  );
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: {
      date: string;
      rating: number;
      beanName: string;
      method: string;
    };
  }>;
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload || !payload.length) return null;
  const data = payload[0].payload;
  return (
    <div className="bg-coffee-900 text-white px-4 py-3 rounded-lg shadow-xl text-xs">
      <div className="font-bold text-sm mb-1">{data.date}</div>
      <div className="text-amber-light">评分：{'★'.repeat(data.rating)}{'☆'.repeat(5 - data.rating)}</div>
      <div className="text-coffee-200">{data.beanName} · {data.method}</div>
    </div>
  );
}

export default function Dashboard() {
  const logs = useCoffeeStore((s) => s.logs);

  const stats = useMemo(() => {
    const total = logs.length;
    const avgRating = total > 0 ? (logs.reduce((s, l) => s + l.rating, 0) / total).toFixed(1) : '-';

    const beanCount: Record<string, { name: string; count: number }> = {};
    const methodCount: Record<string, number> = {};

    logs.forEach((log) => {
      const beanName = log.bean.name;
      beanCount[beanName] = beanCount[beanName]
        ? { name: beanName, count: beanCount[beanName].count + 1 }
        : { name: beanName, count: 1 };

      methodCount[log.brewMethod] = (methodCount[log.brewMethod] || 0) + 1;
    });

    const topBean = Object.values(beanCount).sort((a, b) => b.count - a.count)[0]?.name || '-';
    const topMethodId = Object.entries(methodCount).sort((a, b) => b[1] - a[1])[0]?.[0] as BrewMethod | undefined;

    return { total, avgRating, topBean, topMethodId };
  }, [logs]);

  const chartData = useMemo(() => {
    const sorted = [...logs].sort((a, b) => a.createdAt - b.createdAt);
    const recent = sorted.slice(-30);
    return recent.map((log) => ({
      date: new Date(log.createdAt).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }),
      rating: log.rating,
      beanName: log.bean.name,
      method: BREW_METHOD_LABELS[log.brewMethod],
    }));
  }, [logs]);

  return (
    <div className="space-y-5">
      <h2 className="font-display text-2xl font-bold text-coffee-900">冲煮看板</h2>

      <div className="grid grid-cols-2 gap-3">
        <StatCard
          label="冲煮次数"
          value={stats.total}
          icon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8D6E63" strokeWidth="2">
              <path d="M17 8h1a4 4 0 110 8h-1M3 8h14v9a4 4 0 01-4 4H7a4 4 0 01-4-4V8zm0 0V6a2 2 0 012-2h10a2 2 0 012 2v2" />
            </svg>
          }
        />
        <StatCard
          label="平均评分"
          value={stats.avgRating}
          icon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="#FFBF00" stroke="#E5AC00" strokeWidth="1.5">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          }
        />
        <StatCard
          label="最常用豆"
          value={stats.topBean}
          icon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8D6E63" strokeWidth="2">
              <ellipse cx="12" cy="16" rx="8" ry="4" />
              <path d="M12 12V4M8 6c0-2 2-4 4-4s4 2 4 4" />
            </svg>
          }
        />
        <div className="bg-white rounded-xl p-4 shadow-sm border border-coffee-100">
          <div className="flex items-center gap-2 mb-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8D6E63" strokeWidth="2">
              <path d="M12 2v20M2 12h20" />
            </svg>
            <span className="text-xs font-medium text-coffee-500 uppercase tracking-wider">最常用方式</span>
          </div>
          <div className="flex items-center gap-2">
            {stats.topMethodId && <BrewMethodIcon method={stats.topMethodId} size={28} />}
            <span className="text-2xl font-display font-bold text-coffee-900 animate-pulse_stat">
              {stats.topMethodId ? BREW_METHOD_LABELS[stats.topMethodId] : '-'}
            </span>
          </div>
        </div>
      </div>

      {/* Rating Trend Chart */}
      {chartData.length > 1 && (
        <div className="bg-white rounded-xl p-4 shadow-sm border border-coffee-100">
          <h3 className="text-sm font-medium text-coffee-600 mb-3">评分趋势</h3>
          <ResponsiveContainer width="100%" height={200}>
            <ComposedChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="ratingGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#FFBF00" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#FFBF00" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F5E6D3" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: '#8D6E63' }}
                axisLine={{ stroke: '#D4B896' }}
                tickLine={false}
              />
              <YAxis
                domain={[0, 5]}
                ticks={[1, 2, 3, 4, 5]}
                tick={{ fontSize: 11, fill: '#8D6E63' }}
                axisLine={{ stroke: '#D4B896' }}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="rating"
                fill="url(#ratingGradient)"
                stroke="none"
              />
              <Line
                type="monotone"
                dataKey="rating"
                stroke="#FFBF00"
                strokeWidth={2.5}
                dot={{ fill: '#FFBF00', strokeWidth: 2, stroke: '#E5AC00', r: 4 }}
                activeDot={{ r: 6, fill: '#FFBF00', stroke: '#E5AC00', strokeWidth: 2 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
