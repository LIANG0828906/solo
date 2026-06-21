import React, { useRef, useEffect, useState } from 'react';
import { DailyStats } from '../types';

interface LineChartProps {
  data: DailyStats[];
  width?: number;
  height?: number;
}

const formatShortDate = (dateStr: string): string => {
  const parts = dateStr.split('-');
  return `${parts[1]}/${parts[2]}`;
};

const LineChart: React.FC<LineChartProps> = ({ data, width = 400, height = 250 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; text: string } | null>(null);
  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;

  const padding = { top: 20, right: 20, bottom: 36, left: 36 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#0F172A';
    const r = 12;
    ctx.beginPath();
    ctx.moveTo(r, 0);
    ctx.lineTo(width - r, 0);
    ctx.quadraticCurveTo(width, 0, width, r);
    ctx.lineTo(width, height - r);
    ctx.quadraticCurveTo(width, height, width - r, height);
    ctx.lineTo(r, height);
    ctx.quadraticCurveTo(0, height, 0, height - r);
    ctx.lineTo(0, r);
    ctx.quadraticCurveTo(0, 0, r, 0);
    ctx.closePath();
    ctx.fill();

    if (data.length === 0) return;

    const maxVal = Math.max(...data.map((d) => d.count), 1);
    const xStep = data.length > 1 ? chartW / (data.length - 1) : 0;

    const pointPositions = data.map((d, i) => {
      const x = padding.left + (data.length > 1 ? i * xStep : chartW / 2);
      const y = padding.top + chartH - (d.count / maxVal) * chartH;
      return { x, y, value: d.count, date: d.date };
    });

    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    ctx.font = '11px sans-serif';
    ctx.fillStyle = '#94A3B8';
    ctx.textAlign = 'center';

    const gridLines = 4;
    for (let i = 0; i <= gridLines; i++) {
      const y = padding.top + (chartH / gridLines) * i;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();
      const val = Math.round(maxVal - (maxVal / gridLines) * i);
      ctx.textAlign = 'right';
      ctx.fillText(String(val), padding.left - 8, y + 4);
    }

    ctx.textAlign = 'center';
    data.forEach((d, i) => {
      const x = padding.left + (data.length > 1 ? i * xStep : chartW / 2);
      ctx.fillText(formatShortDate(d.date), x, height - padding.bottom + 20);
    });

    if (pointPositions.length >= 2) {
      const gradient = ctx.createLinearGradient(0, padding.top, 0, padding.top + chartH);
      gradient.addColorStop(0, 'rgba(139, 92, 246, 0.3)');
      gradient.addColorStop(1, 'rgba(139, 92, 246, 0)');

      ctx.beginPath();
      ctx.moveTo(pointPositions[0].x, padding.top + chartH);
      pointPositions.forEach((p) => ctx.lineTo(p.x, p.y));
      ctx.lineTo(pointPositions[pointPositions.length - 1].x, padding.top + chartH);
      ctx.closePath();
      ctx.fillStyle = gradient;
      ctx.fill();

      ctx.beginPath();
      ctx.strokeStyle = '#8B5CF6';
      ctx.lineWidth = 2.5;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      pointPositions.forEach((p, i) => {
        if (i === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      });
      ctx.stroke();
    }

    pointPositions.forEach((p) => {
      ctx.beginPath();
      ctx.fillStyle = '#A78BFA';
      ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#0F172A';
      ctx.lineWidth = 2;
      ctx.stroke();
    });

    (canvas as any)._pointPositions = pointPositions;
  }, [data, width, height, dpr, chartW, chartH, padding.left, padding.right, padding.top, padding.bottom]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const points: { x: number; y: number; value: number; date: string }[] =
      (canvas as any)._pointPositions || [];

    let found: { x: number; y: number; value: number; date: string } | null = null;
    for (const p of points) {
      const dx = mx - p.x;
      const dy = my - p.y;
      if (Math.sqrt(dx * dx + dy * dy) <= 12) {
        found = p;
        break;
      }
    }

    if (found) {
      setTooltip({
        x: found.x,
        y: found.y - 8,
        text: `${formatShortDate(found.date)}: ${found.value} 条`,
      });
    } else {
      setTooltip(null);
    }
  };

  const handleMouseLeave = () => setTooltip(null);

  return (
    <div className="chart-wrapper" ref={wrapperRef} style={{ width, height }}>
      <canvas
        ref={canvasRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{ display: 'block', borderRadius: '12px' }}
      />
      {tooltip && (
        <div
          className="chart-tooltip"
          style={{
            left: tooltip.x,
            top: tooltip.y,
            transform: 'translate(-50%, -100%)',
          }}
        >
          {tooltip.text}
        </div>
      )}
    </div>
  );
};

export default LineChart;
