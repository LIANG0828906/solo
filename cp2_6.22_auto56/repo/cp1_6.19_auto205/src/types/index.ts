export type GasType = 'CO2' | 'CH4' | 'N2O';

export interface EmissionSource {
  id: string;
  name: string;
  gasType: GasType;
  annualEmission: number;
  contribution: number;
  sector: string;
}

export interface HeatPoint {
  id: string;
  sourceId: string;
  lat: number;
  lng: number;
  baseIntensity: number;
}

export interface SourceContribution {
  sourceId: string;
  contribution: number;
}

export interface TemperatureData {
  year: number;
  increment: number;
  sourceContributions: SourceContribution[];
}

export interface AppState {
  currentYear: number;
  selectedSourceId: string | null;
  emissionSources: EmissionSource[];
  heatPoints: HeatPoint[];
  temperatureData: Record<number, TemperatureData>;
  isResetting: boolean;
  setCurrentYear: (year: number) => void;
  setSelectedSourceId: (id: string | null) => void;
  setIsResetting: (value: boolean) => void;
  resetToBase: () => void;
}

export const GAS_COLORS: Record<GasType, string> = {
  CO2: '#E67E22',
  CH4: '#3498DB',
  N2O: '#27AE60',
};

export const GAS_NAMES: Record<GasType, string> = {
  CO2: '二氧化碳',
  CH4: '甲烷',
  N2O: '一氧化二氮',
};

export const BASE_YEAR = 2024;
export const END_YEAR = 2074;
export const MIN_ALPHA = 0.2;
export const MAX_ALPHA = 0.8;
export const ALPHA_PEAK_YEAR = 2050;
