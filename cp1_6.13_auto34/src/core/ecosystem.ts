import { eventBus } from '../events/eventBus';

export const GRID_SIZE = 8;

export type ResourceType = 'water' | 'grass' | 'berry' | 'empty';
export type PlantType = 'bush' | 'fruitTree';
export type AnimalType = 'herbivore' | 'carnivore';
export type BehaviorState = 'idle' | 'foraging' | 'fleeing' | 'hunting' | 'eating' | 'moving';

export interface GridCell {
  x: number;
  y: number;
  type: ResourceType;
  amount: number;
}

export interface Plant {
  id: string;
  type: PlantType;
  x: number;
  y: number;
  energy: number;
  growthRate: number;
}

export interface BehaviorRecord {
  action: string;
  timestamp: number;
}

export interface Animal {
  id: string;
  type: AnimalType;
  x: number;
  y: number;
  prevX: number;
  prevY: number;
  health: number;
  maxHealth: number;
  stamina: number;
  maxStamina: number;
  age: number;
  maxAge: number;
  state: BehaviorState;
  targetX: number | null;
  targetY: number | null;
  targetId: string | null;
  recentBehaviors: BehaviorRecord[];
}

export interface StatsSnapshot {
  plantCount: number;
  herbivoreCount: number;
  carnivoreCount: number;
  avgHerbivoreLifespan: number;
  avgCarnivoreLifespan: number;
  waterAmount: number;
  grassAmount: number;
  berryAmount: number;
  timestamp: number;
}

export interface PredationEvent {
  predatorId: string;
  preyId: string;
  preyX: number;
  preyY: number;
  success: boolean;
}

const PLANT_ENERGY: Record<PlantType, number> = {
  bush: 25,
  fruitTree: 50,
};

const PLANT_COST: Record<PlantType, number> = {
  bush: 10,
  fruitTree: 25,
};

const ANIMAL_COST: Record<AnimalType, number> = {
  herbivore: 20,
  carnivore: 40,
};

const TICK_INTERVAL = 500;
const HISTORY_MAX = 30;
const HISTORY_INTERVAL = 1000;

let uidCounter = 0;
const genId = (prefix: string): string => `${prefix}_${++uidCounter}_${Date.now().toString(36)}`;

export class Ecosystem {
  grid: GridCell[][] = [];
  plants: Map<string, Plant> = new Map();
  animals: Map<string, Animal> = new Map();
  resourcePoints: number = 100;
  private history: StatsSnapshot[] = [];
  private tickTimer: number | null = null;
  private historyTimer: number | null = null;
  private lastHistoryTime: number = 0;

  constructor() {
    this.initGrid();
  }

  private initGrid(): void {
    this.grid = [];
    for (let y = 0; y < GRID_SIZE; y++) {
      const row: GridCell[] = [];
      for (let x = 0; x < GRID_SIZE; x++) {
        let type: ResourceType = 'empty';
        let amount = 0;
        const r = Math.random();
        if (r < 0.15) {
          type = 'water';
          amount = 80 + Math.floor(Math.random() * 40);
        } else if (r < 0.5) {
          type = 'grass';
          amount = 40 + Math.floor(Math.random() * 60);
        } else if (r < 0.7) {
          type = 'berry';
          amount = 20 + Math.floor(Math.random() * 30);
        }
        row.push({ x, y, type, amount });
      }
      this.grid.push(row);
    }
  }

  start(): void {
    if (this.tickTimer !== null) return;
    this.tickTimer = window.setInterval(() => this.tick(), TICK_INTERVAL);
    this.historyTimer = window.setInterval(() => this.recordHistory(), HISTORY_INTERVAL);
    this.recordHistory();
  }

  stop(): void {
    if (this.tickTimer !== null) {
      clearInterval(this.tickTimer);
      this.tickTimer = null;
    }
    if (this.historyTimer !== null) {
      clearInterval(this.historyTimer);
      this.historyTimer = null;
    }
  }

  getHistory(): StatsSnapshot[] {
    return this.history.slice();
  }

