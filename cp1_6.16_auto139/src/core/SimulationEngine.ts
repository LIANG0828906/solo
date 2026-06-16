import { v4 as uuidv4 } from 'uuid';
import {
  Particle,
  ParticleType,
  SimulationConfig,
  SimulationStats,
  SIMULATION_CONFIG
} from './ParticleTypes';

type SpatialGrid = Map<string, number[]>;

export class SimulationEngine {
  private particles: Particle[] = [];
  private config: SimulationConfig;
  private totalBindings: number = 0;
  private canvasWidth: number = 0;
  private canvasHeight: number = 0;
  private useSpatialHash: boolean = false;

  constructor() {
    this.config = {
      gravityStrength: SIMULATION_CONFIG.GRAVITY_STRENGTH_DEFAULT,
      repulsionStrength: SIMULATION_CONFIG.REPULSION_STRENGTH_DEFAULT,
      lifeDecayRate: SIMULATION_CONFIG.LIFE_DECAY_DEFAULT
    };
  }

  public setCanvasSize(width: number, height: number): void {
    this.canvasWidth = width;
    this.canvasHeight = height;
  }

  public getParticles(): Particle[] {
    return this.particles;
  }

  public getStats(fps: number): SimulationStats {
    return {
      particleCount: this.particles.length,
      fps,
      totalBindings: this.totalBindings
    };
  }

  public getConfig(): SimulationConfig {
    return { ...this.config };
  }

  public setGravityStrength(value: number): void {
    this.config.gravityStrength = value;
  }

  public setRepulsionStrength(value: number): void {
    this.config.repulsionStrength = value;
  }

  public setLifeDecayRate(value: number): void {
    this.config.lifeDecayRate = value;
  }

  public spawnParticles(x: number, y: number, count: number, type?: ParticleType): void {
    for (let i = 0; i < count; i++) {
      const particleType = type || this.getRandomParticleType();
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * SIMULATION_CONFIG.INITIAL_VELOCITY_RANGE;
      const offset = Math.random() * 20 - 10;

      this.particles.push({
        id: uuidv4(),
        x: x + offset,
        y: y + offset,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        type: particleType,
        life: SIMULATION_CONFIG.MAX_PARTICLE_LIFE,
        size: SIMULATION_CONFIG.MIN_PARTICLE_SIZE +
          Math.random() * (SIMULATION_CONFIG.MAX_PARTICLE_SIZE - SIMULATION_CONFIG.MIN_PARTICLE_SIZE),
        bindCount: SIMULATION_CONFIG.MAX_BIND_COUNT
      });
    }
  }

  public initializeRandomParticles(): void {
    this.particles = [];
    for (let i = 0; i < SIMULATION_CONFIG.INITIAL_PARTICLE_COUNT; i++) {
      const x = Math.random() * this.canvasWidth;
      const y = Math.random() * this.canvasHeight;
      const type = this.getRandomParticleType();
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * SIMULATION_CONFIG.INITIAL_VELOCITY_RANGE;

      this.particles.push({
        id: uuidv4(),
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        type,
        life: SIMULATION_CONFIG.MAX_PARTICLE_LIFE * (0.5 + Math.random() * 0.5),
        size: SIMULATION_CONFIG.MIN_PARTICLE_SIZE +
          Math.random() * (SIMULATION_CONFIG.MAX_PARTICLE_SIZE - SIMULATION_CONFIG.MIN_PARTICLE_SIZE),
        bindCount: SIMULATION_CONFIG.MAX_BIND_COUNT
      });
    }
    this.totalBindings = 0;
  }

  private getRandomParticleType(): ParticleType {
    const types = [ParticleType.A, ParticleType.B, ParticleType.C];
    return types[Math.floor(Math.random() * types.length)];
  }

  public update(): void {
    if (this.particles.length === 0) return;

    this.useSpatialHash = this.particles.length >= SIMULATION_CONFIG.SPATIAL_HASH_THRESHOLD;

    const accelerations: { ax: number; ay: number }[] = this.particles.map(() => ({ ax: 0, ay: 0 }));

    if (this.useSpatialHash) {
      this.computeForcesSpatial(accelerations);
    } else {
      this.computeForcesBruteForce(accelerations);
    }

    const deadIndices: number[] = [];
    const bindings: [number, number][] = [];

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      const acc = accelerations[i];

      if (p.life <= 0) {
        deadIndices.push(i);
        continue;
      }

      p.vx += acc.ax;
      p.vy += acc.ay;

      p.vx *= SIMULATION_CONFIG.FRICTION;
      p.vy *= SIMULATION_CONFIG.FRICTION;

      const maxSpeed = 10;
      const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
      if (speed > maxSpeed) {
        p.vx = (p.vx / speed) * maxSpeed;
        p.vy = (p.vy / speed) * maxSpeed;
      }

      p.x += p.vx;
      p.y += p.vy;

      this.handleBoundaryCollision(p);

      p.life -= this.config.lifeDecayRate;
      if (p.life < 0) p.life = 0;
    }

