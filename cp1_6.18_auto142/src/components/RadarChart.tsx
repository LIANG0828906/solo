import React, { useRef, useEffect, useState, useCallback } from 'react';
import { SCORE_KEYS, SCORE_LABELS, type Tea } from '@/stores/teaStore';

const DIMS = SCORE_KEYS;
const DIM_LABELS = DIMS.map((k) => SCORE_LABELS[k]);

function lerpColor(a: number[], b: number[], t: number): string {
  const r = Math.round(a[0] + (b[0] - a[0]) * t);
  const g = Math.round(a[1] + (b[1] - a[1]) * t);
  const bl = Math.round(a[2] + (b[2] - a[2]) * t);
  return `rgb(${r},${g},${bl})`;
}

const LOW_COLOR = [205, 133, 63];
const HIGH_COLOR = [107, 142, 35];
const LINE_COLOR = '#8B7355';

interface HoverInfo {
  index: number;
  x: number;
  y: number;
  score: number;
  label: string;
}

interface RadarChartProps {
  tea: Tea;
}

const RadarChart: React.FC<RadarChartProps> = ({ tea }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<HoverInfo | null>(null);
  const animRef = useRef<number>(0);
  const scoresRef = useRef<number[]>(DIMS.map((k) => tea[k]));
  const targetRef = useRef<number[]>(DIMS.map((k) => tea[k]));
  const currentRef = useRef<number[]>(DIMS.map((k) => tea[k]));

  useEffect(() => {
    targetRef.current = DIMS.map((k) => tea[k]);
  }, [tea]);

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number, scores: number[]) => {
      const dpr = window.devicePixelRatio || 1;
      ctx.clearRect(0, 0, w * dpr, h * dpr);
      ctx.save();
      ctx.scale(dpr, dpr);

      const cx = w / 2;
      const cy = h / 2;
      const maxR = Math.min(w, h) / 2 - 50;
      const n = DIMS.length;
      const angleStep = (Math.PI * 2) / n;
      const startAngle = -Math.PI / 2;

      for (let ring = 1; ring <= 5; ring++) {
        const r = (maxR * ring) / 5;
        ctx.beginPath();
        for (let i = 0; i <= n; i++) {
          const angle = startAngle + angleStep * (i % n);
          const x = cx + r * Math.cos(angle);
          const y = cy + r * Math.sin(angle);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.strokeStyle = 'rgba(139,115,85,0.15)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      for (let i = 0; i < n; i++) {
        const angle = startAngle + angleStep * i;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + maxR * Math.cos(angle), cy + maxR * Math.sin(angle));
        ctx.strokeStyle = 'rgba(139,115,85,0.2)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
      const t = Math.min(avg / 10, 1);
      const fillColor = lerpColor(LOW_COLOR, HIGH_COLOR, t);

      ctx.beginPath();
      for (let i = 0; i <= n; i++) {
        const idx = i % n;
        const angle = startAngle + angleStep * idx;
        const r = (maxR * scores[idx]) / 10;
        const x = cx + r * Math.cos(angle);
        const y = cy + r * Math.sin(angle);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fillStyle = fillColor.replace('rgb', 'rgba').replace(')', ',0.6)');
      ctx.fill();
      ctx.strokeStyle = LINE_COLOR;
      ctx.lineWidth = 2;
      ctx.stroke();

      for (let i = 0; i < n; i++) {
        const angle = startAngle + angleStep * i;
        const r = (maxR * scores[i]) / 10;
        const x = cx + r * Math.cos(angle);
        const y = cy + r * Math.sin(angle);

        ctx.beginPath();
        ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.fillStyle = fillColor;
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      for (let i = 0; i < n; i++) {
        const angle = startAngle + angleStep * i;
        const labelR = maxR + 28;
        const lx = cx + labelR * Math.cos(angle);
        const ly = cy + labelR * Math.sin(angle);

        ctx.font = "13px 'Noto Serif SC', serif";
        ctx.fillStyle = '#5D4037';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(DIM_LABELS[i], lx, ly);
      }

      ctx.restore();
    },
    []
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const dpr = window.devicePixelRatio || 1;
    const w = container.clientWidth;
    const h = container.clientHeight || 400;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';

    let running = true;
    const animate = () => {
      if (!running) return;
      for (let i = 0; i < currentRef.current.length; i++) {
        const diff = targetRef.current[i] - currentRef.current[i];
        if (Math.abs(diff) > 0.01) {
          currentRef.current[i] += diff * 0.15;
        } else {
          currentRef.current[i] = targetRef.current[i];
        }
      }

      const ctx = canvas.getContext('2d');
      if (ctx) {
        draw(ctx, w, h, currentRef.current);
      }
      animRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      running = false;
      cancelAnimationFrame(animRef.current);
    };
  }, [draw]);

  useEffect(() => {
    scoresRef.current = DIMS.map((k) => tea[k]);
    targetRef.current = DIMS.map((k) => tea[k]);
  }, [tea]);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const w = rect.width;
      const h = rect.height;
      const cx = w / 2;
      const cy = h / 2;
      const maxR = Math.min(w, h) / 2 - 50;
      const n = DIMS.length;
      const angleStep = (Math.PI * 2) / n;
      const startAngle = -Math.PI / 2;

      let closest: HoverInfo | null = null;
      let closestDist = 20;

      for (let i = 0; i < n; i++) {
        const angle = startAngle + angleStep * i;
        const r = (maxR * currentRef.current[i]) / 10;
        const vx = cx + r * Math.cos(angle);
        const vy = cy + r * Math.sin(angle);
        const dist = Math.sqrt((mx - vx) ** 2 + (my - vy) ** 2);
        if (dist < closestDist) {
          closestDist = dist;
          closest = {
            index: i,
            x: vx,
            y: vy,
            score: currentRef.current[i],
            label: DIM_LABELS[i],
          };
        }
      }

      setHover(closest);
    },
    []
  );

  const handleMouseLeave = useCallback(() => {
    setHover(null);
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: 400,
        position: 'relative',
      }}
    >
      <canvas
        ref={canvasRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{ display: 'block' }}
      />
      {hover && (
        <div
          style={{
            position: 'absolute',
            left: hover.x,
            top: hover.y - 36,
            transform: 'translateX(-50%)',
            backgroundColor: 'rgba(62,39,35,0.9)',
            color: '#FFF8DC',
            padding: '4px 10px',
            borderRadius: 6,
            fontSize: 13,
            fontFamily: "'Noto Serif SC', serif",
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            zIndex: 10,
          }}
        >
          {hover.label}: {hover.score.toFixed(1)}分
        </div>
      )}
    </div>
  );
};

export default RadarChart;
