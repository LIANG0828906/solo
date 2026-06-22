export type BuildingType = 'oxygen_tower' | 'fuel_refinery' | 'habitat' | 'solar_panel' | 'mining_drill';

export interface Building {
  id: string;
  type: BuildingType;
  gridX: number;
  gridY: number;
  size: 2 | 3;
  production: {
    oxygen: number;
    energy: number;
    metal: number;
  };
  cost: {
    oxygen: number;
    energy: number;
    metal: number;
  };
}

export interface Resources {
  oxygen: number;
  energy: number;
  metal: number;
  oxygenMax: number;
  energyMax: number;
  metalMax: number;
}

export interface SandstormState {
  active: boolean;
  startTime: number;
  duration: number;
  multiplier: number;
}

export interface SaveData {
  id: string;
  buildings: Building[];
  resources: Resources;
  survivalDays: number;
  timestamp: number;
}

export interface LeaderboardEntry {
  rank?: number;
  playerName: string;
  survivalDays: number;
  submittedAt: number;
}

export interface BuildingConfig {
  type: BuildingType;
  name: string;
  icon: string;
  size: 2 | 3;
  color: string;
  production: {
    oxygen: number;
    energy: number;
    metal: number;
  };
  cost: {
    oxygen: number;
    energy: number;
    metal: number;
  };
}
