import React, { useRef, useEffect, useState, useCallback } from 'react';

interface TrendPoint {
  time_slot: string;
  vote_count: number;
}

interface TrendChartProps {
  data: TrendPoint[];
}

export default function TrendChart({ data }: TrendChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animProgressRef = useRef(0);
  const animFrameRef = useRef<number>(0);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; time: string; value: number } | null>(null);

  const draw = useCallback((progress: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;
    const padLeft = 50;
    const padRight = 20;
    const padTop = 20;
    const padBottom = 40;
    const chartW = w - padLeft - padRight;
    const chartH = h - padTop - padBottom;

    ctx.clearRect(0, 0, w, h);

    const slots = generateTimeSlots();
    const dataMap = new Map(data.map((d) => [d.time_slot, d.vote_count]));
    const values = slots.map((s) => dataMap.get(s) || 0);
    const maxVal = Math.max(10, ...values);

    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
      const y = padTop + (chartH / 5) * i;
      ctx.beginPath();
      ctx.moveTo(padLeft, y);
      ctx.lineTo(padLeft + chartW, y);
      ctx.stroke();

      ctx.fillStyle = '#999';
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(Math.round(maxVal - (maxVal / 5) * i).toString(), padLeft - 8, y + 4);
    }

    ctx.fillStyle = '#999';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    slots.forEach((slot, i) => {
      const x = padLeft + (chartW / (slots.length - 1)) * i;
      const hour = slot.split(' ')[1]?.slice(0, 5) || '';
      if (i % 2 === 0) {
        ctx.fillText(hour, x, h - 8);
      }
    });

    if (values.length < 2) return;

    const points = values.map((v, i) => ({
      x: padLeft + (chartW / (values.length - 1)) * i,
      y: padTop + chartH - (v / maxVal) * chartH,
    }));

    const drawCount = Math.max(2, Math.ceil(points.length * progress));

    const gradient = ctx.createLinearGradient(padLeft, padTop, padLeft + chartW, padTop);
    gradient.addColorStop(0, '#2D7D9A');
    gradient.addColorStop(1, '#F4A261');

    ctx.beginPath();
    ctx.strokeStyle = gradient;
    ctx.lineWidth = 2.5;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    for (let i = 0; i < drawCount; i++) {
      if (i === 0) {
        ctx.moveTo(points[i].x, points[i].y);
      } else {
        ctx.lineTo(points[i].x, points[i].y);
      }
    }
    ctx.stroke();

    if (progress >= 1) {
      const fillGrad = ctx.createLinearGradient(0, padTop, 0, padTop + chartH);
      fillGrad.addColorStop(0, 'rgba(45,125,154,0.15)');
      fillGrad.addColorStop(1, 'rgba(45,125,154,0)');
      ctx.beginPath();
      ctx.moveTo(points[0].x, padTop + chartH);
      points.forEach((p) => ctx.lineTo(p.x, p.y));
      ctx.lineTo(points[points.length - 1].x, padTop + chartH);
      ctx.closePath();
      ctx.fillStyle = fillGrad;
      ctx.fill();

      points.forEach((p, i) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
        ctx.fillStyle = '#2D7D9A';
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      });
    }
  }, [data]);

  useEffect(() => {
    animProgressRef.current = 0;
    const startTime = performance.now();
    const duration = 1000;

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      animProgressRef.current = progress;
      draw(progress);
      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(animate);
      }
    };
    animFrameRef.current = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animFrameRef.current);
  }, [draw]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;

    const slots = generateTimeSlots();
    const dataMap = new Map(data.map((d) => [d.time_slot, d.vote_count]));
    const values = slots.map((s) => dataMap.get(s) || 0);
    const maxVal = Math.max(10, ...values);

    const padLeft = 50;
    const padRight = 20;
    const chartW = rect.width - padLeft - padRight;
    const padTop = 20;
    const chartH = rect.height - padTop - 40;

    let closestIdx = -1;
    let closestDist = Infinity;
    values.forEach((_, i) => {
      const x = padLeft + (chartW / (values.length - 1)) * i;
      const dist = Math.abs(mx - x);
      if (dist < closestDist) {
        closestDist = dist;
        closestIdx = i;
      }
    });

    if (closestIdx >= 0 && closestDist < 20) {
      const x = padLeft + (chartW / (values.length - 1)) * closestIdx;
      const y = padTop + chartH - (values[closestIdx] / maxVal) * chartH;
      const hour = slots[closestIdx].split(' ')[1]?.slice(0, 5) || '';
      setTooltip({ x, y, time: hour, value: values[closestIdx] });
    } else {
      setTooltip(null);
    }
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: '100%' }}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setTooltip(null)}
      />
      {tooltip && (
        <div style={{
          position: 'absolute',
          left: tooltip.x,
          top: tooltip.y - 36,
          background: '#2D7D9A',
          color: '#fff',
          padding: '4px 10px',
          borderRadius: 6,
          fontSize: 12,
          pointerEvents: 'none',
          transform: 'translateX(-50%)',
          whiteSpace: 'nowrap',
        }}>
          {tooltip.time} | {tooltip.value}票
        </div>
      )}
    </div>
  );
}

function generateTimeSlots(): string[] {
  const slots: string[] = [];
  const now = new Date();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 2 * 3600000);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const h = String(d.getHours()).padStart(2, '0');
    slots.push(`${y}-${m}-${day} ${h}:00`);
  }
  return slots;
}
