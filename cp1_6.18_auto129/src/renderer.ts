import type { Particle } from './types';

const PARTICLE_COLORS: Record<string, string> = {
  producer: '#4ADE80',
  consumer: '#FACC15',
  hunter: '#EF4444',
};

const GLOW_RADIUS_OFFSET: Record<string, number> = {
  producer: 4,
  consumer: 6,
  hunter: 8,
};

export function render(
  ctx: CanvasRenderingContext2D,
  particles: Particle[],
  width: number,
  height: number,
  frameCount: number
): void {
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, '#0F172A');
  gradient.addColorStop(1, '#1E293B');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  for (const p of particles) {
    const color = PARTICLE_COLORS[p.type];
    const glowOffset = GLOW_RADIUS_OFFSET[p.type];

    for (let i = p.trail.length - 1; i >= 0; i--) {
      const t = p.trail[i];
      const alpha = 0.15 * (1 - i / p.trail.length);
      ctx.beginPath();
      ctx.arc(t.x, t.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = hexToRgba(color, alpha);
      ctx.fill();
    }
  }

  for (const p of particles) {
    const color = PARTICLE_COLORS[p.type];
    const glowOffset = GLOW_RADIUS_OFFSET[p.type];
    const glowRadius = p.radius + glowOffset;

    const gradient = ctx.createRadialGradient(
      p.x, p.y, p.radius * 0.3,
      p.x, p.y, glowRadius
    );
    gradient.addColorStop(0, hexToRgba(color, 0.6));
    gradient.addColorStop(0.5, hexToRgba(color, 0.2));
    gradient.addColorStop(1, hexToRgba(color, 0));

    ctx.beginPath();
    ctx.arc(p.x, p.y, glowRadius, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();

    const innerGradient = ctx.createRadialGradient(
      p.x - p.radius * 0.3, p.y - p.radius * 0.3, 0,
      p.x, p.y, p.radius
    );
    innerGradient.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
    innerGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fillStyle = innerGradient;
    ctx.fill();
  }
}

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
