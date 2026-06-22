import React, { memo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { getScoreColor, getScoreLevel } from '../types';

interface ScoreRingProps {
  score: number;
  size?: number;
}

const ScoreRing: React.FC<ScoreRingProps> = memo(function ScoreRing({ score, size = 180 }) {
  const color = getScoreColor(score);
  const level = getScoreLevel(score);

  const data = [
    { name: 'score', value: score },
    { name: 'remain', value: 100 - score },
  ];

  return (
    <div className="score-ring-wrap fade-data">
      <div style={{ position: 'relative', width: size, height: size }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={size * 0.35}
              outerRadius={size * 0.45}
              startAngle={90}
              endAngle={-270}
              dataKey="value"
              strokeWidth={0}
              isAnimationActive={true}
              animationDuration={600}
            >
              <Cell fill={color} />
              <Cell fill="#edf2f7" />
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div style={{ fontSize: size * 0.28, fontWeight: 700, color }}>
            {score}
          </div>
          <div style={{ fontSize: 13, color: '#718096', marginTop: 2 }}>{level}</div>
        </div>
      </div>
    </div>
  );
});

export default ScoreRing;
