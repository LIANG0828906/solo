import { useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  Tooltip,
  Cell,
} from 'recharts';

const BAR_COLORS = [
  '#6C63FF', '#FF6584', '#43E97B', '#FFD93D',
  '#4FC3F7', '#FF8A65', '#BA68C8', '#81C784',
];

interface TechStackChartProps {
  techStack: string[];
}

export default function TechStackChart({ techStack }: TechStackChartProps) {
  const data = useMemo(() => {
    const total = techStack.length;
    return techStack.map((name, index) => ({
      name: name.length > 6 ? name.slice(0, 6) : name,
      fullName: name,
      value: Math.max(1, Math.round((1 - index * 0.15) * 100)),
      percent: total > 0 ? Math.round(((total - index) / total) * 100) : 0,
    }));
  }, [techStack]);

  const tooltipStyle = {
    backgroundColor: 'var(--color-card)',
    border: '1px solid var(--color-border)',
    borderRadius: '6px',
    color: 'var(--color-text)',
    fontSize: '0.75rem',
    padding: '4px 8px',
  };

  const axisTickStyle = {
    fill: 'var(--color-text-secondary)',
    fontSize: 10,
  };

  return (
    <div className="w-full h-[100px] mt-2">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} barSize={18} barGap={4}>
          <XAxis
            dataKey="name"
            tick={axisTickStyle}
            axisLine={false}
            tickLine={false}
            interval={0}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            formatter={(_value: number, _name: string, props: { payload?: { fullName?: string; percent?: number } }) => [
              `${props.payload?.percent ?? 0}%`,
              props.payload?.fullName ?? '',
            ]}
            cursor={{ fill: 'rgba(108,99,255,0.06)' }}
          />
          <Bar dataKey="value" radius={[2, 2, 0, 0]}>
            {data.map((_, i) => (
              <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
