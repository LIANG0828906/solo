import React, { useState, useRef, useEffect } from 'react';
import { twMerge } from 'tailwind-merge';

interface ChartDataPoint {
  date: string;
  value: number;
  label?: string;
}

interface LineChartProps {
  data: ChartDataPoint[];
  height?: number;
  className?: string;
  showArea?: boolean;
  showDots?: boolean;
}

export const LineChart: React.FC<LineChartProps> = ({
  data,
  height = 280,
  className = '',
  showArea = true,
  showDots = true,
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [dimensions, setDimensions] = useState({ width: 600, height });

  useEffect(() => {
    const updateDimensions = () => {
      if (svgRef.current) {
        const rect = svgRef.current.getBoundingClientRect();
        setDimensions({ width: rect.width, height });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, [height]);

  const padding = { top: 20, right: 20, bottom: 40, left: 50 };
  const chartWidth = dimensions.width - padding.left - padding.right;
  const chartHeight = dimensions.height - padding.top - padding.bottom;

  const maxValue = Math.max(...data.map((d) => d.value), 1);
  const minValue = 0;

  const xStep = data.length > 1 ? chartWidth / (data.length - 1) : chartWidth;

  const getX = (index: number) => padding.left + index * xStep;
  const getY = (value: number) =>
    padding.top + chartHeight - ((value - minValue) / (maxValue - minValue)) * chartHeight;

  const pathData = data
    .map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(d.value)}`)
    .join(' ');

  const areaPath = `${pathData} L ${getX(data.length - 1)} ${padding.top + chartHeight} L ${getX(0)} ${padding.top + chartHeight} Z`;

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - padding.left;
    const index = Math.round(x / xStep);
    if (index >= 0 && index < data.length) {
      setHoveredIndex(index);
    }
  };

  const handleMouseLeave = () => {
    setHoveredIndex(null);
  };

  const yTicks = 5;
  const yLabels = Array.from({ length: yTicks + 1 }, (_, i) => {
    const value = Math.round((maxValue / yTicks) * i);
    return { value, y: getY(value) };
  });

  return (
    <div className={twMerge('w-full relative', className)}>
      <svg
        ref={svgRef}
        width="100%"
        height={dimensions.height}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="cursor-crosshair"
      >
        <defs>
          <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#D98A4A" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#D98A4A" stopOpacity="0.02" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {yLabels.map((tick, i) => (
          <g key={i}>
            <line
              x1={padding.left}
              y1={tick.y}
              x2={padding.left + chartWidth}
              y2={tick.y}
              stroke="#E8DFD6"
              strokeDasharray="4 4"
            />
            <text
              x={padding.left - 10}
              y={tick.y + 4}
              textAnchor="end"
              fill="#9A8C7E"
              fontSize="11"
            >
              {tick.value}
            </text>
          </g>
        ))}

        {showArea && (
          <path
            d={areaPath}
            fill="url(#areaGradient)"
            className="transition-all duration-normal"
          />
        )}

        <path
          d={pathData}
          fill="none"
          stroke="#D98A4A"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter="url(#glow)"
          className="transition-all duration-normal"
        />

        {showDots &&
          data.map((d, i) => (
            <circle
              key={i}
              cx={getX(i)}
              cy={getY(d.value)}
              r={hoveredIndex === i ? 6 : 4}
              fill="white"
              stroke="#D98A4A"
              strokeWidth="2"
              className="transition-all duration-fast"
            />
          ))}

        {data.map((d, i) => {
          if (i % Math.ceil(data.length / 6) !== 0 && i !== data.length - 1) return null;
          return (
            <text
              key={i}
              x={getX(i)}
              y={dimensions.height - 15}
              textAnchor="middle"
              fill="#9A8C7E"
              fontSize="11"
            >
              {d.label || d.date}
            </text>
          );
        })}

        {hoveredIndex !== null && (
          <g>
            <line
              x1={getX(hoveredIndex)}
              y1={padding.top}
              x2={getX(hoveredIndex)}
              y2={padding.top + chartHeight}
              stroke="#D98A4A"
              strokeDasharray="4 4"
              strokeWidth="1"
            />
          </g>
        )}
      </svg>

      {hoveredIndex !== null && data[hoveredIndex] && (
        <div
          className="absolute pointer-events-none bg-white shadow-card rounded-lg px-3 py-2 border border-border-color z-10 animate-fade-in"
          style={{
            left: `${(getX(hoveredIndex) / dimensions.width) * 100}%`,
            top: '20px',
            transform: 'translateX(-50%)',
          }}
        >
          <div className="text-xs text-text-muted">{data[hoveredIndex].date}</div>
          <div className="text-sm font-semibold text-accent">
            {data[hoveredIndex].value} 分钟
          </div>
        </div>
      )}
    </div>
  );
};

export default LineChart;
