import { useState } from 'react';
import './DonutChart.css';

interface SliceData {
  label: string;
  value: number;
  color: string;
  id: string;
}

interface DonutChartProps {
  data: SliceData[];
  size?: number;
  thickness?: number;
  centerLabel: string;
  centerValue: string | number;
  onSliceClick?: (id: string) => void;
}

export default function DonutChart({
  data,
  size = 200,
  thickness = 32,
  centerLabel,
  centerValue,
  onSliceClick,
}: DonutChartProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const total = data.reduce((sum, d) => sum + d.value, 0);
  const radius = (size - thickness) / 2;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;

  let currentOffset = 0;

  const slices = data.map((item) => {
    const percent = total > 0 ? item.value / total : 0;
    const length = percent * circumference;
    const offset = currentOffset;
    currentOffset += length;

    return {
      ...item,
      percent,
      length,
      offset,
    };
  });

  return (
    <div className="donut-chart-container">
      <div
        className="donut-chart"
        style={{ width: size, height: size }}
      >
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="rgba(255, 255, 255, 0.06)"
            strokeWidth={thickness}
          />
          {slices.map((slice) => (
            <circle
              key={slice.id}
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke={slice.color}
              strokeWidth={thickness}
              strokeDasharray={`${slice.length} ${circumference - slice.length}`}
              strokeDashoffset={-slice.offset}
              strokeLinecap="butt"
              className={`donut-slice ${hoveredId === slice.id ? 'hovered' : ''}`}
              style={{
                transform: 'rotate(-90deg)',
                transformOrigin: 'center',
                cursor: onSliceClick ? 'pointer' : 'default',
                opacity: hoveredId && hoveredId !== slice.id ? 0.5 : 1,
                transition: 'opacity 0.2s ease',
              }}
              onMouseEnter={() => setHoveredId(slice.id)}
              onMouseLeave={() => setHoveredId(null)}
              onClick={() => onSliceClick?.(slice.id)}
            />
          ))}
        </svg>
        <div className="donut-center">
          <div className="donut-center-value">{centerValue}</div>
          <div className="donut-center-label">{centerLabel}</div>
        </div>
      </div>

      <div className="donut-legend">
        {data.map((item) => (
          <div
            key={item.id}
            className={`legend-item ${hoveredId === item.id ? 'active' : ''}`}
            onMouseEnter={() => setHoveredId(item.id)}
            onMouseLeave={() => setHoveredId(null)}
            onClick={() => onSliceClick?.(item.id)}
            style={{ cursor: onSliceClick ? 'pointer' : 'default' }}
          >
            <div className="legend-color" style={{ background: item.color }} />
            <span className="legend-label">{item.label}</span>
            <span className="legend-value">{item.value}分钟</span>
          </div>
        ))}
      </div>
    </div>
  );
}
