import { HexCoord, Nest, NestType, Vec2, ResourceNode, PheromoneCell } from '../types';
import { AntAgent, PheromoneMap, AntWorldContext } from './ant_agent';
import { hexToPixel, pixelToHex, hexKey, HEX_SIZE, hexDistance } from './hex_grid';
import { eventBus } from '../events/event_bus';

let nestIdCounter = 0;
let resourceIdCounter = 0;

function createNestId(): string {
  return `nest_${++nestIdCounter}`;
}

function createResourceId(): string {
  return `resource_${++resourceIdCounter}`;
}

export class PheromoneMapImpl implements PheromoneMap {
  private cells: Map<string, PheromoneCell> = new Map();
  private evaporationRate: number = 0.15;

  private getDefaultCell(): PheromoneCell {
    return { toFood: 0, toHome: 0, danger: 0 };
  }

  getCell(hex: HexCoord): PheromoneCell {
    const k = hexKey(hex);
    return this.cells.get(k) || this.getDefaultCell();
  }

  depositToFood(hex: HexCoord, amount: number): void {
    const k = hexKey(hex);
    const cell = this.cells.get(k) || this.getDefaultCell();
    cell.toFood = Math.min(10, cell.toFood + amount);
    this.cells.set(k, cell);
  }

  depositToHome(hex: HexCoord, amount: number): void {
    const k = hexKey(hex);
    const cell = this.cells.get(k) || this.getDefaultCell();
    cell.toHome = Math.min(10, cell.toHome + amount);
    this.cells.set(k, cell);
  }

  depositDanger(hex: HexCoord, amount: number): void {
    const k = hexKey(hex);
    const cell = this.cells.get(k) || this.getDefaultCell();
    cell.danger = Math.min(10, cell.danger + amount);
    this.cells.set(k, cell);
  }

  evaporate(deltaTime: number): void {
    const factor = Math.exp(-this.evaporationRate * Math.max(deltaTime, 0.016));
    this.cells.forEach((cell, key) => {
      cell.toFood *= factor;
      cell.toHome *= factor;
      cell.danger *= factor;
      if (cell.toFood < 0.01 && cell.toHome < 0.01 && cell.danger < 0.01) {
        this.cells.delete(key);
      }
    });
  }

  getAllCells(): Map<string, PheromoneCell> {
    return this.cells;
  }
}

export class ColonyManager {
  nests: Map<string, Nest> = new Map();
  ants: Map<string, AntAgent> = new Map();
  resources: Map<string, ResourceNode> = new Map();
  pheromoneMap: PheromoneMapImpl;
  globalFood: number = 100;
  foodGatheredLastSecond: number = 0;
  foodGatherRate: number = 0;
  private rateAccumulator: number = 0;
  private antUpdateCursor: number = 0;
  private antsPerFrame: number = 50;

  constructor() {
    this.pheromoneMap = new PheromoneMapImpl();
    this.initDefaultColony();
  }

  private initDefaultColony(): void {
    this.createNest('worker_nest', { q: 0, r: 0 });
    this.createNest('soldier_nest', { q: 2, r: 0 });
    this.createResource({ q: -4, r: 2 }, 200);
    this.createResource({ q: 5, r: -1 }, 150);
    this.createResource({ q: 3, r: 4 }, 180);
    this.createResource({ q: -3, r: -3 }, 120);
  }

  createNest(type: NestType, hexCoord: HexCoord): Nest {
    const id = createNestId();
    const position = hexToPixel(hexCoord);
    const nest: Nest = {
      id,
      type,
      position,
      hexCoord,
      level: 1,
      capacity: type === 'resource_point' ? 500 : 100,
      foodStored: 0,
      spawnQueue: 0,
      lastSpawnTime: 0,
      selected: false,
      upgrading: false,
      upgradeProgress: 0,
      health: type === 'resource_point' ? 200 : 100,
      maxHealth: type === 'resource_point' ? 200 : 100,
    };
    this.nests.set(id, nest);

    if (type === 'worker_nest') {
      for (let i = 0; i < 8; i++) {
        this.spawnAnt(id, 'worker');
      }
    } else if (type === 'soldier_nest') {
      for (let i = 0; i < 3; i++) {
        this.spawnAnt(id, 'soldier');
      }
    }

    eventBus.emit('colony:spawn', { nestId: id, type });
    return nest;
  }

  createResource(hexCoord: HexCoord, amount: number): ResourceNode {
    const id = createResourceId();
    const position = hexToPixel(hexCoord);
    const resource: ResourceNode = {
      id,
      position,
      hexCoord,
      amount,
      maxAmount: amount,
      type: 'food',
    };
    this.resources.set(id, resource);
    return resource;
  }

  spawnAnt(nestId: string, type: 'worker' | 'soldier'): AntAgent | null {
    const nest = this.nests.get(nestId);
    if (!nest) return null;

    const cost = type === 'worker' ? 10 : 25;
    if (this.globalFood < cost) return null;

    this.globalFood -= cost;
    const levelBonus = 1 + (nest.level - 1) * 0.1;
    const angle = Math.random() * Math.PI * 2;
    const spawnPos = {
      x: nest.position.x + Math.cos(angle) * 20,
      y: nest.position.y + Math.sin(angle) * 20,
    };
    const ant = new AntAgent(type, spawnPos, nestId, levelBonus);
    this.ants.set(ant.id, ant);
    nest.lastSpawnTime = performance.now() / 1000;
    eventBus.emit('colony:spawn', { antId: ant.id, type });
    return ant;
  }

