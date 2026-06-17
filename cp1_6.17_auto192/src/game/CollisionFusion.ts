import { eventBus } from './EventBus';
import { particleEmitter } from './ParticleEmitter';
import type { Particle } from './types';
import { FUSION_RADIUS_MULTIPLIER, generateId } from './types';

type GridCell = Set<string>;

export class CollisionFusion {
  private grid: Map<string, GridCell> = new Map();
  private cellSize: number = 48;
  private maxFusionTime: number = 5;

  constructor() {
    eventBus.on('particleUpdated', () => {
      this.detectAndFuse();
    });
  }

  setMaxParticleDiameter(diameter: number): void {
    this.cellSize = diameter * 2;
  }

  private getGridKey(x: number, y: number): string {
    const gx = Math.floor(x / this.cellSize);
    const gy = Math.floor(y / this.cellSize);
    return `${gx},${gy}`;
  }

  private buildGrid(particles: Particle[]): void {
    this.grid.clear();
    particles.forEach((p) => {
      const key = this.getGridKey(p.x, p.y);
      if (!this.grid.has(key)) {
        this.grid.set(key, new Set());
      }
      this.grid.get(key)!.add(p.id);
    });
  }

  private getNeighborParticles(particle: Particle, particleMap: Map<string, Particle>): Particle[] {
    const result: Particle[] = [];
    const gx = Math.floor(particle.x / this.cellSize);
    const gy = Math.floor(particle.y / this.cellSize);

    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        const key = `${gx + dx},${gy + dy}`;
        const cell = this.grid.get(key);
        if (cell) {
          cell.forEach((id) => {
            if (id !== particle.id) {
              const p = particleMap.get(id);
              if (p) result.push(p);
            }
          });
        }
      }
    }
    return result;
  }

  private fuse(a: Particle, b: Particle): Particle {
    const totalMass = a.radius * a.radius + b.radius * b.radius;
    const weightA = (a.radius * a.radius) / totalMass;
    const weightB = (b.radius * b.radius) / totalMass;

    const newRadius = (a.radius + b.radius) * FUSION_RADIUS_MULTIPLIER;

    const newColor = {
      r: a.color.r * weightA + b.color.r * weightB,
      g: a.color.g * weightA + b.color.g * weightB,
      b: a.color.b * weightA + b.color.b * weightB,
    };

    const result: Particle = {
      id: generateId(),
      x: (a.x + b.x) / 2,
      y: (a.y + b.y) / 2,
      vx: a.vx * weightA + b.vx * weightB,
      vy: a.vy * weightA + b.vy * weightB,
      radius: newRadius,
      color: newColor,
      createdAt: Math.min(a.createdAt, b.createdAt),
      lifespan: Math.max(a.lifespan, b.lifespan),
    };

    return result;
  }

  detectAndFuse(): void {
    const startTime = performance.now();
    const particles = particleEmitter.getParticles();
    if (particles.length < 2) return;

    const particleMap = new Map<string, Particle>();
    particles.forEach((p) => particleMap.set(p.id, p));

    let maxDiameter = 0;
    particles.forEach((p) => {
      if (p.radius * 2 > maxDiameter) maxDiameter = p.radius * 2;
    });
    this.setMaxParticleDiameter(maxDiameter);

    this.buildGrid(particles);

    const fusedPairs: Set<string> = new Set();
    const toRemove: Set<string> = new Set();
    const toAdd: Particle[] = [];

    for (const p of particles) {
      if (toRemove.has(p.id)) continue;

      const neighbors = this.getNeighborParticles(p, particleMap);
      for (const n of neighbors) {
        if (toRemove.has(n.id)) continue;

        const pairKey = p.id < n.id ? `${p.id}-${n.id}` : `${n.id}-${p.id}`;
        if (fusedPairs.has(pairKey)) continue;

        const dx = n.x - p.x;
        const dy = n.y - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const minDist = p.radius + n.radius;

        if (dist < minDist) {
          fusedPairs.add(pairKey);
          const fused = this.fuse(p, n);
          toRemove.add(p.id);
          toRemove.add(n.id);
          toAdd.push(fused);

          eventBus.emit('particlesFused', {
            particleA: p,
            particleB: n,
            result: fused,
          });

          particleMap.delete(p.id);
          particleMap.delete(n.id);
          particleMap.set(fused.id, fused);
          break;
        }
      }

      if (performance.now() - startTime > this.maxFusionTime) {
        break;
      }
    }

    particleEmitter.removeParticles(Array.from(toRemove));
    toAdd.forEach((p) => particleEmitter.addParticle(p));
  }
}

export const collisionFusion = new CollisionFusion();
