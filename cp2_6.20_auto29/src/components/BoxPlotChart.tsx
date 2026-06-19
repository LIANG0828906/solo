import React, { useEffect, useRef } from 'react';
import * as d3Scale from 'd3-scale';
import { RankingItem } from '../types';

interface Props {
  rankings: RankingItem[];
}

const BoxPlotChart: React.FC<Props> = ({ rankings }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const margin = { top: 30, right: 30, bottom: 60, left: 50 };
  const innerWidth = 720;
  const innerHeight = 230;
  const svgWidth = innerWidth + margin.left + margin.right;
  const svgHeight = innerHeight + margin.top + margin.bottom;

  const xScale = d3Scale
    .scaleBand()
    .domain(rankings.map((r) => r.name))
    .range([0, innerWidth])
    .padding(0.3);

  const yScale = d3Scale
    .scaleLinear()
    .domain([0, 10])
    .range([innerHeight, 0]);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.style.width = '100%';
    }
  }, []);

  const bandWidth = xScale.bandwidth();
  const yTicks = [0, 2, 4, 6, 8, 10];

  return (
    <div
      ref={containerRef}
      style={{
        background: 'white',
        borderRadius: '12px',
        padding: '24px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
      }}
    >
      <div
        style={{
          fontSize: '18px',
          fontWeight: 600,
          color: '#1a365d',
          marginBottom: '16px',
        }}
      >
        分数分布箱线图
      </div>
      <svg
        width="100%"
        height={320}
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        preserveAspectRatio="xMidYMid meet"
      >
        <g transform={`translate(${margin.left}, ${margin.top})`}>
          {yTicks.map((tick) => (
            <g key={`ytick-${tick}`}>
              <line
                x1={0}
                y1={yScale(tick)}
                x2={innerWidth}
                y2={yScale(tick)}
                stroke="#e2e8f0"
                strokeDasharray="3 3"
              />
              <line
                x1={-5}
                y1={yScale(tick)}
                x2={0}
                y2={yScale(tick)}
                stroke="#4a5568"
              />
              <text
                x={-10}
                y={yScale(tick)}
                dy="0.32em"
                textAnchor="end"
                fontSize={11}
                fill="#4a5568"
              >
                {tick}
              </text>
            </g>
          ))}

          {rankings.map((item) => {
            const x = xScale(item.name) ?? 0;
            const { min, max, median, q1, q3 } = item.distribution;
            const xCenter = x + bandWidth / 2;

            const yMin = yScale(min);
            const yMax = yScale(max);
            const yMedian = yScale(median);
            const yQ1 = yScale(q1);
            const yQ3 = yScale(q3);

            return (
              <g key={item.optionId}>
                <title>
                  {`${item.name}\nmin: ${min}\nQ1: ${q1}\nmedian: ${median}\nQ3: ${q3}\nmax: ${max}`}
                </title>

                <line
                  x1={xCenter}
                  y1={yMin}
                  x2={xCenter}
                  y2={yQ1}
                  stroke="#a0aec0"
                  strokeWidth={1}
                />
                <line
                  x1={xCenter}
                  y1={yQ3}
                  x2={xCenter}
                  y2={yMax}
                  stroke="#a0aec0"
                  strokeWidth={1}
                />

                <line
                  x1={xCenter - bandWidth / 4}
                  y1={yMin}
                  x2={xCenter + bandWidth / 4}
                  y2={yMin}
                  stroke="#4a5568"
                  strokeWidth={1.5}
                />
                <line
                  x1={xCenter - bandWidth / 4}
                  y1={yMax}
                  x2={xCenter + bandWidth / 4}
                  y2={yMax}
                  stroke="#4a5568"
                  strokeWidth={1.5}
                />

                <rect
                  x={x}
                  y={yQ3}
                  width={bandWidth}
                  height={yQ1 - yQ3}
                  fill="rgba(49,130,206,0.3)"
                  stroke="#3182ce"
                  strokeWidth={1.5}
                  style={{ transition: 'all 500ms' }}
                />

                <line
                  x1={x}
                  y1={yMedian}
                  x2={x + bandWidth}
                  y2={yMedian}
                  stroke="#2b6cb0"
                  strokeWidth={2}
                />

                <text
                  x={xCenter}
                  y={innerHeight + 40}
                  textAnchor="end"
                  fontSize={11}
                  fill="#4a5568"
                  transform={`rotate(-30, ${xCenter}, ${innerHeight + 40})`}
                >
                  {item.name}
                </text>
              </g>
            );
          })}

          <line
            x1={0}
            y1={innerHeight}
            x2={innerWidth}
            y2={innerHeight}
            stroke="#4a5568"
            strokeWidth={1}
          />
          <line
            x1={0}
            y1={0}
            x2={0}
            y2={innerHeight}
            stroke="#4a5568"
            strokeWidth={1}
          />
        </g>
      </svg>
    </div>
  );
};

export default BoxPlotChart;
