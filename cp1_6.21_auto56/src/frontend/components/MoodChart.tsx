import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { MoodEntry } from '../../types';
import { MOOD_LABELS, MOOD_EMOJIS, DIET_LABELS } from '../../types';

interface MoodChartProps {
  moods: MoodEntry[];
}

function getIntensityColor(intensity: number): string {
  const ratio = (intensity - 1) / 9;
  const r = Math.round(229 + (67 - 229) * ratio);
  const g = Math.round(57 + (160 - 57) * ratio);
  const b = Math.round(53 + (71 - 53) * ratio);
  return `rgb(${r}, ${g}, ${b})`;
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: MoodEntry }> }) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="tooltip-box">
        <div className="tooltip-date">{data.date}</div>
        <div className="tooltip-mood">
          {MOOD_EMOJIS[data.mood]} {MOOD_LABELS[data.mood]} · 强度 {data.intensity}
        </div>
        <div className="tooltip-summary">
          睡眠 {data.sleepHours}h · 运动 {data.exerciseMinutes}min · 饮水 {data.waterCups}杯
        </div>
        {data.dietLabels.length > 0 && (
          <div className="tooltip-summary">
            饮食：{data.dietLabels.map((d) => DIET_LABELS[d]).join('、')}
          </div>
        )}
      </div>
    );
  }
  return null;
}

export default function MoodChart({ moods }: MoodChartProps) {
  const chartData = [...moods]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map((m) => ({
      ...m,
      displayDate: m.date.slice(5),
    }));

  const gradientId = 'moodLineGradient';

  return (
    <div className="card">
      <h2 className="card-title">
        <span className="material-icons">show_chart</span>
        最近7天情绪趋势
      </h2>
      <div className="chart-container" style={{ height: '240px', width: '100%', maxWidth: '100%' }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#E53935" />
                <stop offset="100%" stopColor="#43A047" />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" />
            <XAxis dataKey="displayDate" tick={{ fontSize: 12, fill: '#888' }} />
            <YAxis
              domain={[0, 10]}
              tick={{ fontSize: 12, fill: '#888' }}
              tickCount={6}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#E0E0E0', strokeDasharray: '3 3' }} />
            <Line
              type="monotone"
              dataKey="intensity"
              stroke={`url(#${gradientId})`}
              strokeWidth={3}
              dot={(props: { cx?: number; cy?: number; payload?: MoodEntry; index?: number }) => {
                const { cx, cy, payload, index } = props;
                if (!payload) return null;
                return (
                  <circle
                    key={`dot-${index}`}
                    cx={cx}
                    cy={cy}
                    r={6}
                    fill={getIntensityColor(payload.intensity)}
                    stroke="#fff"
                    strokeWidth={2}
                  />
                );
              }}
              activeDot={{ r: 8, stroke: '#fff', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
