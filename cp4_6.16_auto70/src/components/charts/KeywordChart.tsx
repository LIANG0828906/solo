import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';
import { useMemo } from 'react';
import type { CareLog } from '@/types';
import { format, parseISO } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface KeywordChartProps {
  logs: CareLog[];
}

const keywords = ['生长', '开花', '新叶', '发芽', '健康'];

export default function KeywordChart({ logs }: KeywordChartProps) {
  const data = useMemo(() => {
    const sortedLogs = [...logs]
      .filter((l) => l.note || l.height != null)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    if (sortedLogs.length === 0) return [];

    const points = sortedLogs.slice(-12).map((log) => {
      const note = log.note || '';
      const keywordCount = keywords.filter((k) => note.includes(k)).length;
      return {
        label: format(parseISO(log.date), 'M/d', { locale: zhCN }),
        高度: log.height ?? null,
        关键词: keywordCount,
      };
    });

    return points;
  }, [logs]);

  const hasHeightData = data.some((d) => d.高度 != null);
  const hasKeywordData = data.some((d) => d.关键词 > 0);

  if (data.length === 0 || (!hasHeightData && !hasKeywordData)) {
    return (
      <div className="h-full flex items-center justify-center text-app-text-light text-sm py-12">
        暂无生长数据（记录高度或关键词备注）
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      {hasHeightData ? (
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="heightGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#5B8C5A" stopOpacity={0.4} />
              <stop offset="100%" stopColor="#5B8C5A" stopOpacity={0} />
            </linearGradient>
          </defs>
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
            label={{ value: 'cm', position: 'insideTopLeft', offset: -5, fontSize: 11, fill: '#6B7C6C' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid rgba(91, 140, 90, 0.15)',
              borderRadius: '12px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
              fontSize: '12px',
            }}
            formatter={(value: number | null, name: string) =>
              value != null ? [`${value} ${name === '高度' ? 'cm' : '个'}`, name] : null
            }
          />
          <Area
            type="monotone"
            dataKey="高度"
            stroke="#5B8C5A"
            strokeWidth={2.5}
            fill="url(#heightGradient)"
            dot={{ r: 3, fill: '#5B8C5A', strokeWidth: 2, stroke: '#fff' }}
            activeDot={{ r: 5 }}
            connectNulls
          />
        </AreaChart>
      ) : (
        <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
            formatter={(value: number) => [`${value} 个`, '关键词频次']}
          />
          <Line
            type="monotone"
            dataKey="关键词"
            stroke="#E8913A"
            strokeWidth={2.5}
            dot={{ r: 3, fill: '#E8913A', strokeWidth: 2, stroke: '#fff' }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      )}
    </ResponsiveContainer>
  );
}
