import React, { useRef, useEffect, useCallback, useImperativeHandle, forwardRef } from 'react';
import type { WeatherData, ParticleConfig } from '../weather/WeatherSystem';

export type CropType = 'tomato' | 'carrot' | 'wheat' | 'corn';
export type CropStage = 'seed' | 'sprout' | 'flowering' | 'mature';

export interface FarmCell {
  crop: CropType | null;
  stage: CropStage;
  moisture: number;
  health: number;
  growthProgress: number;
}

export interface HarvestAnim {
  id: number;
  row: number;
  col: number;
  crop: CropType;
  stage: CropStage;
  startTime: number;
  particles: { x: number; y: number; vx: number; vy: number; life: number; color: string }[];
}

export interface FarmGridHandle {
  getCellScreenPos: (row: number, col: number) => { x: number; y: number; size: number } | null;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
  length?: number;
  type: string;
}

interface Props {
  grid: FarmCell[][];
  weatherData: WeatherData;
  onCellClick: (row: number, col: number) => void;
  harvestAnims: HarvestAnim[];
}

const CROP_COLORS: Record<CropType, { stem: string; fruit: string; flower: string }> = {
  tomato: { stem: '#32CD32', fruit: '#FF4500', flower: '#FFD700' },
  carrot: { stem: '#90EE90', fruit: '#FF8C00', flower: '#FFFFFF' },
  wheat:  { stem: '#9ACD32', fruit: '#F0E68C', flower: '#DAA520' },
  corn:   { stem: '#7CFC00', fruit: '#FFD700', flower: '#FFD700' },
};

function lerpColor(a: string, b: string, t: number): string {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const ra = (pa >> 16) & 0xff, ga = (pa >> 8) & 0xff, ba = pa & 0xff;
  const rb = (pb >> 16) & 0xff, gb = (pb >> 8) & 0xff, bb = pb & 0xff;
  const r = Math.round(ra + (rb - ra) * t);
  const g = Math.round(ga + (gb - ga) * t);
  const bv = Math.round(ba + (bb - ba) * t);
  return `rgb(${r},${g},${bv})`;
}

function moistureColor(m: number): string {
  const t = Math.max(0, Math.min(1, m));
  return lerpColor('#D2B48C', '#8B4513', t);
}

function drawCropPixel(
  ctx: CanvasRenderingContext2D,
  crop: CropType,
  stage: CropStage,
  cx: number,
  cy: number,
  ps: number,
) {
  const c = CROP_COLORS[crop];
  const s = ps;

  if (stage === 'seed') {
    ctx.fillStyle = '#228B22';
    ctx.fillRect(cx - s, cy - s, s * 2, s * 2);
    return;
  }

  if (stage === 'sprout') {
    ctx.fillStyle = c.stem;
    ctx.fillRect(cx - s * 2, cy - s * 2, s * 4, s * 4);
    ctx.fillStyle = '#006400';
    ctx.fillRect(cx - s, cy - s, s * 2, s * 2);
    return;
  }

  if (stage === 'flowering') {
    ctx.fillStyle = c.stem;
    ctx.fillRect(cx - s * 3, cy - s, s * 6, s * 4);
    ctx.fillRect(cx - s * 2, cy - s * 2, s * 4, s);
    ctx.fillRect(cx - s, cy - s * 3, s * 2, s);
    ctx.fillStyle = c.flower;
    ctx.fillRect(cx - s * 2, cy - s * 3, s, s);
    ctx.fillRect(cx + s, cy - s * 3, s, s);
    ctx.fillRect(cx - s * 0.5, cy - s * 3, s, s);
    return;
  }

  ctx.fillStyle = c.stem;
  ctx.fillRect(cx - s, cy - s * 4, s * 2, s * 2);
  ctx.fillRect(cx - s * 0.5, cy - s * 2, s, s);
  ctx.fillStyle = c.fruit;
  const offsets = [
    [-2, -1], [-1, -2], [0, -2], [1, -2],
    [-2, 0], [-1, -1], [0, -1], [1, -1],
    [-2, 1], [-1, 0], [0, 0], [1, 0],
    [-1, 1], [0, 1],
  ];
  for (const [dx, dy] of offsets) {
    ctx.fillRect(cx + dx * s, cy + dy * s, s, s);
  }
  if (crop === 'tomato') {
    ctx.fillStyle = '#FF6347';
    ctx.fillRect(cx - s, cy - s, s, s);
    ctx.fillRect(cx, cy, s, s);
  }
}

