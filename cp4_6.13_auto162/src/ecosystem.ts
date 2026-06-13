import { Plant, Herbivore, Carnivore } from './entities.js';
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  INITIAL_PLANT_COUNT,
  INITIAL_HERBIVORE_COUNT,
  INITIAL_CARNIVORE_COUNT,
  HERBIVORE_SIZE,
  CARNIVORE_SIZE,
  PLANT_SIZE,
  FEEDING_RADIUS,
  CONTACT_RADIUS,
  GRAZING_SATIETY_GAIN,
  PREDATION_SATIETY_GAIN,
  BREEDING_THRESHOLD,
  BREEDING_RADIUS,
  BREEDING_PROBABILITY,
  SATIETY_DECAY_PER_SECOND,
  STARVATION_THRESHOLD,
  STARVATION_DAMAGE_INTERVAL,
  STARVATION_DAMAGE,
  EXTINCTION_THRESHOLD,
  STAT_SAMPLE_INTERVAL,
  MAX_STAT_POINTS,
  EXTINCTION_CHECK_INTERVAL,
  FADE_DURATION,
  TRAIL_DURATION,
  CARNIVORE_CHASE_SPEED_MULTIPLIER,
} from './config.js';

export interface StatsHistory {
  plants: number[];
  herbivores: number[];
  carnivores: number[];
}

export type SpeciesName = '植物' | '食草动物' | '食肉动物';

export class Ecosystem {
  plants: Plant[];
  herbivores: Herbivore[];
  carnivores: Carnivore[];
  simulationTime: number;
  speedMultiplier: number;
  isRunning: boolean;
  predationCount: number;
  grazingCount: number;
  statsHistory: StatsHistory;
  lastStatSample: number;
  lastExtinctionCheck: number;
  lastNotifiedExtinctions: Set<string>;

  constructor() {
    this.plants = [];
    this.herbivores = [];
    this.carnivores = [];
    this.simulationTime = 0;
    this.speedMultiplier = 1.0;
    this.isRunning = false;
    this.predationCount = 0;
    this.grazingCount = 0;
    this.statsHistory = { plants: [], herbivores: [], carnivores: [] };
    this.lastStatSample = 0;
    this.lastExtinctionCheck = 0;
    this.lastNotifiedExtinctions = new Set();
  }

  initialize(): void {
    this.plants = [];
    this.herbivores = [];
    this.carnivores = [];
    this.simulationTime = 0;
    this.predationCount = 0;
    this.grazingCount = 0;
    this.statsHistory = { plants: [], herbivores: [], carnivores: [] };
    this.lastStatSample = 0;
    this.lastExtinctionCheck = 0;
    this.lastNotifiedExtinctions = new Set();

    for (let i = 0; i < INITIAL_PLANT_COUNT; i++) {
      const x = PLANT_SIZE + Math.random() * (CANVAS_WIDTH - PLANT_SIZE * 2);
      const y = PLANT_SIZE + Math.random() * (CANVAS_HEIGHT - PLANT_SIZE * 2);
      this.plants.push(new Plant(x, y));
    }

    for (let i = 0; i < INITIAL_HERBIVORE_COUNT; i++) {
      const x = HERBIVORE_SIZE + Math.random() * (CANVAS_WIDTH - HERBIVORE_SIZE * 2);
      const y = HERBIVORE_SIZE + Math.random() * (CANVAS_HEIGHT - HERBIVORE_SIZE * 2);
      this.herbivores.push(new Herbivore(x, y));
    }

    for (let i = 0; i < INITIAL_CARNIVORE_COUNT; i++) {
      const x = CARNIVORE_SIZE + Math.random() * (CANVAS_WIDTH - CARNIVORE_SIZE * 2);
      const y = CARNIVORE_SIZE + Math.random() * (CANVAS_HEIGHT - CARNIVORE_SIZE * 2);
      this.carnivores.push(new Carnivore(x, y));
    }

    this.sampleStats(0);
  }

  setSpeed(speed: number): void {
    this.speedMultiplier = Math.max(0.5, Math.min(3.0, speed));
  }

