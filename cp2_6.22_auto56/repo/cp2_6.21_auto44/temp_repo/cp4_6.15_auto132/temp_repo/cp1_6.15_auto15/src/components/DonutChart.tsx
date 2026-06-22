import React, { useState } from 'react';
import type { HealthStatus } from '../types';
import './DonutChart.css';

interface SliceData {
  value: number;
  color: string;
  status: HealthStatus;
}

interface DonutChartProps {
  data: SliceData[];
  onSliceClick: (status: HealthStatus) => void;
  selectedStatus: HealthStatus | null;
}

const DonutChart: React.FC<DonutChartProps> = ({ data, onSliceClick, selectedStatus }) => {
  const [hoveredStatus, setHoveredStatus] = useState<HealthStatus | null>(null);
  
  const size = 200;
  const strokeWidth = 24;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  
  const total = data.reduce((sum, d) => sum + d.value, 0);
  let currentOffset = 0;
  
  const sortedData = [...data].sort((a, b) => {
    const order: HealthStatus[] = ['healthy', 'normal', 'attention'];
    return order.indexOf(a.status) - order.indexOf(b.status);
  });

  return (
    <svg width={size} height={size} className="donut-chart">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="rgba(76, 175, 80, 0.1)"
        strokeWidth={strokeWidth}
      />
      {sortedData.map((slice) => {
        if (total === 0) return null;
        const sliceLength = (slice.value / total) * circumference;
        const offset = currentOffset;
        currentOffset += sliceLength;
        
        const isSelected = selectedStatus === slice.status;
        const isHovered = hoveredStatus === slice.status;
        
        return (
          <circle
            key={slice.status}
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={slice.color}
            strokeWidth={strokeWidth}
            strokeDasharray={`${sliceLength} ${circumference - sliceLength}`}
            strokeDashoffset={-offset}
            className={`donut-slice ${isSelected ? 'selected' : ''} ${isHovered ? 'hovered' : ''}`}
            style={{
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              transformOrigin: `${size / 2}px ${size / 2}px`,
              transform: isHovered || isSelected ? 'scale(1.05)' : 'scale(1)',
              filter: isHovered || isSelected ? 'brightness(1.1)' : 'none'
            }}
            onClick={() => onSliceClick(slice.status)}
            onMouseEnter={() => setHoveredStatus(slice.status)}
            onMouseLeave={() => setHoveredStatus(null)}
          />
        );
      })}
    </svg>
  );
};

export default DonutChart;