const FarmGrid = forwardRef<FarmGridHandle, Props>(({ grid, weatherData, onCellClick, harvestAnims }, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animFrameRef = useRef<number>(0);
  const gridRef = useRef(grid);
  const weatherRef = useRef(weatherData);
  const harvestAnimsRef = useRef(harvestAnims);
  const particlesRef = useRef<Particle[]>([]);
  const bgColorRef = useRef({ current: weatherData.bgColor, target: weatherData.bgColor, transition: 0 });
  const lastTimeRef = useRef(0);
  const cellMetricsRef = useRef({ offsetX: 0, offsetY: 0, cellSize: 0 });

  useEffect(() => { gridRef.current = grid; }, [grid]);
  useEffect(() => {
    if (weatherRef.current.bgColor !== weatherData.bgColor) {
      bgColorRef.current = {
        current: bgColorRef.current.current,
        target: weatherData.bgColor,
        transition: 0,
      };
    }
    weatherRef.current = weatherData;
  }, [weatherData]);
  useEffect(() => { harvestAnimsRef.current = harvestAnims; }, [harvestAnims]);

  useImperativeHandle(ref, () => ({
    getCellScreenPos: (row: number, col: number) => {
      const m = cellMetricsRef.current;
      return { x: m.offsetX + col * m.cellSize, y: m.offsetY + row * m.cellSize, size: m.cellSize };
    },
  }));

  const spawnParticles = useCallback((width: number, height: number, dt: number) => {
    const wd = weatherRef.current;
    for (const pc of wd.particles) {
      const spawnCount = Math.floor(pc.density * dt);
      for (let i = 0; i < spawnCount; i++) {
        const p: Particle = {
          x: pc.directionX >= 0 ? Math.random() * width : Math.random() * width * 1.5 - width * 0.25,
          y: pc.directionY >= 0 ? -10 : height + 10,
          vx: pc.directionX * pc.speed * (0.8 + Math.random() * 0.4) * 60,
          vy: pc.directionY * pc.speed * (0.8 + Math.random() * 0.4) * 60,
          life: 3 + Math.random() * 2,
          maxLife: 5,
          color: pc.color,
          size: pc.size,
          length: pc.length,
          type: pc.type,
        };
        if (pc.type === 'rain' || pc.type === 'storm') {
          p.x = Math.random() * width;
          p.y = Math.random() * -50;
        } else if (pc.type === 'wind') {
          p.x = -20;
          p.y = Math.random() * height;
        } else if (pc.type === 'leaf') {
          p.x = -20;
          p.y = Math.random() * height;
          p.vy += Math.random() * 30;
        } else if (pc.type === 'sparkle') {
          p.x = Math.random() * width;
          p.y = Math.random() * height;
          p.vx = 0;
          p.vy = 0;
        }
        particlesRef.current.push(p);
      }
    }
  }, []);

  const updateParticles = useCallback((dt: number) => {
    const ps = particlesRef.current;
    for (let i = ps.length - 1; i >= 0; i--) {
      const p = ps[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      if (p.type === 'leaf') {
        p.vy += 15 * dt;
        p.vx += Math.sin(p.life * 3) * 20 * dt;
      }
      if (p.life <= 0 || p.x > 2000 || p.y > 2000 || p.x < -100) {
        ps.splice(i, 1);
      }
    }
    if (ps.length > 500) {
      ps.splice(0, ps.length - 500);
    }
  }, []);

  const drawParticles = useCallback((ctx: CanvasRenderingContext2D) => {
    for (const p of particlesRef.current) {
      const alpha = Math.max(0, Math.min(1, p.life / p.maxLife));
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;

      if (p.type === 'rain') {
        ctx.fillRect(p.x, p.y, p.size, p.length || 8);
      } else if (p.type === 'storm') {
        ctx.fillRect(p.x, p.y, p.size, p.length || 14);
      } else if (p.type === 'wind') {
        ctx.fillRect(p.x, p.y, p.length || 20, p.size);
      } else if (p.type === 'leaf') {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.life * 4);
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        ctx.restore();
      } else if (p.type === 'sparkle') {
        const blink = Math.sin(p.life * 8) * 0.5 + 0.5;
        ctx.globalAlpha = alpha * blink;
        ctx.fillRect(p.x - 1, p.y - 1, p.size, p.size);
      }
    }
    ctx.globalAlpha = 1;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const resize = () => {
      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = rect.width + 'px';
      canvas.style.height = rect.height + 'px';
    };
    resize();

    const ro = new ResizeObserver(resize);
    ro.observe(container);

    const loop = (timestamp: number) => {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const dt = lastTimeRef.current ? Math.min((timestamp - lastTimeRef.current) / 1000, 0.1) : 0.016;
      lastTimeRef.current = timestamp;

      const dpr = window.devicePixelRatio || 1;
      const w = canvas.width / dpr;
      const h = canvas.height / dpr;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      const gridData = gridRef.current;
      const wd = weatherRef.current;

      const bg = bgColorRef.current;
      bg.transition = Math.min(1, bg.transition + dt / 0.5);
      const bgColor = bg.transition >= 1 ? bg.target : lerpColor(bg.current, bg.target, bg.transition);
      if (bg.transition >= 1) bg.current = bg.target;

      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, w, h);

      const cellSize = Math.floor(Math.min(w, h) / 8.5);
      const offsetX = Math.floor((w - cellSize * 8) / 2);
      const offsetY = Math.floor((h - cellSize * 8) / 2);
      cellMetricsRef.current = { offsetX, offsetY, cellSize };
      const ps = cellSize / 12;

      for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
          const cell = gridData[row]?.[col];
          if (!cell) continue;
          const x = offsetX + col * cellSize;
          const y = offsetY + row * cellSize;

          ctx.fillStyle = moistureColor(cell.moisture);
          ctx.fillRect(x + 1, y + 1, cellSize - 2, cellSize - 2);

          ctx.strokeStyle = 'rgba(0,0,0,0.15)';
          ctx.lineWidth = 1;
          ctx.strokeRect(x + 0.5, y + 0.5, cellSize - 1, cellSize - 1);

          if (cell.crop) {
            drawCropPixel(ctx, cell.crop, cell.stage, x + cellSize / 2, y + cellSize / 2, ps);
          }
        }
      }

      const now = performance.now();
      const activeAnims = harvestAnimsRef.current;
      for (const anim of activeAnims) {
        const elapsed = (now - anim.startTime) / 1000;
        const progress = Math.min(elapsed / 0.3, 1);
        const cx = offsetX + anim.col * cellSize + cellSize / 2;
        const cy = offsetY + anim.row * cellSize + cellSize / 2;

        if (progress < 1) {
          const bounceY = -cellSize * 0.5 * Math.sin(progress * Math.PI);
          ctx.globalAlpha = 1 - progress;
          drawCropPixel(ctx, anim.crop, anim.stage, cx, cy + bounceY, ps);
          ctx.globalAlpha = 1;
        }

        for (const ap of anim.particles) {
          const px = cx + ap.vx * elapsed * 60;
          const py = cy + ap.vy * elapsed * 60 + 50 * elapsed * elapsed;
          const alpha = Math.max(0, ap.life - elapsed) / ap.life;
          if (alpha > 0) {
            ctx.globalAlpha = alpha;
            ctx.fillStyle = ap.color;
            ctx.fillRect(px - 2, py - 2, 4, 4);
          }
        }
        ctx.globalAlpha = 1;
      }

      spawnParticles(w, h, dt);
      updateParticles(dt);
      drawParticles(ctx);

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      ro.disconnect();
    };
  }, [spawnParticles, updateParticles, drawParticles]);

  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const m = cellMetricsRef.current;
    const col = Math.floor((x - m.offsetX) / m.cellSize);
    const row = Math.floor((y - m.offsetY) / m.cellSize);
    if (row >= 0 && row < 8 && col >= 0 && col < 8) {
      onCellClick(row, col);
    }
  }, [onCellClick]);

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%', position: 'relative' }}>
      <canvas
        ref={canvasRef}
        onClick={handleClick}
        style={{ display: 'block', cursor: 'pointer', imageRendering: 'pixelated' }}
      />
    </div>
  );
});

FarmGrid.displayName = 'FarmGrid';
export default FarmGrid;
