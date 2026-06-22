export type PlantSpecies = 'sunflower' | 'cactus' | 'dandelion';

export type GrowthStage = 'seed' | 'sprout' | 'seedling' | 'mature' | 'flowering';

export type WeatherType = 'sunny' | 'cloudy' | 'rain' | 'thunderstorm' | 'drought';

export type SelectedTool = 'none' | PlantSpecies | 'irrigator';

export interface Position {
  x: number;
  y: number;
}

export interface Plant {
  id: string;
  species: PlantSpecies;
  stage: GrowthStage;
  stageProgress: number;
  position: Position;
  health: number;
  water: number;
  lightSatisfaction: 1 | 2 | 3 | 4 | 5;
  isShaded: boolean;
  isFertilized: boolean;
  isDormant: boolean;
  plantTime: number;
  lastWaterTime: number;
  stageDuration: number;
  swayPhase: number;
}

export interface AutoIrrigator {
  id: string;
  position: Position;
  radius: number;
  lastWaterTime: number;
}

export type ParticleType = 'harvest' | 'ripple' | 'raindrop' | 'cloud' | 'lightning';

export interface Particle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
  type: ParticleType;
  rotation?: number;
  rotationSpeed?: number;
}

export interface SpeciesConfig {
  name: string;
  color: string;
  waterNeedPerSec: number;
  optimalLight: number;
  optimalTemp: number;
  stageDurations: Record<GrowthStage, [number, number]>;
  harvestReward: Partial<Record<PlantSpecies, number>>;
  unlockRequirement: { species: PlantSpecies; count: number } | null;
  emoji: string;
}

export interface WeatherConfig {
  name: string;
  lightMultiplier: number;
  humidityChangePerSec: number;
  precipitation: 'none' | 'light' | 'heavy';
  duration: [number, number];
  icon: string;
  tempMultiplier: number;
}

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface ScreenShake {
  intensity: number;
  duration: number;
  startTime: number;
}

export interface GameState {
  plants: Plant[];
  irrigators: AutoIrrigator[];
  particles: Particle[];
  seedInventory: Record<PlantSpecies, number>;
  totalHarvested: Record<PlantSpecies, number>;
  unlockedSpecies: PlantSpecies[];
  currentWeather: WeatherType;
  weatherDuration: number;
  weatherProgress: number;
  dayNightCycle: number;
  brightness: number;
  colorTemp: { r: number; g: number; b: number };
  soilMoisture: number;
  selectedTool: SelectedTool;
  screenShake: ScreenShake | null;
  showAutoIrrigationHint: boolean;
  autoIrrigationHintShown: boolean;
  pendingUnlock: PlantSpecies | null;
  lastSaveTime: number;
  lastTickTime: number;
  dirtyRects: Rect[];
}

export interface EnvironmentSnapshot {
  brightness: number;
  colorTemp: { r: number; g: number; b: number };
  lightIntensity: number;
  soilMoisture: number;
  currentWeather: WeatherType;
  precipitation: 'none' | 'light' | 'heavy';
  tempMultiplier: number;
}

export const GROWTH_STAGES: GrowthStage[] = ['seed', 'sprout', 'seedling', 'mature', 'flowering'];
