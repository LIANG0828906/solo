import React, { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { RankingItem } from '../types';

interface Props {
  rankings: RankingItem[];
}

const RankingBarChart: React.FC<Props> = ({ rankings }) => {
  const data = useMemo(() => {
    return rankings.map((item) => ({
      name: item.name,
      totalScore: item.totalScore,
      rank: item.rank,
    }));
  }, [rankings]);

  const getBarColor = (rank: number): string => {
    if (rank === 1) return '#FFD700';
    if (rank === 2) return '#C0C0C0';
    if (rank === 3) return '#CD7F32';

    const startColor = { r: 99, g: 179, b: 237 };
    const endColor = { r: 49, g: 130, b: 206 };
    const total = rankings.length > 3 ? rankings.length - 3 : 1;
    const current = rank > 3 ? rank - 3 : 0;
    const t = Math.min(current / total, 1);

    const r = Math.round(startColor.r + (endColor.r - startColor.r) * t);
    const g = Math.round(startColor.g + (endColor.g - startColor.g) * t);
    const b = Math.round(startColor.b + (endColor.b - startColor.b) * t);

    return `rgb(${r},${g},${b})`;
  };

  return (
    <div
      style={{
        background: 'white',
        borderRadius: '12px',
        padding: '24px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
      }}
    >
      <div
        style={{
          fontSize: '18px',
          fontWeight: 600,
          color: '#1a365d',
          marginBottom: '16px',
        }}
      >
        排名总分柱状图
      </div>
      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis
            dataKey="name"
            tick={{ fill: '#4a5568', fontSize: 12 }}
          />
          <YAxis tick={{ fill: '#4a5568', fontSize: 12 }} />
          <Tooltip />
          <Bar
            dataKey="totalScore"
            radius={[8, 8, 0, 0]}
            animationDuration={800}
            animationEasing="ease-out"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getBarColor(entry.rank)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default RankingBarChart;
