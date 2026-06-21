export interface Plant {
  x: number;
  y: number;
  radius: number;
  growthSpeed: number;
  collectionRadius: number;
  lightPreference: number;
  reproductionInterval: number;
  resources: number;
  framesSinceReproduction: number;
  alive: boolean;
  hue: number;
  birthFrame: number;
}

export interface ResourcePoint {
  x: number;
  y: number;
  type: 'light' | 'water';
  amount: number;
}

export interface SimConfig {
  lightDensity: number;
  waterDensity: number;
  regenRate: number;
}

const CANVAS_W = 800;
const CANVAS_H = 600;

function rand(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function dist(x1: number, y1: number, x2: number, y2: number): number {
  const dx = x1 - x2;
  const dy = y1 - y2;
  return Math.sqrt(dx * dx + dy * dy);
}

function clamp(v: number, min: number, max: number): number {
  return v < min ? min : v > max ? max : v;
}

function mutate(val: number, min: number, max: number): number {
  const factor = 1 + rand(-0.15, 0.15);
  return clamp(val * factor, min, max);
}

function greenHue(): number {
  return rand(120, 145);
}

export class Engine {
  plants: Plant[] = [];
  lightPoints: ResourcePoint[] = [];
  waterPoints: ResourcePoint[] = [];
  config: SimConfig = {
    lightDensity: 50,
    waterDensity: 50,
    regenRate: 0.5,
  };
  frameCount = 0;
  private lightTarget = 500;
  private waterTarget = 500;

  constructor() {
    this.reset();
  }

  reset(): void {
    this.plants = [];
    this.lightPoints = [];
    this.waterPoints = [];
    this.frameCount = 0;
    this.lightTarget = this.config.lightDensity * 10;
    this.waterTarget = this.config.waterDensity * 10;
    this.initPlants(150);
    this.initResources();
  }

  private initPlants(count: number): void {
    for (let i = 0; i < count; i++) {
      this.plants.push({
        x: rand(20, CANVAS_W - 20),
        y: rand(20, CANVAS_H - 20),
        radius: rand(10, 20),
        growthSpeed: rand(0.5, 2.0),
        collectionRadius: rand(30, 60),
        lightPreference: rand(0.1, 0.9),
        reproductionInterval: rand(200, 500),
        resources: 100,
        framesSinceReproduction: 0,
        alive: true,
        hue: greenHue(),
        birthFrame: 0,
      });
    }
  }

  private initResources(): void {
    this.lightPoints = [];
    this.waterPoints = [];
    for (let i = 0; i < this.lightTarget; i++) {
      this.lightPoints.push({
        x: rand(0, CANVAS_W),
        y: rand(0, CANVAS_H),
        type: 'light',
        amount: 1,
      });
    }
    for (let i = 0; i < this.waterTarget; i++) {
      this.waterPoints.push({
        x: rand(0, CANVAS_W),
        y: rand(0, CANVAS_H),
        type: 'water',
        amount: 1,
      });
    }
  }

  private adjustResourceCount(points: ResourcePoint[], target: number): void {
    while (points.length < target) {
      points.push({
        x: rand(0, CANVAS_W),
        y: rand(0, CANVAS_H),
        type: points.length > 0 ? points[0].type : 'light',
        amount: 1,
      });
    }
    while (points.length > target) {
      points.pop();
    }
  }

  update(): void {
    this.frameCount++;

    this.lightTarget = this.config.lightDensity * 10;
    this.waterTarget = this.config.waterDensity * 10;

    this.adjustResourceCount(this.lightPoints, this.lightTarget);
    this.adjustResourceCount(this.waterPoints, this.waterTarget);

    this.driftResources();

    this.regenerateResources();

    this.processPlants();

    this.plants = this.plants.filter(p => p.alive);
  }

  private driftResources(): void {
    const drift = () => rand(1, 3) * (Math.random() < 0.5 ? 1 : -1);
    for (const rp of this.lightPoints) {
      rp.x = clamp(rp.x + drift(), 0, CANVAS_W);
      rp.y = clamp(rp.y + drift(), 0, CANVAS_H);
    }
    for (const rp of this.waterPoints) {
      rp.x = clamp(rp.x + drift(), 0, CANVAS_W);
      rp.y = clamp(rp.y + drift(), 0, CANVAS_H);
    }
  }

  private regenerateResources(): void {
    const rate = this.config.regenRate;
    for (const rp of this.lightPoints) {
      rp.amount = Math.min(1, rp.amount + rate * 0.01);
    }
    for (const rp of this.waterPoints) {
      rp.amount = Math.min(1, rp.amount + rate * 0.01);
    }
  }

  private processPlants(): void {
    const plantCount = this.plants.filter(p => p.alive).length;
    const reproductionThrottle = plantCount > 300 ? 0.5 : 1.0;

    for (const plant of this.plants) {
      if (!plant.alive) continue;

      plant.framesSinceReproduction++;
      plant.resources -= 0.3 + plant.growthSpeed * 0.15;

      this.collectResources(plant);

      if (plant.resources <= 0) {
        plant.alive = false;
        continue;
      }

      if (
        plant.resources >= 150 &&
        plant.framesSinceReproduction >= plant.reproductionInterval
      ) {
        if (Math.random() < reproductionThrottle) {
          this.reproduce(plant);
        }
      }
    }
  }

  private collectResources(plant: Plant): void {
    const cr = plant.collectionRadius;
    const lightGain = plant.lightPreference;
    const waterGain = 1 - plant.lightPreference;

    for (const rp of this.lightPoints) {
      if (rp.amount <= 0) continue;
      const d = dist(plant.x, plant.y, rp.x, rp.y);
      if (d <= cr) {
        const collected = Math.min(rp.amount, 0.3) * lightGain;
        plant.resources += collected;
        rp.amount -= collected;
      }
    }

    for (const rp of this.waterPoints) {
      if (rp.amount <= 0) continue;
      const d = dist(plant.x, plant.y, rp.x, rp.y);
      if (d <= cr) {
        const collected = Math.min(rp.amount, 0.3) * waterGain;
        plant.resources += collected;
        rp.amount -= collected;
      }
    }
  }

  private reproduce(parent: Plant): void {
    const offsetX = rand(-30, 30);
    const offsetY = rand(-30, 30);
    let nx = parent.x + offsetX;
    let ny = parent.y + offsetY;

    for (const other of this.plants) {
      if (!other.alive || other === parent) continue;
      const d = dist(nx, ny, other.x, other.y);
      const minDist = 5 + other.radius;
      if (d < minDist) {
        const angle = Math.atan2(ny - other.y, nx - other.x);
        nx = other.x + Math.cos(angle) * (minDist + 2);
        ny = other.y + Math.sin(angle) * (minDist + 2);
      }
    }

    nx = clamp(nx, 5, CANVAS_W - 5);
    ny = clamp(ny, 5, CANVAS_H - 5);

    const child: Plant = {
      x: nx,
      y: ny,
      radius: mutate(parent.radius, 6, 30),
      growthSpeed: mutate(parent.growthSpeed, 0.2, 3.0),
      collectionRadius: mutate(parent.collectionRadius, 15, 80),
      lightPreference: mutate(parent.lightPreference, 0.05, 0.95),
      reproductionInterval: mutate(parent.reproductionInterval, 100, 600),
      resources: 80,
      framesSinceReproduction: 0,
      alive: true,
      hue: parent.hue + rand(-8, 8),
      birthFrame: this.frameCount,
    };

    this.plants.push(child);
    parent.resources = 50;
    parent.framesSinceReproduction = 0;
  }

  getPlantCount(): number {
    return this.plants.filter(p => p.alive).length;
  }

  getAvgGrowthSpeed(): number {
    const alive = this.plants.filter(p => p.alive);
    if (alive.length === 0) return 0;
    return alive.reduce((s, p) => s + p.growthSpeed, 0) / alive.length;
  }

  getAvgCollectionRadius(): number {
    const alive = this.plants.filter(p => p.alive);
    if (alive.length === 0) return 0;
    return alive.reduce((s, p) => s + p.collectionRadius, 0) / alive.length;
  }
}
