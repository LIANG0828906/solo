import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { RadarScores } from '../utils/photoData';

interface RadarChartProps {
  data: RadarScores;
  size?: number;
}

const LABELS = [
  { key: 'detail', label: '细节' },
  { key: 'noise', label: '噪控' },
  { key: 'depthOfField', label: '景深' },
  { key: 'dynamicRange', label: '动态' },
  { key: 'colorSaturation', label: '色彩' },
];

export default function RadarChart({ data, size = 180 }: RadarChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const center = size / 2;
    const radius = size / 2 - 25;
    const levels = 4;
    const angleStep = (Math.PI * 2) / LABELS.length;

    const g = svg.append('g')
      .attr('transform', `translate(${center}, ${center})`);

    const defs = svg.append('defs');
    const gradient = defs.append('radialGradient')
      .attr('id', 'radarGradient')
      .attr('cx', '50%')
      .attr('cy', '50%')
      .attr('r', '50%');

    gradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', '#ff8c42')
      .attr('stop-opacity', 0.6);

    gradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#a78bfa')
      .attr('stop-opacity', 0.3);

    for (let i = levels; i >= 1; i--) {
      const levelRadius = (radius / levels) * i;
      const points: string[] = [];
      for (let j = 0; j < LABELS.length; j++) {
        const angle = angleStep * j - Math.PI / 2;
        const x = Math.cos(angle) * levelRadius;
        const y = Math.sin(angle) * levelRadius;
        points.push(`${x},${y}`);
      }
      g.append('polygon')
        .attr('points', points.join(' '))
        .attr('fill', 'none')
        .attr('stroke', 'rgba(255, 255, 255, 0.08)')
        .attr('stroke-width', 1);
    }

    for (let i = 0; i < LABELS.length; i++) {
      const angle = angleStep * i - Math.PI / 2;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      g.append('line')
        .attr('x1', 0)
        .attr('y1', 0)
        .attr('x2', x)
        .attr('y2', y)
        .attr('stroke', 'rgba(255, 255, 255, 0.08)')
        .attr('stroke-width', 1);
    }

    const dataPoints = LABELS.map((label, i) => {
      const value = data[label.key as keyof RadarScores];
      const angle = angleStep * i - Math.PI / 2;
      return {
        angle,
        value: (value / 10) * radius,
        label: label.label,
        rawValue: value,
      };
    });

    const radarPath = g.append('path')
      .attr('fill', 'url(#radarGradient)')
      .attr('stroke', '#ff8c42')
      .attr('stroke-width', 1.5)
      .attr('stroke-linejoin', 'round');

    let progress = 0;
    const animate = () => {
      progress = Math.min(progress + 0.05, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 3);

      const currentPoints = dataPoints.map(d => {
        const r = d.value * easeProgress;
        return {
          x: Math.cos(d.angle) * r,
          y: Math.sin(d.angle) * r,
        };
      });

      const pathData = d3.line<{ x: number; y: number }>()
        .x(d => d.x)
        .y(d => d.y)
        .curve(d3.curveLinearClosed)(currentPoints);

      radarPath.attr('d', pathData || '');

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    dataPoints.forEach((d, i) => {
      const labelRadius = radius + 15;
      const x = Math.cos(d.angle) * labelRadius;
      const y = Math.sin(d.angle) * labelRadius;

      g.append('text')
        .attr('x', x)
        .attr('y', y)
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .attr('font-size', '11px')
        .attr('fill', '#a0a0a0')
        .text(d.label);
    });

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [data, size]);

  return (
    <svg
      ref={svgRef}
      width={size}
      height={size}
      style={{ display: 'block' }}
    />
  );
}
