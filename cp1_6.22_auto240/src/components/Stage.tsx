import { useEffect, useRef, useCallback } from 'react';
import { ActiveWave, Highlight, Ripple, BeatPoint, TRACK_COLORS } from '../types';
import { v4 as uuidv4 } from 'uuid';

interface StageProps {
  radius: number;
  waves: ActiveWave[];
  highlights: Highlight[];
  ripples: Ripple[];
  beatPoints: BeatPoint[];
  editingMode: boolean;
  showSectors: boolean;
  onRippleEnd: (id: string) => void;
  onClick: (x: number, y: number, clientX: number, clientY: number) => void;
}

const SECTOR_COUNT = 12;
const CANVAS_SIZE = 800;
const PADDING = 60;

export function Stage({
  radius,
  waves,
  highlights,
  ripples,
  beatPoints,
  editingMode,
  showSectors,
  onRippleEnd,
  onClick,
}: StageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const w = CANVAS_SIZE + PADDING * 2;
    const h = CANVAS_SIZE + PADDING * 2;

    if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    const cx = w / 2;
    const cy = h / 2;
    const now = performance.now();

    ctx.clearRect(0, 0, w, h);

    if (showSectors || editingMode) {
      ctx.save();
      for (let i = 0; i < SECTOR_COUNT; i++) {
        const angle = (i / SECTOR_COUNT) * Math.PI * 2 - Math.PI / 2;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(
          cx + Math.cos(angle) * (radius + 40),
          cy + Math.sin(angle) * (radius + 40)
        );
        ctx.strokeStyle = editingMode ? 'rgba(255, 165, 2, 0.15)' : 'rgba(255, 255, 255, 0.04)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      ctx.restore();
    }

    {
      const gradient = ctx.createRadialGradient(cx, cy, radius * 0.3, cx, cy, radius);
      gradient.addColorStop(0, 'rgba(255, 255, 255, 0.02)');
      gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();
    }

    {
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 2;
      ctx.shadowColor = 'rgba(255, 255, 255, 0.08)';
      ctx.shadowBlur = 20;
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    for (const hl of highlights) {
      const elapsed = now - hl.startTime;
      const progress = Math.max(0, Math.min(1, elapsed / hl.duration));
      const alpha = 1 - progress;
      const startAngle = (hl.sector / SECTOR_COUNT) * Math.PI * 2 - Math.PI / 2 - Math.PI / SECTOR_COUNT;
      const endAngle = startAngle + (Math.PI * 2) / SECTOR_COUNT;

      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, radius + 2, startAngle, endAngle);
      ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.9})`;
      ctx.lineWidth = 8;
      ctx.shadowColor = `rgba(255, 255, 255, ${alpha * 0.8})`;
      ctx.shadowBlur = 24;
      ctx.stroke();
      ctx.restore();
    }

    if (editingMode) {
      for (const bp of beatPoints) {
        const angle = (bp.sector / SECTOR_COUNT) * Math.PI * 2 - Math.PI / 2;
        const radiusRatio = Math.min(1, bp.time / 30000);
        const r = 80 + radiusRatio * (radius - 100);
        const x = cx + Math.cos(angle) * r;
        const y = cy + Math.sin(angle) * r;
        const color = TRACK_COLORS[bp.track];

        ctx.beginPath();
        ctx.arc(x, y, 6, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#FFFFFF';
        ctx.fill();
      }
    }

    for (const wave of waves) {
      const elapsed = now - wave.startTime;
      const progress = Math.max(0, Math.min(1, elapsed / wave.duration));
      const r = wave.startRadius + (wave.endRadius - wave.startRadius) * progress;

      const arrivalProgress = Math.max(0, Math.min(1, (elapsed - wave.duration * 0.9) / (wave.duration * 0.1)));
      const isArriving = arrivalProgress > 0 && !wave.hit;

      const baseAlpha = wave.hit ? Math.max(0, 1 - (elapsed - wave.startTime - wave.duration * 0.3) / 300) : 0.85;
      const glowIntensity = isArriving ? arrivalProgress : 0;

      const lineWidth = wave.hit ? Math.max(1, 4 * (1 - progress)) : 3 + glowIntensity * 3;

      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);

      const gradient = ctx.createRadialGradient(cx, cy, r - 5, cx, cy, r + 5);
      gradient.addColorStop(0, `${wave.color}00`);
      gradient.addColorStop(0.5, wave.color);
      gradient.addColorStop(1, `${wave.color}00`);

      ctx.strokeStyle = wave.color;
      ctx.globalAlpha = baseAlpha;
      ctx.lineWidth = lineWidth;
      ctx.shadowColor = wave.color;
      ctx.shadowBlur = isArriving ? 25 + glowIntensity * 25 : 12;
      ctx.stroke();

      if (isArriving && !wave.hit) {
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255, 255, 255, ${glowIntensity * 0.6})`;
        ctx.lineWidth = 2;
        ctx.shadowColor = '#FFFFFF';
        ctx.shadowBlur = 20;
        ctx.stroke();
      }

      ctx.restore();
    }

    for (const ripple of ripples) {
      const elapsed = now - ripple.startTime;
      const progress = Math.max(0, Math.min(1, elapsed / ripple.duration));
      if (progress >= 1) {
        onRippleEnd(ripple.id);
        continue;
      }
      const r = ripple.radius + (ripple.maxRadius - ripple.radius) * progress;
      const alpha = 1 - progress;

      ctx.beginPath();
      ctx.arc(ripple.x, ripple.y, r, 0, Math.PI * 2);
      ctx.strokeStyle = ripple.color;
      ctx.globalAlpha = alpha * 0.8;
      ctx.lineWidth = 3;
      ctx.shadowColor = ripple.color;
      ctx.shadowBlur = 15;
      ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
    }

    {
      ctx.beginPath();
      ctx.arc(cx, cy, 30, 0, Math.PI * 2);
      const innerGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 30);
      innerGrad.addColorStop(0, 'rgba(110, 86, 255, 0.4)');
      innerGrad.addColorStop(1, 'rgba(110, 86, 255, 0.05)');
      ctx.fillStyle = innerGrad;
      ctx.fill();
      ctx.strokeStyle = 'rgba(110, 86, 255, 0.35)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    {
      ctx.beginPath();
      ctx.arc(cx, cy, 8, 0, Math.PI * 2);
      ctx.fillStyle = '#FFFFFF';
      ctx.shadowColor = '#6e56ff';
      ctx.shadowBlur = 15;
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    animRef.current = requestAnimationFrame(draw);
  }, [radius, waves, highlights, ripples, beatPoints, editingMode, showSectors, onRippleEnd]);

  useEffect(() => {
    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [draw]);

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = (CANVAS_SIZE + PADDING * 2) / rect.width;
    const scaleY = (CANVAS_SIZE + PADDING * 2) / rect.height;
    const canvasX = (e.clientX - rect.left) * scaleX;
    const canvasY = (e.clientY - rect.top) * scaleY;
    const cx = (CANVAS_SIZE + PADDING * 2) / 2;
    const cy = (CANVAS_SIZE + PADDING * 2) / 2;
    onClick(canvasX - cx, canvasY - cy, e.clientX, e.clientY);
  };

  const handleTouch = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const touch = e.touches[0] || e.changedTouches[0];
    if (!touch) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = (CANVAS_SIZE + PADDING * 2) / rect.width;
    const scaleY = (CANVAS_SIZE + PADDING * 2) / rect.height;
    const canvasX = (touch.clientX - rect.left) * scaleX;
    const canvasY = (touch.clientY - rect.top) * scaleY;
    const cx = (CANVAS_SIZE + PADDING * 2) / 2;
    const cy = (CANVAS_SIZE + PADDING * 2) / 2;
    onClick(canvasX - cx, canvasY - cy, touch.clientX, touch.clientY);
  };

  return (
    <div className="stage-wrapper">
      <canvas
        ref={canvasRef}
        className="stage-canvas"
        onClick={handleClick}
        onTouchStart={handleTouch}
        style={{ touchAction: 'none' }}
      />
    </div>
  );
}

export function createRipple(x: number, y: number, color: string): Ripple {
  return {
    id: uuidv4(),
    x,
    y,
    radius: 5,
    maxRadius: 60,
    startTime: performance.now(),
    duration: 300,
    color,
  };
}

export const STAGE_CANVAS_CENTER = {
  x: (CANVAS_SIZE + PADDING * 2) / 2,
  y: (CANVAS_SIZE + PADDING * 2) / 2,
};
