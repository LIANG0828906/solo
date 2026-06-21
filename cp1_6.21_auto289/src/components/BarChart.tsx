import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { formatDurationHours } from '@/utils/timeUtils';
import type { TaskSummary } from '../../shared/types';

interface BarChartProps {
  data: TaskSummary[];
}

export default function BarChart({ data }: BarChartProps) {
  const formattedData = data.map(item => ({
    ...item,
    dateLabel: item.date.slice(5).replace('-', '/'),
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white px-4 py-3 rounded-xl shadow-lg border border-gray-100">
          <p className="text-sm text-gray-500 mb-1">{payload[0].payload.date}</p>
          <p className="text-lg font-bold text-primary-600">
            {formatDurationHours(payload[0].value * 3600)} 小时
          </p>
        </div>
      );
    }
    return null;
  };

  const CustomBarLabel = (props: any) => {
    const { x, y, width, value } = props;
    if (value < 0.5) return null;
    return (
      <text
        x={x + width / 2}
        y={y - 8}
        textAnchor="middle"
        className="text-xs font-medium"
        fill="#6366F1"
      >
        {value.toFixed(1)}h
      </text>
    );
  };

  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-400">
        暂无数据
      </div>
    );
  }

  const colors = ['#6366F1', '#7C3AED', '#8B5CF6'];

  return (
    <div className="w-full h-64 min-w-[320px] max-w-[800px] mx-auto">
      <ResponsiveContainer width="100%" height="100%">
        <RechartsBarChart
          data={formattedData}
          margin={{ top: 20, right: 20, left: 0, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
          <XAxis 
            dataKey="dateLabel" 
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#94A3B8', fontSize: 12 }}
            dy={10}
          />
          <YAxis 
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#94A3B8', fontSize: 12 }}
            tickFormatter={(value) => `${value}h`}
            width={40}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: '#F1F5F9' }} />
          <Bar 
            dataKey="totalHours" 
            radius={[8, 8, 0, 0]}
            label={<CustomBarLabel />}
            maxBarSize={48}
          >
            {formattedData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={`url(#colorGradient-${index % colors.length})`}
              />
            ))}
            <defs>
              {colors.map((color, i) => (
                <linearGradient key={i} id={`colorGradient-${i}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8B5CF6" />
                  <stop offset="100%" stopColor="#6366F1" />
                </linearGradient>
              ))}
            </defs>
          </Bar>
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
}