  getSnapshot(): StatsSnapshot {
    const plantsArr = Array.from(this.plants.values());
    const animalsArr = Array.from(this.animals.values());
    const herbivores = animalsArr.filter((a) => a.type === 'herbivore');
    const carnivores = animalsArr.filter((a) => a.type === 'carnivore');

    let water = 0,
      grass = 0,
      berry = 0;
    for (const row of this.grid) {
      for (const cell of row) {
        if (cell.type === 'water') water += cell.amount;
        else if (cell.type === 'grass') grass += cell.amount;
        else if (cell.type === 'berry') berry += cell.amount;
      }
    }

    const avgHL = herbivores.length
      ? herbivores.reduce((s, a) => s + a.maxAge, 0) / herbivores.length
      : 0;
    const avgCL = carnivores.length
      ? carnivores.reduce((s, a) => s + a.maxAge, 0) / carnivores.length
      : 0;

    return {
      plantCount: plantsArr.length,
      herbivoreCount: herbivores.length,
      carnivoreCount: carnivores.length,
      avgHerbivoreLifespan: Math.round(avgHL),
      avgCarnivoreLifespan: Math.round(avgCL),
      waterAmount: water,
      grassAmount: grass,
      berryAmount: berry,
      timestamp: Date.now(),
    };
  }

  private recordHistory(): void {
    const snap = this.getSnapshot();
    this.history.push(snap);
    if (this.history.length > HISTORY_MAX) {
      this.history.shift();
    }
    this.lastHistoryTime = snap.timestamp;
    eventBus.emit('ecosystem:snapshot', this.history.slice());
  }

  placePlant(x: number, y: number, type: PlantType): boolean {
    if (x < 0 || x >= GRID_SIZE || y < 0 || y >= GRID_SIZE) return false;
    const cost = PLANT_COST[type];
    if (this.resourcePoints < cost) return false;
    const key = `${x},${y}`;
    for (const p of this.plants.values()) {
      if (p.x === x && p.y === y) return false;
    }
    this.resourcePoints -= cost;
    const plant: Plant = {
      id: genId('plant'),
      type,
      x,
      y,
      energy: PLANT_ENERGY[type],
      growthRate: type === 'bush' ? 2 : 3,
    };
    this.plants.set(plant.id, plant);
    this.broadcastTick();
    return true;
  }

  removePlant(x: number, y: number): boolean {
    for (const [id, p] of this.plants) {
      if (p.x === x && p.y === y) {
        this.plants.delete(id);
        this.resourcePoints += 5;
        this.broadcastTick();
        return true;
      }
    }
    return false;
  }

  spawnAnimal(x: number, y: number, type: AnimalType): boolean {
    if (x < 0 || x >= GRID_SIZE || y < 0 || y >= GRID_SIZE) return false;
    const cost = ANIMAL_COST[type];
    if (this.resourcePoints < cost) return false;
    this.resourcePoints -= cost;
    const animal: Animal = {
      id: genId('animal'),
      type,
      x,
      y,
      prevX: x,
      prevY: y,
      health: type === 'herbivore' ? 100 : 120,
      maxHealth: type === 'herbivore' ? 100 : 120,
      stamina: 100,
      maxStamina: 100,
      age: 0,
      maxAge: type === 'herbivore' ? 100 + Math.floor(Math.random() * 50) : 150 + Math.floor(Math.random() * 50),
      state: 'idle',
      targetX: null,
      targetY: null,
      targetId: null,
      recentBehaviors: [],
    };
    this.animals.set(animal.id, animal);
    this.pushBehavior(animal, type === 'herbivore' ? '出生' : '出生');
    this.broadcastTick();
    return true;
  }

  getAnimal(id: string): Animal | null {
    return this.animals.get(id) ?? null;
  }

  selectAnimal(id: string | null): void {
    if (id) {
      const animal = this.getAnimal(id);
      if (animal) {
        eventBus.emit('ecosystem:animalSelected', JSON.parse(JSON.stringify(animal)));
      }
    } else {
      eventBus.emit('ecosystem:animalSelected', null);
    }
  }

  private pushBehavior(animal: Animal, action: string): void {
    animal.recentBehaviors.unshift({ action, timestamp: Date.now() });
    if (animal.recentBehaviors.length > 3) {
      animal.recentBehaviors.pop();
    }
  }

  private broadcastTick(): void {
    eventBus.emit('ecosystem:tick', this.getSnapshot());
  }

  private distance(ax: number, ay: number, bx: number, by: number): number {
    return Math.abs(ax - bx) + Math.abs(ay - by);
  }

