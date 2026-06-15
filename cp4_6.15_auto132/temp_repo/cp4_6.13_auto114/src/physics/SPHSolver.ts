import { Particle, Vec2 } from './Particle';

export interface SPHParams {
  gravity: number;
  viscosity: number;
  particleRadius: number;
}

export class SPHSolver {
  public params: SPHParams;
  private particles: Particle[] = [];
  private kernelRadius: number = 30;
  private restDensity: number = 1000;
  private stiffness: number = 2000;
  private surfaceTension: number = 0.05;
  private grid: Map<number, number[]> = new Map();
  private cellSize: number;

  private static readonly POLY6 = 315 / (64 * Math.PI * Math.pow(30, 9));
  private static readonly SPIKY_GRAD = -45 / (Math.PI * Math.pow(30, 6));
  private static readonly VISC_LAP = 45 / (Math.PI * Math.pow(30, 6));

  constructor(params: SPHParams) {
    this.params = { ...params };
    this.cellSize = this.kernelRadius;
  }

  public setParticles(particles: Particle[]): void {
    this.particles = particles;
  }

  public getParticles(): Particle[] {
    return this.particles;
  }

  public step(dt: number, bounds: { width: number; height: number }): void {
    const h = this.kernelRadius;
    const poly6 = 315 / (64 * Math.PI * Math.pow(h, 9));
    const spikyGrad = -45 / (Math.PI * Math.pow(h, 6));
    const viscLap = 45 / (Math.PI * Math.pow(h, 6));
    const h2 = h * h;

    this.buildGrid(bounds);
    this.computeDensityPressure(poly6, h2);
    this.computeForces(spikyGrad, viscLap, h);

    const gravityY = this.params.gravity * 10;
    const buoyancy = this.params.gravity * 2;

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      if (p.type === 'smoke') {
        p.applyForce(0, -buoyancy);
      } else {
        p.applyForce(0, gravityY * p.mass);
      }
      p.integrate(dt, bounds);
    }
  }

  private buildGrid(bounds: { width: number; height: number }): void {
    this.grid.clear();
    const cs = this.cellSize;
    const cols = Math.max(1, Math.ceil(bounds.width / cs));

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      const cx = Math.floor(p.pos.x / cs);
      const cy = Math.floor(p.pos.y / cs);
      const key = cy * cols + cx;
      if (!this.grid.has(key)) this.grid.set(key, []);
      this.grid.get(key)!.push(i);
    }
  }

  private getNeighbors(i: number, bounds: { width: number; height: number }): number[] {
    const p = this.particles[i];
    const cs = this.cellSize;
    const cols = Math.max(1, Math.ceil(bounds.width / cs));
    const cx = Math.floor(p.pos.x / cs);
    const cy = Math.floor(p.pos.y / cs);
    const result: number[] = [];

    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const key = (cy + dy) * cols + (cx + dx);
        const cell = this.grid.get(key);
        if (cell) {
          for (let k = 0; k < cell.length; k++) {
            if (cell[k] !== i) result.push(cell[k]);
          }
        }
      }
    }
    return result;
  }

  private computeDensityPressure(poly6: number, h2: number): void {
    const bounds = { width: 1e9, height: 1e9 };

    for (let i = 0; i < this.particles.length; i++) {
      const pi = this.particles[i];
      const neighbors = this.getNeighbors(i, { width: window.innerWidth, height: window.innerHeight });
      let density = 0;

      for (let k = 0; k < neighbors.length; k++) {
        const j = neighbors[k];
        const pj = this.particles[j];
        const dx = pj.pos.x - pi.pos.x;
        const dy = pj.pos.y - pi.pos.y;
        const r2 = dx * dx + dy * dy;
        if (r2 < h2) {
          const diff = h2 - r2;
          density += pj.mass * poly6 * diff * diff * diff;
        }
      }

      const selfDiff = h2;
      density += pi.mass * poly6 * selfDiff * selfDiff * selfDiff;

      pi.density = Math.max(density, this.restDensity * 0.1);
      pi.pressure = this.stiffness * (pi.density - this.restDensity);
    }
  }

  private computeForces(spikyGrad: number, viscLap: number, h: number): void {
    const bounds = { width: window.innerWidth, height: window.innerHeight };
    const viscosity = this.params.viscosity * 0.01;
    const tension = this.surfaceTension;

    for (let i = 0; i < this.particles.length; i++) {
      const pi = this.particles[i];
      const neighbors = this.getNeighbors(i, bounds);

      let pressureFX = 0;
      let pressureFY = 0;
      let viscosityFX = 0;
      let viscosityFY = 0;
      let colorLapX = 0;
      let colorLapY = 0;
      let normalX = 0;
      let normalY = 0;

      for (let k = 0; k < neighbors.length; k++) {
        const j = neighbors[k];
        const pj = this.particles[j];
        const dx = pj.pos.x - pi.pos.x;
        const dy = pj.pos.y - pi.pos.y;
        const r2 = dx * dx + dy * dy;
        const r = Math.sqrt(r2);

        if (r < h && r > 0.0001) {
          const diff = h - r;
          const diff2 = diff * diff;
          const invR = 1 / r;

          const pressureTerm = -pj.mass * (pi.pressure + pj.pressure) / (2 * pj.density) * spikyGrad * diff2;
          pressureFX += pressureTerm * dx * invR;
          pressureFY += pressureTerm * dy * invR;

          const viscTerm = viscosity * pj.mass / pj.density * viscLap * diff;
          viscosityFX += viscTerm * (pj.vel.x - pi.vel.x);
          viscosityFY += viscTerm * (pj.vel.y - pi.vel.y);

          const colorGrad = -pj.mass / pj.density * spikyGrad * diff2;
          normalX += colorGrad * dx * invR;
          normalY += colorGrad * dy * invR;
          colorLapX += pj.mass / pj.density * viscLap * diff * dx * invR;
          colorLapY += pj.mass / pj.density * viscLap * diff * dy * invR;
        }
      }

      let fTotalX = pressureFX + viscosityFX;
      let fTotalY = pressureFY + viscosityFY;

      const normalLen = Math.sqrt(normalX * normalX + normalY * normalY);
      if (normalLen > 1.0) {
        const colorLapLen = Math.sqrt(colorLapX * colorLapX + colorLapY * colorLapY);
        if (colorLapLen > 0) {
          fTotalX -= tension * colorLapX * normalX / normalLen;
          fTotalY -= tension * colorLapY * normalY / normalLen;
        }
      }

      pi.applyForce(fTotalX, fTotalY);
    }
  }
}
