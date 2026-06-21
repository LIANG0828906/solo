import { VoteStat } from '../api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from 'recharts';

function interpolateColor(start: string, end: string, t: number): string {
  const s = { r: parseInt(start.slice(1, 3), 16), g: parseInt(start.slice(3, 5), 16), b: parseInt(start.slice(5, 7), 16) };
  const e = { r: parseInt(end.slice(1, 3), 16), g: parseInt(end.slice(3, 5), 16), b: parseInt(end.slice(5, 7), 16) };
  const r = Math.round(s.r + (e.r - s.r) * t);
  const g = Math.round(s.g + (e.g - s.g) * t);
  const b = Math.round(s.b + (e.b - s.b) * t);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

function getColors(count: number): string[] {
  if (count <= 1) return ['#2196F3'];
  return Array.from({ length: count }, (_, i) => interpolateColor('#4FC3F7', '#1565C0', i / (count - 1)));
}

interface ChartPanelProps {
  stats: VoteStat[];
}

export default function ChartPanel({ stats }: ChartPanelProps) {
  const data = stats.map((s) => ({ name: s.text, count: s.count }));
  const colors = getColors(stats.length);
  const total = stats.reduce((sum, s) => sum + s.count, 0);

  const renderPieLabel = ({ name, percent }: { name: string; percent: number }) => {
    return `${name} ${(percent * 100).toFixed(0)}%`;
  };

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, padding: '16px 0' }}>
      <div style={{ flex: 1, minWidth: 250 }}>
        <BarChart width={300} height={200} data={data}>
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="count">
            {data.map((_, i) => (
              <Cell key={i} fill={colors[i]} />
            ))}
          </Bar>
        </BarChart>
      </div>
      <div style={{ flex: 1, minWidth: 250 }}>
        <PieChart width={300} height={200}>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            outerRadius={80}
            innerRadius={40}
            dataKey="count"
            label={renderPieLabel}
            animationBegin={0}
            animationDuration={300}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={colors[i]} />
            ))}
          </Pie>
        </PieChart>
      </div>
    </div>
  );
}
