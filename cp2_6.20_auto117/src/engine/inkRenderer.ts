export interface RenderParams {
  brushDensity: number;
  theme: 'autumn' | 'spring' | 'winter';
  animSpeed: number;
}

export interface ThemeColors {
  bg: string;
  ink: string;
  inkLight: string;
  accent: string;
  waterColor: string;
  moonColor: string;
  sealColor: string;
  mountain1: string;
  mountain2: string;
  mountain3: string;
  foliage: string;
  sky: string;
}

const THEMES: Record<string, ThemeColors> = {
  autumn: {
    bg: '#f5eed6',
    ink: '#2c1810',
    inkLight: '#6b4c3b',
    accent: '#c4650a',
    waterColor: 'rgba(120,100,80,0.3)',
    moonColor: '#f0d080',
    sealColor: '#cc3300',
    mountain1: 'rgba(80,50,30,0.7)',
    mountain2: 'rgba(100,70,40,0.5)',
    mountain3: 'rgba(130,90,50,0.3)',
    foliage: '#8b6914',
    sky: 'rgba(245,220,180,0.2)',
  },
  spring: {
    bg: '#f0f5e8',
    ink: '#1a3a2a',
    inkLight: '#4a7a5a',
    accent: '#5a9e6f',
    waterColor: 'rgba(80,130,160,0.3)',
    moonColor: '#e8f0d0',
    sealColor: '#cc3300',
    mountain1: 'rgba(40,80,60,0.7)',
    mountain2: 'rgba(60,100,80,0.5)',
    mountain3: 'rgba(80,130,100,0.3)',
    foliage: '#3a8a5a',
    sky: 'rgba(200,230,210,0.2)',
  },
  winter: {
    bg: '#eef2f7',
    ink: '#2a3040',
    inkLight: '#5a6080',
    accent: '#4a6a9a',
    waterColor: 'rgba(100,120,160,0.25)',
    moonColor: '#d0e0f0',
    sealColor: '#cc3300',
    mountain1: 'rgba(50,55,70,0.7)',
    mountain2: 'rgba(70,75,95,0.5)',
    mountain3: 'rgba(100,105,130,0.3)',
    foliage: '#6a8ab0',
    sky: 'rgba(200,210,230,0.3)',
  },
};

export function getThemeColors(theme: string): ThemeColors {
  return THEMES[theme] || THEMES.autumn;
}

interface InkParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  radius: number;
  color: string;
}

interface WaterRipple {
  x: number;
  y: number;
  rx: number;
  ry: number;
  maxRx: number;
  life: number;
  maxLife: number;
}

interface MountainLayer {
  controlPoints: { x: number; y: number }[];
  baseY: number;
  amp: number;
  color: string;
  driftSpeed: number;
  driftOffset: number;
}

interface SceneState {
  time: number;
  mountainOffset: number;
  waterPhase: number;
  birdPositions: { x: number; y: number; speed: number; amplitude: number; phase: number; freq: number; baseY: number; trail: { x: number; y: number }[] }[];
  moonGlow: number;
  moonGlowDir: number;
  bambooSway: number;
  cloudOffset: number;
  rainDrops: { x: number; y: number; speed: number }[];
  snowFlakes: { x: number; y: number; speed: number; drift: number }[];
  leafPositions: { x: number; y: number; rot: number; speed: number; drift: number }[];
  inkParticles: InkParticle[];
  waterRipples: WaterRipple[];
  mountainLayers: MountainLayer[];
  mountainInited: boolean;
  breathPhase: number;
}

function smoothNoise(x: number, seed: number = 0): number {
  const n = Math.sin(x * 12.9898 + seed * 78.233) * 43758.5453;
  const frac = n - Math.floor(n);
  return frac * 2 - 1;
}

function interpolatedNoise(x: number, seed: number = 0): number {
  const intX = Math.floor(x);
  const fracX = x - intX;
  const v1 = smoothNoise(intX, seed);
  const v2 = smoothNoise(intX + 1, seed);
  const t = fracX * fracX * (3 - 2 * fracX);
  return v1 * (1 - t) + v2 * t;
}

function layeredNoise(x: number, octaves: number, seed: number = 0): number {
  let value = 0;
  let amplitude = 1;
  let frequency = 1;
  let maxValue = 0;
  for (let i = 0; i < octaves; i++) {
    value += interpolatedNoise(x * frequency, seed + i * 13) * amplitude;
    maxValue += amplitude;
    amplitude *= 0.5;
    frequency *= 2;
  }
  return value / maxValue;
}

function drawInkWash(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  color: string,
  alpha: number
) {
  const steps = 5;
  for (let i = steps; i > 0; i--) {
    const r = radius * (i / steps);
    const a = alpha * (1 - (i - 1) / steps) * 0.6;
    const grd = ctx.createRadialGradient(x, y, 0, x, y, r);
    grd.addColorStop(0, color.replace(/[\d.]+\)$/, `${a})`));
    grd.addColorStop(0.5, color.replace(/[\d.]+\)$/, `${a * 0.5})`));
    grd.addColorStop(1, color.replace(/[\d.]+\)$/, `0)`));
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
}

function initMountainLayers(w: number, h: number, colors: ThemeColors): MountainLayer[] {
  const layers: MountainLayer[] = [];
  const configs = [
    { baseYRatio: 0.55, ampRatio: 0.12, color: colors.mountain1, seed: 1, drift: 0.08, ptCount: 8 },
    { baseYRatio: 0.60, ampRatio: 0.09, color: colors.mountain2, seed: 2, drift: 0.12, ptCount: 10 },
    { baseYRatio: 0.64, ampRatio: 0.06, color: colors.mountain3, seed: 3, drift: 0.18, ptCount: 12 },
  ];

  for (const cfg of configs) {
    const pts: { x: number; y: number }[] = [];
    const baseY = h * cfg.baseYRatio;
    const amp = h * cfg.ampRatio;
    const count = cfg.ptCount;
    for (let i = 0; i <= count; i++) {
      const px = (i / count) * (w + 100) - 50;
      const noiseVal = layeredNoise(i * 0.8, 3, cfg.seed);
      const py = baseY - amp * (0.4 + noiseVal * 0.6);
      pts.push({ x: px, y: py });
    }
    layers.push({
      controlPoints: pts,
      baseY,
      amp,
      color: cfg.color,
      driftSpeed: cfg.drift,
      driftOffset: 0,
    });
  }
  return layers;
}

