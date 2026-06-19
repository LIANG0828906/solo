export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
  gravity: number;
  shrink: boolean;
}

export interface DiceVisualState {
  x: number;
  y: number;
  rotationX: number;
  rotationY: number;
  scale: number;
  alpha: number;
  bounced: boolean;
  landed: boolean;
  landParticlesSpawned: boolean;
  showValue: boolean;
  mass: number;
  impactVelocity: number;
  bounceCount: number;
  seed: number;
  playerColor: 'red' | 'blue';
}

export const COLORS = {
  red: '#C0392B',
  redLight: '#E74C3C',
  blue: '#2980B9',
  blueLight: '#3498DB',
  gold: '#FFD700',
  goldDark: '#DAA520',
  trap: '#E74C3C',
  boost: '#3498DB',
  heal: '#2ECC71',
  woodDark: '#3E2723',
  woodLight: '#5D4037',
  cellLight: '#6D4C41',
  cellDark: '#4E342E',
};

const PARTICLE_POOL: Particle[] = [];
const MAX_PARTICLES = 200;
let particleCount = 0;

function acquireParticle(): Particle {
  if (particleCount < MAX_PARTICLES) {
    particleCount++;
    return {
      x: 0, y: 0, vx: 0, vy: 0, life: 0, maxLife: 1,
      color: '#FFF', size: 2, gravity: 0, shrink: true,
    };
  }
  PARTICLE_POOL.sort((a, b) => a.life - b.life);
  return PARTICLE_POOL.shift()!;
}

export function spawnParticles(
  x: number, y: number, count: number,
  options: Partial<Particle> & { colorPalette?: string[] } = {}
): void {
  const palette = options.colorPalette ?? ['#FFD700', '#FFA500', '#FF6347', '#FFFFFF'];
  for (let i = 0; i < count; i++) {
    const p = acquireParticle();
    const angle = Math.random() * Math.PI * 2;
    const speed = (options.vx ?? 1) * (0.5 + Math.random() * 3);
    p.x = x;
    p.y = y;
    p.vx = Math.cos(angle) * speed + (options.vx ?? 0) * 0.3;
    p.vy = Math.sin(angle) * speed + (options.vy ?? 0) * 0.3;
    p.life = options.maxLife ?? 600 + Math.random() * 400;
    p.maxLife = p.life;
    p.color = palette[Math.floor(Math.random() * palette.length)];
    p.size = options.size ?? 1.5 + Math.random() * 3;
    p.gravity = options.gravity ?? 0.08;
    p.shrink = options.shrink ?? true;
    PARTICLE_POOL.push(p);
  }
}

export function updateParticles(dt: number): void {
  for (let i = PARTICLE_POOL.length - 1; i >= 0; i--) {
    const p = PARTICLE_POOL[i];
    p.vy += p.gravity * dt * 0.06;
    p.x += p.vx * dt * 0.06;
    p.y += p.vy * dt * 0.06;
    p.life -= dt;
    if (p.life <= 0) {
      PARTICLE_POOL.splice(i, 1);
      particleCount--;
    }
  }
}

