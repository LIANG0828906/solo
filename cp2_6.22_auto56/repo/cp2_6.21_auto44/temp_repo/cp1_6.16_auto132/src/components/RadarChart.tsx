import { useEffect, useRef } from 'react';
import type { Abilities } from '../types';

interface RadarChartProps {
  abilities: Abilities;
  size?: number;
}

const LABELS: { key: keyof Abilities; label: string }[] = [
  { key: 'strength', label: '力量' },
  { key: 'agility', label: '敏捷' },
  { key: 'wisdom', label: '智慧' },
  { key: 'mystery', label: '神秘' },
  { key: 'charm', label: '魅力' },
  { key: 'longevity', label: '长寿' },
];

export function RadarChart({ abilities, size = 200 }: RadarChartProps) {
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
    ctx.scale(dpr, dpr);

    const cx = size / 2;
    const cy = size / 2;
    const maxR = size * 0.38;
    const sides = 6;
    const angleStep = (Math.PI * 2) / sides;

    ctx.clearRect(0, 0, size, size);

    for (let layer = 4; layer >= 1; layer--) {
      const r = (maxR * layer) / 4;
      ctx.beginPath();
      for (let i = 0; i < sides; i++) {
        const angle = i * angleStep - Math.PI / 2;
        const x = cx + Math.cos(angle) * r;
        const y = cy + Math.sin(angle) * r;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.strokeStyle = `rgba(255, 215, 0, ${0.08 + layer * 0.03})`;
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    for (let i = 0; i < sides; i++) {
      const angle = i * angleStep - Math.PI / 2;
      const x = cx + Math.cos(angle) * maxR;
      const y = cy + Math.sin(angle) * maxR;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(x, y);
      ctx.strokeStyle = 'rgba(255, 215, 0, 0.12)';
      ctx.lineWidth = 1;
      ctx.stroke();

      const lx = cx + Math.cos(angle) * (maxR + 18);
      const ly = cy + Math.sin(angle) * (maxR + 18);
      ctx.fillStyle = '#B0B0B0';
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(LABELS[i].label, lx, ly);
    }

    const dataPoints: { x: number; y: number }[] = [];
    for (let i = 0; i < sides; i++) {
      const angle = i * angleStep - Math.PI / 2;
      const value = abilities[LABELS[i].key];
      const r = (maxR * value) / 100;
      dataPoints.push({
        x: cx + Math.cos(angle) * r,
        y: cy + Math.sin(angle) * r,
      });
    }

    ctx.beginPath();
    dataPoints.forEach((pt, idx) => {
      if (idx === 0) ctx.moveTo(pt.x, pt.y);
      else {
        const prev = dataPoints[idx - 1];
        const cpx = (prev.x + pt.x) / 2;
        const cpy = (prev.y + pt.y) / 2;
        ctx.quadraticCurveTo(cpx, cpy, pt.x, pt.y);
      }
    });
    const first = dataPoints[0];
    const last = dataPoints[dataPoints.length - 1];
    ctx.quadraticCurveTo((last.x + first.x) / 2, (last.y + first.y) / 2, first.x, first.y);
    ctx.closePath();
    ctx.fillStyle = 'rgba(255, 215, 0, 0.28)';
    ctx.fill();
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 2;
    ctx.stroke();

    dataPoints.forEach((pt) => {
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 3.5, 0, Math.PI * 2);
      ctx.fillStyle = '#FFD700';
      ctx.shadowColor = '#FFD700';
      ctx.shadowBlur = 6;
      ctx.fill();
      ctx.shadowBlur = 0;
    });
  }, [abilities, size]);

  return <canvas ref={canvasRef} />;
}
