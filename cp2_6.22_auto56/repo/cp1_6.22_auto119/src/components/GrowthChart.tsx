import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { GrowthDataPoint, GrowthStage, STAGE_LABELS } from '../utils/plantGrowth';

interface GrowthChartProps {
  dataPoints: GrowthDataPoint[];
  stage: GrowthStage;
}

const WIDTH = 280;
const HEIGHT = 200;
const MARGIN = { top: 20, right: 20, bottom: 36, left: 44 };

const GrowthChart: React.FC<GrowthChartProps> = ({ dataPoints, stage }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const innerWidth = WIDTH - MARGIN.left - MARGIN.right;
    const innerHeight = HEIGHT - MARGIN.top - MARGIN.bottom;

    const g = svg
      .append('g')
      .attr('transform', `translate(${MARGIN.left},${MARGIN.top})`);

    const data = dataPoints.length > 0 ? dataPoints : [{ time: 0, height: 0 }];

    const maxTime = Math.max(30, d3.max(data, d => d.time) ?? 0);
    const maxHeightCm = Math.max(300, d3.max(data, d => d.height) ?? 0);

    const x = d3.scaleLinear()
      .domain([0, maxTime])
      .range([0, innerWidth]);

    const y = d3.scaleLinear()
      .domain([0, maxHeightCm])
      .range([innerHeight, 0]);

    const defs = svg.append('defs');

    const gradient = defs.append('linearGradient')
      .attr('id', 'area-gradient')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%');

    gradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', '#228B22')
      .attr('stop-opacity', 0.35);

    gradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#228B22')
      .attr('stop-opacity', 0.02);

    const xAxis = d3.axisBottom(x)
      .ticks(5)
      .tickFormat(d => `${d}s`);

    const yAxis = d3.axisLeft(y)
      .ticks(4)
      .tickFormat(d => `${d}cm`);

    g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(xAxis)
      .selectAll('text')
      .attr('font-size', '10px')
      .attr('fill', '#6B7280');

    g.selectAll('.domain, .tick line')
      .attr('stroke', '#E5E7EB');

    g.append('g')
      .call(yAxis)
      .selectAll('text')
      .attr('font-size', '10px')
      .attr('fill', '#6B7280');

    g.selectAll('.domain, .tick line')
      .attr('stroke', '#E5E7EB');

    g.append('text')
      .attr('x', innerWidth / 2)
      .attr('y', innerHeight + 28)
      .attr('text-anchor', 'middle')
      .attr('font-size', '10px')
      .attr('fill', '#9CA3AF')
      .text('时间 (秒)');

    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -innerHeight / 2)
      .attr('y', -32)
      .attr('text-anchor', 'middle')
      .attr('font-size', '10px')
      .attr('fill', '#9CA3AF')
      .text('高度 (厘米)');

    const area = d3.area<GrowthDataPoint>()
      .x(d => x(d.time))
      .y0(innerHeight)
      .y1(d => y(d.height))
      .curve(d3.curveMonotoneX);

    g.append('path')
      .datum(data)
      .attr('fill', 'url(#area-gradient)')
      .attr('d', area);

    const line = d3.line<GrowthDataPoint>()
      .x(d => x(d.time))
      .y(d => y(d.height))
      .curve(d3.curveMonotoneX);

    g.append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', '#228B22')
      .attr('stroke-width', 2)
      .attr('stroke-linejoin', 'round')
      .attr('stroke-linecap', 'round')
      .attr('d', line);

    const visiblePoints = data.length > 40
      ? data.filter((_, i) => i % Math.ceil(data.length / 40) === 0 || i === data.length - 1)
      : data;

    g.selectAll('.data-point')
      .data(visiblePoints)
      .enter()
      .append('circle')
      .attr('class', 'data-point')
      .attr('cx', d => x(d.time))
      .attr('cy', d => y(d.height))
      .attr('r', 2.5)
      .attr('fill', '#FFFFFF')
      .attr('stroke', '#228B22')
      .attr('stroke-width', 1.5);

    if (data.length > 0) {
      const lastPoint = data[data.length - 1];
      g.append('circle')
        .attr('cx', x(lastPoint.time))
        .attr('cy', y(lastPoint.height))
        .attr('r', 5)
        .attr('fill', '#228B22')
        .attr('opacity', 0.2)
        .append('animate')
        .attr('attributeName', 'r')
        .attr('values', '5;10;5')
        .attr('dur', '1.5s')
        .attr('repeatCount', 'indefinite');
    }
  }, [dataPoints]);

  useEffect(() => {
    if (stageRef.current) {
      stageRef.current.style.animation = 'none';
      void stageRef.current.offsetWidth;
      stageRef.current.style.animation = 'fadeInChart 0.3s ease-out';
    }
  }, [stage]);

  return (
    <div style={styles.container}>
      <svg
        ref={svgRef}
        width={WIDTH}
        height={HEIGHT}
        style={styles.svg}
      />
      <div
        ref={stageRef}
        style={styles.stageBadge}
      >
        <span style={styles.stageBadgeDot}></span>
        {STAGE_LABELS[stage]}
      </div>
      <style>{`
        @keyframes fadeInChart {
          0% { opacity: 0; transform: translateY(4px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #4A90D9;
          cursor: pointer;
          border: 2px solid #FFFFFF;
          box-shadow: 0 1px 4px rgba(74, 144, 217, 0.4);
        }
        input[type="range"]::-moz-range-thumb {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #4A90D9;
          cursor: pointer;
          border: 2px solid #FFFFFF;
          box-shadow: 0 1px 4px rgba(74, 144, 217, 0.4);
        }
      `}</style>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'relative',
    width: '100%',
    padding: '0',
    backgroundColor: '#FFFFFF',
    boxSizing: 'border-box'
  },
  svg: {
    display: 'block',
    width: '100%',
    height: 'auto',
    maxWidth: WIDTH
  },
  stageBadge: {
    position: 'absolute',
    top: '8px',
    right: '8px',
    padding: '4px 10px',
    backgroundColor: '#DCFCE7',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: 600,
    color: '#166534',
    display: 'flex',
    alignItems: 'center',
    gap: '6px'
  },
  stageBadgeDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    backgroundColor: '#22C55E',
    boxShadow: '0 0 6px #22C55E'
  }
};

export default React.memo(GrowthChart);
