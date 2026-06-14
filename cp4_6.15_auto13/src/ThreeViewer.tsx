import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { useStore } from './store';
import { StorageUnit } from './types';
import { calculateUtilization, getUtilizationColor } from './utils';
import { Info, Package } from 'lucide-react';

const ThreeViewer: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const { units, highlightedUnitId, searchQuery } = useStore();
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [rotation, setRotation] = useState({ x: 30, y: 45 });
  const [isDragging, setIsDragging] = useState(false);
  const [lastPos, setLastPos] = useState({ x: 0, y: 0 });
  const [hoveredUnit, setHoveredUnit] = useState<StorageUnit | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  const project = (x: number, y: number, z: number) => {
    const radX = (rotation.x * Math.PI) / 180;
    const radY = (rotation.y * Math.PI) / 180;
    const cosX = Math.cos(radX);
    const sinX = Math.sin(radX);
    const cosY = Math.cos(radY);
    const sinY = Math.sin(radY);
    const x1 = x * cosY - z * sinY;
    const z1 = x * sinY + z * cosY;
    const y1 = y * cosX - z1 * sinX;
    return { x: x1, y: y1 };
  };

  const sortedUnits = useMemo(() => {
    return [...units].sort((a, b) => {
      if (a.id === highlightedUnitId) return 1;
      if (b.id === highlightedUnitId) return -1;
      const za = a.y + a.depth + a.height;
      const zb = b.y + b.depth + b.height;
      return za - zb;
    });
  }, [units, highlightedUnitId]);

  useEffect(() => {
    if (!svgRef.current || units.length === 0) return;
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const defs = svg.append('defs');

    const gradient = defs.append('linearGradient').attr('id', 'bgGradient').attr('x1', '0%').attr('y1', '0%').attr('x2', '0%').attr('y2', '100%');
    gradient.append('stop').attr('offset', '0%').attr('stop-color', '#2c2c2c');
    gradient.append('stop').attr('offset', '100%').attr('stop-color', '#1a1a1a');

    const glowFilter = defs.append('filter').attr('id', 'glow').attr('x', '-50%').attr('y', '-50%').attr('width', '200%').attr('height', '200%');
    glowFilter.append('feGaussianBlur').attr('stdDeviation', '3').attr('result', 'coloredBlur');
    const glowMerge = glowFilter.append('feMerge');
    glowMerge.append('feMergeNode').attr('in', 'coloredBlur');
    glowMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    const edgeFilter = defs.append('filter').attr('id', 'edgeLight').attr('x', '-50%').attr('y', '-50%').attr('width', '200%').attr('height', '200%');
    edgeFilter.append('feGaussianBlur').attr('stdDeviation', '1').attr('result', 'blur');
    edgeFilter.append('feSpecularLighting').attr('in', 'blur').attr('surfaceScale', '2').attr('specularConstant', '0.5').attr('specularExponent', '20').attr('lighting-color', '#ffffff').attr('result', 'specular').append('feDistantLight').attr('azimuth', '45').attr('elevation', '60');
    const edgeComposite = edgeFilter.append('feComposite').attr('in', 'specular').attr('in2', 'SourceGraphic').attr('operator', 'in').attr('result', 'specularComp');
    const edgeMerge = edgeFilter.append('feMerge');
    edgeMerge.append('feMergeNode').attr('in', 'SourceGraphic');
    edgeMerge.append('feMergeNode').attr('in', 'specularComp');

    svg.append('rect').attr('width', dimensions.width).attr('height', dimensions.height).attr('fill', 'url(#bgGradient)');

    const scale = Math.min(dimensions.width, dimensions.height) / 600;
    const centerX = dimensions.width / 2;
    const centerY = dimensions.height / 2;

    sortedUnits.forEach((unit) => {
      const utilization = calculateUtilization(unit);
      const baseColor = getUtilizationColor(utilization);
      const isHighlighted = unit.id === highlightedUnitId;
      const isSearched = searchQuery && (unit.name.toLowerCase().includes(searchQuery.toLowerCase()) || unit.items.some((item) => item.name.toLowerCase().includes(searchQuery.toLowerCase())));
      const shouldGlow = isHighlighted || isSearched;

      const w = unit.width * scale;
      const h = unit.height * scale;
      const d = unit.depth * scale;
      const ox = (unit.x - 150) * scale;
      const oy = (unit.y - 100) * scale;
      const oz = 0;

      const corners = [
        project(ox, oy, oz),
        project(ox + w, oy, oz),
        project(ox + w, oy, oz + d),
        project(ox, oy, oz + d),
        project(ox, oy - h, oz),
        project(ox + w, oy - h, oz),
        project(ox + w, oy - h, oz + d),
        project(ox, oy - h, oz + d),
      ].map((p) => ({ x: p.x + centerX, y: p.y + centerY }));

      const g = svg.append('g').attr('class', 'cube-group').style('cursor', 'pointer');

      const darken = (color: string, amount: number): string => {
        const match = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
        if (match) {
          const r = Math.max(0, parseInt(match[1]) * amount);
          const g = Math.max(0, parseInt(match[2]) * amount);
          const b = Math.max(0, parseInt(match[3]) * amount);
          return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
        }
        return color;
      };

      const lighten = (color: string, amount: number): string => {
        const match = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
        if (match) {
          const r = Math.min(255, 255 - (255 - parseInt(match[1])) * amount);
          const g = Math.min(255, 255 - (255 - parseInt(match[2])) * amount);
          const b = Math.min(255, 255 - (255 - parseInt(match[3])) * amount);
          return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
        }
        return color;
      };

      const topColor = lighten(baseColor, 0.2);
      const frontColor = baseColor;
      const sideColor = darken(baseColor, 0.7);

      g.append('polygon').attr('points', `${corners[0].x},${corners[0].y} ${corners[1].x},${corners[1].y} ${corners[5].x},${corners[5].y} ${corners[4].x},${corners[4].y}`).attr('fill', frontColor).attr('fill-opacity', 0.7).attr('stroke', 'rgba(255,255,255,0.2)').attr('stroke-width', '0.5').attr('filter', 'url(#edgeLight)');

      g.append('polygon').attr('points', `${corners[1].x},${corners[1].y} ${corners[2].x},${corners[2].y} ${corners[6].x},${corners[6].y} ${corners[5].x},${corners[5].y}`).attr('fill', sideColor).attr('fill-opacity', 0.7).attr('stroke', 'rgba(255,255,255,0.2)').attr('stroke-width', '0.5').attr('filter', 'url(#edgeLight)');

      g.append('polygon').attr('points', `${corners[4].x},${corners[4].y} ${corners[5].x},${corners[5].y} ${corners[6].x},${corners[6].y} ${corners[7].x},${corners[7].y}`).attr('fill', topColor).attr('fill-opacity', 0.7).attr('stroke', 'rgba(255,255,255,0.3)').attr('stroke-width', '0.5').attr('filter', 'url(#edgeLight)');

      if (shouldGlow) {
        g.attr('filter', 'url(#glow)');
      }

      g.on('mouseenter', (event: MouseEvent) => {
        setHoveredUnit(unit);
        setTooltipPos({ x: event.clientX, y: event.clientY });
      }).on('mousemove', (event: MouseEvent) => {
        setTooltipPos({ x: event.clientX, y: event.clientY });
      }).on('mouseleave', () => {
        setHoveredUnit(null);
      });
    });
  }, [units, dimensions, rotation, sortedUnits, highlightedUnitId, searchQuery]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setLastPos({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - lastPos.x;
    const dy = e.clientY - lastPos.y;
    setRotation((prev) => ({
      x: Math.max(-90, Math.min(90, prev.x - dy * 0.5)),
      y: prev.y + dx * 0.5,
    }));
    setLastPos({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  return (
    <div ref={containerRef} className="relative w-full h-full min-h-[400px]" onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp} style={{ cursor: isDragging ? 'grabbing' : 'grab' }}>
      <svg ref={svgRef} width={dimensions.width} height={dimensions.height} className="rounded-lg" />
      {hoveredUnit && (
        <div className="fixed pointer-events-none z-50" style={{ left: tooltipPos.x + 15, top: tooltipPos.y + 15, background: 'rgba(255,255,255,0.95)', borderRadius: '8px', padding: '12px 16px', minWidth: '220px', boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}>
          <div className="flex items-center gap-2 mb-2">
            <Info size={16} className="text-gray-600" />
            <span className="font-semibold text-gray-800">{hoveredUnit.name}</span>
          </div>
          <div className="mb-2">
            <div className="text-sm text-gray-500 mb-1">利用率</div>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{ width: `${calculateUtilization(hoveredUnit)}%`, background: getUtilizationColor(calculateUtilization(hoveredUnit)) }} />
              </div>
              <span className="text-sm font-medium text-gray-700">{calculateUtilization(hoveredUnit).toFixed(1)}%</span>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
              <Package size={14} />
              <span>物品清单 ({hoveredUnit.items.length})</span>
            </div>
            <div className="max-h-32 overflow-y-auto space-y-1">
              {hoveredUnit.items.length === 0 ? (
                <div className="text-xs text-gray-400 italic">暂无物品</div>
              ) : (
                hoveredUnit.items.map((item) => (
                  <div key={item.id} className="text-xs text-gray-600 flex justify-between">
                    <span>{item.name}</span>
                    <span className="text-gray-400">x{item.quantity}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ThreeViewer;