export function drawParticles(ctx: CanvasRenderingContext2D): void {
  for (const p of PARTICLE_POOL) {
    const t = Math.max(0, p.life / p.maxLife);
    ctx.save();
    ctx.globalAlpha = t;
    const size = p.shrink ? p.size * t : p.size;
    const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, size);
    grad.addColorStop(0, p.color);
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

export function clearParticles(): void {
  PARTICLE_POOL.length = 0;
  particleCount = 0;
}

export function createDiceVisual(
  centerX: number,
  topY: number,
  diceValue = 3,
  playerColor: 'red' | 'blue' = 'red'
): DiceVisualState {
  const seed = Math.random() * 1000;
  const mass = 0.7 + (diceValue / 6) * 0.6;
  return {
    x: centerX,
    y: topY,
    rotationX: 0,
    rotationY: 0,
    scale: 0.9,
    alpha: 1,
    bounced: false,
    landed: false,
    landParticlesSpawned: false,
    showValue: false,
    mass,
    impactVelocity: 0,
    bounceCount: 0,
    seed,
    playerColor,
  };
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

function easeOutQuad(t: number): number {
  return 1 - (1 - t) * (1 - t);
}

function easeInQuad(t: number): number {
  return t * t;
}

function computeBounceY(
  bounceProgress: number,
  bounceIndex: number,
  decayFactor: number,
  baseHeight: number
): number {
  const height = baseHeight * Math.pow(decayFactor, bounceIndex);
  const phase = Math.min(1, bounceProgress);
  const arc = Math.sin(phase * Math.PI);
  return height * arc;
}

export function updateDiceVisual(
  state: DiceVisualState,
  elapsed: number,
  duration: number,
  centerY: number,
  diceSize: number
): void {
  const t = Math.min(1, elapsed / duration);
  const fallStartY = state.y;
  const fallDuration = 0.7;
  const bounceDuration = 0.18;
  const settleDuration = 1 - fallDuration - bounceDuration;
  const decayFactor = 0.38 + (1 - state.mass) * 0.25;
  const baseBounceHeight = diceSize * (0.22 + state.mass * 0.1);
  const rotationSpeed = 0.6 + (1 - state.mass) * 0.3;

  if (t < fallDuration) {
    const fallT = t / fallDuration;
    const fallEase = easeInQuad(fallT);
    state.y = fallStartY + (centerY - fallStartY) * fallEase;
    state.impactVelocity = fallEase;
    state.rotationX += 0.55 * rotationSpeed;
    state.rotationY += 0.72 * rotationSpeed;
    state.scale = 0.85 + fallT * 0.15;
    state.bounceCount = 0;
  } else if (t < fallDuration + bounceDuration) {
    const bounceT = (t - fallDuration) / bounceDuration;
    const totalBounces = 3;
    const bounceSegment = 1 / totalBounces;
    const currentBounce = Math.min(
      totalBounces - 1,
      Math.floor(bounceT / bounceSegment)
    );
    const bounceProgress = (bounceT - currentBounce * bounceSegment) / bounceSegment;

    if (!state.bounced || currentBounce > state.bounceCount) {
      state.bounced = true;
      if (currentBounce === 0) {
        state.y = centerY;
        spawnDiceLandParticles(
          state.x,
          state.y + diceSize * 0.4,
          state.mass,
          state.seed,
          state.playerColor
        );
      }
      state.bounceCount = currentBounce;
    }

    const bounceHeight = computeBounceY(
      bounceProgress,
      currentBounce,
      decayFactor,
      baseBounceHeight
    );
    state.y = centerY - bounceHeight;
    state.rotationX += 0.12 * rotationSpeed * Math.pow(decayFactor, currentBounce);
    state.rotationY += 0.15 * rotationSpeed * Math.pow(decayFactor, currentBounce);

    const squash = 1 - Math.sin(bounceProgress * Math.PI) * 0.05 * Math.pow(decayFactor, currentBounce);
    state.scale = squash;
  } else {
    if (!state.landed) {
      state.landed = true;
      state.showValue = true;
    }
    const settleT = (t - fallDuration - bounceDuration) / settleDuration;
    const settleEase = easeOutQuad(settleT);
    state.scale = 1.0 + (1 - settleEase) * 0.03;
    state.rotationX *= 0.82;
    state.rotationY *= 0.82;
    state.y = centerY + Math.sin(settleT * Math.PI * 2) * 0.5 * (1 - settleEase);
  }
}

function spawnDiceLandParticles(
  x: number,
  y: number,
  mass: number,
  seed: number,
  playerColor: 'red' | 'blue' = 'red'
): void {
  const baseCount = 14 + Math.floor(mass * 10);
  const impactIntensity = 0.6 + mass * 0.7;
  const seededRand = (offset: number): number => {
    const s = Math.sin(seed + offset * 12.9898) * 43758.5453;
    return s - Math.floor(s);
  };

  const playerAccent = playerColor === 'red'
    ? ['#C0392B', '#E74C3C', '#FF6B6B']
    : ['#2980B9', '#3498DB', '#5DADE2'];

  const woodPalette = ['#D4A574', '#C4956A', '#B8860B', '#FFD700', '#FFFFFF'];
  const combinedPalette = [...woodPalette, ...playerAccent];

  for (let i = 0; i < baseCount; i++) {
    const r1 = seededRand(i * 2.3);
    const r2 = seededRand(i * 3.7 + 100);
    const r3 = seededRand(i * 5.1 + 200);
    const r4 = seededRand(i * 7.3 + 300);
    const r5 = seededRand(i * 11.7 + 400);

    const angleBias = Math.atan2(r2 - 0.5, r1 - 0.5);
    const angleSpread = (r3 - 0.5) * Math.PI * 0.4;
    const angle = angleBias + angleSpread + Math.PI * 0.5;

    const speed = (1.5 + r4 * 3.5) * impactIntensity;
    const vyUp = -Math.abs(Math.sin(angle) * speed) * (0.7 + r2 * 0.6);
    const vxSide = Math.cos(angle) * speed;

    const sizeFactor = 0.8 + r1 * 1.8;
    const size = (1.5 + sizeFactor) * impactIntensity * 0.8;

    const lifeFactor = 0.6 + r5 * 0.9;
    const maxLife = (350 + lifeFactor * 350) * impactIntensity;

    const gravFactor = 0.8 + r3 * 0.8;
    const gravity = 0.12 * gravFactor;

    const offsetX = (r2 - 0.5) * 16;
    const offsetY = (r4 - 0.5) * 6;

    spawnParticles(x + offsetX, y + offsetY, 1, {
      colorPalette: combinedPalette,
      size,
      maxLife,
      gravity,
      vx: vxSide,
      vy: vyUp,
    });
  }

  const dustCount = Math.floor(6 + mass * 5);
  for (let i = 0; i < dustCount; i++) {
    const r = seededRand(i * 13.9 + 500);
    const r2 = seededRand(i * 17.3 + 600);
    const angle = r * Math.PI * 2;
    const speed = 0.6 + r2 * 1.4;
    spawnParticles(
      x + (r - 0.5) * 20,
      y + 3,
      1,
      {
        colorPalette: ['#8D6E63', '#A1887F', '#BCAAA4', '#D7CCC8'],
        size: 1.2 + r2 * 1.8,
        maxLife: 600 + r * 400,
        gravity: 0.04,
        vx: Math.cos(angle) * speed,
        vy: -0.8 - r * 0.6,
      }
    );
  }
}

export function drawDice(
  ctx: CanvasRenderingContext2D,
  state: DiceVisualState,
  value: number,
  size: number,
  playerColor: 'red' | 'blue',
  holdElapsed: number
): void {
  ctx.save();
  ctx.translate(state.x, state.y);
  ctx.scale(state.scale, state.scale);
  ctx.globalAlpha = state.alpha;

  const color = playerColor === 'red' ? COLORS.red : COLORS.blue;
  const colorLight = playerColor === 'red' ? COLORS.redLight : COLORS.blueLight;

  const projectedSize = size * Math.abs(Math.cos(state.rotationY * 0.5));
  const projectedHeight = size * Math.abs(Math.cos(state.rotationX * 0.5));
  const actualW = Math.max(30, projectedSize);
  const actualH = Math.max(30, projectedHeight);

  if (holdElapsed > 0) {
    drawDiceHalo(ctx, actualW, actualH, playerColor, holdElapsed, 2000);
  }

  const shadowOffset = 6 + state.scale * 2;
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.6)';
  ctx.shadowBlur = 18;
  ctx.shadowOffsetY = shadowOffset;
  const grad = ctx.createLinearGradient(-actualW / 2, -actualH / 2, actualW / 2, actualH / 2);
  grad.addColorStop(0, '#FFFFF0');
  grad.addColorStop(0.5, '#FFFFFF');
  grad.addColorStop(1, '#E8E0D0');
  ctx.fillStyle = grad;
  roundRect(ctx, -actualW / 2, -actualH / 2, actualW, actualH, actualW * 0.12);
  ctx.fill();
  ctx.restore();

  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(2, actualW * 0.04);
  roundRect(ctx, -actualW / 2, -actualH / 2, actualW, actualH, actualW * 0.12);
  ctx.stroke();

  if (state.showValue) {
    drawDiceDots(ctx, value, actualW, actualH, colorLight);
  } else {
    drawRandomDots(ctx, actualW, actualH, state.rotationX, state.rotationY, colorLight);
  }

  ctx.restore();
}

function drawDiceHalo(
  ctx: CanvasRenderingContext2D,
  w: number, h: number,
  playerColor: 'red' | 'blue',
  holdElapsed: number,
  holdTotal: number = 2000
): void {
  const remaining = Math.max(0, holdTotal - holdElapsed);
  const progress = Math.min(1, holdElapsed / holdTotal);
  const urgencyFactor = 1 + (1 - remaining / holdTotal) * 2.2;

  const baseColor = playerColor === 'red' ? '192, 57, 43' : '41, 128, 185';
  const baseColorLight = playerColor === 'red' ? '231, 76, 60' : '52, 152, 219';
  const haloPulse = 0.6 + Math.sin(holdElapsed * 0.005 * urgencyFactor) * 0.4;
  const rotationAngle = holdElapsed * 0.0018 * urgencyFactor;

  const brightnessBoost = 1 + (1 - remaining / holdTotal) * 0.6;

  ctx.save();
  ctx.rotate(rotationAngle);

  for (let ring = 0; ring < 2; ring++) {
    const ringOffset = ring * 6;
    const ringSize = Math.max(w, h) * 0.58 + ringOffset + haloPulse * 5;
    ctx.beginPath();
    for (let i = 0; i <= 72; i++) {
      const a = (i / 72) * Math.PI * 2;
      const wobble = 1 + Math.sin(a * 6 + holdElapsed * 0.004 * urgencyFactor + ring * 1.3) * 0.05;
      const rx = Math.cos(a) * ringSize * wobble;
      const ry = Math.sin(a) * ringSize * wobble;
      if (i === 0) ctx.moveTo(rx, ry);
      else ctx.lineTo(rx, ry);
    }
    ctx.closePath();
    ctx.strokeStyle = `rgba(${baseColor}, ${(0.35 * haloPulse - ring * 0.12) * brightnessBoost})`;
    ctx.lineWidth = 3 - ring;
    ctx.stroke();
  }

  const innerGlowSize = Math.max(w, h) * 0.42;
  const innerGrad = ctx.createRadialGradient(0, 0, innerGlowSize * 0.3, 0, 0, innerGlowSize);
  innerGrad.addColorStop(0, `rgba(${baseColorLight}, ${0.12 * brightnessBoost})`);
  innerGrad.addColorStop(1, `rgba(${baseColor}, 0)`);
  ctx.fillStyle = innerGrad;
  ctx.beginPath();
  ctx.arc(0, 0, innerGlowSize, 0, Math.PI * 2);
  ctx.fill();

  const dotCount = 8 + Math.floor(urgencyFactor * 2);
  for (let i = 0; i < dotCount; i++) {
    const angle = (i / dotCount) * Math.PI * 2 + rotationAngle * 1.5;
    const dist = Math.max(w, h) * 0.66 + haloPulse * 6;
    const px = Math.cos(angle) * dist;
    const py = Math.sin(angle) * dist;
    const pulseSize = 2.5 + Math.sin(holdElapsed * 0.006 * urgencyFactor + i * 0.7) * 2;
    const grad = ctx.createRadialGradient(px, py, 0, px, py, pulseSize * 2.5);
    grad.addColorStop(0, `rgba(${baseColorLight}, ${0.95 * brightnessBoost})`);
    grad.addColorStop(0.4, `rgba(${baseColor}, ${0.5 * brightnessBoost})`);
    grad.addColorStop(1, `rgba(${baseColor}, 0)`);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(px, py, pulseSize * 2.5, 0, Math.PI * 2);
    ctx.fill();
  }

  if (progress > 0.7 && progress < 1) {
    const blinkAlpha = Math.sin(holdElapsed * 0.03) * 0.5 + 0.5;
    ctx.strokeStyle = `rgba(${baseColorLight}, ${0.6 * blinkAlpha * brightnessBoost})`;
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.lineDashOffset = -holdElapsed * 0.08;
    const warnSize = Math.max(w, h) * 0.72;
    ctx.beginPath();
    ctx.arc(0, 0, warnSize, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  ctx.restore();
}

function drawDiceDots(
  ctx: CanvasRenderingContext2D,
  value: number,
  w: number, h: number,
  color: string
): void {
  const positions: Record<number, [number, number][]> = {
    1: [[0.5, 0.5]],
    2: [[0.28, 0.28], [0.72, 0.72]],
    3: [[0.28, 0.28], [0.5, 0.5], [0.72, 0.72]],
    4: [[0.28, 0.28], [0.72, 0.28], [0.28, 0.72], [0.72, 0.72]],
    5: [[0.28, 0.28], [0.72, 0.28], [0.5, 0.5], [0.28, 0.72], [0.72, 0.72]],
    6: [[0.28, 0.22], [0.72, 0.22], [0.28, 0.5], [0.72, 0.5], [0.28, 0.78], [0.72, 0.78]],
  };
  const dotSize = Math.min(w, h) * 0.11;
  const dots = positions[value] || positions[1];
  ctx.fillStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = dotSize * 0.8;
  dots.forEach(([px, py]) => {
    ctx.beginPath();
    ctx.arc(-w / 2 + w * px, -h / 2 + h * py, dotSize, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.shadowBlur = 0;
}

function drawRandomDots(
  ctx: CanvasRenderingContext2D,
  w: number, h: number,
  rotX: number, rotY: number,
  color: string
): void {
  const seed = Math.floor((Math.abs(rotX) + Math.abs(rotY)) * 10) % 6 + 1;
  drawDiceDots(ctx, seed, w, h, color);
}

export function drawDiceNumberPop(
  ctx: CanvasRenderingContext2D,
  centerX: number, centerY: number,
  value: number,
  elapsed: number,
  playerColor: 'red' | 'blue'
): void {
  if (elapsed <= 0 || elapsed > 1400) return;
  const duration = 1400;
  const t = elapsed / duration;
  const color = playerColor === 'red' ? COLORS.red : COLORS.blue;
  const colorLight = playerColor === 'red' ? COLORS.redLight : COLORS.blueLight;
  const colorRGB = playerColor === 'red' ? '231, 76, 60' : '52, 152, 219';

  const expandPhase = 0.28;
  const contractPhase = 0.22;
  const holdPhase = 0.5;

  let scale: number;
  if (t < expandPhase) {
    const st = t / expandPhase;
    const ease = easeOutCubic(st);
    scale = 0.3 + ease * 2.7;
  } else if (t < expandPhase + contractPhase) {
    const st = (t - expandPhase) / contractPhase;
    const ease = easeOutQuad(st);
    scale = 3.0 - ease * 0.8;
  } else {
    const st = (t - expandPhase - contractPhase) / holdPhase;
    const ease = easeOutQuad(st);
    scale = 2.2 - ease * 0.12;
  }

  const alphaIn = Math.min(1, t / 0.08);
  const alphaOut = t > 0.85 ? 1 - (t - 0.85) / 0.15 : 1;
  const alpha = Math.min(alphaIn, alphaOut) * 0.95;

  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.scale(scale, scale);
  ctx.globalAlpha = alpha;

  const haloBase = 60;
  const haloGrow = t < expandPhase
    ? easeOutQuad(t / expandPhase) * 90
    : 90 + (t - expandPhase) * 30;

  for (let i = 0; i < 3; i++) {
    const haloR = haloBase + haloGrow + i * 16;
    const innerFade = Math.min(1, t / 0.15);
    const outerFade = t < 0.3
      ? easeOutQuad(t / 0.3)
      : 1 - easeOutQuad((t - 0.3) / 0.7) * 0.6;
    const haloAlpha = (0.32 - i * 0.09) * innerFade * outerFade;

    const g = ctx.createRadialGradient(0, 0, haloR * 0.15, 0, 0, haloR);
    g.addColorStop(0, `rgba(${colorRGB}, ${haloAlpha + 0.05})`);
    g.addColorStop(0.5, `rgba(${colorRGB}, ${haloAlpha * 0.6})`);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, haloR, 0, Math.PI * 2);
    ctx.fill();
  }

  const ringPulse = Math.sin(t * Math.PI * 4) * 0.15 + 0.85;
  ctx.strokeStyle = `rgba(${colorRGB}, ${0.45 * alpha})`;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, haloBase + haloGrow * 0.6 + 8 * ringPulse, 0, Math.PI * 2);
  ctx.stroke();

  const textGrad = ctx.createLinearGradient(0, -50, 0, 50);
  textGrad.addColorStop(0, '#FFFFFF');
  textGrad.addColorStop(0.4, colorLight);
  textGrad.addColorStop(1, color);
  ctx.fillStyle = textGrad;
  ctx.font = 'bold 72px Georgia, "Times New Roman", serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.strokeStyle = 'rgba(0,0,0,0.5)';
  ctx.lineWidth = 6;
  ctx.strokeText(String(value), 0, 0);
  ctx.fillText(String(value), 0, 0);

  ctx.shadowColor = color;
  ctx.shadowBlur = 28;
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 72px Georgia, "Times New Roman", serif';
  ctx.fillText(String(value), 0, 0);
  ctx.shadowBlur = 0;

  ctx.restore();

  if (t < 0.45 && Math.random() < 0.35) {
    const angle = Math.random() * Math.PI * 2;
    const dist = 35 + Math.random() * 55;
    const spawnT = Math.min(1, t / 0.45);
    const speedMul = 1 + (1 - spawnT) * 2;
    spawnParticles(
      centerX + Math.cos(angle) * dist,
      centerY + Math.sin(angle) * dist,
      1,
      {
        colorPalette: [color, colorLight, '#FFFFFF', '#FFD700'],
        size: 1.8 + Math.random() * 2.5,
        maxLife: 450 + Math.random() * 350,
        gravity: 0.04,
        vx: Math.cos(angle) * speedMul,
        vy: Math.sin(angle) * speedMul,
      }
    );
  }
}

export function drawAttackProjectile(
  ctx: CanvasRenderingContext2D,
  fromX: number, fromY: number,
  toX: number, toY: number,
  progress: number,
  playerColor: 'red' | 'blue',
  cellSize: number
): void {
  const color = playerColor === 'red' ? COLORS.red : COLORS.blue;
  const colorLight = playerColor === 'red' ? COLORS.redLight : COLORS.blueLight;

  const ease = progress < 0.5
    ? 2 * progress * progress
    : 1 - Math.pow(-2 * progress + 2, 2) / 2;

  const cx = fromX + (toX - fromX) * ease;
  const cy = fromY + (toY - fromY) * ease - Math.sin(ease * Math.PI) * cellSize * 0.6;

  if (progress > 0.05) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineCap = 'round';
    for (let i = 0; i < 3; i++) {
      const trailProgress = Math.max(0, ease - (i + 1) * 0.07);
      if (trailProgress <= 0) continue;
      const tx = fromX + (toX - fromX) * trailProgress;
      const ty = fromY + (toY - fromY) * trailProgress - Math.sin(trailProgress * Math.PI) * cellSize * 0.6;
      ctx.globalAlpha = (0.7 - i * 0.2) * (1 - progress);
      ctx.lineWidth = 8 - i * 2;
      ctx.beginPath();
      ctx.moveTo(tx, ty);
      ctx.lineTo(cx, cy);
      ctx.stroke();
    }
    ctx.restore();
  }

  const orbSize = cellSize * 0.22;
  const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, orbSize);
  grad.addColorStop(0, '#FFFFFF');
  grad.addColorStop(0.3, colorLight);
  grad.addColorStop(0.7, color);
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.save();
  ctx.shadowColor = color;
  ctx.shadowBlur = orbSize * 1.5;
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(cx, cy, orbSize, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  if (progress >= 0.95 && progress < 0.98) {
    spawnParticles(toX, toY, 24, {
      colorPalette: [color, colorLight, '#FFFFFF', '#FFD700', '#FFA500'],
      size: 3,
      maxLife: 600,
      gravity: 0.05,
      vx: 3, vy: -2,
    });
  }
}

export function drawLowHpAura(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number,
  baseRadius: number,
  time: number
): void {
  const pulse = Math.sin(time * 0.00628) * 0.5 + 0.5;
  const expandRadius = baseRadius + 5 + pulse * 7;

  for (let i = 0; i < 3; i++) {
    const r = expandRadius + i * 3 + pulse * 3;
    const alpha = (0.35 - i * 0.1) * (0.7 + pulse * 0.3);
    const grad = ctx.createRadialGradient(cx, cy, baseRadius * 0.6, cx, cy, r);
    grad.addColorStop(0, `rgba(255, 60, 60, 0)`);
    grad.addColorStop(0.6, `rgba(231, 76, 60, ${alpha * 0.6})`);
    grad.addColorStop(1, `rgba(192, 57, 43, 0)`);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  ctx.save();
  ctx.strokeStyle = `rgba(255, 80, 80, ${0.4 + pulse * 0.4})`;
  ctx.lineWidth = 2;
  ctx.setLineDash([4, 4]);
  ctx.lineDashOffset = -time * 0.03;
  ctx.beginPath();
  ctx.arc(cx, cy, expandRadius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number
): void {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

let audioCtx: AudioContext | null = null;
export function playDiceClick(intensity = 1): void {
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    const ctxA = audioCtx;
    const osc = ctxA.createOscillator();
    const gain = ctxA.createGain();
    osc.type = 'square';
    const baseFreq = 1200 + Math.random() * 800;
    osc.frequency.setValueAtTime(baseFreq, ctxA.currentTime);
    osc.frequency.exponentialRampToValueAtTime(400, ctxA.currentTime + 0.04);
    gain.gain.setValueAtTime(0.08 * intensity, ctxA.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctxA.currentTime + 0.07);
    osc.connect(gain);
    gain.connect(ctxA.destination);
    osc.start();
    osc.stop(ctxA.currentTime + 0.08);
  } catch (_e) { /* ignore */ }
}

export function playAttackHit(): void {
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    const ctxA = audioCtx;
    const osc = ctxA.createOscillator();
    const gain = ctxA.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, ctxA.currentTime);
    osc.frequency.exponentialRampToValueAtTime(60, ctxA.currentTime + 0.2);
    gain.gain.setValueAtTime(0.12, ctxA.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctxA.currentTime + 0.25);
    osc.connect(gain);
    gain.connect(ctxA.destination);
    osc.start();
    osc.stop(ctxA.currentTime + 0.26);
  } catch (_e) { /* ignore */ }
}

export function playEventSound(type: 'trap' | 'boost' | 'heal'): void {
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    const ctxA = audioCtx;
    const osc = ctxA.createOscillator();
    const gain = ctxA.createGain();
    if (type === 'trap') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(400, ctxA.currentTime);
      osc.frequency.exponentialRampToValueAtTime(120, ctxA.currentTime + 0.2);
    } else if (type === 'boost') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, ctxA.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1200, ctxA.currentTime + 0.15);
    } else {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523, ctxA.currentTime);
      osc.frequency.setValueAtTime(784, ctxA.currentTime + 0.08);
    }
    gain.gain.setValueAtTime(0.1, ctxA.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctxA.currentTime + 0.2);
    osc.connect(gain);
    gain.connect(ctxA.destination);
    osc.start();
    osc.stop(ctxA.currentTime + 0.22);
  } catch (_e) { /* ignore */ }
}
