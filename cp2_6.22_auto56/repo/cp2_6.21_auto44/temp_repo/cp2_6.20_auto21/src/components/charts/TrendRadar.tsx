import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import * as d3 from 'd3';
import type { RadarSeries } from '@/types';

const DIMENSIONS = ['沟通效率', '目标达成', '时间管理', '质量把控', '团队协作'];

interface TrendRadarProps {
  series: RadarSeries[];
  width?: number;
  height?: number;
  onToggleSeries?: (sessionId: string) => void;
}

interface TooltipData {
  visible: boolean;
  x: number;
  y: number;
  content: {
    dimension: string;
    items: { name: string; value: number; color: string }[];
  } | null;
}

interface DotDatum {
  series: RadarSeries;
  dimension: string;
  value: number;
  index: number;
}

interface DotDatumLite {
  dimension: string;
  index: number;
}

export default function TrendRadar({
  series,
  width = 500,
  height = 500,
  onToggleSeries,
}: TrendRadarProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<TooltipData>({
    visible: false,
    x: 0,
    y: 0,
    content: null,
  });

  const config = useMemo(() => {
    const margin = { top: 40, right: 40, bottom: 80, left: 40 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;
    const radius = Math.min(innerWidth, innerHeight) / 2;
    const centerX = margin.left + innerWidth / 2;
    const centerY = margin.top + innerHeight / 2;
    const levels = 5;
    const angleStep = (Math.PI * 2) / DIMENSIONS.length;

    return { margin, innerWidth, innerHeight, radius, centerX, centerY, levels, angleStep };
  }, [width, height]);

  const radialScale = useMemo(() => {
    return d3.scaleLinear().domain([0, 100]).range([0, config.radius]);
  }, [config.radius]);

  const getPointPosition = useCallback(
    (index: number, value: number) => {
      const angle = config.angleStep * index - Math.PI / 2;
      const r = radialScale(value);
      return {
        x: config.centerX + r * Math.cos(angle),
        y: config.centerY + r * Math.sin(angle),
      };
    },
    [config.angleStep, config.centerX, config.centerY, radialScale]
  );

  const getDimensionPosition = useCallback(
    (index: number, offset: number = 0) => {
      const angle = config.angleStep * index - Math.PI / 2;
      const r = config.radius + offset;
      return {
        x: config.centerX + r * Math.cos(angle),
        y: config.centerY + r * Math.sin(angle),
      };
    },
    [config.angleStep, config.centerX, config.centerY, config.radius]
  );

  const createPath = useCallback(
    (data: { dimension: string; value: number }[]) => {
      const points = DIMENSIONS.map((dim, i) => {
        const dataPoint = data.find((d) => d.dimension === dim);
        const value = dataPoint?.value ?? 0;
        return getPointPosition(i, value);
      });

      if (points.length === 0) return '';

      const path = d3.path();
      path.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) {
        path.lineTo(points[i].x, points[i].y);
      }
      path.closePath();
      return path.toString();
    },
    [getPointPosition]
  );

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const defs = svg.append('defs');

    const gridGroup = svg.append('g').attr('class', 'grid-group');
    for (let level = 1; level <= config.levels; level++) {
      const r = (config.radius / config.levels) * level;
      const points = DIMENSIONS.map((_, i) => {
        const angle = config.angleStep * i - Math.PI / 2;
        return {
          x: config.centerX + r * Math.cos(angle),
          y: config.centerY + r * Math.sin(angle),
        };
      });

      const path = d3.path();
      path.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) {
        path.lineTo(points[i].x, points[i].y);
      }
      path.closePath();

      gridGroup
        .append('path')
        .attr('d', path.toString())
        .attr('fill', 'none')
        .attr('stroke', 'rgba(255, 255, 255, 0.1)')
        .attr('stroke-width', 1);
    }

    const axisGroup = svg.append('g').attr('class', 'axis-group');
    DIMENSIONS.forEach((_, i) => {
      const pos = getDimensionPosition(i);
      axisGroup
        .append('line')
        .attr('x1', config.centerX)
        .attr('y1', config.centerY)
        .attr('x2', pos.x)
        .attr('y2', pos.y)
        .attr('stroke', 'rgba(255, 255, 255, 0.1)')
        .attr('stroke-width', 1);
    });

    const labelGroup = svg.append('g').attr('class', 'label-group');
    DIMENSIONS.forEach((dim, i) => {
      const pos = getDimensionPosition(i, 24);
      labelGroup
        .append('text')
        .attr('x', pos.x)
        .attr('y', pos.y)
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .attr('fill', 'rgba(255, 255, 255, 0.7)')
        .attr('font-size', 12)
        .text(dim);
    });

    const areaGroup = svg.append('g').attr('class', 'area-group');
    const dotGroup = svg.append('g').attr('class', 'dot-group');

    series.forEach((s) => {
      if (!s.visible) return;

      const gradientId = `gradient-${s.sessionId}`;
      const gradient = defs
        .append('radialGradient')
        .attr('id', gradientId)
        .attr('cx', '50%')
        .attr('cy', '50%')
        .attr('r', '50%');

      gradient.append('stop').attr('offset', '0%').attr('stop-color', s.color).attr('stop-opacity', 0.3);
      gradient.append('stop').attr('offset', '100%').attr('stop-color', s.color).attr('stop-opacity', 0.1);

      const path = createPath(s.data);

      areaGroup
        .append('path')
        .datum(s)
        .attr('class', `radar-area-${s.sessionId}`)
        .attr('d', path)
        .attr('fill', s.color)
        .attr('fill-opacity', 0.2)
        .attr('stroke', s.color)
        .attr('stroke-width', 2)
        .style('transition', 'all 750ms cubic-bezier(0.645, 0.045, 0.355, 1)');

      DIMENSIONS.forEach((dim, i) => {
        const dataPoint = s.data.find((d) => d.dimension === dim);
        const value = dataPoint?.value ?? 0;
        const pos = getPointPosition(i, value);

        dotGroup
          .append('circle')
          .datum({ series: s, dimension: dim, value, index: i })
          .attr('class', `radar-dot-${s.sessionId}`)
          .attr('cx', pos.x)
          .attr('cy', pos.y)
          .attr('r', 4)
          .attr('fill', s.color)
          .attr('stroke', '#fff')
          .attr('stroke-width', 1.5)
          .style('cursor', 'pointer')
          .style('transition', 'all 750ms cubic-bezier(0.645, 0.045, 0.355, 1)')
          .on('mouseenter', function (this: SVGCircleElement, event: MouseEvent, d: DotDatum) {
            d3.select(this).transition().duration(150).attr('r', 6);

            const items = series
              .filter((ser) => ser.visible)
              .map((ser) => {
                const dp = ser.data.find((p) => p.dimension === d.dimension);
                return {
                  name: ser.name,
                  value: dp?.value ?? 0,
                  color: ser.color,
                };
              });

            setTooltip({
              visible: true,
              x: event.clientX,
              y: event.clientY,
              content: {
                dimension: d.dimension,
                items,
              },
            });
          })
          .on('mousemove', function (this: SVGCircleElement, event: MouseEvent) {
            setTooltip((prev) => ({
              ...prev,
              x: event.clientX,
              y: event.clientY,
            }));
          })
          .on('mouseleave', function (this: SVGCircleElement) {
            d3.select(this).transition().duration(150).attr('r', 4);
            setTooltip({ visible: false, x: 0, y: 0, content: null });
          });
      });
    });

    const cleanup = () => {
      svg.selectAll('*').interrupt();
    };

    return cleanup;
  }, [series, config, createPath, getDimensionPosition, getPointPosition]);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);

    series.forEach((s) => {
      const path = createPath(s.data);
      const area = svg.select(`.radar-area-${s.sessionId}`);
      const dots = svg.selectAll(`.radar-dot-${s.sessionId}`);

      if (s.visible) {
        if (area.empty()) {
          const areaGroup = svg.select('.area-group');
          const dotGroup = svg.select('.dot-group');

          areaGroup
            .append('path')
            .datum(s)
            .attr('class', `radar-area-${s.sessionId}`)
            .attr('d', path)
            .attr('fill', s.color)
            .attr('fill-opacity', 0)
            .attr('stroke', s.color)
            .attr('stroke-width', 2)
            .attr('stroke-opacity', 0)
            .transition()
            .duration(750)
            .ease(d3.easeCubicInOut)
            .attr('fill-opacity', 0.2)
            .attr('stroke-opacity', 1);

          DIMENSIONS.forEach((dim, i) => {
            const dataPoint = s.data.find((d) => d.dimension === dim);
            const value = dataPoint?.value ?? 0;
            const pos = getPointPosition(i, value);

            dotGroup
              .append('circle')
              .datum({ series: s, dimension: dim, value, index: i })
              .attr('class', `radar-dot-${s.sessionId}`)
              .attr('cx', pos.x)
              .attr('cy', pos.y)
              .attr('r', 0)
              .attr('fill', s.color)
              .attr('stroke', '#fff')
              .attr('stroke-width', 1.5)
              .style('cursor', 'pointer')
              .on('mouseenter', function (this: SVGCircleElement, event: MouseEvent, d: DotDatum) {
                d3.select(this).transition().duration(150).attr('r', 6);

                const items = series
                  .filter((ser) => ser.visible)
                  .map((ser) => {
                    const dp = ser.data.find((p) => p.dimension === d.dimension);
                    return {
                      name: ser.name,
                      value: dp?.value ?? 0,
                      color: ser.color,
                    };
                  });

                setTooltip({
                  visible: true,
                  x: event.clientX,
                  y: event.clientY,
                  content: {
                    dimension: d.dimension,
                    items,
                  },
                });
              })
              .on('mousemove', function (this: SVGCircleElement, event: MouseEvent) {
                setTooltip((prev) => ({
                  ...prev,
                  x: event.clientX,
                  y: event.clientY,
                }));
              })
              .on('mouseleave', function (this: SVGCircleElement) {
                d3.select(this).transition().duration(150).attr('r', 4);
                setTooltip({ visible: false, x: 0, y: 0, content: null });
              })
              .transition()
              .duration(750)
              .ease(d3.easeCubicInOut)
              .attr('r', 4);
          });
        } else {
          area
            .transition()
            .duration(750)
            .ease(d3.easeCubicInOut)
            .attr('d', path)
            .attr('fill-opacity', 0.2)
            .attr('stroke-opacity', 1);

          dots.each(function (d: unknown) {
            const datum = d as DotDatumLite;
            const dataPoint = s.data.find((p) => p.dimension === datum.dimension);
            const value = dataPoint?.value ?? 0;
            const pos = getPointPosition(datum.index, value);

            d3.select(this as SVGCircleElement)
              .transition()
              .duration(750)
              .ease(d3.easeCubicInOut)
              .attr('cx', pos.x)
              .attr('cy', pos.y)
              .attr('r', 4)
              .style('opacity', 1);
          });
        }
      } else {
        if (!area.empty()) {
          area
            .transition()
            .duration(750)
            .ease(d3.easeCubicInOut)
            .attr('fill-opacity', 0)
            .attr('stroke-opacity', 0)
            .remove();

          dots
            .transition()
            .duration(750)
            .ease(d3.easeCubicInOut)
            .attr('r', 0)
            .style('opacity', 0)
            .remove();
        }
      }
    });
  }, [series, createPath, getPointPosition]);

  const handleLegendClick = (sessionId: string) => {
    onToggleSeries?.(sessionId);
  };

  return (
    <div ref={containerRef} className="relative w-full h-full">
      <svg
        ref={svgRef}
        width={width}
        height={height}
        className="block mx-auto"
        style={{ overflow: 'visible' }}
      />

      <div className="flex flex-wrap justify-center gap-4 mt-4 px-4">
        {series.map((s) => (
          <button
            key={s.sessionId}
            onClick={() => handleLegendClick(s.sessionId)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all duration-200 hover:bg-white/5 ${
              s.visible ? 'opacity-100' : 'opacity-40'
            }`}
          >
            <span
              className="w-3 h-3 rounded-sm flex-shrink-0"
              style={{ backgroundColor: s.color }}
            />
            <span className="text-sm text-white/80 truncate max-w-32">{s.name}</span>
          </button>
        ))}
      </div>

      {tooltip.visible && tooltip.content && (
        <div
          className="fixed z-50 pointer-events-none bg-gray-900/95 backdrop-blur-sm border border-white/10 rounded-lg px-4 py-3 shadow-xl"
          style={{
            left: tooltip.x + 12,
            top: tooltip.y + 12,
          }}
        >
          <div className="text-sm font-medium text-white mb-2">{tooltip.content.dimension}</div>
          <div className="space-y-1">
            {tooltip.content.items.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-xs text-white/70">{item.name}</span>
                <span className="text-xs font-medium text-white ml-auto">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
