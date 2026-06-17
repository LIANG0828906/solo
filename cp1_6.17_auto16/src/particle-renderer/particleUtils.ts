import { WeatherType } from '../weather-control/weatherTypes';

interface Particle {
  x: number;
  y: number;
  radius?: number;
  speed: number;
  drift?: number;
  driftOffset?: number;
  phase?: number;
  size?: number;
}

export function createRainParticles(
  width: number,
  height: number,
  count: number,
  speed: number
): Particle[] {
  const particles: Particle[] = [];
  for (let i = 0; i < count; i++) {
    particles.push({
      x: Math.random() * width * 1.5 - width * 0.25,
      y: Math.random() * height,
      speed: speed + (Math.random() - 0.5) * 100,
    });
  }
  return particles;
}

export function updateRainParticle(
  p: Particle,
  dt: number,
  width: number,
  height: number,
  angleDeg: number
): void {
  const angleRad = (angleDeg * Math.PI) / 180;
  p.x += Math.cos(angleRad) * p.speed * dt;
  p.y += Math.sin(angleRad) * p.speed * dt;
  if (p.y > height + 20) {
    p.y = -20;
    p.x = Math.random() * width * 1.5 - width * 0.25;
  }
  if (p.x > width + 20) {
    p.x = -20;
    p.y = Math.random() * height;
  }
}

export function drawRainParticle(ctx: CanvasRenderingContext2D, p: Particle): void {
  const angleRad = (80 * Math.PI) / 180;
  const len = 15;
  ctx.save();
  ctx.globalAlpha = 0.6;
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(p.x, p.y);
  ctx.lineTo(p.x + Math.cos(angleRad) * len, p.y + Math.sin(angleRad) * len);
  ctx.stroke();
  ctx.restore();
}

export function createSnowParticles(
  width: number,
  height: number,
  count: number
): Particle[] {
  const particles: Particle[] = [];
  for (let i = 0; i < count; i++) {
    particles.push({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: 3 + Math.random() * 3,
      speed: 150 + (Math.random() - 0.5) * 40,
      drift: Math.random() * 40 - 20,
      phase: Math.random() * Math.PI * 2,
      driftOffset: 0,
    });
  }
  return particles;
}

export function updateSnowParticle(
  p: Particle,
  dt: number,
  width: number,
  height: number,
  time: number
): void {
  p.y += p.speed * dt;
  p.driftOffset = Math.sin(time * 0.5 + (p.phase || 0)) * (p.drift || 0);
  p.x += p.driftOffset * dt * 2;
  if (p.y > height + 10) {
    p.y = -10;
    p.x = Math.random() * width;
  }
  if (p.x < -10) p.x = width + 10;
  if (p.x > width + 10) p.x = -10;
}

export function drawSnowParticle(ctx: CanvasRenderingContext2D, p: Particle): void {
  ctx.save();
  ctx.globalAlpha = 0.8;
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.arc(p.x, p.y, p.radius || 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function createSandParticles(
  width: number,
  height: number,
  count: number
): Particle[] {
  const particles: Particle[] = [];
  for (let i = 0; i < count; i++) {
    particles.push({
      x: Math.random() * width * 0.5 - width * 0.5,
      y: Math.random() * height,
      speed: 1200 + (Math.random() - 0.5) * 200,
      size: 2 + Math.random() * 2,
    });
  }
  return particles;
}

export function updateSandParticle(
  p: Particle,
  dt: number,
  width: number,
  height: number
): void {
  p.x += p.speed * dt;
  p.y += (Math.random() - 0.5) * 100 * dt;
  if (p.x > width + 20) {
    p.x = -20;
    p.y = Math.random() * height;
  }
}

export function drawSandParticle(ctx: CanvasRenderingContext2D, p: Particle): void {
  ctx.save();
  ctx.globalAlpha = 0.7;
  ctx.fillStyle = '#B8860B';
  ctx.fillRect(p.x, p.y, p.size || 3, p.size || 3);
  ctx.restore();
}

export function drawLightning(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
): void {
  ctx.save();
  ctx.globalAlpha = 0.3;
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
}

export function drawSun(ctx: CanvasRenderingContext2D, time: number): void {
  const cx = ctx.canvas.width - 80;
  const cy = 80;
  const pulseRadius = 40 + Math.sin(time * (Math.PI / 2)) * 0;
  const glowAlpha = 0.3 + 0.3 * Math.sin(time * (Math.PI * 2) / 4);

  ctx.save();
  const grad = ctx.createRadialGradient(cx, cy, 10, cx, cy, pulseRadius);
  grad.addColorStop(0, `rgba(255, 215, 0, 0.6)`);
  grad.addColorStop(1, `rgba(255, 215, 0, ${glowAlpha})`);
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(cx, cy, pulseRadius, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#FFD700';
  ctx.beginPath();
  ctx.arc(cx, cy, 25, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function getParticleCount(weather: WeatherType): number {
  switch (weather) {
    case WeatherType.Sunny:
      return 0;
    case WeatherType.Rainy:
      return 500;
    case WeatherType.Snowy:
      return 500;
    case WeatherType.Stormy:
      return 500;
    default:
      return 0;
  }
}

export function getBackgroundForWeather(weather: WeatherType): string {
  switch (weather) {
    case WeatherType.Sunny:
      return '#87CEEB';
    case WeatherType.Rainy:
      return '#4A4A4A';
    case WeatherType.Snowy:
      return '#D3D3D3';
    case WeatherType.Stormy:
      return '#000000';
    default:
      return '#87CEEB';
  }
}
