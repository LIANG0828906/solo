import type { Particle, Word, HSLA, CanvasDimensions, AppState } from './types';

export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export function hexToHSLA(hex: string): HSLA {
  const hx = hex.replace('#', '');
  const r = parseInt(hx.substring(0, 2), 16) / 255;
  const g = parseInt(hx.substring(2, 4), 16) / 255;
  const b = parseInt(hx.substring(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
    a: 1
  };
}

export function hslaToString(c: HSLA): string {
  return `hsla(${c.h}, ${c.s}%, ${c.l}%, ${c.a})`;
}

export function lerpHSLA(a: HSLA, b: HSLA, t: number): HSLA {
  return {
    h: a.h + (b.h - a.h) * t,
    s: a.s + (b.s - a.s) * t,
    l: a.l + (b.l - a.l) * t,
    a: a.a + (b.a - a.a) * t
  };
}

export function generateRandomBrightColor(): HSLA {
  return {
    h: Math.floor(Math.random() * 360),
    s: 80,
    l: 90,
    a: 1
  };
}

export function cubicBezier(
  t: number,
  p0: number, p1: number, p2: number, p3: number
): number {
  const mt = 1 - t;
  return mt * mt * mt * p0
       + 3 * mt * mt * t * p1
       + 3 * mt * t * t * p2
       + t * t * t * p3;
}

export interface PixelPoint {
  x: number;
  y: number;
}

export function sampleCharacterPixels(
  char: string,
  canvasSize: number = 64,
  targetCount: number = 100
): PixelPoint[] {
  const off = document.createElement('canvas');
  off.width = canvasSize;
  off.height = canvasSize;
  const ctx = off.getContext('2d', { willReadFrequently: true });
  if (!ctx) return [];
  ctx.clearRect(0, 0, canvasSize, canvasSize);
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const fontSize = Math.floor(canvasSize * 0.85);
  ctx.font = `bold ${fontSize}px "PingFang SC","Microsoft YaHei","SimHei",sans-serif`;
  ctx.fillText(char, canvasSize / 2, canvasSize / 2);
  const img = ctx.getImageData(0, 0, canvasSize, canvasSize).data;
  const pixels: PixelPoint[] = [];
  const step = 2;
  for (let y = 0; y < canvasSize; y += step) {
    for (let x = 0; x < canvasSize; x += step) {
      const idx = (y * canvasSize + x) * 4 + 3;
      if (img[idx] > 128) {
        pixels.push({ x, y });
      }
    }
  }
  if (pixels.length === 0) return [];
  if (pixels.length <= targetCount) return pixels;
  const ratio = targetCount / pixels.length;
  const result: PixelPoint[] = [];
  let acc = 0;
  for (let i = 0; i < pixels.length; i++) {
    acc += ratio;
    if (acc >= 1) {
      result.push(pixels[i]);
      acc -= 1;
    }
  }
  while (result.length < targetCount) {
    result.push(pixels[Math.floor(Math.random() * pixels.length)]);
  }
  return result.slice(0, Math.min(targetCount, result.length));
}

function getCornerStartPoint(
  cornerIndex: number,
  cw: number,
  ch: number
): { x: number; y: number } {
  const pad = 40;
  switch (cornerIndex) {
    case 0: return { x: -pad, y: -pad };
    case 1: return { x: cw + pad, y: -pad };
    case 2: return { x: -pad, y: ch + pad };
    default: return { x: cw + pad, y: ch + pad };
  }
}

function generateControlPoints(
  sx: number, sy: number,
  tx: number, ty: number,
  cw: number, ch: number
): { cp1x: number; cp1y: number; cp2x: number; cp2y: number } {
  const mx = (sx + tx) / 2;
  const my = (sy + ty) / 2;
  const dx = tx - sx;
  const dy = ty - sy;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  const offset1 = (Math.random() - 0.5) * Math.min(cw, ch) * 0.5;
  const offset2 = (Math.random() - 0.5) * Math.min(cw, ch) * 0.4;
  const cp1x = mx + nx * offset1 + (Math.random() - 0.5) * len * 0.2;
  const cp1y = my + ny * offset1 + (Math.random() - 0.5) * len * 0.2;
  const cp2x = mx + nx * offset2 + (Math.random() - 0.5) * len * 0.3;
  const cp2y = my + ny * offset2 + (Math.random() - 0.5) * len * 0.3;
  return { cp1x, cp1y, cp2x, cp2y };
}

export interface EngineContext {
  particles: Particle[];
  words: Word[];
  state: AppState;
  phaseStartTime: number;
  dims: CanvasDimensions;
  targetColor: HSLA;
}

export function createInitialContext(dims: CanvasDimensions): EngineContext {
  return {
    particles: [],
    words: [],
    state: 'idle' as AppState,
    phaseStartTime: 0,
    dims,
    targetColor: hexToHSLA('#FFD700')
  };
}

export function setTargetColor(ctx: EngineContext, hex: string): void {
  ctx.targetColor = hexToHSLA(hex);
}

export function parseTextToParticles(
  ctx: EngineContext,
  text: string,
  now: number
): void {
  const chars = Array.from(text).slice(0, 40);
  const { width: cw, height: ch } = ctx.dims;
  const n = chars.length;
  if (n === 0) return;
  const maxFontSize = Math.min(cw / (n * 1.3), ch * 0.65);
  const fontSize = Math.max(32, Math.min(maxFontSize, 120));
  const totalWidth = fontSize * 1.1 * n;
  const startX = (cw - totalWidth) / 2 + fontSize * 0.55;
  const baseY = ch / 2;
  const sampleSize = 64;
  const scale = fontSize / sampleSize;
  const allParticles: Particle[] = [];
  const words: Word[] = [];
  let idCounter = 0;
  chars.forEach((char, i) => {
    const centerX = startX + i * fontSize * 1.1;
    const centerY = baseY;
    const count = 80 + Math.floor(Math.random() * 41);
    const pixels = sampleCharacterPixels(char, sampleSize, count);
    const particles: Particle[] = pixels.map((p) => {
      const tx = centerX + (p.x - sampleSize / 2) * scale;
      const ty = centerY + (p.y - sampleSize / 2) * scale;
      const corner = Math.floor(Math.random() * 4);
      const { x: sx, y: sy } = getCornerStartPoint(corner, cw, ch);
      const { cp1x, cp1y, cp2x, cp2y } = generateControlPoints(sx, sy, tx, ty, cw, ch);
      const startColor = generateRandomBrightColor();
      const targetColor = { ...ctx.targetColor, a: 1 };
      const dx = tx - centerX;
      const dy = ty - centerY;
      const initialDistance = Math.sqrt(dx * dx + dy * dy) || 20;
      const spir: Particle = {
        id: idCounter++,
        x: sx,
        y: sy,
        targetX: tx,
        targetY: ty,
        startX: sx,
        startY: sy,
        cp1x, cp1y, cp2x, cp2y,
        currentColor: { ...startColor },
        startColor,
        targetColor,
        opacity: 1,
        delay: Math.random() * 0.6,
        startTime: now,
        duration: 1.2,
        spiralAngle: 0,
        spiralRadius: 0,
        spiralStartAngle: Math.random() * Math.PI * 2,
        initialDistance,
        size: 3,
        tremorPhase: Math.random() * Math.PI * 2
      };
      return spir;
    });
    allParticles.push(...particles);
    words.push({ char, particles, centerX, centerY });
  });
  ctx.particles = allParticles;
  ctx.words = words;
  ctx.state = 'flying_in';
  ctx.phaseStartTime = now;
}

const TWO_PI = Math.PI * 2;
const TREMOR_FREQ = 1.5 * TWO_PI;

export function updateEngine(ctx: EngineContext, nowMs: number): void {
  const now = nowMs / 1000;
  const { particles, state } = ctx;
  if (state === 'flying_in') {
    let allDone = true;
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const t0 = p.startTime / 1000;
      const elapsed = now - t0 - p.delay;
      if (elapsed <= 0) {
        p.x = p.startX;
        p.y = p.startY;
        p.currentColor = { ...p.startColor };
        p.opacity = 0.8;
        allDone = false;
        continue;
      }
      const rawT = Math.min(1, elapsed / p.duration);
      const t = easeInOutCubic(rawT);
      p.x = cubicBezier(t, p.startX, p.cp1x, p.cp2x, p.targetX);
      p.y = cubicBezier(t, p.startY, p.cp1y, p.cp2y, p.targetY);
      p.currentColor = lerpHSLA(p.startColor, p.targetColor, t);
      p.opacity = 0.7 + t * 0.3;
      if (rawT < 1) allDone = false;
    }
    if (allDone) {
      ctx.state = 'stable';
      ctx.phaseStartTime = nowMs;
    }
  } else if (state === 'stable') {
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const ph = now * TREMOR_FREQ + p.tremorPhase;
      p.x = p.targetX + Math.sin(ph) * 2;
      p.y = p.targetY + Math.cos(ph * 1.3) * 1.4;
      p.currentColor = { ...p.targetColor };
      p.opacity = 1;
    }
  } else if (state === 'dispersing') {
    const phaseStart = ctx.phaseStartTime / 1000;
    const elapsed = Math.max(0, now - phaseStart);
    const duration = 2.0;
    const rawT = Math.min(1, elapsed / duration);
    const t = easeInOutCubic(rawT);
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const theta = p.spiralStartAngle + t * TWO_PI * 2;
      const coef = 0.3 * theta * t;
      const radius = p.initialDistance * Math.exp(coef) * (0.5 + t * 2.5);
      p.x = p.targetX + Math.cos(theta) * radius;
      p.y = p.targetY + Math.sin(theta) * radius;
      p.opacity = 1 - t;
      p.currentColor = { ...p.targetColor, a: p.opacity };
    }
    if (rawT >= 1) {
      ctx.state = 'idle';
      ctx.particles = [];
      ctx.words = [];
    }
  }
}

export function startDispersing(ctx: EngineContext, nowMs: number): void {
  if (ctx.state !== 'flying_in' && ctx.state !== 'stable') return;
  ctx.state = 'dispersing';
  ctx.phaseStartTime = nowMs;
  for (let i = 0; i < ctx.particles.length; i++) {
    const p = ctx.particles[i];
    p.currentColor = { ...p.targetColor };
    p.opacity = 1;
  }
}
