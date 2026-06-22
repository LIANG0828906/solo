export enum SpeciesType {
  PLANT = 'plant',
  HERBIVORE = 'herbivore',
  CARNIVORE = 'carnivore',
}

export interface EnvironmentParams {
  temperature: number;
  humidity: number;
  light: number;
}

export interface Species {
  id: string;
  type: SpeciesType;
  x: number;
  y: number;
  population: number;
  isExtinct: boolean;
  extinctionTimer: number;
  lastPopulation: number;
  animationTimer: number;
}

export interface PopulationHistory {
  generation: number;
  plants: number;
  herbivores: number;
  carnivores: number;
}

export interface GenerationState {
  generation: number;
  species: Species[];
  environment: EnvironmentParams;
  populationHistory: PopulationHistory[];
}

export type EventHandler<T = unknown> = (data: T) => void;

export interface EventMap {
  'env:change': EnvironmentParams;
  'species:place': { type: SpeciesType; x: number; y: number };
  'species:remove': { id: string };
  'generation:update': GenerationState;
}
