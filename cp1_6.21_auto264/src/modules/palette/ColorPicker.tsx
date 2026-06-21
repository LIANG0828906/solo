import React, { useEffect, useRef, useMemo, useState, useCallback } from 'react';
import * as d3 from 'd3';
import { useStyleStore } from '../../store/useStyleStore';

const PALETTE_GRID: string[][] = [
  ['#EF4444', '#F97316', '#F59E0B', '#EAB308', '#84CC16', '#22C55E', '#10B981', '#14B8A6'],
  ['#06B6D4', '#0EA5E9', '#3B82F6', '#6366F1', '#8B5CF6', '#A855F7', '#D946EF', '#EC4899'],
  ['#F43F5E', '#FB7185', '#FB923C', '#FBBF24', '#A3E635', '#4ADE80', '#34D399', '#2DD4BF'],
  ['#22D3EE', '#38BDF8', '#60A5FA', '#818CF8', '#A78BFA', '#C084FC', '#E879F9', '#F472B6'],
  ['#F87171', '#FDBA74', '#FCD34D', '#FDE047', '#BEF264', '#86EFAC', '#6EE7B7', '#5EEAD4'],
];

const ALL_COLORS = PALETTE_GRID.flat();

interface ColorPickerProps {
  compact?: boolean;
}