  private findNearestPlant(x: number, y: number): Plant | null {
    let best: Plant | null = null;
    let bestDist = Infinity;
    for (const p of this.plants.values()) {
      if (p.energy <= 0) continue;
      const d = this.distance(x, y, p.x, p.y);
      const score = d - p.energy * 0.05;
      if (score < bestDist) {
        bestDist = score;
        best = p;
      }
    }
    if (!best) {
      let bestCell: GridCell | null = null;
      let bestCDist = Infinity;
      for (const row of this.grid) {
        for (const cell of row) {
          if ((cell.type === 'grass' || cell.type === 'berry') && cell.amount > 0) {
            const d = this.distance(x, y, cell.x, cell.y);
            if (d < bestCDist) {
              bestCDist = d;
              bestCell = cell;
            }
          }
        }
      }
      if (bestCell) {
        best = {
          id: `cell_${bestCell.x}_${bestCell.y}`,
          type: bestCell.type === 'berry' ? 'fruitTree' : 'bush',
          x: bestCell.x,
          y: bestCell.y,
          energy: bestCell.amount,
          growthRate: 0,
        };
      }
    }
    return best;
  }

  private findNearestHerbivore(x: number, y: number, excludeId?: string): Animal | null {
    let best: Animal | null = null;
    let bestDist = Infinity;
    for (const a of this.animals.values()) {
      if (a.type !== 'herbivore') continue;
      if (excludeId && a.id === excludeId) continue;
      const d = this.distance(x, y, a.x, a.y);
      if (d < bestDist) {
        bestDist = d;
        best = a;
      }
    }
    return best;
  }

  private findNearestCarnivore(x: number, y: number): Animal | null {
    let best: Animal | null = null;
    let bestDist = Infinity;
    for (const a of this.animals.values()) {
      if (a.type !== 'carnivore') continue;
      const d = this.distance(x, y, a.x, a.y);
      if (d < bestDist) {
        bestDist = d;
        best = a;
      }
    }
    return best;
  }

  private moveToward(animal: Animal, tx: number, ty: number): void {
    animal.prevX = animal.x;
    animal.prevY = animal.y;
    if (animal.x < tx) animal.x++;
    else if (animal.x > tx) animal.x--;
    else if (animal.y < ty) animal.y++;
    else if (animal.y > ty) animal.y--;
    animal.stamina = Math.max(0, animal.stamina - 2);
  }

  private stepHerbivore(animal: Animal): void {
    const threat = this.findNearestCarnivore(animal.x, animal.y);
    if (threat && this.distance(animal.x, animal.y, threat.x, threat.y) <= 2) {
      animal.state = 'fleeing';
      const dx = animal.x - threat.x;
      const dy = animal.y - threat.y;
      let tx = animal.x + Math.sign(dx);
      let ty = animal.y + Math.sign(dy);
      tx = Math.max(0, Math.min(GRID_SIZE - 1, tx));
      ty = Math.max(0, Math.min(GRID_SIZE - 1, ty));
      if (tx !== animal.x || ty !== animal.y) {
        this.moveToward(animal, tx, ty);
        this.pushBehavior(animal, '躲避食肉动物');
      }
      animal.stamina = Math.max(0, animal.stamina - 3);
      return;
    }

    if (animal.stamina < 30) {
      const cell = this.grid[animal.y][animal.x];
      if (cell.type === 'water' && cell.amount > 0) {
        animal.state = 'idle';
        animal.stamina = Math.min(animal.maxStamina, animal.stamina + 15);
        cell.amount = Math.max(0, cell.amount - 5);
        this.pushBehavior(animal, '饮水恢复');
        return;
      }
      const water = this.findNearestResource(animal.x, animal.y, 'water');
      if (water) {
        animal.state = 'moving';
        this.moveToward(animal, water.x, water.y);
        return;
      }
    }

    if (animal.health < animal.maxHealth * 0.8 || animal.stamina > 20) {
      const target = this.findNearestPlant(animal.x, animal.y);
      if (target) {
        animal.targetX = target.x;
        animal.targetY = target.y;
        animal.targetId = target.id;
        if (animal.x === target.x && animal.y === target.y) {
          animal.state = 'eating';
          const plant = this.plants.get(target.id);
          if (plant) {
            const gain = Math.min(plant.energy, 30);
            plant.energy -= gain;
            animal.health = Math.min(animal.maxHealth, animal.health + gain);
            animal.stamina = Math.min(animal.maxStamina, animal.stamina + gain * 0.5);
            this.pushBehavior(animal, plant.type === 'fruitTree' ? '进食浆果' : '进食灌木');
            if (plant.energy <= 0) {
              this.plants.delete(plant.id);
            }
          } else {
            const cell = this.grid[animal.y][animal.x];
            if ((cell.type === 'grass' || cell.type === 'berry') && cell.amount > 0) {
              const gain = Math.min(cell.amount, 20);
              cell.amount -= gain;
              animal.health = Math.min(animal.maxHealth, animal.health + gain * 0.5);
              animal.stamina = Math.min(animal.maxStamina, animal.stamina + gain * 0.3);
              this.pushBehavior(animal, cell.type === 'berry' ? '进食浆果' : '进食青草');
            }
          }
        } else {
          animal.state = 'foraging';
          this.moveToward(animal, target.x, target.y);
        }
        return;
      }
    }

    animal.state = 'idle';
    animal.stamina = Math.min(animal.maxStamina, animal.stamina + 2);
  }

