import React, { useEffect, useRef, useState } from 'react';

interface RingProgressProps {
  value: number;
  max: number;
  size?: number;
  strokeWidth?: number;
}

const RingProgress: React.FC<RingProgressProps> = ({ value, max, size = 180, strokeWidth = 14 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number | null>(null);
  const displayRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    ctx.scale(dpr, dpr);

    const targetProgress = max > 0 ? Math.min(1, value / max) : 0;
    const center = size / 2;
    const radius = center - strokeWidth;
    const startAngle = -Math.PI / 2;
    const circumference = 2 * Math.PI * radius;

    const draw = () => {
      ctx.clearRect(0, 0, size, size);

      ctx.beginPath();
      ctx.arc(center, center, radius, 0, 2 * Math.PI);
      ctx.strokeStyle = 'rgba(255,255,255,0.1)';
      ctx.lineWidth = strokeWidth;
      ctx.stroke();

      const gradient = ctx.createLinearGradient(0, 0, size, size);
      gradient.addColorStop(0, '#3498DB');
      gradient.addColorStop(1, '#5DADE2');

      ctx.beginPath();
      ctx.arc(center, center, radius, startAngle, startAngle + 2 * Math.PI * displayRef.current);
      ctx.strokeStyle = gradient;
      ctx.lineWidth = strokeWidth;
      ctx.lineCap = 'round';
      ctx.stroke();

      if (displayRef.current < targetProgress) {
        displayRef.current = Math.min(targetProgress, displayRef.current + 0.02);
        animRef.current = requestAnimationFrame(draw);
      }
    };
    draw();
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [value, max, size, strokeWidth]);

  const percentage = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  const [displayPct, setDisplayPct] = useState(0);

  useEffect(() => {
    const start = displayPct;
    const end = percentage;
    const startTime = performance.now();
    const duration = 800;

    const animate = (now: number) => {
      const t = Math.min(1, (now - startTime) / duration);
      const ease = 1 - Math.pow(1 - t, 3);
      setDisplayPct(Math.round(start + (end - start) * ease));
      if (t < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [percentage]);

  return (
    <div className="relative inline-flex items-center justify-center">
      <canvas ref={canvasRef}></canvas>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-bold text-white tabular-nums">{displayPct}%</span>
        <span className="text-xs text-white/60 mt-1">
          {value.toLocaleString()} / {max.toLocaleString()} 字
        </span>
      </div>
    </div>
  );
};

export default RingProgress;
