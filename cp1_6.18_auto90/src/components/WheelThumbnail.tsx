import React from 'react';
import { FlavorWheel, DIMENSION_COLORS, FlavorDimension, DIMENSION_LABELS } from '@/stores/appStore';

interface WheelThumbnailProps {
  data: FlavorWheel;
  size?: number;
}

const WheelThumbnail: React.FC<WheelThumbnailProps> = ({ data, size = 120 }) => {
  const center = size / 2;
  const radius = size / 2 - 8;
  const dimensions: FlavorDimension[] = ['sweet', 'sour', 'bitter', 'spicy', 'salty', 'umami'];

  const getPoint = (angle: number, r: number) => ({
    x: center + r * Math.cos(angle),
    y: center + r * Math.sin(angle),
  });

  const sectors = dimensions.map((dim, i) => {
    const startAngle = (Math.PI * 2 * i) / 6 - Math.PI / 2;
    const endAngle = (Math.PI * 2 * (i + 1)) / 6 - Math.PI / 2;
    const value = data[dim];
    const valueAngle = startAngle + ((endAngle - startAngle) * value) / 9;

    const p1 = getPoint(startAngle, radius);
    const p2 = getPoint(endAngle, radius);
    const pValue = getPoint(valueAngle, radius);

    const largeArcFlag = endAngle - startAngle > Math.PI ? 1 : 0;

    const sectorPath = [
      `M ${center} ${center}`,
      `L ${p1.x} ${p1.y}`,
      `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${p2.x} ${p2.y}`,
      'Z',
    ].join(' ');

    const valuePath = [
      `M ${center} ${center}`,
      `L ${p1.x} ${p1.y}`,
      `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${pValue.x} ${pValue.y}`,
      'Z',
    ].join(' ');

    return { dim, startAngle, endAngle, sectorPath, valuePath, color: DIMENSION_COLORS[dim] };
  });

  return (
    <svg width={size} height={size}>
      <defs>
        <radialGradient id="wheelBg" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#2D2D44" />
          <stop offset="100%" stopColor="#1A1A2E" />
        </radialGradient>
      </defs>

      <circle cx={center} cy={center} r={radius + 4} fill="url(#wheelBg)" />

      {sectors.map((sector, i) => (
        <path
          key={`bg-${i}`}
          d={sector.sectorPath}
          fill={sector.color}
          fillOpacity="0.2"
          stroke="#4A4A6A"
          strokeWidth="1"
        />
      ))}

      {sectors.map((sector, i) => (
        <path
          key={`value-${i}`}
          d={sector.valuePath}
          fill={sector.color}
          fillOpacity="0.6"
        />
      ))}

      <circle cx={center} cy={center} r={radius * 0.2} fill="#1A1A2E" stroke="#4A4A6A" strokeWidth="1" />

      {dimensions.map((dim, i) => {
        const midAngle = (Math.PI * 2 * i) / 6 + Math.PI / 6 - Math.PI / 2;
        const p = getPoint(midAngle, radius * 0.55);
        return (
          <text
            key={`label-${i}`}
            x={p.x}
            y={p.y}
            fill="white"
            fontSize={size * 0.08}
            fontWeight="bold"
            textAnchor="middle"
            dominantBaseline="middle"
          >
            {DIMENSION_LABELS[dim]}
          </text>
        );
      })}
    </svg>
  );
};

export default WheelThumbnail;
