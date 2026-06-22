import React, { useRef, useEffect, useCallback } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { SPECIES_CONFIG, PLANT_SIZE, WEATHER_CONFIG, AUTO_IRRIGATOR_RADIUS, DIRT_COLOR } from '@/config/constants';
import { GROWTH_STAGES } from '@/types';
import type { Plant, Particle, AutoIrrigator } from '@/types';
import { drawRoundedRect, drawStar, mergeRects, inflateRect, rectIntersect } from '@/utils/canvas';
import { rgbToString, gradientColor } from '@/utils/color';
import { handleCanvasClick } from '@/modules/PlayerAction';

const GameCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bgPatternRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const sizeRef = useRef({ w: 0, h: 0, dpr: 1 });
  const fullRedrawRef = useRef(true);

  const { brightness, colorTemp, screenShake, dirtyRects, clearDirtyRects } = useGameStore();

  const buildBgPattern = useCallback((w: number, h: number) => {
    const patternCanvas = document.createElement('canvas');
    patternCanvas.width = w;
    patternCanvas.height = h;
    const pctx = patternCanvas.getContext('2d')!;
    pctx.fillStyle = DIRT_COLOR;
    pctx.fillRect(0, 0, w, h);

    const pixelSize = 4;
    for (let py = 0; py < h; py += pixelSize) {
      for (let px = 0; px < w; px += pixelSize) {
        const noise = (Math.random() - 0.5) * 2 * 0.12;
        const r = 212 + Math.round(noise * 255);
        const g = 163 + Math.round(noise * 200);
        const b = 115 + Math.round(noise * 150);
        pctx.fillStyle = `rgb(${Math.max(0, Math.min(255, r))},${Math.max(0, Math.min(255, g))},${Math.max(0, Math.min(255, b))})`;
        pctx.fillRect(px, py, pixelSize, pixelSize);
      }
    }
    bgPatternRef.current = patternCanvas;
  }, []);

  const handleResize = useCallback(() => {
    if (!canvasRef.current || !containerRef.current) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = containerRef.current.getBoundingClientRect();
    const w = Math.floor(rect.width);
    const h = Math.floor(rect.height);
    sizeRef.current = { w, h, dpr };
    canvasRef.current.width = w * dpr;
    canvasRef.current.height = h * dpr;
    canvasRef.current.style.width = `${w}px`;
    canvasRef.current.style.height = `${h}px`;
    const ctx = canvasRef.current.getContext('2d')!;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    buildBgPattern(w, h);
    fullRedrawRef.current = true;
  }, [buildBgPattern]);

  useEffect(() => {
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [handleResize]);

  useEffect(() => {
    fullRedrawRef.current = true;
  }, [brightness, colorTemp, screenShake]);

  const getShakeOffset = useCallback(() => {
    const ss = useGameStore.getState().screenShake;
    if (!ss) return { ox: 0, oy: 0 };
    const elapsed = (Date.now() - ss.startTime) / 1000;
    if (elapsed >= ss.duration) return { ox: 0, oy: 0 };
    const t = 1 - elapsed / ss.duration;
    const intensity = ss.intensity * t;
    return {
      ox: (Math.random() - 0.5) * intensity * 2,
      oy: (Math.random() - 0.5) * intensity * 2,
    };
  }, []);

  const drawPlant = useCallback((ctx: CanvasRenderingContext2D, plant: Plant) => {
    const { x, y } = plant.position;
    const cfg = SPECIES_CONFIG[plant.species];
    const size = PLANT_SIZE[plant.stage];
    const stageIdx = GROWTH_STAGES.indexOf(plant.stage);
    const t = plant.stageProgress;
    const sway = Math.sin(plant.swayPhase * 2) * 1.5;

    ctx.save();
    ctx.translate(x + sway, y);

    if (plant.isDormant) {
      ctx.globalAlpha = 0.6;
    }

    if (plant.stage === 'seed') {
      const s = Math.min(1, t / 0.2) * 10;
      ctx.fillStyle = cfg.color;
      ctx.beginPath();
      ctx.ellipse(0, 0, 6 + s * 0.5, 4 + s * 0.3, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.2)';
      ctx.lineWidth = 1;
      ctx.stroke();
    } else if (plant.stage === 'sprout') {
      const emerge = Math.min(1, t * 2);
      const h = 18 * emerge;
      ctx.strokeStyle = '#65A30D';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(0, 2);
      ctx.lineTo(0, -h);
      ctx.stroke();
      if (emerge > 0.5) {
        const leafT = (emerge - 0.5) * 2;
        ctx.fillStyle = '#84CC16';
        ctx.beginPath();
        ctx.ellipse(-5, -h * 0.6, 6 * leafT, 3 * leafT, -0.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(5, -h * 0.7, 6 * leafT, 3 * leafT, 0.5, 0, Math.PI * 2);
        ctx.fill();
      }
    } else {
      const scale = plant.stage === 'seedling' ? 0.6 : plant.stage === 'mature' ? 0.85 : 1;
      const h = size * 0.8 * scale;

      if (plant.species === 'sunflower') {
        ctx.strokeStyle = '#65A30D';
        ctx.lineWidth = 4 * scale;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(0, 2);
        ctx.lineTo(0, -h);
        ctx.stroke();

        const leafH = h * 0.4;
        ctx.fillStyle = '#84CC16';
        ctx.beginPath();
        ctx.ellipse(-8, -h + leafH, 10 * scale, 5 * scale, -0.7, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(8, -h + leafH * 1.2, 10 * scale, 5 * scale, 0.7, 0, Math.PI * 2);
        ctx.fill();

        const headSize = (plant.stage === 'flowering' ? 22 : 14) * scale;
        if (plant.stage === 'flowering') {
          const petalCount = 14;
          ctx.fillStyle = cfg.color;
          for (let i = 0; i < petalCount; i++) {
            const angle = (Math.PI * 2 * i) / petalCount;
            const px = Math.cos(angle) * headSize * 0.7;
            const py = -h + Math.sin(angle) * headSize * 0.7;
            ctx.beginPath();
            ctx.ellipse(px, py, headSize * 0.4, headSize * 0.2, angle, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.fillStyle = '#78350F';
          ctx.beginPath();
          ctx.arc(0, -h, headSize * 0.5, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillStyle = cfg.color;
          ctx.beginPath();
          ctx.arc(0, -h, headSize * 0.6, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#84CC16';
          ctx.beginPath();
          ctx.arc(0, -h, headSize * 0.35, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (plant.species === 'cactus') {
        const bodyH = h * 0.8;
        const bodyW = bodyH * 0.35;
        ctx.fillStyle = '#065F46';
        drawRoundedRect(ctx, -bodyW, -bodyH, bodyW * 2, bodyH + 4, bodyW);
        ctx.fill();

        ctx.strokeStyle = 'rgba(6,95,70,0.6)';
        ctx.lineWidth = 1;
        for (let i = 0; i < 5; i++) {
          const yy = -bodyH + (bodyH * i) / 4;
          ctx.beginPath();
          ctx.moveTo(-bodyW * 0.8, yy);
          ctx.lineTo(bodyW * 0.8, yy);
          ctx.stroke();
        }

        if (plant.stage !== 'seedling') {
          const armH = bodyH * 0.4;
          const armW = armH * 0.4;
          ctx.fillStyle = '#065F46';
          drawRoundedRect(ctx, -bodyW - armW, -bodyH * 0.6, armW * 1.2, armH, armW * 0.5);
          ctx.fill();
          drawRoundedRect(ctx, bodyW * 0.3, -bodyH * 0.7, armW * 1.2, armH * 0.9, armW * 0.5);
          ctx.fill();
        }

        if (plant.stage === 'flowering') {
          ctx.fillStyle = cfg.color;
          for (let i = 0; i < 6; i++) {
            const angle = (Math.PI * 2 * i) / 6;
            const r = 10 * scale;
            ctx.beginPath();
            ctx.ellipse(Math.cos(angle) * r * 0.4, -bodyH + Math.sin(angle) * r * 0.4, r * 0.5, r * 0.25, angle, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.fillStyle = '#FDE68A';
          ctx.beginPath();
          ctx.arc(0, -bodyH, 5 * scale, 0, Math.PI * 2);
          ctx.fill();
        }
      } else {
        ctx.strokeStyle = '#65A30D';
        ctx.lineWidth = 2.5 * scale;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(0, 2);
        ctx.lineTo(0, -h);
        ctx.stroke();

        ctx.fillStyle = '#84CC16';
        for (let i = 0; i < 4; i++) {
          const yy = -h * 0.3 - i * h * 0.15;
          const side = i % 2 === 0 ? -1 : 1;
          ctx.beginPath();
          ctx.ellipse(side * 7, yy, 7 * scale, 3 * scale, side * -0.5, 0, Math.PI * 2);
          ctx.fill();
        }

        if (plant.stage === 'flowering') {
          const puffR = 16 * scale;
          ctx.fillStyle = 'rgba(255,255,255,0.9)';
          for (let i = 0; i < 12; i++) {
            const angle = (Math.PI * 2 * i) / 12;
            ctx.beginPath();
            ctx.arc(Math.cos(angle) * puffR * 0.5, -h + Math.sin(angle) * puffR * 0.5 - 2, 3.5 * scale, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.fillStyle = cfg.color;
          ctx.beginPath();
          ctx.arc(0, -h - 2, 4 * scale, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillStyle = cfg.color;
          ctx.beginPath();
          ctx.arc(0, -h, 8 * scale, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#FDE68A';
          ctx.beginPath();
          ctx.arc(0, -h, 3 * scale, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    ctx.restore();

    if (plant.isShaded) {
      ctx.save();
      ctx.fillStyle = 'rgba(99,102,241,0.1)';
      ctx.beginPath();
      ctx.ellipse(x, y - 10, size * 0.7, size * 0.6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#8B5CF6';
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('☂️', x, y - size);
      ctx.restore();
    }

    if (plant.isFertilized) {
      ctx.save();
      ctx.fillStyle = '#059669';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('✨', x + size * 0.5, y - size * 0.6);
      ctx.restore();
    }
  }, []);

  const drawIrrigator = useCallback((ctx: CanvasRenderingContext2D, irr: AutoIrrigator) => {
    ctx.save();
    ctx.translate(irr.position.x, irr.position.y);

    ctx.fillStyle = 'rgba(59, 130, 246, 0.12)';
    ctx.beginPath();
    ctx.arc(0, 0, irr.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(59, 130, 246, 0.3)';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = '#2563EB';
    drawRoundedRect(ctx, -14, -20, 28, 30, 6);
    ctx.fill();

    ctx.fillStyle = '#1D4ED8';
    drawRoundedRect(ctx, -18, -28, 36, 12, 4);
    ctx.fill();

    ctx.fillStyle = '#60A5FA';
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('💧', 0, 0);

    ctx.restore();
  }, []);

  const drawParticle = useCallback((ctx: CanvasRenderingContext2D, p: Particle) => {
    const alpha = Math.max(0, p.life / p.maxLife);
    ctx.save();
    ctx.globalAlpha = alpha;

    if (p.type === 'harvest') {
      ctx.translate(p.x, p.y);
      if (p.rotation !== undefined) ctx.rotate(p.rotation);
      ctx.fillStyle = p.color;
      const s = p.size;
      ctx.beginPath();
      ctx.moveTo(0, -s);
      ctx.lineTo(s * 0.6, s * 0.6);
      ctx.lineTo(-s * 0.6, s * 0.6);
      ctx.closePath();
      ctx.fill();
    } else if (p.type === 'ripple') {
      const progress = 1 - p.life / p.maxLife;
      const r = p.size + progress * 50;
      ctx.strokeStyle = p.color;
      ctx.lineWidth = 3 * (1 - progress);
      ctx.beginPath();
      ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
      ctx.stroke();
    } else if (p.type === 'raindrop') {
      ctx.strokeStyle = p.color;
      ctx.lineWidth = p.size;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x + p.vx * 0.02, p.y + 12);
      ctx.stroke();
    } else if (p.type === 'cloud') {
      ctx.fillStyle = p.color;
      const s = p.size;
      ctx.beginPath();
      ctx.arc(p.x, p.y, s * 0.5, 0, Math.PI * 2);
      ctx.arc(p.x + s * 0.5, p.y + s * 0.1, s * 0.4, 0, Math.PI * 2);
      ctx.arc(p.x - s * 0.5, p.y + s * 0.15, s * 0.38, 0, Math.PI * 2);
      ctx.arc(p.x + s * 0.2, p.y - s * 0.25, s * 0.35, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }, []);

  const drawBackground = useCallback((ctx: CanvasRenderingContext2D, w: number, h: number, brightness: number) => {
    if (bgPatternRef.current) {
      ctx.drawImage(bgPatternRef.current, 0, 0, w, h);
    } else {
      ctx.fillStyle = DIRT_COLOR;
      ctx.fillRect(0, 0, w, h);
    }

    if (brightness < 1) {
      ctx.fillStyle = `rgba(0,0,0,${(1 - brightness) * 0.35})`;
      ctx.fillRect(0, 0, w, h);
    }
  }, []);

  const drawOverlay = useCallback((ctx: CanvasRenderingContext2D, w: number, h: number) => {
    const { colorTemp, brightness } = useGameStore.getState();
    const dayFactor = (brightness - 0.3) / 0.7;
    const tempAlpha = Math.abs(dayFactor - 0.5) * 0.12;
    ctx.fillStyle = rgbToString(colorTemp, tempAlpha);
    ctx.fillRect(0, 0, w, h);

    const weather = useGameStore.getState().currentWeather;
    const cfg = WEATHER_CONFIG[weather];
    if (weather === 'drought') {
      ctx.fillStyle = 'rgba(251,146,60,0.08)';
      ctx.fillRect(0, 0, w, h);
    }
  }, []);

  useEffect(() => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d')!;
    let rafId: number;

    const render = () => {
      const { w, h } = sizeRef.current;
      if (w === 0 || h === 0) {
        rafId = requestAnimationFrame(render);
        return;
      }

      const state = useGameStore.getState();
      const rects = state.dirtyRects;

      ctx.save();
      const { ox, oy } = getShakeOffset();
      ctx.translate(ox, oy);

      let shouldFullRedraw = fullRedrawRef.current;
      fullRedrawRef.current = false;

      if (shouldFullRedraw || rects.length === 0) {
        drawBackground(ctx, w, h, state.brightness);

        for (const irr of state.irrigators) drawIrrigator(ctx, irr);
        for (const plant of state.plants) drawPlant(ctx, plant);
        for (const p of state.particles) drawParticle(ctx, p);

        drawOverlay(ctx, w, h);
      } else {
        const merged = mergeRects(
          rects
            .filter((r) => r.w > 0 && r.h > 0)
            .map((r) => inflateRect(r, 16))
        );

        for (const rect of merged) {
          if (rect.x + rect.w < 0 || rect.x > w || rect.y + rect.h < 0 || rect.y > h) continue;

          ctx.save();
          ctx.beginPath();
          ctx.rect(Math.max(0, rect.x), Math.max(0, rect.y), Math.min(w, rect.x + rect.w) - Math.max(0, rect.x), Math.min(h, rect.y + rect.h) - Math.max(0, rect.y));
          ctx.clip();

          drawBackground(ctx, w, h, state.brightness);

          for (const irr of state.irrigators) {
            const rr = {
              x: irr.position.x - irr.radius - 20,
              y: irr.position.y - 30,
              w: (irr.radius + 20) * 2,
              h: irr.radius + 60,
            };
            if (rectIntersect(rect, rr)) drawIrrigator(ctx, irr);
          }

          for (const plant of state.plants) {
            const s = PLANT_SIZE[plant.stage];
            const pr = {
              x: plant.position.x - s - 10,
              y: plant.position.y - s - 20,
              w: s * 2 + 20,
              h: s * 2 + 40,
            };
            if (rectIntersect(rect, pr)) drawPlant(ctx, plant);
          }

          for (const p of state.particles) {
            const extra = p.type === 'cloud' ? p.size + 20 : 20;
            const pr = { x: p.x - extra, y: p.y - extra, w: extra * 2, h: extra * 2 };
            if (rectIntersect(rect, pr)) drawParticle(ctx, p);
          }

          drawOverlay(ctx, w, h);
          ctx.restore();
        }
      }

      ctx.restore();

      clearDirtyRects();
      rafId = requestAnimationFrame(render);
    };

    rafId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(rafId);
  }, [drawBackground, drawOverlay, drawPlant, drawIrrigator, drawParticle, getShakeOffset, clearDirtyRects]);

  const onCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    handleCanvasClick(x, y);
  }, []);

  return (
    <div ref={containerRef} className="canvas-area">
      <canvas
        ref={canvasRef}
        className="game-canvas"
        onClick={onCanvasClick}
      />
    </div>
  );
};

export default GameCanvas;
