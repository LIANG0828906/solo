import { Particle, TrailPoint, CollisionEvent, SimParams } from './types';

const NEBULA_PALETTE: [number, number, number][] = [
  [1.0, 0.42, 0.42],
  [1.0, 0.851, 0.239],
  [0.42, 0.796, 0.467],
  [0.302, 0.588, 1.0],
  [0.608, 0.349, 0.722],
];

const TRAIL_LENGTH = 5;
const INTERACTION_DISTANCE = 3.0;
const INTERACTION_DISTANCE_SQ = INTERACTION_DISTANCE * INTERACTION_DISTANCE;
const COLLISION_DISTANCE = 1.2;
const COLLISION_DISTANCE_SQ = COLLISION_DISTANCE * COLLISION_DISTANCE;
const SPATIAL_CELL_SIZE = INTERACTION_DISTANCE;
const LERP_TARGET_TIME = 0.5;
const LERP_FACTOR = Math.log(0.02) / -LERP_TARGET_TIME;

export class ParticleEngine {
  particles: Particle[];
  params: SimParams;
  targetParams: SimParams;
  collisionEvents: CollisionEvent[];
  private cellMap: Map<number, number[]>;

  constructor(count: number, sphereRadius: number) {
    this.particles = [];
    this.params = { gravity: 0.8, speedMultiplier: 1.0, elasticity: 0.3 };
    this.targetParams = { gravity: 0.8, speedMultiplier: 1.0, elasticity: 0.3 };
    this.collisionEvents = [];
    this.cellMap = new Map();
    this.initParticles(count, sphereRadius);
  }

  private initParticles(count: number, radius: number): void {
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = radius * Math.cbrt(Math.random());

      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta);
      const z = r * Math.cos(phi);

      const speed = 0.02 + Math.random() * 0.08;
      const vTheta = Math.random() * Math.PI * 2;
      const vPhi = Math.acos(2 * Math.random() - 1);
      const vx = speed * Math.sin(vPhi) * Math.cos(vTheta);
      const vy = speed * Math.sin(vPhi) * Math.sin(vTheta);
      const vz = speed * Math.cos(vPhi);

      const palette = NEBULA_PALETTE[Math.floor(Math.random() * NEBULA_PALETTE.length)];
      const size = 2 + Math.random() * 4;

      const trail: TrailPoint[] = [];
      for (let t = 0; t < TRAIL_LENGTH; t++) {
        trail.push({ x, y, z });
      }

