import { useEffect, useRef } from 'react';
import type { InkPoint, EmotionType } from '../types';
import { EMOTION_PALETTES } from '../types';

interface DiaryDetailCanvasProps {
  points: InkPoint[];
  emotion: EmotionType;
}

export default function DiaryDetailCanvas({ points, emotion }: DiaryDetailCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const palette = EMOTION_PALETTES.find((p) => p.type === emotion) ?? EMOTION_PALETTES[0];

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      const rect = container.getBoundingClientRect();
      const W = rect.width;
      const H = rect.width * 0.75;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      canvas.style.width = W + 'px';
      canvas.style.height = H + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw(W, H);
    };

    const draw = (W: number, H: number) => {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = 'rgba(255,253,248,0.92)';
      ctx.fillRect(0, 0, W, H);

      if (!points || points.length < 2) {
        const [r, g, b] = hexToRgb(palette.color);
        const grad = ctx.createRadialGradient(W * 0.5, H * 0.5, 0, W * 0.5, H * 0.5, W * 0.55);
        grad.addColorStop(0, `rgba(${r},${g},${b},0.28)`);
        grad.addColorStop(1, `rgba(${r},${g},${b},0.02)`);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);
        return;
      }

      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      for (const p of points) {
        if (p.x < minX) minX = p.x;
        if (p.x > maxX) maxX = p.x;
        if (p.y < minY) minY = p.y;
        if (p.y > maxY) maxY = p.y;
      }
      const rw = Math.max(1, maxX - minX);
      const rh = Math.max(1, maxY - minY);
      const scale = Math.min((W * 0.88) / rw, (H * 0.88) / rh);
      const ox = (W - rw * scale) * 0.5 - minX * scale;
      const oy = (H - rh * scale) * 0.5 - minY * scale;

      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      for (let i = 1; i < points.length; i++) {
        const p0 = points[i - 1];
        const p1 = points[i];
        const steps = Math.max(1, Math.floor(Math.hypot(p1.x - p0.x, p1.y - p0.y) / 1.5));
        for (let s = 0; s <= steps; s++) {
          const t = s / steps;
          const x = (p0.x + (p1.x - p0.x) * t) * scale + ox;
          const y = (p0.y + (p1.y - p0.y) * t) * scale + oy;
          const sz = (p0.size + (p1.size - p0.size) * t) * scale;
          const op = p0.opacity + (p1.opacity - p0.opacity) * t;
          const [r, g, b] = hexToRgb(p1.color);

          for (let l = 0; l < 3; l++) {
            const lsz = sz * (1 - l * 0.22);
            const lop = op * (l === 0 ? 0.85 : l === 1 ? 0.45 : 0.22);
            const jx = (Math.random() - 0.5) * sz * 0.2;
            const jy = (Math.random() - 0.5) * sz * 0.2;
            const grad = ctx.createRadialGradient(x + jx, y + jy, 0, x + jx, y + jy, lsz * 0.55);
            grad.addColorStop(0, `rgba(${r},${g},${b},${lop})`);
            grad.addColorStop(0.55, `rgba(${r},${g},${b},${lop * 0.5})`);
            grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(x + jx, y + jy, lsz * 0.55, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(container);
    return () => ro.disconnect();
  }, [points, palette.color]);

  return (
    <div className="detail-canvas-wrapper" ref={containerRef}>
      <canvas ref={canvasRef} style={{ display: 'block' }} />
    </div>
  );
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}
