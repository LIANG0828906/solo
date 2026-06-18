import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { EMOTION_MAP } from '@/types';
import type { Task } from '@/types';

interface EmotionChartProps {
  tasks: Task[];
}

export function EmotionChart({ tasks }: EmotionChartProps) {
  const data = useMemo(() => {
    const stats: Record<string, number> = {
      happy: 0,
      sad: 0,
      angry: 0,
      proud: 0,
      tired: 0,
    };

    tasks.forEach((task) => {
      if (task.emotion && stats[task.emotion] !== undefined) {
        stats[task.emotion]++;
      }
    });

    return Object.entries(stats).map(([key, value]) => ({
      name: key,
      value,
      emoji: EMOTION_MAP[key]?.emoji || '❓',
      label: EMOTION_MAP[key]?.label || key,
      color: EMOTION_MAP[key]?.color || '#999',
    }));
  }, [tasks]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div style={{
          background: 'white',
          padding: '8px 12px',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          fontSize: '14px',
        }}>
          <span style={{ marginRight: '8px' }}>{item.emoji}</span>
          <span style={{ fontWeight: 500 }}>{item.label}: {item.value}</span>
        </div>
      );
    }
    return null;
  };

  const renderCustomLabel = ({ x, y, width, height, value, index }: any) => {
    const item = data[index];
    return (
      <text
        x={x + width / 2}
        y={y + height / 2}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="18"
      >
        {value > 0 ? item.emoji : ''}
      </text>
    );
  };

  return (
    <div className="glass" style={{
      borderRadius: '16px',
      padding: '24px',
      marginBottom: '24px',
    }}>
      <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px', color: 'var(--color-primary)' }}>
        团队情感统计
      </h3>
      <div style={{ height: '180px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <XAxis 
              dataKey="label" 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#7F8C8D' }}
            />
            <YAxis hide />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.05)' }} />
            <Bar 
              dataKey="value" 
              radius={[8, 8, 0, 0]}
              maxBarSize={60}
              label={renderCustomLabel}
              animationDuration={500}
              animationEasing="ease-out"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} fillOpacity={0.8} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
