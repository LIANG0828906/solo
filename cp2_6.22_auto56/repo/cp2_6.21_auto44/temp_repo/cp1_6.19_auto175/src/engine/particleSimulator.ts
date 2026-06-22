
import type { Particle, CurrentParams } from '../types';
import type { IParticleSimulator } from '../api';
import { BOUNDARY_SIZE, MAX_PARTICLES, INITIAL_PARTICLES } from '../api';
import { currentField } from './currentField';

export class ParticleSimulator implements IParticleSimulator {
  particles: Particle[] = [];
  private nextId = 0;
  private brownianStrength = 0.15;

  reset(params: CurrentParams): void {
    this.particles = [];
    this.nextId = 0;
    
    for (let i = 0; i < INITIAL_PARTICLES; i++) {
      this.particles.push(this.createParticle());
    }
  }

  private createParticle(): Particle {
    const angle = Math.random() * Math.PI * 2;
    const radius = Math.random() * 2;
    return {
      id: this.nextId++,
      x: Math.cos(angle) * radius + (Math.random() - 0.5) * 2,
      y: Math.sin(angle) * radius + (Math.random() - 0.5) * 2,
      z: (Math.random() - 0.5) * 4,
      vx: 0,
      vy: 0,
      vz: 0
    };
  }

  update(dt: number, t: number, params: CurrentParams): Particle[] {
    const halfBoundary = BOUNDARY_SIZE / 2;
    
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      
      const vel = currentField.getVelocity(p.x, p.y, p.z, t, params);
      
      const brownianX = (Math.random() - 0.5) * this.brownianStrength;
      const brownianY = (Math.random() - 0.5) * this.brownianStrength;
      const brownianZ = (Math.random() - 0.5) * this.brownianStrength * 0.5;
      
      p.vx = vel.x + brownianX;
      p.vy = vel.y + brownianY;
      p.vz = vel.z + brownianZ;
      
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.z += p.vz * dt;
      
      if (
        Math.abs(p.x) > halfBoundary ||
        Math.abs(p.y) > halfBoundary ||
        Math.abs(p.z) > halfBoundary * 0.5
      ) {
        const newP = this.createParticle();
        p.x = newP.x;
        p.y = newP.y;
        p.z = newP.z;
        p.vx = 0;
        p.vy = 0;
        p.vz = 0;
      }
    }
    
    const releaseCount = Math.floor(params.releaseRate);
    const remainder = params.releaseRate - releaseCount;
    const extraRelease = Math.random() < remainder ? 1 : 0;
    const totalRelease = releaseCount + extraRelease;
    
    for (let i = 0; i < totalRelease && this.particles.length < MAX_PARTICLES; i++) {
      this.particles.push(this.createParticle());
    }
    
    return this.particles;
  }

  getParticles(): Particle[] {
    return this.particles;
  }
}

export const particleSimulator = new ParticleSimulator();
