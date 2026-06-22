export type MaterialType = 'basic' | 'advanced' | 'potion';

export type FacilityType = 'alchemy_table' | 'material_rack' | 'furnace' | 'potion_rack' | 'mana_well';

export interface Material {
  id: string;
  name: string;
  type: MaterialType;
  color: string;
  icon: string;
  description: string;
}

export interface Facility {
  id: string;
  name: string;
  description: string;
  color: string;
}

export interface CraftTask {
  recipeId: string;
  startTime: number;
  endTime: number;
}

export interface FacilityInstance {
  id: string;
  type: FacilityType;
  x: number;
  y: number;
  craftQueue: CraftTask[];
  storage: Record<string, number>;
  config: Record<string, unknown>;
  currentCraft?: CraftTask;
  craftProgress: number;
  lastProductionTime?: number;
}

export interface CraftRecord {
  id: string;
  recipeId: string;
  inputs: Record<string, number>;
  output: { materialId: string; amount: number };
  completedAt: number;
  facilityType: FacilityType;
}

export interface InventoryItem {
  id: string;
  materialId: string;
  amount: number;
  obtainedAt: number;
}

export interface Statistics {
  facilityWorkTime: number;
  totalCrafts: number;
  totalPotions: number;
}

export interface Recipe {
  id: string;
  name: string;
  type: MaterialType;
  inputs: Record<string, number>;
  output: { materialId: string; amount: number };
  manaCost: number;
  craftTime: number;
}

export interface GameState {
  grid: FacilityInstance[];
  inventory: InventoryItem[];
  mana: number;
  maxMana: number;
  craftHistory: CraftRecord[];
  statistics: Statistics;
  timestamp: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}