  private findNearestResource(x: number, y: number, type: ResourceType): GridCell | null {
    let best: GridCell | null = null;
    let bestDist = Infinity;
    for (const row of this.grid) {
      for (const cell of row) {
        if (cell.type === type && cell.amount > 0) {
          const d = this.distance(x, y, cell.x, cell.y);
          if (d < bestDist) {
            bestDist = d;
            best = cell;
          }
        }
      }
    }
    return best;
  }

  private stepCarnivore(animal: Animal): void {
    if (animal.stamina < 20) {
      animal.state = 'idle';
      animal.stamina = Math.min(animal.maxStamina, animal.stamina + 5);
      return;
    }

    const target = this.findNearestHerbivore(animal.x, animal.y);
    if (!target) {
      animal.state = 'idle';
      animal.stamina = Math.min(animal.maxStamina, animal.stamina + 3);
      return;
    }

    animal.targetX = target.x;
    animal.targetY = target.y;
    animal.targetId = target.id;

    if (this.distance(animal.x, animal.y, target.x, target.y) <= 1) {
      animal.state = 'hunting';
      const success = Math.random() < 0.6;
      if (success) {
        const gain = Math.min(target.health, 50);
        animal.health = Math.min(animal.maxHealth, animal.health + gain * 0.6);
        animal.stamina = Math.min(animal.maxStamina, animal.stamina + gain * 0.3);
        this.pushBehavior(animal, '捕食成功');
        this.pushBehavior(target, '被捕食');
        const predEvent: PredationEvent = {
          predatorId: animal.id,
          preyId: target.id,
          preyX: target.x,
          preyY: target.y,
          success: true,
        };
        this.animals.delete(target.id);
        eventBus.emit('ecosystem:predation', predEvent);
      } else {
        animal.stamina = Math.max(0, animal.stamina - 15);
        target.stamina = Math.max(0, target.stamina - 10);
        target.health = Math.max(0, target.health - 10);
        this.pushBehavior(animal, '捕食失败');
        this.pushBehavior(target, '躲避成功');
        const predEvent: PredationEvent = {
          predatorId: animal.id,
          preyId: target.id,
          preyX: target.x,
          preyY: target.y,
          success: false,
        };
        eventBus.emit('ecosystem:predation', predEvent);
      }
    } else {
      animal.state = 'hunting';
      this.moveToward(animal, target.x, target.y);
      this.pushBehavior(animal, '追踪猎物');
    }
  }

  tick(): void {
    const toRemove: string[] = [];

    for (const animal of this.animals.values()) {
      animal.prevX = animal.x;
      animal.prevY = animal.y;
      if (animal.type === 'herbivore') {
        this.stepHerbivore(animal);
      } else {
        this.stepCarnivore(animal);
      }
      animal.age++;
      if (animal.age >= animal.maxAge || animal.health <= 0) {
        toRemove.push(animal.id);
      }
    }

    for (const id of toRemove) {
      this.animals.delete(id);
    }

    for (const plant of this.plants.values()) {
      plant.energy = Math.min(PLANT_ENERGY[plant.type], plant.energy + plant.growthRate);
    }

    for (const row of this.grid) {
      for (const cell of row) {
        if (cell.amount > 0 && cell.type !== 'empty') {
          if (cell.type === 'water') {
            cell.amount = Math.min(120, cell.amount + 1);
          } else {
            cell.amount = Math.min(100, cell.amount + 0.5);
          }
        }
      }
    }

    this.resourcePoints = Math.min(200, this.resourcePoints + 0.5);

    this.broadcastTick();
  }
}

export const ecosystem = new Ecosystem();
