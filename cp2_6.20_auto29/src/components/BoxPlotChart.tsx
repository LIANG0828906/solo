import React, { useEffect, useRef, useMemo } from 'react';
import * as d3Scale from 'd3-scale';
import { select } from 'd3-selection';
import 'd3-transition';
import { axisLeft, axisBottom } from 'd3-axis';
import { RankingItem } from '../types';

interface Props {
  rankings: RankingItem[];
}

const BoxPlotChart: React.FC<Props> = ({ rankings }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const gRef = useRef<SVGGElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);

  const margin = useMemo(() => ({ top: 30, right: 30, bottom: 70, left: 60 }), []);
  const innerWidth = 720;
  const innerHeight = 230;
  const svgWidth = innerWidth + margin.left + margin.right;
  const svgHeight = innerHeight + margin.top + margin.bottom;

  const xScale = useMemo(() => {
    return d3Scale
      .scaleBand()
      .domain(rankings.map((r) => r.name))
      .range([0, innerWidth])
      .padding(0.3);
  }, [rankings]);

  const yScale = useMemo(() => {
    return d3Scale
      .scaleLinear()
      .domain([0, 10])
      .range([innerHeight, 0]);
  }, []);

  useEffect(() => {
    if (!svgRef.current || !gRef.current) return;

    const g = select<SVGGElement, unknown>(gRef.current);

    const yAxis = axisLeft<number>(yScale)
      .ticks(6)
      .tickFormat((d) => d.toString());

    const xAxis = axisBottom<string>(xScale);

    g.select<SVGGElement>('.y-axis')
      .attr('transform', `translate(0, 0)`)
      .transition()
      .duration(500)
      .call(yAxis);

    g.select<SVGGElement>('.x-axis')
      .attr('transform', `translate(0, ${innerHeight})`)
      .transition()
      .duration(500)
      .call(xAxis)
      .selectAll('text')
      .attr('transform', 'rotate(-35)')
      .style('text-anchor', 'end')
      .attr('dx', '-.8em')
      .attr('dy', '.15em');

    g.selectAll('.y-axis path, .y-axis line')
      .attr('stroke', '#4a5568')
      .attr('stroke-width', 1);

    g.selectAll('.x-axis path, .x-axis line')
      .attr('stroke', '#4a5568')
      .attr('stroke-width', 1);

    g.selectAll('.y-axis text')
      .attr('fill', '#4a5568')
      .attr('font-size', 11);

    g.selectAll('.x-axis text')
      .attr('fill', '#4a5568')
      .attr('font-size', 11);

    const gridLines = g.selectAll<SVGLineElement, number>('.grid-line')
      .data([0, 2, 4, 6, 8, 10]);

    gridLines.enter()
      .append('line')
      .attr('class', 'grid-line')
      .attr('x1', 0)
      .attr('x2', innerWidth)
      .attr('y1', (d) => yScale(d))
      .attr('y2', (d) => yScale(d))
      .attr('stroke', '#e2e8f0')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '3 3')
      .merge(gridLines)
      .transition()
      .duration(500)
      .attr('y1', (d) => yScale(d))
      .attr('y2', (d) => yScale(d));

    gridLines.exit().remove();

    const groups = g.selectAll<SVGGElement, RankingItem>('.box-group')
      .data(rankings, (d) => d.optionId);

    const groupsEnter = groups.enter()
      .append('g')
      .attr('class', 'box-group')
      .attr('transform', (d) => `translate(${xScale(d.name) ?? 0}, 0)`);

    const groupsMerge = groupsEnter.merge(groups);

    groupsMerge
      .transition()
      .duration(500)
      .attr('transform', (d) => `translate(${xScale(d.name) ?? 0}, 0)`);

    groups.exit()
      .transition()
      .duration(300)
      .style('opacity', 0)
      .remove();

    const bandWidth = xScale.bandwidth();

    groupsEnter.append('line').attr('class', 'whisker-top');
    groupsEnter.append('line').attr('class', 'whisker-bottom');
    groupsEnter.append('line').attr('class', 'min-line');
    groupsEnter.append('line').attr('class', 'max-line');
    groupsEnter.append('rect').attr('class', 'box-rect');
    groupsEnter.append('line').attr('class', 'median-line');
    groupsEnter.append('rect').attr('class', 'hover-rect');

    groupsMerge.each(function(d) {
      const group = select<SVGGElement, RankingItem>(this);
      const xCenter = bandWidth / 2;
      const dist = d.distribution;

      const yMin = yScale(dist.min);
      const yMax = yScale(dist.max);
      const yMedian = yScale(dist.median);
      const yQ1 = yScale(dist.q1);
      const yQ3 = yScale(dist.q3);

      group.select<SVGLineElement>('.whisker-top')
        .transition()
        .duration(500)
        .attr('x1', xCenter)
        .attr('x2', xCenter)
        .attr('y1', yMin)
        .attr('y2', yQ1)
        .attr('stroke', '#a0aec0')
        .attr('stroke-width', 1.5);

      group.select<SVGLineElement>('.whisker-bottom')
        .transition()
        .duration(500)
        .attr('x1', xCenter)
        .attr('x2', xCenter)
        .attr('y1', yQ3)
        .attr('y2', yMax)
        .attr('stroke', '#a0aec0')
        .attr('stroke-width', 1.5);

      group.select<SVGLineElement>('.min-line')
        .transition()
        .duration(500)
        .attr('x1', xCenter - bandWidth / 4)
        .attr('x2', xCenter + bandWidth / 4)
        .attr('y1', yMin)
        .attr('y2', yMin)
        .attr('stroke', '#4a5568')
        .attr('stroke-width', 1.5);

      group.select<SVGLineElement>('.max-line')
        .transition()
        .duration(500)
        .attr('x1', xCenter - bandWidth / 4)
        .attr('x2', xCenter + bandWidth / 4)
        .attr('y1', yMax)
        .attr('y2', yMax)
        .attr('stroke', '#4a5568')
        .attr('stroke-width', 1.5);

      group.select<SVGRectElement>('.box-rect')
        .transition()
        .duration(500)
        .attr('x', 0)
        .attr('y', Math.min(yQ1, yQ3))
        .attr('width', bandWidth)
        .attr('height', Math.abs(yQ1 - yQ3) || 1)
        .attr('fill', 'rgba(49, 130, 206, 0.3)')
        .attr('stroke', '#3182ce')
        .attr('stroke-width', 1.5);

      group.select<SVGLineElement>('.median-line')
        .transition()
        .duration(500)
        .attr('x1', 0)
        .attr('x2', bandWidth)
        .attr('y1', yMedian)
        .attr('y2', yMedian)
        .attr('stroke', '#2b6cb0')
        .attr('stroke-width', 2.5);

      group.select<SVGRectElement>('.hover-rect')
        .attr('x', -5)
        .attr('y', -5)
        .attr('width', bandWidth + 10)
        .attr('height', innerHeight + 10)
        .attr('fill', 'transparent')
        .style('cursor', 'pointer')
        .on('mouseenter', function(event) {
          if (tooltipRef.current) {
            const tooltip = select<HTMLDivElement, unknown>(tooltipRef.current);
            tooltip
              .style('opacity', 1)
              .style('left', `${event.pageX + 10}px`)
              .style('top', `${event.pageY - 10}px`)
              .html(`
                <div style="font-weight: 600; margin-bottom: 6px; color: #1a365d;">${d.name}</div>
                <div style="font-size: 12px; color: #4a5568;">
                  <div>最小值: <strong style="color: #2d3748;">${dist.min.toFixed(1)}</strong></div>
                  <div>Q1 (25%): <strong style="color: #2d3748;">${dist.q1.toFixed(1)}</strong></div>
                  <div style="color: #2b6cb0; font-weight: 600;">中位数: <strong>${dist.median.toFixed(1)}</strong></div>
                  <div>Q3 (75%): <strong style="color: #2d3748;">${dist.q3.toFixed(1)}</strong></div>
                  <div>最大值: <strong style="color: #2d3748;">${dist.max.toFixed(1)}</strong></div>
                  <div style="margin-top: 4px; padding-top: 4px; border-top: 1px solid #e2e8f0;">
                    样本量: <strong style="color: #2d3748;">${dist.values.length}</strong>
                  </div>
                </div>
              `);
          }
        })
        .on('mousemove', function(event) {
          if (tooltipRef.current) {
            select<HTMLDivElement, unknown>(tooltipRef.current)
              .style('left', `${event.pageX + 10}px`)
              .style('top', `${event.pageY - 10}px`);
          }
        })
        .on('mouseleave', function() {
          if (tooltipRef.current) {
            select<HTMLDivElement, unknown>(tooltipRef.current)
              .style('opacity', 0);
          }
        });
    });

    return () => {
      if (tooltipRef.current) {
        select<HTMLDivElement, unknown>(tooltipRef.current).style('opacity', 0);
      }
    };
  }, [rankings, xScale, yScale, innerWidth, innerHeight, margin]);

  return (
    <div
      ref={containerRef}
      style={{
        background: 'white',
        borderRadius: '12px',
        padding: '24px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        position: 'relative',
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
      <div style={{ position: 'relative', width: '100%' }}>
        <svg
          ref={svgRef}
          width="100%"
          height={340}
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          preserveAspectRatio="xMidYMid meet"
        >
          <g ref={gRef} transform={`translate(${margin.left}, ${margin.top})`}>
            <g className="y-axis" />
            <g className="x-axis" />
          </g>
        </svg>
        <div
          ref={tooltipRef}
          style={{
            position: 'fixed',
            pointerEvents: 'none',
            opacity: 0,
            background: 'white',
            padding: '10px 14px',
            borderRadius: '8px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
            border: '1px solid #e2e8f0',
            zIndex: 1000,
            transition: 'opacity 0.15s ease',
            minWidth: 160,
          }}
        />
      </div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: 24,
          marginTop: 16,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 24, height: 2, background: '#a0aec0' }} />
          <span style={{ fontSize: 12, color: '#718096' }}>极值范围</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 18, height: 12, border: '1.5px solid #3182ce', background: 'rgba(49,130,206,0.3)' }} />
          <span style={{ fontSize: 12, color: '#718096' }}>四分位距 (IQR)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 18, height: 2.5, background: '#2b6cb0' }} />
          <span style={{ fontSize: 12, color: '#718096' }}>中位数</span>
        </div>
      </div>
    </div>
  );
};

export default BoxPlotChart;
