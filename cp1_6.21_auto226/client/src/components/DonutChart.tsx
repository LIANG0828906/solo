import React, { useRef, useEffect, useState } from 'react';
import { StatusStats, STATUS_COLORS, InspirationStatus } from '../types';

interface DonutChartProps {
  data: StatusStats;
  size?: number;
}

const DonutChart: React.FC<DonutChartProps> = ({ data, size = 200 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; text: string } | null>(null);
  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;

  const SLICE_COLORS: Record<InspirationStatus, string> = {
    '进行中': '#6366F1',
    '已实现': '#8B5CF6',
    '已归档': '#A78BFA',
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, size, size);
    ctx.fillStyle = '#0F172A';
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
    ctx.fill();

    const entries: { status: InspirationStatus; value: number }[] = [
      { status: '进行中', value: data['进行中'] || 0 },
      { status: '已实现', value: data['已实现'] || 0 },
      { status: '已归档', value: data['已归档'] || 0 },
    ];
    const total = entries.reduce((sum, e) => sum + e.value, 0);

    const cx = size / 2;
    const cy = size / 2;
    const outerR = size / 2 - 4;
    const innerR = size * 0.32;

    const sliceInfo: {
      startAngle: number;
      endAngle: number;
      status: InspirationStatus;
      value: number;
    }[] = [];

    if (total > 0) {
      let currentAngle = -Math.PI / 2;
      entries.forEach((entry) => {
        if (entry.value > 0) {
          const sliceAngle = (entry.value / total) * Math.PI * 2;
          const startAngle = currentAngle;
          const endAngle = currentAngle + sliceAngle;

          const gradient = ctx.createRadialGradient(cx, cy, innerR, cx, cy, outerR);
          gradient.addColorStop(0, SLICE_COLORS[entry.status]);
          gradient.addColorStop(1, adjustBrightness(SLICE_COLORS[entry.status], 20));

          ctx.beginPath();
          ctx.arc(cx, cy, outerR, startAngle, endAngle);
          ctx.arc(cx, cy, innerR, endAngle, startAngle, true);
          ctx.closePath();
          ctx.fillStyle = gradient;
          ctx.fill();

          ctx.strokeStyle = '#0F172A';
          ctx.lineWidth = 2;
          ctx.stroke();

          sliceInfo.push({ startAngle, endAngle, status: entry.status, value: entry.value });
          currentAngle = endAngle;
        }
      });
    } else {
      ctx.beginPath();
      ctx.arc(cx, cy, outerR, 0, Math.PI * 2);
      ctx.arc(cx, cy, innerR, 0, Math.PI * 2, true);
      ctx.closePath();
      ctx.fillStyle = '#1E293B';
      ctx.fill();
    }

    ctx.fillStyle = '#E2E8F0';
    ctx.font = 'bold 22px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(total), cx, cy - 8);
    ctx.fillStyle = '#94A3B8';
    ctx.font = '11px sans-serif';
    ctx.fillText('总灵感', cx, cy + 14);

    (canvas as any)._sliceInfo = sliceInfo;
    (canvas as any)._cx = cx;
    (canvas as any)._cy = cy;
    (canvas as any)._outerR = outerR;
    (canvas as any)._innerR = innerR;
  }, [data, size, dpr]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    const cx = (canvas as any)._cx;
    const cy = (canvas as any)._cy;
    const outerR = (canvas as any)._outerR;
    const innerR = (canvas as any)._innerR;
    const slices = (canvas as any)._sliceInfo || [];

    const dx = mx - cx;
    const dy = my - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist >= innerR && dist <= outerR) {
      let angle = Math.atan2(dy, dx);
      if (angle < -Math.PI / 2) angle += Math.PI * 2;

      for (const s of slices) {
        let start = s.startAngle;
        let end = s.endAngle;
        if (start < -Math.PI / 2) start += Math.PI * 2;
        if (end < -Math.PI / 2) end += Math.PI * 2;

        if (angle >= start && angle <= end) {
          const pct = Math.round((s.value / (data['进行中'] + data['已实现'] + data['已归档'])) * 100);
          setTooltip({
            x: mx,
            y: my - 8,
            text: `${s.status}: ${s.value} (${pct}%)`,
          });
          return;
        }
      }
    }
    setTooltip(null);
  };

  const handleMouseLeave = () => setTooltip(null);

  const entries = Object.entries(STATUS_COLORS) as [InspirationStatus, string][];

  return (
    <div>
      <div className="chart-wrapper" ref={wrapperRef} style={{ width: size, height: size }}>
        <canvas
          ref={canvasRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          style={{ display: 'block', borderRadius: '50%' }}
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
      <div className="chart-legend">
        {entries.map(([status, color]) => (
          <div key={status} className="legend-item">
            <span className="legend-dot" style={{ backgroundColor: SLICE_COLORS[status] }} />
            <span>{status}</span>
            <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
              {data[status] || 0}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

function adjustBrightness(hex: string, amount: number): string {
  const r = Math.min(255, Math.max(0, parseInt(hex.slice(1, 3), 16) + amount));
  const g = Math.min(255, Math.max(0, parseInt(hex.slice(3, 5), 16) + amount));
  const b = Math.min(255, Math.max(0, parseInt(hex.slice(5, 7), 16) + amount));
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

export default DonutChart;
