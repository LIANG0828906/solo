import { memo } from 'react';

interface RadarChartProps {
  data: {
    positive: number;
    negative: number;
    neutral: number;
  };
  size?: number;
}

const RadarChart = memo(function RadarChart({ data, size = 80 }: RadarChartProps) {
  const center = size / 2;
  const radius = size * 0.38;
  
  const angles = [
    { key: 'positive',
    label: '正面',
    angle: -Math.PI / 2,
    color: '#51CF66',
  },
  {
    key: 'negative',
    label: '负面',
    angle: -Math.PI / 2 + (2 * Math.PI) / 3,
    color: '#FF6B6B',
  },
  {
    key: 'neutral',
    label: '中性',
    angle: -Math.PI / 2 + (4 * Math.PI) / 3,
    color: '#339AF0',
  },
];

  const getPoint = (angle: number, value: number) => {
    const r = radius * Math.min(value, 1);
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle),
    };
  };

  const dataPoints = angles.map(a => getPoint(a.angle, data[a.key as keyof typeof data]));

  const gridLevels = [0.33, 0.66, 1];

  return (
    <svg
      className="radar-chart"
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
    >
      {gridLevels.map(level => (
        <polygon
          key={level}
          points={angles
            .map(a => {
              const p = getPoint(a.angle, level);
              return `${p.x},${p.y}`;
            })
            .join(' ')}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="1"
        />
      ))}

      {angles.map(a => {
        const end = getPoint(a.angle, 1);
        return (
          <line
            key={a.key}
            x1={center}
            y1={center}
            x2={end.x}
            y2={end.y}
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="1"
          />
        );
      })}

      <polygon
        points={dataPoints.map(p => `${p.x},${p.y}`).join(' ')}
        fill="url(#radarGradient)"
        fillOpacity="0.4"
        stroke="rgba(102,126,234)"
        strokeWidth="1.5"
      />

      <defs>
        <linearGradient id="radarGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#667eea" />
          <stop offset="100%" stopColor="#764ba2" />
        </linearGradient>
      </defs>

      {dataPoints.map((p, i) => (
        <circle
          key={i}
          cx={p.x}
          cy={p.y}
          r="3"
          fill={angles[i].color}
        />
      ))}

      {angles.map(a => {
        const labelPos = getPoint(a.angle, 1.28);
        return (
          <text
            key={`label-${a.key}`}
            x={labelPos.x}
            y={labelPos.y}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="rgba(255,255,255,0.6)"
            fontSize="9"
          >
            {a.label}
          </text>
        );
      })}
    </svg>
  );
});

export default RadarChart;