const ColorPicker: React.FC<ColorPickerProps> = ({ compact = false }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const { currentColor, setCurrentColor, selectedRange, updateCurrentSelectionStyle } = useStyleStore();
  const [hoveredColor, setHoveredColor] = useState<string | null>(null);

  const { h, s, v } = useMemo(() => {
    const rgb = d3.rgb(currentColor);
    const hsv = d3.hsv(rgb);
    return {
      h: isNaN(hsv.h) ? 0 : hsv.h,
      s: isNaN(hsv.s) ? 0 : hsv.s,
      v: isNaN(hsv.v) ? 1 : hsv.v,
    };
  }, [currentColor]);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const size = compact ? 160 : 200;
    const outerRadius = size / 2 - 4;
    const innerRadius = outerRadius - 24;
    const cx = size / 2;
    const cy = size / 2;

    svg.attr('width', size).attr('height', size).attr('viewBox', `0 0 ${size} ${size}`);

    const defs = svg.append('defs');

    for (let i = 0; i < 360; i += 15) {
      const startAngle = ((i - 90) * Math.PI) / 180;
      const endAngle = ((i + 15 - 90) * Math.PI) / 180;

      const x1 = cx + outerRadius * Math.cos(startAngle);
      const y1 = cy + outerRadius * Math.sin(startAngle);
      const x2 = cx + outerRadius * Math.cos(endAngle);
      const y2 = cy + outerRadius * Math.sin(endAngle);
      const x3 = cx + innerRadius * Math.cos(endAngle);
      const y3 = cy + innerRadius * Math.sin(endAngle);
      const x4 = cx + innerRadius * Math.cos(startAngle);
      const y4 = cy + innerRadius * Math.sin(startAngle);

      const pathD = `M ${x1} ${y1} A ${outerRadius} ${outerRadius} 0 0 1 ${x2} ${y2} L ${x3} ${y3} A ${innerRadius} ${innerRadius} 0 0 0 ${x4} ${y4} Z`;

      const gradient = defs
        .append('linearGradient')
        .attr('id', `hue-grad-${i}`)
        .attr('x1', x4).attr('y1', y4)
        .attr('x2', x1).attr('y2', y1)
        .attr('gradientUnits', 'userSpaceOnUse');

      gradient.append('stop').attr('offset', '0%').attr('stop-color', d3.hsv(i, 1, 1).toString());
      gradient.append('stop').attr('offset', '100%').attr('stop-color', d3.hsv(i, 1, 1).toString());

      svg
        .append('path')
        .attr('d', pathD)
        .attr('fill', `url(#hue-grad-${i})`)
        .style('cursor', 'pointer')
        .style('transition', 'filter 0.15s ease')
        .on('mouseenter', function () {
          d3.select(this).style('filter', 'brightness(1.15) saturate(1.2)');
        })
        .on('mouseleave', function () {
          d3.select(this).style('filter', 'none');
        })
        .on('click', () => {
          const newColor = d3.hsv(i, s, v).toString();
          setCurrentColor(newColor);
          if (selectedRange) {
            updateCurrentSelectionStyle({ color: newColor });
          }
        });
    }

    const svSize = innerRadius - 8;
    const svCx = cx;
    const svCy = cy;
    const svX = svCx - svSize;
    const svY = svCy - svSize;

    const svGradId = 'sv-gradient';
    const svGrad = defs.append('linearGradient').attr('id', svGradId)
      .attr('x1', '0%').attr('y1', '100%').attr('x2', '0%').attr('y2', '0%');
    svGrad.append('stop').attr('offset', '0%').attr('stop-color', '#000000');
    svGrad.append('stop').attr('offset', '100%').attr('stop-color', '#FFFFFF');

    const hueGradId = `hue-sv-${Math.round(h)}`;
    const hueGrad = defs.append('linearGradient').attr('id', hueGradId)
      .attr('x1', '0%').attr('y1', '0%').attr('x2', '100%').attr('y2', '0%');
    hueGrad.append('stop').attr('offset', '0%').attr('stop-color', '#FFFFFF');
    hueGrad.append('stop').attr('offset', '100%').attr('stop-color', d3.hsv(h, 1, 1).toString());

    const maskId = 'sv-mask';
    const mask = defs.append('mask').attr('id', maskId);
    mask.append('rect')
      .attr('x', svX).attr('y', svY)
      .attr('width', svSize * 2).attr('height', svSize * 2)
      .attr('rx', svSize * 0.15)
      .attr('fill', `url(#${svGradId})`);

    svg.append('rect')
      .attr('x', svX).attr('y', svY)
      .attr('width', svSize * 2).attr('height', svSize * 2)
      .attr('rx', svSize * 0.15)
      .attr('fill', `url(#${hueGradId})`)
      .attr('mask', `url(#${maskId})`)
      .style('cursor', 'crosshair');

    const selectorX = svX + s * svSize * 2;
    const selectorY = svY + (1 - v) * svSize * 2;

    svg.append('circle')
      .attr('cx', selectorX)
      .attr('cy', selectorY)
      .attr('r', 6)
      .attr('fill', currentColor)
      .attr('stroke', '#FFFFFF')
      .attr('stroke-width', 2)
      .style('filter', 'drop-shadow(0 1px 3px rgba(0,0,0,0.5))')
      .style('pointer-events', 'none');

    const indicatorAngle = ((h - 90) * Math.PI) / 180;
    const indicatorR = (outerRadius + innerRadius) / 2;
    const ix = cx + indicatorR * Math.cos(indicatorAngle);
    const iy = cy + indicatorR * Math.sin(indicatorAngle);

    svg.append('circle')
      .attr('cx', ix)
      .attr('cy', iy)
      .attr('r', 5)
      .attr('fill', d3.hsv(h, 1, 1).toString())
      .attr('stroke', '#FFFFFF')
      .attr('stroke-width', 2)
      .style('pointer-events', 'none');

    const handleSVClick = (event: MouseEvent) => {
      const target = event.currentTarget as SVGRectElement;
      const rect = target.getBoundingClientRect();
      const svgRect = svgRef.current!.getBoundingClientRect();

      const relX = (event.clientX - rect.left) / rect.width;
      const relY = (event.clientY - rect.top) / rect.height;

      const newS = Math.max(0, Math.min(1, relX));
      const newV = Math.max(0, Math.min(1, 1 - relY));

      const newColor = d3.hsv(h, newS, newV).toString();
      setCurrentColor(newColor);
      if (selectedRange) {
        updateCurrentSelectionStyle({ color: newColor });
      }

      void svgRect;
    };

    svg.selectAll('rect').on('click', handleSVClick);

    let isDragging = false;
    const handleDragMove = (event: MouseEvent) => {
      if (!isDragging) return;
      const rect = svgRef.current!.querySelector('rect')?.getBoundingClientRect();
      if (!rect) return;

      const relX = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
      const relY = Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height));

      const newS = relX;
      const newV = 1 - relY;

      const newColor = d3.hsv(h, newS, newV).toString();
      setCurrentColor(newColor);
      if (selectedRange) {
        updateCurrentSelectionStyle({ color: newColor });
      }
    };

    const handleDragEnd = () => {
      isDragging = false;
      window.removeEventListener('mousemove', handleDragMove);
      window.removeEventListener('mouseup', handleDragEnd);
    };

    svg.selectAll('rect').on('mousedown', () => {
      isDragging = true;
      window.addEventListener('mousemove', handleDragMove);
      window.addEventListener('mouseup', handleDragEnd);
    });
  }, [h, s, v, currentColor, setCurrentColor, selectedRange, updateCurrentSelectionStyle, compact]);

  const handleSwatchClick = useCallback(
    (color: string) => {
      setCurrentColor(color);
      if (selectedRange) {
        updateCurrentSelectionStyle({ color });
      }
    },
    [setCurrentColor, selectedRange, updateCurrentSelectionStyle]
  );

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs text-text-secondary mb-2 font-medium">调色板网格</p>
        <div
          className="grid gap-1 p-2 bg-app-bg/50 rounded-lg"
          style={{
            gridTemplateColumns: 'repeat(8, 1fr)',
          }}
        >
          {PALETTE_GRID.flat().map((color) => {
            const isSelected = color.toLowerCase() === currentColor.toLowerCase();
            const isHovered = hoveredColor === color;
            return (
              <button
                key={color}
                onClick={() => handleSwatchClick(color)}
                onMouseEnter={() => setHoveredColor(color)}
                onMouseLeave={() => setHoveredColor(null)}
                className={`color-swatch aspect-square rounded-md relative ${
                  isSelected ? 'selected' : ''
                }`}
                style={{
                  width: '40px',
                  height: '40px',
                  backgroundColor: color,
                  border: isSelected ? '2px solid #F8FAFC' : '1px solid rgba(255,255,255,0.1)',
                  transform: isHovered ? 'scale(1.15)' : isSelected ? 'scale(1.1)' : 'scale(1)',
                  transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
                  zIndex: isHovered || isSelected ? 10 : 1,
                  color: color,
                }}
                title={color}
              />
            );
          })}
        </div>
      </div>

      <div>
        <p className="text-xs text-text-secondary mb-2 font-medium">HSV 色相环</p>
        <div className="flex justify-center p-3 bg-app-bg/50 rounded-lg">
          <svg ref={svgRef} />
        </div>
      </div>

      <div className="flex items-center gap-3 p-3 bg-app-bg/50 rounded-lg">
        <div
          className="w-12 h-12 rounded-lg flex-shrink-0 border border-border-primary"
          style={{ backgroundColor: currentColor }}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-text-secondary">当前颜色</span>
            <span
              className="text-xs font-mono text-text-primary px-2 py-0.5 rounded bg-panel-bg border border-border-primary cursor-pointer hover:border-accent transition-colors"
              onClick={() => {
                navigator.clipboard?.writeText(currentColor.toUpperCase());
              }}
            >
              {currentColor.toUpperCase()}
            </span>
          </div>
          <input
            type="color"
            value={currentColor}
            onChange={(e) => {
              handleSwatchClick(e.target.value);
            }}
            className="w-full h-6 rounded cursor-pointer bg-transparent"
          />
        </div>
      </div>

      {!ALL_COLORS.includes(currentColor.toLowerCase()) && (
        <button
          onClick={() => {
            handleSwatchClick(currentColor);
          }}
          className="w-full py-2 text-xs text-text-secondary hover:text-accent transition-colors border border-dashed border-border-secondary rounded-lg hover:border-accent"
        >
          + 将当前颜色应用到选区
        </button>
      )}
    </div>
  );
};

export default React.memo(ColorPicker);
