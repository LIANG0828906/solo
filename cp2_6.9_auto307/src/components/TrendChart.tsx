import { useMemo } from 'react';
import { motion } from 'framer-motion';
import type { TrendData } from '../types';

interface TrendChartProps {
  data: TrendData[];
}

const TrendChart = ({ data }: TrendChartProps) => {
  const maxCount = useMemo(() => {
    return Math.max(...data.map((d) => d.count), 1);
  }, [data]);

  const chartHeight = 200;
  const chartWidth = 500;
  const padding = 40;
  const innerWidth = chartWidth - padding * 2;
  const innerHeight = chartHeight - padding * 2;

  const points = data.map((d, i) => {
    const x = padding + (i / (data.length - 1)) * innerWidth;
    const y = padding + innerHeight - (d.count / maxCount) * innerHeight;
    return { x, y, ...d };
  });

  const pathD = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
    .join(' ');

  const areaD = `${pathD} L ${points[points.length - 1].x} ${padding + innerHeight} L ${points[0].x} ${padding + innerHeight} Z`;

  return (
    <div className="bg-white/50 rounded-lg p-4 card-shadow">
      <h3 className="text-lg font-bold text-[#3e2723] mb-4 traditional-font">
        七日抓药趋势
      </h3>
      <svg width="100%" height={chartHeight} viewBox={`0 0 ${chartWidth} ${chartHeight}`}>
        <defs>
          <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#c9a96e" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#c9a96e" stopOpacity="0.05" />
          </linearGradient>
        </defs>

        {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => (
          <line
            key={i}
            x1={padding}
            y1={padding + innerHeight * ratio}
            x2={chartWidth - padding}
            y2={padding + innerHeight * ratio}
            stroke="#d7ccc8"
            strokeWidth="1"
            strokeDasharray="4,4"
          />
        ))}

        <motion.path
          d={areaD}
          fill="url(#areaGradient)"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
        />

        <motion.path
          d={pathD}
          fill="none"
          stroke="#8d6e63"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />

        {points.map((p, i) => (
          <g key={i}>
            <motion.circle
              cx={p.x}
              cy={p.y}
              r="6"
              fill="#c9a96e"
              stroke="#8d6e63"
              strokeWidth="2"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.8 + i * 0.1, type: 'spring' }}
            />
            <text
              x={p.x}
              y={padding + innerHeight + 25}
              textAnchor="middle"
              fill="#5d4037"
              fontSize="12"
            >
              {p.date}
            </text>
            <text
              x={p.x}
              y={p.y - 12}
              textAnchor="middle"
              fill="#8d6e63"
              fontSize="12"
              fontWeight="bold"
            >
              {p.count}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
};

export default TrendChart;
