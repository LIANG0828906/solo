import { eventBus, EventType, PredationEventPayload } from '../events/eventBus';

export const GRID_SIZE = 8;

export type ResourceType = 'water' | 'grass' | 'berry' | 'empty';
export type PlantType = 'bush' | 'fruitTree';
export type AnimalType = 'herbivore' | 'carnivore';
export type BehaviorState = 'idle' | 'foraging' | 'fleeing' | 'hunting' | 'eating' | 'moving' | 'pursuing';

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
  maxEnergy: number;
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
  avgHerbivoreAge: number;
  avgCarnivoreAge: number;
  waterAmount: number;
  grassAmount: number;
  berryAmount: number;
  resourcePoints: number;
  timestamp: number;
}

interface PlantCandidate {
  plant: Plant | null;
  cell: GridCell | null;
  x: number;
  y: number;
  energy: number;
  distance: number;
  priority: number;
}

interface PreyCandidate {
  animal: Animal;
  distance: number;
  staminaCost: number;
  successChance: number;
  priority: number;
}

const PLANT_ENERGY: Record<PlantType, number> = {
  bush: 30,
  fruitTree: 60,
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
const MAX_PURSUIT_DISTANCE = 5;
const STAMINA_PER_MOVE = 3;

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

  constructor() {
    this.initGrid();
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    eventBus.on(EventType.UI_PLACE_PLANT, (payload) => {
      this.placePlant(payload.x, payload.y, payload.plantType as PlantType);
    });
    eventBus.on(EventType.UI_REMOVE_PLANT, (payload) => {
      this.removePlant(payload.x, payload.y);
    });
    eventBus.on(EventType.UI_SPAWN_ANIMAL, (payload) => {
      this.spawnAnimal(payload.x, payload.y, payload.animalType as AnimalType);
    });
    eventBus.on(EventType.UI_SELECT_ANIMAL, (payload) => {
      this.selectAnimal(payload);
    });
    eventBus.on(EventType.UI_CANVAS_CLICK, (payload) => {
      this.handleCanvasClick(payload.x, payload.y);
    });
  }

  private initGrid(): void {
    this.grid = [];
    for (let y = 0; y < GRID_SIZE; y++) {
      const row: GridCell[] = [];
      for (let x = 0; x < GRID_SIZE; x++) {
        let type: ResourceType = 'empty';
        let amount = 0;
        const r = Math.random();
        if (r < 0.12) {
          type = 'water';
          amount = 80 + Math.floor(Math.random() * 40);
        } else if (r < 0.45) {
          type = 'grass';
          amount = 40 + Math.floor(Math.random() * 60);
        } else if (r < 0.65) {
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
    this.broadcastState();
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

    let water = 0, grass = 0, berry = 0;
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
    const avgHA = herbivores.length
      ? herbivores.reduce((s, a) => s + a.age, 0) / herbivores.length
      : 0;
    const avgCA = carnivores.length
      ? carnivores.reduce((s, a) => s + a.age, 0) / carnivores.length
      : 0;

    return {
      plantCount: plantsArr.length,
      herbivoreCount: herbivores.length,
      carnivoreCount: carnivores.length,
      avgHerbivoreLifespan: Math.round(avgHL),
      avgCarnivoreLifespan: Math.round(avgCL),
      avgHerbivoreAge: Math.round(avgHA),
      avgCarnivoreAge: Math.round(avgCA),
      waterAmount: Math.round(water),
      grassAmount: Math.round(grass),
      berryAmount: Math.round(berry),
      resourcePoints: Math.floor(this.resourcePoints),
      timestamp: Date.now(),
    };
  }

  private recordHistory(): void {
    const snap = this.getSnapshot();
    this.history.push(snap);
    if (this.history.length > HISTORY_MAX) {
      this.history.shift();
    }
    eventBus.emit(EventType.ECOSYSTEM_SNAPSHOT, this.history.slice());
  }

  private broadcastTick(): void {
    eventBus.emit(EventType.ECOSYSTEM_TICK, this.getSnapshot());
  }

  private broadcastState(): void {
    eventBus.emit(EventType.ECOSYSTEM_STATE, {
      grid: this.grid,
      plants: Array.from(this.plants.values()),
      animals: Array.from(this.animals.values()),
      resourcePoints: this.resourcePoints,
      snapshot: this.getSnapshot(),
    });
  }

  private handleCanvasClick(x: number, y: number): void {
    // Default behavior can be extended
  }

  placePlant(x: number, y: number, type: PlantType): boolean {
    if (x < 0 || x >= GRID_SIZE || y < 0 || y >= GRID_SIZE) return false;
    const cost = PLANT_COST[type];
    if (this.resourcePoints < cost) return false;
    for (const p of this.plants.values()) {
      if (p.x === x && p.y === y) return false;
    }
    this.resourcePoints -= cost;
    const maxEnergy = PLANT_ENERGY[type];
    const plant: Plant = {
      id: genId('plant'),
      type,
      x,
      y,
      energy: maxEnergy,
      maxEnergy,
      growthRate: type === 'bush' ? 2 : 3,
    };
    this.plants.set(plant.id, plant);
    this.broadcastTick();
    this.broadcastState();
    return true;
  }

  removePlant(x: number, y: number): boolean {
    for (const [id, p] of this.plants) {
      if (p.x === x && p.y === y) {
        this.plants.delete(id);
        this.resourcePoints += 5;
        this.broadcastTick();
        this.broadcastState();
        return true;
      }
    }
    return false;
  }

  spawnAnimal(x: number, y: number, type: AnimalType): boolean {
    if (x < 0 || x >= GRID_SIZE || y < 0 || y >= GRID_SIZE) return false;
    const cost = ANIMAL_COST[type];
    if (this.resourcePoints < cost) return false;
    for (const a of this.animals.values()) {
      if (a.x === x && a.y === y) return false;
    }
    this.resourcePoints -= cost;
    const maxHealth = type === 'herbivore' ? 100 : 120;
    const animal: Animal = {
      id: genId('animal'),
      type,
      x,
      y,
      prevX: x,
      prevY: y,
      health: maxHealth,
      maxHealth,
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
    this.pushBehavior(animal, '出生');
    this.broadcastTick();
    this.broadcastState();
    return true;
  }

  getAnimal(id: string): Animal | null {
    return this.animals.get(id) ?? null;
  }

  selectAnimal(id: string | null): void {
    if (id) {
      const animal = this.getAnimal(id);
      if (animal) {
        eventBus.emit(EventType.ECOSYSTEM_ANIMAL_SELECTED, JSON.parse(JSON.stringify(animal)));
      }
    } else {
      eventBus.emit(EventType.ECOSYSTEM_ANIMAL_SELECTED, null);
    }
  }

  private pushBehavior(animal: Animal, action: string): void {
    animal.recentBehaviors.unshift({ action, timestamp: Date.now() });
    if (animal.recentBehaviors.length > 3) {
      animal.recentBehaviors.pop();
    }
  }

  private distance(ax: number, ay: number, bx: number, by: number): number {
    return Math.abs(ax - bx) + Math.abs(ay - by);
  }

  private findBestPlantForHerbivore(animal: Animal): PlantCandidate | null {
    const candidates: PlantCandidate[] = [];

    for (const p of this.plants.values()) {
      if (p.energy <= 5) continue;
      const d = this.distance(animal.x, animal.y, p.x, p.y);
      const energyBonus = p.type === 'fruitTree' ? 2.0 : 1.2;
      const distanceFactor = d <= 3 ? 1.0 : d <= 5 ? 0.8 : 0.5;
      const priority = (p.energy * energyBonus * distanceFactor) / Math.max(1, d * 0.7);
      candidates.push({
        plant: p,
        cell: null,
        x: p.x,
        y: p.y,
        energy: p.energy,
        distance: d,
        priority,
      });
    }

    for (const row of this.grid) {
      for (const cell of row) {
        if ((cell.type === 'grass' || cell.type === 'berry') && cell.amount > 5) {
          const d = this.distance(animal.x, animal.y, cell.x, cell.y);
          const energyBonus = cell.type === 'berry' ? 2.2 : 1.0;
          const distanceFactor = d <= 3 ? 1.0 : d <= 5 ? 0.8 : 0.5;
          const priority = (cell.amount * energyBonus * distanceFactor) / Math.max(1, d * 0.7);
          candidates.push({
            plant: null,
            cell,
            x: cell.x,
            y: cell.y,
            energy: cell.amount,
            distance: d,
            priority,
          });
        }
      }
    }

    if (candidates.length === 0) return null;
    candidates.sort((a, b) => b.priority - a.priority);
    return candidates[0];
  }

  private findBestPreyForCarnivore(animal: Animal): PreyCandidate | null {
    const candidates: PreyCandidate[] = [];

    for (const a of this.animals.values()) {
      if (a.type !== 'herbivore') continue;
      const d = this.distance(animal.x, animal.y, a.x, a.y);
      if (d > MAX_PURSUIT_DISTANCE) continue;

      const staminaCost = d * STAMINA_PER_MOVE;
      if (animal.stamina < staminaCost) continue;

      const healthFactor = a.health / a.maxHealth;
      const distanceFactor = 1 - (d / MAX_PURSUIT_DISTANCE);
      const staminaFactor = animal.stamina / animal.maxStamina;
      const successChance = 0.3 + distanceFactor * 0.4 + staminaFactor * 0.2 - healthFactor * 0.1;
      const priority = successChance * (a.health * 0.5) / Math.max(1, staminaCost);

      candidates.push({
        animal: a,
        distance: d,
        staminaCost,
        successChance,
        priority,
      });
    }

    if (candidates.length === 0) return null;
    candidates.sort((a, b) => b.priority - a.priority);
    return candidates[0];
  }

  private findNearestThreat(animal: Animal): Animal | null {
    let best: Animal | null = null;
    let bestDist = Infinity;
    for (const a of this.animals.values()) {
      if (a.type !== 'carnivore') continue;
      const d = this.distance(animal.x, animal.y, a.x, a.y);
      if (d < bestDist && d <= 3) {
        bestDist = d;
        best = a;
      }
    }
    return best;
  }

  private findNearestWater(animal: Animal): GridCell | null {
    let best: GridCell | null = null;
    let bestDist = Infinity;
    for (const row of this.grid) {
      for (const cell of row) {
        if (cell.type === 'water' && cell.amount > 10) {
          const d = this.distance(animal.x, animal.y, cell.x, cell.y);
          if (d < bestDist) {
            bestDist = d;
            best = cell;
          }
        }
      }
    }
    return best;
  }

  private moveToward(animal: Animal, tx: number, ty: number): void {
    animal.prevX = animal.x;
    animal.prevY = animal.y;
    const dx = tx - animal.x;
    const dy = ty - animal.y;
    if (Math.abs(dx) >= Math.abs(dy) && dx !== 0) {
      animal.x += Math.sign(dx);
    } else if (dy !== 0) {
      animal.y += Math.sign(dy);
    }
    animal.stamina = Math.max(0, animal.stamina - STAMINA_PER_MOVE);
  }

  private fleeFrom(animal: Animal, threatX: number, threatY: number): void {
    animal.prevX = animal.x;
    animal.prevY = animal.y;
    const dx = animal.x - threatX;
    const dy = animal.y - threatY;
    let tx = animal.x + Math.sign(dx);
    let ty = animal.y + Math.sign(dy);
    tx = Math.max(0, Math.min(GRID_SIZE - 1, tx));
    ty = Math.max(0, Math.min(GRID_SIZE - 1, ty));

    if (tx !== animal.x || ty !== animal.y) {
      if (Math.abs(dx) >= Math.abs(dy)) {
        animal.x = tx;
      } else {
        animal.y = ty;
      }
    }
    animal.stamina = Math.max(0, animal.stamina - STAMINA_PER_MOVE - 1);
  }

  private stepHerbivore(animal: Animal): void {
    const threat = this.findNearestThreat(animal);
    if (threat) {
      animal.state = 'fleeing';
      this.fleeFrom(animal, threat.x, threat.y);
      this.pushBehavior(animal, '躲避食肉动物');
      return;
    }

    if (animal.stamina < 20) {
      const currentCell = this.grid[animal.y][animal.x];
      if (currentCell.type === 'water' && currentCell.amount > 10) {
        animal.state = 'idle';
        animal.stamina = Math.min(animal.maxStamina, animal.stamina + 25);
        currentCell.amount = Math.max(0, currentCell.amount - 8);
        this.pushBehavior(animal, '饮水恢复');
        animal.targetX = null;
        animal.targetY = null;
        animal.targetId = null;
        return;
      }
      const water = this.findNearestWater(animal);
      if (water) {
        animal.state = 'moving';
        animal.targetX = water.x;
        animal.targetY = water.y;
        animal.targetId = null;
        this.moveToward(animal, water.x, water.y);
        this.pushBehavior(animal, '前往水源');
        return;
      }
    }

    if (animal.targetX !== null && animal.targetY !== null) {
      if (animal.x !== animal.targetX || animal.y !== animal.targetY) {
        animal.state = 'foraging';
        this.moveToward(animal, animal.targetX, animal.targetY);
        return;
      }
    }

    const best = this.findBestPlantForHerbivore(animal);
    if (best) {
      animal.targetX = best.x;
      animal.targetY = best.y;
      animal.targetId = best.plant?.id ?? `cell_${best.x}_${best.y}`;

      if (animal.x === best.x && animal.y === best.y) {
        animal.state = 'eating';
        if (best.plant) {
          const gain = Math.min(best.plant.energy, 35);
          best.plant.energy -= gain;
          animal.health = Math.min(animal.maxHealth, animal.health + gain);
          animal.stamina = Math.min(animal.maxStamina, animal.stamina + gain * 0.4);
          const foodType = best.plant.type === 'fruitTree' ? '浆果' : '灌木';
          this.pushBehavior(animal, `进食${foodType}`);
          if (best.plant.energy <= 0) {
            this.plants.delete(best.plant.id);
          }
          animal.targetX = null;
          animal.targetY = null;
          animal.targetId = null;
        } else if (best.cell) {
          const gain = Math.min(best.cell.amount, 25);
          best.cell.amount -= gain;
          animal.health = Math.min(animal.maxHealth, animal.health + gain * 0.6);
          animal.stamina = Math.min(animal.maxStamina, animal.stamina + gain * 0.3);
          const foodType = best.cell.type === 'berry' ? '浆果' : '青草';
          this.pushBehavior(animal, `进食${foodType}`);
          if (best.cell.amount <= 5) {
            animal.targetX = null;
            animal.targetY = null;
            animal.targetId = null;
          }
        }
      } else {
        animal.state = 'foraging';
        this.moveToward(animal, best.x, best.y);
        const actionName = best.plant
          ? best.plant.type === 'fruitTree'
            ? '前往高能量浆果'
            : '前往灌木'
          : best.cell?.type === 'berry'
            ? '前往浆果丛'
            : '前往草地';
        this.pushBehavior(animal, actionName);
      }
      return;
    }

    animal.state = 'idle';
    animal.stamina = Math.min(animal.maxStamina, animal.stamina + 5);
    animal.targetX = null;
    animal.targetY = null;
    animal.targetId = null;
  }

  private stepCarnivore(animal: Animal): void {
    if (animal.stamina < 15) {
      animal.state = 'idle';
      animal.stamina = Math.min(animal.maxStamina, animal.stamina + 8);
      animal.targetX = null;
      animal.targetY = null;
      animal.targetId = null;
      this.pushBehavior(animal, '休息恢复');
      return;
    }

    const bestPrey = this.findBestPreyForCarnivore(animal);
    if (!bestPrey) {
      animal.state = 'idle';
      animal.stamina = Math.min(animal.maxStamina, animal.stamina + 4);
      animal.targetX = null;
      animal.targetY = null;
      animal.targetId = null;
      return;
    }

    const prey = bestPrey.animal;
    animal.targetX = prey.x;
    animal.targetY = prey.y;
    animal.targetId = prey.id;

    if (bestPrey.distance <= 1) {
      animal.state = 'hunting';
      const success = Math.random() < bestPrey.successChance;

      if (success) {
        const gain = Math.min(prey.health, 60);
        animal.health = Math.min(animal.maxHealth, animal.health + gain * 0.7);
        animal.stamina = Math.min(animal.maxStamina, animal.stamina + gain * 0.3);
        this.pushBehavior(animal, '捕食成功');
        this.pushBehavior(prey, '被捕食');

        const predEvent: PredationEventPayload = {
          predatorId: animal.id,
          preyId: prey.id,
          preyX: prey.x,
          preyY: prey.y,
          predatorX: animal.x,
          predatorY: animal.y,
          success: true,
        };
        this.animals.delete(prey.id);
        eventBus.emit(EventType.ECOSYSTEM_PREDATION, predEvent);
      } else {
        animal.stamina = Math.max(0, animal.stamina - 20);
        prey.stamina = Math.max(0, prey.stamina - 15);
        prey.health = Math.max(1, prey.health - 15);
        this.pushBehavior(animal, '捕食失败');
        this.pushBehavior(prey, '躲避成功');

        const predEvent: PredationEventPayload = {
          predatorId: animal.id,
          preyId: prey.id,
          preyX: prey.x,
          preyY: prey.y,
          predatorX: animal.x,
          predatorY: animal.y,
          success: false,
        };
        eventBus.emit(EventType.ECOSYSTEM_PREDATION, predEvent);
      }
    } else if (bestPrey.priority > 0.5 && animal.stamina > bestPrey.staminaCost) {
      animal.state = 'pursuing';
      this.moveToward(animal, prey.x, prey.y);
      this.pushBehavior(animal, `追击猎物(${bestPrey.distance}格)`);
    } else {
      animal.state = 'idle';
      animal.stamina = Math.min(animal.maxStamina, animal.stamina + 3);
      this.pushBehavior(animal, '观察环境');
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
      plant.energy = Math.min(plant.maxEnergy, plant.energy + plant.growthRate);
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
    this.broadcastState();
  }
}

export const ecosystem = new Ecosystem();
