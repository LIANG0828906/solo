export class EventEmitter {
  private listeners: Map<string, Set<Function>> = new Map();

  on(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  off(event: string, callback: Function): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.delete(callback);
    }
  }

  emit(event: string, data?: any): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach((callback) => callback(data));
    }
  }
}

export const eventBus = new EventEmitter();

export interface Plant {
  id: string;
  x: number;
  y: number;
  size: number;
  pulsePhase: number;
  baseSize: number;
}

export interface Creature {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  paused: boolean;
}

export interface SandGrain {
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
}

const CANVAS_WIDTH = 600;
const CANVAS_HEIGHT = 400;
const PLANT_COUNT = 4;
const CREATURE_COUNT = 3;
const SAND_GRAIN_COUNT = 80;
const PULSE_PERIOD = 1500;
const CREATURE_SPEED = 1;

export class EcosystemService {
  private plants: Plant[] = [];
  private creatures: Creature[] = [];
  private sandGrains: SandGrain[] = [];
  private lastTime: number = 0;

  constructor() {
    this.initializePlants();
    this.initializeCreatures();
    this.initializeSand();
  }

  private initializePlants(): void {
    const spacing = CANVAS_WIDTH / (PLANT_COUNT + 1);
    for (let i = 0; i < PLANT_COUNT; i++) {
      this.plants.push({
        id: `plant-${i}`,
        x: spacing * (i + 1),
        y: CANVAS_HEIGHT - 60,
        size: 12,
        baseSize: 12,
        pulsePhase: Math.random() * Math.PI * 2,
      });
    }
  }

  private initializeCreatures(): void {
    for (let i = 0; i < CREATURE_COUNT; i++) {
      const angle = Math.random() * Math.PI * 2;
      this.creatures.push({
        id: `creature-${i}`,
        x: 50 + Math.random() * (CANVAS_WIDTH - 100),
        y: 50 + Math.random() * (CANVAS_HEIGHT - 150),
        vx: Math.cos(angle) * CREATURE_SPEED,
        vy: Math.sin(angle) * CREATURE_SPEED,
        color: '#00FF88',
        paused: false,
      });
    }
  }

  private initializeSand(): void {
    for (let i = 0; i < SAND_GRAIN_COUNT; i++) {
      const greenValue = Math.floor(58 + Math.random() * 50);
      this.sandGrains.push({
        x: Math.random() * CANVAS_WIDTH,
        y: CANVAS_HEIGHT - 30 + Math.random() * 25,
        width: 3 + Math.random() * 2,
        height: 3 + Math.random() * 2,
        color: `rgb(${Math.floor(greenValue * 0.6)}, ${greenValue}, ${Math.floor(greenValue * 0.6)})`,
      });
    }
  }

  update(currentTime: number): void {
    const deltaTime = this.lastTime ? currentTime - this.lastTime : 16;
    this.lastTime = currentTime;

    this.plants.forEach((plant) => {
      const pulse = Math.sin((currentTime / PULSE_PERIOD) * Math.PI * 2 + plant.pulsePhase);
      plant.size = plant.baseSize + pulse * 2;
    });

    this.creatures.forEach((creature) => {
      if (creature.paused) return;

      creature.x += creature.vx;
      creature.y += creature.vy;

      if (creature.x <= 2 || creature.x >= CANVAS_WIDTH - 4) {
        creature.vx *= -1;
        creature.x = Math.max(2, Math.min(CANVAS_WIDTH - 4, creature.x));
      }
      if (creature.y <= 2 || creature.y >= CANVAS_HEIGHT - 32) {
        creature.vy *= -1;
        creature.y = Math.max(2, Math.min(CANVAS_HEIGHT - 32, creature.y));
      }
    });

    eventBus.emit('entityMoved', {
      plants: this.plants,
      creatures: this.creatures,
    });
  }

  render(ctx: CanvasRenderingContext2D): void {
    this.sandGrains.forEach((grain) => {
      ctx.fillStyle = grain.color;
      ctx.fillRect(grain.x, grain.y, grain.width, grain.height);
    });

    this.plants.forEach((plant) => {
      this.renderPlant(ctx, plant);
    });

    this.creatures.forEach((creature) => {
      this.renderCreature(ctx, creature);
    });
  }

  private renderPlant(ctx: CanvasRenderingContext2D, plant: Plant): void {
    const pixelSize = plant.size / 4;
    const gradient = ctx.createLinearGradient(
      plant.x - plant.size / 2,
      plant.y - plant.size / 2,
      plant.x + plant.size / 2,
      plant.y + plant.size / 2
    );
    gradient.addColorStop(0, '#00AA44');
    gradient.addColorStop(1, '#00FFCC');

    for (let py = 0; py < 4; py++) {
      for (let px = 0; px < 4; px++) {
        const x = plant.x - plant.size / 2 + px * pixelSize;
        const y = plant.y - plant.size / 2 + py * pixelSize;
        ctx.fillStyle = gradient;
        ctx.fillRect(x, y, pixelSize - 0.5, pixelSize - 0.5);
      }
    }

    ctx.shadowColor = '#00FF88';
    ctx.shadowBlur = 10;
    ctx.fillStyle = 'rgba(0, 255, 136, 0.3)';
    ctx.fillRect(
      plant.x - plant.size / 2,
      plant.y - plant.size / 2,
      plant.size,
      plant.size
    );
    ctx.shadowBlur = 0;
  }

  private renderCreature(ctx: CanvasRenderingContext2D, creature: Creature): void {
    ctx.shadowColor = creature.color;
    ctx.shadowBlur = 8;
    ctx.fillStyle = creature.color;
    ctx.fillRect(creature.x, creature.y, 2, 2);
    ctx.shadowBlur = 0;
  }

  getPlants(): Plant[] {
    return this.plants;
  }

  getCreatures(): Creature[] {
    return this.creatures;
  }

  setCreaturePaused(creatureId: string, paused: boolean): void {
    const creature = this.creatures.find((c) => c.id === creatureId);
    if (creature) {
      creature.paused = paused;
    }
  }

  setAllCreaturesPaused(paused: boolean): void {
    this.creatures.forEach((c) => (c.paused = paused));
  }

  updateEntityPosition(entityType: 'plant' | 'creature', id: string, x: number, y: number): void {
    if (entityType === 'plant') {
      const plant = this.plants.find((p) => p.id === id);
      if (plant) {
        plant.x = Math.max(10, Math.min(CANVAS_WIDTH - 10, x));
        plant.y = Math.max(50, Math.min(CANVAS_HEIGHT - 40, y));
      }
    } else {
      const creature = this.creatures.find((c) => c.id === id);
      if (creature) {
        creature.x = Math.max(2, Math.min(CANVAS_WIDTH - 4, x));
        creature.y = Math.max(2, Math.min(CANVAS_HEIGHT - 32, y));
      }
    }
  }

  findEntityAtPosition(
    x: number,
    y: number
  ): { type: 'plant' | 'creature'; id: string } | null {
    for (const plant of this.plants) {
      if (
        x >= plant.x - plant.size / 2 - 5 &&
        x <= plant.x + plant.size / 2 + 5 &&
        y >= plant.y - plant.size / 2 - 5 &&
        y <= plant.y + plant.size / 2 + 5
      ) {
        return { type: 'plant', id: plant.id };
      }
    }

    for (const creature of this.creatures) {
      if (x >= creature.x - 5 && x <= creature.x + 7 && y >= creature.y - 5 && y <= creature.y + 7) {
        return { type: 'creature', id: creature.id };
      }
    }

    return null;
  }
}
