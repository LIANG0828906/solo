import { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useAppStore } from '../store/appStore';
import { getDailyDurationMap, downsampleData, calculateStreak } from '../modules/progressTracker';

interface ProgressChartProps {
  userId1: string;
  userId2: string;
  userName1: string;
  userName2: string;
  days?: number;
}

export default function ProgressChart({
  userId1,
  userId2,
  userName1,
  userName2,
  days = 7,
}: ProgressChartProps) {
  const checkins = useAppStore(state => state.checkins);

  const chartData = useMemo(() => {
    const data1 = getDailyDurationMap(checkins, userId1, days);
    const data2 = getDailyDurationMap(checkins, userId2, days);

    const merged = data1.map((item, idx) => ({
      date: item.date.slice(5),
      [userName1]: item.duration,
      [userName2]: data2[idx]?.duration || 0,
    }));

    return downsampleData(merged, days);
  }, [checkins, userId1, userId2, userName1, userName2, days]);

  const streak1 = calculateStreak(checkins, userId1);
  const streak2 = calculateStreak(checkins, userId2);

  return (
    <div>
      <div style={{ display: 'flex', gap: 24, marginBottom: 20, flexWrap: 'wrap' }}>
        <StreakBar name={userName1} streak={streak1} color="#3B82F6" />
        <StreakBar name={userName2} streak={streak2} color="#F97316" />
      </div>
      <div className="chart-container">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
            <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#64748B' }} />
            <YAxis
              label={{ value: '分钟', angle: -90, position: 'insideLeft', fontSize: 12, fill: '#64748B' }}
              tick={{ fontSize: 12, fill: '#64748B' }}
            />
            <Tooltip
              contentStyle={{
                borderRadius: 8,
                border: '1px solid #E2E8F0',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey={userName1}
              stroke="#3B82F6"
              strokeWidth={2}
              dot={{ r: 4, fill: '#3B82F6' }}
              activeDot={{ r: 6 }}
            />
            <Line
              type="monotone"
              dataKey={userName2}
              stroke="#F97316"
              strokeWidth={2}
              dot={{ r: 4, fill: '#F97316' }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function StreakBar({ name, streak, color }: { name: string; streak: number; color: string }) {
  const maxDays = 30;
  const cells = Array.from({ length: maxDays }, (_, i) => i < streak);

  return (
    <div className="card" style={{ flex: 1, minWidth: 200 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
        <span style={{ fontWeight: 600 }}>{name}</span>
        <span style={{ fontWeight: 700, color }}>🔥 {streak}天</span>
      </div>
      <div className="progress-streak">
        {cells.map((filled, idx) => (
          <div
            key={idx}
            className={`streak-cell ${filled ? 'filled' : ''}`}
            style={filled ? { background: color } : {}}
          />
        ))}
      </div>
    </div>
  );
}
