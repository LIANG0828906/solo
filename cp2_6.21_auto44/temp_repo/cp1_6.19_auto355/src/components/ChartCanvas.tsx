import React, { useRef, useEffect, useState, useCallback } from 'react';
import type { PieChartDatum, BarChartDatum, LineChartDatum } from '../types';

const PRIMARY_COLOR = '#1976D2';
const SECONDARY_COLOR = '#FFB300';
const PIE_COLORS = [
  '#1976D2', '#FFB300', '#4CAF50', '#E53935',
  '#8E24AA', '#00ACC1', '#FB8C00', '#5D4037'
];

interface TooltipState {
  visible: boolean;
  x: number;
  y: number;
  content: React.ReactNode;
}

interface ChartCanvasProps {
  type: 'pie' | 'bar' | 'line' | 'rating';
  data: PieChartDatum[] | BarChartDatum[] | LineChartDatum[] | { stars: number; count: number }[];
  width?: number;
  height?: number;
  onBarClick?: (index: number, datum: BarChartDatum) => void;
  onTimeRangeSelect?: (startLabel: string, endLabel: string) => void;
}

const lightenColor = (hex: string, percent: number): string => {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, (num >> 16) + Math.round(255 * percent / 100));
  const g = Math.min(255, ((num >> 8) & 0x00FF) + Math.round(255 * percent / 100));
  const b = Math.min(255, (num & 0x0000FF) + Math.round(255 * percent / 100));
  return '#' + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
};

