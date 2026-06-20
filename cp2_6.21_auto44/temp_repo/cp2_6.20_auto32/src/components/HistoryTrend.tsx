import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { TrendingUp } from 'lucide-react';
import type { EssaySubmission } from '@/types';

interface HistoryTrendProps {
  history: EssaySubmission[];
}

export function HistoryTrend({ history }: HistoryTrendProps) {
  const chartData = history
    .slice()
    .reverse()
    .map((item, index) => ({
      name: `第${index + 1}次`,
      score: item.scores.total,
      date: new Date(item.submittedAt).toLocaleDateString('zh-CN', {
        month: 'short',
        day: 'numeric',
      }),
    }));

  const CustomTooltip = ({
    active,
    payload,
    label,
  }: {
    active?: boolean;
    payload?: Array<{ value: number }>;
    label?: string;
  }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white px-3 py-2 rounded-lg shadow-lg border border-gray-100 text-sm">
          <p className="font-medium text-gray-800">{label}</p>
          <p className="text-[#FF7043] font-semibold">
            {payload[0].value} 分
          </p>
        </div>
      );
    }
    return null;
  };

  if (history.length === 0) {
    return (
      <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
        <h3 className="text-base font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <span className="w-1.5 h-5 bg-green-500 rounded-full" />
          历史评分趋势
        </h3>
        <div className="h-32 flex items-center justify-center text-gray-400 text-sm">
          暂无历史记录
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm animate-fade-in">
      <h3 className="text-base font-semibold text-gray-800 mb-3 flex items-center gap-2">
        <span className="w-1.5 h-5 bg-green-500 rounded-full" />
        历史评分趋势
        <TrendingUp className="text-green-500 ml-auto" size={18} />
      </h3>

      <div className="h-36">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="name"
              tick={{ fill: '#999', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fill: '#999', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              width={35}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#ddd', strokeDasharray: '5 5' }} />
            <Line
              type="monotone"
              dataKey="score"
              stroke="#FF7043"
              strokeWidth={2.5}
              dot={{ fill: '#FF7043', r: 4 }}
              activeDot={{ r: 6, fill: '#FF7043', stroke: '#fff', strokeWidth: 2 }}
              isAnimationActive
              animationDuration={1000}
              animationEasing="ease-out"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default HistoryTrend;
