import { Particle } from './particle';

const BOUNDARY_RESTITUTION = 0.8;
const ATTRACT_ACCEL = 0.3;
const REPEL_ACCEL = 0.5;
const COLLISION_CELL_SIZE = 20;

interface ForceField {
  x: number;
  y: number;
  type: 'attract' | 'repel';
  strength: number;
}

export class Engine {
  particles: Particle[] = [];
  pool: Particle[] = [];
  width: number = 0;
  height: number = 0;
  forceField: ForceField | null = null;
  forceStrength: number = 0.3;
  trailLength: number = 5;
  particleCount: number = 2000;
  particleMinSize: number = 2;
  particleMaxSize: number = 4;
  private initialStates: { x: number; y: number; vx: number; vy: number; size: number }[] = [];

  init(width: number, height: number, count: number): void {
    this.width = width;
    this.height = height;
    this.particleCount = count;
    this.pool = [];
    this.particles = [];
    this.initialStates = [];
    this.addParticles(count);
  }

  addParticles(count: number): void {
    for (let i = 0; i < count; i++) {
      const size = this.particleMinSize + Math.random() * (this.particleMaxSize - this.particleMinSize);
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.5;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;
      const x = size + Math.random() * (this.width - size * 2);
      const y = size + Math.random() * (this.height - size * 2);

      let p: Particle;
      if (this.pool.length > 0) {
        p = this.pool.pop()!;
      } else {
        p = new Particle();
      }
      p.init(x, y, vx, vy, size);
      this.particles.push(p);
      this.initialStates.push({ x, y, vx, vy, size });
    }
  }

  setParticleSizeRange(min: number, max: number): void {
    this.particleMinSize = min;
    this.particleMaxSize = max;
  }

  setParticleCount(count: number): void {
    if (count === this.particles.length) return;

    if (count < this.particles.length) {
      const removed = this.particles.splice(count);
      this.initialStates.splice(count);
      for (const p of removed) {
        this.pool.push(p);
      }
    } else {
      const diff = count - this.particles.length;
      this.addParticles(diff);
    }
    this.particleCount = count;
  }

  applyForce(x: number, y: number, type: 'attract' | 'repel'): void {
    this.forceField = { x, y, type, strength: this.forceStrength };
  }

  clearForce(): void {
    this.forceField = null;
  }

  step(dt: number): void {
    const cappedDt = Math.min(dt, 0.05);

    if (this.forceField) {
      const ff = this.forceField;
      const accel = ff.type === 'attract' ? ATTRACT_ACCEL * ff.strength : REPEL_ACCEL * ff.strength;
      const sign = ff.type === 'attract' ? 1 : -1;
      for (const p of this.particles) {
        const dx = ff.x - p.x;
        const dy = ff.y - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 1) {
          const nx = dx / dist;
          const ny = dy / dist;
          p.vx += sign * nx * accel * cappedDt * 60;
          p.vy += sign * ny * accel * cappedDt * 60;
        }
      }
    }

    for (const p of this.particles) {
      p.update(cappedDt * 60, this.width, this.height, BOUNDARY_RESTITUTION, this.trailLength);
    }

    this.detectCollisions();
  }

  private detectCollisions(): void {
    const cellSize = COLLISION_CELL_SIZE;
    const cols = Math.ceil(this.width / cellSize);
    const grid = new Map<number, Particle[]>();

    for (const p of this.particles) {
      const cx = Math.floor(p.x / cellSize);
      const cy = Math.floor(p.y / cellSize);
      const key = cy * cols + cx;
      let cell = grid.get(key);
      if (!cell) {
        cell = [];
        grid.set(key, cell);
      }
      cell.push(p);
    }

    for (const [key, cell] of grid) {
      const cy = Math.floor(key / cols);
      const cx = key - cy * cols;

      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const nk = (cy + dy) * cols + (cx + dx);
          const neighbor = dx === 0 && dy === 0 ? cell : grid.get(nk);
          if (!neighbor) continue;

          const startJ = dx === 0 && dy === 0 ? 0 : 0;
          for (let i = 0; i < cell.length; i++) {
            for (let j = (dx === 0 && dy === 0 ? i + 1 : startJ); j < neighbor.length; j++) {
              cell[i].collideWith(neighbor[j]);
            }
          }
        }
      }
    }
  }

  resetParticles(): void {
    const count = this.particles.length;
    this.particles.length = 0;
    this.initialStates.length = 0;
    this.pool.length = 0;
    this.addParticles(count);
  }

  resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
  }
}
