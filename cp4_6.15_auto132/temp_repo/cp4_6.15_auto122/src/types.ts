export interface SamplePoint {
  lat: number;
  lng: number;
  depth: number;
  abundance: number;
  season: 'spring' | 'summer' | 'autumn' | 'winter';
}

export interface Species {
  id: string;
  name: string;
  latinName: string;
  category: 'shallow' | 'mid' | 'deep';
  preferredTemp: [number, number];
  preferredSalinity: [number, number];
  baseDepth: number;
  depthRange: [number, number];
  color: string;
  samplePoints: SamplePoint[];
}

export interface EnvParams {
  temperature: number;
  salinity: number;
  lightPenetration: number;
}

export interface RenderableSpecies {
  speciesId: string;
  position: [number, number, number];
  scale: number;
  opacity: number;
  color: string;
  name: string;
  latinName: string;
  depth: number;
  abundance: number;
  category: 'shallow' | 'mid' | 'deep';
  preferredTemp: [number, number];
}

export interface MonthForecast {
  month: number;
  speciesData: RenderableSpecies[];
  summary: string;
}

export interface SpeciesTreeLayer {
  depth: string;
  label: string;
  species: Species[];
}

export type EcoRegionDescription = {
  label: string;
  description: string;
};
