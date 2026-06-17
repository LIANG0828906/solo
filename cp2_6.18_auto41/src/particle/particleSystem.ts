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
  solver: FluidSolver;
  frameCount: number = 0;
  skipUpdate: boolean = false;

  constructor(solver: FluidSolver, count: number = 2000) {
    this.solver = solver;
    this.maxParticles = count;
    this.particles = [];
    this.initParticles(count);

    eventBus.on('particleCountChange', (c: unknown) => {
      const newCount = c as number;
      this.maxParticles = newCount;
      this.skipUpdate = newCount > 3000;
      if (this.particles.length < newCount) {
        this.addParticles(newCount - this.particles.length);
      } else if (this.particles.length > newCount) {
        this.particles.length = newCount;
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
    for (let i = 0; i < count; i++) {
      this.particles.push(this.createParticle());
    }
  }

  private addParticles(count: number): void {
    for (let i = 0; i < count; i++) {
      this.particles.push(this.createParticle());
    }
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
    const oldestIdx = this.findOldestParticle();
    if (oldestIdx >= 0) {
      this.particles[oldestIdx] = this.createParticle(nx, ny);
    }
  }

  private findOldestParticle(): number {
    let maxLife = -1;
    let idx = -1;
    for (let i = 0; i < this.particles.length; i++) {
      const ratio = this.particles[i].life / this.particles[i].maxLife;
      if (ratio > maxLife) {
        maxLife = ratio;
        idx = i;
      }
    }
    return idx;
  }

  update(canvasW: number, canvasH: number): void {
    this.frameCount++;
    const shouldUpdate = !this.skipUpdate || this.frameCount % 2 === 0;

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      p.life++;

      if (p.life >= p.maxLife) {
        const newP = this.createParticle();
        this.particles[i] = newP;
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
  }

  render(p: p5): void {
    p.push();
    p.blendMode(p.BLEND);
    p.noStroke();

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
        r = Math.min(255, (dens.r / totalDens) * 255 + dens.r * 80);
        g = Math.min(255, (dens.g / totalDens) * 255 + dens.g * 80);
        b = Math.min(255, (dens.b / totalDens) * 255 + dens.b * 80);
      } else {
        r = 60;
        g = 70;
        b = 120;
      }

      const a = (pt.alpha / 255) * 0.6;

      const glowSize = pt.size * 3;
      const gradient = p.drawingContext as CanvasRenderingContext2D;
      const radGrad = gradient.createRadialGradient(pt.x, pt.y, 0, pt.x, pt.y, glowSize);
      radGrad.addColorStop(0, `rgba(${Math.floor(r)},${Math.floor(g)},${Math.floor(b)},${a})`);
      radGrad.addColorStop(0.4, `rgba(${Math.floor(r)},${Math.floor(g)},${Math.floor(b)},${a * 0.4})`);
      radGrad.addColorStop(1, `rgba(${Math.floor(r)},${Math.floor(g)},${Math.floor(b)},0)`);

      gradient.fillStyle = radGrad;
      gradient.beginPath();
      gradient.arc(pt.x, pt.y, glowSize, 0, Math.PI * 2);
      gradient.fill();

      p.fill(r, g, b, pt.alpha * 0.8);
      p.ellipse(pt.x, pt.y, pt.size, pt.size);
    }
    p.pop();
  }
}
