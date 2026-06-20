import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { BarChart3, AlertTriangle, TrendingUp } from 'lucide-react';
import type { StatsResponse } from '@/types';
import { ERROR_COLORS, ERROR_LABELS } from '@/types';

interface StatsPanelProps {
  stats: StatsResponse;
}

export function StatsPanel({ stats }: StatsPanelProps) {
  const scoreDistData = Object.entries(stats.scoreDistribution).map(
    ([range, count]) => ({
      range,
      count,
    })
  );

  const errorTypeData = Object.entries(stats.errorTypeCount).map(
    ([type, count]) => ({
      name: ERROR_LABELS[type as keyof typeof ERROR_LABELS] || type,
      value: count,
      color: ERROR_COLORS[type as keyof typeof ERROR_COLORS] || '#999',
    })
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
      <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
        <h3 className="text-base font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <BarChart3 className="text-blue-500" size={18} />
          评分分布
        </h3>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={scoreDistData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
              <XAxis
                dataKey="range"
                tick={{ fill: '#666', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: '#999', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={30}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: '8px',
                  border: '1px solid #eee',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                }}
              />
              <Bar
                dataKey="count"
                fill="#42A5F5"
                radius={[4, 4, 0, 0]}
                isAnimationActive
                animationDuration={800}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
        <h3 className="text-base font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <AlertTriangle className="text-amber-500" size={18} />
          错误类型统计
        </h3>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={errorTypeData}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={70}
                paddingAngle={3}
                dataKey="value"
                isAnimationActive
                animationDuration={800}
              >
                {errorTypeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  borderRadius: '8px',
                  border: '1px solid #eee',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                }}
              />
              <Legend
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: '12px' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="md:col-span-2 grid grid-cols-3 gap-3">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4">
          <p className="text-sm text-blue-600 mb-1">总提交数</p>
          <p className="text-2xl font-bold text-blue-700">
            {stats.totalSubmissions}
          </p>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4">
          <p className="text-sm text-green-600 mb-1">平均分</p>
          <p className="text-2xl font-bold text-green-700">
            {stats.averageScore.toFixed(1)}
          </p>
        </div>
        <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-4 flex items-center gap-3">
          <TrendingUp className="text-amber-500" size={28} />
          <div>
            <p className="text-sm text-amber-600">整体表现</p>
            <p className="text-lg font-bold text-amber-700">良好</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default StatsPanel;
