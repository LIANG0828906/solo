import { v4 as uuidv4 } from 'uuid';

export type BuildingType = 'miningStation' | 'warehouse' | 'turret';

export interface Building {
  id: string;
  type: BuildingType;
  level: number;
  x: number;
  y: number;
}

export interface Resources {
  gold: number;
  iron: number;
  crystal: number;
}

export interface BuildingConfig {
  type: BuildingType;
  name: string;
  description: string;
  baseCost: Resources;
  costMultiplier: number;
  maxLevel: number;
}

export const BUILDING_CONFIGS: Record<BuildingType, BuildingConfig> = {
  miningStation: {
    type: 'miningStation',
    name: '采矿站',
    description: '每提升1级增加10%采集速度',
    baseCost: { gold: 100, iron: 20, crystal: 0 },
    costMultiplier: 1.5,
    maxLevel: 10
  },
  warehouse: {
    type: 'warehouse',
    name: '仓库',
    description: '每级增加20格存储上限',
    baseCost: { gold: 50, iron: 0, crystal: 10 },
    costMultiplier: 1.4,
    maxLevel: 10
  },
  turret: {
    type: 'turret',
    name: '防御炮塔',
    description: '自动攻击靠近的陨石，每级增加5点伤害',
    baseCost: { gold: 150, iron: 0, crystal: 30 },
    costMultiplier: 1.6,
    maxLevel: 10
  }
};

export class BuildingManager {
  private buildings: Building[] = [];
  private resources: Resources = { gold: 200, iron: 50, crystal: 30 };
  private storageCapacity: number = 50;
  private currentStorage: number = 0;
  private miningSpeedBonus: number = 1;
  private turretDamage: number = 0;
  private onResourcesChanged: ((resources: Resources) => void) | null = null;
  private baseX: number;
  private baseY: number;

  constructor(baseX: number = 400, baseY: number = 400) {
    this.baseX = baseX;
    this.baseY = baseY;
  }

  getResources(): Resources {
    return { ...this.resources };
  }

  getBuildings(): Building[] {
    return [...this.buildings];
  }

  getBuildingCount(type: BuildingType): number {
    return this.buildings.filter(b => b.type === type).length;
  }

  getMaxLevel(type: BuildingType): number {
    const building = this.buildings.find(b => b.type === type);
    return building ? building.level : 0;
  }

  getMiningSpeedBonus(): number {
    return this.miningSpeedBonus;
  }

  getTurretDamage(): number {
    return this.turretDamage;
  }

  getStorageCapacity(): number {
    return this.storageCapacity;
  }

  setOnResourcesChanged(callback: (resources: Resources) => void): void {
    this.onResourcesChanged = callback;
  }

  getBuildCost(type: BuildingType, currentLevel: number): Resources {
    const config = BUILDING_CONFIGS[type];
    const multiplier = Math.pow(config.costMultiplier, currentLevel);
    return {
      gold: Math.floor(config.baseCost.gold * multiplier),
      iron: Math.floor(config.baseCost.iron * multiplier),
      crystal: Math.floor(config.baseCost.crystal * multiplier)
    };
  }

  canAfford(cost: Resources): boolean {
    return (
      this.resources.gold >= cost.gold &&
      this.resources.iron >= cost.iron &&
      this.resources.crystal >= cost.crystal
    );
  }

  build(type: BuildingType): boolean {
    const existing = this.buildings.find(b => b.type === type);
    
    if (existing) {
      return this.upgrade(existing.id);
    }

    const config = BUILDING_CONFIGS[type];
    const cost = this.getBuildCost(type, 0);

    if (!this.canAfford(cost)) {
      return false;
    }

    this.resources.gold -= cost.gold;
    this.resources.iron -= cost.iron;
    this.resources.crystal -= cost.crystal;

    const building: Building = {
      id: uuidv4(),
      type,
      level: 1,
      x: this.baseX + (Math.random() - 0.5) * 60,
      y: this.baseY + (Math.random() - 0.5) * 60
    };

    this.buildings.push(building);
    this.applyBuildingEffects(type, 1);
    this.notifyResourcesChanged();
    return true;
  }

  upgrade(id: string): boolean {
    const building = this.buildings.find(b => b.id === id);
    if (!building) return false;

    const config = BUILDING_CONFIGS[building.type];
    if (building.level >= config.maxLevel) return false;

    const cost = this.getBuildCost(building.type, building.level);
    if (!this.canAfford(cost)) return false;

    this.resources.gold -= cost.gold;
    this.resources.iron -= cost.iron;
    this.resources.crystal -= cost.crystal;

    const oldLevel = building.level;
    building.level++;
    this.applyBuildingEffects(building.type, building.level - oldLevel);
    this.notifyResourcesChanged();
    return true;
  }

  private applyBuildingEffects(type: BuildingType, levelIncrease: number): void {
    switch (type) {
      case 'miningStation':
        this.miningSpeedBonus = 1 + this.getMaxLevel('miningStation') * 0.1;
        break;
      case 'warehouse':
        this.storageCapacity = 50 + this.getMaxLevel('warehouse') * 20;
        break;
      case 'turret':
        this.turretDamage = this.getMaxLevel('turret') * 5;
        break;
    }
  }

  addResources(resources: Resources): void {
    const totalToAdd = resources.gold + resources.iron + resources.crystal;
    if (this.currentStorage + totalToAdd > this.storageCapacity) {
      // 部分添加
      const availableSpace = this.storageCapacity - this.currentStorage;
      const ratio = availableSpace / totalToAdd;
      this.resources.gold += Math.floor(resources.gold * ratio);
      this.resources.iron += Math.floor(resources.iron * ratio);
      this.resources.crystal += Math.floor(resources.crystal * ratio);
      this.currentStorage = this.storageCapacity;
    } else {
      this.resources.gold += resources.gold;
      this.resources.iron += resources.iron;
      this.resources.crystal += resources.crystal;
      this.currentStorage += totalToAdd;
    }
    this.notifyResourcesChanged();
  }

  spendResources(cost: Resources): boolean {
    if (!this.canAfford(cost)) return false;
    this.resources.gold -= cost.gold;
    this.resources.iron -= cost.iron;
    this.resources.crystal -= cost.crystal;
    this.currentStorage -= (cost.gold + cost.iron + cost.crystal);
    this.currentStorage = Math.max(0, this.currentStorage);
    this.notifyResourcesChanged();
    return true;
  }

  private notifyResourcesChanged(): void {
    if (this.onResourcesChanged) {
      this.onResourcesChanged({ ...this.resources });
    }
  }

  getTurretPositions(): { x: number; y: number; damage: number; range: number }[] {
    return this.buildings
      .filter(b => b.type === 'turret')
      .map(b => ({
        x: b.x,
        y: b.y,
        damage: 5 * b.level,
        range: 100
      }));
  }

  setState(state: { buildings: Building[]; resources: Resources; currentStorage: number }): void {
    this.buildings = state.buildings;
    this.resources = state.resources;
    this.currentStorage = state.currentStorage;
    
    // 重新计算效果
    this.miningSpeedBonus = 1 + this.getMaxLevel('miningStation') * 0.1;
    this.storageCapacity = 50 + this.getMaxLevel('warehouse') * 20;
    this.turretDamage = this.getMaxLevel('turret') * 5;
    
    this.notifyResourcesChanged();
  }

  getState(): { buildings: Building[]; resources: Resources; currentStorage: number; storageCapacity: number } {
    return {
      buildings: [...this.buildings],
      resources: { ...this.resources },
      currentStorage: this.currentStorage,
      storageCapacity: this.storageCapacity
    };
  }
}
