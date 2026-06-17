import React, { useMemo } from 'react';
import { PlanetData, PLANET_COLORS, ZODIAC_COLORS } from '../types';

interface ChartMiniProps {
  planets?: PlanetData[];
  width?: number;
  height?: number;
}

const ChartMini: React.FC<ChartMiniProps> = ({ planets = [], width = 280, height = 280 }) => {
  const centerX = width / 2;
  const centerY = height / 2;
  const outerRadius = Math.min(width, height) / 2 - 20;
  const innerRadius = outerRadius * 0.65;
  const planetRadius = outerRadius * 0.5;

  const zodiacSegments = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const startAngle = (i * 30 - 90) * Math.PI / 180;
      const endAngle = ((i + 1) * 30 - 90) * Math.PI / 180;
      const signs = ['白羊座', '金牛座', '双子座', '巨蟹座', '狮子座', '处女座', '天秤座', '天蝎座', '射手座', '摩羯座', '水瓶座', '双鱼座'];
      
      const x1 = centerX + outerRadius * Math.cos(startAngle);
      const y1 = centerY + outerRadius * Math.sin(startAngle);
      const x2 = centerX + outerRadius * Math.cos(endAngle);
      const y2 = centerY + outerRadius * Math.sin(endAngle);
      const x3 = centerX + innerRadius * Math.cos(endAngle);
      const y3 = centerY + innerRadius * Math.sin(endAngle);
      const x4 = centerX + innerRadius * Math.cos(startAngle);
      const y4 = centerY + innerRadius * Math.sin(startAngle);
      
      const largeArc = 30 > 180 ? 1 : 0;
      
      const pathData = `M ${x1} ${y1} A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${x2} ${y2} L ${x3} ${y3} A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${x4} ${y4} Z`;
      
      return {
        d: pathData,
        color: ZODIAC_COLORS[signs[i]],
        sign: signs[i],
      };
    });
  }, [centerX, centerY, outerRadius, innerRadius]);

  const planetPositions = useMemo(() => {
    return planets.map(planet => {
      const angle = (planet.longitude - 90) * Math.PI / 180;
      return {
        x: centerX + planetRadius * Math.cos(angle),
        y: centerY + planetRadius * Math.sin(angle),
        color: PLANET_COLORS[planet.name] || '#ffffff',
        name: planet.name,
      };
    });
  }, [planets, centerX, centerY, planetRadius]);

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <defs>
        <radialGradient id="miniBg" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#1a1a3e" />
          <stop offset="100%" stopColor="#0a0a1a" />
        </radialGradient>
      </defs>
      
      <circle cx={centerX} cy={centerY} r={outerRadius + 10} fill="url(#miniBg)" />
      
      {zodiacSegments.map((seg, i) => (
        <path
          key={i}
          d={seg.d}
          fill={seg.color}
          fillOpacity={0.4}
          stroke={seg.color}
          strokeWidth={1}
          strokeOpacity={0.6}
        />
      ))}
      
      <circle cx={centerX} cy={centerY} r={innerRadius - 5} fill="rgba(0,0,0,0.5)" />
      <circle cx={centerX} cy={centerY} r={innerRadius - 5} fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth={1} />
      
      {planetPositions.map((planet, i) => (
        <g key={i}>
          <circle
            cx={planet.x}
            cy={planet.y}
            r={5}
            fill={planet.color}
            style={{ filter: `drop-shadow(0 0 4px ${planet.color})` }}
          />
        </g>
      ))}
    </svg>
  );
};

export default ChartMini;
