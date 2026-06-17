import type { Plant, WeatherType, GrowthStage } from '../types';
import { PLANT_SPECIES } from '../api/weatherApi';

const WEATHER_GROWTH_MODIFIERS: Record<WeatherType, number> = {
  sunny: 1.0,
  cloudy: 0.9,
  overcast: 0.8,
  rainy: 1.2,
  snowy: 0.7
};

const STAGE_THRESHOLDS = {
  seedling: 0,
  growing: 33,
  flowering: 66
};

export function calculateGrowthStage(growth: number): GrowthStage {
  if (growth >= STAGE_THRESHOLDS.flowering) return 'flowering';
  if (growth >= STAGE_THRESHOLDS.growing) return 'growing';
  return 'seedling';
}

export function calculateHealth(plant: Plant): number {
  const species = PLANT_SPECIES[plant.species];
  const now = Date.now();
  
  const hoursSinceWatered = (now - plant.lastWatered) / (1000 * 60 * 60);
  const hoursSinceFertilized = (now - plant.lastFertilized) / (1000 * 60 * 60);
  
  const waterScore = Math.max(0, 100 - hoursSinceWatered * species.waterNeed * 15);
  const nutrientScore = Math.max(0, 100 - hoursSinceFertilized * species.nutrientNeed * 12);
  const humidityScore = plant.humidity;
  const nutrientValueScore = plant.nutrients;
  
  const health = (waterScore * 0.3 + nutrientScore * 0.2 + humidityScore * 0.25 + nutrientValueScore * 0.25);
  
  return Math.min(100, Math.max(0, Math.round(health)));
}

export function calculateGrowthIncrease(
  plant: Plant,
  weather: WeatherType,
  deltaTimeMs: number
): number {
  const species = PLANT_SPECIES[plant.species];
  const hours = deltaTimeMs / (1000 * 60 * 60);
  
  const weatherModifier = WEATHER_GROWTH_MODIFIERS[weather];
  const preferenceBonus = species.weatherPreference.includes(weather) ? 1.15 : 1.0;
  
  const humidityFactor = plant.humidity / 100;
  const nutrientFactor = plant.nutrients / 100;
  const healthFactor = calculateHealth(plant) / 100;
  
  const baseGrowth = species.baseGrowthRate * hours * 10;
  const growthIncrease = baseGrowth 
    * weatherModifier 
    * preferenceBonus 
    * (0.3 + 0.35 * humidityFactor + 0.35 * nutrientFactor)
    * (0.5 + 0.5 * healthFactor);
  
  return Math.max(0, growthIncrease);
}

export function waterPlant(plant: Plant): Plant {
  const humidityIncrease = Math.min(100 - plant.humidity, 35);
  return {
    ...plant,
    humidity: plant.humidity + humidityIncrease,
    lastWatered: Date.now()
  };
}

export function fertilizePlant(plant: Plant): Plant {
  const nutrientIncrease = Math.min(100 - plant.nutrients, 30);
  return {
    ...plant,
    nutrients: plant.nutrients + nutrientIncrease,
    lastFertilized: Date.now()
  };
}

export function decayPlantStats(plant: Plant, deltaTimeMs: number): Plant {
  const hours = deltaTimeMs / (1000 * 60 * 60);
  const species = PLANT_SPECIES[plant.species];
  
  const humidityDecay = hours * species.waterNeed * 8;
  const nutrientDecay = hours * species.nutrientNeed * 5;
  
  return {
    ...plant,
    humidity: Math.max(0, plant.humidity - humidityDecay),
    nutrients: Math.max(0, plant.nutrients - nutrientDecay)
  };
}

export function getHealthColor(health: number): string {
  const hue = (health / 100) * 120;
  return `hsl(${hue}, 70%, 55%)`;
}

export function getWeatherPlantColorModifier(weather: WeatherType): { saturation: number; lightness: number } {
  switch (weather) {
    case 'sunny':
      return { saturation: 1.1, lightness: 1.05 };
    case 'rainy':
      return { saturation: 0.95, lightness: 0.95 };
    case 'snowy':
      return { saturation: 0.85, lightness: 1.1 };
    case 'cloudy':
      return { saturation: 0.95, lightness: 1.0 };
    case 'overcast':
      return { saturation: 0.9, lightness: 0.95 };
    default:
      return { saturation: 1, lightness: 1 };
  }
}
