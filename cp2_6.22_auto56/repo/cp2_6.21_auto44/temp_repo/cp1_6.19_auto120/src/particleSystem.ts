import type { KeyZone } from './audioEngine';

const PARTICLE_LIFETIME = 0.8;
const MAX_RADIUS = 140;
const INITIAL_PARTICLE_RADIUS = 2.5;
const WAVE_AMPLITUDE = 3;
const WAVE_FREQUENCY = 2;

const COLOR_GRADIENTS: Record<KeyZone, [string, string]> = {
  left: ['#00D4FF', '#7B2FF7'],
  right: ['#FF6B6B', '#FFD93D'],
  number: ['#C084FC', '#F472B6'],
  other: ['#FFFFFF', '#FFFFFF']
};

interface Particle {
  angle: number;
  speed: number;
  phase: number;
  startTime: number;
  color1: string;
  color2: string;
  isExploding: boolean;
  explodeStartTime: number;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 255, g: 255, b: 255 };
}

function lerpColor(color1: string, color2: string, t: number): string {
  const c1 = hexToRgb(color1);
  const c2 = hexToRgb(color2);
  const r = Math.round(c1.r + (c2.r - c1.r) * t);
  const g = Math.round(c1.g + (c2.g - c1.g) * t);
  const b = Math.round(c1.b + (c2.b - c1.b) * t);
  return `rgb(${r}, ${g}, ${b})`;
}

export class ParticleSystem {
  private particles: Particle[] = [];
  private centerX: number;
  private centerY: number;

  constructor(centerX: number, centerY: number) {
    this.centerX = centerX;
    this.centerY = centerY;
  }

  setCenter(centerX: number, centerY: number): void {
    this.centerX = centerX;
    this.centerY = centerY;
  }

  emit(count: number, zone: KeyZone): void {
    if (zone === 'other') return;

    const [color1, color2] = COLOR_GRADIENTS[zone];

    for (let i = 0; i < count; i++) {
      const particle: Particle = {
        angle: (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.1,
        speed: MAX_RADIUS / PARTICLE_LIFETIME,
        phase: Math.random() * Math.PI * 2,
        startTime: performance.now(),
        color1,
        color2,
        isExploding: false,
        explodeStartTime: 0
      };
      this.particles.push(particle);
    }
  }

  clearAll(): void {
    const now = performance.now();
    for (const p of this.particles) {
      if (!p.isExploding) {
        p.isExploding = true;
        p.explodeStartTime = now;
      }
    }
  }

  private getParticlePosition(p: Particle, elapsed: number): { x: number; y: number } {
    const distance = p.speed * elapsed;
    const waveOffset = Math.sin(elapsed * WAVE_FREQUENCY * Math.PI * 2 + p.phase) * WAVE_AMPLITUDE;
    const perpAngle = p.angle + Math.PI / 2;

    const baseX = this.centerX + Math.cos(p.angle) * distance;
    const baseY = this.centerY + Math.sin(p.angle) * distance;

    const x = baseX + Math.cos(perpAngle) * waveOffset;
    const y = baseY + Math.sin(perpAngle) * waveOffset;

    return { x, y };
  }

  update(): void {
    const now = performance.now();
    this.particles = this.particles.filter(p => {
      if (p.isExploding) {
        const explodeElapsed = (now - p.explodeStartTime) / 1000;
        return explodeElapsed < 0.3;
      }
      const elapsed = (now - p.startTime) / 1000;
      return elapsed < PARTICLE_LIFETIME;
    });
  }

  render(ctx: CanvasRenderingContext2D): void {
    const now = performance.now();

    for (const p of this.particles) {
      let elapsed: number;
      let progress: number;
      let radius: number;
      let alpha: number;
      let pos: { x: number; y: number };

      if (p.isExploding) {
        const explodeElapsed = (now - p.explodeStartTime) / 1000;
        progress = Math.min(explodeElapsed / 0.3, 1);
        elapsed = (now - p.startTime) / 1000;
        pos = this.getParticlePosition(p, elapsed + progress * 0.3);
        radius = INITIAL_PARTICLE_RADIUS * (1 - progress);
        alpha = 1 - progress;
      } else {
        elapsed = (now - p.startTime) / 1000;
        progress = Math.min(elapsed / PARTICLE_LIFETIME, 1);
        pos = this.getParticlePosition(p, elapsed);
        radius = INITIAL_PARTICLE_RADIUS * (1 - progress);
        alpha = 1 - progress;
      }

      const colorT = progress + (Math.sin(p.phase) + 1) / 2 * 0.2;
      const color = lerpColor(p.color1, p.color2, Math.min(colorT, 1));

      ctx.beginPath();
      ctx.arc(pos.x, pos.y, Math.max(radius, 0), 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.globalAlpha = Math.max(alpha, 0);
      ctx.shadowColor = color;
      ctx.shadowBlur = 8;
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;
    }
  }
}
