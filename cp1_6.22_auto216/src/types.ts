export enum SpeciesType {
  PLANT = 'plant',
  HERBIVORE = 'herbivore',
  CARNIVORE = 'carnivore',
}

export interface SpeciesParams {
  initialCount: number;
  moveSpeed: number;
  reproductionThreshold: number;
  predationEfficiency: number;
}

export interface AllSpeciesParams {
  [SpeciesType.PLANT]: SpeciesParams;
  [SpeciesType.HERBIVORE]: SpeciesParams;
  [SpeciesType.CARNIVORE]: SpeciesParams;
}

export interface Organism {
  id: number;
  species: SpeciesType;
  x: number;
  y: number;
  energy: number;
  age: number;
  dying?: boolean;
  dyingStart?: number;
  flashing?: boolean;
  flashStart?: number;
}

export interface Snapshot {
  generation: number;
  organisms: Organism[];
  counts: {
    [SpeciesType.PLANT]: number;
    [SpeciesType.HERBIVORE]: number;
    [SpeciesType.CARNIVORE]: number;
  };
  avgEnergy: {
    [SpeciesType.PLANT]: number;
    [SpeciesType.HERBIVORE]: number;
    [SpeciesType.CARNIVORE]: number;
  };
}

export interface HistoryPoint {
  generation: number;
  plant: number;
  herbivore: number;
  carnivore: number;
}
