import React from 'react';

interface GaugeChartProps {
  value: number;
  label: string;
  size?: number;
}

export const GaugeChart: React.FC<GaugeChartProps> = ({ value, label, size = 70 }) => {
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;
  
  const gradientId = `gauge-gradient-${label}-${value}`;
  
  return (
    <div className="gauge-chart" style={{ width: size, height: size / 2 + 20, textAlign: 'center' }}>
      <svg width={size} height={size / 2 + 6} viewBox={`0 0 ${size} ${size / 2 + 6}`}>
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ff5252" />
            <stop offset="50%" stopColor="#ffd740" />
            <stop offset="100%" stopColor="#69f0ae" />
          </linearGradient>
        </defs>
        <path
          d={`M ${strokeWidth / 2} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${size / 2}`}
          fill="none"
          stroke="#e0e0e0"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        <path
          d={`M ${strokeWidth / 2} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${size / 2}`}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.6s ease-out' }}
        />
      </svg>
      <div className="gauge-value" style={{ fontSize: 12, fontWeight: 700, color: '#1a237e', marginTop: -2 }}>
        {value}
      </div>
      <div className="gauge-label" style={{ fontSize: 10, color: '#888', marginTop: 0 }}>
        {label}
      </div>
    </div>
  );
};
