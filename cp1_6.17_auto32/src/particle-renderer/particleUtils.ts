export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  drift?: number;
  driftPhase?: number;
}

export function createRainParticles(
  count: number,
  width: number,
  height: number,
  speed: number = 600
): Particle[] {
  const particles: Particle[] = [];
  const angle = (80 * Math.PI) / 180;
  for (let i = 0; i < count; i++) {
    particles.push({
      x: Math.random() * (width + 200) - 100,
      y: Math.random() * height,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: 15,
      opacity: 0.4 + Math.random() * 0.4
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
      y: Math.random() * height,
      vx: 0,
      vy: 150 + Math.random() * 50,
      size: 3 + Math.random() * 3,
      opacity: 0.6 + Math.random() * 0.4,
      drift: 20 + Math.random() * 20,
      driftPhase: Math.random() * Math.PI * 2
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
      x: Math.random() * width - width,
      y: Math.random() * height,
      vx: 1200 + Math.random() * 400,
      vy: (Math.random() - 0.5) * 100,
      size: 2 + Math.random() * 2,
      opacity: 0.5 + Math.random() * 0.5
    });
  }
  return particles;
}

export function updateRainParticles(
  particles: Particle[],
  dt: number,
  width: number,
  height: number
): void {
  for (const p of particles) {
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    if (p.y > height + 20 || p.x > width + 100) {
      p.x = Math.random() * (width + 200) - 100;
      p.y = -20;
    }
  }
}

export function updateSnowParticles(
  particles: Particle[],
  dt: number,
  width: number,
  height: number
): void {
  for (const p of particles) {
    p.driftPhase = (p.driftPhase ?? 0) + dt * 2;
    p.x += Math.sin(p.driftPhase) * (p.drift ?? 20) * dt;
    p.y += p.vy * dt;
    if (p.y > height + 10) {
      p.x = Math.random() * width;
      p.y = -10;
      p.driftPhase = Math.random() * Math.PI * 2;
    }
    if (p.x < -20) p.x = width + 20;
    if (p.x > width + 20) p.x = -20;
  }
}

export function updateSandParticles(
  particles: Particle[],
  dt: number,
  width: number,
  height: number
): void {
  for (const p of particles) {
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    if (p.x > width + 20) {
      p.x = -20 - Math.random() * width;
      p.y = Math.random() * height;
    }
  }
}

export function drawRainParticles(
  ctx: CanvasRenderingContext2D,
  particles: Particle[]
): void {
  ctx.save();
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 2;
  const angle = (80 * Math.PI) / 180;
  const dx = Math.cos(angle) * 15;
  const dy = Math.sin(angle) * 15;
  for (const p of particles) {
    ctx.globalAlpha = p.opacity;
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(p.x + dx, p.y + dy);
    ctx.stroke();
  }
  ctx.restore();
}

export function drawSnowParticles(
  ctx: CanvasRenderingContext2D,
  particles: Particle[]
): void {
  ctx.save();
  ctx.fillStyle = '#FFFFFF';
  for (const p of particles) {
    ctx.globalAlpha = p.opacity;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

export function drawSandParticles(
  ctx: CanvasRenderingContext2D,
  particles: Particle[]
): void {
  ctx.save();
  ctx.fillStyle = '#B8860B';
  for (const p of particles) {
    ctx.globalAlpha = p.opacity;
    ctx.fillRect(p.x, p.y, p.size, p.size);
  }
  ctx.restore();
}
