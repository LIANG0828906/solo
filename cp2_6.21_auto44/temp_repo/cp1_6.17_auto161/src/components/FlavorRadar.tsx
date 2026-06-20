import React, { useRef, useCallback, useMemo } from 'react';
import { FlavorRating, FLAVOR_LABELS } from '../modules/brewing/BrewingService';

interface FlavorRadarProps {
  flavor: FlavorRating;
  onChange: (flavor: Partial<FlavorRating>) => void;
  size?: number;
  interactive?: boolean;
  showLabels?: boolean;
}

const FLAVOR_COLORS: { [key: string]: string } = {
  酸度: '#E74C3C',
  甜度: '#F39C12',
  苦度: '#6B4423',
  醇厚度: '#34495E',
  干净度: '#3498DB',
  余韵: '#9B59B6',
};

const FlavorRadar: React.FC<FlavorRadarProps> = ({
  flavor,
  onChange,
  size = 400,
  interactive = true,
  showLabels = true,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const centerX = size / 2;
  const centerY = size / 2;
  const radius = size * 0.35;

  const labels = useMemo(() => FLAVOR_LABELS, []);
  const dims = labels.length;

  const angleFor = useCallback((index: number) => {
    return -Math.PI / 2 + (index * 2 * Math.PI) / dims;
  }, [dims]);

  const pointFor = useCallback((index: number, value: number) => {
    const angle = angleFor(index);
    const r = radius * (value / 10);
    return {
      x: centerX + r * Math.cos(angle),
      y: centerY + r * Math.sin(angle),
    };
  }, [angleFor, centerX, centerY, radius]);

  const gridLines = useMemo(() => {
    const lines = [];
    for (let level = 2; level <= 10; level += 2) {
      const points = labels.map((_, i) => {
        const pt = pointFor(i, level);
        return `${pt.x},${pt.y}`;
      }).join(' ');
      lines.push(
        <polygon
          key={`grid-${level}`}
          points={points}
          fill="none"
          stroke="#D5B48C"
          strokeWidth="0.8"
          opacity={level === 10 ? 0.6 : 0.3}
        />
      );
    }
    return lines;
  }, [labels, pointFor]);

  const axisLines = useMemo(() => {
    return labels.map((_, i) => {
      const pt = pointFor(i, 10);
      return (
        <line
          key={`axis-${i}`}
          x1={centerX}
          y1={centerY}
          x2={pt.x}
          y2={pt.y}
          stroke="#D5B48C"
          strokeWidth="0.8"
          opacity="0.5"
        />
      );
    });
  }, [labels, pointFor, centerX, centerY]);

  const flavorPoints = useMemo(() => {
    return labels.map((_, i) => {
      const value = flavor[labels[i] as keyof FlavorRating] || 0;
      return pointFor(i, value);
    });
  }, [flavor, labels, pointFor]);

  const polygonPoints = flavorPoints.map(p => `${p.x},${p.y}`).join(' ');

  const labelPositions = useMemo(() => {
    return labels.map((label, i) => {
      const angle = angleFor(i);
      const labelR = radius + 45;
      const x = centerX + labelR * Math.cos(angle);
      const y = centerY + labelR * Math.sin(angle);
      return { label, x, y, color: FLAVOR_COLORS[label] || '#4A3728' };
    });
  }, [labels, angleFor, centerX, centerY, radius]);

  const handleDrag = useCallback((index: number) => (e: React.MouseEvent | React.TouchEvent) => {
    if (!interactive) return;
    e.preventDefault();
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const scaleX = size / rect.width;
    const scaleY = size / rect.height;

    const getPos = (evt: MouseEvent | TouchEvent) => {
      if ('touches' in evt && evt.touches.length > 0) {
        return {
          x: (evt.touches[0].clientX - rect.left) * scaleX,
          y: (evt.touches[0].clientY - rect.top) * scaleY,
        };
      }
      const mouseEvt = evt as MouseEvent;
      return {
        x: (mouseEvt.clientX - rect.left) * scaleX,
        y: (mouseEvt.clientY - rect.top) * scaleY,
      };
    };

    const calcValue = (pos: { x: number; y: number }) => {
      const dx = pos.x - centerX;
      const dy = pos.y - centerY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(dy, dx);
      const axisAngle = angleFor(index);
      const proj = dist * Math.cos(angle - axisAngle);
      const value = Math.round(Math.max(0, Math.min(10, (proj / radius) * 10)));
      return value;
    };

    const onMove = (evt: MouseEvent | TouchEvent) => {
      const pos = getPos(evt);
      const value = calcValue(pos);
      onChange({ [labels[index]]: value } as Partial<FlavorRating>);
    };

    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      document.removeEventListener('touchmove', onMove);
      document.removeEventListener('touchend', onUp);
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    document.addEventListener('touchmove', onMove, { passive: false });
    document.addEventListener('touchend', onUp);

    if ('touches' in e && e.touches.length > 0) {
      onMove(e as unknown as TouchEvent);
    } else {
      onMove(e as unknown as MouseEvent);
    }
  }, [interactive, size, centerX, centerY, radius, angleFor, labels, onChange]);

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${size} ${size}`}
      width="100%"
      height="100%"
      style={{ display: 'block', touchAction: 'none' }}
    >
      <circle cx={centerX} cy={centerY} r={radius * 0.4} fill="#F3EAD6" opacity="0.4" />
      {gridLines}
      {axisLines}
      <polygon
        points={polygonPoints}
        fill="#E67E22"
        fillOpacity="0.2"
        stroke="#E67E22"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {labels.map((label, i) => {
        const value = flavor[label as keyof FlavorRating] || 0;
        const color = FLAVOR_COLORS[label] || '#E67E22';
        const pt = flavorPoints[i];
        return (
          <g key={`point-${i}`}>
            <circle
              cx={pt.x}
              cy={pt.y}
              r={interactive ? 12 : 4}
              fill={interactive ? color : color}
              opacity={interactive ? 0.15 : 0.9}
            />
            <circle
              cx={pt.x}
              cy={pt.y}
              r={interactive ? 8 : 4}
              fill={color}
              stroke="#fff"
              strokeWidth={interactive ? 2 : 0}
              style={{ cursor: interactive ? 'grab' : 'default' }}
              onMouseDown={handleDrag(i)}
              onTouchStart={handleDrag(i)}
            />
            {interactive && value > 0 && (
              <text
                x={pt.x}
                y={pt.y - 18}
                textAnchor="middle"
                fill={color}
                fontSize="12"
                fontWeight="700"
                fontFamily="Noto Sans SC, sans-serif"
              >
                {value}
              </text>
            )}
          </g>
        );
      })}
      {showLabels && labelPositions.map(({ label, x, y, color }) => (
        <g key={`label-${label}`}>
          <circle cx={x} cy={y - 10} r="10" fill={color} opacity="0.1" />
          <text
            x={x}
            y={y - 6}
            textAnchor="middle"
            fill={color}
            fontSize="13"
            fontWeight="600"
            fontFamily="Noto Sans SC, sans-serif"
          >
            {label}
          </text>
        </g>
      ))}
    </svg>
  );
};

export default FlavorRadar;