      this.particles.push({
        id: i,
        x, y, z,
        vx, vy, vz,
        r: palette[0],
        g: palette[1],
        b: palette[2],
        size,
        trail,
      });
    }
  }

  setTargetParams(target: Partial<SimParams>): void {
    if (target.gravity !== undefined) this.targetParams.gravity = target.gravity;
    if (target.speedMultiplier !== undefined) this.targetParams.speedMultiplier = target.speedMultiplier;
    if (target.elasticity !== undefined) this.targetParams.elasticity = target.elasticity;
  }

  private hashCell(cx: number, cy: number, cz: number): number {
    const p1 = 73856093;
    const p2 = 19349663;
    const p3 = 83492791;
    return ((cx * p1) ^ (cy * p2) ^ (cz * p3)) >>> 0;
  }

  private buildSpatialGrid(): void {
    this.cellMap.clear();
    const particles = this.particles;
    const invCell = 1 / SPATIAL_CELL_SIZE;

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const cx = Math.floor(p.x * invCell);
      const cy = Math.floor(p.y * invCell);
      const cz = Math.floor(p.z * invCell);
      const key = this.hashCell(cx, cy, cz);

      let cell = this.cellMap.get(key);
      if (!cell) {
        cell = [];
        this.cellMap.set(key, cell);
      }
      cell.push(i);
    }
  }

  update(dt: number): CollisionEvent[] {
    this.lerpParams(dt);
    const events: CollisionEvent[] = [];
    const { gravity, speedMultiplier, elasticity } = this.params;
    const particles = this.particles;

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const trail = p.trail;
      for (let t = 0; t < TRAIL_LENGTH - 1; t++) {
        trail[t].x = trail[t + 1].x;
        trail[t].y = trail[t + 1].y;
        trail[t].z = trail[t + 1].z;
      }
      trail[TRAIL_LENGTH - 1].x = p.x;
      trail[TRAIL_LENGTH - 1].y = p.y;
      trail[TRAIL_LENGTH - 1].z = p.z;
    }

    this.buildSpatialGrid();
    const invCell = 1 / SPATIAL_CELL_SIZE;

    for (let i = 0; i < particles.length; i++) {
      const a = particles[i];
      const cx = Math.floor(a.x * invCell);
      const cy = Math.floor(a.y * invCell);
      const cz = Math.floor(a.z * invCell);

      for (let dx = 0; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          for (let dz = -1; dz <= 1; dz++) {
            if (dx === 0 && (dy < 0 || (dy === 0 && dz < 0))) continue;

            const key = this.hashCell(cx + dx, cy + dy, cz + dz);
            const cell = this.cellMap.get(key);
            if (!cell) continue;

            for (let k = 0; k < cell.length; k++) {
              const j = cell[k];
              if (j <= i) continue;

              const b = particles[j];
              const ddx = b.x - a.x;
              const ddy = b.y - a.y;
              const ddz = b.z - a.z;
              const distSq = ddx * ddx + ddy * ddy + ddz * ddz;

              if (distSq < INTERACTION_DISTANCE_SQ && distSq > 0.0001) {
                const dist = Math.sqrt(distSq);
                const nx = ddx / dist;
                const ny = ddy / dist;
                const nz = ddz / dist;

                const forceMag = gravity / distSq;
                const fx = forceMag * nx;
                const fy = forceMag * ny;
                const fz = forceMag * nz;

                a.vx += fx * dt;
                a.vy += fy * dt;
                a.vz += fz * dt;
                b.vx -= fx * dt;
                b.vy -= fy * dt;
                b.vz -= fz * dt;

                if (distSq < COLLISION_DISTANCE_SQ) {
                  const relVx = a.vx - b.vx;
                  const relVy = a.vy - b.vy;
                  const relVz = a.vz - b.vz;
                  const relVn = relVx * nx + relVy * ny + relVz * nz;

                  if (relVn > 0) {
                    const impulse = (1 + elasticity) * relVn * 0.5;
                    a.vx -= impulse * nx;
                    a.vy -= impulse * ny;
                    a.vz -= impulse * nz;
                    b.vx += impulse * nx;
                    b.vy += impulse * ny;
                    b.vz += impulse * nz;

                    const avgR = (a.r + b.r) * 0.5;
                    const avgG = (a.g + b.g) * 0.5;
                    const avgB = (a.b + b.b) * 0.5;
                    a.r = avgR;
                    a.g = avgG;
                    a.b = avgB;
                    b.r = avgR;
                    b.g = avgG;
                    b.b = avgB;

                    events.push({
                      timestamp: performance.now(),
                      idA: a.id,
                      idB: b.id,
                      colorA: { r: a.r, g: a.g, b: a.b },
                      colorB: { r: b.r, g: b.g, b: b.b },
                    });
                  }
                }
              }
            }
          }
        }
      }
    }

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      p.x += p.vx * speedMultiplier * dt * 60;
      p.y += p.vy * speedMultiplier * dt * 60;
      p.z += p.vz * speedMultiplier * dt * 60;
    }

    this.collisionEvents = events;
    return events;
  }

  private lerpParams(dt: number): void {
    const t = 1 - Math.exp(-LERP_FACTOR * dt);
    this.params.gravity += (this.targetParams.gravity - this.params.gravity) * t;
    this.params.speedMultiplier += (this.targetParams.speedMultiplier - this.params.speedMultiplier) * t;
    this.params.elasticity += (this.targetParams.elasticity - this.params.elasticity) * t;
  }
}
