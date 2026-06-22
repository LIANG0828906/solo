import React, { useMemo, useRef, useEffect, useState } from 'react';
import type { CreatureStats } from '../types';
import { STAT_LABELS } from '../utils/constants';

interface RadarChartProps {
  stats: CreatureStats;
}

interface PointAnimation {
  outerRadius: number;
  outerOpacity: number;
  innerRadius: number;
}

const RadarChart: React.FC<RadarChartProps> = ({ stats }) => {
  const statKeys = useMemo(
    () => (['health', 'attack', 'defense', 'speed', 'spirit', 'potential'] as const),
    []
  );

  const [animations, setAnimations] = useState<PointAnimation[]>(
    statKeys.map(() => ({
      outerRadius: 6,
      outerOpacity: 0.5,
      innerRadius: 5,
    }))
  );

  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    const animate = (timestamp: number) => {
      if (!startTimeRef.current) {
        startTimeRef.current = timestamp;
      }
      const elapsed = timestamp - startTimeRef.current;
      const period = 2000;

      const newAnimations = statKeys.map((_, index) => {
        const phase = index * 150;
        const t = ((elapsed + phase) % period) / period;
        const eased = 0.5 - 0.5 * Math.cos(t * Math.PI * 2);

        return {
          outerRadius: 6 + (12 - 6) * eased,
          outerOpacity: 0.5 + (0.1 - 0.5) * eased,
          innerRadius: 4.5 + (5.5 - 4.5) * eased,
        };
      });

      setAnimations(newAnimations);
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [statKeys]);

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

        <circle cx="150" cy="150" r="120" fill="url(#radarBg)" />

        {gridPoints.map((grid, level) => {
          const isOutermost = level === gridPoints.length - 1;
          return (
            <polygon
              key={level}
              points={grid.map((p) => `${p.x},${p.y}`).join(' ')}
              fill={isOutermost ? "#1e3a5f" : "none"}
              fillOpacity={isOutermost ? "0.15" : "0"}
              stroke="#3b82f6"
              strokeOpacity="0.3"
              strokeWidth="1"
            />
          );
        })}

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
              r={animations[index].outerRadius}
              fill="#ffd700"
              fillOpacity={animations[index].outerOpacity}
            />
            <circle
              cx={point.x}
              cy={point.y}
              r={animations[index].innerRadius}
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