  getWorldContext(alertZones: Array<{ position: Vec2; radius: number }>): AntWorldContext {
    return {
      pheromoneMap: this.pheromoneMap,
      getNestPosition: (id: string) => this.nests.get(id)?.position || null,
      getNestFoodLevel: (id: string) => this.nests.get(id)?.foodStored || 0,
      findNearestResource: (pos: Vec2, type: 'food' | 'material') => this.findNearestResource(pos, type),
      findNearestEnemy: () => null,
      alertZones,
      getExploreRadius: () => 300 + this.getAverageNestLevel() * 100,
    };
  }

  findNearestResource(pos: Vec2, type: 'food' | 'material'): ResourceNode | null {
    let nearest: ResourceNode | null = null;
    let minDist = Infinity;
    this.resources.forEach((r) => {
      if (r.type !== type || r.amount <= 0) return;
      const d = Math.hypot(r.position.x - pos.x, r.position.y - pos.y);
      if (d < minDist && d < 500) {
        minDist = d;
        nearest = r;
      }
    });
    return nearest;
  }

  update(deltaTime: number, currentTime: number, alertZones: Array<{ position: Vec2; radius: number }>): void {
    const worldCtx = this.getWorldContext(alertZones);
    const antArray = Array.from(this.ants.values());
    const totalAnts = antArray.length;
    const startIdx = this.antUpdateCursor;
    const endIdx = Math.min(startIdx + this.antsPerFrame, totalAnts);

    for (let i = startIdx; i < endIdx; i++) {
      antArray[i].update(deltaTime, worldCtx, currentTime);
      this.checkAntDelivery(antArray[i]);
    }

    if (endIdx >= totalAnts) {
      this.antUpdateCursor = 0;
    } else {
      this.antUpdateCursor = endIdx;
    }

    for (let i = 0; i < startIdx && i < this.antsPerFrame; i++) {
      if (i < totalAnts) {
        antArray[i].update(deltaTime, worldCtx, currentTime);
        this.checkAntDelivery(antArray[i]);
      }
    }

    this.updateNests(deltaTime, currentTime);
    this.pheromoneMap.evaporate(deltaTime);

    this.rateAccumulator += deltaTime;
    if (this.rateAccumulator >= 1) {
      this.foodGatherRate = this.foodGatheredLastSecond / this.rateAccumulator;
      this.foodGatheredLastSecond = 0;
      this.rateAccumulator = 0;
    }
  }

  private checkAntDelivery(ant: AntAgent): void {
    if (!ant.carrying) return;
    const nest = this.nests.get(ant.homeNestId);
    if (!nest) return;
    const d = Math.hypot(ant.position.x - nest.position.x, ant.position.y - nest.position.y);
    if (d < 30) {
      ant.carrying = false;
      ant.carryingAmount = 0;
      this.globalFood += 5;
      this.foodGatheredLastSecond += 5;
      eventBus.emit('colony:resource_update', { food: this.globalFood, delta: 5 });
    }
  }

  private updateNests(deltaTime: number, currentTime: number): void {
    this.nests.forEach((nest) => {
      if (nest.upgrading) {
        nest.upgradeProgress += deltaTime;
        if (nest.upgradeProgress >= 2) {
          nest.upgrading = false;
          nest.upgradeProgress = 0;
          nest.level++;
          nest.capacity = Math.floor(nest.capacity * 1.5);
          this.applyNestLevelBonus(nest);
          eventBus.emit('colony:upgrade', { nestId: nest.id, newLevel: nest.level });
        }
      }

      const upgradeThreshold = 50 * nest.level * nest.level;
      if (!nest.upgrading && nest.type !== 'resource_point' && this.globalFood >= upgradeThreshold) {
        this.globalFood -= upgradeThreshold;
        nest.upgrading = true;
        nest.upgradeProgress = 0;
      }

      if (nest.type === 'worker_nest' && !nest.upgrading) {
        const spawnInterval = Math.max(5, 15 - nest.level * 2);
        if (currentTime - nest.lastSpawnTime > spawnInterval && this.ants.size < 300) {
          this.spawnAnt(nest.id, 'worker');
        }
      }
    });
  }

  private applyNestLevelBonus(nest: Nest): void {
    const levelBonus = 1 + (nest.level - 1) * 0.1;
    this.ants.forEach((ant) => {
      if (ant.homeNestId === nest.id) {
        ant.applyLevelBonus(levelBonus);
      }
    });
  }

  getAverageNestLevel(): number {
    if (this.nests.size === 0) return 1;
    let total = 0;
    this.nests.forEach((n) => (total += n.level));
    return total / this.nests.size;
  }

  getTotalAntCount(): number {
    return this.ants.size;
  }

  getWorkerCount(): number {
    let count = 0;
    this.ants.forEach((a) => {
      if (a.type === 'worker') count++;
    });
    return count;
  }

  getSoldierCount(): number {
    let count = 0;
    this.ants.forEach((a) => {
      if (a.type === 'soldier') count++;
    });
    return count;
  }

  getEfficiencyIndex(): number {
    const total = this.ants.size;
    if (total === 0) return 0;
    return (this.foodGatherRate / total) * 10;
  }

  getTotalNestLevel(): number {
    let total = 0;
    this.nests.forEach((n) => (total += n.level));
    return total;
  }
}
