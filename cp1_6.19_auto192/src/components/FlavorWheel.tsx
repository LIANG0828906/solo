import { useMemo } from 'react';
import { flavorCategories } from '../types';
import type { CoffeeBean } from '../types';

interface FlavorWheelProps {
  bean: CoffeeBean;
  size?: number;
}

export const FlavorWheel = ({ bean, size = 120 }: FlavorWheelProps) => {
  const center = size / 2;
  const radius = size / 2 - 10;

  const activeCategories = useMemo(() => {
    return flavorCategories.filter((cat) =>
      bean.flavorTags.some((tag) => cat.tags.includes(tag))
    );
  }, [bean.flavorTags]);

  const drawSegment = (startAngle: number, endAngle: number, color: string, isActive: boolean) => {
    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;

    const x1 = center + radius * Math.cos(startRad);
    const y1 = center + radius * Math.sin(startRad);
    const x2 = center + radius * Math.cos(endRad);
    const y2 = center + radius * Math.sin(endRad);

    const largeArc = endAngle - startAngle > 180 ? 1 : 0;

    return `M ${center} ${center} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;
  };

  const segmentAngle = 360 / flavorCategories.length;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {flavorCategories.map((cat, index) => {
        const startAngle = index * segmentAngle - 90;
        const endAngle = startAngle + segmentAngle;
        const isActive = activeCategories.some((ac) => ac.name === cat.name);

        return (
          <path
            key={cat.name}
            d={drawSegment(startAngle, endAngle, cat.color, isActive)}
            fill={isActive ? cat.color : '#F5F5F5'}
            stroke="#E0D5C7"
            strokeWidth="1"
            opacity={isActive ? 0.9 : 0.4}
            style={{ transition: 'opacity 0.3s ease' }}
          />
        );
      })}

      <circle cx={center} cy={center} r={radius * 0.4} fill="#FFFFFF" stroke="#E0D5C7" strokeWidth="1" />

      <text
        x={center}
        y={center - 4}
        textAnchor="middle"
        fontSize="10"
        fill="#4E342E"
        fontWeight="600"
      >
        风味
      </text>
      <text
        x={center}
        y={center + 10}
        textAnchor="middle"
        fontSize="9"
        fill="#795548"
      >
        {activeCategories.length}类
      </text>

      {flavorCategories.map((cat, index) => {
        const midAngle = (index * segmentAngle + segmentAngle / 2 - 90) * (Math.PI / 180);
        const labelRadius = radius * 0.75;
        const x = center + labelRadius * Math.cos(midAngle);
        const y = center + labelRadius * Math.sin(midAngle);
        const isActive = activeCategories.some((ac) => ac.name === cat.name);

        return (
          <text
            key={`label-${cat.name}`}
            x={x}
            y={y}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="9"
            fill={isActive ? '#FFFFFF' : '#9E9E9E'}
            fontWeight={isActive ? '600' : '400'}
            style={{ pointerEvents: 'none' }}
          >
            {cat.name}
          </text>
        );
      })}
    </svg>
  );
};
