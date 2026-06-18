import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { CarbonHistoryEntry } from '../types';
import { getCarbonProgressColor } from '../utils/colors';

interface CarbonTrendChartProps {
  data: CarbonHistoryEntry[];
  height?: number;
}

export function CarbonTrendChart({ data, height = 150 }: CarbonTrendChartProps) {
  const chartData = data.length > 0 ? data : [{ step: 0, score: 5, timestamp: Date.now() }];

  const lastScore = chartData[chartData.length - 1]?.score || 5;
  const lineColor = getCarbonProgressColor(lastScore);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const entry = payload[0].payload;
      return (
        <div className="bg-white px-3 py-2 rounded-lg shadow-lg border border-gray-100">
          <p className="text-xs text-gray-500">修改次数: {entry.step}</p>
          <p className="text-sm font-bold" style={{ color: lineColor }}>
            碳足迹: {entry.score.toFixed(1)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        碳足迹变化趋势
      </label>
      <div className="bg-white/50 rounded-lg p-2 backdrop-blur-sm">
        <ResponsiveContainer width="100%" height={height}>
          <LineChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
            <defs>
              <linearGradient id="colorScore" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#22c55e" />
                <stop offset="50%" stopColor="#eab308" />
                <stop offset="100%" stopColor="#ef4444" />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
            <XAxis
              dataKey="step"
              tick={{ fontSize: 10, fill: '#9ca3af' }}
              axisLine={{ stroke: '#e5e7eb' }}
              tickLine={false}
              label={{ value: '修改次数', position: 'insideBottom', offset: -5, fontSize: 10, fill: '#9ca3af' }}
            />
            <YAxis
              domain={[0, 10]}
              tick={{ fontSize: 10, fill: '#9ca3af' }}
              axisLine={{ stroke: '#e5e7eb' }}
              tickLine={false}
              tickFormatter={(value) => (value % 2 === 0 ? value : '')}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="score"
              stroke={lineColor}
              strokeWidth={2}
              dot={{ fill: lineColor, r: 4, strokeWidth: 2, stroke: '#fff' }}
              activeDot={{ r: 6, fill: lineColor, stroke: '#fff', strokeWidth: 2 }}
              isAnimationActive
              animationDuration={500}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      {data.length === 0 && (
        <p className="text-xs text-gray-400 text-center mt-2">
          修改面料或颜色后将显示变化趋势
        </p>
      )}
    </div>
  );
}
