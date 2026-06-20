import React, { useMemo } from 'react';
import type { ChartData } from '../types';

interface ChartComponentProps {
  chartData: ChartData;
  width: number;
  height: number;
  colors: string[];
}

export const ChartComponent: React.FC<ChartComponentProps> = ({ chartData, width, height, colors }) => {
  const { type, series, title } = chartData;

  const chart = useMemo(() => {
    if (type === 'bar') {
      return renderBarChart(series, title, width, height, colors);
    } else if (type === 'line') {
      return renderLineChart(series, title, width, height, colors);
    } else if (type === 'pie') {
      return renderPieChart(series, title, width, height, colors);
    }
    return null;
  }, [type, series, title, width, height, colors]);

  return <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{chart}</div>;
};

function renderBarChart(
  series: { name: string; value: number }[],
  title: string,
  width: number,
  height: number,
  colors: string[]
) {
  if (!series.length) return null;
  
  const padding = { top: 30, right: 20, bottom: 40, left: 50 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const maxValue = Math.max(...series.map((s) => s.value));
  const barWidth = (chartWidth / series.length) * 0.6;
  const gap = (chartWidth / series.length) * 0.4 / (series.length + 1);

  return (
    <svg width={width} height={height}>
      <text
        x={width / 2}
        y={padding.top - 10}
        textAnchor="middle"
        fontSize="14"
        fontWeight="bold"
        fill="#333"
      >
        {title}
      </text>
      {series.map((item, i) => {
        const barHeight = (item.value / maxValue) * chartHeight;
        const x = padding.left + gap + i * (barWidth + gap);
        const y = padding.top + chartHeight - barHeight;
        return (
          <g key={i}>
            <rect
              x={x}
              y={y}
              width={barWidth}
              height={barHeight}
              fill={colors[i % colors.length]}
              rx="4"
            />
            <text
              x={x + barWidth / 2}
              y={y - 5}
              textAnchor="middle"
              fontSize="12"
              fill="#333"
            >
              {item.value}
            </text>
            <text
              x={x + barWidth / 2}
              y={height - 15}
              textAnchor="middle"
              fontSize="11"
              fill="#666"
            >
              {item.name}
            </text>
          </g>
        );
      })}
      <line
        x1={padding.left}
        y1={padding.top + chartHeight}
        x2={width - padding.right}
        y2={padding.top + chartHeight}
        stroke="#ccc"
      />
    </svg>
  );
}

function renderLineChart(
  series: { name: string; value: number }[],
  title: string,
  width: number,
  height: number,
  colors: string[]
) {
  if (!series.length) return null;
  
  const padding = { top: 30, right: 20, bottom: 40, left: 50 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const maxValue = Math.max(...series.map((s) => s.value));
  const stepX = chartWidth / (series.length - 1 || 1);

  const points = series.map((item, i) => ({
    x: padding.left + i * stepX,
    y: padding.top + chartHeight - (item.value / maxValue) * chartHeight,
  }));

  const pathD = points.map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`)).join(' ');

  return (
    <svg width={width} height={height}>
      <text
        x={width / 2}
        y={padding.top - 10}
        textAnchor="middle"
        fontSize="14"
        fontWeight="bold"
        fill="#333"
      >
        {title}
      </text>
      <path
        d={pathD}
        fill="none"
        stroke={colors[0]}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {points.map((p, i) => (
        <g key={i}>
          <circle
            cx={p.x}
            cy={p.y}
            r="6"
            fill={colors[i % colors.length]}
            stroke="white"
            strokeWidth="2"
          />
          <text
            x={p.x}
            y={p.y - 12}
            textAnchor="middle"
            fontSize="12"
            fill="#333"
          >
            {series[i].value}
          </text>
          <text
            x={p.x}
            y={height - 15}
            textAnchor="middle"
            fontSize="11"
            fill="#666"
          >
            {series[i].name}
          </text>
        </g>
      ))}
      <line
        x1={padding.left}
        y1={padding.top + chartHeight}
        x2={width - padding.right}
        y2={padding.top + chartHeight}
        stroke="#ccc"
      />
    </svg>
  );
}

function renderPieChart(
  series: { name: string; value: number }[],
  title: string,
  width: number,
  height: number,
  colors: string[]
) {
  if (!series.length) return null;

  const padding = { top: 30, right: 20, bottom: 20, left: 20 };
  const centerX = width / 2;
  const centerY = padding.top + (height - padding.top - padding.bottom) / 2;
  const radius = Math.min(width - padding.left - padding.right, height - padding.top - padding.bottom) / 2 - 30;

  const total = series.reduce((sum, s) => sum + s.value, 0);
  let startAngle = -Math.PI / 2;

  return (
    <svg width={width} height={height}>
      <text
        x={width / 2}
        y={padding.top - 10}
        textAnchor="middle"
        fontSize="14"
        fontWeight="bold"
        fill="#333"
      >
        {title}
      </text>
      {series.map((item, i) => {
        const angle = (item.value / total) * Math.PI * 2;
        const endAngle = startAngle + angle;

        const x1 = centerX + radius * Math.cos(startAngle);
        const y1 = centerY + radius * Math.sin(startAngle);
        const x2 = centerX + radius * Math.cos(endAngle);
        const y2 = centerY + radius * Math.sin(endAngle);

        const largeArcFlag = angle > Math.PI ? 1 : 0;

        const pathData = [
          `M ${centerX} ${centerY}`,
          `L ${x1} ${y1}`,
          `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
          'Z',
        ].join(' ');

        const midAngle = startAngle + angle / 2;
        const labelX = centerX + radius * 0.65 * Math.cos(midAngle);
        const labelY = centerY + radius * 0.65 * Math.sin(midAngle);

        startAngle = endAngle;

        return (
          <g key={i}>
            <path
              d={pathData}
              fill={colors[i % colors.length]}
              stroke="white"
              strokeWidth="2"
            />
            <text
              x={labelX}
              y={labelY}
              textAnchor="middle"
              fontSize="11"
              fill="white"
              fontWeight="bold"
            >
              {(item.value / total * 100).toFixed(1)}%
            </text>
          </g>
        );
      })}
    </svg>
  );
}
