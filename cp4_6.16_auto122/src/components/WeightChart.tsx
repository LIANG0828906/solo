import './styles/WeightChart.css';

interface WeightChartProps {
  data: { date: number; weight: number }[];
  exerciseName: string;
}

export default function WeightChart({ data, exerciseName }: WeightChartProps) {
  const width = 300;
  const height = 120;
  const paddingLeft = 32;
  const paddingRight = 8;
  const paddingTop = 8;
  const paddingBottom = 20;
  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const sortedData = [...data].sort((a, b) => a.date - b.date);

  if (sortedData.length === 0) {
    return (
      <div className="weight-chart">
        <div className="weight-chart-title">{exerciseName}</div>
        <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
          <text
            x={width / 2}
            y={height / 2}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="rgba(255,255,255,0.5)"
            fontSize="12"
          >
            暂无数据
          </text>
        </svg>
      </div>
    );
  }

  const maxWeight = Math.max(...sortedData.map((d) => d.weight));
  const minWeight = Math.min(...sortedData.map((d) => d.weight));
  const weightRange = maxWeight - minWeight || 1;

  const minDate = sortedData[0].date;
  const maxDate = sortedData[sortedData.length - 1].date;
  const dateRange = maxDate - minDate || 1;

  const getX = (date: number) => {
    return paddingLeft + ((date - minDate) / dateRange) * chartWidth;
  };

  const getY = (weight: number) => {
    return paddingTop + chartHeight - ((weight - minWeight) / weightRange) * chartHeight;
  };

  const points = sortedData.map((d) => `${getX(d.date)},${getY(d.weight)}`).join(' ');

  const areaPath = `
    M ${getX(sortedData[0].date)},${paddingTop + chartHeight}
    L ${sortedData.map((d) => `${getX(d.date)},${getY(d.weight)}`).join(' L ')}
    L ${getX(sortedData[sortedData.length - 1].date)},${paddingTop + chartHeight}
    Z
  `;

  const yTicks = [0, 0.5, 1].map((ratio) => {
    const weight = minWeight + weightRange * (1 - ratio);
    const y = paddingTop + chartHeight * ratio;
    return { weight: Math.round(weight), y };
  });

  return (
    <div className="weight-chart">
      <div className="weight-chart-title">{exerciseName}</div>
      <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
        <defs>
          <linearGradient id="weightGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#BB86FC" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#BB86FC" stopOpacity="0.05" />
          </linearGradient>
        </defs>

        {yTicks.map((tick, i) => (
          <g key={i}>
            <line
              x1={paddingLeft}
              y1={tick.y}
              x2={width - paddingRight}
              y2={tick.y}
              stroke="rgba(255,255,255,0.1)"
              strokeDasharray="2,2"
            />
            <text
              x={paddingLeft - 6}
              y={tick.y + 4}
              textAnchor="end"
              fill="rgba(255,255,255,0.5)"
              fontSize="10"
            >
              {tick.weight}
            </text>
          </g>
        ))}

        <path d={areaPath} fill="url(#weightGradient)" />

        <polyline
          points={points}
          fill="none"
          stroke="#BB86FC"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {sortedData.map((d, i) => (
          <circle
            key={i}
            cx={getX(d.date)}
            cy={getY(d.weight)}
            r="3"
            fill="#BB86FC"
          />
        ))}
      </svg>
    </div>
  );
}
