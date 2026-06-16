export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  swayPhase?: number;
}

const DEG_80 = (80 * Math.PI) / 180;

export function createRainParticles(
  count: number,
  width: number,
  height: number,
  speed = 600
): Particle[] {
  const particles: Particle[] = [];
  const vx = speed * Math.cos(DEG_80);
  const vy = speed * Math.sin(DEG_80);

  for (let i = 0; i < count; i++) {
    particles.push({
      x: Math.random() * width,
      y: Math.random() * (height + 50) - 50,
      vx,
      vy,
      size: 15,
      opacity: 0.6 + Math.random() * 0.2,
    });
  }

  return particles;
}

export function createSnowParticles(
  count: number,
  width: number,
  height: number
): Particle[] {
  const particles: Particle[] = [];

  for (let i = 0; i < count; i++) {
    particles.push({
      x: Math.random() * width,
      y: Math.random() * (height + 50) - 50,
      vx: 0,
      vy: 150,
      size: 3 + Math.random() * 3,
      opacity: 0.8 + Math.random() * 0.2,
      swayPhase: Math.random() * Math.PI * 2,
    });
  }

  return particles;
}

export function createSandParticles(
  count: number,
  width: number,
  height: number
): Particle[] {
  const particles: Particle[] = [];

  for (let i = 0; i < count; i++) {
    particles.push({
      x: Math.random() * (width + 50) - 50,
      y: Math.random() * height,
      vx: 1200,
      vy: 0,
      size: 2 + Math.random() * 2,
      opacity: 1,
    });
  }

  return particles;
}

export function updateRain(
  particles: Particle[],
  dt: number,
  width: number,
  height: number,
  speed = 600
): void {
  const vx = speed * Math.cos(DEG_80);
  const vy = speed * Math.sin(DEG_80);

  for (const p of particles) {
    p.x += vx * dt;
    p.y += vy * dt;

    if (p.y > height + 20) {
      p.y = -20;
      p.x = Math.random() * width;
    }
  }
}

export function updateSnow(
  particles: Particle[],
  dt: number,
  width: number,
  height: number
): void {
  for (const p of particles) {
    p.swayPhase = (p.swayPhase ?? 0) + dt * 2;
    const swayOffset = Math.sin(p.swayPhase) * 20;
    p.x += swayOffset * dt;
    p.y += p.vy * dt;

    if (p.y > height + 20) {
      p.y = -20;
      p.x = Math.random() * width;
      p.swayPhase = Math.random() * Math.PI * 2;
    }
  }
}

export function updateSand(
  particles: Particle[],
  dt: number,
  width: number,
  height: number
): void {
  for (const p of particles) {
    p.x += p.vx * dt;
    p.y += p.vy * dt;

    if (p.x > width + 20) {
      p.x = -20;
      p.y = Math.random() * height;
    }
  }
}

export function drawRain(ctx: CanvasRenderingContext2D, particles: Particle[]): void {
  ctx.save();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.lineWidth = 2;

  for (const p of particles) {
    ctx.globalAlpha = p.opacity;
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(p.x - p.vx * 0.025, p.y - p.vy * 0.025);
    ctx.stroke();
  }

  ctx.restore();
}

export function drawSnow(ctx: CanvasRenderingContext2D, particles: Particle[]): void {
  ctx.save();
  ctx.fillStyle = 'rgba(255, 255, 255, 1)';

  for (const p of particles) {
    ctx.globalAlpha = p.opacity;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

export function drawSand(ctx: CanvasRenderingContext2D, particles: Particle[]): void {
  ctx.save();
  ctx.fillStyle = '#B8860B';

  for (const p of particles) {
    ctx.globalAlpha = p.opacity;
    ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
  }

  ctx.restore();
}

export function drawLightning(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  intensity: number
): void {
  ctx.save();
  ctx.fillStyle = `rgba(255, 255, 255, ${intensity * 0.3})`;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
}
