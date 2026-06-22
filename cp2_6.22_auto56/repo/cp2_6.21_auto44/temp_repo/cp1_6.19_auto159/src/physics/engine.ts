import { Particle } from './particle';
import { ElectromagneticField } from './field';
import { eventBus } from '../eventBus';

export interface PhysicsStats {
  count: number;
  avgKineticEnergy: number;
  electricStrength: number;
  magneticStrength: number;
  electricDirection: { x: number; y: number; z: number };
}

export class PhysicsEngine {
  particles: Particle[];
  field: ElectromagneticField;
  boundaryHalf: number = 15;
  private targetCount: number = 75;

  constructor() {
    this.particles = [];
    this.field = new ElectromagneticField();
    this.initParticles(this.targetCount);
    this.listenEvents();
  }

  private listenEvents(): void {
    eventBus.on('fieldParamsChanged', (data) => {
      this.field.electricStrength = data.electricStrength;
      this.field.magneticStrength = data.magneticStrength;
      this.field.electricDirection = { ...data.electricDirection };
    });

    eventBus.on('particleCountChanged', (count) => {
      this.targetCount = count;
      this.adjustParticleCount();
    });
  }

  private initParticles(count: number): void {
    const spawnHalf = 10;
    for (let i = 0; i < count; i++) {
      this.particles.push(this.createRandomParticle(spawnHalf));
    }
  }

  private createRandomParticle(spawnHalf: number): Particle {
    const x = (Math.random() - 0.5) * 2 * spawnHalf;
    const y = (Math.random() - 0.5) * 2 * spawnHalf;
    const z = (Math.random() - 0.5) * 2 * spawnHalf;

    const speed = 1 + Math.random() * 3;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const vx = speed * Math.sin(phi) * Math.cos(theta);
    const vy = speed * Math.sin(phi) * Math.sin(theta);
    const vz = speed * Math.cos(phi);

    const charge = Math.random() > 0.5 ? 1 : -1;
    const mass = 0.8 + Math.random() * 0.4;
    const radius = 0.3 + Math.random() * 0.2;

    return new Particle(x, y, z, vx, vy, vz, charge, mass, radius);
  }

  private adjustParticleCount(): void {
    while (this.particles.length < this.targetCount) {
      this.particles.push(this.createRandomParticle(10));
    }
    while (this.particles.length > this.targetCount && this.particles.length > 0) {
      this.particles.pop();
    }
  }

  addParticle(): void {
    this.targetCount++;
    this.particles.push(this.createRandomParticle(10));
  }

  removeParticle(): void {
    if (this.particles.length > 1) {
      this.targetCount--;
      this.particles.pop();
    }
  }

  update(dt: number): void {
    dt = Math.min(dt, 0.033);

    const subSteps = 4;
    const subDt = dt / subSteps;

    for (let s = 0; s < subSteps; s++) {
      for (const p of this.particles) {
        p.update(this.field, subDt, this.boundaryHalf);
      }
    }
  }

  getStats(): PhysicsStats {
    let totalKE = 0;
    for (const p of this.particles) {
      totalKE += p.kineticEnergy;
    }
    const avgKE = this.particles.length > 0 ? totalKE / this.particles.length : 0;

    return {
      count: this.particles.length,
      avgKineticEnergy: avgKE,
      electricStrength: this.field.electricStrength,
      magneticStrength: this.field.magneticStrength,
      electricDirection: { ...this.field.electricDirection },
    };
  }
}
