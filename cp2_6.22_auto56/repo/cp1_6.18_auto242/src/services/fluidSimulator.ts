import type { Particle, DrawCommand, BrushStyle, DiffusionSpeed } from '@/types';
import { PARTICLE_MAX_LIFE, PARTICLE_COUNT_THRESHOLD } from '@/types';

let particleIdCounter = 0;
const particlePool: Particle[] = [];

function gaussianRandom(): number {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

function acquireParticle(): Particle {
  if (particlePool.length > 0) {
    return particlePool.pop()!;
  }
  return {
    id: 0, x: 0, y: 0, vx: 0, vy: 0,
    size: 0, baseSize: 0, color: '#000', opacity: 1,
    life: 0, maxLife: PARTICLE_MAX_LIFE, angle: 0, phase: 0,
    style: 'ripple', originX: 0, originY: 0,
  };
}

export function releaseParticle(p: Particle): void {
  if (particlePool.length < 5000) {
    particlePool.push(p);
  }
}

function createParticlesForRipple(
  cmd: DrawCommand,
  count: number,
  minSize: number,
  out: Particle[]
): void {
  const { x, y, prevX, prevY, pressure, brushConfig } = cmd;
  for (let i = 0; i < count; i++) {
    const t = count === 1 ? 1 : i / (count - 1);
    const px = prevX + (x - prevX) * t + gaussianRandom() * 1.5;
    const py = prevY + (y - prevY) * t + gaussianRandom() * 1.5;
    const size = minSize + pressure * (12 - minSize);
    const baseSize = size;
    const p = acquireParticle();
    p.id = ++particleIdCounter;
    p.x = px; p.y = py; p.originX = px; p.originY = py;
    p.vx = (Math.random() - 0.5) * 0.3;
    p.vy = (Math.random() - 0.5) * 0.3;
    p.size = size; p.baseSize = baseSize;
    p.color = brushConfig.inkColor;
    p.opacity = 0.55 + Math.random() * 0.25;
    p.life = PARTICLE_MAX_LIFE;
    p.maxLife = PARTICLE_MAX_LIFE;
    p.angle = 0;
    p.phase = Math.random() * Math.PI * 2;
    p.style = 'ripple';
    out.push(p);
  }
}

function createParticlesForVortex(
  cmd: DrawCommand,
  count: number,
  minSize: number,
  out: Particle[]
): void {
  const { x, y, prevX, prevY, pressure, brushConfig } = cmd;
  const dx = x - prevX, dy = y - prevY;
  const dirAngle = Math.atan2(dy, dx);
  for (let i = 0; i < count; i++) {
    const t = count === 1 ? 1 : i / (count - 1);
    const radius = (1 + Math.random() * 2) * (2 + pressure * 6);
    const angleOffset = (Math.random() - 0.5) * Math.PI * 0.5;
    const ang = dirAngle + Math.PI / 2 + angleOffset;
    const px = prevX + (x - prevX) * t + Math.cos(ang) * radius;
    const py = prevY + (y - prevY) * t + Math.sin(ang) * radius;
    const size = minSize + pressure * (12 - minSize);
    const p = acquireParticle();
    p.id = ++particleIdCounter;
    p.x = px; p.y = py; p.originX = prevX + (x - prevX) * t; p.originY = prevY + (y - prevY) * t;
    p.vx = -Math.sin(ang) * (0.5 + pressure * 1.5);
    p.vy = Math.cos(ang) * (0.5 + pressure * 1.5);
    p.size = size; p.baseSize = size;
    p.color = brushConfig.inkColor;
    p.opacity = 0.5 + Math.random() * 0.3;
    p.life = PARTICLE_MAX_LIFE;
    p.maxLife = PARTICLE_MAX_LIFE;
    p.angle = ang;
    p.phase = radius;
    p.style = 'vortex';
    out.push(p);
  }
}

function createParticlesForSplash(
  cmd: DrawCommand,
  count: number,
  minSize: number,
  out: Particle[]
): void {
  const { x, y, prevX, prevY, pressure, brushConfig } = cmd;
  const dx = x - prevX, dy = y - prevY;
  const dist = Math.hypot(dx, dy);
  const nx = dist > 0 ? dx / dist : 0;
  const ny = dist > 0 ? dy / dist : 0;
  for (let i = 0; i < count; i++) {
    const t = count === 1 ? 1 : i / (count - 1);
    const baseX = prevX + (x - prevX) * t;
    const baseY = prevY + (y - prevY) * t;
    const spreadAngle = (Math.random() - 0.5) * Math.PI * 0.7;
    const cos = Math.cos(spreadAngle), sin = Math.sin(spreadAngle);
    const rx = nx * cos - ny * sin;
    const ry = nx * sin + ny * cos;
    const speed = (0.5 + Math.random()) * (1.5 + pressure * 4);
    const px = baseX + rx * (0.5 + Math.random() * 3);
    const py = baseY + ry * (0.5 + Math.random() * 3);
    const size = minSize * (0.6 + Math.random() * 0.8) + pressure * (10 - minSize) * 0.7;
    const p = acquireParticle();
    p.id = ++particleIdCounter;
    p.x = px; p.y = py; p.originX = baseX; p.originY = baseY;
    p.vx = rx * speed * (0.5 + Math.random());
    p.vy = ry * speed * (0.5 + Math.random());
    p.size = size; p.baseSize = size;
    p.color = brushConfig.inkColor;
    p.opacity = 0.55 + Math.random() * 0.3;
    p.life = PARTICLE_MAX_LIFE;
    p.maxLife = PARTICLE_MAX_LIFE;
    p.angle = spreadAngle;
    p.phase = Math.random() * 10;
    p.style = 'splash';
    out.push(p);
  }
}

export function emitDrawParticles(
  cmd: DrawCommand,
  activeParticleCount: number,
  out: Particle[]
): void {
  const minSize = activeParticleCount > PARTICLE_COUNT_THRESHOLD ? 2 : 3;
  const countRaw = 5 + cmd.pressure * 15;
  const count = Math.max(1, Math.floor(countRaw * (activeParticleCount > PARTICLE_COUNT_THRESHOLD ? 0.7 : 1)));

  switch (cmd.brushConfig.brushStyle) {
    case 'ripple':
      createParticlesForRipple(cmd, count, minSize, out);
      break;
    case 'vortex':
      createParticlesForVortex(cmd, count, minSize, out);
      break;
    case 'splash':
      createParticlesForSplash(cmd, count, minSize, out);
      break;
  }
}

export function updateParticles(
  particles: Particle[],
  dtMs: number,
  currentStyle: BrushStyle,
  diffusion: DiffusionSpeed,
  canvasWidth: number,
  canvasHeight: number
): Particle[] {
  const dt = dtMs / 16.666;
  const friction = Math.pow(0.98, diffusion);
  const brownian = 0.3 * diffusion;
  const survival: Particle[] = [];

  for (let i = 0; i < particles.length; i++) {
    const p = particles[i];
    p.life -= dtMs;
    if (p.life <= 0) {
      releaseParticle(p);
      continue;
    }

    const lifeRatio = p.life / p.maxLife;
    const style = currentStyle;

    if (style === 'ripple' || p.style === 'ripple') {
      const wave = Math.sin(p.phase + (p.maxLife - p.life) * 0.006) * 1.2 * dt;
      p.x += wave * 0.6;
      p.y += wave * 0.4;
    }

    if (style === 'vortex' || p.style === 'vortex') {
      const toCX = p.originX - p.x;
      const toCY = p.originY - p.y;
      const r = Math.hypot(toCX, toCY) + 0.0001;
      const angularSpeed = (0.02 + 0.5 / r) * dt * diffusion;
      const c = Math.cos(angularSpeed), s = Math.sin(angularSpeed);
      const nx = toCX * c - toCY * s;
      const ny = toCX * s + toCY * c;
      p.x = p.originX - nx;
      p.y = p.originY - ny;
      p.originX += p.vx * 0.1 * dt;
      p.originY += p.vy * 0.1 * dt;
    }

    p.vx *= friction;
    p.vy *= friction;
    p.vx += gaussianRandom() * brownian * dt * 0.1;
    p.vy += gaussianRandom() * brownian * dt * 0.1;
    p.x += p.vx * dt;
    p.y += p.vy * dt;

    const expansion = (1 - lifeRatio) * p.baseSize * 0.5 * diffusion;
    p.size = p.baseSize + expansion;
    p.opacity = lifeRatio * (0.75 + 0.25 * (p.baseSize / 12));

    if (p.x < -50 || p.x > canvasWidth + 50 || p.y < -50 || p.y > canvasHeight + 50) {
      releaseParticle(p);
      continue;
    }

    survival.push(p);
  }

  return survival;
}

export function renderParticles(
  ctx: CanvasRenderingContext2D,
  particles: Particle[],
  width: number,
  height: number
): void {
  ctx.save();
  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = 'rgba(10, 10, 10, 0.08)';
  ctx.fillRect(0, 0, width, height);

  ctx.globalCompositeOperation = 'multiply';

  const colorMap = new Map<string, Particle[]>();
  for (const p of particles) {
    let arr = colorMap.get(p.color);
    if (!arr) {
      arr = [];
      colorMap.set(p.color, arr);
    }
    arr.push(p);
  }

  for (const [color, list] of colorMap) {
    for (const p of list) {
      const alpha = Math.max(0, Math.min(1, p.opacity));
      const r = Math.max(0.5, p.size);
      const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r);
      grad.addColorStop(0, hexWithAlpha(color, alpha * 0.85));
      grad.addColorStop(0.5, hexWithAlpha(color, alpha * 0.4));
      grad.addColorStop(1, hexWithAlpha(color, 0));
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.restore();
}

function hexWithAlpha(hex: string, alpha: number): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha.toFixed(4)})`;
}
