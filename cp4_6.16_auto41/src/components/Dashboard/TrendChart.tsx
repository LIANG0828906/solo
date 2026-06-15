import React, { useMemo } from 'react';
import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Cell,
} from 'recharts';
import type { DailyEmission } from '@/types';
import { ACTIVITY_TYPE_LABELS, ACTIVITY_TYPE_COLORS } from '@/constants/emissionFactors';
import { formatNumber } from '@/utils/calculations';

interface TrendChartProps {
  data: DailyEmission[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload || !payload.length) return null;

  const totalEntry = payload.find((p: any) => p.dataKey === 'total');
  const categoryEntries = payload.filter(
    (p: any) => p.dataKey !== 'total' && p.value > 0,
  );
  const total = totalEntry?.value || 0;

  return (
    <div className="bg-white rounded-xl shadow-card-hover border border-gray-100 px-4 py-3 min-w-[200px]">
      <div className="text-sm font-semibold text-gray-800 mb-2">
        {label}
      </div>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-6 pb-2 border-b border-gray-100">
          <span className="text-xs text-gray-500">总排放</span>
          <span className="text-sm font-bold text-gray-800">
            {formatNumber(total)} kg
          </span>
        </div>
        {categoryEntries.length > 0 && (
          <div className="pt-1 space-y-1">
            {categoryEntries.map((entry: any) => {
              const pct = total > 0 ? ((entry.value / total) * 100).toFixed(1) : '0';
              return (
                <div
                  key={entry.dataKey}
                  className="flex items-center justify-between gap-6"
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span
                      className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
                      style={{ backgroundColor: entry.color }}
                    />
                    <span className="text-xs text-gray-600 truncate">
                      {ACTIVITY_TYPE_LABELS[entry.dataKey as keyof typeof ACTIVITY_TYPE_LABELS]}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-medium text-gray-800">
                      {formatNumber(entry.value)}
                    </span>
                    <span className="text-xs text-gray-400 ml-1">
                      {pct}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

const TrendChart = ({ data }: TrendChartProps) => {
  const totalAvg = useMemo(() => {
    if (!data || data.length === 0) return 0;
    const sum = data.reduce((s, d) => s + d.total, 0);
    return sum / data.length;
  }, [data]);

  return (
    <div className="card p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-5">
        <div>
          <h3 className="text-lg font-bold text-gray-800">碳排放趋势</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            近30天每日排放变化 · 日均{' '}
            <span className="font-semibold text-primary-700">
              {formatNumber(totalAvg)} kg
            </span>
          </p>
        </div>
        <div className="flex flex-wrap gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-[3px] rounded-sm bg-primary-700" />
            <span className="text-gray-600">总量折线</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: ACTIVITY_TYPE_COLORS.transport }} />
            <span className="text-gray-600">交通</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: ACTIVITY_TYPE_COLORS.diet }} />
            <span className="text-gray-600">饮食</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: ACTIVITY_TYPE_COLORS.electricity }} />
            <span className="text-gray-600">用电</span>
          </div>
        </div>
      </div>

      <div
        className="w-full rounded-xl bg-primary-50/40 p-3 sm:p-4 -mx-2 sm:mx-0"
        style={{ background: 'rgba(165, 214, 167, 0.2)' }}
      >
        <div className="w-full h-[320px] sm:h-[380px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={data}
              margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
            >
              <defs>
                <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2E7D32" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#2E7D32" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#E0E0E0"
                vertical={false}
              />
              <XAxis
                dataKey="dateLabel"
                axisLine={false}
                tickLine={false}
                tick={{
                  fill: '#9E9E9E',
                  fontSize: 11,
                  fontWeight: 300,
                }}
                interval={Math.floor(data.length / 8)}
                dy={8}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{
                  fill: '#9E9E9E',
                  fontSize: 11,
                  fontWeight: 300,
                }}
                dx={-6}
                label={{
                  value: 'kg CO₂',
                  angle: -90,
                  position: 'insideLeft',
                  style: {
                    fill: '#9E9E9E',
                    fontSize: 11,
                    fontWeight: 300,
                  },
                  offset: 8,
                }}
              />
              <Tooltip
                content={<CustomTooltip />}
                cursor={{ stroke: '#A5D6A7', strokeWidth: 1, strokeDasharray: '3 3' }}
              />

              <Bar
                dataKey="transport"
                stackId="stack"
                barSize={20}
                radius={[0, 0, 0, 0]}
              >
                {data.map((_, idx) => (
                  <Cell key={`t-${idx}`} fill={ACTIVITY_TYPE_COLORS.transport} fillOpacity={0.85} />
                ))}
              </Bar>
              <Bar
                dataKey="diet"
                stackId="stack"
                barSize={20}
              >
                {data.map((_, idx) => (
                  <Cell key={`d-${idx}`} fill={ACTIVITY_TYPE_COLORS.diet} fillOpacity={0.85} />
                ))}
              </Bar>
              <Bar
                dataKey="electricity"
                stackId="stack"
                barSize={20}
                radius={[4, 4, 0, 0]}
              >
                {data.map((_, idx) => (
                  <Cell key={`e-${idx}`} fill={ACTIVITY_TYPE_COLORS.electricity} fillOpacity={0.85} />
                ))}
              </Bar>

              <Line
                type="monotone"
                dataKey="total"
                stroke="#2E7D32"
                strokeWidth={2.5}
                dot={{
                  fill: '#fff',
                  stroke: '#2E7D32',
                  strokeWidth: 2,
                  r: 3,
                }}
                activeDot={{
                  r: 6,
                  stroke: '#2E7D32',
                  strokeWidth: 2,
                  fill: '#fff',
                }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default React.memo(TrendChart);
