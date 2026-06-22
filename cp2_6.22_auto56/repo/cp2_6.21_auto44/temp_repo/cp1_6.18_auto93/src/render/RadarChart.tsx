import React, { useRef, useEffect, useCallback } from 'react';
import { PropertyValue, PropertyType, PROPERTY_CONFIG } from '../types';

interface RadarChartProps {
  properties: PropertyValue[];
  size?: number;
}

interface AnimState {
  current: number[];
  target: number[];
  startTime: number | null;
  rafId: number | null;
}

const ANIM_DURATION = 300;
const LABELS = Object.values(PropertyType).map((t) => PROPERTY_CONFIG[t].label);

function easeOut(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

function drawRadar(
  ctx: CanvasRenderingContext2D,
  size: number,
  values: number[]
) {
  const cx = size / 2;
  const cy = size / 2;
  const maxR = size * 0.36;
  const sides = 5;
  const angleStep = (Math.PI * 2) / sides;
  const startAngle = -Math.PI / 2;

  ctx.clearRect(0, 0, size, size);

  ctx.fillStyle = '#0D0D1A';
  ctx.fillRect(0, 0, size, size);

  for (let ring = 1; ring <= 5; ring++) {
    const r = (maxR * ring) / 5;
    ctx.beginPath();
    for (let i = 0; i <= sides; i++) {
      const angle = startAngle + i * angleStep;
      const x = cx + r * Math.cos(angle);
      const y = cy + r * Math.sin(angle);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.strokeStyle = '#3A3A52';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  for (let i = 0; i < sides; i++) {
    const angle = startAngle + i * angleStep;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + maxR * Math.cos(angle), cy + maxR * Math.sin(angle));
    ctx.strokeStyle = '#3A3A52';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  if (values.length === 5) {
    ctx.beginPath();
    for (let i = 0; i <= sides; i++) {
      const idx = i % sides;
      const angle = startAngle + idx * angleStep;
      const r = (values[idx] / 100) * maxR;
      const x = cx + r * Math.cos(angle);
      const y = cy + r * Math.sin(angle);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxR);
    gradient.addColorStop(0, 'rgba(108, 122, 137, 0.35)');
    gradient.addColorStop(1, 'rgba(52, 152, 219, 0.15)');
    ctx.fillStyle = gradient;
    ctx.fill();
    ctx.strokeStyle = 'rgba(108, 122, 137, 0.8)';
    ctx.lineWidth = 2;
    ctx.stroke();

    for (let i = 0; i < sides; i++) {
      const angle = startAngle + i * angleStep;
      const r = (values[i] / 100) * maxR;
      const x = cx + r * Math.cos(angle);
      const y = cy + r * Math.sin(angle);
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#6C7A89';
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }

  ctx.font = '12px Arial';
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (let i = 0; i < sides; i++) {
    const angle = startAngle + i * angleStep;
    const labelR = maxR + 28;
    const x = cx + labelR * Math.cos(angle);
    const y = cy + labelR * Math.sin(angle);
    ctx.fillText(LABELS[i], x, y);
  }
}

const RadarChart: React.FC<RadarChartProps> = ({ properties, size = 500 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<AnimState>({
    current: [0, 0, 0, 0, 0],
    target: [0, 0, 0, 0, 0],
    startTime: null,
    rafId: null,
  });

  const animate = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      const anim = animRef.current;
      if (anim.rafId) cancelAnimationFrame(anim.rafId);

      const from = [...anim.current];
      const to = [...anim.target];
      const start = performance.now();

      const step = (now: number) => {
        const elapsed = now - start;
        const t = Math.min(elapsed / ANIM_DURATION, 1);
        const eased = easeOut(t);

        const interpolated = from.map((v, i) => v + (to[i] - v) * eased);
        anim.current = interpolated;

        drawRadar(ctx, size, interpolated);

        if (t < 1) {
          anim.rafId = requestAnimationFrame(step);
        } else {
          anim.rafId = null;
        }
      };

      anim.rafId = requestAnimationFrame(step);
    },
    [size]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const targetValues = properties.map((p) => p.value);
    animRef.current.target = targetValues;
    animate(ctx);
  }, [properties, animate]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    drawRadar(ctx, size, animRef.current.current);
  }, [size]);

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      style={{ display: 'block', margin: '0 auto' }}
    />
  );
};

export default RadarChart;
