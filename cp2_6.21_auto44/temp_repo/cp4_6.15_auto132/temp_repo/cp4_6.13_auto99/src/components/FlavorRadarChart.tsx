import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import './FlavorRadarChart.css';

export interface FlavorProfile {
  acidity: number;
  sweetness: number;
  bitterness: number;
  body: number;
  aftertaste: number;
}

interface FlavorRadarChartProps {
  data: FlavorProfile;
  size?: number;
}

const FlavorRadarChart: React.FC<FlavorRadarChartProps> = ({ data, size = 280 }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size / 2 - 40;

    const axes = [
      { key: 'acidity', label: '酸度' },
      { key: 'sweetness', label: '甜度' },
      { key: 'bitterness', label: '苦度' },
      { key: 'body', label: '醇厚度' },
      { key: 'aftertaste', label: '余韵' },
    ];

    const levels = 5;
    const angleSlice = (Math.PI * 2) / axes.length;

    const g = svg.append('g').attr('transform', `translate(${centerX}, ${centerY})`);

    for (let i = 1; i <= levels; i++) {
      const r = (radius * i) / levels;
      const points: string[] = [];

      for (let j = 0; j < axes.length; j++) {
        const angle = j * angleSlice - Math.PI / 2;
        const x = r * Math.cos(angle);
        const y = r * Math.sin(angle);
        points.push(`${x},${y}`);
      }

      g.append('polygon')
        .attr('points', points.join(' '))
        .attr('fill', 'none')
        .attr('stroke', '#D4C4B0')
        .attr('stroke-width', 1)
        .attr('stroke-dasharray', i === levels ? 'none' : '3,3');
    }

    axes.forEach((axis, i) => {
      const angle = i * angleSlice - Math.PI / 2;
      const x = radius * Math.cos(angle);
      const y = radius * Math.sin(angle);

      g.append('line')
        .attr('x1', 0)
        .attr('y1', 0)
        .attr('x2', x)
        .attr('y2', y)
        .attr('stroke', '#D4C4B0')
        .attr('stroke-width', 1);

      const labelRadius = radius + 20;
      const labelX = labelRadius * Math.cos(angle);
      const labelY = labelRadius * Math.sin(angle);

      g.append('text')
        .attr('x', labelX)
        .attr('y', labelY)
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .attr('fill', '#5C3A21')
        .attr('font-size', '13px')
        .attr('font-weight', '500')
        .text(axis.label);
    });

    const dataPoints: [number, number][] = axes.map((axis, i) => {
      const angle = i * angleSlice - Math.PI / 2;
      const value = data[axis.key as keyof FlavorProfile] || 0;
      const r = (radius * value) / 5;
      return [r * Math.cos(angle), r * Math.sin(angle)];
    });

    const line = d3
      .line<[number, number]>()
      .x(d => d[0])
      .y(d => d[1])
      .curve(d3.curveLinearClosed);

    const radarArea = g
      .append('path')
      .datum(dataPoints)
      .attr('fill', 'rgba(208, 135, 76, 0.25)')
      .attr('stroke', '#D0874C')
      .attr('stroke-width', 2)
      .attr('d', line)
      .attr('transform-origin', 'center');

    const totalLength = radarArea.node()?.getTotalLength() || 0;
    radarArea
      .attr('stroke-dasharray', `${totalLength} ${totalLength}`)
      .attr('stroke-dashoffset', totalLength)
      .transition()
      .duration(600)
      .ease(d3.easeCubicOut)
      .attr('stroke-dashoffset', 0);

    dataPoints.forEach((point, i) => {
      g.append('circle')
        .attr('cx', 0)
        .attr('cy', 0)
        .attr('r', 4)
        .attr('fill', '#FFFFFF')
        .attr('stroke', '#D0874C')
        .attr('stroke-width', 2)
        .transition()
        .delay(500 + i * 80)
        .duration(400)
        .attr('cx', point[0])
        .attr('cy', point[1]);
    });
  }, [data, size]);

  return (
    <div className="flavor-radar-chart">
      <svg ref={svgRef} width={size} height={size} />
    </div>
  );
};

export default FlavorRadarChart;
