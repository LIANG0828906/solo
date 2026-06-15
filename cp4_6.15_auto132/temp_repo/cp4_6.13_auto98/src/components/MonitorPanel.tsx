import { useEffect, useMemo } from 'react';
import { useStore } from '@/store';
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

const COLORS = [
  '#89b4fa', '#f38ba8', '#a6e3a1', '#fab387', '#f9e2af', '#94e2d5',
  '#cba6f7', '#89dceb', '#eba0ac', '#b4befe', '#74c7ec', '#f5c2e7',
];

export default function MonitorPanel() {
  const chartData = useStore((s) => s.chartData);
  const monitorPoints = useStore((s) => s.monitorPoints);
  const sceneParams = useStore((s) => s.sceneParams);
  const addChartDataPoint = useStore((s) => s.addChartDataPoint);

  const pinnedPoints = useMemo(
    () => monitorPoints.filter((p) => p.isPinned).slice(0, 12),
    [monitorPoints],
  );

  useEffect(() => {
    const interval = setInterval(() => {
      const point: Record<string, number> = { time: sceneParams.time };
      for (const p of pinnedPoints) {
        point[p.id] = p.illuminance;
      }
      const current = useStore.getState().chartData;
      const next = current.length >= 100
        ? [...current.slice(current.length - 99), point]
        : [...current, point];
      useStore.setState({ chartData: next });
    }, 500);
    return () => clearInterval(interval);
  }, [pinnedPoints, sceneParams.time]);

  return (
    <div style={{ background: 'transparent', padding: 8, position: 'absolute', bottom: 0, width: '100%' }}>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="5 5" stroke="#585b70" />
          <XAxis
            dataKey="time"
            label={{ value: '时间(h)', position: 'insideBottomRight', offset: -5, style: { fill: '#cdd6f4', fontSize: 11 } }}
            tick={{ fill: '#cdd6f4', fontSize: 11 }}
            axisLine={{ stroke: '#585b70' }}
          />
          <YAxis
            label={{ value: '照度(lux)', angle: -90, position: 'insideLeft', style: { fill: '#cdd6f4', fontSize: 11 } }}
            tick={{ fill: '#cdd6f4', fontSize: 11 }}
            axisLine={{ stroke: '#585b70' }}
          />
          <Tooltip
            contentStyle={{
              background: '#313244',
              border: '1px solid #45475a',
              borderRadius: '6px',
              color: '#cdd6f4',
            }}
          />
          <Legend
            wrapperStyle={{ color: '#cdd6f4' }}
            formatter={(value: string) => value.substring(0, 6)}
          />
          {pinnedPoints.map((point, index) => (
            <Line
              key={point.id}
              dataKey={point.id}
              stroke={COLORS[index % COLORS.length]}
              strokeWidth={2}
              dot={false}
              type="monotone"
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
