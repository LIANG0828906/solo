import { memo, useEffect, useRef, useState } from 'react';
import { TasteProfile } from '../../types';
import './RadarChart.css';

interface RadarChartProps {
  data: TasteProfile;
  size?: number;
}

const TASTE_KEYS: (keyof TasteProfile)[] = ['sour', 'sweet', 'spicy', 'salty', 'umami'];

const TASTE_LABELS: Record<keyof TasteProfile, string> = {
  sour: '酸',
  sweet: '甜',
  spicy: '辣',
  salty: '咸',
  umami: '鲜',
};

const ANGLE_OFFSET = -Math.PI / 2;

const RadarChart = memo(function RadarChart({
  data,
  size = 240,
}: RadarChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [animated, setAnimated] = useState(false);
  const center = size / 2;
  const radius = size * 0.38;

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(true), 100);
    return () => {
      clearTimeout(timer);
      setAnimated(false);
    };
  }, [data]);

  const getPointCoordinates = (index: number, value: number, maxValue: number = 10) => {
    const angle = (index * 2 * Math.PI) / TASTE_KEYS.length + ANGLE_OFFSET;
    const r = (radius * value) / maxValue;
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle),
    };
  };

  const getLabelCoordinates = (index: number) => {
    const angle = (index * 2 * Math.PI) / TASTE_KEYS.length + ANGLE_OFFSET;
    const labelRadius = radius + 32;
    return {
      x: center + labelRadius * Math.cos(angle),
      y: center + labelRadius * Math.sin(angle),
    };
  };

  const createGridPath = (level: number) => {
    const points = TASTE_KEYS.map((_, index) => {
      const angle = (index * 2 * Math.PI) / TASTE_KEYS.length + ANGLE_OFFSET;
      const r = (radius * (level + 1)) / 5;
      return `${center + r * Math.cos(angle)},${center + r * Math.sin(angle)}`;
    });
    return `M ${points.join(' L ')} Z`;
  };

  const createDataPath = () => {
    const points = TASTE_KEYS.map((key, index) => {
      const point = getPointCoordinates(index, data[key]);
      return `${point.x},${point.y}`;
    });
    return `M ${points.join(' L ')} Z`;
  };

  const createAnchorPoints = () => {
    return TASTE_KEYS.map((key, index) => {
      const point = getPointCoordinates(index, data[key]);
      return { ...point, key, value: data[key] };
    });
  };

  return (
    <div className="radar-chart-container">
      <svg
        ref={svgRef}
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="radar-svg"
      >
        <defs>
          <linearGradient id="radarGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ff6b9d" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#ff8a80" stopOpacity="0.6" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {[0, 1, 2, 3, 4].map((level) => (
          <path
            key={level}
            d={createGridPath(level)}
            fill="none"
            stroke="#e5e5e5"
            strokeWidth="1"
            opacity="0.6"
          />
        ))}

        {TASTE_KEYS.map((_, index) => {
          const angle = (index * 2 * Math.PI) / TASTE_KEYS.length + ANGLE_OFFSET;
          return (
            <line
              key={index}
              x1={center}
              y1={center}
              x2={center + radius * Math.cos(angle)}
              y2={center + radius * Math.sin(angle)}
              stroke="#e5e5e5"
              strokeWidth="1"
              opacity="0.6"
            />
          );
        })}

        <path
          d={createDataPath()}
          fill="url(#radarGradient)"
          stroke="#ff6b9d"
          strokeWidth="2"
          className={`radar-data-path ${animated ? 'animate' : ''}`}
          style={{
            transformOrigin: `${center}px ${center}px`,
          }}
        />

        {createAnchorPoints().map((point, index) => (
          <g key={point.key}>
            <circle
              cx={point.x}
              cy={point.y}
              r={animated ? 6 : 0}
              fill="white"
              stroke="#ff6b9d"
              strokeWidth="2.5"
              className={`radar-anchor ${animated ? 'animate' : ''}`}
              style={{
                animationDelay: `${index * 0.1}s`,
                filter: 'url(#glow)',
              }}
            />
            <circle
              cx={point.x}
              cy={point.y}
              r={animated ? 3 : 0}
              fill="#ff6b9d"
              className={`radar-anchor-dot ${animated ? 'animate' : ''}`}
              style={{
                animationDelay: `${index * 0.1 + 0.2}s`,
              }}
            />
          </g>
        ))}

        {TASTE_KEYS.map((key, index) => {
          const label = getLabelCoordinates(index);
          return (
            <text
              key={key}
              x={label.x}
              y={label.y}
              textAnchor="middle"
              dominantBaseline="middle"
              className="radar-label"
              fontSize="13"
              fontWeight="600"
              fill="#666"
            >
              {TASTE_LABELS[key]}
            </text>
          );
        })}
      </svg>
    </div>
  );
});

export default RadarChart;
