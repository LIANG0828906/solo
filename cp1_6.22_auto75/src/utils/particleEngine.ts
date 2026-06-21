export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  baseSize: number;
  alpha: number;
  color: string;
  twinkleSpeed: number;
  twinkleOffset: number;
}

export interface ParticleConfig {
  particleCount: number;
  colors: string[];
  connectionDistance: number;
  connectionColor: string;
  speedMultiplier: number;
}

export const easeOutCubic = (t: number): number => 1 - Math.pow(1 - t, 3);

export const easeOutQuart = (t: number): number => 1 - Math.pow(1 - t, 4);

export const lerp = (start: number, end: number, t: number): number => start + (end - start) * t;

export const lerpColor = (color1: string, color2: string, t: number): string => {
  const c1 = hexToRgb(color1);
  const c2 = hexToRgb(color2);
  const r = Math.round(lerp(c1.r, c2.r, t));
  const g = Math.round(lerp(c1.g, c2.g, t));
  const b = Math.round(lerp(c1.b, c2.b, t));
  return `rgb(${r}, ${g}, ${b})`;
};

const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (result) {
    return {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    };
  }
  return { r: 255, g: 255, b: 255 };
};

const withAlpha = (color: string, alpha: number): string => {
  const rgbMatch = /^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/i.exec(color);
  if (rgbMatch) {
    return `rgba(${parseInt(rgbMatch[1])}, ${parseInt(rgbMatch[2])}, ${parseInt(rgbMatch[3])}, ${alpha})`;
  }
  const { r, g, b } = hexToRgb(color);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export class ParticleEngine {
  particles: Particle[] = [];
  width: number = 0;
  height: number = 0;
  config: ParticleConfig;
  transitionProgress: number = 1;
  targetColors: string[] = [];
  currentColors: string[] = [];
  private time: number = 0;

  constructor(config: ParticleConfig, width: number, height: number) {
    this.config = { ...config };
    this.targetColors = [...config.colors];
    this.currentColors = [...config.colors];
    this.resize(width, height);
    this.initParticles();
  }

  resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
  }

  setColors(colors: string[]): void {
    this.targetColors = [...colors];
    this.transitionProgress = 0;
  }

  setSpeed(speedMultiplier: number): void {
    this.config.speedMultiplier = speedMultiplier;
  }

  private initParticles(): void {
    this.particles = [];
    for (let i = 0; i < this.config.particleCount; i++) {
      this.particles.push(this.createParticle(true));
    }
  }

  private createParticle(randomPosition: boolean = false): Particle {
    const color = randomFrom(this.currentColors);
    const baseSize = 1.5 + Math.random() * 3;
    return {
      x: randomPosition ? Math.random() * this.width : Math.random() * this.width,
      y: randomPosition ? Math.random() * this.height : Math.random() * this.height,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      size: baseSize,
      baseSize,
      alpha: 0.4 + Math.random() * 0.6,
      color,
      twinkleSpeed: 0.01 + Math.random() * 0.03,
      twinkleOffset: Math.random() * Math.PI * 2
    };
  }

  update(deltaTime: number): void {
    this.time += deltaTime;

    if (this.transitionProgress < 1) {
      this.transitionProgress = Math.min(1, this.transitionProgress + deltaTime * 0.02);
      const t = easeOutCubic(this.transitionProgress);
      for (let i = 0; i < this.currentColors.length; i++) {
        if (this.targetColors[i]) {
          this.currentColors[i] = lerpColor(
            getColorAtIndex(this.config.colors, i),
            this.targetColors[i],
            t
          );
        }
      }
    }

    const speedFactor = this.config.speedMultiplier * deltaTime * 0.06;

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];

      p.x += p.vx * speedFactor;
      p.y += p.vy * speedFactor;

      if (p.x < 0) p.x = this.width;
      if (p.x > this.width) p.x = 0;
      if (p.y < 0) p.y = this.height;
      if (p.y > this.height) p.y = 0;

      const twinkle = Math.sin(this.time * p.twinkleSpeed + p.twinkleOffset);
      p.size = p.baseSize + twinkle * p.baseSize * 0.5;
      p.alpha = 0.35 + (twinkle * 0.5 + 0.5) * 0.45;

      if (Math.random() < 0.001) {
        p.color = randomFrom(this.currentColors);
      }
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    const dist = this.config.connectionDistance;
    const distSq = dist * dist;

    ctx.lineWidth = 0.6;
    for (let i = 0; i < this.particles.length; i++) {
      for (let j = i + 1; j < this.particles.length; j++) {
        const p1 = this.particles[i];
        const p2 = this.particles[j];
        const dx = p1.x - p2.x;
        const dy = p1.y - p2.y;
        const dSq = dx * dx + dy * dy;

        if (dSq < distSq) {
          const alpha = (1 - dSq / distSq) * 0.4;
          ctx.strokeStyle = this.config.connectionColor.replace(
            /rgba?\(([^)]+)\)/,
            (_match, inner) => {
              const parts = inner.split(',').map((s: string) => s.trim());
              if (parts.length === 4) {
                parts[3] = (parseFloat(parts[3]) * alpha).toString();
              }
              return `rgba(${parts.join(',')})`;
            }
          );
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.stroke();
        }
      }
    }

    for (const p of this.particles) {
      ctx.beginPath();
      ctx.globalAlpha = p.alpha;

      const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 2.5);
      gradient.addColorStop(0, p.color);
      gradient.addColorStop(0.4, withAlpha(p.color, 0.53));
      gradient.addColorStop(1, withAlpha(p.color, 0));

      ctx.fillStyle = gradient;
      ctx.arc(p.x, p.y, p.size * 2.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.fillStyle = p.color;
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
}

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getColorAtIndex(colors: string[], index: number): string {
  return colors[index % colors.length];
}
