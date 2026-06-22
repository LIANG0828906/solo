import {
  PlantType,
  GrowthParams,
  PlantInstance,
  PLANT_INFO,
  PlantCategory,
} from './PlantTypes';

export class EventEmitter {
  private events: Record<string, Function[]> = {};

  on(event: string, listener: Function): void {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(listener);
  }

  off(event: string, listener: Function): void {
    if (!this.events[event]) return;
    this.events[event] = this.events[event].filter((l) => l !== listener);
  }

  emit(event: string, ...args: any[]): void {
    if (!this.events[event]) return;
    this.events[event].forEach((listener) => listener(...args));
  }
}

export class PlantEngine extends EventEmitter {
  private plantConfigs: Record<PlantType, GrowthParams>;
  private plants: PlantInstance[] = [];
  private gameStartTime: number = 0;

  constructor(initialConfigs?: Record<PlantType, GrowthParams>) {
    super();
    this.plantConfigs = initialConfigs || this.createDefaultConfigs();
  }

  private createDefaultConfigs(): Record<PlantType, GrowthParams> {
    const configs = {} as Record<PlantType, GrowthParams>;
    (Object.keys(PLANT_INFO) as PlantType[]).forEach((type) => {
      configs[type] = { ...PLANT_INFO[type].defaultParams };
    });
    return configs;
  }

  getPlantConfig(type: PlantType): GrowthParams {
    return { ...this.plantConfigs[type] };
  }

  setPlantConfig(type: PlantType, params: Partial<GrowthParams>): void {
    const oldConfig = this.plantConfigs[type];
    const newConfig = { ...oldConfig, ...params };
    this.plantConfigs[type] = newConfig;

    (Object.keys(params) as (keyof GrowthParams)[]).forEach((paramName) => {
      const oldValue = oldConfig[paramName];
      const newValue = newConfig[paramName];
      if (oldValue !== newValue) {
        this.emit('paramChange', {
          plantType: type,
          paramName,
          oldValue,
          newValue,
        });
      }
    });

    this.plants.forEach((plant) => {
      if (plant.type === type) {
        plant.params = { ...newConfig };
        const { attack, range } = this.calculateCurrentAttributes(
          plant.params,
          plant.growthProgress
        );
        plant.currentAttack = attack;
        plant.currentRange = range;
      }
    });

    this.emit('configsChanged', this.plantConfigs);
  }

  setAllConfigs(configs: Record<PlantType, GrowthParams>): void {
    this.plantConfigs = { ...configs };
    this.emit('configsChanged', this.plantConfigs);
  }

  getAllConfigs(): Record<PlantType, GrowthParams> {
    const result = {} as Record<PlantType, GrowthParams>;
    (Object.keys(this.plantConfigs) as PlantType[]).forEach((type) => {
      result[type] = { ...this.plantConfigs[type] };
    });
    return result;
  }

  createPlant(
    type: PlantType,
    gridX: number,
    gridY: number,
    playerId?: number
  ): PlantInstance {
    const info = PLANT_INFO[type];
    const params = this.getPlantConfig(type);
    const id = Date.now().toString() + Math.random().toString(36).slice(2, 8);

    const plant: PlantInstance = {
      id,
      type,
      category: info.category as PlantCategory,
      gridX,
      gridY,
      params,
      currentAttack: params.initialAttack,
      currentRange: params.initialRange,
      growthProgress: 0,
      lastAttackTime: 0,
      attackCooldown: info.attackCooldown,
      playerId,
    };

    (plant as any).cooldown = 0;
    (plant as any).x = gridX * 50 + 25;
    (plant as any).y = gridY * 50 + 25;
    (plant as any).row = gridY;
    (plant as any).range = plant.currentRange;
    (plant as any).damage = plant.currentAttack;
    (plant as any).attackSpeed = plant.attackCooldown;
    (plant as any).playerSide = playerId ?? 1;

    this.plants.push(plant);
    this.emit('plantCreated', plant);
    return plant;
  }

  removePlant(id: string): void {
    const index = this.plants.findIndex((p) => p.id === id);
    if (index !== -1) {
      const removed = this.plants.splice(index, 1)[0];
      this.emit('plantRemoved', removed);
    }
  }

  getPlants(): PlantInstance[] {
    return [...this.plants];
  }

  getPlantByGrid(gridX: number, gridY: number, playerId?: number): PlantInstance | undefined {
    return this.plants.find(
      (p) => p.gridX === gridX && p.gridY === gridY && p.playerId === playerId
    );
  }

  updateGrowth(deltaTimeMs: number): void {
    this.plants.forEach((plant) => {
      if (plant.growthProgress < 1) {
        plant.growthProgress = Math.min(
          1,
          plant.growthProgress + deltaTimeMs / 1000 / plant.params.growthDuration
        );
      }
      const { attack, range } = this.calculateCurrentAttributes(
        plant.params,
        plant.growthProgress
      );
      plant.currentAttack = attack;
      plant.currentRange = range;
      (plant as any).range = range;
      (plant as any).damage = attack;
    });
  }

  calculateCurrentAttributes(
    params: GrowthParams,
    progress: number
  ): { attack: number; range: number } {
    const p = Math.min(1, Math.max(0, progress));
    return {
      attack: params.initialAttack + params.attackGrowth * p,
      range: params.initialRange + params.rangeGrowth * p,
    };
  }

  reset(): void {
    this.plants = [];
    this.gameStartTime = Date.now();
    this.emit('engineReset');
  }
}
