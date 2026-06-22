export interface SpeciesConfig {
  id: string;
  name: string;
  baseGrowthRate: number;
  maxHeight: number;
  canopyRadius: number;
  shadeTolerance: number;
  waterDemand: number;
  trunkColor: string;
  canopyColor: string;
}

export const SPECIES_LIST: SpeciesConfig[] = [
  {
    id: 'oak',
    name: '橡树',
    baseGrowthRate: 0.15,
    maxHeight: 25,
    canopyRadius: 6,
    shadeTolerance: 0.4,
    waterDemand: 0.7,
    trunkColor: '#5D4037',
    canopyColor: '#2E7D32',
  },
  {
    id: 'pine',
    name: '松树',
    baseGrowthRate: 0.2,
    maxHeight: 30,
    canopyRadius: 4,
    shadeTolerance: 0.3,
    waterDemand: 0.5,
    trunkColor: '#4E342E',
    canopyColor: '#1B5E20',
  },
  {
    id: 'maple',
    name: '枫树',
    baseGrowthRate: 0.18,
    maxHeight: 20,
    canopyRadius: 5,
    shadeTolerance: 0.6,
    waterDemand: 0.8,
    trunkColor: '#6D4C41',
    canopyColor: '#388E3C',
  },
  {
    id: 'birch',
    name: '白桦',
    baseGrowthRate: 0.25,
    maxHeight: 18,
    canopyRadius: 4,
    shadeTolerance: 0.2,
    waterDemand: 0.6,
    trunkColor: '#ECEFF1',
    canopyColor: '#66BB6A',
  },
  {
    id: 'redwood',
    name: '红杉',
    baseGrowthRate: 0.12,
    maxHeight: 40,
    canopyRadius: 7,
    shadeTolerance: 0.5,
    waterDemand: 0.9,
    trunkColor: '#795548',
    canopyColor: '#2E7D32',
  },
];

export function getSpeciesById(id: string): SpeciesConfig | undefined {
  return SPECIES_LIST.find((s) => s.id === id);
}

export function getRandomSpecies(): SpeciesConfig {
  const index = Math.floor(Math.random() * SPECIES_LIST.length);
  return SPECIES_LIST[index];
}
