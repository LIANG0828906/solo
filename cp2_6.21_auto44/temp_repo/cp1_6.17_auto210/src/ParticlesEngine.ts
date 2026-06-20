export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  targetColor: string;
  colorProgress: number;
  mass: number;
  damping: number;
  age: number;
  trail: { x: number; y: number; age: number }[];
  strokeId: number;
  opacity: number;
  undoing: boolean;
  undoStartX: number;
  undoStartY: number;
  undoEndX: number;
  undoEndY: number;
  undoProgress: number;
  clearing: boolean;
  clearProgress: number;
}

export interface Stroke {
  id: number;
  particles: Particle[];
  startPoint: { x: number; y: number };
}

const COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
  '#F5A623', '#D9534F', '#7B68EE', '#FFD700'
];

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 255, g: 255, b: 255 };
}

function rgbToHex(r: number, g: number, b: number): string {
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

function lerpColor(color1: string, color2: string, t: number): string {
  const c1 = hexToRgb(color1);
  const c2 = hexToRgb(color2);
  const r = Math.round(c1.r + (c2.r - c1.r) * t);
  const g = Math.round(c1.g + (c2.g - c1.g) * t);
  const b = Math.round(c1.b + (c2.b - c1.b) * t);
  return rgbToHex(r, g, b);
}

function getNearbyColor(currentColor: string): string {
  const currentIndex = COLORS.indexOf(currentColor);
  if (currentIndex === -1) return COLORS[Math.floor(Math.random() * COLORS.length)];
  const direction = Math.random() > 0.5 ? 1 : -1;
  const nextIndex = (currentIndex + direction + COLORS.length) % COLORS.length;
  return COLORS[nextIndex];
}

export class ParticlesEngine {
  particles: Particle[] = [];
  strokes: Stroke[] = [];
  maxParticles = 2000;
  gravity = 0.2;
  restitution = 0.6;
  trailLength = 15;
  colorChangeInterval = 0.5;
  private strokeIdCounter = 0;
  width = 0;
  height = 0;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
  }

  resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
  }

  createStrokeId(): number {
    return ++this.strokeIdCounter;
  }

  addParticle(
    x: number,
    y: number,
    vx: number,
    vy: number,
    color: string,
    size: number,
    strokeId: number
  ): void {
    const particle: Particle = {
      x,
      y,
      vx,
      vy,
      size,
      color,
      targetColor: getNearbyColor(color),
      colorProgress: 0,
      mass: 1,
      damping: 0.98,
      age: 0,
      trail: [],
      strokeId,
      opacity: 1,
      undoing: false,
      undoStartX: x,
      undoStartY: y,
      undoEndX: x,
      undoEndY: y,
      undoProgress: 0,
      clearing: false,
      clearProgress: 0,
    };

    this.particles.push(particle);

    const stroke = this.strokes.find((s) => s.id === strokeId);
    if (stroke) {
      stroke.particles.push(particle);
    }

    while (this.particles.length > this.maxParticles) {
      const removed = this.particles.shift();
      if (removed) {
        const strokeToRemoveFrom = this.strokes.find((s) => s.id === removed.strokeId);
        if (strokeToRemoveFrom) {
          const idx = strokeToRemoveFrom.particles.indexOf(removed);
          if (idx > -1) strokeToRemoveFrom.particles.splice(idx, 1);
        }
      }
    }
  }

  addStroke(startX: number, startY: number): number {
    const id = this.createStrokeId();
    this.strokes.push({
      id,
      particles: [],
      startPoint: { x: startX, y: startY },
    });
    if (this.strokes.length > 10) {
      this.strokes.shift();
    }
    return id;
  }

  update(dt: number): void {
    const dts = dt / 1000;

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];

      if (p.clearing) {
        p.clearProgress += dts / 0.5;
        p.opacity = Math.max(0, 1 - p.clearProgress);
        if (p.clearProgress >= 1) {
          this.particles.splice(i, 1);
          continue;
        }
      }

      if (p.undoing) {
        p.undoProgress += dts / 1.0;
        const t = Math.min(1, p.undoProgress);
        const easeT = 1 - Math.pow(1 - t, 3);
        p.x = p.undoStartX + (p.undoEndX - p.undoStartX) * easeT;
        p.y = p.undoStartY + (p.undoEndY - p.undoStartY) * easeT;
        p.opacity = Math.max(0, 1 - t);
        if (p.undoProgress >= 1) {
          this.particles.splice(i, 1);
          continue;
        }
        continue;
      }

      p.vy += this.gravity * p.mass;
      p.vx *= p.damping;
      p.vy *= p.damping;
      p.x += p.vx * dts * 60;
      p.y += p.vy * dts * 60;

      if (p.x - p.size / 2 < 0) {
        p.x = p.size / 2;
        p.vx = Math.abs(p.vx) * this.restitution;
      } else if (p.x + p.size / 2 > this.width) {
        p.x = this.width - p.size / 2;
        p.vx = -Math.abs(p.vx) * this.restitution;
      }

      if (p.y - p.size / 2 < 0) {
        p.y = p.size / 2;
        p.vy = Math.abs(p.vy) * this.restitution;
      } else if (p.y + p.size / 2 > this.height) {
        p.y = this.height - p.size / 2;
        p.vy = -Math.abs(p.vy) * this.restitution;
      }

      p.colorProgress += dts;
      if (p.colorProgress >= this.colorChangeInterval) {
        p.colorProgress = 0;
        p.color = p.targetColor;
        p.targetColor = getNearbyColor(p.color);
      }

      p.trail.unshift({ x: p.x, y: p.y, age: 0 });
      if (p.trail.length > this.trailLength) {
        p.trail.pop();
      }
      for (const t of p.trail) {
        t.age += dts;
      }

      p.age += dts;
    }

    this.strokes = this.strokes.filter((s) => s.particles.length > 0);
  }

  render(ctx: CanvasRenderingContext2D): void {
    ctx.globalCompositeOperation = 'lighter';

    for (const p of this.particles) {
      if (p.opacity <= 0) continue;

      const currentColor = lerpColor(p.color, p.targetColor, p.colorProgress / this.colorChangeInterval);
      const rgb = hexToRgb(currentColor);

      for (let i = p.trail.length - 1; i >= 0; i--) {
        const t = p.trail[i];
        const trailOpacity = (1 - i / p.trail.length) * 0.3 * p.opacity * Math.max(0, 1 - t.age / 1.5);
        const trailSize = p.size * (1 - i / p.trail.length) * 0.8;

        const gradient = ctx.createRadialGradient(t.x, t.y, 0, t.x, t.y, trailSize);
        gradient.addColorStop(0, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${trailOpacity})`);
        gradient.addColorStop(1, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0)`);

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(t.x, t.y, trailSize, 0, Math.PI * 2);
        ctx.fill();
      }

      const blurRadius = Math.min(20, p.size * 1.5);
      ctx.shadowBlur = blurRadius;
      ctx.shadowColor = currentColor;

      const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
      gradient.addColorStop(0, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${p.opacity})`);
      gradient.addColorStop(0.6, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${p.opacity * 0.8})`);
      gradient.addColorStop(1, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0)`);

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();

      ctx.shadowBlur = 0;
    }

    ctx.globalCompositeOperation = 'source-over';
  }

  clear(): void {
    for (const p of this.particles) {
      p.clearing = true;
      p.clearProgress = 0;
    }
  }

  undoStroke(): void {
    if (this.strokes.length === 0) return;

    const stroke = this.strokes.pop();
    if (!stroke) return;

    for (const p of stroke.particles) {
      p.undoing = true;
      p.undoStartX = p.x;
      p.undoStartY = p.y;
      p.undoEndX = stroke.startPoint.x;
      p.undoEndY = stroke.startPoint.y;
      p.undoProgress = 0;
    }
  }

  canUndo(): boolean {
    return this.strokes.length > 0;
  }
}
