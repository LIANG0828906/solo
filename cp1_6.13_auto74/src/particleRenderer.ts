import type { EngineContext } from './particleEngine';
import { hslaToString, updateEngine } from './particleEngine';
import type { CanvasDimensions, Particle } from './types';

export interface RendererHandle {
  start: () => void;
  stop: () => void;
  setCanvas: (c: HTMLCanvasElement | null) => void;
  updateDimensions: (d: CanvasDimensions) => void;
  getFps: () => number;
}

export type FpsCallback = (fps: number) => void;

export function createRenderer(
  ctx: EngineContext,
  onFpsUpdate?: FpsCallback
): RendererHandle {
  let canvas: HTMLCanvasElement | null = null;
  let cctx: CanvasRenderingContext2D | null = null;
  let rafId: number | null = null;
  let running = false;
  let lastFrameTime = 0;
  let fpsAccum = 0;
  let fpsFrames = 0;
  let lastFpsReport = 0;
  let currentFps = 0;
  const dims = { ...ctx.dims };

  function updateDimensions(d: CanvasDimensions): void {
    Object.assign(dims, d);
    if (canvas && cctx) {
      canvas.width = d.width * d.dpr;
      canvas.height = d.height * d.dpr;
      canvas.style.width = d.width + 'px';
      canvas.style.height = d.height + 'px';
      cctx.setTransform(d.dpr, 0, 0, d.dpr, 0, 0);
    }
    Object.assign(ctx.dims, d);
  }

  function setCanvas(c: HTMLCanvasElement | null): void {
    canvas = c;
    cctx = c ? c.getContext('2d') : null;
    if (c) updateDimensions(dims);
  }

  function drawBackground(): void {
    if (!cctx) return;
    const { width, height } = dims;
    const grad = cctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, '#0A0A1A');
    grad.addColorStop(1, '#1A1A2E');
    cctx.fillStyle = grad;
    cctx.fillRect(0, 0, width, height);
  }

  function drawParticles(): void {
    if (!cctx) return;
    const particles: Particle[] = ctx.particles;
    const n = particles.length;
    if (n === 0) return;
    cctx.globalCompositeOperation = 'lighter';
    cctx.beginPath();
    let lastKey = '';
    for (let i = 0; i < n; i++) {
      const p = particles[i];
      if (p.opacity <= 0.01) continue;
      const col = p.currentColor;
      col.a = p.opacity;
      const key = `${col.h.toFixed(0)},${col.s.toFixed(0)},${col.l.toFixed(0)},${col.a.toFixed(3)}`;
      if (key !== lastKey) {
        if (lastKey !== '') cctx.fill();
        cctx.fillStyle = hslaToString(col);
        lastKey = key;
        cctx.beginPath();
      }
      const r = p.size / 2;
      cctx.moveTo(p.x + r, p.y);
      cctx.arc(p.x, p.y, r, 0, Math.PI * 2);
    }
    if (lastKey !== '') cctx.fill();
    cctx.globalCompositeOperation = 'source-over';
  }

  function frame(now: number): void {
    if (!running || !cctx) return;
    if (lastFrameTime > 0) {
      const delta = now - lastFrameTime;
      fpsAccum += delta;
      fpsFrames++;
      if (now - lastFpsReport >= 500) {
        if (fpsAccum > 0) {
          currentFps = Math.round((fpsFrames * 1000) / fpsAccum);
        }
        fpsAccum = 0;
        fpsFrames = 0;
        lastFpsReport = now;
        if (onFpsUpdate) onFpsUpdate(currentFps);
      }
    }
    lastFrameTime = now;
    updateEngine(ctx, now);
    drawBackground();
    drawParticles();
    rafId = requestAnimationFrame(frame);
  }

  function start(): void {
    if (running) return;
    running = true;
    lastFrameTime = 0;
    rafId = requestAnimationFrame(frame);
  }

  function stop(): void {
    running = false;
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  }

  function getFps(): number {
    return currentFps;
  }

  return { start, stop, setCanvas, updateDimensions, getFps };
}
