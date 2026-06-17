import { useEffect, useRef } from 'react';
import type { Nutrients } from '../data/foods';
import {
  NUTRIENT_ORDER,
  NUTRIENT_LABELS,
  DRV,
  calculatePercentage,
} from '../utils/nutrition';

interface RadarChartProps {
  nutrients: Nutrients;
  size?: number;
}

export function RadarChart({ nutrients, size = 200 }: RadarChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, size, size);

    const cx = size / 2;
    const cy = size / 2;
    const radius = size * 0.35;
    const angleStep = (Math.PI * 2) / NUTRIENT_ORDER.length;
    const startAngle = -Math.PI / 2;

    const levels = 5;
    for (let level = 1; level <= levels; level++) {
      const r = (radius * level) / levels;
      ctx.beginPath();
      for (let i = 0; i < NUTRIENT_ORDER.length; i++) {
        const angle = startAngle + i * angleStep;
        const x = cx + r * Math.cos(angle);
        const y = cy + r * Math.sin(angle);
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.closePath();
      ctx.strokeStyle = level === levels ? '#2D2D44' : '#252538';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    for (let i = 0; i < NUTRIENT_ORDER.length; i++) {
      const angle = startAngle + i * angleStep;
      const x2 = cx + radius * Math.cos(angle);
      const y2 = cy + radius * Math.sin(angle);

      const gradient = ctx.createLinearGradient(cx, cy, x2, y2);
      gradient.addColorStop(0, '#4A4A6A');
      gradient.addColorStop(1, '#2D2D44');

      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(x2, y2);
      ctx.strokeStyle = gradient;
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    const percentages = calculatePercentage(nutrients);
    const clampedPercentages = NUTRIENT_ORDER.map((key) => {
      const p = percentages[key] / 100;
      return { key, value: p, raw: percentages[key] };
    });

    ctx.beginPath();
    clampedPercentages.forEach((item, i) => {
      const angle = startAngle + i * angleStep;
      const r = radius * Math.min(item.value, 1);
      const x = cx + r * Math.cos(angle);
      const y = cy + r * Math.sin(angle);
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.closePath();
    ctx.fillStyle = '#4ECDC44D';
    ctx.fill();
    ctx.strokeStyle = '#4ECDC4';
    ctx.lineWidth = 2;
    ctx.stroke();

    clampedPercentages.forEach((item, i) => {
      const angle = startAngle + i * angleStep;
      const r = radius * Math.min(item.value, 1);
      const x = cx + r * Math.cos(angle);
      const y = cy + r * Math.sin(angle);
      const isOver = item.raw > 100;

      ctx.beginPath();
      ctx.arc(x, y, isOver ? 5 : 3.5, 0, Math.PI * 2);
      ctx.fillStyle = isOver ? '#FF4757' : '#4ECDC4';
      ctx.fill();
      if (isOver) {
        ctx.strokeStyle = '#FF4757';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    });

    ctx.font = `${Math.max(10, size * 0.055)}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
    ctx.fillStyle = '#A0A0B0';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    clampedPercentages.forEach((item, i) => {
      const angle = startAngle + i * angleStep;
      const labelR = radius + size * 0.11;
      const x = cx + labelR * Math.cos(angle);
      const y = cy + labelR * Math.sin(angle);

      let align: CanvasTextAlign = 'center';
      let baseline: CanvasTextBaseline = 'middle';
      const cosA = Math.cos(angle);
      const sinA = Math.sin(angle);

      if (cosA > 0.3) align = 'left';
      else if (cosA < -0.3) align = 'right';

      if (sinA < -0.3) baseline = 'bottom';
      else if (sinA > 0.3) baseline = 'top';

      ctx.textAlign = align;
      ctx.textBaseline = baseline;
      ctx.fillText(NUTRIENT_LABELS[item.key], x, y);
    });
  }, [nutrients, size]);

  return <canvas ref={canvasRef} />;
}
