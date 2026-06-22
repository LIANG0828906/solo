import type { EngineContext } from './particleEngine';
import { hslaToString, updateEngine } from './particleEngine';
import type { CanvasDimensions, EngineFrameOutput, ParticleFrameState } from './types';

export interface RendererHandle {
  start: () => void;
  stop: () => void;
  setCanvas: (c: HTMLCanvasElement | null) => void;
  updateDimensions: (d: CanvasDimensions) => void;
  getFps: () => number;
  getLastFrame: () => EngineFrameOutput | null;
}

export type FpsCallback = (fps: number) => void;
export type FrameCallback = (output: EngineFrameOutput) => void;

export function createRenderer(
  ctx: EngineContext,
  options?: {
    onFpsUpdate?: FpsCallback;
    onFrame?: FrameCallback;
  }
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
  let lastFrameOutput: EngineFrameOutput | null = null;
  const dims = { ...ctx.dims };
  const { onFpsUpdate, onFrame } = options || {};

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

  function drawParticles(particles: readonly ParticleFrameState[]): void {
    if (!cctx || particles.length === 0) return;
    const n = particles.length;
    cctx.globalCompositeOperation = 'lighter';
    let lastKey = '';
    let hasOpenPath = false;
    for (let i = 0; i < n; i++) {
      const p = particles[i];
      if (p.opacity <= 0.01) continue;
      const col = p.color;
      const key = `${col.h.toFixed(0)},${col.s.toFixed(0)},${col.l.toFixed(0)},${(col.a * p.opacity).toFixed(3)}`;
      if (key !== lastKey) {
        if (hasOpenPath) {
          cctx.fill();
          hasOpenPath = false;
        }
        const alpha = col.a * p.opacity;
        cctx.fillStyle = `hsla(${col.h.toFixed(1)}, ${col.s.toFixed(1)}%, ${col.l.toFixed(1)}%, ${alpha.toFixed(3)})`;
        lastKey = key;
        cctx.beginPath();
        hasOpenPath = true;
      }
      const r = p.size / 2;
      cctx.moveTo(p.x + r, p.y);
      cctx.arc(p.x, p.y, r, 0, Math.PI * 2);
    }
    if (hasOpenPath) cctx.fill();
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
    const frameOutput = updateEngine(ctx, now);
    lastFrameOutput = frameOutput;
    drawBackground();
    drawParticles(frameOutput.particles);
    if (onFrame) onFrame(frameOutput);
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

  function getLastFrame(): EngineFrameOutput | null {
    return lastFrameOutput;
  }

  return { start, stop, setCanvas, updateDimensions, getFps, getLastFrame };
}