  getCounts() {
    const alivePlants = this.plants.filter((p) => !p.isDying).length;
    const aliveHerbivores = this.herbivores.filter((h) => !h.isDying).length;
    const aliveCarnivores = this.carnivores.filter((c) => !c.isDying).length;
    return {
      plants: alivePlants,
      herbivores: aliveHerbivores,
      carnivores: aliveCarnivores,
    };
  }

  sampleStats(time: number): void {
    const counts = this.getCounts();
    this.statsHistory.plants.push(counts.plants);
    this.statsHistory.herbivores.push(counts.herbivores);
    this.statsHistory.carnivores.push(counts.carnivores);

    if (this.statsHistory.plants.length > MAX_STAT_POINTS) {
      this.statsHistory.plants = this.statsHistory.plants.slice(-MAX_STAT_POINTS);
    }
    if (this.statsHistory.herbivores.length > MAX_STAT_POINTS) {
      this.statsHistory.herbivores = this.statsHistory.herbivores.slice(-MAX_STAT_POINTS);
    }
    if (this.statsHistory.carnivores.length > MAX_STAT_POINTS) {
      this.statsHistory.carnivores = this.statsHistory.carnivores.slice(-MAX_STAT_POINTS);
    }
    this.lastStatSample = time;
  }

  checkExtinction(time: number): SpeciesName | null {
    if (time - this.lastExtinctionCheck < EXTINCTION_CHECK_INTERVAL) {
      return null;
    }
    this.lastExtinctionCheck = time;

    const counts = this.getCounts();
    let result: SpeciesName | null = null;

    if (counts.plants < EXTINCTION_THRESHOLD && !this.lastNotifiedExtinctions.has('plant')) {
      result = '植物';
      this.lastNotifiedExtinctions.add('plant');
    } else if (counts.herbivores < EXTINCTION_THRESHOLD && !this.lastNotifiedExtinctions.has('herbivore')) {
      result = '食草动物';
      this.lastNotifiedExtinctions.add('herbivore');
    } else if (counts.carnivores < EXTINCTION_THRESHOLD && !this.lastNotifiedExtinctions.has('carnivore')) {
      result = '食肉动物';
      this.lastNotifiedExtinctions.add('carnivore');
    }

    return result;
  }

  update(rawDeltaMs: number): void {
    const deltaMs = rawDeltaMs * this.speedMultiplier;
    const deltaSec = deltaMs / 1000;
    this.simulationTime += deltaMs;
    const currentTime = this.simulationTime;

    const totalEntities = this.plants.length + this.herbivores.length + this.carnivores.length;
    const updateStep = totalEntities > 100 ? 2 : 1;

    if (currentTime - this.lastStatSample >= STAT_SAMPLE_INTERVAL) {
      this.sampleStats(currentTime);
    }

    this.updateHerbivores(deltaMs, deltaSec, currentTime, updateStep);
    this.updateCarnivores(deltaMs, deltaSec, currentTime, updateStep);

    this.processBreeding(currentTime);
    this.removeDeadEntities(currentTime);
    this.cleanupTrails(currentTime);
  }

