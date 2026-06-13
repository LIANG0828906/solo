import type {
  Particle,
  Word,
  HSLA,
  CanvasDimensions,
  AppState,
  EngineFrameOutput,
  ParticleFrameState,
  PixelPoint as PixelPt
} from './types';

export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export function easeInCubic(t: number): number {
  return t * t * t;
}

export function hexToHSLA(hex: string): HSLA {
  const hx = hex.replace('#', '');
  const r = parseInt(hx.substring(0, 2), 16) / 255;
  const g = parseInt(hx.substring(2, 4), 16) / 255;
  const b = parseInt(hx.substring(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
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
  return `hsla(${c.h.toFixed(1)}, ${c.s.toFixed(1)}%, ${c.l.toFixed(1)}%, ${c.a.toFixed(3)})`;
}

export function lerpHSLA(a: HSLA, b: HSLA, t: number): HSLA {
  let dh = b.h - a.h;
  if (dh > 180) dh -= 360;
  if (dh < -180) dh += 360;
  return {
    h: (a.h + dh * t + 360) % 360,
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
  p0: number,
  p1: number,
  p2: number,
  p3: number
): number {
  const mt = 1 - t;
  const mt2 = mt * mt;
  const t2 = t * t;
  return mt2 * mt * p0 + 3 * mt2 * t * p1 + 3 * mt * t2 * p2 + t2 * t * p3;
}

export interface PixelPoint {
  x: number;
  y: number;
}

export interface CharSampleResult {
  pixels: PixelPoint[];
  totalPixelCount: number;
  complexity: number;
}

export function sampleCharacterPixels(
  char: string,
  canvasSize: number = 64,
  minCount: number = 80,
  maxCount: number = 120
): CharSampleResult {
  const off = document.createElement('canvas');
  off.width = canvasSize;
  off.height = canvasSize;
  const ctx = off.getContext('2d', { willReadFrequently: true });
  if (!ctx) {
    return { pixels: [], totalPixelCount: 0, complexity: 0 };
  }
  ctx.clearRect(0, 0, canvasSize, canvasSize);
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const fontSize = Math.floor(canvasSize * 0.85);
  ctx.font = `bold ${fontSize}px "PingFang SC","Microsoft YaHei","SimHei",sans-serif`;
  ctx.fillText(char, canvasSize / 2, canvasSize / 2);

  const img = ctx.getImageData(0, 0, canvasSize, canvasSize).data;

  const totalPixels: PixelPoint[] = [];
  const step = 1;
  let totalAlpha = 0;
  for (let y = 0; y < canvasSize; y += step) {
    for (let x = 0; x < canvasSize; x += step) {
      const idx = (y * canvasSize + x) * 4 + 3;
      const alpha = img[idx];
      if (alpha > 128) {
        totalPixels.push({ x, y });
        totalAlpha += alpha;
      }
    }
  }

  if (totalPixels.length === 0) {
    return { pixels: [], totalPixelCount: 0, complexity: 0 };
  }

  const maxPossible = canvasSize * canvasSize;
  const complexity = Math.min(1, totalPixels.length / (canvasSize * canvasSize * 0.3));

  const targetCount = Math.round(minCount + (maxCount - minCount) * complexity);
  const clampedCount = Math.max(minCount, Math.min(maxCount, targetCount));

  if (totalPixels.length <= clampedCount) {
    return {
      pixels: totalPixels.slice(),
      totalPixelCount: totalPixels.length,
      complexity
    };
  }

  const result: PixelPoint[] = [];
  const ratio = clampedCount / totalPixels.length;
  let acc = 0;
  for (let i = 0; i < totalPixels.length; i++) {
    acc += ratio;
    if (acc >= 1) {
      result.push(totalPixels[i]);
      acc -= 1;
    }
  }

  while (result.length < clampedCount) {
    result.push(totalPixels[Math.floor(Math.random() * totalPixels.length)]);
  }

  return {
    pixels: result.slice(0, clampedCount),
    totalPixelCount: totalPixels.length,
    complexity
  };
}

function getCornerStartPoint(
  cornerIndex: number,
  cw: number,
  ch: number
): { x: number; y: number } {
  const pad = 50;
  switch (cornerIndex) {
    case 0:
      return { x: -pad, y: -pad };
    case 1:
      return { x: cw + pad, y: -pad };
    case 2:
      return { x: -pad, y: ch + pad };
    default:
      return { x: cw + pad, y: ch + pad };
  }
}

function generateControlPoints(
  sx: number,
  sy: number,
  tx: number,
  ty: number,
  cw: number,
  ch: number,
  cornerIndex: number
): { cp1x: number; cp1y: number; cp2x: number; cp2y: number } {
  const dx = tx - sx;
  const dy = ty - sy;
  const dist = Math.sqrt(dx * dx + dy * dy) || 1;
  const dirX = dx / dist;
  const dirY = dy / dist;

  const midX = (sx + tx) / 2;
  const midY = (sy + ty) / 2;

  const normalX = -dirY;
  const normalY = dirX;

  const curveAmount = Math.min(cw, ch) * 0.25;
  const curveSign = (cornerIndex % 2 === 0) ? 1 : -1;
  const randomVariation = 0.7 + Math.random() * 0.6;

  const curveOffset = curveAmount * curveSign * randomVariation;

  const cp1Dist = dist * 0.3;
  const cp2Dist = dist * 0.7;

  const cp1x = sx + dirX * cp1Dist + normalX * curveOffset * 0.8;
  const cp1y = sy + dirY * cp1Dist + normalY * curveOffset * 0.8;
  const cp2x = sx + dirX * cp2Dist + normalX * curveOffset * 0.5;
  const cp2y = sy + dirY * cp2Dist + normalY * curveOffset * 0.5;

  return { cp1x, cp1y, cp2x, cp2y };
}

export interface EngineContext {
  readonly particles: readonly Particle[];
  readonly words: readonly Word[];
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
  if (ctx.state === 'stable' || ctx.state === 'flying_in') {
    const target = { ...ctx.targetColor, a: 1 };
    for (const p of ctx.particles) {
      p.targetColor = target;
    }
  }
}

export function parseTextToParticles(
  ctx: EngineContext,
  text: string,
  nowMs: number
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

  chars.forEach((char, charIndex) => {
    const centerX = startX + charIndex * fontSize * 1.1;
    const centerY = baseY;

    const sampleResult = sampleCharacterPixels(char, sampleSize, 80, 120);
    const pixels = sampleResult.pixels;

    const particles: Particle[] = pixels.map((p, _i) => {
      const tx = centerX + (p.x - sampleSize / 2) * scale;
      const ty = centerY + (p.y - sampleSize / 2) * scale;

      const corner = Math.floor(Math.random() * 4);
      const { x: sx, y: sy } = getCornerStartPoint(corner, cw, ch);
      const { cp1x, cp1y, cp2x, cp2y } = generateControlPoints(sx, sy, tx, ty, cw, ch, corner);

      const startColor = generateRandomBrightColor();
      const targetColor = { ...ctx.targetColor, a: 1 };

      const dx = tx - centerX;
      const dy = ty - centerY;
      const initialDistance = Math.sqrt(dx * dx + dy * dy) || 20;

      const particle: Particle = {
        id: idCounter++,
        x: sx,
        y: sy,
        targetX: tx,
        targetY: ty,
        startX: sx,
        startY: sy,
        cp1x,
        cp1y,
        cp2x,
        cp2y,
        currentColor: { ...startColor },
        startColor,
        targetColor,
        opacity: 0,
        delay: Math.random() * 0.6,
        startTime: nowMs,
        duration: 1.2,
        spiralStartAngle: Math.atan2(dy, dx),
        initialDistance,
        size: 3,
        tremorPhase: Math.random() * Math.PI * 2
      };

      return particle;
    });

    allParticles.push(...particles);
    words.push({
      char,
      particles,
      centerX,
      centerY,
      strokeComplexity: sampleResult.complexity
    });
  });

  ctx.particles = allParticles;
  ctx.words = words;
  ctx.state = 'flying_in';
  ctx.phaseStartTime = nowMs;
}

const TWO_PI = Math.PI * 2;
const TREMOR_FREQ_HZ = 1.5;
const TREMOR_ANGULAR_FREQ = TREMOR_FREQ_HZ * TWO_PI;
const TREMOR_AMPLITUDE = 2;

const SPIRAL_GROWTH_RATE = 0.3;
const SPIRAL_ROTATIONS = 2;
const DISPERSE_DURATION = 2.0;

function updateFlyingIn(particles: Particle[], nowMs: number): boolean {
  let allDone = true;

  for (let i = 0; i < particles.length; i++) {
    const p = particles[i];
    const elapsedSec = (nowMs - p.startTime) / 1000 - p.delay;

    if (elapsedSec <= 0) {
      p.x = p.startX;
      p.y = p.startY;
      p.currentColor = { ...p.startColor };
      p.opacity = 0;
      allDone = false;
      continue;
    }

    const rawT = Math.min(1, elapsedSec / p.duration);
    const easedT = easeInOutCubic(rawT);

    p.x = cubicBezier(easedT, p.startX, p.cp1x, p.cp2x, p.targetX);
    p.y = cubicBezier(easedT, p.startY, p.cp1y, p.cp2y, p.targetY);
    p.currentColor = lerpHSLA(p.startColor, p.targetColor, easedT);
    p.opacity = easedT;

    if (rawT < 1) {
      allDone = false;
    }
  }

  return allDone;
}

function updateStable(particles: Particle[], nowMs: number): void {
  const nowSec = nowMs / 1000;

  for (let i = 0; i < particles.length; i++) {
    const p = particles[i];
    const phase = nowSec * TREMOR_ANGULAR_FREQ + p.tremorPhase;

    p.x = p.targetX + Math.sin(phase) * TREMOR_AMPLITUDE;
    p.y = p.targetY + Math.cos(phase) * TREMOR_AMPLITUDE * 0.7;
    p.currentColor = { ...p.targetColor };
    p.opacity = 1;
  }
}

function getTextCenter(ctx: EngineContext): { x: number; y: number } {
  const words = ctx.words;
  if (words.length === 0) {
    return { x: ctx.dims.width / 2, y: ctx.dims.height / 2 };
  }
  let sumX = 0;
  let sumY = 0;
  for (const w of words) {
    sumX += w.centerX;
    sumY += w.centerY;
  }
  return { x: sumX / words.length, y: sumY / words.length };
}

function updateDispersing(
  ctx: EngineContext,
  phaseStartMs: number,
  nowMs: number
): boolean {
  const particles = ctx.particles as Particle[];
  const elapsed = (nowMs - phaseStartMs) / 1000;
  const rawT = Math.min(1, elapsed / DISPERSE_DURATION);
  const easedT = easeInOutCubic(rawT);
  const center = getTextCenter(ctx);

  for (let i = 0; i < particles.length; i++) {
    const p = particles[i];

    const angleDelta = easedT * TWO_PI * SPIRAL_ROTATIONS;
    const currentAngle = p.spiralStartAngle + angleDelta;
    const radius = p.initialDistance * Math.exp(SPIRAL_GROWTH_RATE * angleDelta);

    p.x = center.x + Math.cos(currentAngle) * radius;
    p.y = center.y + Math.sin(currentAngle) * radius;

    p.opacity = 1 - easedT;
    p.currentColor = { ...p.targetColor, a: p.opacity };
  }

  return rawT >= 1;
}

export function updateEngine(ctx: EngineContext, nowMs: number): EngineFrameOutput {
  const { particles, state } = ctx;

  if (state === 'flying_in') {
    const allDone = updateFlyingIn(particles as Particle[], nowMs);
    if (allDone) {
      ctx.state = 'stable';
      ctx.phaseStartTime = nowMs;
      updateStable(particles as Particle[], nowMs);
    }
  } else if (state === 'stable') {
    updateStable(particles as Particle[], nowMs);
  } else if (state === 'dispersing') {
    const done = updateDispersing(
      ctx,
      ctx.phaseStartTime,
      nowMs
    );
    if (done) {
      ctx.state = 'idle';
      ctx.particles = [];
      ctx.words = [];
    }
  }

  const frameParticles: ParticleFrameState[] = [];
  for (let i = 0; i < ctx.particles.length; i++) {
    const p = ctx.particles[i];
    if (p.opacity > 0.01) {
      frameParticles.push({
        x: p.x,
        y: p.y,
        color: p.currentColor,
        size: p.size,
        opacity: p.opacity
      });
    }
  }

  return {
    particles: frameParticles,
    state: ctx.state,
    particleCount: frameParticles.length
  };
}

export function startDispersing(ctx: EngineContext, nowMs: number): void {
  if (ctx.state !== 'flying_in' && ctx.state !== 'stable') return;
  ctx.state = 'dispersing';
  ctx.phaseStartTime = nowMs;
  const center = getTextCenter(ctx);
  const targetColor = { ...ctx.targetColor, a: 1 };
  for (const p of ctx.particles) {
    const dx = p.x - center.x;
    const dy = p.y - center.y;
    p.spiralStartAngle = Math.atan2(dy, dx);
    p.initialDistance = Math.sqrt(dx * dx + dy * dy) || 20;
    p.targetColor = { ...targetColor };
  }
}

export function getEngineStats(ctx: EngineContext): { totalParticles: number; state: AppState } {
  return {
    totalParticles: ctx.particles.length,
    state: ctx.state
  };
}
