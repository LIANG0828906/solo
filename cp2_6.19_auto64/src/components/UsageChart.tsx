import { useMemo, useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import type { UsageLog } from '@/types';
import { getUsageChartData, getDailyUsageStats } from '@/utils/productUtils';

interface UsageChartProps {
  productId?: string;
  usageLogs: UsageLog[];
  height?: number;
  showAmount?: boolean;
}

export const UsageChart = ({ productId, usageLogs, height = 200, showAmount = true }: UsageChartProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [key, setKey] = useState(0);

  const chartData = useMemo(() => {
    if (productId) {
      return getUsageChartData(productId, usageLogs);
    }
    return getDailyUsageStats(usageLogs).map(item => ({
      ...item,
      dayName: new Date(item.date).toLocaleDateString('zh-CN', { weekday: 'short' }),
    }));
  }, [productId, usageLogs]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
      setKey(prev => prev + 1);
    }, 100);
    return () => clearTimeout(timer);
  }, [productId, usageLogs.length]);

  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string }>; label?: string }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white px-4 py-2 rounded-xl shadow-lg border border-gray-100">
          <p className="text-sm text-gray-500 mb-1">{label}</p>
          <p className="text-base font-semibold text-primary">
            {showAmount ? `${payload[0].value} ml/g` : `${payload[0].value} 件产品`}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          key={key}
          data={chartData}
          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
        >
          <XAxis
            dataKey="dayName"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: '#9CA3AF' }}
          />
          <YAxis
            hide={true}
            domain={[0, 'auto']}
          />
          <Tooltip
            content={<CustomTooltip />}
            cursor={{ fill: 'rgba(139, 157, 175, 0.08)' }}
            offset={10}
          />
          <defs>
            <linearGradient id="barColorGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8B9DAF" stopOpacity={1} />
              <stop offset="100%" stopColor="#B5C0CA" stopOpacity={0.8} />
            </linearGradient>
          </defs>
          <Bar
            dataKey={showAmount ? 'amount' : 'count'}
            fill="url(#barColorGradient)"
            radius={[6, 6, 0, 0]}
            animationDuration={800}
            animationEasing="ease-out"
            animationBegin={isVisible ? 0 : 300}
            maxBarSize={40}
          >
            {chartData.map((_, index) => (
              <Cell
                key={`cell-${index}`}
                fill="url(#barColorGradient)"
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
