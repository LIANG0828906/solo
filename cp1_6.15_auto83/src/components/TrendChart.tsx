import { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface TrendChartProps {
  data: { index: number; ev: number }[];
  width?: number;
  height?: number;
}

export default function TrendChart({ data, width = 150, height = 50 }: TrendChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const gradientIdRef = useRef(`trend-gradient-${Math.random().toString(36).slice(2, 11)}`);

  useEffect(() => {
    if (!svgRef.current || data.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const margin = { top: 5, right: 5, bottom: 15, left: 28 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

    const xScale = d3.scaleLinear()
      .domain([d3.min(data, d => d.index) || 0, d3.max(data, d => d.index) || 0])
      .range([0, innerWidth]);

    const evValues = data.map(d => d.ev);
    const yMin = Math.min(...evValues) - 1;
    const yMax = Math.max(...evValues) + 1;
    const yScale = d3.scaleLinear()
      .domain([yMin, yMax])
      .range([innerHeight, 0]);

    const line = d3.line<{ index: number; ev: number }>()
      .x(d => xScale(d.index))
      .y(d => yScale(d.ev))
      .curve(d3.curveMonotoneY);

    const gradientId = gradientIdRef.current;
    const gradient = svg.append('defs')
      .append('linearGradient')
      .attr('id', gradientId)
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%');

    gradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', '#ff8c42')
      .attr('stop-opacity', 0.85);

    gradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#ff8c42')
      .attr('stop-opacity', 0.08);

    const area = d3.area<{ index: number; ev: number }>()
      .x(d => xScale(d.index))
      .y0(innerHeight)
      .y1(d => yScale(d.ev))
      .curve(d3.curveMonotoneY);

    g.append('path')
      .datum(data)
      .attr('fill', `url(#${gradientId})`)
      .attr('d', area);

    g.append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', '#ff8c42')
      .attr('stroke-width', 1.8)
      .attr('stroke-linejoin', 'round')
      .attr('stroke-linecap', 'round')
      .attr('d', line);

    if (data.length > 0) {
      const lastPoint = data[data.length - 1];
      g.append('circle')
        .attr('cx', xScale(lastPoint.index))
        .attr('cy', yScale(lastPoint.ev))
        .attr('r', 4)
        .attr('fill', '#ff8c42')
        .attr('stroke', '#ffffff')
        .attr('stroke-width', 1.5);
    }

    g.append('text')
      .attr('x', -margin.left + 3)
      .attr('y', innerHeight / 2)
      .attr('text-anchor', 'start')
      .attr('dominant-baseline', 'middle')
      .attr('font-size', '10px')
      .attr('font-weight', '600')
      .attr('fill', '#555')
      .attr('letter-spacing', '0.5px')
      .text('EV');

    const yTicks = yScale.ticks(3);
    g.selectAll('.y-tick')
      .data(yTicks)
      .enter()
      .append('text')
      .attr('class', 'y-tick')
      .attr('x', -4)
      .attr('y', d => yScale(d))
      .attr('text-anchor', 'end')
      .attr('dominant-baseline', 'middle')
      .attr('font-size', '9px')
      .attr('fill', '#666')
      .text(d => d.toFixed(0));

  }, [data, width, height]);

  return (
    <svg
      ref={svgRef}
      width={width}
      height={height}
      style={{ display: 'block' }}
    />
  );
}
