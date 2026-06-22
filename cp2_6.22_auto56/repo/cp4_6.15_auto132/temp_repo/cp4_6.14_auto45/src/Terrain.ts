export type ParticleType = 'star' | 'explosion' | 'debris' | 'thrust';

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
  type: ParticleType;
  rotation?: number;
  rotationSpeed?: number;
  vertices?: number[];
  blinkPhase?: number;
  blinkSpeed?: number;
}

const MAX_PARTICLES = 500;

export class Terrain {
  private particles: Particle[] = [];
  private stars: Particle[] = [];
  private starCount: number = 400;
  private worldWidth: number;
  private worldHeight: number;

  constructor(worldWidth: number = 8000, worldHeight: number = 8000) {
    this.worldWidth = worldWidth;
    this.worldHeight = worldHeight;
    this.generateStars();
  }

  private generateStars(): void {
    for (let i = 0; i < this.starCount; i++) {
      this.stars.push({
        x: Math.random() * this.worldWidth,
        y: Math.random() * this.worldHeight,
        vx: 0,
        vy: 0,
        life: Infinity,
        maxLife: Infinity,
        color: `rgba(255, 255, 255, ${0.3 + Math.random() * 0.7})`,
        size: 1 + Math.random() * 2,
        type: 'star',
        blinkPhase: Math.random() * Math.PI * 2,
        blinkSpeed: (1 + Math.random() * 2) / 1000
      });
    }
  }

  public addExplosion(x: number, y: number, count: number = 30): void {
    if (this.particles.length >= MAX_PARTICLES) return;

    for (let i = 0; i < count && this.particles.length < MAX_PARTICLES; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 30 + Math.random() * 120;
      const colors = ['#ff6600', '#ff9933', '#ffcc00', '#ffff66', '#ffffff'];

      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.6,
        maxLife: 0.6,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 2 + Math.random() * 4,
        type: 'explosion'
      });
    }
  }

  public addDebris(x: number, y: number, baseColor: string, count: number = 6): void {
    if (this.particles.length >= MAX_PARTICLES) return;

    for (let i = 0; i < count && this.particles.length < MAX_PARTICLES; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
      const speed = 20 + Math.random() * 40;
      const vertexCount = 3 + Math.floor(Math.random() * 3);
      const vertices: number[] = [];

      for (let v = 0; v < vertexCount * 2; v += 2) {
        const va = (Math.PI * 2 * v) / vertexCount;
        const vr = 5 + Math.random() * 15;
        vertices.push(Math.cos(va) * vr, Math.sin(va) * vr);
      }

      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 2,
        maxLife: 2,
        color: baseColor,
        size: 0,
        type: 'debris',
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 3,
        vertices
      });
    }
  }

  public addThrustParticle(x: number, y: number, angle: number): void {
    if (this.particles.length >= MAX_PARTICLES) return;

    const spread = 0.3;
    const a = angle + Math.PI + (Math.random() - 0.5) * spread;
    const speed = 40 + Math.random() * 60;
    const t = Math.random();

    let r: number, g: number, b: number;
    if (t < 0.3) {
      r = 255; g = 255; b = 200;
    } else if (t < 0.6) {
      r = 255; g = 200; b = 80;
    } else {
      r = 255; g = 120; b = 30;
    }

    this.particles.push({
      x: x + Math.cos(angle + Math.PI) * 12,
      y: y + Math.sin(angle + Math.PI) * 12,
      vx: Math.cos(a) * speed,
      vy: Math.sin(a) * speed,
      life: 0.3 + Math.random() * 0.2,
      maxLife: 0.5,
      color: `rgba(${r}, ${g}, ${b}, `,
      size: 2 + Math.random() * 3,
      type: 'thrust'
    });
  }

  public update(dt: number, time: number): void {
    for (const star of this.stars) {
      if (star.blinkSpeed !== undefined && star.blinkPhase !== undefined) {
        star.blinkPhase += star.blinkSpeed * dt * 1000;
      }
    }

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.98;
      p.vy *= 0.98;
      p.life -= dt;

      if (p.rotation !== undefined && p.rotationSpeed !== undefined) {
        p.rotation += p.rotationSpeed * dt;
      }

      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  public renderStars(
    ctx: CanvasRenderingContext2D,
    cameraX: number,
    cameraY: number,
    viewW: number,
    viewH: number,
    time: number
  ): void {
    const padding = 50;
    for (const star of this.stars) {
      const sx = star.x - cameraX;
      const sy = star.y - cameraY;
      if (sx < -padding || sx > viewW + padding || sy < -padding || sy > viewH + padding) {
        continue;
      }

      let alpha = 1;
      if (star.blinkPhase !== undefined) {
        alpha = 0.3 + 0.7 * (0.5 + 0.5 * Math.sin(star.blinkPhase));
      }

      ctx.globalAlpha = alpha;
      ctx.fillStyle = star.color;
      ctx.beginPath();
      ctx.arc(sx, sy, star.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  public renderParticles(
    ctx: CanvasRenderingContext2D,
    cameraX: number,
    cameraY: number
  ): void {
    for (const p of this.particles) {
      const sx = p.x - cameraX;
      const sy = p.y - cameraY;
      const alpha = Math.max(0, p.life / p.maxLife);

      if (p.type === 'debris' && p.vertices && p.rotation !== undefined) {
        ctx.save();
        ctx.translate(sx, sy);
        ctx.rotate(p.rotation);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 5;
        ctx.beginPath();
        for (let v = 0; v < p.vertices.length; v += 2) {
          if (v === 0) {
            ctx.moveTo(p.vertices[v], p.vertices[v + 1]);
          } else {
            ctx.lineTo(p.vertices[v], p.vertices[v + 1]);
          }
        }
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      } else if (p.type === 'thrust') {
        ctx.globalAlpha = alpha * alpha;
        ctx.fillStyle = p.color + alpha.toFixed(3) + ')';
        ctx.beginPath();
        ctx.arc(sx, sy, p.size * alpha, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.globalAlpha = alpha;
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(sx, sy, p.size * alpha, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }
    ctx.globalAlpha = 1;
  }

  public getStars(): Particle[] {
    return this.stars;
  }

  public getWorldSize(): { width: number; height: number } {
    return { width: this.worldWidth, height: this.worldHeight };
  }
}
