import type { BuildingData, BuildingTemperature, HeatLevel } from './BuildingModule';

export interface BuildingModule {
  loadBuildings(buildings: BuildingData[]): void;
  updateTemperatures(temps: BuildingTemperature[]): void;
  updateAnimations(deltaTime: number): void;
  handleClick(clientX: number, clientY: number, containerRect: DOMRect): boolean;
  setClickHandler(handler: (building: BuildingData, temperature: number) => void): void;
  applyFilter(level: 'all' | HeatLevel): void;
  getBuildingData(id: string): BuildingData | null;
  getBuildingTemperature(id: string): number;
  getSelectedBuildingId(): string | null;
}

export interface UIModuleCallbacks {
  onTimeChange: (time: number) => void;
  onFilterChange: (level: 'all' | HeatLevel) => void;
}

export interface BuildingHistory {
  id: string;
  hours: number[];
  temperatures: number[];
}

export interface ApiTemperatureResponse {
  time: number;
  buildings: BuildingTemperature[];
}

export interface ApiBuildingsResponse {
  buildings: BuildingData[];
}
