import { Graphics } from '@pixi/graphics';
import type { Particle } from '../types';

class ParticleRenderer {
  private graphics: Graphics;
  private width: number;
  private height: number;

  constructor(width: number, height: number) {
    this.graphics = new Graphics();
    this.width = width;
    this.height = height;
  }

  getDisplayObject(): Graphics {
    return this.graphics;
  }

  resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
  }

  render(particles: Particle[]): void {
    this.graphics.clear();

    const len = particles.length;
    if (len === 0) return;

    for (let i = 0; i < len; i++) {
      const p = particles[i];
      if (!p.active || p.alpha <= 0) continue;

      const lifeRatio = 1 - (p.life / p.maxLife);
      const r = Math.round(p.startColor.r + (p.endColor.r - p.startColor.r) * lifeRatio);
      const g = Math.round(p.startColor.g + (p.endColor.g - p.startColor.g) * lifeRatio);
      const b = Math.round(p.startColor.b + (p.endColor.b - p.startColor.b) * lifeRatio);
      const alpha = Math.max(0, Math.min(1, p.alpha));

      const color = (r << 16) | (g << 8) | b;

      this.graphics.beginFill(color, alpha);
      this.graphics.drawCircle(p.x, p.y, p.size);
      this.graphics.endFill();
    }
  }
}

export { ParticleRenderer };