    this.detectBindings(bindings);
    this.processBindings(bindings);

    if (deadIndices.length > 0) {
      this.removeDeadParticles(deadIndices);
    }
  }

  private computeForcesBruteForce(accelerations: { ax: number; ay: number }[]): void {
    const neighborDist = SIMULATION_CONFIG.NEIGHBOR_DISTANCE;
    const neighborDistSq = neighborDist * neighborDist;

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];

      for (let j = i + 1; j < this.particles.length; j++) {
        const other = this.particles[j];

        const dx = other.x - p.x;
        const dy = other.y - p.y;
        const distSq = dx * dx + dy * dy;

        if (distSq > neighborDistSq || distSq === 0) continue;

        const dist = Math.sqrt(distSq);
        const nx = dx / dist;
        const ny = dy / dist;

        let force = 0;

        if (other.type === ParticleType.A) {
          force += (dist / neighborDist) * SIMULATION_CONFIG.MAX_ACCELERATION * this.config.gravityStrength;
        }

        if (p.type === ParticleType.A) {
          force += (dist / neighborDist) * SIMULATION_CONFIG.MAX_ACCELERATION * this.config.gravityStrength;
        }

        if (other.type === ParticleType.B) {
          force -= (1 - dist / neighborDist) * SIMULATION_CONFIG.MAX_ACCELERATION * this.config.repulsionStrength;
        }

        if (p.type === ParticleType.B) {
          force -= (1 - dist / neighborDist) * SIMULATION_CONFIG.MAX_ACCELERATION * this.config.repulsionStrength;
        }

        accelerations[i].ax += nx * force;
        accelerations[i].ay += ny * force;
        accelerations[j].ax -= nx * force;
        accelerations[j].ay -= ny * force;
      }
    }
  }

  private computeForcesSpatial(accelerations: { ax: number; ay: number }[]): void {
    const cellSize = SIMULATION_CONFIG.GRID_CELL_SIZE;
    const grid: SpatialGrid = new Map();

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      const cellX = Math.floor(p.x / cellSize);
      const cellY = Math.floor(p.y / cellSize);
      const key = `${cellX},${cellY}`;

      if (!grid.has(key)) {
        grid.set(key, []);
      }
      grid.get(key)!.push(i);
    }

    const neighborDist = SIMULATION_CONFIG.NEIGHBOR_DISTANCE;
    const neighborDistSq = neighborDist * neighborDist;
    const processed = new Set<string>();

    grid.forEach((cellIndices, key) => {
      const [cellX, cellY] = key.split(',').map(Number);

      for (let dx = 0; dx <= 1; dx++) {
        for (let dy = 0; dy <= 1; dy++) {
          if (dx === 0 && dy === 0) {
            for (let i = 0; i < cellIndices.length; i++) {
              for (let j = i + 1; j < cellIndices.length; j++) {
                const idx1 = cellIndices[i];
                const idx2 = cellIndices[j];
                this.applyForcePair(idx1, idx2, accelerations, neighborDistSq);
              }
            }
          } else {
            const neighborKey = `${cellX + dx},${cellY + dy}`;
            const neighborIndices = grid.get(neighborKey);
            if (!neighborIndices) continue;

            const pairKey = [key, neighborKey].sort().join('|');
            if (processed.has(pairKey)) continue;
            processed.add(pairKey);

            for (const idx1 of cellIndices) {
              for (const idx2 of neighborIndices) {
                this.applyForcePair(idx1, idx2, accelerations, neighborDistSq);
              }
            }
          }
        }
      }
    });
  }

  private applyForcePair(
    idx1: number,
    idx2: number,
    accelerations: { ax: number; ay: number }[],
    neighborDistSq: number
  ): void {
    const p1 = this.particles[idx1];
    const p2 = this.particles[idx2];

    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const distSq = dx * dx + dy * dy;

    if (distSq > neighborDistSq || distSq === 0) return;

    const dist = Math.sqrt(distSq);
    const nx = dx / dist;
    const ny = dy / dist;
    const neighborDist = SIMULATION_CONFIG.NEIGHBOR_DISTANCE;

    let force = 0;

    if (p2.type === ParticleType.A) {
      force += (dist / neighborDist) * SIMULATION_CONFIG.MAX_ACCELERATION * this.config.gravityStrength;
    }
    if (p1.type === ParticleType.A) {
      force += (dist / neighborDist) * SIMULATION_CONFIG.MAX_ACCELERATION * this.config.gravityStrength;
    }

    if (p2.type === ParticleType.B) {
      force -= (1 - dist / neighborDist) * SIMULATION_CONFIG.MAX_ACCELERATION * this.config.repulsionStrength;
    }
    if (p1.type === ParticleType.B) {
      force -= (1 - dist / neighborDist) * SIMULATION_CONFIG.MAX_ACCELERATION * this.config.repulsionStrength;
    }

    accelerations[idx1].ax += nx * force;
    accelerations[idx1].ay += ny * force;
    accelerations[idx2].ax -= nx * force;
    accelerations[idx2].ay -= ny * force;
  }

  private detectBindings(bindings: [number, number][]): void {
    const cellSize = SIMULATION_CONFIG.GRID_CELL_SIZE;
    const grid: SpatialGrid = new Map();

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      if (p.type !== ParticleType.C || p.life <= SIMULATION_CONFIG.BIND_LIFE_THRESHOLD || p.bindCount <= 0) {
        continue;
      }
      const cellX = Math.floor(p.x / cellSize);
      const cellY = Math.floor(p.y / cellSize);
      const key = `${cellX},${cellY}`;

      if (!grid.has(key)) {
        grid.set(key, []);
      }
      grid.get(key)!.push(i);
    }

    const processed = new Set<string>();

    grid.forEach((cellIndices, key) => {
      const [cellX, cellY] = key.split(',').map(Number);

      for (let i = 0; i < cellIndices.length; i++) {
        for (let j = i + 1; j < cellIndices.length; j++) {
          this.checkBinding(cellIndices[i], cellIndices[j], bindings);
        }
      }

      for (let dx = 0; dx <= 1; dx++) {
        for (let dy = 0; dy <= 1; dy++) {
          if (dx === 0 && dy === 0) continue;

          const neighborKey = `${cellX + dx},${cellY + dy}`;
          const neighborIndices = grid.get(neighborKey);
          if (!neighborIndices) continue;

          const pairKey = [key, neighborKey].sort().join('|');
          if (processed.has(pairKey)) continue;
          processed.add(pairKey);

          for (const idx1 of cellIndices) {
            for (const idx2 of neighborIndices) {
              this.checkBinding(idx1, idx2, bindings);
            }
          }
        }
      }
    });
  }

  private checkBinding(i: number, j: number, bindings: [number, number][]): void {
    const p1 = this.particles[i];
    const p2 = this.particles[j];

    if (p1.type !== ParticleType.C || p2.type !== ParticleType.C) return;
    if (p1.life <= SIMULATION_CONFIG.BIND_LIFE_THRESHOLD || p2.life <= SIMULATION_CONFIG.BIND_LIFE_THRESHOLD) return;
    if (p1.bindCount <= 0 || p2.bindCount <= 0) return;

    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const minDist = (p1.size + p2.size) / 2;

    if (dist < minDist) {
      bindings.push([Math.min(i, j), Math.max(i, j)]);
    }
  }

  private processBindings(bindings: [number, number][]): void {
    if (bindings.length === 0) return;

    const indicesToRemove = new Set<number>();
    const newParticles: Particle[] = [];

    for (const [i, j] of bindings) {
      if (indicesToRemove.has(i) || indicesToRemove.has(j)) continue;
      if (i >= this.particles.length || j >= this.particles.length) continue;

      const p1 = this.particles[i];
      const p2 = this.particles[j];

      const newParticle: Particle = {
        id: uuidv4(),
        x: (p1.x + p2.x) / 2,
        y: (p1.y + p2.y) / 2,
        vx: (p1.vx + p2.vx) / 2,
        vy: (p1.vy + p2.vy) / 2,
        type: ParticleType.C,
        life: Math.max(p1.life, p2.life),
        size: Math.min(p1.size + p2.size * 0.5, SIMULATION_CONFIG.MAX_PARTICLE_SIZE * 4),
        bindCount: Math.min(p1.bindCount, p2.bindCount) - 1
      };

      newParticles.push(newParticle);
      indicesToRemove.add(i);
      indicesToRemove.add(j);
      this.totalBindings++;
    }

    if (indicesToRemove.size > 0) {
      this.particles = this.particles.filter((_, index) => !indicesToRemove.has(index));
    }

    this.particles.push(...newParticles);
  }

  private removeDeadParticles(deadIndices: number[]): void {
    const deadSet = new Set(deadIndices);
    this.particles = this.particles.filter((_, index) => !deadSet.has(index));
  }

  private handleBoundaryCollision(p: Particle): void {
    if (p.x < 0) {
      p.x = 0;
      p.vx *= -0.5;
    } else if (p.x > this.canvasWidth) {
      p.x = this.canvasWidth;
      p.vx *= -0.5;
    }

    if (p.y < 0) {
      p.y = 0;
      p.vy *= -0.5;
    } else if (p.y > this.canvasHeight) {
      p.y = this.canvasHeight;
      p.vy *= -0.5;
    }
  }
}
