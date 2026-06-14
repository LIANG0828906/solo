import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LabelList,
} from 'recharts';
import type { BrewRecord, TastingNote } from '@/types';

interface Props {
  brews: BrewRecord[];
  notes: TastingNote[];
}

export default function ScoreChart({ brews, notes }: Props) {
  const data = useMemo(() => {
    const sorted = [...brews].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
    return sorted.map((b, idx) => {
      const note = notes.find((n) => n.brewRecordId === b.id);
      return {
        name: `第${idx + 1}次`,
        score: note?.overallScore ?? 0,
        brewCount: b.brewCount,
      };
    });
  }, [brews, notes]);

  if (data.length === 0) {
    return (
      <div
        className="py-12 text-center text-sm"
        style={{ color: 'var(--color-text-light)' }}
      >
        暂无评分记录
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: 220 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 20, right: 10, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E8DFD0" vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 11, fill: '#7A6B5A' }}
            axisLine={{ stroke: '#E8DFD0' }}
            tickLine={false}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fontSize: 11, fill: '#7A6B5A' }}
            axisLine={{ stroke: '#E8DFD0' }}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #E8DFD0',
              borderRadius: 8,
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              fontSize: 13,
            }}
            formatter={(value: number) => [`${value} 分`, '综合评分']}
            labelFormatter={(l) => `${l}冲泡`}
          />
          <Bar
            dataKey="score"
            fill="#6B8E23"
            radius={[6, 6, 0, 0]}
            animationDuration={600}
            animationEasing="ease-out"
            isAnimationActive
          >
            <LabelList
              dataKey="score"
              position="top"
              fill="#6B8E23"
              fontSize={12}
              fontWeight={600}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
