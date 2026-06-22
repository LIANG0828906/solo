export enum PlantType {
  Cactus = 'cactus',
  Fern = 'fern',
  Orchid = 'orchid',
}

export enum GrowthStage {
  Seed = 0,
  Seedling = 1,
  Young = 2,
  Mature = 3,
}

export enum FlowerColor {
  Pink = '#FF69B4',
  Red = '#FF4444',
  White = '#FFFFFF',
  Purple = '#9B59B6',
}

export interface FlowerData {
  color: FlowerColor;
  petalCount: number;
  bloomProgress: number;
  offsetX: number;
  offsetY: number;
}

export interface PlantData {
  id: string;
  type: PlantType;
  gridX: number;
  gridY: number;
  growthStage: GrowthStage;
  health: number;
  growthProgress: number;
  flowers: FlowerData[];
  isWatered: boolean;
  waterParticleTimer: number;
}

export interface ClimateParams {
  temperature: number;
  humidity: number;
  lightIntensity: number;
}

export type WeatherType = 'sunny' | 'cloudy' | 'rainy';

interface PlantOptimalRange {
  temperature: [number, number];
  humidity: [number, number];
  lightIntensity: [number, number];
  weights: { temperature: number; humidity: number; lightIntensity: number };
}

const PLANT_RANGES: Record<PlantType, PlantOptimalRange> = {
  [PlantType.Cactus]: {
    temperature: [20, 40],
    humidity: [10, 30],
    lightIntensity: [5000, 10000],
    weights: { temperature: 0.3, humidity: 0.3, lightIntensity: 0.4 },
  },
  [PlantType.Fern]: {
    temperature: [15, 28],
    humidity: [50, 80],
    lightIntensity: [1000, 4000],
    weights: { temperature: 0.3, humidity: 0.4, lightIntensity: 0.3 },
  },
  [PlantType.Orchid]: {
    temperature: [18, 30],
    humidity: [60, 90],
    lightIntensity: [2000, 6000],
    weights: { temperature: 0.3, humidity: 0.4, lightIntensity: 0.3 },
  },
};

const FLOWER_COLORS = [
  FlowerColor.Pink,
  FlowerColor.Red,
  FlowerColor.White,
  FlowerColor.Purple,
];

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function paramDeviation(value: number, range: [number, number]): number {
  if (value >= range[0] && value <= range[1]) return 0;
  if (value < range[0]) return (range[0] - value) / Math.max(Math.abs(range[0]), 1);
  return (value - range[1]) / Math.max(Math.abs(range[1]), 1);
}

export function calculateHealth(plantType: PlantType, climate: ClimateParams): number {
  const range = PLANT_RANGES[plantType];
  const tempDev = paramDeviation(climate.temperature, range.temperature);
  const humidDev = paramDeviation(climate.humidity, range.humidity);
  const lightDev = paramDeviation(climate.lightIntensity, range.lightIntensity);
  const weightedDeviation =
    tempDev * range.weights.temperature +
    humidDev * range.weights.humidity +
    lightDev * range.weights.lightIntensity;
  return clamp(100 - weightedDeviation * 100, 0, 100);
}

export function getGrowthSpeed(plantType: PlantType, climate: ClimateParams): number {
  const health = calculateHealth(plantType, climate);
  if (health >= 70) return 1.5;
  if (health >= 40) return 0.5;
  return 0.1;
}

export function updatePlant(
  plant: PlantData,
  climate: ClimateParams,
  deltaTime: number
): PlantData {
  const health = calculateHealth(plant.type, climate);
  const growthSpeed = getGrowthSpeed(plant.type, climate);

  let growthProgress = plant.growthProgress + growthSpeed * deltaTime * 0.01;
  let growthStage = plant.growthStage;
  let flowers = plant.flowers.map((f) => ({ ...f }));

  if (growthStage === GrowthStage.Seed && growthProgress >= 25) {
    growthStage = GrowthStage.Seedling;
  } else if (growthStage === GrowthStage.Seedling && growthProgress >= 50) {
    growthStage = GrowthStage.Young;
  } else if (growthStage === GrowthStage.Young && growthProgress >= 75) {
    growthStage = GrowthStage.Mature;
  }

  growthProgress = Math.min(growthProgress, 100);

  if (growthStage === GrowthStage.Mature && health >= 70 && flowers.length === 0) {
    const numFlowers = Math.floor(Math.random() * 3) + 1;
    flowers = Array.from({ length: numFlowers }, () => ({
      color: FLOWER_COLORS[Math.floor(Math.random() * FLOWER_COLORS.length)],
      petalCount: 5,
      bloomProgress: 0,
      offsetX: (Math.random() - 0.5) * 30,
      offsetY: -20 - Math.random() * 20,
    }));
  }

  flowers = flowers.map((f) => ({
    ...f,
    bloomProgress: Math.min(f.bloomProgress + deltaTime * 0.001, 1),
  }));

  const waterParticleTimer = plant.isWatered
    ? Math.max(0, plant.waterParticleTimer - deltaTime)
    : 0;
  const isWatered = waterParticleTimer > 0;

  return {
    ...plant,
    health,
    growthProgress,
    growthStage,
    flowers,
    isWatered,
    waterParticleTimer,
  };
}

export function createPlant(type: PlantType, gridX: number, gridY: number): PlantData {
  return {
    id: crypto.randomUUID(),
    type,
    gridX,
    gridY,
    growthStage: GrowthStage.Seed,
    health: 100,
    growthProgress: 0,
    flowers: [],
    isWatered: false,
    waterParticleTimer: 0,
  };
}

export function waterPlant(plant: PlantData): PlantData {
  return {
    ...plant,
    isWatered: true,
    waterParticleTimer: 2000,
  };
}

export function determineWeather(climate: ClimateParams): WeatherType {
  if (climate.humidity > 70) return 'rainy';
  if (climate.lightIntensity > 5000 && climate.humidity < 50) return 'sunny';
  return 'cloudy';
}

export function getPlantColor(plantType: PlantType): string {
  switch (plantType) {
    case PlantType.Cactus:
      return '#2E7D32';
    case PlantType.Fern:
      return '#4CAF50';
    case PlantType.Orchid:
      return '#66BB6A';
  }
}

export function getHealthColor(health: number): string {
  if (health >= 70) return '#4CAF50';
  if (health >= 40) {
    const t = (health - 40) / 30;
    const r = Math.round(200 * (1 - t) + 76 * t);
    const g = Math.round(180 * (1 - t) + 175 * t);
    const b = Math.round(20 * (1 - t) + 80 * t);
    return `rgb(${r},${g},${b})`;
  }
  const t = health / 40;
  const r = Math.round(139 * (1 - t) + 200 * t);
  const g = Math.round(90 * (1 - t) + 180 * t);
  const b = Math.round(20 * (1 - t) + 20 * t);
  return `rgb(${r},${g},${b})`;
}
