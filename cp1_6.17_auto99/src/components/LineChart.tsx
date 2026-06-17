import './LineChart.css';

interface LineChartProps {
  data: { id: number; value: number }[];
  width?: number;
  height?: number;
  color?: string;
  yMax?: number;
  yMin?: number;
}

export default function LineChart({
  data,
  width = 280,
  height = 120,
  color = '#FF6B6B',
  yMax = 100,
  yMin = 0,
}: LineChartProps) {
  const padding = { top: 10, right: 10, bottom: 20, left: 30 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  if (data.length === 0) {
    return (
      <div className="line-chart-empty">
        暂无数据
      </div>
    );
  }

  const points = data.map((item, index) => {
    const x = padding.left + (data.length === 1 ? chartWidth / 2 : (index / (data.length - 1)) * chartWidth);
    const y = padding.top + chartHeight - ((item.value - yMin) / (yMax - yMin)) * chartHeight;
    return { x, y };
  });

  const pathD = points
    .map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`))
    .join(' ');

  const yTicks = [0, 25, 50, 75, 100];

  return (
    <svg width={width} height={height} className="line-chart">
      {yTicks.map((tick) => {
        const y = padding.top + chartHeight - ((tick - yMin) / (yMax - yMin)) * chartHeight;
        return (
          <g key={tick}>
            <line
              x1={padding.left}
              y1={y}
              x2={width - padding.right}
              y2={y}
              stroke="#E0E0E0"
              strokeWidth="1"
              strokeDasharray="2,2"
            />
            <text
              x={padding.left - 5}
              y={y + 3}
              textAnchor="end"
              fontSize="10"
              fill="#999"
            >
              {tick}%
            </text>
          </g>
        );
      })}

      <path
        d={pathD}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {points.map((p, i) => (
        <circle
          key={i}
          cx={p.x}
          cy={p.y}
          r="3"
          fill={color}
        />
      ))}

      {data.map((item, i) => (
        <text
          key={item.id}
          x={points[i].x}
          y={height - 5}
          textAnchor="middle"
          fontSize="10"
          fill="#999"
        >
          {i + 1}
        </text>
      ))}
    </svg>
  );
}