function createSceneState(w: number = 768, h: number = 512): SceneState {
  const birds = Array.from({ length: 5 }, () => {
    const baseY = 80 + Math.random() * 120;
    return {
      x: Math.random() * w,
      y: baseY,
      baseY,
      speed: 0.3 + Math.random() * 0.5,
      amplitude: 10 + Math.random() * 20,
      phase: Math.random() * Math.PI * 2,
      freq: 0.008 + Math.random() * 0.006,
      trail: [] as { x: number; y: number }[],
    };
  });

  const rainDrops = Array.from({ length: 80 }, () => ({
    x: Math.random() * w,
    y: Math.random() * h,
    speed: 2 + Math.random() * 3,
  }));

  const snowFlakes = Array.from({ length: 60 }, () => ({
    x: Math.random() * w,
    y: Math.random() * h,
    speed: 0.3 + Math.random() * 0.8,
    drift: (Math.random() - 0.5) * 0.5,
  }));

  const leafPositions = Array.from({ length: 12 }, () => ({
    x: Math.random() * w,
    y: -20 + Math.random() * 100,
    rot: Math.random() * Math.PI * 2,
    speed: 0.3 + Math.random() * 0.4,
    drift: (Math.random() - 0.5) * 0.3,
  }));

  return {
    time: 0,
    mountainOffset: 0,
    waterPhase: 0,
    birdPositions: birds,
    moonGlow: 4,
    moonGlowDir: 1,
    bambooSway: 0,
    cloudOffset: 0,
    rainDrops,
    snowFlakes,
    leafPositions,
    inkParticles: [],
    waterRipples: [],
    mountainLayers: [],
    mountainInited: false,
    breathPhase: 0,
  };
}

function drawXuanPaperTexture(ctx: CanvasRenderingContext2D, w: number, h: number, colors: ThemeColors) {
  ctx.fillStyle = colors.bg;
  ctx.fillRect(0, 0, w, h);

  for (let i = 0; i < 3000; i++) {
    const x = Math.random() * w;
    const y = Math.random() * h;
    const alpha = Math.random() * 0.03;
    ctx.fillStyle = `rgba(0,0,0,${alpha})`;
    ctx.fillRect(x, y, 1, 1);
  }

  const grad = ctx.createLinearGradient(0, 0, w, h);
  grad.addColorStop(0, 'rgba(0,0,0,0.01)');
  grad.addColorStop(0.5, 'rgba(0,0,0,0)');
  grad.addColorStop(1, 'rgba(0,0,0,0.01)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 0, g: 0, b: 0 };
}

function parseColor(color: string): { r: number; g: number; b: number; a: number } {
  if (color.startsWith('#')) {
    const rgb = hexToRgb(color);
    return { ...rgb, a: 1 };
  }
  const rgbaMatch = color.match(/rgba?\(([^)]+)\)/);
  if (rgbaMatch) {
    const parts = rgbaMatch[1].split(',').map((s) => parseFloat(s.trim()));
    return { r: parts[0] || 0, g: parts[1] || 0, b: parts[2] || 0, a: parts[3] !== undefined ? parts[3] : 1 };
  }
  return { r: 0, g: 0, b: 0, a: 1 };
}

function drawMountains(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  colors: ThemeColors,
  density: number,
  state: SceneState,
  hasMountain: boolean
) {
  if (!hasMountain) return;
  const inkMul = density / 5;

  ctx.save();

  for (let li = 0; li < state.mountainLayers.length; li++) {
    const layer = state.mountainLayers[li];
    const drift = layer.driftOffset;

    ctx.beginPath();
    ctx.moveTo(-50, h);

    const pts = layer.controlPoints;
    const firstPt = pts[0];
    ctx.lineTo(firstPt.x + drift, firstPt.y);

    for (let i = 1; i < pts.length - 1; i++) {
      const p0 = pts[i - 1];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const cpx1 = p0.x + drift + (p1.x - p0.x) / 2;
      const cpy1 = p0.y + (p1.y - p0.y) / 2;
      const cpx2 = p1.x + drift - (p2.x - p1.x) / 2;
      const cpy2 = p1.y - (p2.y - p1.y) / 2;
      ctx.bezierCurveTo(cpx1, cpy1, cpx2, cpy2, p1.x + drift, p1.y);
    }

    const lastPt = pts[pts.length - 1];
    const prevPt = pts[pts.length - 2];
    ctx.bezierCurveTo(
      prevPt.x + drift + (lastPt.x - prevPt.x) * 0.75,
      prevPt.y + (lastPt.y - prevPt.y) * 0.75,
      lastPt.x + drift - 10,
      lastPt.y,
      lastPt.x + drift,
      lastPt.y
    );

    ctx.lineTo(w + 50, h);
    ctx.closePath();

    const col = parseColor(layer.color);
    const layerAlpha = Math.min(1, col.a * inkMul);

    const grd = ctx.createLinearGradient(0, layer.baseY - layer.amp, 0, h);
    grd.addColorStop(0, `rgba(${col.r},${col.g},${col.b},${layerAlpha})`);
    grd.addColorStop(0.5, `rgba(${col.r},${col.g},${col.b},${layerAlpha * 0.7})`);
    grd.addColorStop(1, `rgba(${col.r},${col.g},${col.b},0)`);
    ctx.fillStyle = grd;
    ctx.fill();

    for (let wi = 0; wi < 8 * inkMul; wi++) {
      const t = (wi / 8 + state.time * 0.02 * layer.driftSpeed) % 1;
      const wx = t * (w + 200) - 100 + drift * 0.5;
      const ptIdx = Math.floor(t * (pts.length - 1));
      const localT = t * (pts.length - 1) - ptIdx;
      const pA = pts[ptIdx];
      const pB = pts[Math.min(ptIdx + 1, pts.length - 1)];
      const wy = pA.y + (pB.y - pA.y) * localT + 10 + wi * 3;
      drawInkWash(ctx, wx, wy, 25 + wi * 5, `rgba(${col.r},${col.g},${col.b},${layerAlpha * 0.4})`, 1);
    }
  }

  const inkCol = parseColor(colors.ink);
  for (let i = 0; i < 6 * inkMul; i++) {
    const x = (i * 137 + state.mountainOffset * 0.05) % w;
    const baseY = h * 0.55;
    const peakY = baseY - 30 - Math.random() * 40;
    ctx.beginPath();
    ctx.moveTo(x, peakY);
    ctx.quadraticCurveTo(x - 15, peakY + 30, x - 8, peakY + 60);
    ctx.quadraticCurveTo(x + 5, peakY + 30, x, peakY);
    ctx.fillStyle = `rgba(${inkCol.r},${inkCol.g},${inkCol.b},${0.05 * inkMul})`;
    ctx.fill();
  }

  ctx.restore();
}

