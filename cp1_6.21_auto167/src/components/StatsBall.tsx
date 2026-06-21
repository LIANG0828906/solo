import React, { useState, useRef, useEffect } from 'react';
import type { Lens } from '../types';

interface StatsBallProps {
  lenses: Lens[];
}

const COLORS = {
  pending: '#F59E0B',
  approved: '#22C55E',
  reshoot: '#EF4444',
};

const LABELS = {
  pending: '待审核',
  approved: '已通过',
  reshoot: '需补拍',
};

const StatsBall: React.FC<StatsBallProps> = ({ lenses }) => {
  const [expanded, setExpanded] = useState(false);
  const [hovered, setHovered] = useState<'pending' | 'approved' | 'reshoot' | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const counts = {
    pending: lenses.filter((l) => l.status === 'pending').length,
    approved: lenses.filter((l) => l.status === 'approved').length,
    reshoot: lenses.filter((l) => l.status === 'reshoot').length,
  };
  const total = lenses.length;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !expanded) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const size = 200;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    ctx.scale(dpr, dpr);

    const cx = size / 2;
    const cy = size / 2;
    const outerR = 78;
    const lineWidth = 8;
    const gap = 1 * (Math.PI / 180);

    ctx.clearRect(0, 0, size, size);

    if (total === 0) {
      ctx.beginPath();
      ctx.arc(cx, cy, outerR - lineWidth / 2, 0, Math.PI * 2);
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = lineWidth;
      ctx.stroke();
      return;
    }

    let startAngle = -Math.PI / 2;
    const order: ('pending' | 'approved' | 'reshoot')[] = ['pending', 'approved', 'reshoot'];

    order.forEach((key) => {
      const count = counts[key];
      if (count === 0) return;
      const portion = count / total;
      const sweepAngle = portion * Math.PI * 2 - gap;
      const isHovered = hovered === key;
      const radius = isHovered ? outerR + 5 : outerR;

      ctx.beginPath();
      ctx.arc(cx, cy, radius - lineWidth / 2, startAngle, startAngle + sweepAngle);
      ctx.strokeStyle = COLORS[key];
      ctx.lineWidth = lineWidth;
      ctx.lineCap = 'butt';
      ctx.stroke();

      if (isHovered) {
        ctx.save();
        const midAngle = startAngle + sweepAngle / 2;
        const labelR = radius + 18;
        const lx = cx + Math.cos(midAngle) * labelR;
        const ly = cy + Math.sin(midAngle) * labelR;
        ctx.fillStyle = '#0F172A';
        ctx.strokeStyle = COLORS[key];
        ctx.lineWidth = 1.5;
        const text = `${LABELS[key]}: ${count}`;
        ctx.font = '600 12px sans-serif';
        const metrics = ctx.measureText(text);
        const tw = metrics.width + 14;
        const th = 22;
        roundRect(ctx, lx - tw / 2, ly - th / 2, tw, th, 6);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#F8FAFC';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, lx, ly);
        ctx.restore();
      }

      startAngle += sweepAngle + gap;
    });
  }, [expanded, counts, total, hovered]);

  const handleCanvasMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!total) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const x = e.clientX - rect.left - cx;
    const y = e.clientY - rect.top - cy;
    const r = Math.sqrt(x * x + y * y);
    if (r < 60 || r > 95) {
      setHovered(null);
      return;
    }
    let angle = Math.atan2(y, x) + Math.PI / 2;
    if (angle < 0) angle += Math.PI * 2;

    let startAngle = 0;
    const gap = 1 * (Math.PI / 180);
    const order: ('pending' | 'approved' | 'reshoot')[] = ['pending', 'approved', 'reshoot'];
    let found: 'pending' | 'approved' | 'reshoot' | null = null;
    for (const key of order) {
      const count = counts[key];
      if (count === 0) continue;
      const portion = count / total;
      const sweep = portion * Math.PI * 2 - gap;
      if (angle >= startAngle && angle <= startAngle + sweep) {
        found = key;
        break;
      }
      startAngle += sweep + gap;
    }
    setHovered(found);
  };

  return (
    <div
      style={{
        position: 'fixed',
        right: 20,
        bottom: 20,
        zIndex: 50,
      }}
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => {
        setExpanded(false);
        setHovered(null);
      }}
    >
      {expanded && (
        <div
          className="slide-in-right"
          style={{
            position: 'absolute',
            right: 0,
            bottom: 72,
            background: 'rgba(15, 23, 42, 0.95)',
            border: '2px solid #334155',
            borderRadius: 16,
            padding: 16,
            width: 240,
            backdropFilter: 'blur(8px)',
          }}
        >
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: '#F8FAFC',
              marginBottom: 4,
              textAlign: 'center',
            }}
          >
            剪辑进度统计
          </div>
          <div
            style={{
              fontSize: 11,
              color: '#94A3B8',
              textAlign: 'center',
              marginBottom: 8,
            }}
          >
            共 {total} 个镜头
          </div>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <canvas
              ref={canvasRef}
              onMouseMove={handleCanvasMove}
              onMouseLeave={() => setHovered(null)}
              style={{ cursor: 'pointer' }}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 }}>
            {(['pending', 'approved', 'reshoot'] as const).map((key) => (
              <div
                key={key}
                onMouseEnter={() => setHovered(key)}
                onMouseLeave={() => setHovered(null)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '6px 8px',
                  borderRadius: 6,
                  background: hovered === key ? '#1E293B' : 'transparent',
                  transition: 'background 0.2s ease',
                  cursor: 'pointer',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: COLORS[key],
                    }}
                  />
                  <span style={{ fontSize: 12, color: '#CBD5E1' }}>{LABELS[key]}</span>
                </div>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#F8FAFC' }}>
                  {counts[key]}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
      <div
        className="breathe-anim"
        style={{
          width: 64,
          height: 64,
          borderRadius: '50% 50% 50% 0',
          transform: 'rotate(-45deg)',
          background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'transform 0.3s ease',
        }}
      >
        <div
          style={{
            transform: 'rotate(45deg)',
            color: '#fff',
            fontSize: 16,
            fontWeight: 700,
            textAlign: 'center',
            lineHeight: 1.1,
          }}
        >
          <div>{counts.approved}</div>
          <div style={{ fontSize: 11, opacity: 0.9 }}>/ {total}</div>
        </div>
      </div>
    </div>
  );
};

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

export default StatsBall;