export default function ChartCanvas({
  type,
  data,
  width = 400,
  height = 250,
  onBarClick,
  onTimeRangeSelect,
}: ChartCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<TooltipState>({ visible: false, x: 0, y: 0, content: null });
  const hoverStateRef = useRef<number>(-1);
  const dragStateRef = useRef<{ active: boolean; startX: number; endX: number }>({ active: false, startX: 0, endX: 0 });

  const drawChart = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    if (type === 'pie') {
      drawPie(ctx, data as PieChartDatum[]);
    } else if (type === 'bar') {
      drawBar(ctx, data as BarChartDatum[]);
    } else if (type === 'line') {
      drawLine(ctx, data as LineChartDatum[]);
    } else if (type === 'rating') {
      drawRating(ctx, data as { stars: number; count: number }[]);
    }
  }, [type, data, width, height]);

  const drawPie = (ctx: CanvasRenderingContext2D, pieData: PieChartDatum[]) => {
    const total = pieData.reduce((sum, d) => sum + d.value, 0);
    const cx = width / 2;
    const cy = height / 2;
    const radius = Math.min(width, height) / 2 - 20;
    let startAngle = -Math.PI / 2;

    pieData.forEach((datum, index) => {
      const sliceAngle = (datum.value / total) * Math.PI * 2;
      const endAngle = startAngle + sliceAngle;
      const isHover = hoverStateRef.current === index;
      const offset = isHover ? 5 : 0;
      const midAngle = startAngle + sliceAngle / 2;
      const offsetX = Math.cos(midAngle) * offset;
      const offsetY = Math.sin(midAngle) * offset;

      ctx.beginPath();
      ctx.moveTo(cx + offsetX, cy + offsetY);
      ctx.arc(cx + offsetX, cy + offsetY, radius, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = datum.color || PIE_COLORS[index % PIE_COLORS.length];
      ctx.fill();

      startAngle = endAngle;
    });

    ctx.fillStyle = '#333';
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(total), cx, cy);
    ctx.font = '12px sans-serif';
    ctx.fillStyle = '#666';
    ctx.fillText('总数', cx, cy + 22);
  };

  const drawBar = (ctx: CanvasRenderingContext2D, barData: BarChartDatum[]) => {
    const padding = { top: 30, right: 20, bottom: 40, left: 40 };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;
    const barCount = barData.length;
    const barGap = 12;
    const barWidth = barCount > 0 ? (chartW - (barCount - 1) * barGap) / barCount : 0;
    const maxValue = Math.max(...barData.map(d => d.value), 1);

    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding.left, padding.top);
    ctx.lineTo(padding.left, padding.top + chartH);
    ctx.lineTo(padding.left + chartW, padding.top + chartH);
    ctx.stroke();

    ctx.fillStyle = '#999';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';
    for (let i = 0; i <= 4; i++) {
      const y = padding.top + chartH - (chartH / 4) * i;
      ctx.fillText(String(Math.round((maxValue / 4) * i)), padding.left - 8, y + 4);
      if (i > 0) {
        ctx.strokeStyle = '#f0f0f0';
        ctx.beginPath();
        ctx.moveTo(padding.left, y);
        ctx.lineTo(padding.left + chartW, y);
        ctx.stroke();
      }
    }

    barData.forEach((datum, index) => {
      const x = padding.left + index * (barWidth + barGap);
      const barHeight = (datum.value / maxValue) * chartH;
      const y = padding.top + chartH - barHeight;
      const isHover = hoverStateRef.current === index;
      const color = datum.color || PRIMARY_COLOR;

      ctx.fillStyle = isHover ? lightenColor(color, 15) : color;
      ctx.fillRect(x, y, barWidth, barHeight);

      ctx.fillStyle = '#333';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(String(datum.value), x + barWidth / 2, y - 6);

      ctx.fillStyle = '#666';
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(datum.label, x + barWidth / 2, padding.top + chartH + 16);
    });
  };

  const drawLine = (ctx: CanvasRenderingContext2D, lineData: LineChartDatum[]) => {
    const padding = { top: 30, right: 20, bottom: 40, left: 40 };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;
    const count = lineData.length;
    const stepX = count > 1 ? chartW / (count - 1) : 0;
    const maxValue = Math.max(...lineData.map(d => d.value), 1);
    const minValue = Math.min(...lineData.map(d => d.value), 0);
    const valueRange = maxValue - minValue || 1;

    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding.left, padding.top);
    ctx.lineTo(padding.left, padding.top + chartH);
    ctx.lineTo(padding.left + chartW, padding.top + chartH);
    ctx.stroke();

    ctx.fillStyle = '#999';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'right';
    for (let i = 0; i <= 4; i++) {
      const y = padding.top + chartH - (chartH / 4) * i;
      const v = minValue + (valueRange / 4) * i;
      ctx.fillText(String(Math.round(v)), padding.left - 8, y + 4);
      if (i > 0) {
        ctx.strokeStyle = '#f0f0f0';
        ctx.beginPath();
        ctx.moveTo(padding.left, y);
        ctx.lineTo(padding.left + chartW, y);
        ctx.stroke();
      }
    }

    const points = lineData.map((d, i) => ({
      x: padding.left + i * stepX,
      y: padding.top + chartH - ((d.value - minValue) / valueRange) * chartH,
      value: d.value,
      label: d.label,
    }));

    if (points.length > 0) {
      const gradient = ctx.createLinearGradient(0, padding.top, 0, padding.top + chartH);
      gradient.addColorStop(0, PRIMARY_COLOR + '40');
      gradient.addColorStop(1, PRIMARY_COLOR + '05');
      ctx.beginPath();
      ctx.moveTo(points[0].x, padding.top + chartH);
      points.forEach(p => ctx.lineTo(p.x, p.y));
      ctx.lineTo(points[points.length - 1].x, padding.top + chartH);
      ctx.closePath();
      ctx.fillStyle = gradient;
      ctx.fill();

      ctx.beginPath();
      ctx.strokeStyle = PRIMARY_COLOR;
      ctx.lineWidth = 2;
      points.forEach((p, i) => {
        if (i === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      });
      ctx.stroke();

      points.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#fff';
        ctx.fill();
        ctx.strokeStyle = PRIMARY_COLOR;
        ctx.lineWidth = 2;
        ctx.stroke();
      });
    }

    ctx.fillStyle = '#666';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    const labelStep = Math.ceil(count / 6);
    points.forEach((p, i) => {
      if (i % labelStep === 0 || i === count - 1) {
        ctx.fillText(p.label, p.x, padding.top + chartH + 16);
      }
    });

    if (dragStateRef.current.active) {
      const { startX, endX } = dragStateRef.current;
      const x1 = Math.min(startX, endX);
      const x2 = Math.max(startX, endX);
      ctx.fillStyle = 'rgba(25, 118, 210, 0.15)';
      ctx.fillRect(x1, padding.top, x2 - x1, chartH);
      ctx.strokeStyle = PRIMARY_COLOR;
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.strokeRect(x1, padding.top, x2 - x1, chartH);
      ctx.setLineDash([]);
    }
  };

  const drawRating = (ctx: CanvasRenderingContext2D, ratingData: { stars: number; count: number }[]) => {
    const sorted = [...ratingData].sort((a, b) => b.stars - a.stars);
    const maxCount = Math.max(...sorted.map(d => d.count), 1);
    const rowHeight = 32;
    const startY = 15;
    const labelX = 10;
    const barStartX = 80;
    const barMaxWidth = width - barStartX - 80;

    sorted.forEach((datum, index) => {
      const y = startY + index * rowHeight;
      const barWidth = (datum.count / maxCount) * barMaxWidth;

      ctx.fillStyle = '#666';
      ctx.font = '13px sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${datum.stars} 星`, labelX, y + rowHeight / 2);

      const color = datum.stars >= 4 ? PRIMARY_COLOR : datum.stars >= 3 ? SECONDARY_COLOR : '#E53935';
      ctx.fillStyle = hoverStateRef.current === index ? lightenColor(color, 15) : color;
      ctx.beginPath();
      ctx.roundRect(barStartX, y + 6, barWidth, rowHeight - 12, 4);
      ctx.fill();

      ctx.fillStyle = '#333';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(String(datum.count), barStartX + barWidth + 10, y + rowHeight / 2);
    });
  };

  useEffect(() => {
    drawChart();
  }, [drawChart]);

  const getMousePos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const hitTestPie = (x: number, y: number): number => {
    const pieData = data as PieChartDatum[];
    const total = pieData.reduce((sum, d) => sum + d.value, 0);
    const cx = width / 2;
    const cy = height / 2;
    const radius = Math.min(width, height) / 2 - 20;
    const dx = x - cx;
    const dy = y - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > radius || dist < 10) return -1;

    let angle = Math.atan2(dy, dx);
    if (angle < -Math.PI / 2) angle += Math.PI * 2;
    const startAngle = -Math.PI / 2;
    let current = startAngle;

    for (let i = 0; i < pieData.length; i++) {
      const sliceAngle = (pieData[i].value / total) * Math.PI * 2;
      if (angle >= current && angle < current + sliceAngle) {
        return i;
      }
      current += sliceAngle;
    }
    return -1;
  };

  const hitTestBar = (x: number, y: number): number => {
    const barData = data as BarChartDatum[];
    const padding = { top: 30, right: 20, bottom: 40, left: 40 };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;
    const barCount = barData.length;
    const barGap = 12;
    const barWidth = barCount > 0 ? (chartW - (barCount - 1) * barGap) / barCount : 0;
    const maxValue = Math.max(...barData.map(d => d.value), 1);

    for (let i = 0; i < barCount; i++) {
      const bx = padding.left + i * (barWidth + barGap);
      const barHeight = (barData[i].value / maxValue) * chartH;
      const by = padding.top + chartH - barHeight;
      if (x >= bx && x <= bx + barWidth && y >= by && y <= padding.top + chartH) {
        return i;
      }
    }
    return -1;
  };

  const hitTestLine = (x: number, y: number): number => {
    const lineData = data as LineChartDatum[];
    const padding = { top: 30, right: 20, bottom: 40, left: 40 };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;
    const count = lineData.length;
    const stepX = count > 1 ? chartW / (count - 1) : 0;
    const maxValue = Math.max(...lineData.map(d => d.value), 1);
    const minValue = Math.min(...lineData.map(d => d.value), 0);
    const valueRange = maxValue - minValue || 1;

    for (let i = 0; i < count; i++) {
      const px = padding.left + i * stepX;
      const py = padding.top + chartH - ((lineData[i].value - minValue) / valueRange) * chartH;
      if (Math.abs(x - px) <= 8 && Math.abs(y - py) <= 8) {
        return i;
      }
    }
    return -1;
  };

  const hitTestRating = (x: number, y: number): number => {
    const ratingData = data as { stars: number; count: number }[];
    const sorted = [...ratingData].sort((a, b) => b.stars - a.stars);
    const rowHeight = 32;
    const startY = 15;

    for (let i = 0; i < sorted.length; i++) {
      if (y >= startY + i * rowHeight && y <= startY + (i + 1) * rowHeight) {
        return i;
      }
    }
    return -1;
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = getMousePos(e);
    let hitIndex = -1;
    let content: React.ReactNode = null;

    if (type === 'pie') {
      hitIndex = hitTestPie(pos.x, pos.y);
      if (hitIndex >= 0) {
        const d = (data as PieChartDatum[])[hitIndex];
        content = (
          <div>
            <div style={{ fontWeight: 600 }}>{d.label}</div>
            <div style={{ color: '#666', marginTop: 2 }}>
              {d.value}（{((d.value / (data as PieChartDatum[]).reduce((s, x) => s + x.value, 0)) * 100).toFixed(1)}%）
            </div>
          </div>
        );
      }
    } else if (type === 'bar') {
      hitIndex = hitTestBar(pos.x, pos.y);
      if (hitIndex >= 0) {
        const d = (data as BarChartDatum[])[hitIndex];
        content = (
          <div>
            <div style={{ fontWeight: 600 }}>{d.label}</div>
            <div style={{ color: '#666', marginTop: 2 }}>数值: {d.value}</div>
          </div>
        );
      }
    } else if (type === 'line') {
      hitIndex = hitTestLine(pos.x, pos.y);
      if (hitIndex >= 0) {
        const d = (data as LineChartDatum[])[hitIndex];
        content = (
          <div>
            <div style={{ fontWeight: 600 }}>{d.label}</div>
            <div style={{ color: '#666', marginTop: 2 }}>数值: {d.value}</div>
          </div>
        );
      }
      if (dragStateRef.current.active) {
        dragStateRef.current.endX = pos.x;
        drawChart();
      }
    } else if (type === 'rating') {
      hitIndex = hitTestRating(pos.x, pos.y);
      if (hitIndex >= 0) {
        const sorted = [...(data as { stars: number; count: number }[])].sort((a, b) => b.stars - a.stars);
        const d = sorted[hitIndex];
        content = (
          <div>
            <div style={{ fontWeight: 600 }}>{d.stars} 星</div>
            <div style={{ color: '#666', marginTop: 2 }}>数量: {d.count}</div>
          </div>
        );
      }
    }

    hoverStateRef.current = hitIndex;
    drawChart();

    if (hitIndex >= 0 && content) {
      const container = containerRef.current;
      if (container) {
        const containerRect = container.getBoundingClientRect();
        setTooltip({
          visible: true,
          x: e.clientX - containerRect.left + 12,
          y: e.clientY - containerRect.top + 12,
          content,
        });
      }
    } else {
      setTooltip(prev => ({ ...prev, visible: false }));
    }
  };

  const handleMouseLeave = () => {
    hoverStateRef.current = -1;
    setTooltip(prev => ({ ...prev, visible: false }));
    if (dragStateRef.current.active) {
      dragStateRef.current = { active: false, startX: 0, endX: 0 };
    }
    drawChart();
  };

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (type !== 'bar' || !onBarClick) return;
    const pos = getMousePos(e);
    const hitIndex = hitTestBar(pos.x, pos.y);
    if (hitIndex >= 0) {
      onBarClick(hitIndex, (data as BarChartDatum[])[hitIndex]);
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (type !== 'line') return;
    const pos = getMousePos(e);
    dragStateRef.current = { active: true, startX: pos.x, endX: pos.x };
    drawChart();
  };

  const handleMouseUp = () => {
    if (type !== 'line' || !onTimeRangeSelect) return;
    const { active, startX, endX } = dragStateRef.current;
    if (!active) return;

    const padding = { top: 30, right: 20, bottom: 40, left: 40 };
    const chartW = width - padding.left - padding.right;
    const lineData = data as LineChartDatum[];
    const count = lineData.length;
    const stepX = count > 1 ? chartW / (count - 1) : 0;

    const x1 = Math.min(startX, endX);
    const x2 = Math.max(startX, endX);

    if (x2 - x1 < 5) {
      dragStateRef.current = { active: false, startX: 0, endX: 0 };
      drawChart();
      return;
    }

    let startIdx = Math.max(0, Math.floor((x1 - padding.left) / stepX));
    let endIdx = Math.min(count - 1, Math.ceil((x2 - padding.left) / stepX));

    if (startIdx > endIdx) [startIdx, endIdx] = [endIdx, startIdx];

    onTimeRangeSelect(lineData[startIdx].label, lineData[endIdx].label);
    dragStateRef.current = { active: false, startX: 0, endX: 0 };
    drawChart();
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', display: 'inline-block' }}>
      <canvas
        ref={canvasRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        style={{ cursor: type === 'bar' && onBarClick ? 'pointer' : type === 'line' ? 'crosshair' : 'default' }}
      />
      {tooltip.visible && (
        <div
          style={{
            position: 'absolute',
            left: tooltip.x,
            top: tooltip.y,
            background: 'rgba(255,255,255,0.85)',
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
            borderRadius: 8,
            padding: '8px 12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            fontSize: 13,
            pointerEvents: 'none',
            zIndex: 10,
            transform: 'translate(0, -50%)',
          }}
        >
          {tooltip.content}
        </div>
      )}
    </div>
  );
}
