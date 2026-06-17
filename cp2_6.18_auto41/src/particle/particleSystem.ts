import p5 from 'p5';
import { FluidSolver } from '../fluid/fluidSolver';
import { eventBus } from '../eventBus';

interface Particle {
  x: number;
  y: number;
  nx: number;
  ny: number;
  life: number;
  maxLife: number;
  size: number;
  alpha: number;
}

export class ParticleSystem {
  particles: Particle[];
  maxParticles: number;
  readonly HARD_LIMIT: number = 5000;
  solver: FluidSolver;
  frameCount: number = 0;
  skipUpdate: boolean = false;
  private recyclePtr: number = 0;

  constructor(solver: FluidSolver, count: number = 2000) {
    this.solver = solver;
    this.maxParticles = Math.min(count, this.HARD_LIMIT);
    this.particles = [];
    this.initParticles(this.maxParticles);

    eventBus.on('particleCountChange', (c: unknown) => {
      let newCount = c as number;
      newCount = Math.max(500, Math.min(this.HARD_LIMIT, newCount));
      this.maxParticles = newCount;
      this.skipUpdate = newCount > 3000;
      if (this.particles.length < newCount) {
        this.addParticles(newCount - this.particles.length);
      } else if (this.particles.length > newCount) {
        this.truncateParticles(this.particles.length - newCount);
      }
    });

    eventBus.on('clearFluid', () => {
      this.particles.forEach(p => {
        p.life = p.maxLife;
        p.alpha = 0;
      });
    });
  }

  private initParticles(count: number): void {
    this.particles = [];
    const actual = Math.min(count, this.HARD_LIMIT);
    for (let i = 0; i < actual; i++) {
      this.particles.push(this.createParticle());
    }
    this.recyclePtr = 0;
  }

  private addParticles(count: number): void {
    for (let i = 0; i < count; i++) {
      if (this.particles.length >= this.HARD_LIMIT) {
        break;
      }
      this.particles.push(this.createParticle());
    }
  }

  private truncateParticles(n: number): void {
    if (n <= 0) return;
    const removeFromEnd = Math.min(n, this.particles.length - this.recyclePtr);
    const remaining = n - removeFromEnd;
    if (removeFromEnd > 0) {
      this.particles.splice(this.recyclePtr, removeFromEnd);
    }
    if (remaining > 0 && this.particles.length > 0) {
      this.particles.splice(0, remaining);
      this.recyclePtr = 0;
    }
    if (this.recyclePtr >= this.particles.length) {
      this.recyclePtr = 0;
    }
  }

  private advanceRecyclePtr(n: number = 1): void {
    if (this.particles.length === 0) return;
    this.recyclePtr = (this.recyclePtr + n) % this.particles.length;
  }

  private createParticle(nx?: number, ny?: number): Particle {
    const px = nx ?? Math.random();
    const py = ny ?? Math.random();
    const life = Math.floor(Math.random() * 60);
    return {
      x: 0,
      y: 0,
      nx: px,
      ny: py,
      life,
      maxLife: 60,
      size: 2 + Math.random() * 3,
      alpha: 255,
    };
  }

  resetParticleAt(nx: number, ny: number): void {
    if (this.particles.length === 0) return;
    const idx = this.recyclePtr;
    this.particles[idx] = this.createParticle(nx, ny);
    this.advanceRecyclePtr(1);
  }

  update(canvasW: number, canvasH: number): void {
    this.frameCount++;
    const shouldUpdate = !this.skipUpdate || this.frameCount % 2 === 0;

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      p.life++;

      if (p.life >= p.maxLife) {
        this.particles[i] = this.createParticle();
        continue;
      }

      const lifeRatio = p.life / p.maxLife;
      if (lifeRatio > 0.8) {
        p.alpha = 255 * (1 - (lifeRatio - 0.8) / 0.2);
      } else if (lifeRatio < 0.1) {
        p.alpha = 255 * (lifeRatio / 0.1);
      } else {
        p.alpha = 255;
      }

      if (shouldUpdate) {
        const nxClamped = Math.max(0, Math.min(1, p.nx));
        const nyClamped = Math.max(0, Math.min(1, p.ny));
        const vel = this.solver.getVelocityInterpolated(nxClamped, nyClamped);
        p.nx += vel.vx * this.solver.dt / this.solver.N;
        p.ny += vel.vy * this.solver.dt / this.solver.N;

        if (p.nx < 0 || p.nx > 1 || p.ny < 0 || p.ny > 1) {
          this.particles[i] = this.createParticle();
          continue;
        }
      }

      p.x = p.nx * canvasW;
      p.y = p.ny * canvasH;
    }

    if (this.particles.length > this.HARD_LIMIT) {
      const excess = this.particles.length - this.HARD_LIMIT;
      this.truncateParticles(excess);
    } else if (this.particles.length > this.maxParticles) {
      const excess = this.particles.length - this.maxParticles;
      this.truncateParticles(excess);
    }
  }

  render(p: p5): void {
    p.push();
    p.blendMode(p.ADD);
    p.noStroke();

    const ctx = p.drawingContext as CanvasRenderingContext2D;

    for (let i = 0; i < this.particles.length; i++) {
      const pt = this.particles[i];
      if (pt.alpha <= 0) continue;

      const nxClamped = Math.max(0, Math.min(1, pt.nx));
      const nyClamped = Math.max(0, Math.min(1, pt.ny));
      const dens = this.solver.getDensityInterpolated(nxClamped, nyClamped);

      const hasDens = dens.r > 0.01 || dens.g > 0.01 || dens.b > 0.01;
      let r: number, g: number, b: number;
      if (hasDens) {
        const totalDens = Math.max(0.01, dens.r + dens.g + dens.b);
        r = Math.min(255, (dens.r / totalDens) * 255 + dens.r * 120);
        g = Math.min(255, (dens.g / totalDens) * 255 + dens.g * 120);
        b = Math.min(255, (dens.b / totalDens) * 255 + dens.b * 120);
      } else {
        r = 80;
        g = 100;
        b = 160;
      }

      const baseAlpha = (pt.alpha / 255) * 0.55;
      const glowSize = pt.size * 5;

      const radGrad = ctx.createRadialGradient(pt.x, pt.y, 0, pt.x, pt.y, glowSize);
      radGrad.addColorStop(0, `rgba(255,255,255,${baseAlpha * 0.7})`);
      radGrad.addColorStop(0.25, `rgba(${Math.floor(r)},${Math.floor(g)},${Math.floor(b)},${baseAlpha})`);
      radGrad.addColorStop(0.6, `rgba(${Math.floor(r)},${Math.floor(g)},${Math.floor(b)},${baseAlpha * 0.35})`);
      radGrad.addColorStop(1, `rgba(${Math.floor(r)},${Math.floor(g)},${Math.floor(b)},0)`);

      ctx.fillStyle = radGrad;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, glowSize, 0, Math.PI * 2);
      ctx.fill();
    }
    p.pop();
  }
}
