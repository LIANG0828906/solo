import React, { useMemo } from 'react';
import type { CreatureStats } from '../types';
import { STAT_LABELS } from '../utils/constants';

interface RadarChartProps {
  stats: CreatureStats;
}

const RadarChart: React.FC<RadarChartProps> = ({ stats }) => {
  const statKeys = useMemo(
    () => (['health', 'attack', 'defense', 'speed', 'spirit', 'potential'] as const),
    []
  );

  const points = useMemo(() => {
    const centerX = 150;
    const centerY = 150;
    const maxRadius = 110;

    return statKeys.map((key, index) => {
      const angle = (Math.PI * 2 * index) / statKeys.length - Math.PI / 2;
      const value = stats[key] / 100;
      const radius = value * maxRadius;
      return {
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius,
        labelX: centerX + Math.cos(angle) * (maxRadius + 25),
        labelY: centerY + Math.sin(angle) * (maxRadius + 25),
        value: stats[key],
        label: STAT_LABELS[key],
        angle,
      };
    });
  }, [stats, statKeys]);

  const gridPoints = useMemo(() => {
    const centerX = 150;
    const centerY = 150;
    const maxRadius = 110;
    const grids = [];

    for (let level = 1; level <= 5; level++) {
      const radius = (maxRadius / 5) * level;
      const gridPoint = statKeys.map((_, index) => {
        const angle = (Math.PI * 2 * index) / statKeys.length - Math.PI / 2;
        return {
          x: centerX + Math.cos(angle) * radius,
          y: centerY + Math.sin(angle) * radius,
        };
      });
      grids.push(gridPoint);
    }

    return grids;
  }, [statKeys]);

  const polygonPoints = points.map((p) => `${p.x},${p.y}`).join(' ');

  return (
    <div className="relative">
      <svg viewBox="0 0 300 300" className="w-full h-full">
        <defs>
          <radialGradient id="radarBg" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#1e3a5f" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#0d0d1a" stopOpacity="0" />
          </radialGradient>
          <filter id="statGlow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="polygonGlow">
            <feGaussianBlur stdDeviation="4" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <style>{`
          @keyframes breathe {
            0%, 100% {
              transform: scale(1);
              opacity: 0.6;
            }
            50% {
              transform: scale(1.5);
              opacity: 0.15;
            }
          }
          .glow-point {
            animation: breathe 2s ease-in-out infinite;
          }
        `}</style>

        <circle cx="150" cy="150" r="120" fill="url(#radarBg)" />

        {gridPoints.map((grid, level) => (
          <polygon
            key={level}
            points={grid.map((p) => `${p.x},${p.y}`).join(' ')}
            fill="#1e3a5f"
            fillOpacity="0.15"
            stroke="#3b82f6"
            strokeOpacity="0.3"
            strokeWidth="1"
          />
        ))}

        {points.map((point, index) => (
          <line
            key={`axis-${index}`}
            x1="150"
            y1="150"
            x2={point.labelX}
            y2={point.labelY}
            stroke="#3b82f6"
            strokeOpacity="0.3"
            strokeWidth="1"
          />
        ))}

        <polygon
          points={polygonPoints}
          fill="#6c63ff"
          fillOpacity="0.3"
          stroke="#6c63ff"
          strokeWidth="2"
          filter="url(#polygonGlow)"
        />

        {points.map((point, index) => (
          <g key={`point-${index}`}>
            <circle
              cx={point.x}
              cy={point.y}
              r="8"
              fill="#ffd700"
              fillOpacity="0.4"
              className="glow-point"
              style={{
                transformOrigin: `${point.x}px ${point.y}px`,
                animationDelay: `${index * 0.15}s`,
              }}
            />
            <circle
              cx={point.x}
              cy={point.y}
              r="5"
              fill="#ffd700"
              filter="url(#statGlow)"
            />
            <circle
              cx={point.x}
              cy={point.y}
              r="2.5"
              fill="#fff"
            />
          </g>
        ))}

        {points.map((point, index) => (
          <g key={`label-${index}`}>
            <text
              x={point.labelX}
              y={point.labelY}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="#b0b0d0"
              fontSize="12"
              fontFamily="'Lato', sans-serif"
            >
              {point.label}
            </text>
            <text
              x={point.labelX}
              y={point.labelY + 16}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="#ffd700"
              fontSize="11"
              fontFamily="'Cinzel Decorative', serif"
              fontWeight="bold"
            >
              {point.value}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
};

export default RadarChart;
