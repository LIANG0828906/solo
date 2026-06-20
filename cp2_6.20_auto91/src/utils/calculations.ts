import type { CreatureStats, EnvironmentParams, EggConfig } from '../types';
import { EGG_CONFIGS } from './constants';

export function calculateSuccessRate(
  eggType: string | null,
  environment: EnvironmentParams
): number {
  if (!eggType) return 0;

  const config = EGG_CONFIGS[eggType];
  if (!config) return 0;

  let rate = config.baseSuccessRate;

  rate += calculateTemperatureBonus(environment.temperature, config);
  rate += calculateHumidityBonus(environment.humidity, config);
  rate += calculateAuraBonus(environment.aura, config);

  return Math.max(0, Math.min(100, Math.round(rate)));
}

function calculateTemperatureBonus(temp: number, config: EggConfig): number {
  const { min, max } = config.optimalTemp;
  const mid = (min + max) / 2;

  if (temp >= min && temp <= max) {
    const distanceFromMid = Math.abs(temp - mid);
    const range = (max - min) / 2;
    return Math.round(25 * (1 - distanceFromMid / range));
  } else {
    const distance = temp < min ? min - temp : temp - max;
    return Math.round(-distance * 0.8);
  }
}

function calculateHumidityBonus(humidity: number, config: EggConfig): number {
  const { min, max } = config.optimalHumidity;
  const mid = (min + max) / 2;

  if (humidity >= min && humidity <= max) {
    const distanceFromMid = Math.abs(humidity - mid);
    const range = (max - min) / 2;
    return Math.round(15 * (1 - distanceFromMid / range));
  } else {
    const distance = humidity < min ? min - humidity : humidity - max;
    return Math.round(-distance * 0.5);
  }
}

function calculateAuraBonus(aura: number, config: EggConfig): number {
  const { min, max } = config.optimalAura;
  const mid = (min + max) / 2;

  if (aura >= min && aura <= max) {
    const distanceFromMid = Math.abs(aura - mid);
    const range = (max - min) / 2;
    return Math.round(20 * (1 - distanceFromMid / range));
  } else {
    const distance = aura < min ? min - aura : aura - max;
    return Math.round(-distance * 0.3);
  }
}

export function getSuccessRateColor(rate: number): string {
  if (rate > 80) return '#22c55e';
  if (rate >= 50) return '#eab308';
  return '#ef4444';
}

export function generateCreatureStats(
  eggType: string,
  successRate: number
): CreatureStats {
  const qualityMultiplier = 0.5 + successRate / 100;
  const baseStats = getBaseStats(eggType);

  return {
    health: Math.round(clamp(baseStats.health * qualityMultiplier * randomFactor(), 0, 100)),
    attack: Math.round(clamp(baseStats.attack * qualityMultiplier * randomFactor(), 0, 100)),
    defense: Math.round(clamp(baseStats.defense * qualityMultiplier * randomFactor(), 0, 100)),
    speed: Math.round(clamp(baseStats.speed * qualityMultiplier * randomFactor(), 0, 100)),
    spirit: Math.round(clamp(baseStats.spirit * qualityMultiplier * randomFactor(), 0, 100)),
    potential: Math.round(clamp(baseStats.potential * qualityMultiplier * randomFactor(), 0, 100)),
  };
}

function getBaseStats(eggType: string): CreatureStats {
  const baseStatsMap: Record<string, CreatureStats> = {
    phoenix: { health: 60, attack: 85, defense: 45, speed: 90, spirit: 80, potential: 75 },
    dragon: { health: 80, attack: 80, defense: 70, speed: 50, spirit: 85, potential: 80 },
    wolf: { health: 55, attack: 75, defense: 50, speed: 95, spirit: 70, potential: 70 },
    tortoise: { health: 90, attack: 50, defense: 95, speed: 30, spirit: 60, potential: 65 },
  };
  return baseStatsMap[eggType] || baseStatsMap.phoenix;
}

function randomFactor(): number {
  return 0.9 + Math.random() * 0.2;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function calculateLevelProgress(
  currentLevel: number,
  experience: number
): { level: number; experience: number; progress: number } {
  const expForNextLevel = calculateExpForLevel(currentLevel + 1);
  const expForCurrentLevel = calculateExpForLevel(currentLevel);
  const progress = ((experience - expForCurrentLevel) / (expForNextLevel - expForCurrentLevel)) * 100;

  let newLevel = currentLevel;
  let remainingExp = experience;

  while (remainingExp >= calculateExpForLevel(newLevel + 1)) {
    newLevel++;
  }

  return {
    level: newLevel,
    experience: remainingExp,
    progress: Math.max(0, Math.min(100, progress)),
  };
}

function calculateExpForLevel(level: number): number {
  return Math.floor(100 * Math.pow(1.5, level - 1));
}

export function getElementParticleColors(element: string): string[] {
  const colorMap: Record<string, string[]> = {
    fire: ['#ff4500', '#ff6347', '#ffa500', '#ffd700'],
    ice: ['#1e90ff', '#00bfff', '#87ceeb', '#ffffff'],
    thunder: ['#9932cc', '#ba55d3', '#ffff00', '#ffffff'],
    earth: ['#228b22', '#32cd32', '#8b4513', '#daa520'],
  };
  return colorMap[element] || colorMap.fire;
}
