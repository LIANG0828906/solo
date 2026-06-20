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

interface SceneState {
  time: number;
  mountainOffset: number;
  waterPhase: number;
  birdPositions: { x: number; y: number; speed: number; amplitude: number; phase: number }[];
  moonGlow: number;
  moonGlowDir: number;
  bambooSway: number;
  cloudOffset: number;
  rainDrops: { x: number; y: number; speed: number }[];
  snowFlakes: { x: number; y: number; speed: number; drift: number }[];
  leafPositions: { x: number; y: number; rot: number; speed: number; drift: number }[];
}

function createSceneState(): SceneState {
  const birds = Array.from({ length: 5 }, () => ({
    x: Math.random() * 768,
    y: 80 + Math.random() * 120,
    speed: 0.3 + Math.random() * 0.5,
    amplitude: 10 + Math.random() * 20,
    phase: Math.random() * Math.PI * 2,
  }));

  const rainDrops = Array.from({ length: 80 }, () => ({
    x: Math.random() * 768,
    y: Math.random() * 512,
    speed: 2 + Math.random() * 3,
  }));

  const snowFlakes = Array.from({ length: 60 }, () => ({
    x: Math.random() * 768,
    y: Math.random() * 512,
    speed: 0.3 + Math.random() * 0.8,
    drift: (Math.random() - 0.5) * 0.5,
  }));

  const leafPositions = Array.from({ length: 12 }, () => ({
    x: Math.random() * 768,
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

function drawMountains(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  colors: ThemeColors,
  density: number,
  offset: number,
  hasMountain: boolean
) {
  if (!hasMountain) return;
  const baseY = h * 0.55;
  const inkMul = density / 5;

  ctx.save();

  const layers = [
    { color: colors.mountain1, amp: 80, freq: 0.005, yOff: 0, alpha: 0.7 * inkMul },
    { color: colors.mountain2, amp: 60, freq: 0.008, yOff: 30, alpha: 0.5 * inkMul },
    { color: colors.mountain3, amp: 45, freq: 0.012, yOff: 55, alpha: 0.3 * inkMul },
  ];

  for (const layer of layers) {
    ctx.beginPath();
    ctx.moveTo(0, h);
    for (let x = 0; x <= w; x += 2) {
      const y =
        baseY + layer.yOff -
        layer.amp * Math.sin((x + offset * 0.2) * layer.freq) -
        layer.amp * 0.5 * Math.sin((x + offset * 0.3) * layer.freq * 2.3 + 1.5) -
        layer.amp * 0.3 * Math.sin((x + offset * 0.1) * layer.freq * 4.1 + 0.8);
      ctx.lineTo(x, y);
    }
    ctx.lineTo(w, h);
    ctx.closePath();

    const g = ctx.createLinearGradient(0, baseY - layer.amp, 0, h);
    g.addColorStop(0, layer.color);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.globalAlpha = Math.min(1, layer.alpha);
    ctx.fill();
  }

  for (let i = 0; i < 6 * inkMul; i++) {
    const x = (i * 137 + offset * 0.05) % w;
    const peakY = baseY - 30 - Math.random() * 40;
    ctx.beginPath();
    ctx.moveTo(x, peakY);
    ctx.quadraticCurveTo(x - 15, peakY + 30, x - 8, peakY + 60);
    ctx.quadraticCurveTo(x + 5, peakY + 30, x, peakY);
    ctx.fillStyle = colors.ink;
    ctx.globalAlpha = 0.05 * inkMul;
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
  phase: number,
  hasWater: boolean
) {
  if (!hasWater) return;
  const waterY = h * 0.72;
  const inkMul = density / 5;

  ctx.save();
  ctx.globalAlpha = 0.4 * inkMul;

  const g = ctx.createLinearGradient(0, waterY, 0, h);
  g.addColorStop(0, colors.waterColor);
  g.addColorStop(0.5, 'rgba(0,0,0,0.05)');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;

  ctx.beginPath();
  ctx.moveTo(0, waterY);
  for (let x = 0; x <= w; x += 2) {
    const y = waterY + Math.sin((x * 0.02) + phase) * 3 + Math.sin((x * 0.05) + phase * 1.3) * 1.5;
    ctx.lineTo(x, y);
  }
  ctx.lineTo(w, h);
  ctx.lineTo(0, h);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = colors.inkLight;
  ctx.lineWidth = 0.5;
  ctx.globalAlpha = 0.2 * inkMul;
  for (let i = 0; i < 6; i++) {
    const ly = waterY + 15 + i * 12;
    ctx.beginPath();
    for (let x = 0; x <= w; x += 3) {
      const y = ly + Math.sin((x * 0.03) + phase + i * 0.8) * 2;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  ctx.restore();
}

function drawBirds(
  ctx: CanvasRenderingContext2D,
  colors: ThemeColors,
  density: number,
  birds: SceneState['birdPositions'],
  hasBird: boolean
) {
  if (!hasBird) return;
  const inkMul = density / 5;

  ctx.save();
  ctx.strokeStyle = colors.ink;
  ctx.lineWidth = 1.5;
  ctx.globalAlpha = 0.7 * inkMul;

  for (const bird of birds) {
    const wingFlap = Math.sin(bird.phase) * 4;
    ctx.beginPath();
    ctx.moveTo(bird.x - 8, bird.y + wingFlap);
    ctx.quadraticCurveTo(bird.x - 3, bird.y - 2, bird.x, bird.y);
    ctx.quadraticCurveTo(bird.x + 3, bird.y - 2, bird.x + 8, bird.y + wingFlap);
    ctx.stroke();
  }

  ctx.restore();
}

function drawMoon(
  ctx: CanvasRenderingContext2D,
  w: number,
  colors: ThemeColors,
  density: number,
  glowRadius: number,
  hasMoon: boolean
) {
  if (!hasMoon) return;
  const cx = w * 0.78;
  const cy = 90;
  const r = 25;
  const inkMul = density / 5;

  ctx.save();

  for (let i = 3; i > 0; i--) {
    const gr = ctx.createRadialGradient(cx, cy, r, cx, cy, r + glowRadius * i * 2);
    gr.addColorStop(0, `rgba(240,208,128,${0.15 * inkMul / i})`);
    gr.addColorStop(1, 'rgba(240,208,128,0)');
    ctx.fillStyle = gr;
    ctx.beginPath();
    ctx.arc(cx, cy, r + glowRadius * i * 2, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = colors.moonColor;
  ctx.globalAlpha = 0.85 * inkMul;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = colors.bg;
  ctx.globalAlpha = 0.3;
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

  ctx.save();

  const bambooPositions = [
    { x: 60, height: 280, segments: 5 },
    { x: 90, height: 220, segments: 4 },
    { x: 45, height: 180, segments: 3 },
  ];

  for (const bp of bambooPositions) {
    const swayOff = Math.sin(sway + bp.x * 0.01) * 3;

    ctx.strokeStyle = colors.ink;
    ctx.lineWidth = 3;
    ctx.globalAlpha = 0.6 * inkMul;

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
      ctx.fillStyle = colors.foliage;
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
  const bx = w * 0.45;
  const by = h * 0.7 + Math.sin(phase * 0.5) * 3;

  ctx.save();
  ctx.globalAlpha = 0.7 * inkMul;
  ctx.strokeStyle = colors.ink;
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
  ctx.fillStyle = colors.inkLight;
  ctx.globalAlpha = 0.3 * inkMul;
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

  ctx.save();
  ctx.globalAlpha = 0.15 * inkMul;

  const cloudPositions = [
    { x: (200 + offset * 0.3) % (w + 200) - 100, y: 100 },
    { x: (400 + offset * 0.2) % (w + 200) - 100, y: 60 },
    { x: (600 + offset * 0.15) % (w + 200) - 100, y: 130 },
  ];

  for (const cp of cloudPositions) {
    ctx.fillStyle = colors.inkLight;
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

  ctx.save();
  ctx.strokeStyle = colors.inkLight;
  ctx.lineWidth = 0.8;
  ctx.globalAlpha = 0.25;

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
  flakes: SceneState['snowFlakes'],
  hasSnow: boolean
) {
  if (!hasSnow) return;

  ctx.save();
  ctx.fillStyle = 'rgba(255,255,255,0.7)';

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

  ctx.save();

  const flowerPos = [
    { x: w * 0.65, y: h * 0.55 },
    { x: w * 0.72, y: h * 0.58 },
    { x: w * 0.58, y: h * 0.6 },
  ];

  for (const fp of flowerPos) {
    ctx.strokeStyle = colors.ink;
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.4 * inkMul;
    ctx.beginPath();
    ctx.moveTo(fp.x, fp.y);
    ctx.quadraticCurveTo(fp.x - 10, fp.y - 20, fp.x - 5, fp.y - 40);
    ctx.stroke();

    ctx.fillStyle = colors.accent;
    ctx.globalAlpha = 0.35 * inkMul;
    for (let p = 0; p < 5; p++) {
      const angle = (p / 5) * Math.PI * 2;
      const px = fp.x - 5 + Math.cos(angle) * 6;
      const py = fp.y - 40 + Math.sin(angle) * 6;
      ctx.beginPath();
      ctx.ellipse(px, py, 4, 2.5, angle, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = '#e8c040';
    ctx.globalAlpha = 0.5 * inkMul;
    ctx.beginPath();
    ctx.arc(fp.x - 5, fp.y - 40, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function drawFallingLeaves(
  ctx: CanvasRenderingContext2D,
  colors: ThemeColors,
  leaves: SceneState['leafPositions'],
  hasFlower: boolean
) {
  if (!hasFlower) return;

  ctx.save();
  ctx.fillStyle = colors.foliage;
  ctx.globalAlpha = 0.4;

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

  ctx.fillStyle = '#f0b050';
  ctx.globalAlpha = 0.6 * inkMul;
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

  ctx.save();
  ctx.strokeStyle = colors.ink;
  ctx.lineWidth = 2;
  ctx.globalAlpha = 0.5 * inkMul;

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
  const px = w * 0.55;
  const py = h * 0.48;

  ctx.save();
  ctx.strokeStyle = colors.ink;
  ctx.lineWidth = 1.5;
  ctx.globalAlpha = 0.5 * inkMul;

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
  const wx = w * 0.2;
  const wy = h * 0.65;

  ctx.save();
  ctx.strokeStyle = colors.ink;
  ctx.lineWidth = 1.2;
  ctx.globalAlpha = 0.5 * inkMul;

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
  const tx = w * 0.7;
  const ty = h * 0.4;

  ctx.save();
  ctx.strokeStyle = colors.ink;
  ctx.lineWidth = 1.5;
  ctx.globalAlpha = 0.45 * inkMul;

  ctx.beginPath();
  ctx.moveTo(tx - 12, ty);
  ctx.lineTo(tx - 15, ty - 5);
  ctx.lineTo(tx, ty - 20);
  ctx.lineTo(tx + 15, ty - 5);
  ctx.lineTo(tx + 12, ty);
  ctx.stroke();

  ctx.fillStyle = colors.ink;
  ctx.globalAlpha = 0.3 * inkMul;
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

  ctx.save();
  ctx.font = '18px "Ma Shan Zheng", "KaiTi", "STKaiti", serif';
  ctx.fillStyle = colors.ink;
  ctx.globalAlpha = 0.75;

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

  ctx.save();
  const sx = w - 60;
  const sy = 20;
  const size = 40;

  ctx.fillStyle = colors.sealColor;
  ctx.globalAlpha = 0.7;

  ctx.fillRect(sx, sy, size, size);

  ctx.strokeStyle = colors.sealColor;
  ctx.lineWidth = 1;
  ctx.globalAlpha = 0.9;
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

  ctx.save();
  const hash = imagery.map((i) => `#${i}`).join('');
  ctx.font = '10px "ZCOOL XiaoWei", monospace';
  ctx.fillStyle = colors.inkLight;
  ctx.globalAlpha = 0.5;
  ctx.textAlign = 'right';
  ctx.fillText(hash, w - 12, w > 512 ? 72 : 60);
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
  const wx = w * 0.82;
  const wy = h * 0.42;

  ctx.save();
  ctx.strokeStyle = colors.ink;
  ctx.lineWidth = 3;
  ctx.globalAlpha = 0.5 * inkMul;

  ctx.beginPath();
  ctx.moveTo(wx, wy + 40);
  ctx.quadraticCurveTo(wx - 5 + sway, wy, wx + sway * 0.5, wy - 30);
  ctx.stroke();

  ctx.lineWidth = 0.8;
  ctx.globalAlpha = 0.3 * inkMul;
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
  const px = w * 0.15;
  const py = h * 0.38;

  ctx.save();
  ctx.strokeStyle = colors.ink;
  ctx.lineWidth = 3;
  ctx.globalAlpha = 0.6 * inkMul;

  ctx.beginPath();
  ctx.moveTo(px, py + 60);
  ctx.lineTo(px - 2, py);
  ctx.stroke();

  ctx.fillStyle = colors.foliage;
  ctx.globalAlpha = 0.4 * inkMul;
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

  ctx.save();
  ctx.strokeStyle = colors.inkLight;
  ctx.lineWidth = 0.6;
  ctx.globalAlpha = 0.2;

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

function updateScene(state: SceneState, dt: number, speed: number): SceneState {
  const s = speed;
  state.time += dt * s;
  state.waterPhase += dt * 2 * s;
  state.mountainOffset += dt * 0.5 * s;
  state.cloudOffset += dt * 15 * s;
  state.bambooSway += dt * 0.8 * s;

  for (const bird of state.birdPositions) {
    bird.x -= bird.speed * s;
    bird.phase += dt * 4 * s;
    if (bird.x < -20) {
      bird.x = 800;
      bird.y = 80 + Math.random() * 120;
    }
  }

  state.moonGlow += state.moonGlowDir * dt * 1.5 * s;
  if (state.moonGlow >= 6) state.moonGlowDir = -1;
  if (state.moonGlow <= 2) state.moonGlowDir = 1;

  for (const d of state.rainDrops) {
    d.y += d.speed * s;
    if (d.y > 512) {
      d.y = -5;
      d.x = Math.random() * 768;
    }
  }

  for (const f of state.snowFlakes) {
    f.y += f.speed * s;
    f.x += f.drift * s;
    if (f.y > 512) {
      f.y = -5;
      f.x = Math.random() * 768;
    }
  }

  for (const leaf of state.leafPositions) {
    leaf.y += leaf.speed * s;
    leaf.x += leaf.drift * s;
    leaf.rot += 0.02 * s;
    if (leaf.y > 520) {
      leaf.y = -10;
      leaf.x = Math.random() * 768;
    }
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
    this.sceneState = createSceneState();
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
    const loop = (now: number) => {
      const dt = Math.min((now - this.lastTime) / 1000, 0.1);
      this.lastTime = now;
      if (!this.isPaused) {
        this.sceneState = updateScene(this.sceneState, dt, params.animSpeed);
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

    ctx.clearRect(0, 0, w, h);
    drawXuanPaperTexture(ctx, w, h, colors);

    const has = (keyword: string) => imagery.includes(keyword);

    drawClouds(ctx, w, h, colors, params.brushDensity, s.cloudOffset, has('云') || has('雾'));
    drawSun(ctx, w, colors, params.brushDensity, has('日'));
    drawStars(ctx, w, colors, s.time, has('星'));
    drawMoon(ctx, w, colors, params.brushDensity, s.moonGlow, has('月'));
    drawMountains(ctx, w, h, colors, params.brushDensity, s.mountainOffset, has('山') || has('石'));
    drawPine(ctx, w, h, colors, params.brushDensity, has('松'));
    drawWillow(ctx, w, h, colors, params.brushDensity, s.bambooSway, has('柳'));
    drawTemple(ctx, w, h, colors, params.brushDensity, has('寺'));
    drawPavilion(ctx, w, h, colors, params.brushDensity, has('亭'));
    drawBridge(ctx, w, h, colors, params.brushDensity, has('桥'));
    drawWater(ctx, w, h, colors, params.brushDensity, s.waterPhase, has('水'));
    drawBoat(ctx, w, h, colors, params.brushDensity, s.waterPhase, has('舟'));
    drawBamboo(ctx, w, h, colors, params.brushDensity, s.bambooSway, has('竹'));
    drawFlowers(ctx, w, h, colors, params.brushDensity, has('花'));
    drawFallingLeaves(ctx, colors, s.leafPositions, has('花'));
    drawBirds(ctx, colors, params.brushDensity, s.birdPositions, has('鸟'));
    drawRain(ctx, w, h, colors, s.rainDrops, has('雨'));
    drawSnow(ctx, w, h, colors, s.snowFlakes, has('雪'));
    drawWind(ctx, w, h, colors, s.time, has('风'));
    drawWine(ctx, w, h, colors, params.brushDensity, has('酒'));
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
