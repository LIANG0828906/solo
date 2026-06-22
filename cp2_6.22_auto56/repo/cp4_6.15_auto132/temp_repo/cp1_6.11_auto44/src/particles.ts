import { Particle, Debris, TileType } from './types';
import { CONFIG, COLORS, TILE_COLORS } from './constants';
import { randomFloat } from './utils';

export class ParticleSystem {
  private particles: Particle[] = [];
  private debris: Debris[] = [];

  public spawnOreParticles(x: number, y: number, type: TileType): void {
    const color = TILE_COLORS[type];
    const centerX = x + CONFIG.TILE_SIZE / 2;
    const centerY = y + CONFIG.TILE_SIZE / 2;

    for (let i = 0; i < 5; i++) {
      const angle = (i / 5) * Math.PI * 2 + randomFloat(-0.3, 0.3);
      const speed = randomFloat(2, 5);
      
      this.particles.push({
        x: centerX,
        y: centerY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        color,
        size: 4,
        life: 500,
        maxLife: 500
      });
    }
  }

  public addDebris(newDebris: Debris[]): void {
    this.debris.push(...newDebris);
  }

  public update(deltaTime: number): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.1;
      p.life -= deltaTime;

      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }

    for (let i = this.debris.length - 1; i >= 0; i--) {
      const d = this.debris[i];
      d.y += d.vy;
      d.vy += 0.3;
      d.rotation += d.rotationSpeed;
      d.life -= deltaTime;

      if (d.life <= 0 || d.y > 2000) {
        this.debris.splice(i, 1);
      }
    }
  }

  public render(
    ctx: CanvasRenderingContext2D,
    cameraX: number,
    cameraY: number,
    shakeX: number,
    shakeY: number
  ): void {
    for (const p of this.particles) {
      const alpha = p.life / p.maxLife;
      const screenX = p.x - cameraX + shakeX;
      const screenY = p.y - cameraY + shakeY;

      ctx.fillStyle = p.color;
      ctx.globalAlpha = alpha;
      ctx.fillRect(
        Math.floor(screenX),
        Math.floor(screenY),
        p.size,
        p.size
      );
      ctx.globalAlpha = 1;
    }

    for (const d of this.debris) {
      const alpha = d.life / d.maxLife;
      const screenX = d.x - cameraX + shakeX;
      const screenY = d.y - cameraY + shakeY;

      ctx.save();
      ctx.translate(screenX + d.size / 2, screenY + d.size / 2);
      ctx.rotate(d.rotation);
      ctx.fillStyle = COLORS.WALL_HIGHLIGHT;
      ctx.globalAlpha = alpha;
      ctx.fillRect(-d.size / 2, -d.size / 2, d.size, d.size);
      ctx.fillStyle = COLORS.WALL_BASE;
      ctx.fillRect(-d.size / 2 + 1, -d.size / 2 + 1, d.size - 2, d.size - 2);
      ctx.globalAlpha = 1;
      ctx.restore();
    }
  }

  public clear(): void {
    this.particles = [];
    this.debris = [];
  }
}