function drawWater(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  colors: ThemeColors,
  density: number,
  state: SceneState,
  hasWater: boolean
) {
  if (!hasWater) return;
  const waterY = h * 0.72;
  const inkMul = density / 5;
  const phase = state.waterPhase;

  ctx.save();

  const waterCol = parseColor(colors.waterColor);
  const fillAlpha = Math.min(1, 0.4 * inkMul);

  const g = ctx.createLinearGradient(0, waterY, 0, h);
  g.addColorStop(0, `rgba(${waterCol.r},${waterCol.g},${waterCol.b},${fillAlpha})`);
  g.addColorStop(0.5, `rgba(${waterCol.r},${waterCol.g},${waterCol.b},${fillAlpha * 0.4})`);
  g.addColorStop(1, `rgba(${waterCol.r},${waterCol.g},${waterCol.b},0)`);
  ctx.fillStyle = g;

  ctx.beginPath();
  ctx.moveTo(0, waterY);
  for (let x = 0; x <= w; x += 2) {
    const noiseVal = layeredNoise(x * 0.01 + phase * 0.5, 2, 5);
    const y =
      waterY +
      Math.sin(x * 0.02 + phase) * 3 +
      Math.sin(x * 0.05 + phase * 1.3) * 1.5 +
      noiseVal * 2;
    ctx.lineTo(x, y);
  }
  ctx.lineTo(w, h);
  ctx.lineTo(0, h);
  ctx.closePath();
  ctx.fill();

  const inkLightCol = parseColor(colors.inkLight);
  ctx.strokeStyle = `rgba(${inkLightCol.r},${inkLightCol.g},${inkLightCol.b},${0.2 * inkMul})`;
  ctx.lineWidth = 0.5;
  for (let i = 0; i < 6; i++) {
    const ly = waterY + 15 + i * 12;
    ctx.beginPath();
    for (let x = 0; x <= w; x += 3) {
      const noiseVal = layeredNoise(x * 0.015 + phase + i * 0.3, 2, i + 7);
      const y = ly + Math.sin(x * 0.03 + phase + i * 0.8) * 2 + noiseVal * 1.5;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  for (const ripple of state.waterRipples) {
    const lifeRatio = ripple.life / ripple.maxLife;
    const rippleAlpha = lifeRatio * 0.35 * inkMul;
    ctx.strokeStyle = `rgba(${inkLightCol.r},${inkLightCol.g},${inkLightCol.b},${rippleAlpha})`;
    ctx.lineWidth = 0.8 * lifeRatio + 0.2;
    ctx.beginPath();
    ctx.ellipse(ripple.x, ripple.y, ripple.rx, ripple.ry, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.restore();
}

function drawBirds(
  ctx: CanvasRenderingContext2D,
  w: number,
  colors: ThemeColors,
  density: number,
  state: SceneState,
  hasBird: boolean
) {
  if (!hasBird) return;
  const inkMul = density / 5;
  const inkCol = parseColor(colors.ink);

  ctx.save();

  for (const b of state.birdPositions) {
    const y = b.baseY + Math.sin((b.x * b.freq) + b.phase) * b.amplitude;

    for (let ti = 0; ti < b.trail.length; ti++) {
      const tp = b.trail[ti];
      const trailAlpha = ((ti + 1) / b.trail.length) * 0.15 * inkMul;
      const trailRadius = 1.5 + (b.trail.length - ti) * 0.3;
      drawInkWash(ctx, tp.x, tp.y, trailRadius, `rgba(${inkCol.r},${inkCol.g},${inkCol.b},${trailAlpha})`, 1);
    }

    const wingFlap = Math.sin(b.phase) * 4;
    ctx.strokeStyle = `rgba(${inkCol.r},${inkCol.g},${inkCol.b},${0.7 * inkMul})`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(b.x - 8, y + wingFlap);
    ctx.quadraticCurveTo(b.x - 3, y - 2, b.x, y);
    ctx.quadraticCurveTo(b.x + 3, y - 2, b.x + 8, y + wingFlap);
    ctx.stroke();
  }

  ctx.restore();
}

function drawMoon(
  ctx: CanvasRenderingContext2D,
  w: number,
  colors: ThemeColors,
  density: number,
  state: SceneState,
  hasMoon: boolean
) {
  if (!hasMoon) return;
  const cx = w * 0.78;
  const cy = 90;
  const r = 25;
  const inkMul = density / 5;

  const breathRadius = 2 + (Math.sin(state.breathPhase) + 1) * 2;
  const moonCol = parseColor(colors.moonColor);
  const pulsePhase = (state.breathPhase % (Math.PI * 2)) / (Math.PI * 2);

  ctx.save();

  for (let i = 5; i > 0; i--) {
    const glowR = r + breathRadius * i * 1.8;
    const glowAlpha = (0.12 * inkMul) / i;
    const gr = ctx.createRadialGradient(cx, cy, r, cx, cy, glowR);
    gr.addColorStop(0, `rgba(${moonCol.r},${moonCol.g},${moonCol.b},${glowAlpha})`);
    gr.addColorStop(1, `rgba(${moonCol.r},${moonCol.g},${moonCol.b},0)`);
    ctx.fillStyle = gr;
    ctx.beginPath();
    ctx.arc(cx, cy, glowR, 0, Math.PI * 2);
    ctx.fill();
  }

  const pulseR = r + breathRadius * 6 + pulsePhase * 20;
  const pulseAlpha = (1 - pulsePhase) * 0.08 * inkMul;
  const pulseGrd = ctx.createRadialGradient(cx, cy, pulseR - 10, cx, cy, pulseR);
  pulseGrd.addColorStop(0, `rgba(${moonCol.r},${moonCol.g},${moonCol.b},0)`);
  pulseGrd.addColorStop(0.5, `rgba(${moonCol.r},${moonCol.g},${moonCol.b},${pulseAlpha})`);
  pulseGrd.addColorStop(1, `rgba(${moonCol.r},${moonCol.g},${moonCol.b},0)`);
  ctx.fillStyle = pulseGrd;
  ctx.beginPath();
  ctx.arc(cx, cy, pulseR, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = `rgba(${moonCol.r},${moonCol.g},${moonCol.b},${0.85 * inkMul})`;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();

  const bgCol = parseColor(colors.bg);
  ctx.fillStyle = `rgba(${bgCol.r},${bgCol.g},${bgCol.b},0.3)`;
  ctx.beginPath();
  ctx.arc(cx + 8, cy - 5, r * 0.85, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawBamboo(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  colors: ThemeColors,
  density: number,
  sway: number,
  hasBamboo: boolean
) {
  if (!hasBamboo) return;
  const inkMul = density / 5;
  const inkCol = parseColor(colors.ink);
  const foliageCol = parseColor(colors.foliage);

  ctx.save();

  const bambooPositions = [
    { x: 60, height: 280, segments: 5 },
    { x: 90, height: 220, segments: 4 },
    { x: 45, height: 180, segments: 3 },
  ];

  for (const bp of bambooPositions) {
    const swayOff = Math.sin(sway + bp.x * 0.01) * 3;

    ctx.strokeStyle = `rgba(${inkCol.r},${inkCol.g},${inkCol.b},${0.6 * inkMul})`;
    ctx.lineWidth = 3;

    for (let s = 0; s < bp.segments; s++) {
      const y1 = h - 80 - (s * bp.height) / bp.segments;
      const y2 = h - 80 - ((s + 1) * bp.height) / bp.segments;
      const segSway = swayOff * (s + 1) * 0.15;

      ctx.beginPath();
      ctx.moveTo(bp.x + segSway * s * 0.5, y1);
      ctx.lineTo(bp.x + segSway * (s + 1) * 0.5, y2);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(bp.x + segSway * (s + 1) * 0.5 - 4, y2);
      ctx.lineTo(bp.x + segSway * (s + 1) * 0.5 + 4, y2);
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.lineWidth = 3;
    }

    for (let l = 0; l < 4; l++) {
      const segIdx = Math.floor(Math.random() * bp.segments);
      const ly = h - 80 - ((segIdx + 0.5) * bp.height) / bp.segments;
      const lx = bp.x + swayOff * segIdx * 0.15;
      const dir = l % 2 === 0 ? 1 : -1;

      ctx.globalAlpha = 0.4 * inkMul;
      ctx.fillStyle = `rgba(${foliageCol.r},${foliageCol.g},${foliageCol.b},${0.4 * inkMul})`;
      ctx.beginPath();
      ctx.moveTo(lx, ly);
      ctx.quadraticCurveTo(
        lx + dir * 25 + swayOff,
        ly - 5,
        lx + dir * 35 + swayOff * 1.5,
        ly + 3
      );
      ctx.quadraticCurveTo(
        lx + dir * 20 + swayOff,
        ly + 5,
        lx,
        ly
      );
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }

  ctx.restore();
}

function drawBoat(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  colors: ThemeColors,
  density: number,
  phase: number,
  hasBoat: boolean
) {
  if (!hasBoat) return;
  const inkMul = density / 5;
  const inkCol = parseColor(colors.ink);
  const inkLightCol = parseColor(colors.inkLight);
  const bx = w * 0.45;
  const by = h * 0.7 + Math.sin(phase * 0.5) * 3;

  ctx.save();
  ctx.strokeStyle = `rgba(${inkCol.r},${inkCol.g},${inkCol.b},${0.7 * inkMul})`;
  ctx.lineWidth = 2;

  ctx.beginPath();
  ctx.moveTo(bx - 25, by);
  ctx.quadraticCurveTo(bx - 20, by + 10, bx, by + 12);
  ctx.quadraticCurveTo(bx + 20, by + 10, bx + 25, by);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(bx + 3, by - 20);
  ctx.lineTo(bx + 3, by);
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(bx + 3, by - 18);
  ctx.quadraticCurveTo(bx + 18, by - 10, bx + 15, by - 2);
  ctx.fillStyle = `rgba(${inkLightCol.r},${inkLightCol.g},${inkLightCol.b},${0.3 * inkMul})`;
  ctx.fill();

  ctx.restore();
}

function drawClouds(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  colors: ThemeColors,
  density: number,
  offset: number,
  hasCloud: boolean
) {
  if (!hasCloud) return;
  const inkMul = density / 5;
  const inkLightCol = parseColor(colors.inkLight);

  ctx.save();
  ctx.globalAlpha = 0.15 * inkMul;

  const cloudPositions = [
    { x: (200 + offset * 0.3) % (w + 200) - 100, y: 100 },
    { x: (400 + offset * 0.2) % (w + 200) - 100, y: 60 },
    { x: (600 + offset * 0.15) % (w + 200) - 100, y: 130 },
  ];

  for (const cp of cloudPositions) {
    ctx.fillStyle = `rgba(${inkLightCol.r},${inkLightCol.g},${inkLightCol.b},${0.15 * inkMul})`;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.ellipse(
        cp.x + i * 30,
        cp.y + Math.sin(i) * 5,
        40 + i * 10,
        12 + i * 3,
        0, 0, Math.PI * 2
      );
      ctx.fill();
    }
  }

  ctx.restore();
}

function drawRain(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  colors: ThemeColors,
  drops: SceneState['rainDrops'],
  hasRain: boolean
) {
  if (!hasRain) return;
  const inkLightCol = parseColor(colors.inkLight);

  ctx.save();
  ctx.strokeStyle = `rgba(${inkLightCol.r},${inkLightCol.g},${inkLightCol.b},0.25)`;
  ctx.lineWidth = 0.8;

  for (const d of drops) {
    ctx.beginPath();
    ctx.moveTo(d.x, d.y);
    ctx.lineTo(d.x - 1, d.y + 8);
    ctx.stroke();
  }

  ctx.restore();
}

function drawSnow(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  colors: ThemeColors,
  flakes: SceneState['snowFlakes'],
  hasSnow: boolean
) {
  if (!hasSnow) return;
  const inkLightCol = parseColor(colors.inkLight);

  ctx.save();
  ctx.fillStyle = `rgba(${inkLightCol.r},${inkLightCol.g},${inkLightCol.b},0.7)`;

  for (const f of flakes) {
    ctx.beginPath();
    ctx.arc(f.x, f.y, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function drawFlowers(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  colors: ThemeColors,
  density: number,
  hasFlower: boolean
) {
  if (!hasFlower) return;
  const inkMul = density / 5;
  const inkCol = parseColor(colors.ink);
  const accentCol = parseColor(colors.accent);

  ctx.save();

  const flowerPos = [
    { x: w * 0.65, y: h * 0.55 },
    { x: w * 0.72, y: h * 0.58 },
    { x: w * 0.58, y: h * 0.6 },
  ];

  for (const fp of flowerPos) {
    ctx.strokeStyle = `rgba(${inkCol.r},${inkCol.g},${inkCol.b},${0.4 * inkMul})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(fp.x, fp.y);
    ctx.quadraticCurveTo(fp.x - 10, fp.y - 20, fp.x - 5, fp.y - 40);
    ctx.stroke();

    ctx.fillStyle = `rgba(${accentCol.r},${accentCol.g},${accentCol.b},${0.35 * inkMul})`;
    for (let p = 0; p < 5; p++) {
      const angle = (p / 5) * Math.PI * 2;
      const px = fp.x - 5 + Math.cos(angle) * 6;
      const py = fp.y - 40 + Math.sin(angle) * 6;
      ctx.beginPath();
      ctx.ellipse(px, py, 4, 2.5, angle, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = `rgba(232,192,64,${0.5 * inkMul})`;
    ctx.beginPath();
    ctx.arc(fp.x - 5, fp.y - 40, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function drawFallingLeaves(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  colors: ThemeColors,
  leaves: SceneState['leafPositions'],
  state: SceneState,
  hasFlower: boolean
) {
  if (!hasFlower) return;
  const foliageCol = parseColor(colors.foliage);

  ctx.save();
  ctx.fillStyle = `rgba(${foliageCol.r},${foliageCol.g},${foliageCol.b},0.4)`;

  for (const leaf of leaves) {
    ctx.save();
    ctx.translate(leaf.x, leaf.y);
    ctx.rotate(leaf.rot);
    ctx.beginPath();
    ctx.ellipse(0, 0, 3, 1.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  ctx.restore();
}

function drawSun(
  ctx: CanvasRenderingContext2D,
  w: number,
  colors: ThemeColors,
  density: number,
  hasSun: boolean
) {
  if (!hasSun) return;
  const cx = w * 0.25;
  const cy = 80;
  const inkMul = density / 5;

  ctx.save();

  const gr = ctx.createRadialGradient(cx, cy, 5, cx, cy, 60);
  gr.addColorStop(0, `rgba(240,180,80,${0.4 * inkMul})`);
  gr.addColorStop(1, 'rgba(240,180,80,0)');
  ctx.fillStyle = gr;
  ctx.beginPath();
  ctx.arc(cx, cy, 60, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = `rgba(240,176,80,${0.6 * inkMul})`;
  ctx.beginPath();
  ctx.arc(cx, cy, 15, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawStars(
  ctx: CanvasRenderingContext2D,
  w: number,
  colors: ThemeColors,
  time: number,
  hasStar: boolean
) {
  if (!hasStar) return;

  ctx.save();
  const starPositions = [
    { x: 150, y: 50 }, { x: 300, y: 30 }, { x: 450, y: 60 },
    { x: 550, y: 40 }, { x: 650, y: 70 }, { x: 200, y: 80 },
    { x: 380, y: 45 }, { x: 500, y: 75 },
  ];

  for (const sp of starPositions) {
    const twinkle = 0.3 + 0.4 * Math.sin(time * 2 + sp.x);
    ctx.globalAlpha = twinkle;
    ctx.fillStyle = '#d0d8f0';
    ctx.beginPath();
    ctx.arc(sp.x, sp.y, 1.2, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function drawBridge(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  colors: ThemeColors,
  density: number,
  hasBridge: boolean
) {
  if (!hasBridge) return;
  const inkMul = density / 5;
  const inkCol = parseColor(colors.ink);

  ctx.save();
  ctx.strokeStyle = `rgba(${inkCol.r},${inkCol.g},${inkCol.b},${0.5 * inkMul})`;
  ctx.lineWidth = 2;

  const bx = w * 0.35;
  const by = h * 0.68;

  ctx.beginPath();
  ctx.moveTo(bx - 30, by);
  ctx.quadraticCurveTo(bx, by - 20, bx + 30, by);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(bx - 28, by);
  ctx.lineTo(bx - 28, by + 8);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(bx + 28, by);
  ctx.lineTo(bx + 28, by + 8);
  ctx.stroke();

  ctx.restore();
}

function drawPavilion(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  colors: ThemeColors,
  density: number,
  hasPavilion: boolean
) {
  if (!hasPavilion) return;
  const inkMul = density / 5;
  const inkCol = parseColor(colors.ink);
  const px = w * 0.55;
  const py = h * 0.48;

  ctx.save();
  ctx.strokeStyle = `rgba(${inkCol.r},${inkCol.g},${inkCol.b},${0.5 * inkMul})`;
  ctx.lineWidth = 1.5;

  ctx.beginPath();
  ctx.moveTo(px - 15, py);
  ctx.lineTo(px - 18, py - 5);
  ctx.lineTo(px, py - 18);
  ctx.lineTo(px + 18, py - 5);
  ctx.lineTo(px + 15, py);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(px - 10, py + 5);
  ctx.lineTo(px - 10, py);
  ctx.moveTo(px + 10, py + 5);
  ctx.lineTo(px + 10, py);
  ctx.moveTo(px - 12, py + 5);
  ctx.lineTo(px + 12, py + 5);
  ctx.stroke();

  ctx.restore();
}

function drawWine(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  colors: ThemeColors,
  density: number,
  hasWine: boolean
) {
  if (!hasWine) return;
  const inkMul = density / 5;
  const inkCol = parseColor(colors.ink);
  const wx = w * 0.2;
  const wy = h * 0.65;

  ctx.save();
  ctx.strokeStyle = `rgba(${inkCol.r},${inkCol.g},${inkCol.b},${0.5 * inkMul})`;
  ctx.lineWidth = 1.2;

  ctx.beginPath();
  ctx.moveTo(wx, wy);
  ctx.lineTo(wx - 4, wy + 15);
  ctx.lineTo(wx + 4, wy + 15);
  ctx.closePath();
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(wx - 5, wy + 15);
  ctx.lineTo(wx + 5, wy + 15);
  ctx.stroke();

  ctx.restore();
}

function drawTemple(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  colors: ThemeColors,
  density: number,
  hasTemple: boolean
) {
  if (!hasTemple) return;
  const inkMul = density / 5;
  const inkCol = parseColor(colors.ink);
  const tx = w * 0.7;
  const ty = h * 0.4;

  ctx.save();
  ctx.strokeStyle = `rgba(${inkCol.r},${inkCol.g},${inkCol.b},${0.45 * inkMul})`;
  ctx.lineWidth = 1.5;

  ctx.beginPath();
  ctx.moveTo(tx - 12, ty);
  ctx.lineTo(tx - 15, ty - 5);
  ctx.lineTo(tx, ty - 20);
  ctx.lineTo(tx + 15, ty - 5);
  ctx.lineTo(tx + 12, ty);
  ctx.stroke();

  ctx.fillStyle = `rgba(${inkCol.r},${inkCol.g},${inkCol.b},${0.3 * inkMul})`;
  ctx.fillRect(tx - 8, ty - 5, 16, 15);

  ctx.restore();
}

function drawPoemText(
  ctx: CanvasRenderingContext2D,
  w: number,
  poem: string,
  colors: ThemeColors
) {
  if (!poem.trim()) return;
  const inkCol = parseColor(colors.ink);

  ctx.save();
  ctx.font = '18px "Ma Shan Zheng", "KaiTi", "STKaiti", serif';
  ctx.fillStyle = `rgba(${inkCol.r},${inkCol.g},${inkCol.b},0.75)`;

  const lines = poem.split(/[，。！？；\n]/).filter((l) => l.trim());
  const startX = 24;
  const startY = 40;
  const lineGap = 22;

  for (let i = 0; i < lines.length; i++) {
    ctx.fillText(lines[i].trim(), startX, startY + i * lineGap);
  }

  ctx.restore();
}

function drawSeal(
  ctx: CanvasRenderingContext2D,
  w: number,
  colors: ThemeColors,
  poem: string
) {
  if (!poem.trim()) return;
  const sealCol = parseColor(colors.sealColor);

  ctx.save();
  const sx = w - 60;
  const sy = 20;
  const size = 40;

  ctx.fillStyle = `rgba(${sealCol.r},${sealCol.g},${sealCol.b},0.7)`;
  ctx.fillRect(sx, sy, size, size);

  ctx.strokeStyle = `rgba(${sealCol.r},${sealCol.g},${sealCol.b},0.9)`;
  ctx.lineWidth = 1;
  ctx.strokeRect(sx + 2, sy + 2, size - 4, size - 4);

  const title = poem.split(/[，。！？；\n]/)[0]?.trim() || '';
  const chars = title.slice(0, 4);
  ctx.font = '14px "Ma Shan Zheng", "KaiTi", serif';
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  if (chars.length <= 2) {
    for (let i = 0; i < chars.length; i++) {
      ctx.fillText(chars[i], sx + size / 2, sy + 10 + i * 18);
    }
  } else {
    for (let i = 0; i < Math.min(chars.length, 4); i++) {
      const col = i % 2;
      const row = Math.floor(i / 2);
      ctx.fillText(chars[i], sx + 10 + col * 20, sy + 12 + row * 18);
    }
  }

  ctx.restore();
}

function drawImageryHash(
  ctx: CanvasRenderingContext2D,
  w: number,
  imagery: string[],
  colors: ThemeColors
) {
  if (imagery.length === 0) return;
  const inkLightCol = parseColor(colors.inkLight);

  ctx.save();
  const hash = imagery.map((i) => `#${i}`).join('');
  ctx.font = '10px "ZCOOL XiaoWei", monospace';
  ctx.fillStyle = `rgba(${inkLightCol.r},${inkLightCol.g},${inkLightCol.b},0.5)`;
  ctx.globalAlpha = 0.5;
  ctx.textAlign = 'right';
  ctx.fillText(hash, w - 12, 75);
  ctx.restore();
}

function drawWillow(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  colors: ThemeColors,
  density: number,
  sway: number,
  hasWillow: boolean
) {
  if (!hasWillow) return;
  const inkMul = density / 5;
  const inkCol = parseColor(colors.ink);
  const wx = w * 0.82;
  const wy = h * 0.42;

  ctx.save();
  ctx.strokeStyle = `rgba(${inkCol.r},${inkCol.g},${inkCol.b},${0.5 * inkMul})`;
  ctx.lineWidth = 3;

  ctx.beginPath();
  ctx.moveTo(wx, wy + 40);
  ctx.quadraticCurveTo(wx - 5 + sway, wy, wx + sway * 0.5, wy - 30);
  ctx.stroke();

  ctx.lineWidth = 0.8;
  ctx.globalAlpha = 0.3 * inkMul;
  ctx.strokeStyle = `rgba(${inkCol.r},${inkCol.g},${inkCol.b},${0.3 * inkMul})`;
  for (let b = 0; b < 8; b++) {
    const angle = -0.6 + (b / 8) * 1.2;
    const bx = wx + sway * 0.5;
    const by = wy - 25;
    const endX = bx + Math.sin(angle) * 35;
    const endY = by + 50 + Math.sin(sway + b) * 5;

    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.quadraticCurveTo(bx + Math.sin(angle) * 15, by + 25, endX, endY);
    ctx.stroke();
  }

  ctx.restore();
}

function drawPine(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  colors: ThemeColors,
  density: number,
  hasPine: boolean
) {
  if (!hasPine) return;
  const inkMul = density / 5;
  const inkCol = parseColor(colors.ink);
  const foliageCol = parseColor(colors.foliage);
  const px = w * 0.15;
  const py = h * 0.38;

  ctx.save();
  ctx.strokeStyle = `rgba(${inkCol.r},${inkCol.g},${inkCol.b},${0.6 * inkMul})`;
  ctx.lineWidth = 3;

  ctx.beginPath();
  ctx.moveTo(px, py + 60);
  ctx.lineTo(px - 2, py);
  ctx.stroke();

  ctx.fillStyle = `rgba(${foliageCol.r},${foliageCol.g},${foliageCol.b},${0.4 * inkMul})`;
  for (let i = 0; i < 3; i++) {
    const ly = py + i * 18;
    const lw = 25 - i * 3;
    ctx.beginPath();
    ctx.moveTo(px, ly - 5);
    ctx.lineTo(px - lw, ly + 8);
    ctx.lineTo(px + lw, ly + 8);
    ctx.closePath();
    ctx.fill();
  }

  ctx.restore();
}

function drawWind(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  colors: ThemeColors,
  time: number,
  hasWind: boolean
) {
  if (!hasWind) return;
  const inkLightCol = parseColor(colors.inkLight);

  ctx.save();
  ctx.strokeStyle = `rgba(${inkLightCol.r},${inkLightCol.g},${inkLightCol.b},0.2)`;
  ctx.lineWidth = 0.6;

  for (let i = 0; i < 4; i++) {
    const y = 120 + i * 60;
    const startX = (time * 30 + i * 200) % (w + 100) - 50;
    ctx.beginPath();
    ctx.moveTo(startX, y);
    ctx.quadraticCurveTo(startX + 40, y - 3, startX + 80, y + 1);
    ctx.stroke();
  }

  ctx.restore();
}

function updateInkParticles(particles: InkParticle[], dt: number, speed: number): InkParticle[] {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx * dt * speed * 60;
    p.y += p.vy * dt * speed * 60;
    p.vy += 0.02 * dt * speed * 60;
    p.life -= dt * speed;
    if (p.life <= 0) {
      particles.splice(i, 1);
    }
  }
  return particles;
}

function updateWaterRipples(ripples: WaterRipple[], w: number, h: number, dt: number, speed: number, waterY: number): WaterRipple[] {
  for (let i = ripples.length - 1; i >= 0; i--) {
    const r = ripples[i];
    r.rx += (r.maxRx - r.rx) * 0.03 * dt * speed * 60;
    r.ry = r.rx * 0.3;
    r.life -= dt * speed;
    if (r.life <= 0 || r.rx >= r.maxRx) {
      ripples.splice(i, 1);
    }
  }

  if (Math.random() < 0.02 * speed * dt * 60) {
    ripples.push({
      x: Math.random() * w,
      y: waterY + 10 + Math.random() * 40,
      rx: 2,
      ry: 0.6,
      maxRx: 15 + Math.random() * 25,
      life: 1.5 + Math.random(),
      maxLife: 2.5,
    });
  }

  return ripples;
}

function updateScene(state: SceneState, dt: number, speed: number, w: number, h: number, colors: ThemeColors): SceneState {
  const s = speed;
  state.time += dt * s;
  state.waterPhase += dt * 2 * s;
  state.mountainOffset += dt * 0.5 * s;
  state.cloudOffset += dt * 15 * s;
  state.bambooSway += dt * 0.8 * s;
  state.breathPhase += dt * s * (Math.PI * 2 / 4);

  if (!state.mountainInited) {
    state.mountainLayers = initMountainLayers(w, h, colors);
    state.mountainInited = true;
  }

  for (const layer of state.mountainLayers) {
    layer.driftOffset += dt * s * layer.driftSpeed * 10;
    if (layer.driftOffset > 80) {
      layer.driftOffset = -80;
    }
  }

  for (const bird of state.birdPositions) {
    bird.x -= bird.speed * s;
    bird.phase += dt * 3 * s;
    const y = bird.baseY + Math.sin((bird.x * bird.freq) + bird.phase) * bird.amplitude;

    bird.trail.unshift({ x: bird.x, y: y });
    if (bird.trail.length > 8) {
      bird.trail.pop();
    }

    if (bird.x < -20) {
      bird.x = w + 20;
      bird.baseY = 80 + Math.random() * 120;
      bird.trail = [];
    }
  }

  state.moonGlow += state.moonGlowDir * dt * 1.5 * s;
  if (state.moonGlow >= 6) state.moonGlowDir = -1;
  if (state.moonGlow <= 2) state.moonGlowDir = 1;

  for (const d of state.rainDrops) {
    d.y += d.speed * s;
    if (d.y > h) {
      d.y = -5;
      d.x = Math.random() * w;
    }
  }

  for (const f of state.snowFlakes) {
    f.y += f.speed * s;
    f.x += f.drift * s;
    if (f.y > h) {
      f.y = -5;
      f.x = Math.random() * w;
    }
  }

  for (const leaf of state.leafPositions) {
    leaf.y += leaf.speed * s;
    leaf.x += leaf.drift * s;
    leaf.rot += 0.02 * s;
    if (leaf.y > h + 8) {
      leaf.y = -10;
      leaf.x = Math.random() * w;
    }
  }

  updateInkParticles(state.inkParticles, dt, s);
  updateWaterRipples(state.waterRipples, w, h, dt, s, h * 0.72);

  if (Math.random() < 0.05 * s * dt * 60) {
    const inkCol = parseColor(colors.ink);
    state.inkParticles.push({
      x: Math.random() * w,
      y: h * 0.3 + Math.random() * h * 0.4,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.2,
      life: 1.5 + Math.random() * 1.5,
      maxLife: 3,
      radius: 2 + Math.random() * 4,
      color: `rgba(${inkCol.r},${inkCol.g},${inkCol.b},`,
    });
  }

  return state;
}

export class InkRenderer {
  private ctx: CanvasRenderingContext2D;
  private width: number;
  private height: number;
  private sceneState: SceneState;
  private animationId: number | null = null;
  private lastTime: number = 0;
  private isPaused: boolean = false;
  private onFrame?: () => void;

  constructor(ctx: CanvasRenderingContext2D, width: number, height: number) {
    this.ctx = ctx;
    this.width = width;
    this.height = height;
    this.sceneState = createSceneState(width, height);
  }

  setFrameCallback(cb: () => void) {
    this.onFrame = cb;
  }

  start(
    imagery: string[],
    params: RenderParams,
    poem: string
  ) {
    this.stop();
    this.isPaused = false;
    this.lastTime = performance.now();
    const colors = getThemeColors(params.theme);
    const loop = (now: number) => {
      const dt = Math.min((now - this.lastTime) / 1000, 0.1);
      this.lastTime = now;
      if (!this.isPaused) {
        this.sceneState = updateScene(this.sceneState, dt, params.animSpeed, this.width, this.height, colors);
      }
      this.render(imagery, params, poem);
      this.onFrame?.();
      this.animationId = requestAnimationFrame(loop);
    };
    this.animationId = requestAnimationFrame(loop);
  }

  stop() {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  pause() {
    this.isPaused = true;
  }

  resume() {
    this.isPaused = false;
    this.lastTime = performance.now();
  }

  get paused() {
    return this.isPaused;
  }

  render(imagery: string[], params: RenderParams, poem: string) {
    const { ctx, width: w, height: h, sceneState: s } = this;
    const colors = getThemeColors(params.theme);
    const density = params.brushDensity;

    ctx.clearRect(0, 0, w, h);
    drawXuanPaperTexture(ctx, w, h, colors);

    const has = (keyword: string) => imagery.includes(keyword);

    drawClouds(ctx, w, h, colors, density, s.cloudOffset, has('云') || has('雾'));
    drawSun(ctx, w, colors, density, has('日'));
    drawStars(ctx, w, colors, s.time, has('星'));
    drawMoon(ctx, w, colors, density, s, has('月'));
    drawMountains(ctx, w, h, colors, density, s, has('山') || has('石'));
    drawPine(ctx, w, h, colors, density, has('松'));
    drawWillow(ctx, w, h, colors, density, s.bambooSway, has('柳'));
    drawTemple(ctx, w, h, colors, density, has('寺'));
    drawPavilion(ctx, w, h, colors, density, has('亭'));
    drawBridge(ctx, w, h, colors, density, has('桥'));
    drawWater(ctx, w, h, colors, density, s, has('水'));
    drawBoat(ctx, w, h, colors, density, s.waterPhase, has('舟'));
    drawBamboo(ctx, w, h, colors, density, s.bambooSway, has('竹'));
    drawFlowers(ctx, w, h, colors, density, has('花'));
    drawFallingLeaves(ctx, w, h, colors, s.leafPositions, s, has('花'));
    drawBirds(ctx, w, colors, density, s, has('鸟'));
    drawRain(ctx, w, h, colors, s.rainDrops, has('雨'));
    drawSnow(ctx, w, h, colors, s.snowFlakes, has('雪'));
    drawWind(ctx, w, h, colors, s.time, has('风'));
    drawWine(ctx, w, h, colors, density, has('酒'));

    const inkCol = parseColor(colors.ink);
    for (const p of s.inkParticles) {
      const lifeRatio = p.life / p.maxLife;
      drawInkWash(ctx, p.x, p.y, p.radius * (0.5 + lifeRatio * 0.5), `${p.color}${lifeRatio * 0.25})`, 1);
    }

    drawPoemText(ctx, w, poem, colors);
    drawSeal(ctx, w, colors, poem);
    drawImageryHash(ctx, w, imagery, colors);
  }

  getSnapshot(): string {
    return this.ctx.canvas.toDataURL('image/png');
  }

  getSceneTime(): number {
    return this.sceneState.time;
  }
}
