import { Particle, ParticlePool } from './particle';

export interface EngineConfig {
  particleCount: number;
  particleSizeMin: number;
  particleSizeMax: number;
  initialSpeed: number;
  boundaryElasticity: number;
  forceStrength: number;
  attractAccel: number;
  repelAccel: number;
}

export interface ForceField {
  x: number;
  y: number;
  active: boolean;
  mode: 'attract' | 'repel';
  strength: number;
}

export interface EngineState {
  particles: Particle[];
  particleCount: number;
  forceField: ForceField;
  width: number;
  height: number;
  fps: number;
  performanceWarning: boolean;
}

export class ParticleEngine {
  private pool: ParticlePool;
  private config: EngineConfig;
  private forceField: ForceField;
  private width: number = 0;
  private height: number = 0;
  private cellSize: number = 20;
  private grid: Map<string, Particle[]> = new Map();
  public performanceWarning: boolean = false;

  constructor(config: Partial<EngineConfig> = {}) {
    this.config = {
      particleCount: 2000,
      particleSizeMin: 2,
      particleSizeMax: 4,
      initialSpeed: 0.5,
      boundaryElasticity: 0.8,
      forceStrength: 1.0,
      attractAccel: 0.3,
      repelAccel: 0.5,
      ...config
    };

    this.pool = new ParticlePool(5000);
    this.forceField = {
      x: 0,
      y: 0,
      active: false,
      mode: 'attract',
      strength: this.config.forceStrength
    };
  }

  public init(width: number, height: number): void {
    this.width = width;
    this.height = height;
    this.addParticles(this.config.particleCount);
  }

  public addParticles(count: number): void {
    const currentCount = this.pool.getActiveCount();
    const toAdd = Math.min(count, 5000 - currentCount);

    for (let i = 0; i < toAdd; i++) {
      const p = this.pool.acquire();
      if (p) {
        const x = Math.random() * this.width;
        const y = Math.random() * this.height;
        const angle = Math.random() * Math.PI * 2;
        const speed = this.config.initialSpeed;
        const vx = Math.cos(angle) * speed;
        const vy = Math.sin(angle) * speed;
        const size = this.config.particleSizeMin + Math.random() * (this.config.particleSizeMax - this.config.particleSizeMin);
        p.init(x, y, vx, vy, size);
      }
    }
    this.pool.rebuildActiveList();
  }

  public removeParticles(count: number): number {
    return this.pool.release(count);
  }

  public setParticleCount(target: number): void {
    const current = this.pool.getActiveCount();
    if (target > current) {
      this.addParticles(target - current);
    } else if (target < current) {
      this.removeParticles(current - target);
    }
  }

  public step(dt: number): EngineState {
    const particles = this.pool.getAll();

    if (this.forceField.active) {
      this.applyForceField(particles);
    }

    for (const p of particles) {
      p.update(dt, this.width, this.height, this.config.boundaryElasticity);
    }

    this.buildGrid(particles);
    this.detectCollisions();

    return {
      particles,
      particleCount: particles.length,
      forceField: { ...this.forceField },
      width: this.width,
      height: this.height,
      fps: 60,
      performanceWarning: this.performanceWarning
    };
  }

  private buildGrid(particles: Particle[]): void {
    this.grid.clear();
    this.cellSize = this.config.particleSizeMax * 2 + 2;

    for (const p of particles) {
      const cellX = Math.floor(p.x / this.cellSize);
      const cellY = Math.floor(p.y / this.cellSize);
      const key = `${cellX},${cellY}`;
      let cell = this.grid.get(key);
      if (!cell) {
        cell = [];
        this.grid.set(key, cell);
      }
      cell.push(p);
    }
  }

  private detectCollisions(): void {
    const processed = new Set<string>();

    for (const [key, cell] of this.grid) {
      const [cx, cy] = key.split(',').map(Number);

      for (let dx = 0; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          if (dx === 0 && dy < 0) continue;

          const neighborKey = `${cx + dx},${cy + dy}`;
          const neighbor = this.grid.get(neighborKey);
          if (!neighbor) continue;

          if (dx === 0 && dy === 0) {
            for (let i = 0; i < cell.length; i++) {
              for (let j = i + 1; j < cell.length; j++) {
                cell[i].collideWith(cell[j]);
              }
            }
          } else {
            for (const a of cell) {
              for (const b of neighbor) {
                const pairKey = a < b ? `${a.x},${a.y}-${b.x},${b.y}` : `${b.x},${b.y}-${a.x},${a.y}`;
                if (!processed.has(pairKey)) {
                  processed.add(pairKey);
                  a.collideWith(b);
                }
              }
            }
          }
        }
      }
    }
  }

  private applyForceField(particles: Particle[]): void {
    const ff = this.forceField;
    const accel = ff.mode === 'attract' ? this.config.attractAccel : this.config.repelAccel;
    const sign = ff.mode === 'attract' ? 1 : -1;

    for (const p of particles) {
      const dx = ff.x - p.x;
      const dy = ff.y - p.y;
      const distSq = dx * dx + dy * dy;

      if (distSq < 1) continue;

      const dist = Math.sqrt(distSq);
      const nx = dx / dist;
      const ny = dy / dist;

      const forceFactor = sign * accel * ff.strength;
      const distanceFactor = Math.min(400 / Math.max(dist, 20), 1);

      p.vx += nx * forceFactor * distanceFactor;
      p.vy += ny * forceFactor * distanceFactor;

      const maxSpeed = 8;
      const currentSpeed = p.speed;
      if (currentSpeed > maxSpeed) {
        const scale = maxSpeed / currentSpeed;
        p.vx *= scale;
        p.vy *= scale;
      }
    }
  }

  public applyForce(x: number, y: number, active: boolean, mode: 'attract' | 'repel' = 'attract'): void {
    this.forceField.x = x;
    this.forceField.y = y;
    this.forceField.active = active;
    this.forceField.mode = mode;
  }

  public resetParticles(): void {
    this.pool.reset();
    this.addParticles(this.config.particleCount);
  }

  public setConfig(key: keyof EngineConfig, value: number): void {
    if (key in this.config) {
      (this.config as any)[key] = value;
      if (key === 'forceStrength') {
        this.forceField.strength = value;
      }
      if (key === 'particleCount') {
        this.config.particleCount = value;
      }
    }
  }

  public getConfig(): EngineConfig {
    return { ...this.config };
  }

  public setSize(width: number, height: number): void {
    this.width = width;
    this.height = height;
  }

  public getActiveParticleCount(): number {
    return this.pool.getActiveCount();
  }

  public updateParticleSize(size: number): void {
    const particles = this.pool.getAll();
    for (const p of particles) {
      p.size = size;
    }
    this.config.particleSizeMin = size;
    this.config.particleSizeMax = size;
  }
}
