import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import './RoastCurveChart.css';

export interface RoastPoint {
  time: number;
  temperature: number;
}

interface RoastCurveChartProps {
  data: RoastPoint[];
  width?: number;
  height?: number;
  interactive?: boolean;
}

const RoastCurveChart: React.FC<RoastCurveChartProps> = ({
  data,
  width = 600,
  height = 300,
  interactive = true,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; time: number; temp: number } | null>(null);

  useEffect(() => {
    if (!svgRef.current || data.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const margin = { top: 20, right: 30, bottom: 40, left: 50 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

    const xScale = d3
      .scaleLinear()
      .domain([0, 20])
      .range([0, innerWidth]);

    const yScale = d3
      .scaleLinear()
      .domain([100, 240])
      .range([innerHeight, 0]);

    const xAxis = d3
      .axisBottom(xScale)
      .ticks(10)
      .tickFormat(d => `${d}分`);

    const yAxis = d3
      .axisLeft(yScale)
      .ticks(8)
      .tickFormat(d => `${d}℃`);

    g.append('g')
      .attr('transform', `translate(0, ${innerHeight})`)
      .attr('class', 'x-axis')
      .call(xAxis);

    g.append('g')
      .attr('class', 'y-axis')
      .call(yAxis);

    g.append('g')
      .attr('class', 'grid')
      .selectAll('line')
      .data(yScale.ticks(8))
      .join('line')
      .attr('x1', 0)
      .attr('x2', innerWidth)
      .attr('y1', d => yScale(d))
      .attr('y2', d => yScale(d))
      .attr('stroke', '#E8E0D8')
      .attr('stroke-dasharray', '3,3');

    const line = d3
      .line<RoastPoint>()
      .x(d => xScale(d.time))
      .y(d => yScale(d.temperature))
      .curve(d3.curveMonotoneX);

    const gradient = svg
      .append('defs')
      .append('linearGradient')
      .attr('id', 'lineGradient')
      .attr('gradientUnits', 'userSpaceOnUse')
      .attr('x1', 0)
      .attr('y1', yScale(100))
      .attr('x2', 0)
      .attr('y2', yScale(240));

    gradient.append('stop').attr('offset', '0%').attr('stop-color', '#F5DEB3');
    gradient.append('stop').attr('offset', '50%').attr('stop-color', '#D0874C');
    gradient.append('stop').attr('offset', '100%').attr('stop-color', '#8B5E3C');

    const path = g
      .append('path')
      .datum(data)
      .attr('class', 'roast-line')
      .attr('fill', 'none')
      .attr('stroke', '#D0874C')
      .attr('stroke-width', 2.5)
      .attr('d', line);

    const totalLength = path.node()?.getTotalLength() || 0;
    path
      .attr('stroke-dasharray', `${totalLength} ${totalLength}`)
      .attr('stroke-dashoffset', totalLength)
      .transition()
      .duration(800)
      .ease(d3.easeCubicOut)
      .attr('stroke-dashoffset', 0);

    const points = g
      .selectAll('.data-point')
      .data(data)
      .join('circle')
      .attr('class', 'data-point')
      .attr('cx', d => xScale(d.time))
      .attr('cy', d => yScale(d.temperature))
      .attr('r', 0)
      .attr('fill', '#FFFFFF')
      .attr('stroke', '#D0874C')
      .attr('stroke-width', 2.5)
      .style('cursor', interactive ? 'pointer' : 'default');

    points
      .transition()
      .delay((d, i) => 600 + i * 50)
      .duration(300)
      .attr('r', 5);

    if (interactive) {
      points
        .on('mouseenter', function(event, d) {
          d3.select(this)
            .transition()
            .duration(150)
            .attr('r', 7);

          const [x, y] = d3.pointer(event, svg.node() as SVGElement);
          setTooltip({
            x: x + 15,
            y: y - 10,
            time: d.time,
            temp: d.temperature,
          });
        })
        .on('mouseleave', function() {
          d3.select(this)
            .transition()
            .duration(150)
            .attr('r', 5);
          setTooltip(null);
        });
    }
  }, [data, width, height, interactive]);

  return (
    <div className="roast-curve-chart">
      <svg ref={svgRef} width={width} height={height} />
      {tooltip && (
        <div
          ref={tooltipRef}
          className="chart-tooltip"
          style={{ left: tooltip.x, top: tooltip.y }}
        >
          <div className="tooltip-time">时间: {tooltip.time.toFixed(1)} 分钟</div>
          <div className="tooltip-temp">温度: {tooltip.temp}℃</div>
        </div>
      )}
    </div>
  );
};

export default RoastCurveChart;
