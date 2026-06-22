import { v4 as uuidv4 } from 'uuid';
import { BioSimulator, Resource, Creature } from './BioSimulator';

type ResourceType = 'plant' | 'mineral' | 'water';

interface StatsRecord {
  population: number;
  avgEnergy: number;
  resourceCount: number;
}

const PLANT_ENERGY_VALUE = 30;
const MINERAL_ENERGY_VALUE = 15;
const WATER_ENERGY_VALUE = 20;

export class World {
  public gridSize: number = 60;
  public cellSize: number = 10;
  public simulator: BioSimulator;
  public tick: number = 0;
  public isPaused: boolean = false;
  public speed: number = 1;
  public resourceRegenTimer: number = 0;
  public resourceRegenInterval: number = 10;
  public statsHistory: StatsRecord[] = [];

  private readonly maxHistoryLength: number = 100;
  private readonly initialCreatureCount: number = 50;
  private readonly resourceDensity: { plant: number; mineral: number; water: number } = {
    plant: 0.3,
    mineral: 0.15,
    water: 0.2,
  };

  get worldWidth(): number {
    return this.gridSize * this.cellSize;
  }

  get worldHeight(): number {
    return this.gridSize * this.cellSize;
  }

  constructor() {
    this.simulator = new BioSimulator(this.worldWidth, this.worldHeight);
  }

  init(): void {
    this.simulator = new BioSimulator(this.worldWidth, this.worldHeight);
    this.tick = 0;
    this.resourceRegenTimer = 0;
    this.statsHistory = [];

    this.generateResources();
    this.generateInitialCreatures();
  }

  update(deltaTime: number): void {
    if (this.isPaused) return;

    const scaledDelta = deltaTime * this.speed;
    this.simulator.update(scaledDelta);

    this.resourceRegenTimer += scaledDelta;
    if (this.resourceRegenTimer >= this.resourceRegenInterval) {
      this.resourceRegenTimer = 0;
      if (Math.random() < 0.3) {
        this.spawnRandomResource();
      }
    }

    this.recordStats();
    this.tick++;
  }

  togglePause(): void {
    this.isPaused = !this.isPaused;
  }

  setSpeed(speed: number): void {
    this.speed = Math.max(0.1, Math.min(10, speed));
  }

  reset(): void {
    this.tick = 0;
    this.isPaused = false;
    this.speed = 1;
    this.resourceRegenTimer = 0;
    this.statsHistory = [];
    this.init();
  }

  getStats(): { population: number; avgEnergy: number; resourceCount: number; tick: number } {
    const creatures = this.simulator.creatures;
    const population = creatures.length;
    const avgEnergy = population > 0
      ? creatures.reduce((sum, c) => sum + c.energy, 0) / population
      : 0;
    const resourceCount = this.simulator.resources.length;

    return {
      population,
      avgEnergy,
      resourceCount,
      tick: this.tick,
    };
  }

  getCreatureAt(x: number, y: number): Creature | null {
    const clickRadius = 10;
    let closest: Creature | null = null;
    let closestDist = Infinity;

    for (const creature of this.simulator.creatures) {
      const dx = creature.x - x;
      const dy = creature.y - y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < clickRadius && dist < closestDist) {
        closestDist = dist;
        closest = creature;
      }
    }

    return closest;
  }

  private generateResources(): void {
    const totalCells = this.gridSize * this.gridSize;

    const plantCount = Math.floor(totalCells * this.resourceDensity.plant);
    const mineralCount = Math.floor(totalCells * this.resourceDensity.mineral);
    const waterCount = Math.floor(totalCells * this.resourceDensity.water);

    this.spawnResourcesOfType('plant', plantCount);
    this.spawnResourcesOfType('mineral', mineralCount);
    this.spawnResourcesOfType('water', waterCount);
  }

  private spawnResourcesOfType(type: ResourceType, count: number): void {
    for (let i = 0; i < count; i++) {
      const x = Math.random() * this.worldWidth;
      const y = Math.random() * this.worldHeight;
      const value = type === 'plant' ? PLANT_ENERGY_VALUE :
                    type === 'mineral' ? MINERAL_ENERGY_VALUE :
                    WATER_ENERGY_VALUE;
      const resource: Resource = {
        id: uuidv4(),
        x,
        y,
        type,
        value,
      };
      this.simulator.addResource(resource);
    }
  }

  private generateInitialCreatures(): void {
    for (let i = 0; i < this.initialCreatureCount; i++) {
      const x = Math.random() * this.worldWidth;
      const y = Math.random() * this.worldHeight;
      const creature = Creature.createRandom(x, y);
      this.simulator.addCreature(creature);
    }
  }

  private spawnRandomResource(): void {
    const types: ResourceType[] = ['plant', 'mineral', 'water'];
    const type = types[Math.floor(Math.random() * types.length)];
    const x = Math.random() * this.worldWidth;
    const y = Math.random() * this.worldHeight;
    const value = type === 'plant' ? PLANT_ENERGY_VALUE :
                  type === 'mineral' ? MINERAL_ENERGY_VALUE :
                  WATER_ENERGY_VALUE;
    const resource: Resource = {
      id: uuidv4(),
      x,
      y,
      type,
      value,
    };
    this.simulator.addResource(resource);
  }

  private recordStats(): void {
    const stats = this.getStats();
    this.statsHistory.push({
      population: stats.population,
      avgEnergy: stats.avgEnergy,
      resourceCount: stats.resourceCount,
    });

    if (this.statsHistory.length > this.maxHistoryLength) {
      this.statsHistory.shift();
    }
  }
}
