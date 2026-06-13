import { Vector3, Color } from 'three';
import { CONFIG } from './config';

export interface ParticleData {
  position: Vector3;
  velocity: Vector3;
  color: Color;
  size: number;
  age: number;
  maxAge: number;
  trailPositions: Vector3[];
  active: boolean;
  rotation: number;
  rotationSpeed: number;
}

export class ParticlePool {
  private pool: ParticleData[] = [];
  private activeCount: number = 0;
  private maxPoolSize: number;
  
  constructor(maxSize: number = CONFIG.PARTICLE_COUNT_PER_FIREWORK * CONFIG.MAX_CONCURRENT_FIREWORKS * 2) {
    this.maxPoolSize = maxSize;
    this.preallocate(maxSize);
  }
  
  private preallocate(count: number): void {
    for (let i = 0; i < count; i++) {
      this.pool.push(this.createParticle());
    }
  }
  
  private createParticle(): ParticleData {
    return {
      position: new Vector3(),
      velocity: new Vector3(),
      color: new Color(),
      size: 0.1,
      age: 0,
      maxAge: CONFIG.FIREWORK_DURATION,
      trailPositions: Array.from({ length: CONFIG.TRAIL_LENGTH }, () => new Vector3()),
      active: false,
      rotation: 0,
      rotationSpeed: 0
    };
  }
  
  acquire(): ParticleData | null {
    for (let i = 0; i < this.pool.length; i++) {
      if (!this.pool[i].active) {
        const particle = this.pool[i];
        particle.active = true;
        particle.age = 0;
        this.activeCount++;
        return particle;
      }
    }
    
    if (this.pool.length < this.maxPoolSize) {
      const particle = this.createParticle();
      particle.active = true;
      this.pool.push(particle);
      this.activeCount++;
      return particle;
    }
    
    console.warn('Particle pool exhausted, consider increasing maxPoolSize');
    return null;
  }
  
  release(particle: ParticleData): void {
    if (particle.active) {
      particle.active = false;
      particle.age = 0;
      this.activeCount = Math.max(0, this.activeCount - 1);
    }
  }
  
  releaseAll(): void {
    for (const particle of this.pool) {
      particle.active = false;
      particle.age = 0;
    }
    this.activeCount = 0;
  }
  
  getActiveParticles(): ParticleData[] {
    return this.pool.filter(p => p.active);
  }
  
  getActiveCount(): number {
    return this.activeCount;
  }
  
  getPoolSize(): number {
    return this.pool.length;
  }
  
  cleanup(): void {
    const activeParticles = this.getActiveParticles();
    for (const particle of activeParticles) {
      if (particle.age >= particle.maxAge) {
        this.release(particle);
      }
    }
  }
  
  forceCleanup(): void {
    for (const particle of this.pool) {
      if (particle.active && particle.age >= particle.maxAge) {
        this.release(particle);
      }
    }
  }
}

export const globalParticlePool = new ParticlePool();