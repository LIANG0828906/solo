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
import { useMemo } from 'react';
import type { CareLog } from '@/types';
import { format, startOfWeek, addWeeks } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface WateringChartProps {
  logs: CareLog[];
}

export default function WateringChart({ logs }: WateringChartProps) {
  const data = useMemo(() => {
    const waterLogs = logs.filter((l) => l.type === 'water');
    if (waterLogs.length === 0) return [];

    const now = new Date();
    const weeks: { label: string; count: number; weekStart: Date }[] = [];

    for (let i = 5; i >= 0; i--) {
      const weekStart = startOfWeek(addWeeks(now, -i), { weekStartsOn: 1, locale: zhCN });
      const weekEnd = addWeeks(weekStart, 1);
      const count = waterLogs.filter((l) => {
        const d = new Date(l.date);
        return d >= weekStart && d < weekEnd;
      }).length;
      weeks.push({
        label: format(weekStart, 'M/d', { locale: zhCN }),
        count,
        weekStart,
      });
    }
    return weeks;
  }, [logs]);

  if (data.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-app-text-light text-sm py-12">
        暂无浇水数据
      </div>
    );
  }

  const colors = ['#4A90D9', '#5B8C5A', '#E8913A', '#8B5E3C', '#F5B700', '#7AA87A'];

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(91, 140, 90, 0.1)" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: '#6B7C6C' }}
          axisLine={{ stroke: 'rgba(91, 140, 90, 0.2)' }}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: '#6B7C6C' }}
          axisLine={false}
          tickLine={false}
          allowDecimals={false}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#fff',
            border: '1px solid rgba(91, 140, 90, 0.15)',
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            fontSize: '12px',
          }}
          formatter={(value: number) => [`${value} 次`, '浇水次数']}
          cursor={{ fill: 'rgba(91, 140, 90, 0.05)' }}
        />
        <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={40}>
          {data.map((_, index) => (
            <Cell key={`cell-${index}`} fill={colors[index % colors.length]} opacity={0.85} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