  private updateHerbivores(deltaMs: number, deltaSec: number, currentTime: number, step: number): void {
    for (let i = 0; i < this.herbivores.length; i += step) {
      const h = this.herbivores[i];
      if (h.isDying) continue;

      h.satiety = Math.max(0, h.satiety - SATIETY_DECAY_PER_SECOND * deltaSec);

      if (h.satiety < STARVATION_THRESHOLD && currentTime - h.lastStarvationDamage >= STARVATION_DAMAGE_INTERVAL) {
        h.health -= STARVATION_DAMAGE;
        h.lastStarvationDamage = currentTime;
        if (h.health <= 0) {
          h.markDead(currentTime);
          continue;
        }
      }

      let nearPlant: Plant | null = null;
      let minDist = Infinity;
      for (const p of this.plants) {
        if (p.isDying) continue;
        const dx = p.x - h.x;
        const dy = p.y - h.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < h.perceptionRadius && dist < minDist) {
          minDist = dist;
          nearPlant = p;
        }
      }

      let moveSpeed = h.speed;
      if (nearPlant && minDist < FEEDING_RADIUS) {
        moveSpeed = h.speed * 0.4;
      }

      if (currentTime >= h.nextWanderTime) {
        h.wanderAngle += (Math.random() - 0.5) * 1.2;
        h.nextWanderTime = currentTime + 500 + Math.random() * 1000;
      }

      let dx: number;
      let dy: number;

      if (nearPlant) {
        dx = nearPlant.x - h.x;
        dy = nearPlant.y - h.y;
        const len = Math.sqrt(dx * dx + dy * dy) || 1;
        dx /= len;
        dy /= len;
      } else {
        dx = Math.cos(h.wanderAngle);
        dy = Math.sin(h.wanderAngle);
      }

      h.vx = dx * moveSpeed;
      h.vy = dy * moveSpeed;

      h.x += h.vx * deltaMs * 0.06;
      h.y += h.vy * deltaMs * 0.06;

      if (h.x < HERBIVORE_SIZE) { h.x = HERBIVORE_SIZE; h.wanderAngle = Math.PI - h.wanderAngle; }
      if (h.x > CANVAS_WIDTH - HERBIVORE_SIZE) { h.x = CANVAS_WIDTH - HERBIVORE_SIZE; h.wanderAngle = Math.PI - h.wanderAngle; }
      if (h.y < HERBIVORE_SIZE) { h.y = HERBIVORE_SIZE; h.wanderAngle = -h.wanderAngle; }
      if (h.y > CANVAS_HEIGHT - HERBIVORE_SIZE) { h.y = CANVAS_HEIGHT - HERBIVORE_SIZE; h.wanderAngle = -h.wanderAngle; }

      if (nearPlant && minDist < CONTACT_RADIUS) {
        nearPlant.markDead(currentTime);
        h.satiety = Math.min(100, h.satiety + GRAZING_SATIETY_GAIN);
        this.grazingCount += 1;
      }

      h.addTrailPoint(currentTime);
    }
  }

  private updateCarnivores(deltaMs: number, deltaSec: number, currentTime: number, step: number): void {
    for (let i = 0; i < this.carnivores.length; i += step) {
      const c = this.carnivores[i];
      if (c.isDying) continue;

      c.satiety = Math.max(0, c.satiety - SATIETY_DECAY_PER_SECOND * deltaSec);

      if (c.satiety < STARVATION_THRESHOLD && currentTime - c.lastStarvationDamage >= STARVATION_DAMAGE_INTERVAL) {
        c.health -= STARVATION_DAMAGE;
        c.lastStarvationDamage = currentTime;
        if (c.health <= 0) {
          c.markDead(currentTime);
          continue;
        }
      }

      const aliveHerbivores = this.herbivores.filter((h) => !h.isDying);
      const target = c.findNearestHerbivore(aliveHerbivores);

      let moveSpeed = c.speed;
      let dx: number;
      let dy: number;

      if (target) {
        moveSpeed = c.speed * CARNIVORE_CHASE_SPEED_MULTIPLIER;
        dx = target.x - c.x;
        dy = target.y - c.y;
        const len = Math.sqrt(dx * dx + dy * dy) || 1;
        dx /= len;
        dy /= len;
      } else {
        if (currentTime >= c.nextWanderTime) {
          c.wanderAngle += (Math.random() - 0.5) * 1.2;
          c.nextWanderTime = currentTime + 500 + Math.random() * 1000;
        }
        dx = Math.cos(c.wanderAngle);
        dy = Math.sin(c.wanderAngle);
      }

      c.vx = dx * moveSpeed;
      c.vy = dy * moveSpeed;

      c.x += c.vx * deltaMs * 0.06;
      c.y += c.vy * deltaMs * 0.06;

      if (c.x < CARNIVORE_SIZE) { c.x = CARNIVORE_SIZE; c.wanderAngle = Math.PI - c.wanderAngle; }
      if (c.x > CANVAS_WIDTH - CARNIVORE_SIZE) { c.x = CANVAS_WIDTH - CARNIVORE_SIZE; c.wanderAngle = Math.PI - c.wanderAngle; }
      if (c.y < CARNIVORE_SIZE) { c.y = CARNIVORE_SIZE; c.wanderAngle = -c.wanderAngle; }
      if (c.y > CANVAS_HEIGHT - CARNIVORE_SIZE) { c.y = CANVAS_HEIGHT - CARNIVORE_SIZE; c.wanderAngle = -c.wanderAngle; }

      if (target) {
        const tdx = target.x - c.x;
        const tdy = target.y - c.y;
        const tdist = Math.sqrt(tdx * tdx + tdy * tdy);
        if (tdist < CONTACT_RADIUS) {
          target.markDead(currentTime);
          c.satiety = Math.min(100, c.satiety + PREDATION_SATIETY_GAIN);
          this.predationCount += 1;
        }
      }

      c.addTrailPoint(currentTime);
    }
  }

  private processBreeding(_currentTime: number): void {
    const newHerbivores: Herbivore[] = [];
    const herbivoreMated = new Set<string>();

    for (let i = 0; i < this.herbivores.length; i++) {
      const a = this.herbivores[i];
      if (a.isDying || a.satiety < BREEDING_THRESHOLD || herbivoreMated.has(a.id)) continue;

      for (let j = i + 1; j < this.herbivores.length; j++) {
        const b = this.herbivores[j];
        if (b.isDying || b.satiety < BREEDING_THRESHOLD || herbivoreMated.has(b.id)) continue;

        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < BREEDING_RADIUS) {
          if (Math.random() < BREEDING_PROBABILITY) {
            newHerbivores.push(a.createChild());
            a.satiety = 50;
            b.satiety = 50;
            herbivoreMated.add(a.id);
            herbivoreMated.add(b.id);
            break;
          }
        }
      }
    }
    this.herbivores.push(...newHerbivores);

    const newCarnivores: Carnivore[] = [];
    const carnivoreMated = new Set<string>();

    for (let i = 0; i < this.carnivores.length; i++) {
      const a = this.carnivores[i];
      if (a.isDying || a.satiety < BREEDING_THRESHOLD || carnivoreMated.has(a.id)) continue;

      for (let j = i + 1; j < this.carnivores.length; j++) {
        const b = this.carnivores[j];
        if (b.isDying || b.satiety < BREEDING_THRESHOLD || carnivoreMated.has(b.id)) continue;

        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < BREEDING_RADIUS) {
          if (Math.random() < BREEDING_PROBABILITY) {
            newCarnivores.push(a.createChild());
            a.satiety = 50;
            b.satiety = 50;
            carnivoreMated.add(a.id);
            carnivoreMated.add(b.id);
            break;
          }
        }
      }
    }
    this.carnivores.push(...newCarnivores);

    if (Math.random() < 0.002 * this.speedMultiplier && this.plants.filter((p) => !p.isDying).length < 50) {
      const x = PLANT_SIZE + Math.random() * (CANVAS_WIDTH - PLANT_SIZE * 2);
      const y = PLANT_SIZE + Math.random() * (CANVAS_HEIGHT - PLANT_SIZE * 2);
      this.plants.push(new Plant(x, y));
    }
  }

  private removeDeadEntities(currentTime: number): void {
    this.plants = this.plants.filter((p) => !(p.isDying && currentTime - p.deathStartTime >= FADE_DURATION));
    this.herbivores = this.herbivores.filter((h) => !(h.isDying && currentTime - h.deathStartTime >= FADE_DURATION));
    this.carnivores = this.carnivores.filter((c) => !(c.isDying && currentTime - c.deathStartTime >= FADE_DURATION));
  }

  private cleanupTrails(currentTime: number): void {
    for (const h of this.herbivores) h.cleanupOldTrail(currentTime, TRAIL_DURATION);
    for (const c of this.carnivores) c.cleanupOldTrail(currentTime, TRAIL_DURATION);
  }
}
