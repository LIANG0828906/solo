import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  PLANT_SIZE,
  HERBIVORE_SIZE,
  CARNIVORE_SIZE,
  HERBIVORE_BASE_SPEED,
  CARNIVORE_BASE_SPEED,
  HERBIVORE_BASE_PERCEPTION,
  CARNIVORE_BASE_PERCEPTION,
  MUTATION_RATE,
  SPEED_MUTATION_RANGE,
  PERCEPTION_MUTATION_RANGE,
  MAX_TRAIL_POINTS,
  MIN_SPEED,
  MIN_PERCEPTION,
} from './config.js';

export interface TrailPoint {
  x: number;
  y: number;
  timestamp: number;
}

let idCounter = 0;
const generateId = (): string => {
  idCounter += 1;
  return `id_${Date.now().toString(36)}_${idCounter}`;
};

export class BaseEntity {
  id: string;
  x: number;
  y: number;
  health: number;
  satiety: number;
  speed: number;
  perceptionRadius: number;
  isDying: boolean;
  deathStartTime: number;
  trail: TrailPoint[];
  lastStarvationDamage: number;

  constructor(x: number, y: number) {
    this.id = generateId();
    this.x = x;
    this.y = y;
    this.health = 100;
    this.satiety = 50;
    this.speed = 1;
    this.perceptionRadius = 30;
    this.isDying = false;
    this.deathStartTime = 0;
    this.trail = [];
    this.lastStarvationDamage = 0;
  }

  addTrailPoint(timestamp: number): void {
    this.trail.push({ x: this.x, y: this.y, timestamp });
    if (this.trail.length > MAX_TRAIL_POINTS) {
      this.trail = this.trail.slice(-MAX_TRAIL_POINTS);
    }
  }

  cleanupOldTrail(currentTime: number, duration: number): void {
    this.trail = this.trail.filter((p) => currentTime - p.timestamp <= duration);
  }

  markDead(currentTime: number): void {
    if (!this.isDying) {
      this.isDying = true;
      this.deathStartTime = currentTime;
    }
  }
}

export class Plant extends BaseEntity {
  swayOffset: number;
  size: number;

  constructor(x: number, y: number) {
    super(x, y);
    this.swayOffset = Math.random() * Math.PI * 2;
    this.size = PLANT_SIZE;
    this.speed = 0;
    this.perceptionRadius = 0;
  }

  getSway(currentTime: number): number {
    return Math.sin(currentTime * 0.0015 + this.swayOffset) * 2;
  }
}

export class Herbivore extends BaseEntity {
  vx: number;
  vy: number;
  size: number;
  wanderAngle: number;
  nextWanderTime: number;

  constructor(x: number, y: number, inheritSpeed?: number, inheritPerception?: number) {
    super(x, y);
    this.size = HERBIVORE_SIZE;
    this.speed = inheritSpeed ?? HERBIVORE_BASE_SPEED;
    this.perceptionRadius = inheritPerception ?? HERBIVORE_BASE_PERCEPTION;
    this.vx = 0;
    this.vy = 0;
    this.wanderAngle = Math.random() * Math.PI * 2;
    this.nextWanderTime = 0;
  }

  createChild(): Herbivore {
    let childSpeed = HERBIVORE_BASE_SPEED;
    let childPerception = HERBIVORE_BASE_PERCEPTION;

    if (Math.random() < MUTATION_RATE) {
      childSpeed = this.speed * (1 + (Math.random() * 2 - 1) * SPEED_MUTATION_RANGE);
      childSpeed = Math.max(MIN_SPEED, childSpeed);
    }
    if (Math.random() < MUTATION_RATE) {
      childPerception = this.perceptionRadius * (1 + (Math.random() * 2 - 1) * PERCEPTION_MUTATION_RANGE);
      childPerception = Math.max(MIN_PERCEPTION, childPerception);
    }

    const offsetX = Math.random() * 30 - 15;
    const offsetY = Math.random() * 30 - 15;
    const childX = Math.max(HERBIVORE_SIZE, Math.min(CANVAS_WIDTH - HERBIVORE_SIZE, this.x + offsetX));
    const childY = Math.max(HERBIVORE_SIZE, Math.min(CANVAS_HEIGHT - HERBIVORE_SIZE, this.y + offsetY));
    return new Herbivore(childX, childY, childSpeed, childPerception);
  }
}

export class Carnivore extends BaseEntity {
  vx: number;
  vy: number;
  size: number;
  wanderAngle: number;
  nextWanderTime: number;
  targetId: string | null;

  constructor(x: number, y: number, inheritSpeed?: number, inheritPerception?: number) {
    super(x, y);
    this.size = CARNIVORE_SIZE;
    this.speed = inheritSpeed ?? CARNIVORE_BASE_SPEED;
    this.perceptionRadius = inheritPerception ?? CARNIVORE_BASE_PERCEPTION;
    this.vx = 0;
    this.vy = 0;
    this.wanderAngle = Math.random() * Math.PI * 2;
    this.nextWanderTime = 0;
    this.targetId = null;
  }

  findNearestHerbivore(herbivores: Herbivore[]): Herbivore | null {
    let nearest: Herbivore | null = null;
    let minDist = Infinity;

    for (const h of herbivores) {
      if (h.isDying) continue;
      const dx = h.x - this.x;
      const dy = h.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < this.perceptionRadius && dist < minDist) {
        minDist = dist;
        nearest = h;
      }
    }

    if (nearest) {
      this.targetId = nearest.id;
    } else {
      this.targetId = null;
    }
    return nearest;
  }

  createChild(): Carnivore {
    let childSpeed = CARNIVORE_BASE_SPEED;
    let childPerception = CARNIVORE_BASE_PERCEPTION;

    if (Math.random() < MUTATION_RATE) {
      childSpeed = this.speed * (1 + (Math.random() * 2 - 1) * SPEED_MUTATION_RANGE);
      childSpeed = Math.max(MIN_SPEED, childSpeed);
    }
    if (Math.random() < MUTATION_RATE) {
      childPerception = this.perceptionRadius * (1 + (Math.random() * 2 - 1) * PERCEPTION_MUTATION_RANGE);
      childPerception = Math.max(MIN_PERCEPTION, childPerception);
    }

    const offsetX = Math.random() * 30 - 15;
    const offsetY = Math.random() * 30 - 15;
    const childX = Math.max(CARNIVORE_SIZE, Math.min(CANVAS_WIDTH - CARNIVORE_SIZE, this.x + offsetX));
    const childY = Math.max(CARNIVORE_SIZE, Math.min(CANVAS_HEIGHT - CARNIVORE_SIZE, this.y + offsetY));
    return new Carnivore(childX, childY, childSpeed, childPerception);
  }
}
